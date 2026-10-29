from pathlib import Path
import datetime
import argparse
from urllib.parse import urlsplit
import hashlib
import importlib.util
import json
import sqlite3
import time
import uuid
from urllib.error import HTTPError
from urllib.request import Request, build_opener

parser = argparse.ArgumentParser(description='One native JSON generation per active OAuth connection with a fresh conversation session and verified selected identity')
parser.add_argument('--base', default='https://nexaomni.nexaconnect.cloud')
parser.add_argument('--database', type=Path, default=Path('/opt/nexaomni/data/storage.sqlite'))
parser.add_argument('--credentials', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--gemini-model', default='gemini-3.8-flash-low')
args = parser.parse_args()
parsed = urlsplit(args.base)
if (parsed.scheme != 'https' and not (parsed.scheme == 'http' and parsed.hostname in {'127.0.0.1','localhost'})) or not parsed.hostname or parsed.username or parsed.password or parsed.path not in ('','/') or parsed.query or parsed.fragment:
    parser.error('Use an HTTPS origin or isolated loopback candidate')
if args.credentials.stat().st_mode & 0o077:
    parser.error('Credentials must be private (mode 0600)')
if not args.output.parent.is_dir():
    parser.error('Output parent must exist')
args.output.touch(exist_ok=False,mode=0o600)
spec = importlib.util.spec_from_file_location('acceptance', Path(__file__).with_name('verify-api.py'))
acceptance = importlib.util.module_from_spec(spec)
spec.loader.exec_module(acceptance)
output = args.output
key = dict(line.split('=', 1) for line in args.credentials.read_text().splitlines() if '=' in line)['NEXAOMNI_API_KEY'].strip().strip("\"'")
db = sqlite3.connect(args.database.resolve(strict=True).as_uri()+'?mode=ro', uri=True)
db.row_factory = sqlite3.Row
rows = [dict(row) for row in db.execute("select id,provider,priority from provider_connections where is_active=1 and provider in ('agy','antigravity','claude','codex') order by provider,priority,created_at")]
db.close()
report = {'scope': 'One fresh native JSON inference per active OAuth connection; independent X-Session-Id prevents old affinity overriding a requested connection; actual selected connection must match',
          'started_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'results': []}
for row in rows:
    nonce = 'NEXA_OK_' + uuid.uuid4().hex[:10]
    prompt = 'Reply only with the exact text ' + nonce + '.'
    provider = row['provider']
    if provider in {'agy','antigravity'}:
        protocol, path = 'antigravity','/v1/antigravity'
        model = provider + '/' + args.gemini_model
        body = {'model':model,'stream':False,'request':{'contents':[{'role':'user','parts':[{'text':prompt}]}],
                'generationConfig':{'maxOutputTokens':256,'temperature':0,'thinkingConfig':{'thinkingBudget':0}}}}
    elif provider == 'claude':
        protocol,path,model = 'claude','/v1/messages','claude/claude-sonnet-5-5'
        body = {'model':model,'stream':False,'messages':[{'role':'user','content':prompt}],'max_tokens':256}
    else:
        protocol,path,model = 'responses','/v1/responses','codex/gpt-6.1-sol'
        body = {'model':model,'stream':False,'input':prompt,'reasoning':{'effort':'low'},'max_output_tokens':512}
    headers = {'Authorization':'Bearer '+key,'Content-Type':'application/json','x-omniroute-connection':row['id'],
               'User-Agent':'NexaOmniAccountAcceptance/1.0','X-Session-Id':'account-audit-'+uuid.uuid4().hex}
    start = time.monotonic()
    item = {'provider':provider,'priority':row['priority'],'model':model,
            'connection_reference':hashlib.sha256(row['id'].encode()).hexdigest()[:12]}
    try:
        request = Request(args.base.rstrip('/')+path,data=json.dumps(body).encode(),headers=headers)
        with build_opener(acceptance.NoRedirect()).open(request,timeout=90) as response:
            payload = response.read(acceptance.LIMIT+1)
            values = [json.loads(payload)] if len(payload)<=acceptance.LIMIT else []
            observed = acceptance.inspect(values,protocol,False)
            lower = {k.lower():v for k,v in response.headers.items()}
            selected = lower.get('x-omniroute-selected-connection-id')
            matched = selected == row['id']
            exact = observed['text'].strip().rstrip('.') == nonce
            terminal = bool(observed['finish_reasons']) and all(v in {'STOP','end_turn','stop_sequence','completed'} for v in observed['finish_reasons'])
            native = observed['native_envelopes'] if protocol=='antigravity' else True
            item.update(http_status=response.status,connection_verified=matched,exact_echo=exact,finish_reasons=observed['finish_reasons'],
                        request_id=lower.get('x-omniroute-request-id'),visible_characters=len(observed['text']),
                        passed=response.status==200 and matched and exact and terminal and native and not values[0].get('error'))
    except HTTPError as error:
        item.update(http_status=error.code,passed=False,error_type='HTTPError')
        error.close()
    except Exception as error:
        item.update(http_status=0,passed=False,error_type=type(error).__name__)
    item['seconds'] = round(time.monotonic()-start,3)
    report['results'].append(item)
    report['passed'] = all(r['passed'] for r in report['results'])
    report['finished_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    output.write_text(json.dumps(report,indent=2)+'\n')
    output.chmod(0o600)
    print(json.dumps({k:item.get(k) for k in ['provider','priority','passed','connection_verified','http_status','seconds']}),flush=True)
raise SystemExit(0 if report.get('passed',False) and len(rows)>0 else 1)
