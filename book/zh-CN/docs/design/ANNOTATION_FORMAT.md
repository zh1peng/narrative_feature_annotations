# 标注输出格式规范

> **译者注**　把每个通道想成一张按秒排列的表。亮度每秒只有一个数，嵌入向量每秒可以有几百个数。固定维度指同一通道在不同材料上遵循相同的字段和分量约定；影片长短不同，时间轴也会不同。

**版本与适用范围。** 本文给出 v0.2 设计，整合第一阶段的特征目录，并取代 `schema/annotation_schema.json` 的 v0.1 草案。它规定第二阶段如何将一份刺激材料（一部电影或一个有声故事）的标注写入磁盘，以及 MATLAB 应如何读取这些数据。

本章依次介绍容器格式、时间对齐、特征层级、各通道的元数据、缺失值与人工标注的预留位置，并通过两个时间点的例子说明如何读写。格式以本章为准，`schema/annotation_schema.json` 用于机器校验，`matlab/*.m` 提供参考读取实现。

## 1. 文件格式：HDF5 主文件与 JSON 配套清单

### 1.1 一部影片会产生多少数据？

一部影片每秒可能产生以下几种数据：

- 数百个**标量**，如亮度、RMS 对比度、基频（F0）、光流幅值、情感效价和词汇惊异度。
- 多组**高维向量**，如 AudioSet 的 527 类标签、CLIP／SigLIP 对数十至数百条提示词的评分、Places365 的 365 类场景评分、384–4096 维的 DINO／CLIP／语言模型嵌入，以及数百至数千维的 pymoten 运动能量。姿态还可用 17–133 个各含三个分量的关键点表示。
- **类别或标签**，如场景类别、说话人编号、主题编号、对话行为和叙事阶段。
- **稀疏事件**，如镜头切换、节拍和剧情转折。格式同时保留每个时间格内有无事件的标志，以及事件的起始时刻。

以 1 Hz 采样，两小时影片有 7200 个时间点。如果多个编码器在每个时点合计产生数千个分量，每份材料的稠密数据就可能达到几十 MB 至数 GB。v0.1 草案曾把数组直接写入 JSON。这种表示的体积约为二进制的 3–5 倍，解析慢，通常需要整份读入内存，而且没有原生的带类型多维数组。因此项目把大数组写入 HDF5，保留 JSON 作为便于人阅读的元数据层。

### 1.2 两个文件怎样配合？

每份材料对应一个 **HDF5 主文件**（`.h5`）和一份 **JSON 配套清单**（`.manifest.json`）。清单保留相同的层级和全部元数据，大型数值数组则通过 `data_ref` 指向 HDF5 中的相应位置。

| 要求 | HDF5 + JSON sidecar 如何满足它 |
|---|---|
| 每秒可配置的速率 | 一个共享时间轴数据集；每个通道都与其`[n_samples × …]`对齐。 |
| 语义可读、连贯、**分层** | HDF5 组*是*类似文件系统的层次结构； JSON sidecar 反映了它，并且是人类可读的视图。 |
| 不相关的特征 → null/NaN | 浮点数据集使用`NaN`； `applicable` 属性 + 填充值使“未测量”变得明确且自描述。 |
| 保留的人工标注槽 | 一个顶级`/human/`组，预先创建空的，具有相同形状的合约；从来没有被机器写过。 |
| **可加载到 MATLAB** | HDF5 是MATLAB 原生支持的格式（`h5read`、`h5info`、`h5readatt`），**无需工具箱**； JSON sidecar 通过 `jsondecode` 加载。 |
| 可重复的出处 | 每通道属性（型号、版本、原始采样率、单位、重采样操作）位于数据旁边；全局溯源信息位于`/`。 |
| 可缩放至密集嵌入 | 分块 + gzip 压缩数据集；惰性/部分读取；没有整个文件解析。 |

**Parquet** 是*标量/表格切片*（柱状，非常适合 pandas/Arrow）的强大替代方案，但对于参差不齐的高维每个时间点向量和可变长度事件列表来说它很尴尬，并且 MATLAB 支持 (`parquetread`) 较新且仅限表格。因此，我们选择 HDF5 作为单一规范容器，并**可选地**仅发出标量通道的平面 `*_scalars.parquet` 投影，以方便导出（参见第 3.5 节）。

**纯 JSON 配置文件（仅限小/演示）。** 对于小型剪辑、测试和文档，整个有效负载*可能*内联到 JSON 文件（v0.1 布局）中。阅读器自动检测：如果通道具有内联 `value`，则使用它；如果只有`data_ref`，则读取`.h5`。这使 v0.1 示例保持有效，同时使密集情况变得可行。

