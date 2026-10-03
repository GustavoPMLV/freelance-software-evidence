# EvidenceSearch: verified document retrieval

Independent engineering demonstration using synthetic policies and questions. Updated on 2026-10-03.

## Result on the original, unchanged evaluation

| Metric | Exact-token baseline | Revised lexical pipeline |
|---|---:|---:|
| Correct first source | 31/44 | 44/44 |
| Recall at 3 | 86.4% | 100% |
| MRR at 3 | 0.7841 | 1.0000 |

All **44 original questions now return the expected first source**. The previous version scored 42/44; both previously incorrect first-source choices are corrected. The 24 original documents, 44 queries and expected-source labels remain unchanged. The corpus digest is `a59178860cbbed932978b83490cc7371b35d987dd44fc04c81d5b96d81eab46f`.

A separate set of **22 additional synthetic development questions** also scores **22/22**. These questions were used during development, so they are not a blind holdout or an independent production benchmark.

## What changed and why

The word "download" no longer implies the data-export topic: invoice receipts can also be downloaded. Titles and bodies are scored separately with field-normalized lexical ranking. A matching topic in a document title takes priority over an incidental body mention. Existing repeat/idempotency normalization also handles inflected forms. Returned scores express ranking, not a probability of correctness.

The search function does not read expected answers or route queries through an answer table. Access filters run before scoring and frequency calculation, in both baseline and revised pipelines. Excerpts are copied from the actual permitted source.

## Executed verification

**15 retrieval tests** cover all 44 original cases, the 22 additional phrases, reproduction of both ranking defects, topical titles versus incidental mentions, result-limit validation, tenant/role boundaries in both pipelines, unsupported-query abstention, exact excerpts, reproducibility and ordering. The full suite has **28 passing tests and no skipped tests** in the recorded Linux/Python environment.

## Scope and reproduction

A standard-library Python implementation; no LLM, embedding API, network requests or client records. Results establish correctness for these synthetic fixtures. A real corpus requires its own approved evaluation set and acceptance criteria.

Download `reproducible-demos.zip`, extract it and run `python3 technical/run_evidence.py`. `evidence/results.json` contains every original and additional outcome; `evidence/source-hashes.json` binds the evidence to the code and frozen fixtures.
