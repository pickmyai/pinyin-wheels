#!/usr/bin/env python3
"""Process and import genuine human third-tone recordings into Pinyin Wheels."""
import argparse
import hashlib
import json
import math
import os
import re
import struct
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RECORDINGS_DIR = Path('/Users/frankie/Pickmy Project/pinyin-wheels-complete-recordings-2026-09-28')
OUTPUT_DIR = ROOT / 'assets/pinyin/audio/third-tone-v3'
MANIFEST_FILE = OUTPUT_DIR / 'manifest.json'


def third_tone_ids():
    source = (ROOT / 'pinyin_wheels.js').read_text()
    ids = re.findall(r"\{id:'([^']+)'", source)
    if not ids or len(ids) != source.count('{id:'):
        raise ValueError('Word-bank format changed; review word list in pinyin_wheels.js.')
    return sorted(key for key in ids if key.endswith('3'))


def detect_speech_bounds(samples, sample_rate, threshold=0.015, pad_start=0.06, pad_end=0.08):
    frame_size = int(sample_rate * 0.02)  # 20ms frames
    frames_rms = []
    for i in range(0, len(samples), frame_size):
        chunk = samples[i:i + frame_size]
        if not chunk:
            continue
        rms = math.sqrt(sum(s * s for s in chunk) / len(chunk)) / 32768.0
        frames_rms.append(rms)

    start_frame = None
    for idx, r in enumerate(frames_rms):
        if r >= threshold:
            start_frame = idx
            break

    end_frame = None
    for idx in range(len(frames_rms) - 1, -1, -1):
        if frames_rms[idx] >= threshold:
            end_frame = idx + 1
            break

    if start_frame is None or end_frame is None:
        return 0.0, len(samples) / sample_rate

    start_sec = max(0.0, start_frame * 0.02 - pad_start)
    end_sec = min(len(samples) / sample_rate, end_frame * 0.02 + pad_end)
    return start_sec, end_sec


def process_clip(wav_path, mp3_path):
    with wave.open(str(wav_path), 'rb') as w:
        sr = w.getframerate()
        n = w.getnframes()
        channels = w.getnchannels()
        if channels != 1:
            raise ValueError(f'{wav_path.name} is not mono')
        samples = struct.unpack(f'<{n}h', w.readframes(n))

    start_sec, end_sec = detect_speech_bounds(samples, sr)
    duration = end_sec - start_sec

    # Trim, apply 15ms fade-in and 30ms fade-out, resample to 24000Hz mono 96kbps MP3
    fade_out_start = max(0.0, duration - 0.03)
    filter_chain = (
        f'atrim=start={start_sec:.3f}:end={end_sec:.3f},asetpts=PTS-STARTPTS,'
        f'afade=t=in:st=0:d=0.015,afade=t=out:st={fade_out_start:.3f}:d=0.03'
    )

    cmd = [
        'ffmpeg', '-y', '-v', 'error',
        '-i', str(wav_path),
        '-af', filter_chain,
        '-ar', '24000',
        '-ac', '1',
        '-c:a', 'libmp3lame',
        '-b:a', '96k',
        str(mp3_path)
    ]
    subprocess.run(cmd, check=True)

    # Validate output format and duration
    probe_cmd = [
        'ffprobe', '-v', 'error',
        '-show_entries', 'format=duration:stream=codec_name,sample_rate,channels',
        '-of', 'json', str(mp3_path)
    ]
    res = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
    info = json.loads(res.stdout)
    stream = info['streams'][0]
    out_duration = float(info['format']['duration'])

    if stream['codec_name'] != 'mp3' or stream['sample_rate'] != '24000' or stream['channels'] != 1:
        raise ValueError(f'Invalid format in {mp3_path.name}: {stream}')
    if not (0.3 < out_duration < 3.0):
        raise ValueError(f'Suspicious duration in {mp3_path.name}: {out_duration}s')

    sha256 = hashlib.sha256(mp3_path.read_bytes()).hexdigest()
    return {
        'source_file': wav_path.name,
        'sha256': sha256,
        'duration_s': round(out_duration, 3),
        'speech_window': [round(start_sec, 3), round(end_sec, 3)]
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--recordings-dir', type=Path, default=DEFAULT_RECORDINGS_DIR,
                        help='Directory containing exported recording files and manifest.json')
    args = parser.parse_args()

    audio_dir = args.recordings_dir / 'audio'
    if not audio_dir.is_dir():
        raise FileNotFoundError(f'Missing audio directory: {audio_dir}')

    tone3_ids = third_tone_ids()
    print(f'Found {len(tone3_ids)} third-tone words in word bank.')

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest_data = {
        'profile': 'genuine-human-third-tone-v3',
        'sample_rate': 24000,
        'channels': 1,
        'codec': 'mp3',
        'bitrate': '96k',
        'clips': {}
    }

    for word_id in tone3_ids:
        wav_file = audio_dir / f'{word_id}.wav'
        if not wav_file.is_file():
            raise FileNotFoundError(f'Missing recorded clip for {word_id}: {wav_file}')
        mp3_file = OUTPUT_DIR / f'{word_id}.mp3'
        metadata = process_clip(wav_file, mp3_file)
        manifest_data['clips'][word_id] = metadata
        print(f'Processed {word_id:4}: duration={metadata["duration_s"]}s, sha256={metadata["sha256"][:8]}...')

    MANIFEST_FILE.write_text(json.dumps(manifest_data, indent=2, ensure_ascii=False) + '\n')
    print(f'\nAll {len(tone3_ids)} clips successfully processed and saved to {OUTPUT_DIR}')
    print(f'Manifest written to {MANIFEST_FILE}')


if __name__ == '__main__':
    main()
