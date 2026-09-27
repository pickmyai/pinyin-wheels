#!/usr/bin/env python3
"""Pre-generate every game syllable with Azure TTS; --check is offline."""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets/pinyin/audio/azure-v1'
MANIFEST = OUTPUT / 'manifest.json'
VOICE = 'zh-CN-XiaoxiaoNeural'
FORMAT = 'audio-24khz-96kbitrate-mono-mp3'
RATE = '-25%'


def words():
    source = (ROOT / 'pinyin_wheels.js').read_text()
    rows = re.findall(r"\{id:'([^']+)',i:'([^']+)',f:'([^']+)',t:(\d),h:'([^']+)'", source)
    if not rows or len(rows) != source.count("{id:"):
        raise ValueError('Word-bank format changed; review the audio generator.')
    result = []
    for key, initial, final, tone, hanzi in rows:
        pinyin = initial + final.replace('ü', 'v')
        if key != pinyin + tone or tone not in '1234':
            raise ValueError(f'Invalid syllable: {key}')
        result.append({'id': key, 'character': hanzi, 'phoneme': f'{pinyin} {tone}'})
    if len({w['id'] for w in result}) != len(result):
        raise ValueError('Duplicate audio IDs')
    return result


def ssml(word):
    return (f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">'
            f'<voice name="{VOICE}"><prosody rate="{RATE}">'
            f'<phoneme alphabet="sapi" ph="{word["phoneme"]}">{escape(word["character"])}</phoneme>'
            '</prosody></voice></speak>')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def probe(path):
    result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries',
                             'format=duration:stream=codec_name,sample_rate,channels',
                             '-of', 'json', str(path)], capture_output=True, text=True, check=True)
    info = json.loads(result.stdout)
    stream = info['streams'][0]
    duration = float(info['format']['duration'])
    if stream['codec_name'] != 'mp3' or stream['sample_rate'] != '24000' or stream['channels'] != 1 or not .2 < duration < 4:
        raise ValueError(f'Unexpected audio format/duration: {path.name}')
    return round(duration, 3)


def valid(word, entry):
    path = OUTPUT / f'{word["id"]}.mp3'
    return (entry and path.is_file() and path.stat().st_size > 1000
            and entry.get('request_sha256') == sha(ssml(word).encode())
            and entry.get('sha256') == sha(path.read_bytes()))


def credentials(env_file):
    config = {}
    if env_file:
        for line in Path(env_file).read_text().splitlines():
            name, sep, value = line.partition('=')
            if sep and name.strip() in ('AZURE_TTS_KEY', 'AZURE_TTS_URL'):
                config[name.strip()] = value.strip().strip('\"\'')
    for name in ('AZURE_TTS_KEY', 'AZURE_TTS_URL'):
        if os.environ.get(name): config[name] = os.environ[name]
    key = config.get('AZURE_TTS_KEY')
    url = config.get('AZURE_TTS_URL', '')
    host = urlparse(url)
    if not key or host.scheme != 'https' or not (host.hostname or '').endswith('.tts.speech.microsoft.com') or host.path != '/cognitiveservices/v1':
        raise ValueError('Configure AZURE_TTS_KEY and the regional HTTPS AZURE_TTS_URL.')
    return key, url


def synthesize(word, key, url):
    request = Request(url, data=ssml(word).encode(), headers={
        'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': FORMAT, 'User-Agent': 'PinyinWheels-AudioBuilder'})
    for attempt in range(4):
        try:
            with urlopen(request, timeout=45) as response:
                data = response.read()
                if not response.headers.get('Content-Type', '').startswith('audio/') or len(data) < 1000:
                    raise ValueError(f'Azure returned no valid audio for {word["id"]}')
                return data
        except HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 3:
                raise RuntimeError(f'Azure HTTP {error.code} for {word["id"]}') from None
        except (URLError, TimeoutError):
            if attempt == 3: raise RuntimeError(f'Azure connection failed for {word["id"]}') from None
        time.sleep(2 ** attempt)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env-file', help='Read only AZURE_TTS_KEY and AZURE_TTS_URL from this local file')
    parser.add_argument('--only', nargs='+', help='Generate a subset for an initial voice check')
    parser.add_argument('--check', action='store_true', help='Verify all assets and hashes; no Azure requests')
    args = parser.parse_args()
    bank = words()
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {'provider': 'Azure AI Speech', 'voice': VOICE, 'format': FORMAT, 'rate': RATE, 'alphabet': 'sapi', 'clips': {}}
    if args.check:
        if any(manifest.get(k) != v for k, v in {'provider': 'Azure AI Speech', 'voice': VOICE, 'format': FORMAT, 'rate': RATE, 'alphabet': 'sapi'}.items()):
            raise ValueError('Manifest synthesis settings are stale.')
        failures = [w['id'] for w in bank if not valid(w, manifest['clips'].get(w['id']))]
        if failures: raise ValueError('Missing/stale audio: ' + ', '.join(failures))
        for word in bank: probe(OUTPUT / f'{word["id"]}.mp3')
        print(f'PASS: {len(bank)}/{len(bank)} Azure clips match the word bank, SSML, SHA-256 and audio format.')
        return
    manifest.update({'provider': 'Azure AI Speech', 'voice': VOICE, 'format': FORMAT, 'rate': RATE, 'alphabet': 'sapi'})
    key, url = credentials(args.env_file)
    selected = [w for w in bank if not args.only or w['id'] in args.only]
    if args.only and set(args.only) != {w['id'] for w in selected}: raise ValueError('Unknown --only IDs')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    generated = 0
    for word in selected:
        if valid(word, manifest['clips'].get(word['id'])): continue
        data = synthesize(word, key, url)
        path = OUTPUT / f'{word["id"]}.mp3'
        temporary = path.with_suffix('.tmp.mp3')
        temporary.write_bytes(data)
        duration = probe(temporary)
        temporary.replace(path)
        manifest['clips'][word['id']] = {**word, 'file': path.name, 'bytes': len(data), 'duration_seconds': duration,
            'request_sha256': sha(ssml(word).encode()), 'sha256': sha(data), 'generated_at': datetime.now(timezone.utc).isoformat()}
        tmp_manifest = MANIFEST.with_suffix('.tmp.json')
        tmp_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        tmp_manifest.replace(MANIFEST)
        generated += 1
        print(f'Generated {word["id"]}: {duration}s ({generated}/{len(selected)})', flush=True)
    print(f'Complete: {generated} generated; {len(selected) - generated} reused.')


if __name__ == '__main__':
    try: main()
    except (ValueError, RuntimeError, OSError, subprocess.CalledProcessError) as error:
        print(f'Audio generation failed: {error}', file=sys.stderr)
        sys.exit(1)
