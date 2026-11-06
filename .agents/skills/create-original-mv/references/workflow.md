# 本仓库的模型、谱面与执行细节

下列命令从项目根执行。根目录相对本参考文件为 `../../../..`。仓库已有的脚本、音轨及 SVG 组件是此技能的运行资源；技能没有内嵌一套重复副本。

## 环境与路径

- Node 版本以项目 `package.json` 的 `engines` 为准，Remotion 依赖保持同一版本。
- 本地音频环境使用 `.venv-audio/`，依赖固定在 `requirements-audio.txt`；不把虚拟环境提交到 Git。
- 声库目录：`models/Qixuan_v2.7.0/Qixuan_v2.7.0_DiffSinger_OpenUtau/`。
- 声码器：`models/pc_nsf_hifigan_44.1k_hop512_128bin_2025.02/pc_nsf_hifigan_44.1k_hop512_128bin_2025.02.onnx`。
- `scripts/render-qixuan.py` 默认读取上述项目内路径，可通过 `--voicebank`、`--vocoder` 覆盖。不要依赖历史 `/private/tmp/` 路径。

已安装的项目直接使用现有环境。新克隆需要准备环境：

```sh
npm ci
python3.11 -m venv .venv-audio
.venv-audio/bin/python -m pip install -r requirements-audio.txt
```

Python 依赖为 NumPy、ONNX Runtime 和 PyYAML；当前推理代码使用 CPU。FFmpeg/ffprobe 用于音频处理和成片检查，按操作系统从官方或可信包管理器安装。

## 新机器恢复模型

Git 仓库不携带 `models/`。使用官方完整包，保留原始文件、使用条款和目录结构：

