#!/usr/bin/env python3
"""Give isolated Azure third-tone syllables an audible fall and rise."""
import argparse
import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import parselmouth
from parselmouth.praat import call

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/pinyin/audio/azure-v1'
OUTPUT = ROOT / 'assets/pinyin/audio/third-tone-v2'
MANIFEST = OUTPUT / 'manifest.json'
PROFILE = 'isolated-third-tone-dip-rise-v1'
CONTOUR = ((0, 1.05), (.22, .90), (.55, .78), (.72, .80), (1, 1.27))
SETTINGS = {'profile': PROFILE, 'contour': CONTOUR, 'vowel_duration_peak': 1.5}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def third_tone_ids():
    source = (ROOT / 'pinyin_wheels.js').read_text()
    ids = re.findall(r"\{id:'([^']+)'", source)
    if not ids or len(ids) != source.count('{id:'):
        raise ValueError('Word-bank format changed; review the third-tone builder.')
    return sorted(key for key in ids if key.endswith('3'))


def pitch_track(sound):
    pitch = sound.to_pitch_ac(time_step=.01, pitch_floor=95, pitch_ceiling=500)
    hz = pitch.selected_array['frequency']
    voiced = hz > 0
    if voiced.sum() < 15:
        raise ValueError('Too few voiced frames to shape the third tone')
    times = pitch.xs()[voiced]
    return float(times[0]), float(times[-1]), float(np.median(hz[voiced]))


def shape(source, destination):
    with tempfile.TemporaryDirectory() as directory:
        wav = Path(directory) / 'source.wav'
        shaped_wav = Path(directory) / 'shaped.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source),
                        '-ar', '24000', '-ac', '1', str(wav)], check=True)
        sound = parselmouth.Sound(str(wav))
        start, end, baseline = pitch_track(sound)
        manipulation = call(sound, 'To Manipulation', .01, 75, 600)
        pitch_tier = call(manipulation, 'Extract pitch tier')
        call(pitch_tier, 'Remove points between', 0, sound.duration)
        for fraction, multiplier in CONTOUR:
            call(pitch_tier, 'Add point', start + (end - start) * fraction,
                 baseline * multiplier)
        call([pitch_tier, manipulation], 'Replace pitch tier')
        duration_tier = call(manipulation, 'Extract duration tier')
        for time, multiplier in ((start + .01, 1), (start + .08, 1.5),
                                 (end - .07, 1.5), (end, 1)):
            call(duration_tier, 'Add point', time, multiplier)
        call([duration_tier, manipulation], 'Replace duration tier')
        call(manipulation, 'Get resynthesis (overlap-add)').save(str(shaped_wav), 'WAV')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(shaped_wav),
                        '-ar', '24000', '-ac', '1', '-b:a', '96k',
                        '-map_metadata', '-1', str(destination)], check=True)
    return round(baseline, 1)


def verify_sound(path):
    with tempfile.NamedTemporaryFile(suffix='.wav') as wav:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(path),
                        '-ar', '24000', '-ac', '1', wav.name], check=True)
        sound = parselmouth.Sound(wav.name)
        if not .3 < sound.duration < 3 or np.max(np.abs(sound.values)) >= .98:
            raise ValueError(f'{path.name}: invalid duration or clipped audio')
        pitch = sound.to_pitch_ac(time_step=.01, pitch_floor=95, pitch_ceiling=500)
        times, hz = pitch.xs(), pitch.selected_array['frequency']
        voiced = hz > 0
        start, end = times[voiced][0], times[voiced][-1]
        span = end - start
        def median(a, b):
            section = hz[voiced & (times >= start + span * a)
                         & (times <= start + span * b)]
            return float(np.median(section))
        early, valley, late = median(0, .2), median(.4, .65), median(.82, 1)
        if early - valley < 20 or late - valley < 35:
            raise ValueError(f'{path.name}: third-tone fall/rise is too weak')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify assets without editing them')
    args = parser.parse_args()
    source_manifest = json.loads((SOURCE / 'manifest.json').read_text())['clips']
    ids = third_tone_ids()
    entries = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {'settings': SETTINGS, 'clips': {}}
    settings_match = entries.get('settings') == json.loads(json.dumps(SETTINGS))
    if args.check and not settings_match:
        raise ValueError('Third-tone processing settings are stale')
    entries['settings'] = SETTINGS
    if args.check and set(entries['clips']) != set(ids):
        raise ValueError('Third-tone manifest does not match the word bank')
    if not args.check:
        OUTPUT.mkdir(parents=True, exist_ok=True)
    for key in ids:
        source = SOURCE / f'{key}.mp3'
        output = OUTPUT / f'{key}.mp3'
        if sha(source) != source_manifest[key]['sha256']:
            raise ValueError(f'{key}: Azure source differs from its manifest')
        previous = entries['clips'].get(key, {})
        current = (settings_match and previous.get('source_sha256') == sha(source)
                   and output.is_file() and previous.get('sha256') == sha(output))
        if args.check:
            if not current:
                raise ValueError(f'{key}: missing or stale processed clip')
            verify_sound(output)
        elif not current:
            with tempfile.NamedTemporaryFile(suffix='.mp3', dir=OUTPUT, delete=False) as temporary:
                temp_path = Path(temporary.name)
            try:
                baseline = shape(source, temp_path)
                verify_sound(temp_path)
                temp_path.replace(output)
            finally:
                temp_path.unlink(missing_ok=True)
            entries['clips'][key] = {'source_sha256': sha(source), 'sha256': sha(output),
                                     'baseline_hz': baseline}
            print(f'Processed {key}', flush=True)
    if args.check:
        print(f'PASS: {len(ids)} third-tone clips match their Azure sources and SHA-256 hashes.')
    else:
        MANIFEST.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n')
        print(f'Complete: {len(ids)} third-tone clips ready.')


if __name__ == '__main__':
    main()
