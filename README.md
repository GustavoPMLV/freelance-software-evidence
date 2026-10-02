# Gustavo Lima Verde · software evidence

[![Reproduce synthetic evidence](https://github.com/GustavoPMLV/freelance-software-evidence/actions/workflows/verify.yml/badge.svg)](https://github.com/GustavoPMLV/freelance-software-evidence/actions/workflows/verify.yml)

AI-assisted technical demonstrations with rerunnable tests, measured baselines and disclosed limits. Gustavo coordinates the project and its acceptance criteria; advanced AI tools support implementation, testing and documentation. These synthetic demonstrations are not claims of previous client work.

## ReplaySafe · retries without duplicate effects

![ReplaySafe results](assets/replaysafe.png)

A durable SQLite inbox/outbox handles event identity, concurrent duplicates, transactional effects, restarts, retries and explicit failures.

| Executed fixture | Outcome |
|---|---:|
| Deliveries / unique events | 3,100 / 1,000 |
| Concurrent receivers | 8 |
| Unprotected / protected extra effects | 2,100 / 0 |
| Transient failures / lost acknowledgements | 25 / 25 |
| Regression checks | 10 |

The downstream provider supports idempotency keys. One dispatcher is used. This fixture does not establish production throughput or a universal exactly-once guarantee. [Case and limits](portfolio/CASE_REPLAYSAFE.md) · [Implementation](technical/replaysafe.py).

## EvidenceSearch · measure document retrieval

![Document retrieval results](assets/evidence-search.png)

A scored pipeline is compared with exact-token lexical retrieval on 44 labeled questions and 24 synthetic policy documents. Both pipelines apply the same tenant and role filters.

| Metric | Baseline | Candidate |
|---|---:|---:|
| Correct first source | 31/44 | 42/44 |
| Recall at 3 | 0.8636 | 1.0000 |
| MRR at 3 | 0.7841 | 0.9773 |

Seven checks cover permissions, unknown roles, abstention, source excerpts and ordering. Two first-result errors remain visible. The authored fixture is not a held-out real-world evaluation. No LLM inference, embeddings or paid service runs. [Case and residual errors](portfolio/CASE_EVIDENCESEARCH.md) · [All query outcomes](evidence/results.json).

## Reproduce

Python 3.12+; standard library only.

```bash
git clone https://github.com/GustavoPMLV/freelance-software-evidence.git
cd freelance-software-evidence/technical
python3 run_evidence.py
```

This executes 17 regression tests and regenerates the synthetic results. Source hashes bind the evidence to the implementation. No live APIs, customer records or financial transactions are used.

To view the standalone English and Portuguese portfolio:

```bash
cd ..
python3 -m http.server 8766 --directory portfolio
```

Open `http://localhost:8766` or `http://localhost:8766/pt.html`. The brief builder prepares text locally and submits nothing.

## EngramaMed · own education product

[EngramaMed](https://engramamed.com.br) is Gustavo Lima Verde's personal platform for medical study and residency-exam preparation. This repository contains a link to the product; it does not contain EngramaMed's application source, authenticated screens, medical content or internal data. No user, revenue or clinical-outcome figures are claimed here.

## Português

Portfólio técnico de Gustavo Lima Verde com demonstrações reproduzíveis de proteção contra efeitos duplicados em webhooks e avaliação de busca documental. Dados sintéticos, resultados de testes executados e limites declarados. EngramaMed aparece como produto próprio de educação. A implementação utiliza apoio de IA, comunicação escrita e escopo combinado antes de cada trabalho.

[Perfil no Upwork](https://www.upwork.com/freelancers/~0153456be778467e4e)
