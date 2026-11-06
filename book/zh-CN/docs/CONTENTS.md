# 项目资源与使用指南

该仓库中所有内容的地图：工具、数据集和提取的衍生数据、到目前为止包含的内容以及如何加载、查看和检查它们。如需实际操作，请在 MATLAB 中运行 [`docs/walkthrough.m`](walkthrough.m)。

> **这个项目是什么。** 将电影或音频故事变成的基础设施
> **逐秒、分层、计算标注**（视觉、音频、语言、社交、情境、情感），以固定维度格式存储并加载到 MATLAB 中，以及用于分析整个语料库中的标注结构并设计高方差/低冗余刺激集的工具。

## 状态一目了然

| 阶段 | 什么 | 状态 |
|-------|------|-------|
| 1 范围综述 | 每个特征类别都有一流的工具 | ✅ `docs/scoping_review/` |
| 2 处理流程 | 24 个提取器 → 固定维度标注 + MATLAB 读取器 | ✅ `src/nfe/`, `matlab/` |
| 3 语料库 | 清单 + 批处理程序； **107 个带标注的刺激**（77 个视听 + 29 个音频故事 + 1 个文本） | ✅ `annotations/corpus/` |
| 4 分析 | 语料库阅读器、查看器、相关性/PCA/网络、设计工具、网络搜索、草稿纸 | ✅ `matlab/`, `analysis/web/`, [`REVIEW_PAPER.md`](REVIEW_PAPER.md) |

---

## 文件夹图

```
README.md                  project overview + quickstart
requirements.txt           Python deps (pipeline)
data/
  manifest.csv / .json     stimulus catalog (107 stimuli) — tools/build_manifest.py
  movies/spacetop/         lab fMRI stimulus clips (49)        [internal]
  movies/open/             CC-BY Blender films (3) + SOURCES.md
  lexicons/                optional psycholinguistic norm CSVs (README.md)
  stories/narratives/      29 Narratives spoken-story audio clips (+ SOURCES.md)
  stories/samples/         pure-text sample story (.txt)
  movies/hcp/, movies/camcan/  placeholders for credentialed stimuli (see EXTERNAL_STIMULI.md)
schema/
  channel_template.json    the 103-channel constant-shape template
  annotation_schema.json   v0.1 pure-JSON profile schema
  example_annotation.json  tiny worked example
src/nfe/                   the Python annotation pipeline (see "Tools")
matlab/                    the MATLAB readers + analysis (see "Tools")
annotations/
  corpus/<id>/<id>.h5      DERIVATIVES: one annotation per stimulus (+ .manifest.json)
  corpus/corpus_index.csv  batch status/index
analysis/figures/          generated analysis figures (PNG)
analysis/corpus_stats.json corpus summary numbers the docs cite (refreshAnalysis)
analysis/web/              interactive segment search (index.html + segments.json + README)
docs/
  CONTENTS.md              ← this file
  walkthrough.m            runnable MATLAB tour
  scoping_review/          Phase 1 review (hierarchy, recommendations, ...)
  design/                  format spec, plans, per-phase status
tools/                     helper scripts (manifest, template, review assembly)
```

---

## 数据集

- **语料库清单：107 个刺激** (`data/manifest.csv`) — 49 `spacetop` 视听片段 + 4 部短片（3 个 CC-BY Blender 开放电影 + *Kung Fury*）+ **29 Narratives 有声故事音频片段**（`data/stories/narratives/`，~5.3 小时；OpenNeuro ds002345，Nastase 等人） + 1 个纯文本示例故事。 77 项视听、29 项纯音频、1 项纯文本。在`data/movies/<source>/`（影片或音频）或`data/stories/<source>/`（音频/文本故事）下添加媒体并重新运行`tools/build_manifest.py`。参见[`ADDING_MOVIES.md`](ADDING_MOVIES.md)； [`EXTERNAL_STIMULI.md`](EXTERNAL_STIMULI.md) 中的凭证集（HCP、CamCAN）。所有 107 个都带有标注；全语料库分析侧重于跨模态共享的音频与语言通道，以及 77 种刺激视听子集的视觉/社交/情感结构（参见[`REVIEW_PAPER.md`](REVIEW_PAPER.md)§5-6）。
- **词典（可选）：** 删除`data/lexicons/<field>.csv`（效价、唤醒度、支配性、具体性、aoa）以点亮每个单词的通道；不存在 → NaN。

---

## 提取衍生数据

`annotations/corpus/<id>/` 处的每个刺激有一个标注：

