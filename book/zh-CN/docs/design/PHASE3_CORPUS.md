# 语料库的构建与标注

本阶段汇集实验材料并批量运行标注流程。每份材料对应一份结构统一的标注文件，供第四阶段分析。

## 语料库和清单

`tools/build_manifest.py`扫描`data/movies/**`和`data/stories/**`并写入 **`data/manifest.csv`**（+`.json`）：`id, path, source, modality, duration_sec, fps, width, height, has_video, has_audio, rights`。每当添加媒体时都进行重建。

当前语料库：**107 个刺激 / ~607.8 分钟（~7.8 小时）** — 49 个实验室 `spacetop` 剪辑 + 4 部短片（3 个 CC-BY Blender 开放电影 + *Kung Fury*）+ **29 Narratives 有声故事音频片段**（`data/stories/narratives/`，~5.3 小时）+ 1 个纯文本示例故事（77 个视听、 29 个纯音频，1 个纯文本）。要增长它：将文件放在`data/movies/<source>/`（影片或音频）或`data/stories/<source>/`（音频/文本故事）下，然后重新运行清单（请参阅[`../ADDING_MOVIES.md`](../ADDING_MOVIES.md)；[`../EXTERNAL_STIMULI.md`](../EXTERNAL_STIMULI.md)中的凭证集）。

> **译者注**　此处原文同时列出 607.8 分钟和约 7.8 小时，两者不一致。按分钟换算约为 10.1 小时，与更新后的首页相符。材料明细也未逐项列齐，查询具体条目请以仓库中的 `data/manifest.csv` 为准。

## 批量标注

`python -m nfe.batch` 标注清单条目：

```bash
PYTHONPATH=src .venv/bin/python -m nfe.batch \
  --manifest data/manifest.csv --out annotations/corpus \
  --template schema/channel_template.json \
  --vision --audio-hl --events --source spacetop --max-dur 65
```

- **固定维度：** `--template schema/channel_template.json` → 每个文件都有相同的 103 通道层次结构（未运行/不适用的通道为 `applicable=false` NaN），因此第 4 阶段将它们堆叠成矩形矩阵。
- **可恢复**：跳过 `<id>.h5` 已存在的刺激（`--no-skip` 强制）。
- **崩溃安全**：在处理完每份材料后重写`annotations/corpus/corpus_index.csv`（id，状态，n_measured / n_skeleton，秒，错误）。
- **隔离：** 一个刺激错误不会停止批次。
- 过滤器：`--source`、`--ids`、`--max-dur`、`--limit`。通过：`--vision --audio-hl --reason --events`。 `--fps`（批量默认2）。

输出：每个刺激 `annotations/corpus/<id>/<id>.h5` (+ `.manifest.json`)。

## 运行耗时参考（原作者的 M1 Ultra，使用 MPS）

单次成本（≈，2 fps）：CPU 低级 + ASR + 语言很便宜； `pose` 和帧 VLM/深度/动作通道占主导地位； **`--reason` (Qwen2.5-VL) 约为 50 秒/窗口**，对于长影片来说不切实际。推荐等级：

| 目标 | 配置 | 标注 |
|------|--------|-------|
| 广泛、快速的语料库 | `--audio-hl --events`（CPU+音频） | 许多刺激；视觉 = NaN 骨架 |
| 丰富的刺激 | `--vision --audio-hl --events` | 测量所有类别； 〜分钟/剪辑 |
| + 高级推理 | 添加`--reason` | 仅在此处的短剪辑/采样窗口上 |

扩展：在后台运行完整的语料库（过夜）；索引+跳过现有使其可以安全地恢复。对于生产规模 `--reason`，请在 CUDA GPU 或镜头采样窗口上使用 7B。
