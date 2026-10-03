# Reproduce the software demonstrations

Python 3.12, standard library only. Extract the complete ZIP and run from its root:

    python3 technical/run_evidence.py

The suite executes 28 regression tests, then regenerates the 3,100-delivery ReplaySafe fixture and all 44 original plus 22 additional EvidenceSearch questions. The original corpus, queries and expected labels are frozen in technical/fixtures/original-corpus.json and checked before results are produced. Additional questions are development checks, not a blind holdout.

Results, per-question rankings, exact source excerpts, component test counts, environment, skipped tests (if any) and input hashes are recorded in evidence/. On the verified Linux/Python 3.12 environment all 28 tests passed without skips. A Linux /proc probe checks descriptor accumulation; on other systems that one probe is explicitly reported as skipped, never represented as passed.

ReplaySafe uses a temporary SQLite database, concurrent receivers, a single dispatcher and a synthetic provider with idempotency keys. Its resource test disables garbage collection to verify explicit connection closure. No external API, client records, financial transaction or paid model is used.

EvidenceSearch is a transparent lexical demonstration with tenant and role filtering before scoring. The first-source score is a ranking heuristic, not a calibrated confidence. Real-world deployment requires evaluation of the client's approved corpus and provider contracts.
