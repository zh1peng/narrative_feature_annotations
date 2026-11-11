# 项目概况

本项目为认知科学和自然情境神经影像研究提供逐秒标注工具。输入一部电影或一个故事，就可以得到按时间和语义类别组织的特征，覆盖从画面、声音等感知信号到语言、社会互动、叙事情境与情感的多个层次。

每份材料使用相同的输出结构。不适用的数值通道显式记为 `NaN`，例如纯音频故事的视觉特征。格式中还预留了人工标注的位置，项目附带轻量级 MATLAB 读取工具。

[阅读中文版导读](introduction.md) · [查阅英文原书](https://canlab.github.io/narrative_feature_annotations/) · [站点构建说明](docs/DEPLOYING.md)

### 103 个通道的特征图谱

[![叙事特征图谱](analysis/figures/feature_map.svg)](docs/FEATURE_MAP.md)

图中按层级列出各项特征。[SVG 矢量图](analysis/figures/feature_map.svg)可用 PowerPoint、Illustrator 或 Inkscape 编辑。通道更新后可运行 `python3 tools/build_feature_map.py` 重新生成。

## 项目阶段

| 阶段 | 目标 | 状态 |
|-------|------|--------|
| **1.范围综述** | 调查所有特征类别的计算标注工具；按语义层次结构进行组织；推荐一流的功能与冗余的功能。 | ✅ 草稿已完成 — 请参阅[`docs/scoping_review/`](docs/scoping_review/scoping_index.md) |
| **2.处理流程建设** | 选择最终特征/模型集（通过人工输入）；本地或通过 API 部署模型；生成分层的逐秒标注 + MATLAB 阅读器。 | ✅ 所有类别都有 24 个提取器；固定维度输出；见[`docs/design/PHASE2_STATUS.md`](docs/design/PHASE2_STATUS.md) |
| **3.语料库标注** | 组装电影/故事（用户提供+来源）；在整个语料库中运行标注。 | ✅ 清单 + 可恢复的批处理程序； **107 个带标注的刺激**（电影、电影、29 个有声故事、一个文字故事）。 [`docs/design/PHASE3_CORPUS.md`](docs/design/PHASE3_CORPUS.md) |
| **4.分析与传播** | 跨语料库的 MATLAB 分析；综述论文；交互式网络搜索界面；实验设计/刺激选择工具。 | ✅ 语料库阅读器、同步查看器、关联/PCA/网络、设计工具、网络搜索、[审查文件草稿](docs/REVIEW_PAPER.md)。 [`docs/design/PHASE4_ANALYSIS.md`](docs/design/PHASE4_ANALYSIS.md) |

## 仓库布局

```
docs/
  scoping_review/      # Phase 1 output: the hierarchical scoping review
  design/              # plans, schema design, deployment feasibility
schema/                # annotation output format (spec + JSON schema + example)
src/nfe/               # the pipeline package
  base.py              #   types, common-grid TimeGrid, resampler
  ingest.py            #   PyAV decode + audio extraction
  emit.py              #   HDF5 + JSON-sidecar writer
  pipeline.py, run.py  #   orchestration + CLI
  extractors/          #   one module per feature pass
matlab/                # MATLAB reader (readAnnotations / getFeature / featuresToTimetable)
data/
  movies/              # input movies (spacetop/ = lab stimuli; open/ = CC-BY test films)
  stories/             # input audio stories
annotations/
  corpus/<id>/         # corpus derivatives: <id>.h5 + <id>.manifest.json per stimulus
                       #   + corpus_index.csv (batch status)
analysis/
  figures/             # generated analysis figures
  corpus_stats.json    # corpus summary numbers the docs cite
  web/                 # interactive segment-search app
tools/                 # helper scripts (manifest, template, search index, refresh)
```

## 快速入门（第二阶段处理流程）

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
PYTHONPATH=src .venv/bin/python -m nfe.run data/movies/open/BigBuckBunny.mp4 --rate 1.0
```

请参阅 [`docs/design/PHASE2_STATUS.md`](docs/design/PHASE2_STATUS.md) 了解今天运行的内容和接下来运行的内容。

## 设计原则

- **通用时间网格。** 每项特征都有一个原始采样率（帧、亚秒、每秒、每个话语）；所有内容都被重新采样到可配置的公共网格（默认为 1 Hz），并保留原始采样率元数据。
- **显式缺失值。** 不适用的标注是 `NaN`，永远不会默默省略，因此下游分析可以区分“未测量”和“测量为零”。
- **分层 + 可读。** 输出按 `docs/scoping_review/` 中的语义层次结构组织，因此人类可以阅读它并且程序可以遍历它。
- **本地优先**。更喜欢开放的、可本地部署的模型；仅当托管大型模型明显优越且不可替代时，才会使用它们。
- **可重复的出处。** 每项特征都会记录生成它的模型名称、版本和参数。

## 从这里开始

- **[`docs/CONTENTS.md`](docs/CONTENTS.md)** — 文件夹、工具、数据集、提取的衍生数据以及如何加载/查看/检查它们的完整指南。
- **[`docs/walkthrough.m`](docs/walkthrough.m)** — 可运行的 MATLAB 常见操作概览。
- **[`docs/REVIEW_PAPER.md`](docs/REVIEW_PAPER.md)** — 审查草案：模型/算法以及整个语料库标注空间的经验结构。
- **[`docs/ADDING_MOVIES.md`](docs/ADDING_MOVIES.md)** — 如何添加电影/故事并刷新整个数据集（标注、搜索索引、图表和语料库特定的文档编号）。

## 关键文件

- **范围综述（第 1 阶段输出）：** [`docs/scoping_review/`](docs/scoping_review/scoping_index.md) — 146 个工具，涵盖 15 个特征子类、语义层次结构、冗余分析和一流的建议。
- **标注输出格式：** [`docs/design/ANNOTATION_FORMAT.md`](docs/design/ANNOTATION_FORMAT.md) — 权威的 v0.2 规范（HDF5 规范 + 可读的 JSON sidecar；公共网格；显式缺失值；保留的人工标注槽；MATLAB 阅读器接口）。 `schema/annotation_schema.json` 是用于小型/演示文件的 v0.1 纯 JSON 配置文件，`matlab/*.m` 是该配置文件的参考阅读器。
- **第二阶段核心集冻结表：** [`docs/design/PHASE2_CORE_SET_PROPOSAL.md`](docs/design/PHASE2_CORE_SET_PROPOSAL.md) — 可填写的决策文档；确认冻结了第 2 阶段的构建范围。
- **部署可行性：** [`docs/design/DEPLOYMENT_FEASIBILITY.md`](docs/design/DEPLOYMENT_FEASIBILITY.md)。
- **完整计划：** [`docs/design/IMPLEMENTATION_PLAN.md`](docs/design/IMPLEMENTATION_PLAN.md)。