### 1.3 每个刺激的磁盘工件

```
annotations/output/<stimulus_id>/
  <stimulus_id>.h5             # canonical: time axis + all feature datasets + attributes
  <stimulus_id>.manifest.json  # readable hierarchy + metadata + data_ref pointers (no bulk arrays)
  <stimulus_id>_scalars.parquet  # OPTIONAL flat export of scalar channels (convenience)
```

自包含替代方案：单个 `.h5` 本身就足够了（它携带所有元数据作为属性）； sidecar JSON 的存在是为了 grep/diff/可读性和纯 JSON 配置文件。

---

## 2. 时间线和对齐约定

### 2.1 通用网格

**每个文件都有一个公共时间网格**，由三个数字定义并具体化为一个数据集：

```
/time/rate_hz        scalar   e.g. 1.0   (configurable; default 1 Hz)
/time/t_start_sec    scalar   e.g. 0.0   (time of the *center* of sample 0; see §2.2)
/time/n_samples      scalar   e.g. 7200
/time/time_sec       [n_samples] float64   center timestamp of each grid bin (always written, even
                                           though derivable, so MATLAB/Python never recompute it)
```

不变式：`time_sec[i] == t_start_sec + i / rate_hz`。 **每个**特征数据集都有主维`n_samples`并且共享这个轴——这使得整个文件成为一个单一对齐的矩阵族。

文件还可以在 `/time/alt/<name>/…` 下声明备用网格（例如 0.5 Hz 粗网格，或用于特定 fMRI 研究的每 TR 网格）；通道通过 `grid` 属性重新采样到备用网格点。默认和常见情况：单个网格。

### 2.2 Bin约定（中心参考、半开）

Grid bin `i` 覆盖连续区间

```
[ t_start_sec + (i - 0.5)/rate_hz ,  t_start_sec + (i + 0.5)/rate_hz )
```

`time_sec[i]`是它的**中心**。所有重采样（第 2.4 节）都将本机样本映射到这些箱中。中心参考（不是左边缘）使特征的网格时间与其总结的间隔的中间对齐，这是大多数神经影像分析期望的惯例，并避免系统性的半箱滞后。该选择在`/time/bin_reference = "center"`中记录一次。

### 2.3 为电网供电的本地费率

每个提取器都有一个**本地速率**（来自第一阶段目录），为以下之一：

| 原生率 | 示例 | 典型的本机步骤 |
|---|---|---|
| `frame` | 亮度、光流、CLIP/DINO 探针、深度、显著性、位姿 | 1/fps（例如 25 Hz，或分析 2 fps） |
| `subsecond` | librosa/openSMILE LLD、Praat F0、CREPE、短跳音频标记器 | ~10–100 赫兹 |
| `second` | 窗口化 VLM/影响/操作窗口 | 1赫兹 |
| `window` | 滑动剪辑模型（VideoMAE 16 帧，CLAP 10 秒） | 依赖于窗口 |
| `utterance` | ASR 片段、对话行为、每个话语的影响 | 不规则的 |
| `word` | 令人惊讶的、词汇规范、POS、LLM 隐藏状态 | 不规则（强制对齐） |
| `shot` / `scene` | 每个镜头的 VLM 字幕、场景标签、情景标签 | 不规则的 |
| `event` | 剪辑、节拍、转折点、事件片段边界 | irregular/sparse |

**原始采样率在每个通道上保留为元数据**（`native_rate_hz`，可能是上面的数字或字符串之一），并且**原始预重采样输出被缓存**（根据 DEPLOYMENT_FEASIBILITY §2.6），因此可以以不同的速率重新生成网格，而无需重新运行模型。

### 2.4 在网格上重新采样（每个 dtype）

每个通道一个重采样规则，由 dtype 选择并记录在 `resample` 属性中。这些符合 DEPLOYMENT_FEASIBILITY §2.7：

| 渠道种类 | 默认重采样操作 (`resample`) | 标注 |
|---|---|---|
| 连续标量（亮度、F0、流量、价） | `mean` | 箱内本机样本的抗锯齿/区域平均值。还可以选择发出 `_std`、`_max` 伴随通道。 |
| 概率/分数 **向量**（AudioSet 527、CLIP 探针、情感后验） | `mean` | bin 内的逐元素均值池。 |
| **嵌入**向量（DINO/CLIP/LLM/Qwen3） | `mean` | bin 中原生向量的平均池（记录 `embed_pool="mean"`）。 |
| 分类/`label`（场景、说话人、主题、对话行为、叙事阶段） | `mode` | 垃圾箱中最常见的本机标签；最长停留时间打破的联系。发出同伴`*_change`边界标志。 |
| `bool` / 存在（言语存在、面部存在） | `any` 或 `frac` | bin 中`any` = ≥1 原生 true；或 `frac` = bin true 的分数（记录哪个）。 |
| 稀疏`event`（剪切、节拍、转折点） | `count` + 发作列表 | 每个 bin 整数计数/标志**和**精确的起始时间列表（第 5.3 节）。 |
| Per-`word` 特征（惊奇、具体、隐藏状态） | `mean` | 按字时间戳分配给其bin，bin内取平均值；同伴 `word_rate`/`word_onset` 通道。 |

