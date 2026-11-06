"""Original 120-second score and sample-free electronic accompaniment.

Run with Python + numpy. --vocal additionally renders an optional mechanical
Mandarin guide with the locally installed eSpeak NG and ffmpeg; no paid service,
singer model, downloaded voicebank, or prerecorded audio is used.
"""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'audio'
SR, BPM, BARS = 44100, 112, 56
BEAT = 60 / BPM
SECONDS = BARS * 4 * BEAT
RHYTHMS = {5: [.5, .5, .75, .75, 1.5], 6: [.5, .5, .5, .5, .75, 1.25], 7: [.5] * 6 + [1]}

# Each row is one four-beat bar: lyrics, pronunciation, and independently authored notes.
VERSE = [
    ('闹钟先打了卡', 'nao4 zhong1 xian1 da3 le5 ka3', [57, 60, 60, 62, 60, 57]),
    ('我还没醒过来', 'wo3 hai2 mei2 xing3 guo4 lai2', [59, 59, 62, 64, 62, 59]),
    ('领带拴住哈欠', 'ling3 dai4 shuan1 zhu4 ha1 qian4', [60, 60, 64, 65, 64, 60]),
    ('塞进第一班车', 'sai1 jin4 di4 yi1 ban1 che1', [62, 60, 59, 57, 59, 60]),
    ('格子装着早晨', 'ge2 zi5 zhuang1 zhe5 zao3 chen2', [57, 60, 62, 64, 62, 60]),
    ('屏幕养着云彩', 'ping2 mu4 yang3 zhe5 yun2 cai3', [59, 62, 64, 67, 64, 62]),
    ('刚把一句写完', 'gang1 ba3 yi2 ju4 xie3 wan2', [60, 62, 64, 65, 64, 60]),
    ('又来三句重来', 'you4 lai2 san1 ju4 chong2 lai2', [62, 60, 59, 62, 59, 56]),
]
PRE = [
    ('钟往前走一格', 'zhong1 wang3 qian2 zou3 yi2 ge2', [60, 62, 64, 65, 64, 62]),
    ('门往后退一排', 'men2 wang3 hou4 tui4 yi4 pai2', [62, 64, 65, 67, 65, 64]),
    ('工牌晃来又晃去', 'gong1 pai2 huang4 lai2 you4 huang4 qu4', [64, 65, 67, 69, 67, 65, 64]),
    ('谁把路接起来', 'shei2 ba3 lu4 jie1 qi3 lai2', [65, 64, 62, 64, 67, 68]),
]
CHORUS = [
    ('打工的牛马啊', 'da3 gong1 de5 niu2 ma3 a5', [64, 64, 67, 69, 67, 64]),
    ('门又远了一截', 'men2 you4 yuan3 le5 yi4 jie2', [60, 62, 64, 67, 64, 62]),
    ('刚把今天装订好', 'gang1 ba3 jin1 tian1 zhuang1 ding4 hao3', [64, 67, 69, 72, 71, 67, 64]),
    ('明天又翻页', 'ming2 tian1 you4 fan1 ye4', [65, 64, 62, 64, 60]),
    ('打工的牛马啊', 'da3 gong1 de5 niu2 ma3 a5', [64, 64, 67, 69, 72, 69]),
    ('别把自己折叠', 'bie2 ba3 zi4 ji3 zhe2 die2', [67, 65, 64, 62, 64, 65]),
    ('给我留一寸晚风', 'gei3 wo3 liu2 yi2 cun4 wan3 feng1', [65, 67, 69, 72, 71, 67, 64]),
    ('吹过这条街', 'chui1 guo4 zhe4 tiao2 jie1', [64, 62, 60, 62, 69]),
]
VERSE2 = [
    ('午饭等到凉了', 'wu3 fan4 deng3 dao4 liang2 le5', [60, 60, 62, 64, 62, 60]),
    ('会议还没有散', 'hui4 yi4 hai2 mei2 you3 san4', [62, 62, 64, 67, 64, 62]),
    ('把没说完的话', 'ba3 mei2 shuo1 wan2 de5 hua4', [64, 62, 60, 59, 60, 62]),
    ('折成一只纸船', 'zhe2 cheng2 yi4 zhi1 zhi3 chuan2', [60, 62, 64, 67, 64, 60]),
    ('牛把纸角压平', 'niu2 ba3 zhi3 jiao3 ya1 ping2', [60, 64, 65, 67, 65, 64]),
    ('马把云影收藏', 'ma3 ba3 yun2 ying3 shou1 cang2', [62, 65, 67, 69, 67, 65]),
    ('小小一张空白', 'xiao3 xiao3 yi4 zhang1 kong4 bai2', [64, 65, 67, 65, 64, 62]),
    ('还没写上加班', 'hai2 mei2 xie3 shang4 jia1 ban1', [62, 60, 59, 60, 62, 64]),
]
BRIDGE = [
    ('机器忽然停了', 'ji1 qi4 hu1 ran2 ting2 le5', [65, 64, 60, 62, 60, 57]),
    ('我们也停一停', 'wo3 men5 ye3 ting2 yi4 ting2', [60, 60, 62, 64, 62, 60]),
    ('听见肚子的鼓', 'ting1 jian4 du4 zi5 de5 gu3', [62, 65, 64, 62, 60, 62]),
    ('比那闹钟好听', 'bi3 na4 nao4 zhong1 hao3 ting1', [64, 62, 60, 59, 60, 64]),
    ('谁说每一寸纸', 'shei2 shuo1 mei3 yi2 cun4 zhi3', [65, 65, 67, 69, 67, 65]),
    ('都要填得很满', 'dou1 yao4 tian2 de5 hen3 man3', [64, 64, 67, 69, 67, 64]),
    ('我把一口晚风', 'wo3 ba3 yi4 kou3 wan3 feng1', [62, 64, 65, 67, 65, 64]),
    ('留给身边伙伴', 'liu2 gei3 shen1 bian1 huo3 ban4', [65, 64, 62, 64, 67, 68]),
]
ENDING = [
    ('下班还有几厘米', 'xia4 ban1 hai2 you3 ji3 li2 mi3', [64, 64, 67, 69, 67, 64, 62]),
    ('先把肩膀放下来', 'xian1 ba3 jian1 bang3 fang4 xia4 lai2', [65, 64, 62, 64, 67, 64, 60]),
    ('路再长也有人等', 'lu4 zai4 chang2 ye3 you3 ren2 deng3', [60, 62, 64, 65, 64, 62, 60]),
    ('一起坐着看云海', 'yi4 qi3 zuo4 zhe5 kan4 yun2 hai3', [62, 64, 67, 69, 67, 64, 57]),
]
SECTIONS = [
    ('intro', 0, 4, []), ('verse', 4, 12, VERSE), ('pre', 12, 16, PRE),
    ('chorus', 16, 24, CHORUS), ('verse2', 24, 32, VERSE2),
    ('bridge', 32, 40, BRIDGE), ('finalChorus', 40, 48, CHORUS),
    ('ending', 48, 52, ENDING), ('outro', 52, 56, []),
]
HARMONY = {
    'intro': ['Am7', 'Fmaj7', 'Cmaj7', 'E7'],
    'verse': ['Am7', 'Em7', 'Fmaj7', 'Cmaj7', 'Am7', 'Em7', 'Dm7', 'E7'],
    'pre': ['Fmaj7', 'G', 'Dm7', 'E7'],
    'chorus': ['Am7', 'E7', 'Cmaj7', 'Fmaj7', 'Am7', 'Dm7', 'Fmaj7', 'Am7'],
    'verse2': ['Cmaj7', 'G', 'Em7', 'Am7', 'Fmaj7', 'Dm7', 'G', 'E7'],
    'bridge': ['Fmaj7', 'Cmaj7', 'Dm7', 'Am7', 'Fmaj7', 'Cmaj7', 'Dm7', 'E7'],
    'ending': ['Am7', 'Fmaj7', 'Dm7', 'Am7'], 'outro': ['Fmaj7', 'Cmaj7', 'E7', 'Am7'],
}
HARMONY['finalChorus'] = HARMONY['chorus']
CHORDS = {'Am7': [57, 60, 64, 67], 'Fmaj7': [53, 57, 60, 64], 'Cmaj7': [55, 59, 60, 64], 'E7': [56, 59, 62, 64], 'Em7': [55, 59, 62, 64], 'Dm7': [53, 57, 60, 62], 'G': [55, 59, 62, 67]}
BASS = {'Am7': 45, 'Fmaj7': 41, 'Cmaj7': 36, 'E7': 40, 'Em7': 40, 'Dm7': 38, 'G': 43}


