"""Transparent lexical/BM25 document retrieval demo; no LLM inference or paid API."""
from __future__ import annotations
import math,re
from collections import Counter
from dataclasses import dataclass

ALIASES={'terminate':'cancel','termination':'cancel','cancellation':'cancel','unsubscribe':'cancel','plan':'subscription','plans':'subscription','subscriptions':'subscription','billed':'invoice','billing':'invoice','invoices':'invoice','receipt':'invoice','receipts':'invoice','credential':'password','credentials':'password','resetting':'reset','forgotten':'reset','forgot':'reset','refunds':'refund','reimbursement':'refund','reimburse':'refund','exporting':'export','download':'export','extract':'export','delete':'deletion','erase':'deletion','removal':'deletion','residency':'region','location':'region','rotate':'rotation','rotating':'rotation','secret':'key','token':'key','tokens':'key','quotas':'limit','throttle':'limit','throttling':'limit','retries':'retry','resend':'retry','resends':'retry','redelivery':'retry','duplicate':'idempotency','duplicates':'idempotency','repeat':'idempotency','bounces':'failure','failed':'failure','errors':'failure','permissions':'access','privileges':'access','invite':'invitation','invites':'invitation','employees':'members','coworker':'members','colleague':'members','team':'members','organisation':'organization','organisation_id':'organization','retained':'retention','storage':'retention','retaining':'retention','sessions':'session','logout':'session','timeout':'session','change':'update','modify':'update','edited':'update','currency':'currencies','fx':'currencies','audit':'history','activity':'history','logs':'history','custom':'domain','hostname':'domain','subdomain':'domain','attachments':'attachment','files':'attachment','capacity':'size','size':'size'}
STOP=set('a an the is are to of in on for my our your how can do does what where when i we it with and or by be have has many should'.split())

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
    if role not in ['member','owner']:return []
    docs=[d for d in DOCS if permitted(d,tenant,role)]
    qt=tokens(query,improved); terms=[tokens(d.text,improved) for d in docs]; n=len(docs)
    if not qt or not n:return []
    avg=sum(map(len,terms))/n
    df=Counter(t for ts in terms for t in set(ts));out=[]
    for d,ts in zip(docs,terms):
        c=Counter(ts)
        if improved:
            coverage=len(set(qt)&set(ts))/len(set(qt))
            if coverage<.25:continue
            score=sum(math.log(1+(n-df[t]+.5)/(df[t]+.5))*c[t]*2.2/(c[t]+1.2*(.25+.75*len(ts)/avg)) for t in qt if c[t])
            score*=1+sum(t in tokens(d.title,True) for t in set(qt))*.25
        else:score=sum(c[t] for t in qt)
        if score:out.append({'id':d.id,'title':d.title,'score':round(score,6),'excerpt':d.body,'tenant':d.tenant,'source':'synthetic-policy/'+d.id})
    return sorted(out,key=lambda v:(-v['score'],v['id']))[:k]

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