没有 bin（超出范围）的本机样本被丢弃；没有本地样本的 bin 是 `NaN`（连续）/空标签（分类）/`0`（计数）——参见§5。

### 2.5 为什么使用单个网格（而不是文件中每项特征的本机数组）

将每个通道保持在一个共享的规则网格上，使文件成为一个连贯的设计矩阵：MATLAB 将其直接加载到 `timetable`，跨特征相关性和 PCA（第 4 阶段）不需要重新插值，并且“不适用 = 正确长度的 `NaN`”在所有刺激中提供**恒定的输出形状**（README 的核心原则）。原始采样率阵列仍然存在 - 在缓存中，并且可以选择在 `/native/<channel>/…` 下为高级用户存档 - 但网格是合同。

---

## 3. 层次化特征布局

### 3.1 顶层结构（HDF5组==层次结构）

```
/                                      (root; global attributes = schema_version, ids, provenance)
├── time/                              the common grid (§2)
├── stimulus/                          (attrs: id, title, modality, duration_sec, source, media_file, sha256)
├── features/                          MACHINE annotations, mirroring the Phase 1 semantic hierarchy
│   ├── visual/
│   │   ├── low_level_static/          luminance, rms_contrast, colorfulness, edge_density, fft_slope, clutter…
│   │   ├── high_level_static/         scene_category, object_presence, clip_probe…, places365, panoptic_fractions
│   │   ├── faces_bodies_gaze/         n_faces, au_intensity, gaze_yaw/pitch, head_pose, pose_keypoints, expression
│   │   ├── dynamic_motion/            flow_magnitude, camera_motion, residual_motion, motion_energy, cut (event)
│   │   ├── action/                    action_posteriors, action_probe, action_segment (event)
│   │   └── saliency_aesthetics_depth/ saliency_entropy, depth_mean, fg_fraction, aesthetic, quality, memorability
│   ├── audio/
│   │   ├── low_level/                 rms, loudness, spectral_centroid, mfcc, chroma, f0, onset_strength, tempo
│   │   ├── high_level/                audioset_tags, clap_probe, scene, speech_music_noise, key, beat (event)
│   │   └── speech/                    asr_text, speaker_id, vad, speech_rate, prosody_f0, ser_arousal/valence/dominance
│   ├── language/
│   │   ├── lexical/                   word, lemma, pos, freq_zipf, concreteness, aoa, valence_norm, emolex_*, surprisal
│   │   ├── syntax/                    dep_depth, clauses_per_tunit, tree_depth, coref_chain_len, dialogue_act, readability
│   │   └── semantics_discourse/       embedding, coherence, drift, novelty, topic_id, topic_vector, narrative_stage, turning_point (event)
│   ├── social/                        n_agents, characters_present, active_speaker, mutual_gaze, joint_attention,
│   │                                  proximity, interaction_type, dominance, affiliation, tom_intention
│   ├── situation/                     location, time_of_day, indoor_outdoor, script_label, event_id, event_boundary (event),
│   │                                  space/time/causation/intention/protagonist (Event-Indexing dims)
│   └── affect/
│       ├── depicted/                  face_valence/arousal, voice_v/a/d, text_valence, music_v/a, categorical_emotion
│       └── elicited/                  induced_valence, induced_arousal, fear_flag   (separate stream from depicted)
├── human/                             RESERVED for later human annotation (§5.4); same shape contract; empty at emit
│   ├── visual/ … affect/              (mirrors features/ subgroups; created empty)
│   └── _free/                         free-form human channels not in the machine taxonomy
└── provenance/                        per-class model registry, env locks, params hashes (§4.3)
```

顶级类和子类正是第一阶段层次结构（视觉/音频与语言/社交/情境/情感）。程序遍历组；人类读取 JSON sidecar，它具有相同的树。

### 3.2 一片叶子=一个通道=一个HDF5数据集+属性

