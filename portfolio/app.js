/* Gustavo Lima Verde portfolio: shared behaviour for pt.html, index.html and es.html.
   Local only: no form submission, no storage, no analytics, no AI runtime.
   The optional cloud-image probe is disabled; forms remain local-only. */
(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  var RAW_LANG = (root.getAttribute('lang') || 'en').toLowerCase();
  var LANG = RAW_LANG.indexOf('pt') === 0 ? 'pt' : (RAW_LANG === 'es' || RAW_LANG.indexOf('es-') === 0) ? 'es' : 'en';
  /* es-419 (Latin American Spanish): 3,100 · 86.4% · 0.784. Prices stay explicit US$/USD. */
  var LOCALE = LANG === 'pt' ? 'pt-BR' : LANG === 'es' ? 'es-419' : 'en-US';
  var $ = function (id) { return d.getElementById(id); };
  var fmt = function (v) { return Number(v).toLocaleString(LOCALE); };
  var pct = function (v) { return (v * 100).toLocaleString(LOCALE, { maximumFractionDigits: 1 }) + '%'; };
  var dec = function (v) { return Number(v).toLocaleString(LOCALE, { minimumFractionDigits: 3, maximumFractionDigits: 3 }); };
  var el = function (tag, cls, text) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- copy ---------- */
  var COPY = {
    pt: {
      price: function (v) { return 'US$ ' + fmt(v); },
      perMonth: '/mês',
      from: 'A partir de',
      limit: 'Limite',
      cta: 'Preparar pedido',
      ctaFor: 'Preparar pedido para: ',
      option: function (s) { return s.name + ' · a partir de US$ ' + fmt(s.starting_price_usd) + (s.id === 'maintenance' ? '/mês' : ''); },
      all: 'Todas',
      other: 'Outros serviços',
      groups: {
        fix: 'Diagnosticar e corrigir',
        connect: 'Integrar e automatizar',
        data: 'Dados e busca documental',
        keep: 'Testar, documentar, manter'
      },
      cats: {
        both: 'Certa nas duas versões',
        fixed: 'Corrigida pela melhoria',
        miss: 'Errada nas duas versões',
        regress: 'Piorou com a melhoria'
      },
      cell: function (i, q, cat) { return 'Pergunta ' + (i + 1) + ': ' + q + '. ' + cat + '.'; },
      expected: 'Fonte esperada',
      baseRank: 'Ordenação inicial',
      impRank: 'Ordenação após melhoria',
      first: 'Primeira fonte correta',
      yes: 'sim',
      no: 'não, erro residual',
      none: 'sem correspondência',
      excerpts: 'Trechos retornados',
      scenarios: {
        replay: function (r) { return 'TESTE VERIFICADO\n' + fmt(r.deliveries) + ' entregas → ' + fmt(r.unique_events) + ' eventos únicos\n' + r.parallel_receivers + ' receptores concorrentes\nEfeitos sem proteção: ' + fmt(r.naive_effects) + '\nEfeitos com proteção: ' + fmt(r.protected_effects) + '\nEfeitos duplicados com proteção: ' + r.protected_duplicates; },
        ack: function (r) { return 'TESTE DE REGRESSÃO APROVADO\nO provedor efetiva a solicitação; a confirmação é perdida.\nA nova tentativa usa a mesma chave de idempotência.\nO provedor sintético mantém um único efeito.\nConjunto de testes: ' + r.lost_acknowledgements + ' confirmações perdidas.'; },
        restart: function (r) { return 'TESTE DE REGRESSÃO APROVADO\nInbox e outbox persistem no SQLite.\nUma nova instância lê o envio pendente.\nO envio após reinício mantém um efeito único.\nConjunto de testes: ' + fmt(r.provider_effects) + ' efeitos únicos no provedor.'; },
        dead: function () { return 'TESTE DE REGRESSÃO APROVADO\nA falha permanente chega ao estado de envio retido.\nAs tentativas param após o limite configurado.\nA falha fica explícita; o teste não declara sucesso de envio.'; }
      },
      brief: function (v) {
        return 'PEDIDO DE PROJETO\nProjeto: ' + v.project + '\nServiço: ' + v.service + '\nPreço inicial: USD ' + v.price + '; escopo exato a combinar\nProblema / resultado esperado: ' + v.problem + '\nTecnologias / ambiente aprovado: ' + v.stack + '\n\nConfirme: amostras, saídas esperadas, critérios de aceitação, acesso e restrições de uso de IA, prazo e orçamento disponível. Sem credenciais no pedido.';
      },
      prepared: 'Preparado localmente. Nada foi enviado.',
      copied: 'Copiado. Cole na conversa da plataforma.',
      noClipboard: 'Área de transferência indisponível. Selecione o texto acima ou baixe o arquivo.',
      selected: 'Serviço selecionado no pedido: ',
      count: function (n, max) { return n + '/' + max; }
    },
    en: {
      price: function (v) { return '$' + fmt(v); },
      perMonth: '/month',
      from: 'From',
      limit: 'Boundary',
      cta: 'Start a brief',
      ctaFor: 'Start a brief for: ',
      option: function (s) { return s.name + ' · from $' + fmt(s.starting_price_usd) + (s.id === 'maintenance' ? '/month' : ''); },
      all: 'All',
      other: 'Other services',
      groups: {
        fix: 'Diagnose and repair',
        connect: 'Integrate and automate',
        data: 'Data and document retrieval',
        keep: 'Test, document, maintain'
      },
      cats: {
        both: 'Correct in both versions',
        fixed: 'Fixed by the improvement',
        miss: 'Wrong in both versions',
        regress: 'Worse after the improvement'
      },
      cell: function (i, q, cat) { return 'Question ' + (i + 1) + ': ' + q + '. ' + cat + '.'; },
      expected: 'Expected source',
      baseRank: 'Baseline ranking',
      impRank: 'Improved ranking',
      first: 'First source correct',
      yes: 'yes',
      no: 'no, retained error',
      none: 'no match',
      excerpts: 'Returned excerpts',
      scenarios: {
        replay: function (r) { return 'VERIFIED FIXTURE\n' + fmt(r.deliveries) + ' deliveries → ' + fmt(r.unique_events) + ' unique events\n' + r.parallel_receivers + ' concurrent receiver threads\nUnprotected effects: ' + fmt(r.naive_effects) + '\nProtected effects: ' + fmt(r.protected_effects) + '\nDuplicate protected effects: ' + r.protected_duplicates; },
        ack: function (r) { return 'REGRESSION CHECK PASSED\nThe provider commits; its acknowledgement is lost.\nRetry uses the same event idempotency key.\nThe synthetic provider retains one unique effect.\nBulk fixture: ' + r.lost_acknowledgements + ' lost acknowledgements.'; },
        restart: function (r) { return 'REGRESSION CHECK PASSED\nThe inbox and outbox persist in SQLite.\nA fresh Inbox instance reads the pending outbox.\nDispatch after restart retains one unique effect.\nBulk fixture: ' + fmt(r.provider_effects) + ' unique provider effects.'; },
        dead: function () { return 'REGRESSION CHECK PASSED\nA permanently failing provider reaches a dead-letter state.\nRetries stop after the configured attempt limit.\nThe failure remains explicit; no successful delivery is claimed.'; }
      },
      brief: function (v) {
        return 'PROJECT BRIEF\nProject: ' + v.project + '\nService: ' + v.service + '\nStarting price: USD ' + v.price + '; exact scope to be agreed\nProblem / expected outcome: ' + v.problem + '\nStack / approved environment: ' + v.stack + '\n\nPlease confirm: sample inputs, expected outputs, acceptance criteria, access and AI-tool restrictions, deadline and funded budget. No credentials included.';
      },
      prepared: 'Prepared locally. Nothing has been submitted.',
      copied: 'Copied. Paste it into your approved platform conversation.',
      noClipboard: 'Clipboard unavailable. Select the brief text above or download the file.',
      selected: 'Service selected in the brief: ',
      count: function (n, max) { return n + '/' + max; }
    },
    es: {
      price: function (v) { return 'US$ ' + fmt(v); },
      perMonth: '/mes',
      from: 'Desde',
      limit: 'Límite',
      cta: 'Preparar solicitud',
      ctaFor: 'Preparar solicitud para: ',
      option: function (s) { return s.name + ' · desde US$ ' + fmt(s.starting_price_usd) + (s.id === 'maintenance' ? '/mes' : ''); },
      all: 'Todos',
      other: 'Otros servicios',
      groups: {
        fix: 'Diagnosticar y corregir',
        connect: 'Integrar y automatizar',
        data: 'Datos y búsqueda documental',
        keep: 'Probar, documentar, mantener'
      },
      cats: {
        both: 'Correcta en ambas versiones',
        fixed: 'Corregida por la mejora',
        miss: 'Incorrecta en ambas versiones',
        regress: 'Empeoró con la mejora'
      },
      cell: function (i, q, cat) { return 'Pregunta ' + (i + 1) + ': ' + q + '. ' + cat + '.'; },
      expected: 'Fuente esperada',
      baseRank: 'Ranking de la versión base',
      impRank: 'Ranking tras la mejora',
      first: 'Primera fuente correcta',
      yes: 'sí',
      no: 'no, error residual',
      none: 'sin coincidencias',
      excerpts: 'Fragmentos devueltos',
      scenarios: {
        replay: function (r) { return 'PRUEBA VERIFICADA\n' + fmt(r.deliveries) + ' entregas → ' + fmt(r.unique_events) + ' eventos únicos\n' + r.parallel_receivers + ' hilos receptores concurrentes\nEfectos sin protección: ' + fmt(r.naive_effects) + '\nEfectos con protección: ' + fmt(r.protected_effects) + '\nEfectos duplicados con protección: ' + r.protected_duplicates; },
        ack: function (r) { return 'VERIFICACIÓN DE REGRESIÓN SUPERADA\nEl proveedor registra la operación; se pierde su acuse de recibo.\nEl reintento usa la misma clave de idempotencia del evento.\nEl proveedor sintético conserva un único efecto.\nConjunto de prueba masivo: ' + r.lost_acknowledgements + ' acuses de recibo perdidos.'; },
        restart: function (r) { return 'VERIFICACIÓN DE REGRESIÓN SUPERADA\nEl inbox y el outbox persisten en SQLite.\nUna nueva instancia de Inbox lee el outbox pendiente.\nEl envío tras el reinicio conserva un único efecto.\nConjunto de prueba masivo: ' + fmt(r.provider_effects) + ' efectos únicos en el proveedor.'; },
        dead: function () { return 'VERIFICACIÓN DE REGRESIÓN SUPERADA\nUn proveedor con fallo permanente llega al estado dead-letter.\nLos reintentos se detienen al alcanzar el límite de intentos configurado.\nEl fallo queda explícito; no se declara ninguna entrega exitosa.'; }
      },
      brief: function (v) {
        return 'SOLICITUD DE PROYECTO\nProyecto: ' + v.project + '\nServicio: ' + v.service + '\nPrecio inicial: USD ' + v.price + ' (dólares estadounidenses); alcance exacto por acordar\nProblema / resultado esperado: ' + v.problem + '\nTecnologías / entorno aprobado: ' + v.stack + '\n\nPor favor, confirme: datos de muestra, resultados esperados, criterios de aceptación, restricciones de acceso y de herramientas de IA, plazo y presupuesto aprobado. No se incluyen credenciales.';
      },
      prepared: 'Preparada localmente. No se ha enviado nada.',
      copied: 'Copiada. Péguela en la conversación de su plataforma aprobada.',
      noClipboard: 'Portapapeles no disponible. Seleccione el texto de la solicitud o descargue el archivo.',
      selected: 'Servicio seleccionado en la solicitud: ',
      count: function (n, max) { return n + '/' + max; }
    }
  };
  var T = COPY[LANG];

  /* Service families for the catalogue. Unknown ids fall into "other". */
  var GROUPS = [
    { id: 'fix', ids: ['diagnostic', 'repair', 'sql'] },
    { id: 'connect', ids: ['integration', 'automation', 'extraction'] },
    { id: 'data', ids: ['data_cleaning', 'dashboard', 'retrieval'] },
    { id: 'keep', ids: ['tests', 'documentation', 'maintenance'] }
  ];

  var catalog = (window.STUDIO_CATALOG && window.STUDIO_CATALOG.services) || [];
  var evidence = window.STUDIO_EVIDENCE || null;

  /* ---------- catalogue + service select ---------- */
  function groupServices(services) {
    var byId = {};
    services.forEach(function (s) { byId[s.id] = s; });
    var used = {};
    var groups = GROUPS.map(function (g) {
      var items = g.ids.map(function (id) { return byId[id]; }).filter(Boolean);
      items.forEach(function (s) { used[s.id] = true; });
      return { id: g.id, label: T.groups[g.id], items: items };
    });
    var rest = services.filter(function (s) { return !used[s.id]; });
    if (rest.length) groups.push({ id: 'other', label: T.other, items: rest });
    return groups.filter(function (g) { return g.items.length; });
  }

  function priceText(s) {
    return T.price(s.starting_price_usd) + (s.id === 'maintenance' ? T.perMonth : '');
  }

  function renderCatalog(services) {
    var grid = $('catalogGrid');
    if (!grid || !services.length) return;
    var groups = groupServices(services);
    grid.textContent = '';
    groups.forEach(function (g) {
      var sec = el('section', 'cat-group');
      sec.setAttribute('data-group', g.id);
      var h = el('h3', null, g.label);
      h.id = 'cg-' + g.id;
      sec.setAttribute('aria-labelledby', h.id);
      var list = el('ol', 'cat-list');
      g.items.forEach(function (s) {
        var li = el('li', 'cat-item');
        li.append(el('h4', null, s.name));
        li.append(el('p', 'cat-scope', s.scope));
        var lim = el('p', 'cat-limit');
        lim.append(el('span', 'cat-limit-k', T.limit), d.createTextNode(s.boundary));
        li.append(lim);
        var price = el('p', 'cat-price');
        price.append(el('span', 'cat-price-k', T.from), d.createTextNode(priceText(s)));
        li.append(price);
        var a = el('a', 'cat-cta');
        a.href = '#brief';
        a.setAttribute('data-service', s.id);
        a.append(d.createTextNode(T.cta));
        a.append(el('span', 'vh', ': ' + s.name));
        var arr = el('span', 'arr', '→');
        arr.setAttribute('aria-hidden', 'true');
        a.append(d.createTextNode(' '), arr);
        li.append(a);
        list.append(li);
      });
      sec.append(h, list);
      grid.append(sec);
    });

    var sel = $('serviceChoice');
    if (sel) {
      var current = sel.value;
      sel.textContent = '';
      groups.forEach(function (g) {
        var og = d.createElement('optgroup');
        og.label = g.label;
        g.items.forEach(function (s) {
          var o = el('option', null, T.option(s));
          o.value = s.id;
          og.append(o);
        });
        sel.append(og);
      });
      if (current && services.some(function (s) { return s.id === current; })) sel.value = current;
    }

    var tools = d.querySelector('.cat-tools');
    if (tools) {
      tools.textContent = '';
      var chips = [{ id: 'all', label: T.all, n: services.length }].concat(groups.map(function (g) { return { id: g.id, label: g.label, n: g.items.length }; }));
      chips.forEach(function (c, i) {
        var b = el('button', 'chip');
        b.type = 'button';
        b.setAttribute('data-filter', c.id);
        b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        b.append(d.createTextNode(c.label), el('span', null, String(c.n)));
        tools.append(b);
      });
    }
  }

  function wireCatalogFilter() {
    var tools = d.querySelector('.cat-tools');
    var grid = $('catalogGrid');
    if (!tools || !grid) return;
    tools.addEventListener('click', function (ev) {
      var b = ev.target.closest('.chip');
      if (!b) return;
      var f = b.getAttribute('data-filter');
      tools.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      grid.classList.toggle('is-filtered', f !== 'all');
      grid.querySelectorAll('.cat-group').forEach(function (g) {
        g.classList.toggle('is-hidden', f !== 'all' && g.getAttribute('data-group') !== f);
      });
    });
  }

  /* Any [data-service] link pre-selects that service in the brief form. */
  function wireServiceLinks() {
    d.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-service]');
      if (!a) return;
      var sel = $('serviceChoice');
      var id = a.getAttribute('data-service');
      if (!sel || !Array.prototype.some.call(sel.options, function (o) { return o.value === id; })) return;
      sel.value = id;
      var field = sel.closest('.field');
      var note = $('serviceNote');
      if (note) note.textContent = T.selected + sel.options[sel.selectedIndex].textContent;
      if (field) {
        field.classList.add('flash');
        window.setTimeout(function () { field.classList.remove('flash'); }, 1600);
      }
    });
  }

  /* ---------- evidence ---------- */
  function setText(id, v) { var n = $(id); if (n) n.textContent = v; }

  function drawFlow(r) {
    var H = 200;
    var total = r.deliveries;
    if (!total) return;
    var hu = H * r.unique_events / total;
    var yc = hu + (H - hu) * 0.28;
    var hg = H * r.naive_duplicates / total;
    var set = function (id, attr, v) { var n = $(id); if (n) n.setAttribute(attr, v); };
    set('fUnique', 'd', 'M12 0H508V' + hu.toFixed(2) + 'H12Z');
    set('fDst', 'height', hu.toFixed(2));
    set('fRepeat', 'd', 'M12 ' + hu.toFixed(2) + 'C120 ' + hu.toFixed(2) + ' 170 ' + yc.toFixed(2) + ' 232 ' + yc.toFixed(2) + 'C170 ' + yc.toFixed(2) + ' 120 ' + H + ' 12 ' + H + 'Z');
    set('fGhost', 'y', (hu + 10).toFixed(2));
    set('fGhost', 'height', hg.toFixed(2));
  }

  function renderReplay(r) {
    setText('heroDeliveries', fmt(r.deliveries));
    setText('heroEffects', fmt(r.protected_effects));
    setText('heroRepeats', fmt(r.deliveries - r.unique_events));
    setText('heroDuplicates', fmt(r.protected_duplicates));
    setText('heroGhost', '+' + fmt(r.naive_duplicates));
    setText('baselineDup', fmt(r.naive_duplicates));
    setText('protectedDup', fmt(r.protected_duplicates));
    drawFlow(r);

    var group = $('replayScenario');
    var out = $('replayOutput');
    if (!group || !out) return;
    var update = function (animate) {
      var checked = group.querySelector('input:checked');
      var key = checked ? checked.value : 'replay';
      group.querySelectorAll('.run').forEach(function (lab) {
        var inp = lab.querySelector('input');
        lab.classList.toggle('is-checked', !!(inp && inp.checked));
      });
      var fn = T.scenarios[key] || T.scenarios.replay;
      if (animate && !reduceMotion) {
        out.classList.add('is-swapping');
        window.setTimeout(function () { out.textContent = fn(r); out.classList.remove('is-swapping'); }, 140);
      } else {
        out.textContent = fn(r);
      }
    };
    group.addEventListener('change', function () { update(true); });
    update(false);
  }

  function category(c) {
    var b = c.baseline[0] === c.expected;
    var i = c.improved[0] === c.expected;
    if (b && i) return 'both';
    if (!b && i) return 'fixed';
    if (!b && !i) return 'miss';
    return 'regress';
  }

  function renderRetrieval(q) {
    setText('baselineTop', q.baseline.top1_correct + '/' + q.queries);
    setText('improvedTop', q.improved.top1_correct + '/' + q.queries);
    setText('recallBase', pct(q.baseline.recall_at_3));
    setText('recallImp', pct(q.improved.recall_at_3));
    setText('mrrBase', dec(q.baseline.mrr_at_3));
    setText('mrrImp', dec(q.improved.mrr_at_3));

    var sel = $('retrievalQuestion');
    var out = $('retrievalOutput');
    var matrix = $('queryMatrix');
    var legend = $('mxLegend');
    if (!sel || !out) return;

    var cats = q.cases.map(category);
    sel.textContent = '';
    q.cases.forEach(function (v, i) {
      var o = el('option', null, (i + 1) + '. ' + v.query);
      o.value = String(i);
      o.lang = 'en';
      sel.append(o);
    });

    var cells = [];
    if (matrix) {
      matrix.textContent = '';
      q.cases.forEach(function (v, i) {
        var b = el('button', 'mx c-' + cats[i]);
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', 'false');
        b.setAttribute('aria-label', T.cell(i, v.query, T.cats[cats[i]]));
        b.tabIndex = -1;
        b.style.setProperty('--i', i);
        b.addEventListener('click', function () { select(i, false); });
        matrix.append(b);
        cells.push(b);
      });
      matrix.addEventListener('keydown', function (ev) {
        var cur = Number(sel.value) || 0;
        var cols = 11;
        var next = null;
        if (ev.key === 'ArrowRight') next = cur + 1;
        else if (ev.key === 'ArrowLeft') next = cur - 1;
        else if (ev.key === 'ArrowDown') next = cur + cols;
        else if (ev.key === 'ArrowUp') next = cur - cols;
        else if (ev.key === 'Home') next = 0;
        else if (ev.key === 'End') next = cells.length - 1;
        if (next === null) return;
        ev.preventDefault();
        next = Math.max(0, Math.min(cells.length - 1, next));
        select(next, true);
      });
    }

    if (legend) {
      legend.textContent = '';
      var order = ['both', 'fixed', 'miss', 'regress'];
      var cursor = {};
      order.forEach(function (k) {
        var idx = [];
        cats.forEach(function (c, i) { if (c === k) idx.push(i); });
        var li = el('li');
        var b = el('button');
        b.type = 'button';
        var key = el('span', 'mx-k c-' + k);
        key.setAttribute('aria-hidden', 'true');
        b.append(key, el('span', 'mx-k-t', T.cats[k]), el('span', 'mx-k-n', String(idx.length)));
        if (!idx.length) b.disabled = true;
        b.addEventListener('click', function () {
          if (!idx.length) return;
          cursor[k] = cursor[k] === undefined ? 0 : (cursor[k] + 1) % idx.length;
          select(idx[cursor[k]], false);
        });
        li.append(b);
        legend.append(li);
      });
    }

    /* First chip: green tick when correct, clay when wrong.
       A later chip that matches the expected source gets an outline. */
    function chipList(ids, expected) {
      var ol = el('ol', 'chips');
      if (!ids.length) {
        ol.append(el('li', 'none', T.none));
        return ol;
      }
      ids.forEach(function (id, k) {
        var match = id === expected;
        var cls = k === 0 ? (match ? 'hit' : 'miss') : (match ? 'exp' : '');
        ol.append(el('li', cls, (k + 1) + '. ' + id + (match ? ' ✓' : '')));
      });
      return ol;
    }

    function row(label, node) {
      var div = el('div');
      div.append(el('dt', null, label));
      var dd = el('dd');
      if (typeof node === 'string') dd.textContent = node; else dd.append(node);
      div.append(dd);
      return div;
    }

    function paint(i) {
      var v = q.cases[i];
      out.textContent = '';
      var qn = el('p', 'out-q', '“' + v.query + '”');
      qn.lang = 'en';
      out.append(qn);
      var dl = el('dl', 'out-rank');
      var exp = el('code', null, v.expected);
      dl.append(row(T.expected, exp));
      dl.append(row(T.baseRank, chipList(v.baseline, v.expected)));
      dl.append(row(T.impRank, chipList(v.improved, v.expected)));
      var ok = v.improved[0] === v.expected;
      dl.append(row(T.first, el('span', ok ? 'verdict-yes' : 'verdict-no', ok ? T.yes : T.no)));
      out.append(dl);
      if (v.results && v.results.length) {
        var ex = el('ol', 'out-ex');
        ex.setAttribute('aria-label', T.excerpts);
        v.results.forEach(function (x) {
          var li = el('li');
          li.append(el('code', null, x.source));
          var p = el('p', null, x.excerpt);
          p.lang = 'en';
          li.append(p);
          ex.append(li);
        });
        out.append(ex);
      }
    }

    function select(i, focus) {
      sel.value = String(i);
      cells.forEach(function (c, k) {
        c.setAttribute('aria-checked', k === i ? 'true' : 'false');
        c.tabIndex = k === i ? 0 : -1;
      });
      if (focus && cells[i]) cells[i].focus();
      paint(i);
    }

    sel.addEventListener('change', function () { select(Number(sel.value), false); });
    select(0, false);
  }

  /* ---------- reveal on view (decorative only) ---------- */
  function wireReveal() {
    var items = d.querySelectorAll('.reveal');
    if (!items.length) return;
    root.classList.add('lv-ready');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    items.forEach(function (n) { io.observe(n); });
  }

  /* ---------- optional generated hero art ---------- */
  function probeHeroArt() {
    var plate = $('exhibitA');
    var img = plate && plate.querySelector('.plate-photo');
    if (!img) return;
    var src = plate.getAttribute('data-art') || 'hero-higgsfield.png';
    var probe = new Image();
    probe.decoding = 'async';
    probe.onload = function () {
      img.src = src;
      img.hidden = false;
      plate.classList.add('has-photo');
    };
    probe.src = src;
  }

  /* ---------- brief (local only) ---------- */
  function wireBrief() {
    var form = $('briefForm');
    if (!form) return;
    var briefText = '';
    var problem = $('problem');
    var counter = $('problemCount');
    if (problem && counter) {
      var max = Number(problem.getAttribute('maxlength')) || 2000;
      var upd = function () { counter.textContent = T.count(problem.value.length, max); };
      problem.addEventListener('input', upd);
      upd();
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var selected = catalog.filter(function (x) { return x.id === $('serviceChoice').value; })[0];
      briefText = T.brief({
        project: $('projectName').value,
        service: (selected && selected.name) || '',
        price: (selected && selected.starting_price_usd) || '',
        problem: $('problem').value,
        stack: $('stack').value
      });
      var out = $('briefOutput');
      out.textContent = briefText;
      out.classList.remove('hidden');
      out.hidden = false;
      var acts = $('briefActions');
      acts.classList.remove('hidden');
      acts.hidden = false;
      $('copyStatus').textContent = T.prepared;
    });
    $('copyBrief').addEventListener('click', function () {
      var status = $('copyStatus');
      if (!navigator.clipboard || !navigator.clipboard.writeText) { status.textContent = T.noClipboard; return; }
      navigator.clipboard.writeText(briefText).then(function () { status.textContent = T.copied; }, function () { status.textContent = T.noClipboard; });
    });
    $('downloadBrief').addEventListener('click', function () {
      var u = URL.createObjectURL(new Blob([briefText], { type: 'text/plain;charset=utf-8' }));
      var a = d.createElement('a');
      a.href = u;
      a.download = 'project-brief.txt';
      d.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(function () { URL.revokeObjectURL(u); }, 0);
    });
  }

  /* ---------- boot ---------- */
  renderCatalog(catalog);
  wireCatalogFilter();
  wireServiceLinks();
  if (evidence) {
    if (evidence.replaysafe) renderReplay(evidence.replaysafe);
    if (evidence.retrieval) renderRetrieval(evidence.retrieval);
  }
  wireReveal();
  /* No cloud asset was generated: avoid probing a missing image. */
  wireBrief();

  /* Exposed for offline checks (node smoke test); not used by the page. */
  window.LV_PORTFOLIO = { category: category, groupServices: groupServices, priceText: priceText, lang: LANG };
})();
