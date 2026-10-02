import concurrent.futures,hashlib,json,random,tempfile,time,unittest
from pathlib import Path
from replaysafe import Inbox,SyntheticProvider
from evidence_search import CASES,DOCS,search
root=Path(__file__).resolve().parent.parent
suite=unittest.defaultTestLoader.discover(str(root/'technical'),pattern='test_*.py')
with (root/'evidence'/'tests.txt').open('w') as log:r=unittest.TextTestRunner(stream=log,verbosity=2).run(suite)
if not r.wasSuccessful():raise SystemExit('Verification failed; inspect evidence/tests.txt')
with tempfile.TemporaryDirectory() as tmp:
 path=Path(tmp)/'fixture.sqlite';box=Inbox(path)
 events=[{'id':f'evt-{i:04}','amount':100+i%91} for i in range(1000)]
 deliveries=events+events+events[:500]+events[:100]+events[500:]
 random.Random(42).shuffle(deliveries)
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as p:results=list(p.map(box.receive,deliveries))
 naive_ledger=[]
 for event in deliveries: naive_ledger.append((event['id'],event['amount']))
 assert len(naive_ledger)==len(deliveries)
 p=SyntheticProvider(path,fail_once=[e['id'] for e in events[:25]],ambiguous_once=[e['id'] for e in events[25:50]])
 box.dispatch(p);box=Inbox(path);box.dispatch(p)
 counts=box.counts()
 assert counts['effects']==1000 and counts['sent']==1000 and counts['pending']==0
 replay={'deliveries':len(deliveries),'unique_events':1000,'naive_effects':len(naive_ledger),'protected_effects':counts['effects'],'naive_duplicates':len(deliveries)-1000,'protected_duplicates':counts['effects']-1000,'provider_effects':counts['sent'],'synthetic_transient_failures':25,'lost_acknowledgements':25,'parallel_receivers':8,'tests':10,'scope':'Synthetic SQLite fixture; single dispatcher; downstream supports idempotency keys; not a production throughput benchmark'}
rows=[]
for q,target in CASES:
 b=search(q,improved=False);a=search(q,improved=True)
 rows.append({'query':q,'expected':target,'baseline':[x['id'] for x in b],'improved':[x['id'] for x in a],'results':a})
def metrics(key):
 rr=[next((1/(i+1) for i,v in enumerate(r[key]) if v==r['expected']),0) for r in rows]
 return {'top1_correct':sum(bool(r[key]) and r[key][0]==r['expected'] for r in rows),'recall_at_3':round(sum(v>0 for v in rr)/len(rr),4),'mrr_at_3':round(sum(rr)/len(rr),4)}
retrieval={'documents':len(DOCS),'queries':len(rows),'baseline':metrics('baseline'),'improved':metrics('improved'),'cases':rows,'tests':7,'scope':'Hand-authored synthetic policies and queries; lexical baseline vs domain normalization + BM25 + title boost. No LLM, embeddings or live client data. Same access filters in both pipelines. Performance does not establish generalization to real corpora.'}
evidence={'schema':1,'created':'2026-10-02','demo_label':'Independent demonstrations / synthetic data','tests_passed':r.testsRun,'replaysafe':replay,'retrieval':retrieval}
(root/'evidence'/'results.json').write_text(json.dumps(evidence,indent=2)+'\n')
(root/'evidence'/'portfolio-data.js').write_text('window.STUDIO_EVIDENCE = '+json.dumps(evidence)+';\n')
manifest={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((root/'technical').glob('*.py'))}
(root/'evidence'/'source-hashes.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'tests_passed':r.testsRun,'replay':replay,'retrieval':{'queries':len(rows),'baseline':metrics('baseline'),'improved':metrics('improved')}}))