def make_score():
    notes, lines, lyric_bars = [], [], []
    for name, first, last, rows in SECTIONS:
        assert not rows or len(rows) == last - first
        lyric_bars.extend((name, first + offset, row) for offset, row in enumerate(rows))
    for name, bar, (text, pronunciation, pitches) in lyric_bars:
        syllables = pronunciation.split()
        assert len(text) == len(syllables) == len(pitches)
        rhythm = RHYTHMS[len(text)]
        assert sum(rhythm) == 4
        position = bar * 4
        lines.append({'text': text, 'bar': bar, 'section': name, 'startMs': round(position * BEAT * 1000), 'endMs': round((position + 4) * BEAT * 1000), 'timestampMs': None, 'confidence': None})
        for char, pinyin, midi, duration in zip(text, syllables, pitches, rhythm):
            notes.append({'midi': midi, 'startBeat': position, 'durationBeats': duration, 'lyric': char, 'pinyin': pinyin})
            position += duration
    return {'title': '下班还有几厘米', 'bpm': BPM, 'meter': '4/4', 'bars': BARS, 'durationSeconds': SECONDS, 'key': 'A minor', 'sections': [{'id': name, 'startBar': first, 'endBar': last} for name, first, last, _ in SECTIONS], 'lines': lines, 'notes': notes, 'chordNamesByBar': [chord for name, _, _, _ in SECTIONS for chord in HARMONY[name]], 'provenance': 'Lyrics, note events, arrangement and oscillator synthesis authored for this project. No reference songs, samples, soundfonts, downloaded models or singer recordings. The separate optional guide uses eSpeak NG formant synthesis and is a mechanical electronic voice, not a natural singer. Independent creation is not a guarantee against coincidental similarity.'}


