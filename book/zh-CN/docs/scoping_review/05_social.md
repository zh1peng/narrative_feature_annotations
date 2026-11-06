# 社会互动特征

> **译者注**　文中的 agent 通常指片中的人物或其他能够行动的主体。画面里有两个人，是对共同出现的测量；判断两人正在交谈，还需要关于互动的证据。

## 从人物线索到社会互动

影片中的社会互动可以分两层标注。第一层是可直接提取的线索：人物数量和身份、每段话由谁说、画面中谁正在开口、人物看向哪里，以及姿态、距离或接触情况。第二层涉及社会意义，例如合作还是冲突、支配还是亲近、人物的意图，以及一个人如何理解另一个人的想法。目前缺少能稳定识别这些维度的专用检测器。原文建议先用成本较低的工具逐秒建立人物与说话人轨迹、距离和视线关系，再把这些线索与抽样画面交给 Qwen2.5-VL、InternVL3 或经 API 调用的视频视觉语言模型。提示词参照 Social-IQ 2.0、Social Genome 和 SIV-Bench 等基准设计，按镜头或场景输出结构化标注。文献中许多社会推理研究提供的是评测基准，实际标注仍需要单独的模型。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [pyannote-audio 3.1 (speaker-diarization-3.1)](https://huggingface.co/pyannote/speaker-diarization-3.1) | 音轨中的“谁在何时说话”：按说话者身份对音轨进行分段，这是对话中“谁与谁交谈”的支柱。 | 每段说话者标签（匿名 SPK_00、SPK_01、...）以及开始/结束时间；每秒可导出的 one-hot active-speaker-id 向量、发言者计数、重叠/串扰标志、轮流转换。用于跨场景身份链接的可选扬声器嵌入（192-d）。 | 音频 | 每个话语/每个段，可重新采样到每秒 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [Light-ASD / LR-ASD (CVPR 2023)](https://arxiv.org/abs/2303.04439) | 视听主动发言者检测：每帧屏幕上的哪张脸正在说话，将二值化发言者与可见代理联系起来（对于视频中谁与谁交谈至关重要）。 | 每面、每帧说话概率/二元标签；与面部轨迹相结合，可以产生每秒“X 脸正在说话”的信号、听者与说话者的角色，以及与凝视融合时的收件人推断。 | 多模态 | 逐帧 | 可用 GPU 运行 | 表现良好 | 纳入 |
| [InsightFace (SCRFD/RetinaFace detection + ArcFace/buffalo_l recognition)](https://insightface.ai/arcface) | **在此处理流程中：** 轻量级人脸检测器 (MTCNN) 提供每秒出现的代理数量。存在的代理的数量和身份：检测每帧的面部，并通过电影中的面部嵌入聚类分配持久的角色身份。 | 每帧人脸计数+边界框； 512-d ArcFace 嵌入；每轨字符 ID（聚类/图库匹配后）；每秒“出现的字符”集；为社交网络图播种的共存矩阵（哪些角色共享框架）；头部姿势（偏航/俯仰/滚动）和年龄/性别估计。 | 视频帧 | 每帧、每镜头/每秒聚合 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [Gaze-LLE (CVPR 2025, Highlight)](https://arxiv.org/abs/2412.09586) | 凝视目标估计和联合注意力：每个人都在场景中注视，从而实现互相注视（相互凝视）、注视同一对象（共享/联合注意力）和收件人检测。 | 画面上的每人注视热图+预测注视目标点；框内/框外凝视标志；可导出的每秒相互注视（二人看着对方）和联合注意力（多人注视同一目标）二进制信号和注视方向向量。 | 视频帧 | 每帧（专为 VideoAttentionTarget 设计），每秒可聚合 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [RTMPose / ViTPose (MMPose) + ByteTrack](https://arxiv.org/abs/2303.07399) | **在此处理流程中：**身体姿势关键点（通过 torchvision Keypoint R-CNN）给出每秒最接近的一对人之间的距离。多人 2D 身体姿势和跟踪：提供人与人之间的距离（接近度）、方向/朝向、触摸/接触候选者以及潜在的隶属关系和交互的手势提示。 | 每帧每人 17/133 个关键点骨架，带有轨道 ID；每秒导出的特征：成对的人际距离、身体方向（面向/远离）、重叠/接触标志（当两个人的关键点重合时触摸代理）、接近/后退速度、手势/姿势描述符。 | 视频帧 | 逐帧 | 可用 GPU 运行 | 表现良好 | 纳入 |
| [Qwen2.5-VL (7B / 72B, Instruct)](https://qwenlm.github.io/blog/qwen2.5-vl) | **在此处理流程中：**处理流程要求 Qwen2.5-VL 视觉语言模型来判断社交场景 - 交互类型以及人们的主导/自信程度（在 3B 部署）。通过结构化视频提示实现高级社交语义：交互类型（合作/冲突/支配/隶属）、谁与谁交谈的叙述、意图、共同注意解释、场景级社交描述——真正社交标签的主要引擎。 | 您定义的每个镜头/每个剪辑的结构化输出：交互类型分类标签、主导/隶属评级、代理关系描述、ToM/意图自由文本或标量评级、对话收件人归因、社交网络边缘建议；支持事件定位的时间接地（时间戳）。 | 多模态 | 每个剪辑/每个镜头（采样帧），带有时间戳接地 | 需要高性能 GPU | 同类首选 | 纳入 |
| [InternVL3 (8B / 38B / 78B)](https://arxiv.org/abs/2504.10479) | 用于相同交互类型/ToM/关系标记层的替代高级社交语义VLM；原生多模态预训练提供了强大的视频社交场景推理。 | 与 Qwen2.5-VL 相同的可配置每个剪辑社交标签：交互类别、主导/从属关系、意图/心理状态推断、代理关系和社交网络边缘建议、接地社交描述。 | 多模态 | 每个剪辑/每个镜头 | 需要高性能 GPU | 表现良好 | 备选 |
| [Frontier multimodal APIs (Claude Opus 4.x, GPT-4o, Gemini 2.x) as social-reasoning judges](https://arxiv.org/abs/2502.15109) | 当本地 VLM 不足或生成黄金标注来验证本地处理流程时，提供最高质量的高级社会推理（ToM、意图、冲突/合作细微差别、主导/从属关系、心理状态归因）。 | 每个镜头/每个场景的结构化 JSON：交互类型标签、主导/从属/效价评级、带有基本原理、收件人和关系图的 ToM/心理状态推断；可以产生类似于社会基因组的扎根推理痕迹。 | 多模态 | 每个剪辑/每个场景（采样帧或脚本） | 仅限 API | 表现良好 | 资源允许时纳入 |
| [Social-IQ 2.0 / Social Genome / SIV-Bench (benchmark + schema resources)](https://arxiv.org/abs/2502.15109) | 不是标注器，而是定义支柱：丰富社交的视频 QA 和有根据的推理数据集，定义社交互动标签分类、证据类型（视觉/口头/声音提示 + 外部知识）以及用于设计和验证 VLM 提示层的评估协议。 | 提供标签模式、多项选择社交推理项目和 5,777 个引用视觉/语言/声音证据的带标注的推理步骤（社交基因组）——用于构建提示模板、小样本样本和社交特征提取器的保留评估集。 | 多模态 | 每个剪辑（数据集级别） | CPU 即可 | 可用 | 纳入 |

**推荐（同类最佳）：** pyannote-audio 3.1（谁说话，何时）； Light-ASD/LR-ASD（有源扬声器/谁在屏幕上讲话）； InsightFace SCRFD+ArcFace（代理计数+角色身份+共存）； Gaze-LLE（注视目标/共同注意/相互注视）； RTMPose 或 ViTPose（接近/触摸/方向姿势）； Qwen2.5-VL（用于交互类型、主导/隶属、ToM/意图标记的主要本地 VLM）

**可能多余：**
- TalkNet-ASD — 被 Light-ASD/LR-ASD 取代（相同任务，相同 mAP 的参数增加约 23 倍）
- OpenPose — 传统，被 RTMPose/ViTPose 取代，用于多人姿势
- InternVL3 — 与 Qwen2.5-VL 冗余，作为主要的本地社会推理 VLM；最多保留一项主要+可选协议检查
- Frontier API (GPT-4o/Gemini/Claude) — 与用于常规标注的本地 VLM 冗余；用于金标验证/蒸馏的储备
- DeSIQ / VEGAS / 人类行为地图集 / SIV-Bench — 重叠的社会基准，与 Social-IQ 2.0 + 社会基因组作为所选模式源冗余
- 专用 HOI/二元交互检测器（HOTR、PRTT、ViPLO）——以图像为中心，没有强大的视频社交交互类型 SOTA； VLM 层取代它们用于电影时间轴使用

<details><summary>参考文献</summary>

- **pyannote-audio 3.1 (speaker-diarization-3.1)** — [huggingface.co/pyannote/speaker-diarization-3.1](https://huggingface.co/pyannote/speaker-diarization-3.1); [github.com/pyannote/pyannote-audio](https://github.com/pyannote/pyannote-audio)
- **Light-ASD / LR-ASD (CVPR 2023)** — [github.com/Junhua-Liao/Light-ASD](https://github.com/Junhua-Liao/Light-ASD); [arxiv 2303.04439](https://arxiv.org/abs/2303.04439) (Light-ASD); IJCV 2025 LR-ASD
- **InsightFace (SCRFD/RetinaFace detection + ArcFace/buffalo_l recognition)** — [insightface.ai/arcface](https://insightface.ai/arcface); [github.com/deepinsight/insightface](https://github.com/deepinsight/insightface)
- **Gaze-LLE (CVPR 2025, Highlight)** — [arxiv 2412.09586](https://arxiv.org/abs/2412.09586); [github.com/fkryan/gazelle](https://github.com/fkryan/gazelle)
- **RTMPose / ViTPose (MMPose) + ByteTrack** — [arxiv 2303.07399](https://arxiv.org/abs/2303.07399) (RTMPose); ViTPose NeurIPS 2022; [github.com/open-mmlab/mmpose](https://github.com/open-mmlab/mmpose)
- **Qwen2.5-VL (7B / 72B, Instruct)** — [qwenlm.github.io/blog/qwen2.5-vl](https://qwenlm.github.io/blog/qwen2.5-vl); HF Qwen2.5-VL
- **InternVL3 (8B / 38B / 78B)** — OpenGVLab InternVL3; arxiv InternVL3
- **Frontier multimodal APIs (Claude Opus 4.x, GPT-4o, Gemini 2.x) as social-reasoning judges** — Social Genome ([arxiv 2502.15109](https://arxiv.org/abs/2502.15109)) uses such models as graders; provider API docs
- **Social-IQ 2.0 / Social Genome / SIV-Bench (benchmark + schema resources)** — [cmu-multicomp-lab.github.io/social-iq-2.0](https://cmu-multicomp-lab.github.io/social-iq-2.0); [cmu-multicomp-lab.github.io/social-genome](https://cmu-multicomp-lab.github.io/social-genome); [arxiv 2502.15109](https://arxiv.org/abs/2502.15109); [arxiv 2506.05425](https://arxiv.org/abs/2506.05425) (SIV-Bench)

</details>