- **`<id>.h5`** — 规范的 HDF5。层次结构组反映了特征分类：
  ```
  /time/        common 1 Hz grid (rate_hz, t_start_sec, n_samples, time_sec)
  /stimulus/    id, title, modality, duration, source, sha256
  /features/    visual/ audio/ language/ social/ situation/ affect/
                  → each leaf = one channel dataset [n_samples (× dim)] + attrs
                    (dtype, applicable, units, model, version, native_rate_hz, resample)
  /human/       reserved, empty — slots for later human annotation
  /provenance/  per-channel model registry
  ```
- **`<id>.manifest.json`** — 可读的 sidecar：相同的层次结构 + 元数据，没有批量数组。

**固定维度。** 每个文件都有**相同的 103 个通道**（模板）。不是为刺激而生成的通道（不适用于模态的类，或者未运行的传递）与 `applicable=false` 和 all-`NaN` 一起出现，因此语料库堆叠成矩形矩阵。完整规格：[`design/ANNOTATION_FORMAT.md`](design/ANNOTATION_FORMAT.md)。

103 个通道涵盖：**视觉**（37 — 低级、语义 SigLIP2/DINOv2、运动、深度、动作、面孔、姿势、显著性）、**音频**（21 — 低级、AudioSet/CLAP、语音）、**语言**（22 — 词汇、语法、惊喜）、**情感**（14 — 文本情感/情绪、声音、EmoNet 图像）情绪、面部情感、VLM 描述）、**情境**（5 — 包括 GSBS 事件边界）、**社会互动** (4)。每一遍计算的内容：[`design/PHASE2_STATUS.md`](design/PHASE2_STATUS.md)。

---

## 工具

### Python 处理流程 — `src/nfe/`（标注媒体）

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
# annotate ONE movie (CPU passes always on; add MPS/VLM passes as flags):
PYTHONPATH=src .venv/bin/python -m nfe.run data/movies/open/BigBuckBunny.mp4 \
    --vision --audio-hl --events --template schema/channel_template.json
# annotate the WHOLE corpus (resumable, crash-safe):
PYTHONPATH=src .venv/bin/python -m nfe.batch --manifest data/manifest.csv \
    --out annotations/corpus --template schema/channel_template.json \
    --vision --audio-hl --events
```

通过标志：`--vision`（SigLIP2/DINOv2/RAFT/深度/VideoMAE/faces/pose/saliency）、`--audio-hl`（AST/CLAP/vocal-affect/text-emotion/surprisal）、`--reason`（Qwen2.5-VL — 慢）、`--events`（GSBS）。模块：`ingest`（PyAV 解码）、`extractors/`（20 个通道）、`emit`（HDF5+JSON）、`pipeline`/`run`/`batch`、`schema_registry`（骨架填充）。 `tools/`中的助手：`build_manifest.py`、`build_channel_template.py`、`build_search_index.py`（网络搜索界面的分段索引）。

### Web — `analysis/web/`（交互式分段搜索）

浏览器工具可按任意功能组合对片段进行排名并播放匹配的时刻。从项目根目录提供服务，然后打开页面：

```bash
python3 tools/serve.py           # from the project root (Range-enabled, so video seeking works)
# open http://localhost:8000/analysis/web/index.html
```

标注更多刺激后重建索引：`PYTHONPATH=src .venv/bin/python tools/build_search_index.py --seglen 5`。详情：[`../analysis/web/app_readme.md`](../analysis/web/app_readme.md)。

### MATLAB — `matlab/`（加载、查看、分析）

| 功能 | 目的 |
|----------|---------|
| `readAnnotations(path)` | 加载一个 `.h5`/folder/JSON → struct (stimulus, time_sec, features) |
| `getFeature(ann, "audio/low_level/mfcc")` | 一个通道 + 分层路径的元数据 |
| `featuresToTimetable(ann)` | 标量通道 → 公共网格上的时间表 |
| `readAnnotationCorpus(folder)` | 堆叠整个语料库→`C.X [timepoints × channels]`（仅限**标量**通道） |
| `annotationMovieViewer(movie, ann)` | 使用同步标注时间序列+标记播放电影 |
| `analyzeCorpus(C)` | 相关热图、PCA、通道+类网络图 |
| `selectStimulusSet(C)` | D-最优高方差/低冗余段选择 |
| `featureInfo()` | **所有**扩展变量的标签/类别表（类、子类、级别、型号、颜色） |
| `featuresToTable(ann)` | 一个剪辑 → 宽表，**每个向量都扩展**为每个组件列（~2.7k 变量） |
| `readAnnotationCorpusFull(folder)` | 将整个语料库与展开的向量堆叠 → `C.X [timepoints × ~2.7k vars]` + `C.info` |
| `plotFeatureMatrix(C)` | 全特征时间序列的热图，按类别进行颜色编码 |
| `factorAnalysisCorpus(C)` | 所有特征的探索性因子分析 (EFA / `factoran`) + 颜色编码的载荷图 |
| `extractCategoryFactors(C)` | **每个模型/类别**内的因子分析→ `C.extracted_factors`（每个模型因子时间序列），可保存到`.mat` |
| `plotFactorScores()` | 使用 CANlab 工具加载保存的因子并以 6 种方式可视化（时间序列、芒果热图、力导向图、相关矩阵、t-SNE、UMAP）；将 svg+png 保存到 `matlab/figures/` |

---

## 如何加载、查看、检查（MATLAB 操作示例）

```matlab
addpath matlab

