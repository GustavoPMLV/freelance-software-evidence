import unittest,json
from pathlib import Path
from unittest.mock import patch
from evidence_search import search,DOCS,CASES,Document
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
    def test_original_44_queries_choose_the_expected_first_source(self):
        for query,expected in CASES:
            with self.subTest(query=query):
                found=search(query)
                self.assertTrue(found)
                self.assertEqual(found[0]['id'],expected)
    def test_additional_synthetic_paraphrases(self):
        fixture=json.loads((Path(__file__).parent/'fixtures/additional-retrieval.json').read_text())
        for case in fixture['cases']:
            with self.subTest(query=case['query']):
                self.assertEqual(search(case['query'])[0]['id'],case['expected'])
    def test_topic_title_outranks_an_incidental_body_word(self):
        docs=[Document('opening','Support hours','Opening hours are 09 to 17 on weekdays.'),
              Document('billing','Invoice history','Support files are available here.'),
              Document('region','Data region','The EU region stores demo records.')]
        with patch('evidence_search.DOCS',docs):
            self.assertEqual(search('When is support available?')[0]['id'],'opening')
    def test_download_does_not_override_invoice_context(self):
        docs=[Document('bill','Invoice receipts','The receipt is listed in billing.'),
              Document('records','Data export','Download your own records as CSV.')]
        with patch('evidence_search.DOCS',docs):
            self.assertEqual(search('Download receipts')[0]['id'],'bill')
    def test_invalid_result_limit_is_rejected(self):
        for k in [0,-1,True,1.5]:
            with self.subTest(k=k),self.assertRaises(ValueError):
                search('invoice',k=k)
    def test_limits_do_not_return_extra_results(self):
        for k in [1,2,3]:self.assertLessEqual(len(search('workspace account',k=k)),k)
    def test_permissions_apply_to_both_pipelines(self):
        for improved in [False,True]:
            self.assertEqual(search('invoice',role='admin',improved=improved),[])
            self.assertNotIn('other-tenant',[r['id'] for r in search('boreal region',improved=improved)])
            self.assertNotIn('admin-internal',[r['id'] for r in search('private owner runbook',improved=improved)])
    def test_empty_and_unknown_tenant_abstain(self):
        self.assertEqual(search('?! the of and'),[])
        self.assertEqual(search('invoice',tenant='missing'),[])
if __name__=='__main__':unittest.main()