每个叶子特征都是由通道命名的**一个数据集**，形状为`[n_samples]`（标量/标签/布尔/事件）或`[n_samples × D]`（向量/嵌入）或`[n_samples × K × C]`（例如姿势`K`关键点×`C`坐标），元数据作为该数据集**上的**HDF5属性携带（§4）。数据集的 HDF5 路径*是*其分层路径，例如`/features/visual/low_level_static/luminance`。

### 3.3 数据类型编码

| `dtype` | HDF5存储 | 空编码 |
|---|---|---|
| `scalar` | float64 `[n]` | `NaN` |
| `vector` | 浮点32/浮点64 `[n × D]` | 整行`NaN`（未测量） |
| `bool` | int8 `[n]` (0/1) | `-1`（如果存储为浮点数，则为浮点`NaN`） |
| `categorical` | int32 `[n]` **代码** + `categories` attr（字符串数组） | 代码`-1`↔`<undefined>` |
| `label` | 可变长度 UTF-8 字符串 `[n]` | 空字符串 `""` ↔ 未测量 |
| `event` | 参见§5.3（每个 bin `count` int32 `[n]` + 起始列表组） | 数`0` |
| `text`（例如 ASR 单词） | 可变长度 UTF-8 字符串 `[n]` | `""` |

分类通道存储**整数代码+一个`categories`属性**（标签词汇），因此MATLAB直接重建一个`categorical`数组并分析保持数字； `label`/`text` 通道直接存储自由词汇案例（ASR 单词、LLM 自由文本标签）的字符串。

### 3.4 矢量通道带有分量轴

`[n × D]`矢量数据集具有`components`属性：一个长度为`D`的字符串数组，用于命名每列（例如AudioSet类名称、CLIP提示字符串、MFCC索引、关键点名称）。维度没有单独意义的嵌入设置`components = []`并依赖于`dim`/`model`元数据。这使得每个向量都可以自我描述，无需外部密码本。

### 3.5 可选的平面标量导出

对于快速表格工作，处理流程还可以发出`<id>_scalars.parquet`：每个时间点一行，每个**标量**通道一列，列名称=带有`/`→`__`（`visual__low_level_static__luminance`）的斜杠路径，加上`time_sec`列。这是一个有损便利投影（没有向量/标签/事件）； `.h5`仍然具有权威性。

---

## 4. 各特征通道的元数据

### 4.1 每个通道的必需+可选属性

作为数据集上的 HDF5 属性（以及 sidecar 中的 JSON 键）携带。必需标记为 **R**。

| 属性 | 类型 | 含义 |
|---|---|---|
| `dtype` **R** | 字符串 | §3.3 之一。 |
| `applicable` **R** | 布尔值 | `false` ⇒ 特征不适用于该刺激方式；值全为空（第 5.2 节）。 |
| `units` | 字符串 | 例如`"0-1"`、`"Hz"`、`"dB"`、`"bits"`、`"1-9 (Warriner)"`、`"-1..1"`、`"deg"`。 `""`/缺席无单位或绝对。 |
| `model` **R** | 字符串 | 生产工具/模型，例如`"scikit-image"`、`"SigLIP2-so400m"`、`"faster-whisper-large-v3"`。 |
| `version` **R** | 字符串 | 模型检查点+代码版本，例如`"0.24.0"`，`"siglip2-so400m-patch14-384"`。 |
| `native_rate_hz` **R** | 数字或字符串 | 数字 Hz，或“帧”之一|亚秒级|第二|窗户|话语|词|射击|场景|事件`。 |
| `resample` **R** | 字符串 | 用于映射原生→网格的操作（§2.4）：`mean|模式|任何|压裂|计数|总和|最大|最近的`。 |
| `components` | 字符串[] | 向量数据类型的列名称（第 3.4 节）；对于不透明嵌入为空。 |
| `categories` | 字符串[] | `categorical`的标签词汇（代码↔标签映射）；索引=代码。 |
| `dim` | 整数 | `D` 用于矢量/嵌入通道。 |
| `grid` | 字符串 | `"default"` 或备用网格名称（§2.1）。 |
| `tier` | 字符串 | 出处：`cpu|图形处理器|重GPU|api`（来自 DEPLOYMENT_FEASIBILITY）。 |
| `params_hash` | 字符串 | 生成此通道的模型参数/配置的内容哈希。 |
| `notes` | 字符串 | 自由文本（例如“无语音时为空”）。 |
| `confidence_ref` | 字符串 | 通往同伴`[n]`信心通道的可选路径。 |

### 4.2 伴随通道（不确定性和色散）

当模型公开它时，通道 `X` 可能有同级通道：

- `X_conf` — 每个时间点的置信度/概率（例如 ASR avg_logprob、检测分数、发声概率）；
- `X_std`, `X_max` — 当许多原生样本折叠到一个网格箱中时的箱内分散；
- `X_change` — 分类/标签通道的边界/起始标志。

这些是具有自己的元数据的普通通道；父级通过`confidence_ref`指向它们。

### 4.3 全局起源（`/provenance`+根属性）

```
/  (root attributes)
   schema_version   = "0.2"
   pipeline_version = "<git-describe>"
   generated_utc    = "2026-06-13T12:00:00Z"
   common_grid_rate_hz = 1.0