% 1) Inspect ONE stimulus
ann = readAnnotations("annotations/corpus/ses-01_run-01_order-04_content-parkour");
tt  = featuresToTimetable(ann);          % scalars as a timetable
stackedplot(tt(:, ["visual__low_level_static__luminance","audio__low_level__rms"]))
mf  = getFeature(ann, "audio/low_level/mfcc");   % a vector channel [n × 13]

% 2) WATCH a movie with its annotations scrolling underneath
m = "data/movies/spacetop/videos/ses-01/ses-01_run-01_order-04_content-parkour.mp4";
annotationMovieViewer(m, "annotations/corpus/ses-01_run-01_order-04_content-parkour")

% 3) Analyze the whole CORPUS (scalar channels — correlation / PCA / design tool)
C   = readAnnotationCorpus("annotations/corpus");
res = analyzeCorpus(C);                   % figures → analysis/figures/
sel = selectStimulusSet(C, "K", 20);      % design a stimulus set; sel.table

% 4) Load the FULL expanded feature set (~2.7k variables: every vector expanded),
%    visualize it color-coded by category, and extract factors with EFA
F   = readAnnotationCorpusFull("annotations/corpus");   % F.X [timepoints × ~2768], F.info labels
plotFeatureMatrix(F, "Clip", "BigBuckBunny");           % heatmap, color-coded by class
fa  = factorAnalysisCorpus(F, "NumFactors", 10);        % EFA + loadings plot; fa.scores = per-timepoint factors

% Python inspection (alternative): h5py / pandas on <id>.h5 and corpus_index.csv
```

> **两个语料库阅读器。** `readAnnotationCorpus` 仅返回 **标量** 通道（`analyzeCorpus`/`selectStimulusSet` 所期望的）。 `readAnnotationCorpusFull` 将每个 **向量** 通道（SigLIP/DINOv2/CLAP 嵌入、AudioSet/action 后验、EmoNet、MFCC 等）扩展为每个组件一列 — 完整的约 2,768 个变量矩阵以及伴随的 `featureInfo` 标签表（类/子类/级别/模型/颜色），用于颜色编码绘图和因子分析。有关变量的组织方式，请参阅[特征图](FEATURE_MAP.md)。

```bash
# 4) SEARCH segments by feature in the browser (serve from project root)
python3 tools/serve.py           # then open http://localhost:8000/analysis/web/index.html
```

请参阅[`walkthrough.m`](walkthrough.m)了解相同的步骤，可逐节运行。

---

## 文档索引

- **特征图（所有 95 个通道）：** [`FEATURE_MAP.md`](FEATURE_MAP.md) — 特征层次结构的图形图；可编辑 SVG，`analysis/figures/feature_map.svg`
- **添加电影/故事：** [`ADDING_MOVIES.md`](ADDING_MOVIES.md) — 如何增长语料库并刷新所有衍生数据 + 语料库特定的文档编号
- **外部刺激（HCP、CamCAN）：** [`EXTERNAL_STIMULI.md`](EXTERNAL_STIMULI.md) — 如何获取有资格/受版权保护的神经影像电影刺激并整合它们
- **综述论文（草稿）：** [`REVIEW_PAPER.md`](REVIEW_PAPER.md) — 模型/算法+标注空间的经验结构（相关性、维度、网络、刺激类型的偶然性、设计工具）
- **范围综述（第一阶段）：** [`scoping_review/`](scoping_review/scoping_index.md)
- **格式规范：** [`design/ANNOTATION_FORMAT.md`](design/ANNOTATION_FORMAT.md)
- **计划和每阶段状态：** [`design/IMPLEMENTATION_PLAN.md`](design/IMPLEMENTATION_PLAN.md)、[`PHASE2_STATUS.md`](design/PHASE2_STATUS.md)、[`PHASE3_CORPUS.md`](design/PHASE3_CORPUS.md)、[`PHASE4_ANALYSIS.md`](design/PHASE4_ANALYSIS.md)
- **冻结特征集：** [`design/PHASE2_CORE_SET_PROPOSAL.md`](design/PHASE2_CORE_SET_PROPOSAL.md)
- **部署：** [`design/DEPLOYMENT_FEASIBILITY.md`](design/DEPLOYMENT_FEASIBILITY.md)