def tone(midi, beats, kind):
    duration = beats * BEAT
    t = np.arange(round(duration * SR)) / SR
    phase = 2 * np.pi * 440 * 2 ** ((midi - 69) / 12) * t
    if kind == 'lead':
        signal = np.sin(phase + .018 * np.sin(2 * np.pi * 5.1 * t)) + .16 * np.sin(2 * phase) + .055 * np.sin(3 * phase)
        envelope = np.minimum(t / .014, 1) * np.minimum((duration - t) / .055, 1) * np.exp(-1.2 * t)
    elif kind == 'bass':
        signal = np.sin(phase) + .21 * np.sin(2 * phase)
        envelope = np.minimum(t / .006, 1) * np.minimum((duration - t) / .04, 1) * np.exp(-3.5 * t)
    elif kind == 'pad':
        signal = np.sin(phase) + .12 * np.sin(2 * phase + .006 * np.sin(2 * np.pi * .7 * t))
        envelope = np.minimum(t / .16, 1) * np.minimum((duration - t) / .3, 1) * .8
    else:
        signal = np.sin(phase) + .24 * np.sin(2 * phase) + .075 * np.sin(4 * phase)
        envelope = np.minimum(t / .006, 1) * np.minimum((duration - t) / .04, 1) * np.exp(-6.7 * t)
    return signal * np.clip(envelope, 0, 1)


def save_wav(path, signal, rate=SR):
    with wave.open(str(path), 'wb') as audio:
        audio.setnchannels(1 if signal.ndim == 1 else signal.shape[1])
        audio.setsampwidth(2)
        audio.setframerate(rate)
        audio.writeframes(np.round(np.clip(signal, -1, 1) * 32767).astype('<i2').tobytes())


