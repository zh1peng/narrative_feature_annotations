# 情境特征

> **译者注**　镜头切换是剪辑层面的变化，事件边界是叙事层面的变化。同一场谈话可以在两位说话人之间反复切镜，观众仍可能把整场谈话理解为同一个事件。

## 情境、图式、脚本与事件分段

这类工具回答两个互补的问题。第一，连续叙事可以从哪里划分为内部相对稳定的事件？BrainIAK 的隐马尔可夫模型（Baldassano，2017）和 Geerligs 的 GSBS 算法都能处理按时间排列的特征矩阵，因此既可用于 fMRI，也可直接处理影片的视觉或语义嵌入。PySceneDetect 和 TransNetV2 提供的镜头切换位置，则可作为低层线索。第二，每一段发生了什么？情境标注可涵盖场所、时段、典型活动脚本，以及空间、时间、因果、意图和主角五个事件索引维度。Places365、MovieCLIP 和零样本 CLIP 可识别场景或环境；Qwen2.5-VL、VideoLLaMA3 等视频模型，以及根据转写文本提问的 GPT-4 类模型，还可按时间定位事件、目标和因果关系。小型实验室可在一块现代 GPU 上运行上述分段算法和 70 亿参数量级的视觉语言模型。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [BrainIAK EventSegment (HMM, Baldassano et al. 2017)](https://github.com/brainiak/brainiak) | 数据驱动的事件边界/将任何连续的特征时间线分割成具有稳定活动（或嵌入）模式的 K 个离散事件；发现事件转换时模式相关性的不连续性。 | 每个时间点的硬或软（后验概率）事件标签分配；事件边界时间点的有序列表；每个事件的平均模式；通过模型比较，最佳事件数量 K（产生事件持续时间/粒度）。运行在刺激衍生的嵌入上来分割电影/音频时间线，而不仅仅是功能磁共振成像。 | 多模态 | 每秒（匹配输入 TR/帧采样）；输入时间步分辨率的边界 | CPU 即可 | 同类首选 | 纳入 |
| [GSBS / statesegmentation (Geerligs et al. 2021, 2022)](https://pypi.org/project/statesegmentation) | **简单来说**：自动将时间线分割成离散的“事件”，其中内容保持内部稳定，标记每个事件边界并对事件进行编号——这是人们如何感知事件结构的操作版本；这是部署的事件分段方法。贪婪状态边界搜索：迭代地放置事件/状态边界，以最大化特征时间线中的状态内模式相似性；通过 t 距离度量自动选择最佳状态数。 | 每个时间点状态/事件标签；对边界时间点进行排序（贪心顺序给出了边界显著性/强度）；最佳状态数；嵌套的层次边界（从细到粗的事件粒度）。适用于任何 T x 特征矩阵，包括电影嵌入。 | 多模态 | 每秒/每个输入时间步长 | CPU 即可 | 同类首选 | 纳入 |
| [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) | 通过帧到帧内容变化（HSV 直方图/内容差异）和自适应阈值进行低级镜头/场景切换检测。 | 镜头边界时间戳和帧索引列表；每帧内容变化分数；镜头片段的开始/结束时间。提供预先与视频时间轴对齐的快速事件边界。 | 视频帧 | 每帧/每镜头 | CPU 即可 | 表现良好 | 纳入 |
| [TransNetV2](https://github.com/soCzech/TransNetV2) | 在标记的镜头过渡上进行深度学习镜头边界检测（硬剪切和逐渐过渡/溶解）。 | 每帧镜头转换概率 (0-1)；导出的镜头边界时间戳和镜头片段。镜头分割准确度约为 87%，而直方图方法的准确度约为 65%；处理逐渐过渡。 | 视频帧 | 每帧/每镜头 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [Places365-CNN (ResNet50/DenseNet161, CSAILVision)](https://places2.csail.mit.edu) | 场景/地点类别识别：将每个帧分类为 365 个物理场景/位置类别之一（例如餐厅、厨房、街道、森林）以及 SUN 场景属性。 | 每帧 365 维场景类别后验（top-k 位置/设置标签）、室内/室外概率和约 102 个场景属性分数（例如“开放区域”、“人造”、“封闭”、“自然光”）。直接产生位置/设置和粗略的空间布局描述符。 | 视频帧 | 帧（每秒采样/镜头） | 可用 GPU 运行 | 表现良好 | 纳入 |
| [MovieCLIP (visual scene recognition in movies)](https://arxiv.org/abs/2210.11065) | 根据脚本（“法庭”、“酒吧”、“宇宙飞船”、“追逐”相关位置等设置）对 179 个标签的以电影为中心的场景分类进行电影调整的视觉场景识别。 | 每镜头/每帧得分超过 179 个电影场景标签（背景位置/设置）；可用于设置聚类的嵌入。比 ImageNet/Places 分类法更适合电影设置。 | 视频帧 | 每镜头/帧 | 可用 GPU 运行 | 可用 | 备选 |
| [Zero-shot CLIP / OpenCLIP (ViT-L/14, ViT-H/14)](https://github.com/mlfoundations/open_clip) | 通过文本提示对任意情境属性进行灵活的零样本分类：位置/设置、室内/室外、一天中的时间、天气、模式/脚本提示（例如“餐厅场景”、“汽车追逐”）。 | 任何用户定义提示集的每帧余弦相似度/softmax 分数（例如，早上/下午/晚上；室内/室外；命名脚本）。每个时间点的连续每个标签分数，完全可定制的分类法。 | 视频帧 | 帧（每秒采样/镜头） | 可用 GPU 运行 | 表现良好 | 纳入 |
| [Qwen2.5-VL (3B/7B/72B, open weights)](https://arxiv.org/abs/2502.13923) | **在此处理流程中**：处理流程要求 Qwen2.5-VL（位于 3B）每秒描述设置 — 简短的场景描述、室内/室外呼叫和粗略设置标签。具有二级时间基础的开放式视频大语言模型：产生类人事件分割和带有时间戳的自由形式情境标记（位置、一天中的时间、目标、原因、主角行为、模式/脚本识别）。 | 带时间戳的事件/段边界（通过绝对时间 MRoPE 编码实现二级）；每个片段的自然语言情景描述可查询到结构化事件索引字段（空间、时间、因果关系、意图、主角）；脚本/模式标签； Charades-STA 时间接地的 MIoU 50.9 (> GPT-4o)。 | 视频片段 | 每秒/每次拍摄/每段（带时间戳） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [VideoLLaMA3 (2B/7B, DAMO/Alibaba)](https://arxiv.org/abs/2501.13106) | 开放多模态视频基础模型，用于密集字幕、时间基础和视频 QA；在整个剪辑中生成情境描述和事件定位。 | 带时间戳的密集字幕/事件片段；每个片段的情景叙述（背景、演员、行动、目标）可解析为情景维度；查询事件的时间基础跨度。 | 视频片段 | 每个段/每个剪辑（带时间戳的接地） | 可用 GPU 运行 | 表现良好 | 备选 |
| [LLM text/transcript event segmentation (GPT-4-class via API; Llama-3 70B open)](https://arxiv.org/abs/2301.10297) | 来自文本/脚本的类人叙事事件分段和情境标注：零样本提示标记事件边界并标记每个事件的模式/脚本、目标、原因、主角、时间和空间。 | 记录中的有序事件边界位置（可通过单词/话语对齐映射到时间戳）；每个事件的结构化情境字段（位置、时间、目标、原因、主角、脚本标签）。 LLM 边界与人类分割一致，并且比人类个体更加一致。 | 转写文本 | 每个话语/每个事件（通过转录对齐的时间戳） | 需要高性能 GPU | 同类首选 | 纳入 |
| Indexter（事件索引计算模型） | Zwaan 事件索引情境模型的符号计算实现：跟踪五个情境维度（时间、空间、因果关系、意图、主角）以及事件之间的连续性/不连续性。 | 每个事件的指数和事件间的连续性得分，沿时间、空间、主角、因果关系、意图维度；情境变化信号预测事件边界。提供构建 LLM/VLM 情景输出的概念模式。 | 文本 | 每个事件 | 不清楚 | 已有替代方案 | 备选 |

**推荐（同类最佳）：** GSBS / statesegmentation（刺激特征时间线上的主要数据驱动事件边界检测器）； BrainIAK EventSegment HMM（替代边界检测器+软事件后验）； TransNetV2（视频的最佳镜头边界先验）； Qwen2.5-VL-7B（开放视频-二级事件分割+情境维度的LLM）；零样本 OpenCLIP（灵活的每帧位置/时间/设置/脚本属性）； Places365-ResNet50（校准的固定分类位置/设置+场景属性）； GPT-4-class / Llama-3-70B LLM（基于转录的类人事件分割+事件索引情境标记，尤其是音频故事）

**可能多余：**
- PySceneDetect -> 被 TransNetV2 取代（仅保留为快速 CPU 优先）
- MovieCLIP -> 重叠零样本 CLIP/Places365；仅当其 179 个电影场景分类法更适合且检查点可访问时才使用
- VideoLLaMA3 -> 与 Qwen2.5-VL 冗余作为情景视频-LLM；选择一个主要的
- BrainIAK HMM vs GSBS -> 重叠边界检测器； GSBS 通常是首选（自动 K，更快），保留 HMM 主要用于软事件后验/召回重新激活建模
- Indexter -> 作为可运行工具被 LLM 情景标记取代；仅保留作为目标本体/模式定义

**开放问题：**
- 事实真相/验证：哪个事件边界时间线（人类密集评级规范，例如每秒边界一致性）将用于验证特定电影/音频刺激的算法与 LLM/VLM 边界？
- 处理流程顺序：首先运行镜头检测 (TransNetV2) 并标记镜头，而不是在连续嵌入时间轴上运行 GSBS/HMM（来自 CLIP/VLM/文本嵌入）以获得独立于摄像机剪切的语义事件？这些给出了不同的粒度。
- 对于纯音频故事，视觉工具不适用；需要确认 WhisperX 式的字级对齐，以将成绩单 LLM 事件边界和情景标签投影到音频时间轴上。
- 结构化输出模式：为五个事件索引维度（空间/时间/因果关系/意图/主角）+脚本/模式标签定义固定的 JSON 模式，以便每秒/分段一致地解析 VLM/LLM 输出。
- 计算预算：单个 24GB GPU 是否可用于 7B 视频 LLM 推理，或者情景标记是否应该回退到视觉流的 API（GPT-4 类）？
- 哪个特征空间为 GSBS/HMM 提供刺激分割（原始 CLIP 帧嵌入、VLM 隐藏状态、语义转录嵌入）会实质性地改变恢复的事件，并且应该进行决定/基准测试。

<details><summary>参考文献</summary>

- **BrainIAK EventSegment (HMM, Baldassano et al. 2017)** — Baldassano et al. 2017 Neuron 'Discovering Event Structure in Continuous Narrative Perception and Memory'; [github.com/brainiak/brainiak](https://github.com/brainiak/brainiak); [brainiak.org/examples/Event_Segmentation.html](https://brainiak.org/examples/Event_Segmentation.html)
- **GSBS / statesegmentation (Geerligs et al. 2021, 2022)** — Geerligs, van Gerven, Guclu 2021 NeuroImage; Geerligs et al. 2022 eLife 'A partially nested cortical hierarchy of neural states'; [pypi.org/project/statesegmentation](https://pypi.org/project/statesegmentation)
- **PySceneDetect** — [github.com/Breakthrough/PySceneDetect](https://github.com/Breakthrough/PySceneDetect); [scenedetect.com](https://scenedetect.com)
- **TransNetV2** — Soucek & Lokoc, 'TransNet V2: An Effective Deep Network for Fast Shot Transition Detection'; [github.com/soCzech/TransNetV2](https://github.com/soCzech/TransNetV2)
- **Places365-CNN (ResNet50/DenseNet161, CSAILVision)** — Zhou et al. 2018 TPAMI 'Places: A 10 Million Image Database for Scene Recognition'; [places2.csail.mit.edu](https://places2.csail.mit.edu)
- **MovieCLIP (visual scene recognition in movies)** — Bose et al., WACV 2023, [arXiv:2210.11065](https://arxiv.org/abs/2210.11065); project page from USC SAIL
- **Zero-shot CLIP / OpenCLIP (ViT-L/14, ViT-H/14)** — Radford et al. 2021 CLIP; [github.com/mlfoundations/open_clip](https://github.com/mlfoundations/open_clip); MovieCLIP uses this labeling recipe
- **Qwen2.5-VL (3B/7B/72B, open weights)** — Bai et al. 2025 'Qwen2.5-VL Technical Report' [arXiv:2502.13923](https://arxiv.org/abs/2502.13923); [huggingface.co/Qwen](https://huggingface.co/Qwen)
- **VideoLLaMA3 (2B/7B, DAMO/Alibaba)** — Zhang et al. 2025 'VideoLLaMA 3' [arXiv:2501.13106](https://arxiv.org/abs/2501.13106); [github.com/DAMO-NLP-SG/VideoLLaMA3](https://github.com/DAMO-NLP-SG/VideoLLaMA3)
- **LLM text/transcript event segmentation (GPT-4-class via API; Llama-3 70B open)** — Michelmann et al. 2025 'LLMs segment narrative events similarly to humans' ([arXiv:2301.10297](https://arxiv.org/abs/2301.10297)); Nature Comms Psychology 2025 [s44271-025-00359-7](https://doi.org/10.1038/s44271-025-00359-7) on LLM-enabled recall/event segmentation
- **Indexter (Event-Indexing computational model)** — Cardona-Rivera et al., 'Indexter: A Computational Model of the Event-Indexing Situation Model'; Zwaan & Radvansky 1998 event-indexing framework

</details>
