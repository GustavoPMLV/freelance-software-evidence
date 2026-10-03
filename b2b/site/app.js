(function () {
  'use strict';
  const E = window.LoteEngine;
  const lang = document.documentElement.lang.startsWith('es') ? 'es' : document.documentElement.lang.startsWith('en') ? 'en' : 'pt';
  const copy = {
    pt: {
      expected:'Pedidos',actual:'Importação',empty:'Nenhum arquivo carregado.',loading:'Lendo o arquivo neste navegador…',ready:'Arquivo pronto',example:'Exemplo sintético',
      clear:'Sem divergências nas regras conferidas. Revise antes de importar.',pending:'Há pendências. Revise as linhas antes de importar.',
      matched:'Correspondentes',changed:'Diferentes',missing:'Ausentes na importação',unexpected:'Não previstos',blocked:'Bloqueados',issues:'Linhas com erro',
      cols:['Situação','Pedido','SKU','Linha pedidos / importação','Quantidade pedidos / importação','Preço pedidos / importação (BRL)'],
      prev:'Anterior',next:'Próxima',page:'Página',of:'de',total:'Total das linhas válidas',partial:'Totais parciais: linhas inválidas e chaves duplicadas foram excluídas. Eles não representam o lote completo.',
      lines:'Erros de validação',codes:{OPTIONS:'Configuração inválida.',TEXT:'Conteúdo inválido.',SIZE:'Arquivo acima de 2 MiB.',ROWS:'Mais de 10.000 registros.',NUL:'Caractere nulo no arquivo.',AFTER_QUOTE:'Caractere após fechamento de aspas.',QUOTE:'Aspas dentro de campo não delimitado.',UNCLOSED_QUOTE:'Aspas não fechadas.',EMPTY:'Arquivo vazio.',HEADERS:'Cabeçalhos ausentes, vazios ou repetidos.',NO_ROWS:'Arquivo sem registros.',COLUMNS:'Número de colunas diferente do cabeçalho.',IDENTITY:'Pedido ou SKU vazio, muito longo ou com controle.',QUANTITY:'Quantidade deve ser inteira entre 1 e 1.000.000.',PRICE:'Preço inválido: use o decimal escolhido, sem milhares e até dois decimais.',PRICE_RANGE:'Preço fora do limite suportado.',DUPLICATE:'Pedido + SKU repetido: chave bloqueada.',UTF8:'O arquivo deve usar UTF-8.',READ:'Não foi possível ler o arquivo.'},
      line:'linha',inputError:'Não foi possível conferir',choose:'Carregue os dois arquivos.',cleared:'Arquivos e resultados removidos da sessão.',
      brief:'Solicitação de piloto — Conferência de Lotes\nEmpresa/atividade: \nERP e formato dos dois arquivos: \nFrequência e volume: \nProblema que precisa evitar: \nCritérios de aceite: \n\nInteresse em avaliar um piloto a partir de R$497, com um fluxo e escopo acordado após amostras sanitizadas. Sem contratação automática.\n\nContexto adicional: ',
      briefReady:'Texto preparado localmente. Revise e envie pela plataforma escolhida.',copied:'Texto copiado.',copyError:'Selecione e copie o texto manualmente.',hash:'SHA-256',
    },
    en: {
      expected:'Orders',actual:'Import file',empty:'No file loaded.',loading:'Reading the file in this browser…',ready:'File ready',example:'Synthetic example',
      clear:'No differences in the checked rules. Review before importing.',pending:'Issues found. Review the rows before importing.',
      matched:'Matching',changed:'Different',missing:'Missing from import',unexpected:'Unexpected',blocked:'Blocked',issues:'Invalid rows',
      cols:['Status','Order','SKU','Orders / import line','Orders / import quantity','Orders / import unit price (BRL)'],
      prev:'Previous',next:'Next',page:'Page',of:'of',total:'Total of valid rows',partial:'Partial totals: invalid rows and duplicate keys are excluded. These totals do not represent the complete batch.',
      lines:'Validation errors',codes:{OPTIONS:'Invalid settings.',TEXT:'Invalid content.',SIZE:'File exceeds 2 MiB.',ROWS:'More than 10,000 records.',NUL:'NUL character in file.',AFTER_QUOTE:'Character after closing quote.',QUOTE:'Quote inside an unquoted field.',UNCLOSED_QUOTE:'Unclosed quote.',EMPTY:'Empty file.',HEADERS:'Missing, empty or duplicate headers.',NO_ROWS:'File contains no records.',COLUMNS:'Column count differs from header.',IDENTITY:'Empty, overlong or control-containing order/SKU.',QUANTITY:'Quantity must be an integer from 1 to 1,000,000.',PRICE:'Invalid price: selected decimal, no thousands separator and at most two decimal places.',PRICE_RANGE:'Price exceeds supported limit.',DUPLICATE:'Repeated order + SKU: key blocked.',UTF8:'File must use UTF-8.',READ:'Could not read the file.'},
      line:'line',inputError:'Could not compare',choose:'Load both files.',cleared:'Files and results removed from the session.',
      brief:'Pilot request — Batch Check\nCompany/activity: \nERP and the two file formats: \nFrequency and volume: \nProblem to prevent: \nAcceptance criteria: \n\nInterested in evaluating a pilot from BRL497, covering one workflow with scope agreed after sanitized samples. No automatic contract.\n\nAdditional context: ',
      briefReady:'Text prepared locally. Review and send it through your chosen platform.',copied:'Text copied.',copyError:'Select and copy the text manually.',hash:'SHA-256',
    },
    es: {
      expected:'Pedidos',actual:'Importación',empty:'Ningún archivo cargado.',loading:'Leyendo el archivo en este navegador…',ready:'Archivo listo',example:'Ejemplo sintético',
      clear:'Sin diferencias en las reglas comprobadas. Revise antes de importar.',pending:'Hay incidencias. Revise las filas antes de importar.',
      matched:'Coincidentes',changed:'Diferentes',missing:'Ausentes en la importación',unexpected:'No previstos',blocked:'Bloqueados',issues:'Filas con error',
      cols:['Estado','Pedido','SKU','Fila pedidos / importación','Cantidad pedidos / importación','Precio pedidos / importación (BRL)'],
      prev:'Anterior',next:'Siguiente',page:'Página',of:'de',total:'Total de las filas válidas',partial:'Totales parciales: se excluyen las filas inválidas y las claves duplicadas. No representan el lote completo.',
      lines:'Errores de validación',codes:{OPTIONS:'Configuración inválida.',TEXT:'Contenido inválido.',SIZE:'Archivo superior a 2 MiB.',ROWS:'Más de 10.000 registros.',NUL:'Carácter nulo en el archivo.',AFTER_QUOTE:'Carácter después del cierre de comillas.',QUOTE:'Comillas dentro de un campo sin delimitar.',UNCLOSED_QUOTE:'Comillas sin cerrar.',EMPTY:'Archivo vacío.',HEADERS:'Encabezados ausentes, vacíos o repetidos.',NO_ROWS:'Archivo sin registros.',COLUMNS:'Número de columnas diferente del encabezado.',IDENTITY:'Pedido o SKU vacío, demasiado largo o con caracteres de control.',QUANTITY:'Cantidad entera entre 1 y 1.000.000.',PRICE:'Precio inválido: use el decimal seleccionado, sin separador de miles y hasta dos decimales.',PRICE_RANGE:'Precio fuera del límite.',DUPLICATE:'Pedido + SKU repetido: clave bloqueada.',UTF8:'El archivo debe usar UTF-8.',READ:'No se pudo leer el archivo.'},
      line:'fila',inputError:'No se pudo comprobar',choose:'Cargue los dos archivos.',cleared:'Archivos y resultados eliminados de la sesión.',
      brief:'Solicitud de piloto — Conferencia de Lotes\nEmpresa/actividad: \nERP y formatos de los dos archivos: \nFrecuencia y volumen: \nProblema que quiere evitar: \nCriterios de aceptación: \n\nInterés en evaluar un piloto desde R$497, con un flujo y alcance acordado después de muestras anonimizadas. Sin contratación automática.\n\nContexto adicional: ',
      briefReady:'Texto preparado localmente. Revíselo y envíelo por la plataforma elegida.',copied:'Texto copiado.',copyError:'Seleccione y copie el texto manualmente.',hash:'SHA-256',
    }
  }[lang];
  const $ = id => document.getElementById(id);
  const state = { expected:null, actual:null, report:null, page:0, loading:{expected:false,actual:false}, version:{expected:0,actual:0} };
  function node(tag, text, className) { const n=document.createElement(tag); if(text!=null)n.textContent=text;if(className)n.className=className;return n; }
  function invalidate() { state.report=null;state.page=0;$('results-section').hidden=true;$('errors-output').textContent='';$('export-csv-btn').disabled=true;$('export-json-btn').disabled=true; }
  function ready() { $('compare-btn').disabled=state.loading.expected||state.loading.actual||!state.expected||!state.actual; }
  function message(error) { return (copy.codes[error.code]||copy.codes.READ)+(error.line?' '+copy.line+' '+error.line:''); }
  async function load(side, bytes, name, example, version) {
    try {
      if(bytes.byteLength>E.LIMITS.bytes)throw new E.InputError('SIZE');
      let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new E.InputError('UTF8');}
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      if(version!==state.version[side])return;
      const sha256=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
      state[side]={text,name,bytes:bytes.byteLength,sha256,example};
      $(side+'-status').textContent=`${example?copy.example:copy.ready}: ${name} · ${bytes.byteLength} bytes · ${copy.hash} ${sha256.slice(0,12)}…`;
    }catch(error){
      if(version!==state.version[side])return;
      state[side]=null;$(side+'-status').textContent=message(error);
    }finally{if(version===state.version[side]){state.loading[side]=false;ready();}}
  }
  function begin(side) { const version=++state.version[side];state[side]=null;state.loading[side]=true;invalidate();ready();$('run-status').textContent='';$(side+'-status').textContent=copy.loading;return version; }
  for(const side of ['expected','actual']){
    $(side+'-file').addEventListener('change',async event=>{
      const file=event.target.files[0],version=begin(side);
      if(!file){state.loading[side]=false;$(side+'-status').textContent=copy.empty;ready();return;}
      try{if(file.size>E.LIMITS.bytes)throw new E.InputError('SIZE');await load(side,await file.arrayBuffer(),file.name,false,version);}
      catch(error){if(version===state.version[side]){state.loading[side]=false;$(side+'-status').textContent=message(error);ready();}}
    });
    $(side+'-status').textContent=copy.empty;
  }
  for(const name of ['delimiter','decimal'])$(name).addEventListener('change',()=>{invalidate();$('run-status').textContent='';});
  $('demo-btn').addEventListener('click',async()=>{
    $('delimiter').value=';';$('decimal').value=',';
    const runs=['expected','actual'].map(side=>{ $(side+'-file').value='';const version=begin(side);return load(side,new TextEncoder().encode(E.DEMO[side]),side==='expected'?'pedidos-exemplo.csv':'importacao-exemplo.csv',true,version); });
    await Promise.all(runs);$('run-status').textContent=copy.example;
  });
  $('clear-btn').addEventListener('click',()=>{
    for(const side of ['expected','actual']){state.version[side]++;state[side]=null;state.loading[side]=false;$(side+'-file').value='';$(side+'-status').textContent=copy.empty;}
    invalidate();ready();$('run-status').textContent=copy.cleared;
  });
  function render() {
    const r=state.report,summary=$('summary-output'),output=$('report-output');summary.replaceChildren();output.replaceChildren();
    summary.append(node('p',r.allClear?copy.clear:copy.pending,r.allClear?'result-clear':'result-pending'));
    const metrics=node('dl',null,'result-metrics');
    for(const key of ['matched','changed','missing','unexpected','blocked','issues']){const pair=node('div');pair.append(node('dt',copy[key]),node('dd',String(r.summary[key])));metrics.append(pair);}summary.append(metrics);
    summary.append(node('p',`${copy.total}: ${copy.expected} R$ ${E.money(r.summary.expectedValidTotalCents,lang==='en'?'.':',')} / ${copy.actual} R$ ${E.money(r.summary.actualValidTotalCents,lang==='en'?'.':',')}`));
    if(!r.summary.totalsAreComplete)summary.append(node('p',copy.partial,'partial-note'));
    const table=node('table'),head=node('thead'),tr=node('tr');for(const text of copy.cols){const th=node('th',text);th.scope='col';tr.append(th);}head.append(tr);table.append(head);
    const body=node('tbody');const perPage=100;
    for(const row of r.rows.slice(state.page*perPage,(state.page+1)*perPage)){
      const x=row.expected,y=row.actual,rt=node('tr');rt.dataset.status=row.status;
      const refs=row.blockedLines?`${row.blockedLines.expected.join(', ')||'—'} / ${row.blockedLines.actual.join(', ')||'—'}`:`${x?.line??'—'} / ${y?.line??'—'}`;
      const values=[copy[row.status],row.pedido,row.sku,refs,`${x?.quantity??'—'} / ${y?.quantity??'—'}`,`${x?E.money(x.unitCents,lang==='en'?'.':','):'—'} / ${y?E.money(y.unitCents,lang==='en'?'.':','):'—'}`];
      for(const value of values)rt.append(node('td',value));body.append(rt);
    }table.append(body);const wrap=node('div',null,'table-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',copy.cols[0]);wrap.append(table);output.append(wrap);
    const pages=Math.max(1,Math.ceil(r.rows.length/perPage)),nav=node('div',null,'report-pagination');
    const previous=node('button',copy.prev),next=node('button',copy.next);previous.type=next.type='button';previous.disabled=state.page===0;next.disabled=state.page+1>=pages;
    previous.addEventListener('click',()=>{state.page--;render();});next.addEventListener('click',()=>{state.page++;render();});nav.append(previous,node('span',`${copy.page} ${state.page+1} ${copy.of} ${pages}`),next);output.append(nav);
    if(r.issues.length){
      output.append(node('h3',copy.lines));const list=node('ul',null,'validation-list');
      for(const issue of r.issues.slice(0,100))list.append(node('li',`${copy[issue.side]} · ${copy.line} ${issue.line} · ${issue.pedido} / ${issue.sku}: ${issue.codes.map(code=>copy.codes[code]||code).join(' ')}`));output.append(list);
      if(r.issues.length>100)output.append(node('p',`100 / ${r.issues.length} · CSV / JSON`));
    }
  }
  $('compare-btn').addEventListener('click',()=>{
    invalidate();if(!state.expected||!state.actual){$('errors-output').textContent=copy.choose;return;}
    try {
      const r=E.compare(state.expected.text,state.actual.text,{delimiter:$('delimiter').value,decimal:$('decimal').value});
      r.inputs=Object.fromEntries(['expected','actual'].map(side=>{const {name,bytes,sha256,example}=state[side];return[side,{name,bytes,sha256,synthetic:example}];}));
      r.generatedAt=new Date().toISOString();state.report=r;$('results-section').hidden=false;render();$('run-status').textContent=r.allClear?copy.clear:copy.pending;$('export-csv-btn').disabled=false;$('export-json-btn').disabled=false;
    }catch(error){$('errors-output').textContent=copy.inputError+': '+message(error);$('run-status').textContent='';}
  });
  function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const link=node('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('export-csv-btn').addEventListener('click',()=>{if(state.report)download('conferencia-relatorio.csv',E.reportCSV(state.report),'text/csv;charset=utf-8');});
  $('export-json-btn').addEventListener('click',()=>{if(state.report)download('conferencia-relatorio.json',JSON.stringify(state.report,null,2)+'\n','application/json');});
  $('brief-btn').addEventListener('click',()=>{$('brief-output').value=copy.brief+$('brief-note').value.slice(0,2000);$('brief-status').textContent=copy.briefReady;});
  $('copy-brief-btn').addEventListener('click',async()=>{try{if(!$('brief-output').value){$('brief-status').textContent=copy.briefReady;return;}await navigator.clipboard.writeText($('brief-output').value);$('brief-status').textContent=copy.copied;}catch{$('brief-output').focus();$('brief-output').select();$('brief-status').textContent=copy.copyError;}});
  ready();invalidate();
}());
