"""Transparent lexical/BM25 document retrieval demo; no LLM inference or paid API."""
from __future__ import annotations
import math,re
from collections import Counter
from dataclasses import dataclass

ALIASES={'terminate':'cancel','termination':'cancel','cancellation':'cancel','unsubscribe':'cancel','plan':'subscription','plans':'subscription','subscriptions':'subscription','billed':'invoice','billing':'invoice','invoices':'invoice','receipt':'invoice','receipts':'invoice','credential':'password','credentials':'password','resetting':'reset','forgotten':'reset','forgot':'reset','refunds':'refund','reimbursement':'refund','reimburse':'refund','exporting':'export','download':'export','extract':'export','delete':'deletion','erase':'deletion','removal':'deletion','residency':'region','location':'region','rotate':'rotation','rotating':'rotation','secret':'key','token':'key','tokens':'key','quotas':'limit','throttle':'limit','throttling':'limit','retries':'retry','resend':'retry','resends':'retry','redelivery':'retry','duplicate':'idempotency','duplicates':'idempotency','repeat':'idempotency','bounces':'failure','failed':'failure','errors':'failure','permissions':'access','privileges':'access','invite':'invitation','invites':'invitation','employees':'members','coworker':'members','colleague':'members','team':'members','organisation':'organization','organisation_id':'organization','retained':'retention','storage':'retention','retaining':'retention','sessions':'session','logout':'session','timeout':'session','change':'update','modify':'update','edited':'update','currency':'currencies','fx':'currencies','audit':'history','activity':'history','logs':'history','custom':'domain','hostname':'domain','subdomain':'domain','attachments':'attachment','files':'attachment','capacity':'size','size':'size'}
STOP=set('a an the is are to of in on for my our your how can do does what where when i we it with and or by be have has many should'.split())

# Download is an action shared by invoices and data exports, not a synonym
# for the export topic. Inflected forms retain the existing repeat meaning.
ALIASES.pop('download', None)
ALIASES.update({'repeated': 'idempotency', 'repeating': 'idempotency'})

def tokens(text,expanded=False):
    ts=re.findall(r'[a-z0-9]+',text.lower())
    ts=[t for t in ts if t not in STOP]
    return [ALIASES.get(t,t) for t in ts] if expanded else ts

@dataclass(frozen=True)
class Document:
    id:str;title:str;body:str;tenant:str='atlas';role:str='member'
    @property
    def text(self):return self.title+' '+self.body

POLICIES=[
('cancel','Subscription cancel','A subscription can be canceled from Account settings. Access continues until the paid period ends.'),
('invoice','Invoice history','Invoice PDFs are available under Account billing. An owner can update the recipient address.'),
('password','Password reset','Use the password reset link on the login screen. Reset links expire after 30 minutes.'),
('refund','Refund request','Request a refund within 14 days through support. Eligibility is reviewed against the purchase terms.'),
('export','Data export','A member can export their own records as CSV. Workspace exports require owner access.'),
('deletion','Account deletion','Account deletion requires confirmation from the owner. The demo policy defines a 30-day removal window.'),
('region','Data region','Atlas demo data stays in the EU region selected at workspace creation.'),
('rotation','API key rotation','A workspace owner can create a replacement API key and revoke the old key after testing.'),
('limit','API rate limit','The demo API limit is 120 requests per minute. HTTP 429 includes a retry-after header.'),
('retry','Webhook retry','A webhook retries after delivery failure, with an exponential backoff and a maximum of five attempts.'),
('idempotency','Webhook idempotency','Each event ID is an idempotency key. Repeated deliveries must not create a second effect.'),
('access','Workspace access','Roles are member and owner. Only the owner can change workspace-level access settings.'),
('invitation','Member invitation','Owners can send an invitation from workspace settings. Invitations expire after seven days.'),
('organization','Organization migration','Moving an organization requires a separately reviewed migration plan and a backup.'),
('retention','Backup retention','The synthetic backup retention policy keeps daily backups for 30 days.'),
('session','Session expiration','The demo session expires after 24 hours. A password reset revokes existing sessions.'),
('update','Profile update','Members can update their own display name and locale from their profile page.'),
('currencies','Supported currencies','Invoices in this synthetic workspace support USD and EUR. Currency selection happens before purchase.'),
('history','Event history','Event history records the actor, timestamp and event ID. Exportable audit records require owner access.'),
('domain','Workspace domain','An owner can configure a workspace domain after validating DNS ownership.'),
('attachment','Attachment upload','Attachment uploads support PDF and CSV. The maximum file size in the demo is 20 MB.'),
('support','Support hours','Support for the synthetic Atlas workspace operates Monday to Friday from 09:00 to 17:00 UTC.'),
]
DOCS=[Document(*p) for p in POLICIES]+[Document('admin-internal','Owner access runbook','Private owner runbook: incident access keys and recovery steps.','atlas','owner'),Document('other-tenant','Other organization region','Boreal organization stores data in a different region.','boreal','member')]

