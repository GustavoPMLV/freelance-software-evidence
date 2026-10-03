from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import sys, xml.etree.ElementTree as ET

root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'site'
required=set('expected-file actual-file expected-status actual-status delimiter decimal demo-btn compare-btn clear-btn errors-output results-section summary-output report-output export-csv-btn export-json-btn run-status brief-note brief-btn brief-output copy-brief-btn brief-status'.split())
class Parse(HTMLParser):
 def __init__(self): super().__init__();self.ids=[];self.refs=[];self.lang=None;self.scripts=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='html':self.lang=d.get('lang')
  if d.get('id'):self.ids.append(d['id'])
  if tag=='script':
   assert d.get('src'),'Inline script';self.scripts.append(urlsplit(d['src']).path)
  assert not any(k.startswith('on') for k in d),'Inline event'
  assert tag!='form','Unexpected submission form'
  for k in ['href','src']:
   if d.get(k):self.refs.append(d[k])
for name,lang in [('index.html','pt-BR'),('en.html','en'),('es.html','es')]:
 p=Parse();p.feed((root/name).read_text());assert p.lang==lang
 assert len(p.ids)==len(set(p.ids)),f'Duplicate IDs in {name}'
 assert required.issubset(p.ids),(name,required-set(p.ids))
 assert p.scripts==['engine.js','app.js'],p.scripts
 for ref in p.refs:
  u=urlsplit(ref)
  assert u.scheme not in ['javascript','data'],'Unexpected link'
  if u.scheme or u.netloc or not u.path:continue
  if u.path.startswith('../'):continue # portfolio-parent assets are checked in curated dist
  assert (root/u.path).is_file(),(name,ref)
 for flag in ['497','10.000' if lang!='en' else '10,000','120','7']:
  assert flag in (root/name).read_text(),(name,flag)
ET.parse(root/'assets/flow.svg')
for name in ['engine.js','app.js']:
 source=(root/name).read_text()
 for bad in ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'innerHTML', 'eval(']:assert bad not in source,(name,bad)
print('PASS: three languages, UI contracts, assets, no inline scripts/forms/network/persistence/unsafe HTML.')
