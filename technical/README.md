# Independent reliability demonstrations

Run with Python 3.12+ and no third-party packages:

```bash
python3 run_evidence.py
```

All records, tenants, provider responses, documents and questions are synthetic. No API calls, live customer data or money movement occurs.

ReplaySafe receives duplicates concurrently into a durable SQLite inbox, commits a simulated business effect and outbox atomically, checks conflicting identities and recovers an outbox after restart. The synthetic provider supports idempotency keys; this is essential to the lost-acknowledgement result. The dispatcher is single-worker. This code is a small reproducible demonstration and requires provider-specific integration, operational limits and deployment review for client use.

EvidenceSearch evaluates 44 hand-authored queries against 24 synthetic policy documents. It compares exact-token overlap with domain term normalization, BM25 and a title boost. Both pipelines share tenant/role filtering. It tests permissions, out-of-domain abstention, exact citation provenance and deterministic ordering. No generative model or embedding service runs. The fixed authored evaluation set illustrates measurement and does not establish performance on a held-out real-world corpus.

The generated evidence/results.json records actual outcomes, evidence/tests.txt records executed checks, and source-hashes.json binds the evidence to the Python implementation.