/provenance/
   models/        attr-per-model: name → {version, tier, env, params_hash, citation}
   env_locks/     names of the locked envs used (core-cv, torch-vision, speech, llm, …)
   stimulus_sha256
   transcript_source = "whisperx" | "supplied"
```

这满足了自述文件的“可重现的出处”：每个通道都与一个模型条目相关联，该模型条目与锁定的环境和参数哈希相关联。

---

## 5. 空值、适用性和保留的人工标注预留位

### 5.1 三种不同的“缺失”状态——从未混为一谈

| 状态 | 含义 | 编码 |
|---|---|---|
| **不适用** | 特征类别无法应用于此模式（纯音频故事中的视觉效果） | `applicable=false` attr **和** 值全部 - `NaN`/`""`/`-1` 以获得全长 |
| **此处未测量** | 适用，但没有本地样本落入此垃圾箱（例如沉默→无字，无语音） | 每个元素`NaN`/`""`/`code=-1`/`count=0`； `applicable=true` |
| **测量为零/不存在** | 模型运行并报告零/不存在（例如检测到 0 个面孔，响度 ≈ 0） | 实际数值（`0`，低浮点数）— **不** null |

`applicable` 标志加上按元素填充值可以让下游分析区分 *“未测量”* 和 *“测量为零”* — README 的明确要求。浮点通道使用 IEEE `NaN`（在 MATLAB 中本机读入为 `NaN`）；分类使用代码`-1`；标签/文本使用`""`；事件使用`0`。

### 5.2 不适用的特征仍然存在，全长，全空

当刺激仅是音频时，每个 `visual/*` 通道仍会以正确的 `[n_samples × …]` 形状发出，并填充 `NaN`/`""`/`-1` 和 `applicable=false`。这保证了**在整个语料库中具有恒定的输出形状和层次结构**，因此交叉刺激矩阵、PCA 和 Phase-4 设计工具永远不必对给定刺激具有哪些类进行特殊处理。

模态 → 适用类别门（来自 IMPLMENTATION_PLAN“适用性规则”）：

| 刺激方式 | 适用的顶级课程 |
|---|---|
| `audiovisual` | 视觉、听觉、语言、社交、情境、情感（全部） |
| `video-only` | 视觉、情境、情感描述、社交（无言语衍生的语言/情感） |
| `audio-only` | 音频、语言、社交*、情境、情感（无视觉） |
| `text-only` | 语言、情境、社交*、情感（仅限文本分支） |

（*社交/情境降级为可从可用模式导出的子集；每个通道 `applicable` 标志携带确切的事实。）

### 5.3 稀疏事件

`event` 通道存储为每个 bin **count** 数据集以及一个保存准确时间的 **onset group**：

```
/features/visual/dynamic_motion/cut            int32 [n]   per-bin cut count (resample="count")
/features/visual/dynamic_motion/cut__onsets/
    time_sec     [m] float64      exact onset times (m = total events)
    value        [m] (optional)   per-event payload (e.g. transition type, confidence)
```

因此，事件既是可网格化的（`[n]`计数/标志，可用作回归量）又是精确的（开始列表，用于精确计时）。节拍、转折点、场景边界、动作片段遵循相同的模式；分段类型事件添加配对的`__offsets`列表。

### 5.4 保留的人工标注槽（`/human/`）

顶级 `/human/` 组镜像 `/features/` 子组树，但在机器发出时 **创建为空** - 没有数据集，只有组骨架 - 加上一个 `/human/_free/` 组，用于不适合机器分类的人类通道。属性：

- **相同的通道合约。** 后来的人类（或人机循环工具）使用*相同*模式将通道写入`/human/<class>/<sub>/<name>`：`[n_samples]`与`/time`对齐，使用`dtype`、`applicable`、`model="human"`、`version=<rater id / protocol>`、`resample`、`notes`。
- **永远不会自动填充。** 机器运行仅（重新）创建空骨架；他们从不在`/human/`下写入，因此重新运行处理流程永远不会破坏人类的工作。 （编写器应该追加，并且处理流程不得覆盖现有的 `.h5` 的 `/human/` 组 - 发出新文件或合并。）
- **可发现。** `/human` 具有属性 `populated = false`，直到添加人员通道为止；读者将 `ann.human` 公开为与 `ann.features` 形状相同的（最初为空）结构。
- **人类的来源。** 人类通道在其属性中记录评估者 ID、指令/协议版本和日期，与模型通道记录 `model`/`version` 完全相同，因此人类和机器标注是一流的并且同样可追溯。

在 **JSON sidecar / pure-JSON profile** 中，这是 `human_annotations` 对象：发出时为空 `{}`，稍后填充与 `features` 相同的分层形状。

---

## 6. 工作示例（~2 个时间点）

下面是 1 Hz 的 *视听* 剪辑的 **JSON sidecar** 视图（可读层），显示了两个网格时间点和每种类型的代表性通道。批量向量通过`data_ref`指向`.h5`；小通道内联`value`以提高可读性。语言特征在`t=0`处为空表示“适用但未测量”（还没有语音）；整个 `affect/elicited` 示例显示了与所描述的影响*分离的*流。

```jsonc
{
  "schema_version": "0.2",
  "stimulus": {
    "id": "demo_movie_001", "title": "Demo clip", "modality": "audiovisual",
    "duration_sec": 2.0, "source": "user-supplied",
    "media_file": "data/movies/demo_movie_001.mp4", "sha256": "ab12…"
  },
  "time": {
    "rate_hz": 1.0, "t_start_sec": 0.0, "n_samples": 2,
    "bin_reference": "center", "time_sec": [0.0, 1.0]
  },
  "features": {
    "visual": {
      "low_level_static": {
        "luminance": {
          "dtype": "scalar", "applicable": true, "units": "0-1",
          "model": "scikit-image", "version": "0.24.0",
          "native_rate_hz": 25, "resample": "mean",
          "value": [0.41, 0.43]
        }
      },
      "high_level_static": {
        "scene_category": {
          "dtype": "categorical", "applicable": true,
          "model": "SigLIP2-so400m", "version": "siglip2-so400m-patch14-384",
          "native_rate_hz": "frame", "resample": "mode",
          "categories": ["kitchen", "hallway", "street"],
          "value": [0, 1]                        // codes -> "kitchen", "hallway"
        },
        "clip_probe": {
          "dtype": "vector", "applicable": true, "dim": 3,
          "model": "SigLIP2-so400m", "version": "siglip2-so400m-patch14-384",
          "native_rate_hz": "frame", "resample": "mean",
          "components": ["a kitchen", "a person cooking", "an empty hallway"],
          "data_ref": "/features/visual/high_level_static/clip_probe"   // [2 x 3] in .h5
        }
      },
      "dynamic_motion": {
        "cut": {
          "dtype": "event", "applicable": true, "units": "count",
          "model": "TransNetV2", "version": "1.0",
          "native_rate_hz": "frame", "resample": "count",
          "value": [0, 1],                         // one cut landed in bin t=1
          "onsets": { "time_sec": [1.04], "value": ["hard"] }
        }
      }
    },
    "audio": {
      "low_level": {
        "loudness": {
          "dtype": "scalar", "applicable": true, "units": "LUFS-rel",
          "model": "librosa", "version": "0.10.2",
          "native_rate_hz": 100, "resample": "mean",
          "value": [0.62, 0.71]
        }
      },
      "high_level": {
        "audioset_tags": {
          "dtype": "vector", "applicable": true, "dim": 527,
          "model": "BEATs", "version": "iter3+",
          "native_rate_hz": "window", "resample": "mean",
          "components": ["Speech", "Music", "..."],         // 527 names (truncated)
          "data_ref": "/features/audio/high_level/audioset_tags"   // [2 x 527] in .h5
        }
      }
    },
    "language": {
      "lexical": {
        "valence_norm": {
          "dtype": "scalar", "applicable": true, "units": "1-9 (Warriner)",
          "model": "Warriner-norms", "version": "2013",
          "native_rate_hz": "word", "resample": "mean",
          "value": [null, 6.2],                    // t=0 NaN: no speech in that bin (not measured)
          "notes": "null where no word onset falls in the bin"
        }
      },
      "semantics_discourse": {
        "embedding": {
          "dtype": "vector", "applicable": true, "dim": 1024,
          "model": "Qwen3-Embedding-0.6B", "version": "0.6B",
          "native_rate_hz": "utterance", "resample": "mean",
          "components": [],                         // opaque embedding dims
          "data_ref": "/features/language/semantics_discourse/embedding"  // [2 x 1024]
        },
        "narrative_stage": {
          "dtype": "categorical", "applicable": true,
          "model": "Llama-3.1-8B-Instruct", "version": "4bit",
          "native_rate_hz": "scene", "resample": "mode",
          "categories": ["setup", "conflict", "climax", "resolution"],
          "value": [0, 0]                           // both bins "setup"
        }
      }
    },
    "social": {
      "n_agents": {
        "dtype": "scalar", "applicable": true, "units": "count",
        "model": "InsightFace-buffalo_l", "version": "0.7",
        "native_rate_hz": "frame", "resample": "mean",
        "value": [2.0, 2.0]                          // measured 2 (not null)
      }
    },
    "affect": {
      "depicted": {
        "face_valence": {
          "dtype": "scalar", "applicable": true, "units": "-1..1",
          "model": "HSEmotion-EfficientNet-B2", "version": "va_mtl",
          "native_rate_hz": "frame", "resample": "mean",
          "value": [0.10, 0.30]
        }
      },
      "elicited": {
        "induced_valence": {
          "dtype": "scalar", "applicable": true, "units": "-1..1",
          "model": "LIRIS-ACCEDE-regressor", "version": "1.0",
          "native_rate_hz": "second", "resample": "mean",
          "notes": "viewer-elicited; distinct stream from affect.depicted",
          "value": [0.05, 0.12]
        }
      }
    }
  },
  "human_annotations": {},     // empty skeleton mirrors features/ (see §5.4)
  "provenance": {
    "pipeline_version": "0.2.0", "generated_utc": "2026-06-13T12:00:00Z",
    "models": {
      "SigLIP2-so400m": { "version": "siglip2-so400m-patch14-384", "tier": "gpu", "env": "torch-vision" },
      "BEATs": { "version": "iter3+", "tier": "gpu", "env": "audio-tag" }
      /* … */
    }
  }
}
```

对于**纯音频**故事，整个`features.visual`子树仍然存在且完整，每个通道`applicable=false`和`value`都是`NaN`（标量）/`-1`代码（分类）/`""`（标签）。形状与视听文件相同；只有 `applicable` 和填充值不同。

---

## 7. MATLAB 读取工具接口

MATLAB 原生读取 HDF5（`h5read`、`h5info`、`h5readatt`）并通过 `jsondecode` 读取 JSON — **核心阅读器不需要工具箱**。参考实现位于`matlab/`。

> **实现状态。** 已实现和验证：`readAnnotations`（.h5、文件夹或 JSON）、`getFeature`、`featuresToTimetable(ann)`（无名称-值选项；仅限标量/布尔/事件通道，不适用的通道为 NaN），以及 `readAnnotationCorpus`、`analyzeCorpus`、`selectStimulusSet`、`refreshAnalysis`、 `annotationMovieViewer`。下面标记为 *（计划）* 的签名 — `listFeatures`、`getFeatureMatrix`、`writeHumanChannel`、`"Lazy"` 选项和 featuresToTimetable 的名称-值选项 — 是设计目标，尚未实现。

高层签名：

```matlab
% --- Load -----------------------------------------------------------------
ann = readAnnotations(path)
%   READANNOTATIONS  Load one annotation into a MATLAB struct.
%   PATH may be the .h5, the .manifest.json, or the stimulus folder.
%   If given JSON-with-data_ref, reads bulk arrays from the sibling .h5;
%   if given pure-JSON, uses inline values; if given the .h5, reads everything
%   from it (metadata from attributes). Returns:
%     ann.stimulus  struct   (id, title, modality, duration_sec, source, sha256)
%     ann.time      struct   (rate_hz, t_start_sec, n_samples, bin_reference)
%     ann.time_sec  double[n] column   (the common grid; always materialized)
%     ann.features  struct   nested groups mirroring the hierarchy; each leaf is
%                            a channel struct (see below)
%     ann.human     struct   same shape as features (empty until humans populate)
%     ann.provenance struct
%   JSON null / HDF5 fill -> NaN (numeric), "" (label/text), <undefined> (categorical).

