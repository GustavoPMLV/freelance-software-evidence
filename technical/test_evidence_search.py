import unittest
from evidence_search import search,DOCS
class Retrieval(unittest.TestCase):
    def test_cross_tenant_filter(self):
        self.assertTrue(all(r['tenant']=='atlas' for r in search('region organization')))
        self.assertNotIn('other-tenant',[r['id'] for r in search('boreal region organization')])
    def test_owner_document_hidden_from_members(self):
        self.assertNotIn('admin-internal',[r['id'] for r in search('Private owner runbook incident keys',role='member')])
        self.assertIn('admin-internal',[r['id'] for r in search('Private owner runbook incident keys',role='owner')])
    def test_unknown_role_is_denied(self):self.assertEqual(search('invoice',role='admin'),[])
    def test_unsupported_query_abstains(self):self.assertEqual(search('quantum asteroid thermodynamics'),[])
    def test_citations_are_exact_source_excerpts(self):
        for r in search('invoice PDF'):
            d=next(d for d in DOCS if d.id==r['id']);self.assertEqual(r['excerpt'],d.body);self.assertEqual(r['source'],'synthetic-policy/'+d.id)
    def test_reproducibility(self):self.assertEqual(search('rotate API tokens'),search('rotate API tokens'))
    def test_score_order(self):
        r=search('Webhook retry backoff');self.assertEqual(r[0]['id'],'retry');self.assertEqual([v['score'] for v in r],sorted([v['score'] for v in r],reverse=True))
if __name__=='__main__':unittest.main()
