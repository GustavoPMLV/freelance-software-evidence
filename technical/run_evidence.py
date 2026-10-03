"""Rebuild the published synthetic evidence from code and sealed inputs."""
import concurrent.futures, hashlib, json, random, tempfile, time, unittest
import platform
from datetime import date
from pathlib import Path
from replaysafe import Inbox, SyntheticProvider
from evidence_search import CASES, DOCS, search
from test_replaysafe import Reliability
from test_evidence_search import Retrieval
root = Path(__file__).resolve().parent.parent
fixture_dir = root / 'technical' / 'fixtures'
original = json.loads((fixture_dir / 'original-corpus.json').read_text())
current = json.loads(json.dumps({'cases': CASES, 'documents': [vars(d) for d in DOCS]}))
if current != original:
    raise SystemExit('The original questions, expected sources or corpus changed')
corpus_digest = hashlib.sha256(json.dumps(original, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
replay_tests = unittest.defaultTestLoader.loadTestsFromTestCase(Reliability).countTestCases()
retrieval_tests = unittest.defaultTestLoader.loadTestsFromTestCase(Retrieval).countTestCases()
suite = unittest.defaultTestLoader.discover(str(root / 'technical'), pattern='test_*.py')
with (root / 'evidence' / 'tests.txt').open('w') as log:
    r = unittest.TextTestRunner(stream=log, verbosity=2).run(suite)
if not r.wasSuccessful():
    raise SystemExit('Verification failed; inspect evidence/tests.txt')
with tempfile.TemporaryDirectory() as tmp:
    path = Path(tmp) / 'fixture.sqlite'
    box = Inbox(path)
    events = [{'id': f'evt-{i:04}', 'amount': 100 + i % 91} for i in range(1000)]
    deliveries = events + events + events[:500] + events[:100] + events[500:]
    random.Random(42).shuffle(deliveries)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as p:
        results = list(p.map(box.receive, deliveries))
    naive_ledger = []
    for event in deliveries:
        naive_ledger.append((event['id'], event['amount']))
    assert len(naive_ledger) == len(deliveries)
    p = SyntheticProvider(path, fail_once=[e['id'] for e in events[:25]], ambiguous_once=[e['id'] for e in events[25:50]])
    box.dispatch(p)
    box = Inbox(path)
    box.dispatch(p)
    counts = box.counts()
    assert counts['effects'] == 1000 and counts['sent'] == 1000 and (counts['pending'] == 0)
    replay = {'deliveries': len(deliveries), 'unique_events': 1000, 'naive_effects': len(naive_ledger), 'protected_effects': counts['effects'], 'naive_duplicates': len(deliveries) - 1000, 'protected_duplicates': counts['effects'] - 1000, 'provider_effects': counts['sent'], 'synthetic_transient_failures': 25, 'lost_acknowledgements': 25, 'parallel_receivers': 8, 'tests': 10, 'scope': 'Synthetic SQLite fixture; single dispatcher; downstream supports idempotency keys; not a production throughput benchmark'}
rows = []
for q, target in CASES:
    b = search(q, improved=False)
    a = search(q, improved=True)
    rows.append({'query': q, 'expected': target, 'baseline': [x['id'] for x in b], 'improved': [x['id'] for x in a], 'results': a})

def metrics(key, case_rows=None):
    case_rows = rows if case_rows is None else case_rows
    rr = [next((1 / (i + 1) for i, v in enumerate(r[key]) if v == r['expected']), 0) for r in case_rows]
    return {'top1_correct': sum((bool(r[key]) and r[key][0] == r['expected'] for r in case_rows)), 'recall_at_3': round(sum((v > 0 for v in rr)) / len(rr), 4), 'mrr_at_3': round(sum(rr) / len(rr), 4)}
retrieval = {'documents': len(DOCS), 'queries': len(rows), 'baseline': metrics('baseline'), 'improved': metrics('improved'), 'cases': rows, 'tests': 7, 'scope': 'Hand-authored synthetic policies and queries; lexical baseline vs domain normalization + BM25 + title boost. No LLM, embeddings or live client data. Same access filters in both pipelines. Performance does not establish generalization to real corpora.'}
additional = json.loads((fixture_dir / 'additional-retrieval.json').read_text())
additional_rows = []
for case in additional['cases']:
    b = search(case['query'], improved=False)
    a = search(case['query'])
    additional_rows.append({'query': case['query'], 'expected': case['expected'], 'baseline': [x['id'] for x in b], 'improved': [x['id'] for x in a], 'results': a})
replay['tests'] = replay_tests
retrieval['tests'] = retrieval_tests
retrieval['original_corpus_sha256'] = corpus_digest
retrieval['scope'] = 'Original hand-authored synthetic policies, questions and labels unchanged. Lexical baseline vs domain normalization, field-normalized lexical ranking and an explicit topical-title prior. No query-to-answer lookup, LLM, embeddings or live client data. Access filtering precedes scoring in both pipelines. Additional paraphrases are development checks, not a blind holdout. Performance does not establish generalization to real corpora.'
retrieval['additional_development_checks'] = {'queries': len(additional_rows), 'baseline': metrics('baseline', additional_rows), 'improved': metrics('improved', additional_rows), 'cases': additional_rows, 'scope': additional['scope']}
evidence = {'schema': 2, 'created': date.today().isoformat(), 'demo_label': 'Independent demonstrations / synthetic data', 'tests_passed': r.testsRun - len(r.skipped), 'tests_skipped': r.skipped, 'verified_environment': {'os': platform.system(), 'python': platform.python_version()}, 'replaysafe': replay, 'retrieval': retrieval}
(root / 'evidence' / 'results.json').write_text(json.dumps(evidence, indent=2) + '\n')
(root / 'evidence' / 'portfolio-data.js').write_text('window.STUDIO_EVIDENCE = ' + json.dumps(evidence) + ';\n')
inputs = list((root / 'technical').glob('*.py')) + list(fixture_dir.glob('*.json'))
manifest = {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(inputs)}
(root / 'evidence' / 'source-hashes.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'tests_passed': evidence['tests_passed'], 'tests_skipped': r.skipped, 'replay': replay, 'retrieval': {'queries': len(rows), 'baseline': metrics('baseline'), 'improved': metrics('improved'), 'additional_queries': len(additional_rows), 'additional_improved': metrics('improved', additional_rows), 'original_corpus_sha256': corpus_digest}}))