def voiced_pitch(signal, rate, expected):
    size = max(512, round(rate * .07))
    estimates = []
    low, high = int(rate / (expected * 1.18)), int(rate / (expected * .82))
    for start in range(0, len(signal) - size, size // 3):
        frame = signal[start:start + size]
        if np.sqrt(np.mean(frame ** 2)) < .02:
            continue
        spectrum = np.fft.rfft((frame - frame.mean()) * np.hanning(size), size * 2)
        ac = np.fft.irfft(spectrum * spectrum.conj())[:size]
        lag = low + int(np.argmax(ac[low:high]))
        if ac[lag] > ac[0] * .35:
            delta = .5 * (ac[lag - 1] - ac[lag + 1]) / (ac[lag - 1] - 2 * ac[lag] + ac[lag + 1])
            estimates.append(rate / (lag + delta))
    if not estimates:
        raise ValueError('Could not measure the synthesized vowel pitch')
    return float(np.median(estimates))


def instrumental(score):
    mix = np.zeros((round(SECONDS * SR), 2))
    rng = np.random.default_rng(61106)

    def add(signal, position, level, pan=0):
        start = round(position * BEAT * SR)
        count = min(len(signal), len(mix) - start)
        if count <= 0:
            return
        gain = np.sqrt(np.array([1 - pan, 1 + pan]) / 2)
        mix[start:start + count] += signal[:count, None] * gain * level

    t = np.arange(round(.34 * SR)) / SR
    kick = np.sin(2 * np.pi * (43 * t + 110 * .025 * (1 - np.exp(-t / .025)))) * np.exp(-17 * t) * np.minimum(t / .002, 1)
    t = np.arange(round(.18 * SR)) / SR
    noise = rng.uniform(-1, 1, len(t))
    snare = ((noise - np.roll(noise, 1)) * .22 + np.sin(2 * np.pi * 180 * t) * .32) * np.exp(-29 * t) * np.minimum(t / .001, 1)
    t = np.arange(round(.07 * SR)) / SR
    noise = rng.uniform(-1, 1, len(t))
    hat = (noise - np.roll(noise, 1)) * np.exp(-82 * t) * np.minimum(t / .001, 1)
    t = np.arange(round(.8 * SR)) / SR
    noise = rng.uniform(-1, 1, len(t))
    crash = (noise - np.roll(noise, 1)) * np.exp(-7 * t) * np.minimum(t / .003, 1)

    for name, first, last, _ in SECTIONS:
        for bar in range(first, last):
            index = bar - first
            chord = HARMONY[name][index]
            energy = {'intro': .42, 'verse': .65, 'pre': .78, 'chorus': .95, 'verse2': .64, 'bridge': .43 if index < 4 else .70, 'finalChorus': 1.05, 'ending': .68, 'outro': .38}[name]
            offsets = [(0, .048), (1.5, .034), (2.5, .038)]
            if name == 'bridge' and index < 4 or name == 'outro':
                offsets = [(0, .055)]
            for offset, volume in offsets:
                for pitch in CHORDS[chord]:
                    add(tone(pitch, 1.5, 'keys'), bar * 4 + offset, volume * energy, -.3)
            if name in ['pre', 'chorus', 'bridge', 'finalChorus', 'ending']:
                for pitch in CHORDS[chord]:
                    add(tone(pitch + 12, 3.7, 'pad'), bar * 4, .011 * energy, .25)
            if name != 'intro' or index >= 2:
                for offset, pitch in [(0, BASS[chord]), (1.5, BASS[chord] + 12), (2, BASS[chord]), (3.25, BASS[chord] + 7)]:
                    add(tone(pitch, .63, 'bass'), bar * 4 + offset, .20 * energy)
            if name not in ['intro', 'outro'] and not (name == 'bridge' and index < 4):
                kicks = [0, 1.5, 2, 2.75] if name in ['chorus', 'finalChorus'] else [0, 2]
                for offset in kicks:
                    add(kick, bar * 4 + offset, .28 * energy)
                for offset in [1, 3]:
                    add(snare, bar * 4 + offset, .11 * energy, .08)
            hat_count = 4 if name in ['intro', 'bridge', 'outro'] else 8
            for tick in range(hat_count):
                add(hat, bar * 4 + tick * (4 / hat_count), (.014 if tick % 2 == 0 else .022) * energy, .4)
            if name in ['chorus', 'finalChorus'] and index in [0, 4]:
                add(crash, bar * 4, .025 * energy, -.18)
            if name in ['pre', 'finalChorus']:
                for tick, pitch in enumerate(CHORDS[chord] * 2):
                    add(tone(pitch + 12, .38, 'keys'), bar * 4 + tick * .5, .028 * energy, .42)
            if name in ['intro', 'outro']:
                motif = [64, 67, 69, 64] if index % 2 == 0 else [62, 64, 60, 57]
                for offset, pitch in enumerate(motif):
                    add(tone(pitch, .9, 'lead'), bar * 4 + offset, .075 * energy, .03)
            if index == last - first - 1 and name in ['pre', 'bridge']:
                for offset in [3, 3.25, 3.5, 3.75]:
                    add(snare, bar * 4 + offset, .04 + (offset - 3) * .04, -.05)

    for event in score['notes']:
        bar = int(event['startBeat'] // 4)
        level = .115 if 16 <= bar < 24 or 40 <= bar < 48 else .075
        signal = tone(event['midi'], event['durationBeats'] * .92, 'lead')
        add(signal, event['startBeat'], level, .04)
        add(signal, event['startBeat'] + .5, level * .12, .38)
        if 40 <= bar < 48:
            add(tone(event['midi'] + 12, event['durationBeats'] * .75, 'keys'), event['startBeat'], .021, -.35)
    t = np.arange(len(mix)) / SR
    mix *= (np.minimum(t / .2, 1) * np.minimum((SECONDS - t) / 2.4, 1))[:, None]
    assert np.isfinite(mix).all()
    mix *= .84 / np.max(np.abs(mix))
    save_wav(OUT / 'instrumental.wav', mix)
    return {'durationSeconds': len(mix) / SR, 'peak': float(abs(mix).max()), 'rms': float(np.sqrt(np.mean(mix ** 2)))}


def render_guide(score):
    espeak, ffmpeg = shutil.which('espeak-ng'), shutil.which('ffmpeg')
    if not espeak or not ffmpeg:
        raise RuntimeError('--vocal needs the local espeak-ng and ffmpeg executables')
    stem = np.zeros(round(SECONDS * SR))
    with tempfile.TemporaryDirectory(prefix='makecarton-vocal-') as directory:
        folder = Path(directory)
        for index, event in enumerate(score['notes']):
            target_hz = 440 * 2 ** ((event['midi'] - 69) / 12)
            hz = round(target_hz)
            voice = folder / 'voice'
            voice.write_text(f'name Original electronic guide\nlanguage cmn-latn-pinyin\nphonemes cmn\ndictionary cmn\npitch {hz} {hz}\nflutter 0\nroughness 0\nintonation 3\n')
            raw, shaped = folder / 'raw.wav', folder / 'shaped.wav'
            subprocess.run([espeak, '--load', '-v', 'voice', '-D', '-P', '0', '-s', '150', '-z', '-w', str(raw), event['pinyin']], cwd=folder, check=True, capture_output=True)
            with wave.open(str(raw), 'rb') as audio:
                rate = audio.getframerate()
                signal = np.frombuffer(audio.readframes(audio.getnframes()), '<i2').astype(float) / 32768
            active = np.flatnonzero(abs(signal) > max(.003, abs(signal).max() * .015))
            if not len(active):
                raise ValueError(f"No synthesized sound for note {index}: {event['lyric']}")
            signal = signal[max(0, active[0] - 70):min(len(signal), active[-1] + 150)]
            corrected_rate = round(rate * target_hz / voiced_pitch(signal, rate, target_hz))
            save_wav(raw, signal, rate)
            seconds = event['durationBeats'] * BEAT * .94
            factor = len(signal) / corrected_rate / seconds
            tempo = []
            while factor < .5 or factor > 2:
                part = .5 if factor < .5 else 2
                tempo.append(f'atempo={part}')
                factor /= part
            tempo.append(f'atempo={factor:.8f}')
            filters = [f'asetrate={corrected_rate}', *tempo, f'aresample={SR}', f'apad=pad_dur={seconds}', f'atrim=duration={seconds}', 'lowpass=f=7000', 'afade=t=in:d=0.006', f'afade=t=out:st={max(0, seconds - .018)}:d=0.018']
            subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(raw), '-af', ','.join(filters), '-ac', '1', '-ar', str(SR), str(shaped)], check=True)
            with wave.open(str(shaped), 'rb') as audio:
                signal = np.frombuffer(audio.readframes(audio.getnframes()), '<i2').astype(float) / 32768
            start = round(event['startBeat'] * BEAT * SR)
            stem[start:start + len(signal)] += signal
    assert np.isfinite(stem).all() and abs(stem).max() > 0
    stem *= .707 / abs(stem).max()
    save_wav(OUT / 'guide-vocal.wav', stem)
    return {'durationSeconds': len(stem) / SR, 'peak': float(abs(stem).max()), 'rms': float(np.sqrt(np.mean(stem ** 2))), 'method': 'eSpeak NG formant synthesis; mechanical electronic singing guide, not a natural singer', 'licenseSources': ['https://github.com/espeak-ng/espeak-ng', 'https://www.gnu.org/licenses/gpl-faq.html#WhatCaseIsOutputGPL']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--vocal', action='store_true', help='Also render the optional dry electronic guide locally')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    score = make_score()
    (OUT / 'song-score.json').write_text(json.dumps(score, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    captions = [{key: line[key] for key in ['text', 'startMs', 'endMs', 'timestampMs', 'confidence']} for line in score['lines']]
    exported = 'import type { Caption } from "@remotion/captions";\n\n// Generated from scripts/compose-music.py. Each line occupies one bar at 112 BPM.\nexport const captions: Caption[] = ' + json.dumps(captions, ensure_ascii=False, indent=2) + ';\n'
    (ROOT / 'src' / 'MV' / 'lyrics.ts').write_text(exported, encoding='utf-8')
    report = {'instrumental': instrumental(score), 'lyricLines': len(captions), 'lyricNotes': len(score['notes'])}
    if args.vocal:
        report['guideVocal'] = render_guide(score)
    (OUT / 'audio-check.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
