# 如何添加影片和故事

如何增长语料库并刷新取决于特定刺激集的所有内容（标注、搜索索引、分析数据和文档中特定于语料库的数字）。当您仅添加媒体时，提取器代码、架构/模板、范围综述和格式规范**不会**更改。

---

## 对于用户

### 1. 添加媒体
将文件拖放到 `data/movies/` 的源子文件夹下：

```
data/movies/<source>/...        e.g. data/movies/myset/clip01.mp4     (movies / audio)
data/stories/<source>/...       e.g. data/stories/myset/story01.txt   (stories)
```

- **电影**：任何视频容器（`.mp4 .mkv .mov .avi .webm .m4v`）。自动检测模态（仅视听/视频）。
- **音频故事**：音频文件 (`.wav .mp3 .m4a .flac .aac .ogg`) — 检测为 `audio-only`；视觉通道记为`NaN`（不适用）。
- **纯文本故事：** 纯文本文件 (`.txt .text .story`) — 检测为 `text-only`。文本被放置在估计的**按阅读速度估计的时间轴**（约 3 个词/秒）上，因此它共享 1 Hz 网格；语言、文本情感、惊喜和事件通行证运行，视觉/音频通道为 `NaN`。 （Markdown `.md` 被视为文档，而不是故事。）将故事放在 `data/stories/<source>/` 下（或 `data/movies/` — 两者都会被扫描）。
- 每个**来源**使用一个子文件夹（保持出处/权利整洁）。如果材料有许可条款，请在该子文件夹中添加 `SOURCES.md`（请参阅 `data/movies/open/SOURCES.md`）。
- **经过认证的神经影像刺激**（HCP 7T 电影、CamCAN Hitchcock 剪辑）：这些需要数据访问请求 - 请参阅[`EXTERNAL_STIMULI.md`](EXTERNAL_STIMULI.md)。占位符文件夹 `data/movies/hcp/` 和 `data/movies/camcan/` 已为它们准备好。

### 2. 刷新——两个选项

**选项A（最简单）**：告诉Claude *“我在`data/movies/<source>/`下添加了媒体，刷新数据集和文档”*。 Claude 运行下面的操作手册并更新所有内容。

**选项B（自己做）：**
```bash
# 1) manifest + annotate NEW stimuli (resumable) + rebuild search index
tools/refresh_corpus.sh                 # add --reason for the VLM pass; --no-skip to redo all
# 2) regenerate figures + the corpus stats the docs use (in MATLAB)
matlab -batch "addpath matlab; refreshAnalysis('annotations/corpus')"
# 3) update the corpus-specific numbers in the docs from analysis/corpus_stats.json
#    (ask Claude, or edit the files listed in the runbook below)
```

### 3. 验证
- `annotations/corpus/corpus_index.csv` — 每个刺激一行，`status` = 正常/跳过/错误。
- `analysis/figures/*.png` 和 `analysis/corpus_stats.json` — 重新生成。
- 网页搜索：按步骤1自动重建；重新打开`analysis/web/index.html`。
- 在查看器中抽查新刺激：`annotationMovieViewer(movie, annDir)`。

### 标注
- **可恢复**：现有标注被跳过；仅处理新的刺激。长片需要一段时间（尤其是`--reason`）；如果需要，运行过夜。
- **模板稳定**：添加媒体**不会**更改 103 通道模板。仅当您更改*提取器集*时才重建它 (`tools/build_channel_template.py`) — 然后用 `--no-skip` 重新标注所有内容。
- 硬件/运行时指导：`docs/design/PHASE3_CORPUS.md`、`design/DEPLOYMENT_FEASIBILITY.md`。

---

## 给自动化助手（Claude）的操作步骤

添加媒体后要求刷新时：

1. **标注 + 索引** — `bash tools/refresh_corpus.sh`（根据要求转发 `--reason` / `--source` / `--no-skip`）。可恢复。对于许多/长时间的刺激，在后台运行它并监视`annotations/corpus/corpus_index.csv`（计数`*/*.h5`，观察`status=error`）。这会重建 `data/manifest.csv` 和 `analysis/web/segments.json`。

2. **分析 + 统计** — 在 MATLAB 中（通过 MCP）：`addpath matlab; cd <root>; refreshAnalysis("annotations/corpus")`。重新生成`analysis/figures/*.png`并写入 **`analysis/corpus_stats.json`**。

3. **从`analysis/corpus_stats.json`（键→位置）更新语料库相关文档**。 `refreshAnalysis`在`full.*`下导出完整语料库统计数据，在`av_subset.*`下导出视听子集统计数据（论文的结构图是AV子集），并为任何退出分析的类导出NaN——这里的NaN意味着“没有足够的数据”，而不是“将文档更新为NaN”。
|统计键 |更新于 | |---|---| | `n_stimuli`、`total_minutes`、`by_source`、`by_modality` | `README.md`（第 3 阶段行）、`docs/CONTENTS.md`（数据集 + 文件夹映射计数）、`docs/REVIEW_PAPER.md` §5、`docs/design/PHASE3_CORPUS.md` | | `n_timepoints`、`full.n_channels_analyzed`、`av_subset.n_channels_analyzed` | `REVIEW_PAPER.md` §5/§6 | | `full.pcs_to_80`, `av_subset.pcs_to_80` (+ `pc1_5_pct`) | `REVIEW_PAPER.md` §6.2，`PHASE4_ANALYSIS.md` | | `class_visual_social`、`class_audio_social`、`class_audio_visual` | `REVIEW_PAPER.md` §6.3，`PHASE4_ANALYSIS.md` | | `contingency.visual_social_*`、`contingency.audio_social_*` | `REVIEW_PAPER.md` §6.4 | | `design_greedy`、`design_random`、`design_k`、`design_n_source_stimuli` | `REVIEW_PAPER.md`§7，`PHASE4_ANALYSIS.md`| |可搜索段/通道数 |从 `build_search_index.py` 标准输出 → `PHASE4_ANALYSIS.md` |

4. **表面结果** — `SendUserFile` 重新生成的`analysis/figures/*.png`（如果有用）。
5. **内存** — 使用新的语料库大小和日期更新项目内存。
6. **健全性检查** — `corpus_index.csv` 有 0 个错误； `readAnnotationCorpus`加载期望的N；恒定的 103 通道形状仍然适用于所有文件；如果添加的源需要新的`SOURCES.md`/权限，请创建它。

### 边缘情况
- **新模式**（仅音频/仅文本）：支持。确认不适用的类以 `applicable=false` NaN 骨架的形式出现（模板填充处理此问题）。文本故事在估计的阅读率时间线上运行语言/情感/事件传递（`--audio-hl --events`达到文本情感+惊讶；词汇/语法始终开启）。
- **提取器设置已更改**（不仅仅是新媒体）：重建模板（全栈短片上的`tools/build_channel_template.py`）→使用`--no-skip`重新标注所有内容→然后执行步骤2-6。
- **失败：** 每个刺激的错误被隔离并记录在`corpus_index.csv`（`status=error`，消息）中；逐一调查。

### 仅添加媒体时不需要更新
`src/nfe/**`、`matlab/**`、`schema/**`（模板稳定）、`docs/scoping_review/**`、`docs/design/ANNOTATION_FORMAT.md`、`docs/design/PHASE2_*` 和此文件。