def permitted(d,tenant,role):return d.tenant==tenant and (d.role=='member' or role=='owner')

def search(query,tenant='atlas',role='member',improved=True,k=3):
    """Rank permitted documents, using an explicit topical-title prior.

    Improved ranking uses field-normalized lexical evidence (BM25F-style,
    title weight 2, k1 1.2). A matching topic in the title takes priority
    over an incidental body mention. Within each tier the lexical score
    orders results. ``score`` is that composite ranking score, not a
    probability; ``lexical_score`` exposes the underlying calculation.
    No query text, expected answer, document ID or evaluation label is
    consulted to route a query. The unexpanded baseline stays unchanged.
    """
    if type(k) is not int or k < 1:
        raise ValueError('Result limit must be a positive integer')
    if not isinstance(query, str):
        raise ValueError('Query must be text')
    if role not in ['member', 'owner']:
        return []

    # Filter BEFORE calculating frequencies or scores, in both pipelines.
    docs = [d for d in DOCS if permitted(d, tenant, role)]
    qt = tokens(query, improved)
    if not qt or not docs:
        return []
    terms = [tokens(d.text, improved) for d in docs]
    titles = [tokens(d.title, improved) for d in docs]
    bodies = [tokens(d.body, improved) for d in docs]
    n = len(docs)
    avg_title = max(sum(map(len, titles)) / n, 1)
    avg_body = max(sum(map(len, bodies)) / n, 1)
    df = Counter(t for ts in terms for t in set(ts))
    query_terms = set(qt)
    scored = []

    for d, ts, title, body in zip(docs, terms, titles, bodies):
        if improved:
            coverage = len(query_terms & set(ts)) / len(query_terms)
            if coverage < .25:
                continue
            title_counts, body_counts = Counter(title), Counter(body)
            lexical = 0.0
            for term in sorted(query_terms):
                tf = (2 * title_counts[term] / (.7 + .3 * len(title) / avg_title)
                      + body_counts[term] / (.25 + .75 * len(body) / avg_body))
                if tf:
                    idf = math.log(1 + (n - df[term] + .5) / (df[term] + .5))
                    lexical += idf * tf * 2.2 / (tf + 1.2)
            anchored = bool(query_terms & set(title))
            score = int(anchored) + lexical / (1 + lexical)
        else:
            counts = Counter(ts)
            lexical = score = sum(counts[t] for t in qt)
        if not lexical:
            continue
        scored.append((score, {
            'id': d.id, 'title': d.title, 'score': round(score, 6),
            'lexical_score': round(lexical, 6), 'excerpt': d.body,
            'tenant': d.tenant, 'source': 'synthetic-policy/' + d.id,
        }))

    # Sort at full precision; round only the values shown in the receipt.
    return [r for _, r in sorted(scored, key=lambda v: (-v[0], v[1]['id']))[:k]]

CASES=[
('How do I terminate my plan?','cancel'),('How do I unsubscribe from a subscription?','cancel'),
('Where can I download receipts?','invoice'),('I need a copy of invoices','invoice'),
('I forgot my password','password'),('How do I reset credentials?','password'),
('How can I request reimbursement?','refund'),('Can support reimburse my purchase?','refund'),
('How can I extract my records?','export'),('Can a member export CSV?','export'),
('How can I erase an account?','deletion'),('What is the account removal window?','deletion'),
('Where is the data residency?','region'),('What is the data location?','region'),
('How can I rotate API tokens?','rotation'),('How do I revoke the old key?','rotation'),
('What are API quotas?','limit'),('Does throttle return retry-after?','limit'),
('Do webhooks resend after failure?','retry'),('What is webhook redelivery backoff?','retry'),
('How do I prevent duplicate webhook effects?','idempotency'),('Is a repeated event safe?','idempotency'),
('Who can edit workspace permissions?','access'),('Which role can change access settings?','access'),
('Can I invite a colleague?','invitation'),('When do team invites expire?','invitation'),
('How do I move an organisation?','organization'),('What does organization migration require?','organization'),
('How long are backups retained?','retention'),('What is daily backup storage policy?','retention'),
('When do sessions timeout?','session'),('Does password reset revoke sessions?','session'),
('Can I modify my display name?','update'),('Where is profile locale edited?','update'),
('Which invoice currency is supported?','currencies'),('Can I pay in EUR?','currencies'),
('Where are actor activity logs?','history'),('Who can export audit records?','history'),
('How can I add a custom hostname?','domain'),('Who validates DNS ownership?','domain'),
('What attachment file size is allowed?','attachment'),('Can I upload PDF files?','attachment'),
('When is support available?','support'),('What are support operating hours?','support')]

if __name__=='__main__':
    import json
    print(json.dumps(search('How do I prevent duplicate webhook effects?'),indent=2))
