/* Deterministic, local CSV comparison. No network, persistence or ERP writes. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LoteEngine = api;
}(typeof window === 'object' ? window : this, function () {
  'use strict';
  const LIMITS = Object.freeze({ bytes: 2 * 1024 * 1024, rows: 10000, quantity: 1000000 });
  const HEADERS = ['pedido', 'sku', 'quantidade', 'preco_unitario'];
  class InputError extends Error {
    constructor(code, line = 0) { super(code); this.name = 'InputError'; this.code = code; this.line = line; }
  }
  function options(o = {}) {
    const delimiter = o.delimiter ?? ';', decimal = o.decimal ?? ',';
    if (![';', ','].includes(delimiter) || ![',', '.'].includes(decimal)) throw new InputError('OPTIONS');
    return { delimiter, decimal };
  }
  function parseCSV(text, delimiter = ';') {
    if (typeof text !== 'string') throw new InputError('TEXT');
    if (![';', ','].includes(delimiter)) throw new InputError('OPTIONS');
    if (new TextEncoder().encode(text).length > LIMITS.bytes) throw new InputError('SIZE');
    if (text.startsWith('\uFEFF')) text = text.slice(1);
    if (text.includes('\u0000')) throw new InputError('NUL');
    const records = []; let row = [], field = '', state = 'start', line = 1, startLine = 1, touched = false;
    function finishField() { row.push(field); field = ''; state = 'start'; }
    function finishRow() {
      finishField();
      // Only physically empty lines are ignored; a row of delimiters is not empty.
      if (touched) records.push({ cells: row, line: startLine });
      if (records.length > LIMITS.rows + 1) throw new InputError('ROWS', startLine);
      row = []; touched = false; startLine = line + 1;
    }
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c !== '\r' && c !== '\n') touched = true;
      if (state === 'quoted') {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else state = 'closed';
        } else if (c === '\r' || c === '\n') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          field += '\n'; line++;
        } else field += c;
        continue;
      }
      if (c === delimiter) { finishField(); continue; }
      if (c === '\r' || c === '\n') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        finishRow(); line++; continue;
      }
      if (state === 'closed') throw new InputError('AFTER_QUOTE', line);
      if (c === '"') {
        if (state !== 'start') throw new InputError('QUOTE', line);
        state = 'quoted';
      } else { field += c; state = 'plain'; }
    }
    if (state === 'quoted') throw new InputError('UNCLOSED_QUOTE', startLine);
    if (row.length || field !== '' || state === 'closed') finishRow();
    if (!records.length) throw new InputError('EMPTY');
    return records;
  }
  function cents(value, decimal) {
    const pattern = decimal === ',' ? /^\d+(?:,\d{1,2})?$/ : /^\d+(?:\.\d{1,2})?$/;
    if (!pattern.test(value) || value.length > 16) throw new InputError('PRICE');
    const [whole, fraction = ''] = value.split(decimal);
    const n = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
    if (n > 999999999999n) throw new InputError('PRICE_RANGE');
    return n;
  }
  function read(text, o, side) {
    const records = parseCSV(text, o.delimiter), header = records.shift();
    const names = header.cells.map(x => x.trim());
    if (names.some(x => !x) || new Set(names).size !== names.length || HEADERS.some(x => !names.includes(x))) throw new InputError('HEADERS', header.line);
    if (!records.length) throw new InputError('NO_ROWS', header.line);
    const index = Object.fromEntries(HEADERS.map(x => [x, names.indexOf(x)]));
    const map = new Map(), seen = new Map(), blocked = new Map(), issues = [], lineRefs = new Map();
    for (const record of records) {
      const values = Object.fromEntries(HEADERS.map(x => [x, (record.cells[index[x]] ?? '').trim()]));
      const identityOK = [values.pedido, values.sku].every(x => x && x.length <= 120 && !/[\u0000-\u001F\u007F]/.test(x));
      const key = identityOK ? JSON.stringify([values.pedido, values.sku]) : null;
      const row = { ...values, line: record.line, key };
      if (key) { const refs = lineRefs.get(key) || []; refs.push(record.line); lineRefs.set(key, refs); }
      const codes = [];
      if (record.cells.length !== names.length) codes.push('COLUMNS');
      if (!identityOK) codes.push('IDENTITY');
      if (!/^\d+$/.test(values.quantidade) || values.quantidade.length > 7 || Number(values.quantidade) < 1 || Number(values.quantidade) > LIMITS.quantity) codes.push('QUANTITY');
      else row.quantity = Number(values.quantidade);
      try { row.unitCents = cents(values.preco_unitario, o.decimal); } catch (e) { codes.push(e.code); }
      if (key && seen.has(key)) {
        codes.push('DUPLICATE');
        blocked.set(key, { pedido: row.pedido, sku: row.sku, line: seen.get(key) });
        map.delete(key);
      }
      if (key && !seen.has(key)) seen.set(key, record.line);
      if (codes.length) {
        issues.push({ side, line: record.line, pedido: values.pedido, sku: values.sku, codes });
        if (key) { blocked.set(key, row); map.delete(key); }
      } else if (!blocked.has(key)) {
        row.totalCents = row.unitCents * BigInt(row.quantity); map.set(key, row);
      }
    }
    return { map, blocked, issues, lineRefs, records: records.length };
  }
  function serial(row) {
    return row ? { line: row.line, quantity: row.quantity, unitCents: String(row.unitCents), totalCents: String(row.totalCents) } : null;
  }
  function compare(expected, actual, opts) {
    const o = options(opts), a = read(expected, o, 'expected'), b = read(actual, o, 'actual');
    const rows = [], issues = [...a.issues, ...b.issues];
    const blocked = new Map([...a.blocked, ...b.blocked]);
    const keys = new Set([...a.map.keys(), ...b.map.keys(), ...blocked.keys()]);
    const counts = { matched: 0, changed: 0, missing: 0, unexpected: 0, blocked: 0 };
    for (const key of keys) {
      const x = a.map.get(key), y = b.map.get(key), z = blocked.get(key);
      const status = z ? 'blocked' : !x ? 'unexpected' : !y ? 'missing' : x.quantity === y.quantity && x.unitCents === y.unitCents ? 'matched' : 'changed';
      counts[status]++;
      const [pedido, sku] = JSON.parse(key);
      rows.push({ status, pedido, sku, expected: serial(x), actual: serial(y),
        blockedLines: z ? { expected: a.lineRefs.get(key) || [], actual: b.lineRefs.get(key) || [] } : null });
    }
    const order = { blocked: 0, changed: 1, missing: 2, unexpected: 3, matched: 4 };
    rows.sort((x, y) => order[x.status] - order[y.status] || (x.pedido < y.pedido ? -1 : x.pedido > y.pedido ? 1 : x.sku < y.sku ? -1 : x.sku > y.sku ? 1 : 0));
    const allClear = issues.length === 0 && counts.matched > 0 && counts.changed + counts.missing + counts.unexpected + counts.blocked === 0;
    const total = data => [...data.map.values()].reduce((sum, r) => sum + r.totalCents, 0n).toString();
    return { schema: 'lote-compare/v1', options: o, allClear,
      summary: { ...counts, issues: issues.length, expectedRecords: a.records, actualRecords: b.records,
        expectedValidTotalCents: total(a), actualValidTotalCents: total(b), totalsAreComplete: issues.length === 0 },
      rows, issues };
  }
  function money(value, decimal = ',') {
    const n = BigInt(value); return `${n / 100n}${decimal}${String(n % 100n).padStart(2, '0')}`;
  }
  function csvCell(value) {
    let s = value == null ? '' : String(value);
    if (/^[\s\uFEFF]*[=+@-]/u.test(s) || /^[\t\r\n]/u.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function reportCSV(report) {
    const header = ['status','pedido','sku','linha_pedidos','linha_importacao','quantidade_pedidos','quantidade_importacao','preco_pedidos_centavos','preco_importacao_centavos','codigos'];
    const lines = report.rows.map(r => [r.status,r.pedido,r.sku,r.blockedLines ? r.blockedLines.expected.join('|') : r.expected?.line,r.blockedLines ? r.blockedLines.actual.join('|') : r.actual?.line,r.expected?.quantity,r.actual?.quantity,r.expected?.unitCents,r.actual?.unitCents,'']);
    for (const r of report.issues) lines.push(['invalid_'+r.side,r.pedido,r.sku,r.side==='expected'?r.line:'',r.side==='actual'?r.line:'','','','','',r.codes.join('|')]);
    return '\uFEFF' + [header,...lines].map(r => r.map(csvCell).join(';')).join('\r\n') + '\r\n';
  }
  const DEMO = Object.freeze({
    expected: 'pedido;sku;quantidade;preco_unitario\n0001;ITEM-A;2;19,90\n0002;ITEM-B;1;150,00\n0003;ITEM-C;3;10,00\n0004;ITEM-D;2;12,50\n',
    actual: 'pedido;sku;quantidade;preco_unitario\n0001;ITEM-A;2;19,90\n0002;ITEM-B;1;149,99\n0004;ITEM-D;2;12,50\n0004;ITEM-D;2;12,50\n0005;ITEM-E;1;8,00\n'
  });
  return Object.freeze({ LIMITS, HEADERS, InputError, parseCSV, cents, compare, money, reportCSV, DEMO });
}));