| 资源 | 官方入口 | 完整包 |
| --- | --- | --- |
| 绮萱 v2.7.0 | [官方 Release](https://github.com/yqzhishen/qixuan-diffsinger/releases/tag/v2.7.0) | `Qixuan_v2.7.0_DiffSinger_OpenUtau.zip`，420707627 字节 |
| OpenVPI PC-NSF-HiFiGAN 2025.02 | [官方声码器页](https://openvpi.github.io/vocoders/) | `pc_nsf_hifigan_44.1k_hop512_128bin_2025.02.oudep`，52760610 字节 |

完整包 SHA256：

```text
Qixuan_v2.7.0_DiffSinger_OpenUtau.zip
fe8ee7c95883d327a2b7facbbe832a7a53e1344918dc791ca83fc23b08034110

pc_nsf_hifigan_44.1k_hop512_128bin_2025.02.oudep
ba7d43142d41f6900c8264b5662ca7125a50feb8760bb8b9615c61a8f5e6902e
```

将声库包完整解压到 `models/Qixuan_v2.7.0/`，使其中 `dsconfig.yaml` 位于上节指定的声库目录。将声码器包完整解包到对应的 `models/pc_nsf_hifigan_.../` 目录。`.oudep` 是该资源的分发包，保留包内条款，不只取一个 ONNX 上传给别人。

推理脚本会检查 7 个声库 ONNX 和 1 个声码器 ONNX 的原版哈希。哈希不符时查明文件或版本原因，不跳过检查，也不擅自转换模型来“修复”。

## 乐谱是音画同步的依据

[`scripts/compose-music.py`](../../../../scripts/compose-music.py) 编排歌词、拼音、旋律、和声与段落；生成 [`public/audio/song-score.json`](../../../../public/audio/song-score.json) 及 [`src/MV/lyrics.ts`](../../../../src/MV/lyrics.ts)。

乐谱关键字段：

```json
{
  "bpm": 112,
  "durationSeconds": 120,
  "notes": [
    { "lyric": "打", "pinyin": "da3", "midi": 64, "startBeat": 64, "durationBeats": 0.5 }
  ]
}
```

- 秒数 = 拍数 × 60 / BPM；MIDI 数字在这里是音高指令，不是音频文件。
- 当前示例为 112 BPM、4/4、56 小节，正好 120 秒；30 fps 时为 3600 帧。这些是本曲参数，不是新作品的限制。
- 当前伴奏脚本按每字一个音符、一句一小节组织，节奏预设覆盖 5/6/7 字句。新词超出当前格式时，应明确改谱与节奏；不要让字数、拼音和音符数失配。
- 当前歌声脚本按 4 小节连续短语处理第 4–52 小节，其余为前奏/尾奏。换时长或段落时要同步调整这一范围，或从新谱结构推导短语，不能只改合成总帧数。
- 标准输出为 44.1kHz、16bit WAV；伴奏为立体声，人声为单声道。

## 伴奏与中文歌唱

重建当前曲目的伴奏、乐谱和字幕：

```sh
.venv-audio/bin/python scripts/compose-music.py
```

伴奏通过振荡器、包络和噪声合成鼓、贝斯、键盘、铺底及主旋律，输出 `public/audio/instrumental.wav`。需要新的编配时修改相应音符、和弦、声部和段落强弱，而不是把同一短片无变化循环。

重建当前授权歌声：

```sh
.venv-audio/bin/python scripts/render-qixuan.py
```

链路为：官方拼音词典 → 音素时长预测 → 音高预测 → 气声/发声预测 → 声学特征 → OpenVPI 声码器波形。由 ONNX Runtime 在本地运行原模型；默认声学 64 步。声母稍提前、元音落在拍点以保留连贯咬字。

输出 `public/audio/qixuan-vocal.wav`、`qixuan-vocal.json` 和副歌试听 `qixuan-chorus-preview.wav`。JSON 记录模型来源、参数、音符覆盖和波形检查。模型能完成合成不等于咬字和音乐表现已获主观认可，需实际试听。

`compose-music.py --vocal` 是旧 eSpeak NG 机械电子导唱分支；需要自然歌唱时使用 `render-qixuan.py`。两者不能混称为同一种人声。

## Remotion 接入与导出

音频在 `public/audio/`，通过 `@remotion/media` 与 `staticFile()` 加载：

```tsx
<Audio src={staticFile("audio/instrumental.wav")} volume={0.43} />
<Audio src={staticFile("audio/qixuan-vocal.wav")} volume={0.85} />
```

当前音轨已把前奏时间保留在 WAV 内，两轨都从合成起点播放。新作品也采用同一时间基准；若音频已含前奏静音，不要另加同等 `from` 延迟。音量要按实际波形留余量，当前示例倍率不是通用混音配方。

动画读取 `useCurrentFrame()`、`useVideoConfig().fps`；在 `Sequence` 内帧号是局部时间。歌词时间来自同一谱面。改场景顺序或时长时，检查它们与整首歌的同步关系。

```sh
npm run lint
npm run dev
# 用户要求导出时执行：
npx remotion render src/index.ts OffWork out/off-work-2min.mp4
```

输出文件名按当前任务命名，不必沿用两分钟示例名。用关键帧检查角色、遮挡、字幕和许可标识，再检查实际成片：

```sh
ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,duration -of json out/off-work-2min.mp4
ffmpeg -v error -i out/off-work-2min.mp4 -f null -
```

上面两条只能证明媒体结构/解码正常。还需试听导出音频，或从成片提取音频与原人声比对，确认实际混入歌声。用户反馈“没声音”时先区分完全静音与只有伴奏：查歌声音轨是否挂载，再查播放器静音、音量、加载错误；不在无证据时添加格式降级逻辑。

## 许可与来源

- [绮萱官方条款](https://github.com/yqzhishen/qixuan-diffsinger/blob/main/terms_of_use/Terms_of_Use.zh-CN.md)：允许商业/非商业声音作品；公开发布需明显 AI 标识及“绮萱”“DiffSinger”署名。遵守原条款其他用途限制。
- [OpenVPI 声码器说明](https://openvpi.github.io/vocoders/)：权重为 CC BY-NC-SA 4.0；官方另明确说明用该声码器合成或制作商业作品不受该限制。不能据此宣称权重本身可任意商用分发。
- 不使用声库人物画像，不微调或转换其权重，不将合成歌声当作训练采样。模型留本地 `models/`，不上传 Git、公开静态资源目录或打包进 MV。
- 中文字体使用 Noto Sans SC，保留 `public/fonts/OFL.txt`。
- 官方许可快照和哈希位于 [`public/licenses/singing-license-sources.json`](../../../../public/licenses/singing-license-sources.json)；实际素材记录位于 [`public/asset-provenance.json`](../../../../public/asset-provenance.json)。修改实际资源后更新对应记录。
- 提交或推送前查看暂存清单及体积，只加入当前授权范围内的代码、文档和可分发素材。保留已有无关未跟踪文件；不要因为技能被触发就自动推送或公开作品。
