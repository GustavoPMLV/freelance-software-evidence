# EvidenceSearch — measured document retrieval

Independent engineering demonstration. All policies and evaluation questions are synthetic.

## Business problem
A document assistant can return a convincing answer based on the wrong source. Retrieval needs its own evaluation, explicit access controls and traceable evidence.

## Demonstrated result
A fixed authored set of **44 questions across 24 documents** was executed against two transparent retrieval pipelines. The exact-token baseline selected the correct source first in **31 of 44 cases (70.5%)**. Domain term normalization, BM25 scoring and a title boost selected it first in **42 of 44 cases (95.5%)**. Recall at three increased from **86.4% to 100% on this fixture**.

Seven executed checks cover tenant scoping, role-based document access, unknown-role denial, unsupported-query abstention, exact source excerpts, reproducibility and ordering. The two remaining first-result errors are retained in the evidence rather than hidden.

## Delivery approach
Freeze the labeled evaluation set, measure a baseline, change the retrieval pipeline, compare results and inspect the residual failures. Both pipelines use the same access filters. Every returned excerpt links to its actual synthetic source.

## Limits
No generative model or paid embedding API runs in this demonstration. These are hand-authored fixture results, not a held-out production benchmark or proof of generalization. The abstention threshold is a demo mechanism, not a calibrated probability of correctness. Client evaluation requires a representative approved corpus and independently reviewed expected answers.

## Project fit
Document search or AI systems that need a retrieval diagnostic, source-quality evaluation and explicit regression criteria.

## Reproduction
Download reproducible-demos.zip, read technical/README.md and run python3 technical/run_evidence.py. All 44 question-level outcomes are included.
