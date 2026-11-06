"""Render this MV's original score with the licensed Qixuan v2.7.0 DiffSinger voice.

Uses original, unmodified ONNX files with ONNX Runtime CPU, entirely offline.
The complete official voicebank and vocoder packages are stored locally under
models/ and are not redistributed. Public credits must name 绮萱, DiffSinger,
and AI synthesis. See public/licenses for the retained official terms.

Reference for inference interfaces and consonant alignment:
https://github.com/openutau/OpenUtau/tree/master/OpenUtau.Core/DiffSinger

Dependencies: Python 3.11, numpy 2.4.6, onnxruntime 1.31.1, PyYAML 6.0.3.
Usage: python scripts/render-qixuan.py
Override locations with --voicebank /path/to/voicebank --vocoder /path/to/vocoder.onnx.
"""

import argparse
import hashlib
import json
import re
import time
import wave
from pathlib import Path
import numpy as np
import onnxruntime as ort
import yaml

SR, HOP = 44100, 512
FRAME = HOP / SR
PROJECT = Path(__file__).resolve().parents[1]
DEFAULT_VOICEBANK = PROJECT / "models/Qixuan_v2.7.0/Qixuan_v2.7.0_DiffSinger_OpenUtau"
DEFAULT_VOCODER = (
    PROJECT
    / "models/pc_nsf_hifigan_44.1k_hop512_128bin_2025.02"
    / "pc_nsf_hifigan_44.1k_hop512_128bin_2025.02.onnx"
)

# SHA256s verified byte-for-byte against the unmodified official release archives.
EXPECTED_MODEL_HASHES = {
    "0101_qixuan_muon1_acoustic.qixuan.onnx": "86c21d6b3a2e60e653af3cd6aa117d68523ea3eefe471a790e85b662bdc9220b",
    "dsvariance/0102_qixuan_muon1_multivar.qixuan.linguistic.onnx": "d6e28df87dbcede6cea1fd4ce45a6e54e030cd7e0c0795e99500408ee0935686",
    "dsvariance/0102_qixuan_muon1_multivar.qixuan.variance.onnx": "535a36e3b443bdc0b2531620024f1bb9fc9a26b5ec2f1bd310da340259b74c0f",
    "dsdur/0102_qixuan_newdict_dur.qixuan.linguistic.onnx": "c58f4af2eab551eab6448bbdd9fe0300543c197000c856ab831e6dadf81aa953",
    "dsdur/0102_qixuan_newdict_dur.qixuan.dur.onnx": "4666ffc57d9405da18c4cb504a9c3470a6baceeefa896836e9b6f6a998ff5478",
    "dspitch/0102_qixuan_muon1_pitch.qixuan.linguistic.onnx": "4d16079f1cbff83df7f03327e0fd1b4654f00ec9debf5c605969f7eda00a02df",
    "dspitch/0102_qixuan_muon1_pitch.qixuan.pitch.onnx": "b4e33ff60f43e1959c9e9e5c0e2a2e8cc394b73b39f4fdb5590a98fdd67dcfc3",
    "vocoder": "b297c0c790dbcfe6b2123d87cc20bf8718969f91ffa3170a198c8fb53686155d",
}
OFFICIAL_ARCHIVE_HASHES = {
    "Qixuan_v2.7.0_DiffSinger_OpenUtau.zip": {
        "bytes": 420707627,
        "sha256": "fe8ee7c95883d327a2b7facbbe832a7a53e1344918dc791ca83fc23b08034110",
    },
    "pc_nsf_hifigan_44.1k_hop512_128bin_2025.02.oudep": {
        "bytes": 52760610,
        "sha256": "ba7d43142d41f6900c8264b5662ca7125a50feb8760bb8b9615c61a8f5e6902e",
    },
}


def wav(path, a):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setparams((1, 2, SR, 0, "NONE", "not compressed"))
        w.writeframes((np.clip(a, -1, 1) * 32767).astype("<i2").tobytes())


def i64(x):
    return np.asarray([x], np.int64)


def f32(x):
    return np.asarray([x], np.float32)