% A leaf channel struct:
%   ch.value         numeric [n] | [n x D] | categorical [n] | string [n] | int [n]
%   ch.dtype, ch.applicable, ch.units, ch.model, ch.version,
%   ch.native_rate_hz, ch.resample, ch.components (string[]), ch.categories,
%   ch.notes, ch.onsets (struct .time_sec/.value for event dtypes)

% --- Navigate / select ----------------------------------------------------
ch = getFeature(ann, "visual/low_level_static/luminance")
%   GETFEATURE  Retrieve one channel by hierarchical (slash) path. Errors if the
%   path is not a leaf channel. Works for features/ and human/ paths.

paths = listFeatures(ann, namevalue)
%   LISTFEATURES  Return the slash-paths of all channels, filterable by:
%     "Class","visual" | "Dtype","scalar" | "Applicable",true |
%     "Modality",... | "Pattern","*valence*"
%   Use to discover what a file contains without manual traversal.

% --- Reshape for analysis -------------------------------------------------
tt = featuresToTimetable(ann, namevalue)
%   FEATURESTOTIMETABLE  Collect channels into a MATLAB timetable on the common
%   grid (RowTimes = seconds(ann.time_sec)). Options:
%     "Dtypes",["scalar","bool"]   which kinds to include (default scalars)
%     "Class","audio"              restrict to one branch
%     "ExpandVectors",true         explode [n x D] vectors into D named columns
%     "IncludeNaNApplicable",false drop all-NaN inapplicable channels
%   Variable names are the slash-path with "/"->"__". Vector/label/event channels
%   are skipped unless ExpandVectors / explicit Dtypes request them.

