# ReplaySafe — duplicate-resistant event processing

Independent engineering demonstration. All data and provider behavior are synthetic.

## Business problem
A network retry can deliver the same event more than once. If every delivery creates a new business effect, the result can be duplicate records, repeated fulfillment or inconsistent state.

## Demonstrated result
The executed fixture sent **3,100 deliveries representing 1,000 unique events** through **8 concurrent receiver threads**. An unprotected append-per-delivery baseline recorded **2,100 excess effects**. The durable inbox/outbox implementation recorded **1,000 effects with zero duplicates**. A synthetic downstream provider recorded 1,000 unique effects after 25 transient failures and 25 committed requests with lost acknowledgements.

Ten executed regression tests cover duplicate delivery, identity conflict, input validation, transaction rollback, concurrent replay, restart, transient failures, lost acknowledgements, dead letters and outbox recovery.

## Delivery approach
Validate identity and payload, commit the durable inbox, business effect and outbox atomically, then send downstream with an idempotency key. Handle retries and explicitly surface permanent failures.

## Limits
This is a small SQLite demonstration with a single dispatcher and a provider that supports idempotency keys. It is not a production throughput benchmark or a universal exactly-once guarantee. A real provider's semantics and operational constraints must be investigated before quoting or deployment.

## Project fit
API/webhook integrations in which duplicates, partial failures or restart recovery affect business workflows. A paid diagnostic first establishes provider behavior and acceptance criteria.

## Reproduction
Download reproducible-demos.zip, read technical/README.md and run python3 technical/run_evidence.py. Results and code hashes are included.
