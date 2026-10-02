import concurrent.futures,json,tempfile,unittest
from pathlib import Path
from replaysafe import Inbox,SyntheticProvider,Conflict

class Reliability(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.path=Path(self.tmp.name)/'demo.sqlite';self.box=Inbox(self.path)
    def tearDown(self):self.tmp.cleanup()
    def test_duplicate_delivery(self):
        e={'id':'a','amount':120};self.assertEqual(self.box.receive(e),'accepted');self.assertEqual(self.box.receive(e),'duplicate');self.assertEqual(self.box.counts()['effects'],1)
    def test_identity_conflict(self):
        self.box.receive({'id':'a','amount':120})
        with self.assertRaises(Conflict):self.box.receive({'id':'a','amount':121})
        self.assertEqual(self.box.counts()['effects'],1)
    def test_invalid_payload_has_no_effect(self):
        for e in [{'id':'a','amount':True},{'id':'a','amount':-1},{'id':'a','amount':1,'unexpected':'x'},{'id':'','amount':1}]:
            with self.assertRaises(ValueError):self.box.receive(e)
        self.assertEqual(self.box.counts()['events'],0)
    def test_rollback_before_commit(self):
        e={'id':'a','amount':1}
        with self.assertRaises(RuntimeError):self.box.receive(e,True)
        self.assertEqual(self.box.counts()['effects'],0);self.box.receive(e);self.assertEqual(self.box.counts()['outbox'],1)
    def test_concurrent_replays(self):
        deliveries=[{'id':str(i%100),'amount':i%100} for i in range(500)]
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as p:r=list(p.map(self.box.receive,deliveries))
        self.assertEqual(r.count('accepted'),100);self.assertEqual(r.count('duplicate'),400);self.assertEqual(self.box.counts()['effects'],100)
    def test_restart_retains_inbox(self):
        self.box.receive({'id':'a','amount':1});other=Inbox(self.path);self.assertEqual(other.receive({'id':'a','amount':1}),'duplicate')
    def test_transient_retry(self):
        self.box.receive({'id':'a','amount':1});p=SyntheticProvider(self.path,fail_once=['a']);self.box.dispatch(p);self.assertEqual(self.box.counts()['pending'],1);self.box.dispatch(p);self.assertEqual(self.box.counts()['sent'],1)
    def test_lost_ack_does_not_duplicate_remote_effect(self):
        self.box.receive({'id':'a','amount':1});p=SyntheticProvider(self.path,ambiguous_once=['a']);self.box.dispatch(p);self.box.dispatch(p);self.assertEqual(self.box.counts()['sent'],1);self.assertEqual(self.box.counts()['pending'],0)
    def test_permanent_failure_reaches_dead_letter(self):
        self.box.receive({'id':'a','amount':1});p=SyntheticProvider(self.path,fail_always=['a'])
        for _ in range(4):self.box.dispatch(p)
        self.assertEqual(self.box.counts()['dead'],1);self.assertEqual(self.box.counts()['sent'],0)
    def test_persisted_outbox_recovers_after_restart(self):
        self.box.receive({'id':'a','amount':1});other=Inbox(self.path);other.dispatch(SyntheticProvider(self.path));self.assertEqual(other.counts()['sent'],1)

if __name__=='__main__':unittest.main()
