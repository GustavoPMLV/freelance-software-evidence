const test = require('node:test');
const assert = require('node:assert/strict');
const e = require('../site/engine.js');
const head = 'pedido;sku;quantidade;preco_unitario\n';
const csv = rows => head + rows.join('\n') + '\n';
const good = csv(['001;A;2;0,10','002;B;3;0,20']);
const throws = (fn, code) => assert.throws(fn, x=>x.code===code);
test('identical valid batches are clear; values calculated exactly in cents',()=>{
 const r=e.compare(good,good); assert.equal(r.allClear,true); assert.equal(r.summary.matched,2);
 assert.equal(r.summary.expectedValidTotalCents,'80'); assert.equal(r.rows[0].pedido,'001');
});
test('fixture identifies one match, change, missing, unexpected and blocked duplicate',()=>{
 const r=e.compare(e.DEMO.expected,e.DEMO.actual); assert.equal(r.allClear,false);
 for(const k of ['matched','changed','missing','unexpected','blocked'])assert.equal(r.summary[k],1);
 assert.equal(r.issues[0].line,5); assert.deepEqual(r.issues[0].codes,['DUPLICATE']);
 assert.deepEqual(r.rows.find(x=>x.status==='blocked').blockedLines,{expected:[5],actual:[4,5]});
 assert.equal(r.summary.totalsAreComplete,false);
});
test('quantity and unit price remain different even with the same line total',()=>{
 assert.equal(e.compare(csv(['1;A;2;5,00']),csv(['1;A;1;10,00'])).rows[0].status,'changed');
});
test('quoted fields, escaped quotes, embedded delimiters, BOM and CRLF parse',()=>{
 const r=e.parseCSV('\uFEFFpedido;sku;quantidade;preco_unitario;nota\r\n001;"A;B";1;1,00;"x""y\r\nz"\r\n');
 assert.equal(r[1].cells[1],'A;B'); assert.equal(r[1].cells[4],'x"y\nz'); assert.equal(r[1].line,2);
 const q=e.compare('\uFEFF'+good.replaceAll('\n','\r\n'),good);assert.equal(q.allClear,true);
});
test('line numbers include physical blank lines and quoted multiline fields',()=>{
 const s=head+'\n1;A;1;1,00\n2;B;1;2,00\n';assert.equal(e.compare(s,s).rows[1].expected.line,4);
});
test('strict CSV syntax never silently repairs malformed quotes',()=>{
 throws(()=>e.parseCSV('a;"b'),'UNCLOSED_QUOTE');throws(()=>e.parseCSV('a;"b"x'),'AFTER_QUOTE');
 throws(()=>e.parseCSV('a;b"x'),'QUOTE');throws(()=>e.parseCSV('a\u0000'),'NUL');
});
test('empty files, missing columns, duplicate headers and header only are rejected',()=>{
 throws(()=>e.compare('',good),'EMPTY');throws(()=>e.compare('x;y\n1;2',good),'HEADERS');
 throws(()=>e.compare('pedido;sku;quantidade;preco_unitario;sku\n1;A;1;1;B',good),'HEADERS');
 throws(()=>e.compare(head,good),'NO_ROWS');
});
test('quoted empty and delimiter-only rows are invalid, never discarded',()=>{
 for(const row of ['""',';;;']) {const r=e.compare(csv([row]),good);assert.equal(r.allClear,false);assert.equal(r.summary.issues,1);}
});
test('invalid decimal forms block the associated key rather than becoming missing',()=>{
 for(const price of ['-1,00','1.000,00','1,001','1e3','NaN','1.00','']){
  const r=e.compare(csv(['1;A;1;1,00']),csv([`1;A;1;${price}`]));
  assert.equal(r.rows[0].status,'blocked');assert.equal(r.summary.missing,0);assert.equal(r.allClear,false);
 }
});
test('zero price is valid; integer quantities are positive and bounded',()=>{
 assert.equal(e.compare(csv(['1;A;1;0']),csv(['1;A;1;0,00'])).allClear,true);
 for(const q of ['0','-1','1,5','1.0','1e2','1000001',''])assert.equal(e.compare(good,csv([`1;A;${q};1,00`])).summary.issues,1);
});
test('duplicate keys are excluded on either side, not summed or overwritten',()=>{
 const dup=csv(['001;A;2;0,10','001;A;2;0,10']);
 for(const [a,b] of [[dup,good],[good,dup],[dup,dup]]){
  const r=e.compare(a,b);assert.equal(r.rows.find(x=>x.pedido==='001').status,'blocked');assert.equal(r.allClear,false);
 }
});
test('invalid first duplicate does not become valid on a later row',()=>{
 const r=e.compare(good,csv(['001;A;0;0,10','001;A;2;0,10']));
 assert.equal(r.rows.find(x=>x.pedido==='001').status,'blocked');assert.equal(r.summary.issues,2);
});
test('ID casing, leading zeroes and composite keys retain identity',()=>{
 const a=csv(['01;A;1;1,00','1;a;1;1,00','x|y;z;1;1,00','x;y|z;1;1,00']);
 assert.equal(e.compare(a,a).summary.matched,4);
 assert.equal(e.compare(csv(['01;A;1;1']),csv(['1;A;1;1'])).summary.missing,1);
});
test('comma CSV and dot decimals work only with explicitly selected options',()=>{
 const a='sku,pedido,preco_unitario,quantidade\nA,001,0.10,3\n';
 const r=e.compare(a,a,{delimiter:',',decimal:'.'});assert.equal(r.allClear,true);assert.equal(r.summary.expectedValidTotalCents,'30');
 throws(()=>e.compare(a,a),'HEADERS');throws(()=>e.compare(a,a,{delimiter:'|'}),'OPTIONS');
});
test('mismatched column counts do not silently ignore surplus/missing fields',()=>{
 for(const row of ['1;A;1;1,00;surplus','1;A;1']){
  const r=e.compare(good,csv([row]));assert.ok(r.issues[0].codes.includes('COLUMNS'));assert.equal(r.allClear,false);
 }
});
test('identities with controls or empty values cause validation issues',()=>{
 for(const id of ['', 'a\tb', 'a'.repeat(121)]) assert.ok(e.compare(good,csv([`${id};A;1;1,00`])).issues[0].codes.includes('IDENTITY'));
});
test('money uses exact large integer arithmetic beyond floating point safe totals',()=>{
 const a=csv(['1;A;1000000;9999999999,99']);const r=e.compare(a,a);
 assert.equal(r.summary.expectedValidTotalCents,'999999999999000000');assert.equal(e.money('30'),'0,30');
 throws(()=>e.cents('10000000000,00',','),'PRICE_RANGE');
});
test('CSV report escapes quotes and neutralizes spreadsheet formulas in IDs',()=>{
 const r=e.compare(csv(['=1+1;"A""B";1;1,00']),csv(['=1+1;"A""B";1;1,00']));
 const out=e.reportCSV(r);assert.ok(out.startsWith('\uFEFF'));assert.ok(out.includes('"\'=1+1"'));assert.ok(out.includes('"A""B"'));
 const rows=e.parseCSV(out);assert.equal(rows[1].cells[1],"'=1+1");assert.equal(rows[1].cells[2],'A"B');
});
test('report includes invalid rows; JSON contains no unserializable BigInts',()=>{
 const r=e.compare(good,csv(['1;A;0;1,00']));assert.ok(e.reportCSV(r).includes('invalid_actual'));
 assert.deepEqual(JSON.parse(JSON.stringify(r)),r);
});
test('order does not change comparison outcomes',()=>{
 const reversed=csv(['002;B;3;0,20','001;A;2;0,10']);
 assert.equal(e.compare(good,reversed).allClear,true);assert.equal(e.compare(good,reversed).summary.matched,2);
});
test('size limit is UTF-8 bytes and enforced before parsing',()=>{
 throws(()=>e.parseCSV('é'.repeat(e.LIMITS.bytes/2+1)),'SIZE');
});
test('exact 10000 row limit passes and 10001 fails',()=>{
 const data=csv(Array.from({length:10000},(_,i)=>`${i};A;1;0,01`));
 const r=e.compare(data,data);assert.equal(r.allClear,true);assert.equal(r.summary.matched,10000);
 assert.equal(r.summary.expectedValidTotalCents,'10000');
 throws(()=>e.compare(data+'overflow;A;1;0,01\n',data),'ROWS');
});