M = getFeatureMatrix(ann, paths)
%   GETFEATUREMATRIX  Stack a list of channel paths into one [n x P] numeric
%   matrix (scalars) for PCA / correlation / the Phase-4 design tool; returns the
%   column->path map and propagates NaN.

% --- Corpus level (Phase 4) ----------------------------------------------
C = readAnnotationCorpus(folder, namevalue)
%   READANNOTATIONCORPUS  Load many annotation files into a struct array (or a
%   stacked timetable keyed by stimulus_id), enforcing the constant-shape
%   contract so cross-stimulus matrices align. Options mirror featuresToTimetable.

% --- Write-back (human-in-the-loop) --------------------------------------
writeHumanChannel(path, "social/interaction_type", values, namevalue)
%   WRITEHUMANCHANNEL  Append a human annotation channel under /human/ in the .h5
%   (and update the JSON sidecar), validating length == n_samples and stamping
%   model="human", version=<RaterId>, plus protocol/date attributes. Never
%   touches /features/.
```

给读者的设计笔记：

- **无工具箱依赖性**可供读取：`h5read`/`h5info`/`h5readatt` + `jsondecode` 是基础 MATLAB。 `timetable`/`categorical` 是 MATLAB 基础。 （Parquet 导出读取不需要通过 `parquetread` 提供额外的工具箱，这是自 R2019a 以来的基础。）
- **惰性选项。** `readAnnotations(...,"Lazy",true)` 仅读取元数据 + 时间轴，并推迟批量数据集读取，直到 `getFeature`/`getFeatureMatrix` 触及它们 - 对于多 GB 嵌入通道很重要。
- **分类往返。** 整数代码 + `categories` 属性直接重建 MATLAB `categorical`，因此代码 `-1` 变为 `<undefined>` 并且网格数学保持数字状态。
- **固定维度保证**让 `readAnnotationCorpus` 堆叠异构刺激而无需按文件分支：存在不适用的通道和 `NaN`，因此语料库矩阵是矩形的。

---

## 8. 决定摘要

1. **HDF5 规范，每个激励一个文件**，具有 **可读的 JSON sidecar 清单**；可选平`*_scalars.parquet`出口；小/演示文件的纯 JSON 配置文件。无需工具箱即可全部加载到 MATLAB 中。
2. **一个共享的、可配置的公共网格**（默认1 Hz），中心参考半开箱，物化`time_sec`；每个通道共享 `n_samples` 引导轴。本地费率保留为元数据；缓存原始本机输出以进行重新网格化。
3. **分层组**反映第一阶段语义层次结构（视觉/音频与语言/社交/情境/情感，带有子类）；每片叶子都是一个数据集+自描述属性。
4. **每通道元数据**：模型、版本、原始采样率、重新采样操作、单位、组件/类别、层、参数哈希；全球起源将通道与锁定的环境联系起来。
5. **三个明确的缺失状态** - 不适用（`applicable=false`，全空），未测量（元素`NaN`/`""`/`-1`/`0`），测量为零（实际值） - 永远不会合并。
6. **保留的`/human/`组**镜像机器树，在发射时为空，从不自动破坏，具有相同的通道合约和人工评估来源。
7. **MATLAB reader** (`readAnnotations`、`getFeature`、`listFeatures`、`featuresToTimetable`、`getFeatureMatrix`、`readAnnotationCorpus`、`writeHumanChannel`) 将文件加载到公共网格上的结构体和时间表中。
