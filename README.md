# 下班还有几厘米

用 React、SVG 和 Remotion 制作的原创纸片动画 MV：1920×1080、30 fps、120 秒，包含原创词曲、程序合成伴奏、绮萱 DiffSinger 中文 AI 演唱及同步歌词。

## Codex skill

项目技能位于 [`.agents/skills/create-original-mv/SKILL.md`](.agents/skills/create-original-mv/SKILL.md)。在本仓库内打开 Codex，使用：

```text
$create-original-mv 按我的主题制作一支原创动画 MV，使用本地免费授权中文歌唱声库。
```

技能依赖本仓库中的脚本、动画、谱面和模型目录，不是单个 Markdown 文件就能独立运行。详细流程、模型恢复、谱面格式及验收说明见 [workflow.md](.agents/skills/create-original-mv/references/workflow.md)。

## 直接预览与导出

已有生成音频随代码保存，单纯预览不需要重新下载或运行模型。

```sh
npm ci
npm run dev -- --port=3333
```

打开终端打印的地址并选择 `OffWork`，或访问 `http://localhost:3333/OffWork`。默认同时挂载伴奏和歌声，歌声约第 8.5 秒进入。

```sh
npx remotion render src/index.ts OffWork out/off-work-2min.mp4
npm run lint
```

导出文件位于 `out/`，不提交 Git。

## 本地音频环境

重新生成声音需要 Python 3.11；在项目根目录执行：

```sh
python3.11 -m venv .venv-audio
.venv-audio/bin/python -m pip install -r requirements-audio.txt
```

依赖固定为 NumPy 2.4.6、ONNX Runtime 1.31.1、PyYAML 6.0.3。模型和虚拟环境均放在项目目录，不再从临时目录读取。

```sh
# 原创乐谱、歌词字幕与电子伴奏
.venv-audio/bin/python scripts/compose-music.py

# 以原始授权模型合成中文歌声，默认 64 步、本机 CPU
.venv-audio/bin/python scripts/render-qixuan.py

# 验证模型迁移时输出到独立文件，保留现有歌声
.venv-audio/bin/python scripts/render-qixuan.py --output out/model-migration-check.wav
```

生成伴奏会写入谱面和字幕；歌词、节拍、结构变化后需重新生成歌声。当前歌曲为 112 BPM、4/4 拍、56 小节。制作新歌时需同时调整伴奏脚本的段落/节奏、歌唱分句范围、字幕与 Remotion 时长，不能只替换几个字就当作新歌。

## 本地模型与恢复

原临时模型已完整迁入 `models/`，保留官方完整包、配置、许可与原始权重，约 1 GB（包括压缩包和解压内容）。`models/` 已被 Git 忽略，GitHub 仓库不分发模型。

```text
models/
  Qixuan_v2.7.0_DiffSinger_OpenUtau.zip
  Qixuan_v2.7.0/
    Qixuan_v2.7.0_DiffSinger_OpenUtau/
      dsconfig.yaml
      dsdur/
      dspitch/
      dsvariance/
      … 原包其他文件
  pc_nsf_hifigan_44.1k_hop512_128bin_2025.02.oudep
  pc_nsf_hifigan_44.1k_hop512_128bin_2025.02/
    pc_nsf_hifigan_44.1k_hop512_128bin_2025.02.onnx
    … 原包其他文件
```

新克隆仓库需要自行从官方渠道恢复模型后才能重新合成：

- [绮萱 v2.7.0 完整声库](https://github.com/yqzhishen/qixuan-diffsinger/releases/tag/v2.7.0)：下载 `Qixuan_v2.7.0_DiffSinger_OpenUtau.zip`，完整解压到上面的目录。
- [OpenVPI 2025.02 声码器](https://github.com/openvpi/vocoders/releases/tag/pc-nsf-hifigan-44.1k-hop512-128bin-2025.02)：下载同名 `.oudep` 完整包；它是 ZIP 格式，完整解压到对应目录。

下载前阅读官方条款。原包 SHA256、模型 SHA256 及校验逻辑保留于 `scripts/render-qixuan.py`，该脚本默认使用上述路径，也支持 `--voicebank` 和 `--vocoder` 显式覆盖。缺模型会报出路径和官方来源，不自动下载、不回退到临时目录。

## 工程文件

| 文件 | 用途 |
| --- | --- |
| `src/MV/Characters.tsx`、`World.tsx` | 原创角色和场景道具 |
| `src/MV/OffWorkMV.tsx` | 画面、时间轴、字幕与音轨挂载 |
| `scripts/compose-music.py` | 乐谱、歌词与无采样电子伴奏合成 |
| `scripts/render-qixuan.py` | 中文歌声本地推理及原版模型校验 |
| `public/audio/song-score.json` | 逐字歌词、拼音、MIDI 音高、起始拍和时长 |
| `public/audio/instrumental.wav` | 原创伴奏 |
| `public/audio/qixuan-vocal.wav` | 已授权声库合成的歌声 |
| `public/audio/qixuan-vocal.json` | 模型、参数、歌词覆盖和波形验证记录 |
| `public/licenses/` | 官方许可快照及来源 |

旧 eSpeak 机械导唱作为独立音频保留，默认 MV 已不使用。FFmpeg 用于音频处理和导出验证；本地伴奏与绮萱歌声合成不调用收费服务。

## 授权

词曲、角色和场景由本项目创作；演唱使用第三方免费授权声库。公开发布需保留明显标识 **“AI 合成歌声：绮萱 · DiffSinger”**，本片已在片头和片尾加入。未使用声库角色画像，也未修改、转换或重新训练权重。

绮萱允许商业及非商业声音作品，须遵守其使用条款。OpenVPI 声码器权重许可与合成作品的使用条件不同，见 [官方许可记录](public/licenses/singing-license-sources.json)。中文字体 Noto Sans SC 使用 SIL OFL 1.1，原授权见 [OFL.txt](public/fonts/OFL.txt)。

完整资源记录见 [asset-provenance.json](public/asset-provenance.json)。独立创作及许可记录不代表绝无版权风险；Remotion 软件许可仍按实际使用者资格适用。