class Singer:
    def __init__(self, model, vocoder):
        MODEL, VOCODER = model, vocoder
        required = [MODEL / name for name in EXPECTED_MODEL_HASHES if name != "vocoder"]
        required += [
            MODEL / folder / "dsconfig.yaml"
            for folder in ["", "dsdur", "dspitch", "dsvariance"]
        ]
        required += [MODEL / "dsdur/dsdict-zh.yaml", VOCODER]
        missing = [str(path) for path in required if not path.is_file()]
        if missing:
            raise FileNotFoundError(
                "Missing Qixuan inference files:\n"
                + "\n".join(missing)
                + f"\nVoicebank location: {MODEL}\nVocoder location: {VOCODER}"
                + f"\nDefault voicebank: {DEFAULT_VOICEBANK}\nDefault vocoder: {DEFAULT_VOCODER}"
                + "\nDownload and extract the complete official packages, including their terms and configuration files:"
                + "\nQixuan v2.7.0: https://github.com/yqzhishen/qixuan-diffsinger/releases/tag/v2.7.0"
                + "\nPackage: Qixuan_v2.7.0_DiffSinger_OpenUtau.zip"
                + "\nOpenVPI vocoder: https://github.com/openvpi/vocoders/releases/tag/pc-nsf-hifigan-44.1k-hop512-128bin-2025.02"
                + "\nPackage: pc_nsf_hifigan_44.1k_hop512_128bin_2025.02.oudep"
                + "\nUse --voicebank and --vocoder to override the default locations. No automatic downloads or temporary-directory fallback are used."
            )
        actual = {
            str(p.relative_to(MODEL)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in MODEL.rglob("*.onnx")
        }
        actual["vocoder"] = hashlib.sha256(VOCODER.read_bytes()).hexdigest()
        if actual != EXPECTED_MODEL_HASHES:
            raise ValueError(
                "Model hashes differ from the verified official Qixuan v2.7.0 release"
            )
        self.provenance = {
            "officialArchiveSha256": OFFICIAL_ARCHIVE_HASHES,
            "modelSha256": actual,
            "weightsMatchOriginalOfficialArchives": True,
        }
        ort.disable_telemetry_events()
        ort.set_seed(61106)
        opt = ort.SessionOptions()
        opt.intra_op_num_threads = 6
        opt.inter_op_num_threads = 1
        opt.enable_mem_pattern = False
        opt.log_severity_level = 3

        def session(p):
            return ort.InferenceSession(
                str(p), sess_options=opt, providers=["CPUExecutionProvider"]
            )

        self.maps = {}
        self.sessions = {}
        for name, folder, models in [
            ("acoustic", MODEL, ["acoustic"]),
            ("duration", MODEL / "dsdur", ["linguistic", "dur"]),
            ("pitch", MODEL / "dspitch", ["linguistic", "pitch"]),
            ("variance", MODEL / "dsvariance", ["linguistic", "variance"]),
        ]:
            config = yaml.safe_load((folder / "dsconfig.yaml").read_text())
            self.maps[name] = json.loads((folder / config["phonemes"]).read_text())
            for key in models:
                self.sessions[name + "_" + key] = session(folder / config[key])
        self.sessions["vocoder"] = session(VOCODER)
        data = yaml.load(
            (MODEL / "dsdur/dsdict-zh.yaml").read_text(), Loader=yaml.CSafeLoader
        )
        self.dictionary = {x["grapheme"]: x["phonemes"] for x in data["entries"]}
        self.vowels = {x["symbol"] for x in data["symbols"] if x["type"] == "vowel"}

    def run(self, name, inputs):
        start = time.monotonic()
        result = self.sessions[name].run(None, inputs)
        print(name, round(time.monotonic() - start, 2), "s", flush=True)
        return result

    def token_inputs(self, name, phonemes):
        return {
            "tokens": i64([self.maps[name][p] for p in phonemes]),
            "languages": i64([3 if p.startswith("zh/") else 0 for p in phonemes]),
        }

    def phrase(self, notes, bpm, steps):
        # A vowel starts on its note. The next consonant is sung before the next beat,
        # as in OpenUtau's Chinese DiffSinger phonemizer; no fixed speaker ID is used.
        symbols = [self.dictionary[re.sub("[0-9]", "", n["pinyin"])] for n in notes]
        initials = []
        rhymes = []
        for word in symbols:
            v = next(i for i, p in enumerate(word) if p in self.vowels)
            initials.append(word[:v])
            rhymes.append(word[v:])
        groups = (
            [["SP"] + initials[0]]
            + [
                rhymes[j] + (initials[j + 1] if j + 1 < len(notes) else [])
                for j in range(len(notes))
            ]
            + [["SP"]]
        )
        phonemes = [p for group in groups for p in group]
        head = 0.35
        tail = 0.22
        durations = [head] + [n["durationBeats"] * 60 / bpm for n in notes] + [tail]
        frame_ends = np.round(np.cumsum([0] + durations) / FRAME).astype(np.int64)
        word_dur = np.diff(frame_ends)
        word_div = [len(g) for g in groups]
        ph_midi = []
        ph_midi.extend([notes[0]["midi"]] * len(groups[0]))
        for j in range(len(notes)):
            ph_midi.extend([notes[j]["midi"]] * len(rhymes[j]))
            if j + 1 < len(notes):
                ph_midi.extend([notes[j + 1]["midi"]] * len(initials[j + 1]))
        ph_midi.append(notes[-1]["midi"])
        dur_in = self.token_inputs("duration", phonemes)
        dur_in.update(word_div=i64(word_div), word_dur=i64(word_dur))
        enc, masks = self.run("duration_linguistic", dur_in)
        predicted = self.run(
            "duration_dur",
            {"encoder_out": enc, "x_masks": masks, "ph_midi": i64(ph_midi)},
        )[0][0]
        ph_dur = []
        offset = 0
        for index, (count, budget) in enumerate(zip(word_div, word_dur)):
            raw = np.maximum(predicted[offset : offset + count], 0.01)
            offset += count
            if index == 0:
                consonants = np.maximum(1, np.round(raw[1:])).astype(np.int64)
                aligned = np.r_[budget - consonants.sum(), consonants]
            else:
                boundaries = np.round(
                    np.r_[0, np.cumsum(raw) / raw.sum()] * budget
                ).astype(np.int64)
                aligned = np.diff(boundaries)
            if (aligned <= 0).any():
                raise ValueError(("Nonpositive phoneme duration", aligned, phonemes))
            ph_dur.extend(aligned.tolist())
        frames = sum(ph_dur)
        zeros = np.zeros((1, frames), np.float32)
        pitch_in = self.token_inputs("pitch", phonemes)
        pitch_in["ph_dur"] = i64(ph_dur)
        enc, _ = self.run("pitch_linguistic", pitch_in)
        midis = [notes[0]["midi"]] + [n["midi"] for n in notes] + [notes[-1]["midi"]]
        pitch = self.run(
            "pitch_pitch",
            {
                "encoder_out": enc,
                "ph_dur": i64(ph_dur),
                "note_midi": f32(midis),
                "note_rest": np.asarray([[True] + [False] * len(notes) + [True]], bool),
                "note_dur": i64(word_dur),
                "pitch": zeros.copy() + 60,
                "expr": zeros.copy() + 1,
                "retake": np.ones((1, frames), bool),
                "steps": np.array(20, np.int64),
            },
        )[0]
        var_in = self.token_inputs("variance", phonemes)
        var_in["ph_dur"] = i64(ph_dur)
        enc, _ = self.run("variance_linguistic", var_in)
        breathiness, voicing = self.run(
            "variance_variance",
            {
                "encoder_out": enc,
                "ph_dur": i64(ph_dur),
                "pitch": pitch,
                "breathiness": zeros,
                "voicing": zeros,
                "retake": np.ones((1, frames, 2), bool),
                "steps": np.array(10, np.int64),
            },
        )
        f0 = (440 * 2 ** ((pitch - 69) / 12)).astype(np.float32)
        acoustic = self.token_inputs("acoustic", phonemes)
        acoustic.update(
            durations=i64(ph_dur),
            f0=f0,
            breathiness=breathiness,
            voicing=voicing,
            gender=zeros,
            velocity=zeros + 1,
            depth=np.array(0.6, np.float32),
            steps=np.array(steps, np.int64),
        )
        mel = self.run("acoustic_acoustic", acoustic)[0]
        audio = self.run("vocoder", {"mel": mel, "f0": f0})[0].reshape(-1)
        assert np.isfinite(audio).all()
        metadata = {
            "phones": phonemes,
            "phonemeDurationsFrames": ph_dur,
            "headSamples": int(word_dur[0] * HOP),
            "pitchRangeMidi": [float(pitch.min()), float(pitch.max())],
            "peak": float(abs(audio).max()),
            "seconds": len(audio) / SR,
        }
        return audio, metadata


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--voicebank",
        type=Path,
        default=DEFAULT_VOICEBANK,
        help=f"Complete Qixuan voicebank directory (default: {DEFAULT_VOICEBANK})",
    )
    p.add_argument(
        "--vocoder",
        type=Path,
        default=DEFAULT_VOCODER,
        help=f"Original OpenVPI vocoder ONNX file (default: {DEFAULT_VOCODER})",
    )
    p.add_argument("--steps", type=int, default=64)
    p.add_argument(
        "--output", type=Path, default=PROJECT / "public/audio/qixuan-vocal.wav"
    )
    a = p.parse_args()
    if not 1 <= a.steps <= 128:
        raise ValueError("steps must be between 1 and 128")
    score = json.loads((PROJECT / "public/audio/song-score.json").read_text())
    singer = Singer(a.voicebank, a.vocoder)
    stem = np.zeros(round(score["durationSeconds"] * SR), np.float64)
    records = []
    for start_bar in range(4, 52, 4):
        notes = [
            n
            for n in score["notes"]
            if start_bar * 4 <= n["startBeat"] < (start_bar + 4) * 4
        ]
        audio, meta = singer.phrase(notes, score["bpm"], a.steps)
        start = (
            round(notes[0]["startBeat"] * 60 / score["bpm"] * SR) - meta["headSamples"]
        )
        count = min(len(audio), len(stem) - start)
        fade = min(256, count // 4)
        audio[:fade] *= np.linspace(0, 1, fade)
        audio[-fade:] *= np.linspace(1, 0, fade)
        stem[start : start + count] += audio[:count]
        records.append(
            {
                "startBar": start_bar,
                "endBar": start_bar + 4,
                "lyricNotes": len(notes),
                "text": "".join(n["lyric"] for n in notes),
                **meta,
            }
        )
        print("Completed bars", start_bar, "to", start_bar + 4, flush=True)
        if start_bar == 20:
            # Save an early chorus preview while the remaining song is being rendered.
            first = round((16 * 4 * 60 / score["bpm"] - 0.2) * SR)
            last = round((24 * 4 * 60 / score["bpm"] + 0.2) * SR)
            preview = stem[first:last].copy()
            preview *= 0.7 / max(float(abs(preview).max()), 1e-9)
            wav(a.output.with_name("qixuan-chorus-preview.wav"), preview)
    if sum(r["lyricNotes"] for r in records) != len(score["notes"]):
        raise ValueError("Not all score notes were synthesized")
    if not np.isfinite(stem).all() or abs(stem).max() == 0:
        raise ValueError("Invalid or silent synthesis")
    stem *= 0.7 / float(abs(stem).max())
    wav(a.output, stem)
    active = np.abs(stem) > 0.001
    report = {
        "voicebank": "绮萱 Qixuan v2.7.0",
        "engine": "DiffSinger ONNX Runtime CPU",
        "aiGenerated": True,
        "durationSeconds": len(stem) / SR,
        "sampleRate": SR,
        "channels": 1,
        "peak": float(abs(stem).max()),
        "nonSilentRms": float(np.sqrt(np.mean(stem[active] ** 2))),
        "lyricNotes": sum(r["lyricNotes"] for r in records),
        "lyricLines": len(score["lines"]),
        "acousticSteps": a.steps,
        "pitchSteps": 20,
        "varianceSteps": 10,
        "usesPredictedDuration": True,
        "usesPredictedPitch": True,
        "usesPredictedBreathinessAndVoicing": True,
        "timing": "Official pinyin dictionary; vowels on note boundaries with predicted initial consonants anticipated from preceding note; cumulative frame rounding (512 samples at 44.1kHz); 4-bar phrases with head/tail padding.",
        "subjectiveListeningAccepted": False,
        "modelProvenance": singer.provenance,
        "dependencies": {
            "numpy": np.__version__,
            "onnxruntime": ort.__version__,
            "PyYAML": yaml.__version__,
        },
        "phrases": records,
    }
    with wave.open(str(a.output), "rb") as decoded:
        frames = decoded.getnframes()
        pcm = np.frombuffer(decoded.readframes(frames), "<i2").astype(float) / 32768
    levels = [
        float(
            np.sqrt(
                np.mean(
                    pcm[
                        round(line["startMs"] / 1000 * SR) : round(
                            line["endMs"] / 1000 * SR
                        )
                    ]
                    ** 2
                )
            )
        )
        for line in score["lines"]
    ]
    if min(levels) <= 0.005:
        raise ValueError("One or more lyric lines are silent in the decoded WAV")
    active = np.flatnonzero(abs(pcm) > 0.001)
    report["decodedQc"] = {
        "frames": frames,
        "durationSeconds": frames / SR,
        "peakDbFS": float(20 * np.log10(abs(pcm).max())),
        "clippedSamples": int((abs(pcm) >= 1).sum()),
        "firstActiveSecond": float(active[0] / SR),
        "lastActiveSecond": float(active[-1] / SR),
        "lineRmsMin": min(levels),
        "lineRmsMax": max(levels),
        "audibleLines": len(levels),
        "lyricCoverageMatchesScore": "".join(r["text"] for r in records)
        == "".join(line["text"] for line in score["lines"]),
        "sha256": hashlib.sha256(a.output.read_bytes()).hexdigest(),
    }
    a.output.with_suffix(".json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    )
    print(
        json.dumps(
            {k: v for k, v in report.items() if k != "phrases"}, ensure_ascii=False
        ),
        flush=True,
    )


if __name__ == "__main__":
    main()
