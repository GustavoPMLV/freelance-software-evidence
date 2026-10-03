"""ReplaySafe: reproducible integration reliability demonstration, synthetic data only."""
from __future__ import annotations
import hashlib,json,sqlite3,time
from pathlib import Path
from contextlib import contextmanager,closing

class Conflict(ValueError): pass
class RetryLater(Exception): pass

class Inbox:
    def __init__(self,path):
        self.path=str(path)
        with self.db() as c:
            c.executescript('''
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,digest TEXT NOT NULL,payload TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS effects(id TEXT PRIMARY KEY,amount INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,attempts INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending',error TEXT);
            CREATE TABLE IF NOT EXISTS sent(id TEXT PRIMARY KEY,payload TEXT NOT NULL);
            ''')
    @contextmanager
    def db(self):
        c=sqlite3.connect(self.path,timeout=20)
        try:
            c.execute('PRAGMA busy_timeout=20000')
            with c:
                yield c
        finally:
            c.close()
    def receive(self,event, fail_before_commit=False):
        if set(event)!={'id','amount'} or not isinstance(event['id'],str) or not event['id'] or type(event['amount']) is not int or event['amount']<0:
            raise ValueError('Invalid event schema')
        p=json.dumps(event,sort_keys=True,separators=(',',':'))
        digest=hashlib.sha256(p.encode()).hexdigest()
        with self.db() as c:
            c.execute('BEGIN IMMEDIATE')
            old=c.execute('SELECT digest FROM events WHERE id=?',(event['id'],)).fetchone()
            if old:
                if old[0]!=digest: raise Conflict('Event identity reused with different payload')
                return 'duplicate'
            c.execute('INSERT INTO events VALUES(?,?,?)',(event['id'],digest,p))
            c.execute('INSERT INTO effects VALUES(?,?)',(event['id'],event['amount']))
            c.execute('INSERT INTO outbox(id) VALUES(?)',(event['id'],))
            if fail_before_commit: raise RuntimeError('Synthetic failure before commit')
        return 'accepted'
    def dispatch(self,provider,max_attempts=3):
        # One dispatcher in this demonstration. Receiver concurrency is separately tested.
        with self.db() as c:
            ids=c.execute("SELECT id FROM outbox WHERE status='pending' ORDER BY id").fetchall()
        for (eid,) in ids:
            with self.db() as c:
                payload=json.loads(c.execute('SELECT payload FROM events WHERE id=?',(eid,)).fetchone()[0])
                n=c.execute('SELECT attempts FROM outbox WHERE id=?',(eid,)).fetchone()[0]+1
                c.execute('UPDATE outbox SET attempts=? WHERE id=?',(n,eid))
            try:
                provider.send(eid,payload)
            except Exception as e:
                with self.db() as c:
                    c.execute('UPDATE outbox SET status=?,error=? WHERE id=?',('dead' if n>=max_attempts else 'pending',type(e).__name__,eid))
            else:
                with self.db() as c:
                    c.execute("UPDATE outbox SET status='done',error=NULL WHERE id=?",(eid,))
    def counts(self):
        with self.db() as c:
            return {name:c.execute('SELECT COUNT(*) FROM '+name).fetchone()[0] for name in ['events','effects','outbox','sent']} | {'dead':c.execute("SELECT COUNT(*) FROM outbox WHERE status='dead'").fetchone()[0], 'pending':c.execute("SELECT COUNT(*) FROM outbox WHERE status='pending'").fetchone()[0]}

class SyntheticProvider:
    """Supports an idempotency key. No external network or real money."""
    def __init__(self,path,fail_once=(),fail_always=(),ambiguous_once=()):
        self.path=str(path); self.fail_once=set(fail_once); self.fail_always=set(fail_always); self.ambiguous=set(ambiguous_once)
    def send(self,key,payload):
        if key in self.fail_always: raise RetryLater('provider unavailable')
        if key in self.fail_once:
            self.fail_once.remove(key); raise RetryLater('transient failure')
        with closing(sqlite3.connect(self.path,timeout=20)) as c, c:
            c.execute('INSERT OR IGNORE INTO sent VALUES(?,?)',(key,json.dumps(payload,sort_keys=True)))
        if key in self.ambiguous:
            self.ambiguous.remove(key); raise RetryLater('provider committed; acknowledgement lost')
