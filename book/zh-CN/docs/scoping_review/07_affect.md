# 情感特征

> **译者注**　表现出的情感（depicted affect）属于片中人物或叙事内容；诱发的情感（elicited affect）属于观众。例如，反派在笑，观众却可能感到紧张。研究时要分别记录两者的参照标准。

## 多模态情感测量

不同的输入信号适合不同的时间尺度。EmoNet 和 HSEmotion/EmotiEffLib 逐帧分析面部；audeering wav2vec2-dim 按话语或时间窗分析声音；RoBERTa-GoEmotions 和 EmoBank-VAD 分析文本或对白；基于 MERT 的回归模型分析音乐。Emotion-LLaMA、AffectGPT 以及用作评判模型的 Qwen2.5-VL 或 GPT-4o，则可以在片段或时间窗内综合多种模态。

多数模型估计的是人物通过面部或声音表达出的情感。要估计观众被唤起的情感，需要依据观众反应另行训练，例如使用 LIRIS-ACCEDE、MediaEval 连续标注或 MuSe/SEWA 基准。两类测量可以相关，仍须分别记录。小型实验室可优先在本地使用 audeering wav2vec2 估计语音的效价、唤醒度与支配感，用 HSEmotion EfficientNet 估计面部效价、唤醒度及表情类别，用 RoBERTa-GoEmotions 分析对白，并以 MERT 回归模型处理音乐。需要综合解释时，可由 Qwen2.5-VL 或 GPT-4o 按时间窗融合线索并生成描述；EmoNet 和 Emotion-LLaMA 也可作为备选。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [audeering wav2vec2-large-robust-12-ft-emotion-msp-dim](https://doi.org/10.1109/TAFFC.2022.3179545) | **简单来说：**直接从声音中读出情绪——积极/消极（效价）、精力充沛（唤醒）和主导/自信（主导）。来自原始语音音频的维度情感（说话者声音的描述/表达的影响）；在 MSP-Podcast v1.7 上进行了培训。 | 每个窗口 3 个连续标量：唤醒、支配、效价，每个都在 ~0..1 内。还公开了可用作语音影响嵌入的池化最后一层隐藏状态 (1024-d)。在滑动窗口（例如 0.5-2 秒跳）上运行以获得与音频时间轴对齐的每秒 VAD 时间序列。 | 音频 | 亚秒到每秒（窗口；一次推理过程的感受野） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [HSEmotion / EmotiEffLib (EfficientNet-B0/B2 + MT-MobileFaceNet, AffectNet-trained)](https://arxiv.org/abs/2403.11590) | **简单来说：**屏幕上每张脸上的情绪 - 8 种表情（愤怒、蔑视、厌恶、恐惧、快乐、中立、悲伤、惊讶）以及积极/消极（效价）和强烈程度（唤醒）；这是部署的面部情感模型。每张脸的面部表情：分类情感、连续效价/唤醒度和（多任务变体）动作单元/情感强度。描绘了屏幕上面孔的情感。 | 每帧检测到的人脸：7 或 8 类分类 softmax（愤怒、蔑视、厌恶、恐惧、幸福、中立、悲伤、惊讶）、连续价和唤醒标量（va_mtl 模型），加上倒数第二个嵌入（B0 为 1280-d）作为面部情感特征。聚合每帧的面部以获得场景级信号。 | 视频帧 | 框架（需要上游面部检测器/跟踪器） | CPU 即可 | 同类首选 | 纳入 |
| [EmoNet (face-analysis/emonet, Toisoul et al. Nature Mach. Intell. 2021)](https://github.com/face-analysis/emonet) | 自然条件下面部的连续效价/唤醒和分类表达；描绘了面部情绪。 | 每帧每张脸：连续效价和唤醒 (-1..1)、5 级或 8 级表情概率以及 68 个面部标志。发布 demo_video.py（2024 年添加），用于视频帧上的人脸检测和情感。 | 视频帧 | 逐帧 | 可用 GPU 运行 | 表现良好 | 备选 |
| [RoBERTa fine-tuned on GoEmotions (SamLowe/roberta-base-go_emotions)](https://arxiv.org/abs/2005.00547) | **简单来说：**所说内容所表达的情感，从文字记录中得分超过28种细粒度的情感（钦佩、感激、好奇、愤怒、悲伤、喜悦……）；这是部署的文本情感模型。对话/叙述文本的分类情感（描述语言的情感内容）。 28-情感分类。 | 每个话语/句子：28 个独立的多标签 sigmoid 分数（钦佩、娱乐、愤怒……中性）。通过 VAD 词典 (NRC-VAD / EmoBank) 映射到 Russell 价/唤醒以获得连续代理。通过字幕/ASR 时间戳（每个话语）与时间线对齐。 | 文本 | 每个话语（字幕/ASR 片段级别） | CPU 即可 | 表现良好 | 纳入 |
| [EmoBank / NRC-VAD dimensional text regressor (VAD lexicon + transformer)](https://aclanthology.org/E17-2092/) | 分级尺度上文本的连续价-唤醒-主导（补充分类GoEmotions）。所描绘的语言影响。 | 每个话语：连续效价、唤醒度、支配性标量（通常为 1..9 或标准化）。可以通过在 EmoBank 上微调的变压器回归量或通过对令牌进行平均的词典查找 (NRC-VAD) 来生成。 | 文本 | 逐话语 | CPU 即可 | 可用 | 资源允许时纳入 |
| [MERT-based music emotion regressor (MERT-v1-95M/330M embeddings + V/A head)](https://arxiv.org/abs/2306.00107) | 乐谱/配乐所传达的情感（描述的音乐情感）与言语情感不同。 | 每个音频窗口：连续价和唤醒标量（以及可选的分类情绪标签）。 MERT 每帧产生约 768/1024-d 自监督音乐嵌入；在 DEAM/PMEmo/EmoMusic 上训练的小型回归头映射到 V/A 时间序列。 | 音频 | 每秒（窗口） | 可用 GPU 运行 | 表现良好 | 资源允许时纳入 |
| [Emotion-LLaMA (ZebangCheng/Emotion-LLaMA, NeurIPS 2024)](https://arxiv.org/abs/2406.11161) | 多模态（音频+视觉+文本）情绪识别和关于屏幕上人们情绪状态的自由文本推理。描述情感并附有解释。 | 每个剪辑/窗口：分类情感标签（+ 置信度）加上线索的自然语言解释（面部、韵律、词汇）。强大的零样本传输（例如 DFEW）。在固定窗口（例如 2-5 秒镜头）上运行以获得每个镜头标记+推理的流。 | 多模态 | 每个镜头/每个剪辑（窗口） | 需要高性能 GPU | 表现良好 | 资源允许时纳入 |
| [AffectGPT (zeroQiaoba/AffectGPT, ICML 2025)](https://arxiv.org/abs/2501.16566) | 带有描述性标题的可解释的多模态情感理解；开放词汇（OV-MER）情感而不是固定类别。描绘情感+描述。 | 每个剪辑：开放词汇情感术语以及情感状态及其多模态证据的描述性标题；可以简化为类别/强度。基于 MER-Caption / EMER 数据集（MER2024-SEMI 115k 视频）构建。 | 多模态 | 每个剪辑（窗口） | 需要高性能 GPU | 表现良好 | 备选 |
| [General MLLM as affect annotator (GPT-4o / Qwen2.5-VL-7B/72B with structured prompting)](https://arxiv.org/abs/2502.13923) | **在此处理流程中：** Qwen2.5-VL（3B）还提供了对场景整体描述的情感、效价和唤醒的整体解读。来自帧+ASR+（音频字幕）的窗口级融合情感标注：既描述了角色情感，又通过适当的提示，对观看者意图/诱发情感以及基本原理进行了估计。 | 每个窗口（可配置，例如每次镜头或每 2-5 秒）：带有分类情感、效价/唤醒/支配性估计（1-5 或 -1..1）、强度、置信度和自由文本理由的 JSON。灵活的架构；可以分别询问“角色感觉”和“观众可能的感觉”。 | 多模态 | 每个镜头/每个窗口（可配置） | 仅限 API | 同类首选 | 纳入 |
| [Continuous induced-affect regressors (LIRIS-ACCEDE / MediaEval Emotional Impact; AttendAffectNet)](https://arxiv.org/abs/2010.11188) | 电影片段（不是角色表达的情感）引起的观众诱发效价/唤醒——典型观众感受到的影响，经过连续自我报告+GSR参照标准的训练。 | 每秒：沿着电影时间线连续诱导价和唤醒（-1..1）；一些处理流程还预测恐惧/情绪影响标志。 attendAffectNet 将音频+视觉（+深度）特征与自我注意力融合，以回归连续的 V/A。 | 视频片段 | 每秒 | 可用 GPU 运行 | 可用 | 纳入 |

**推荐（同类最佳）：** audeering wav2vec2-large-robust-12-ft-emotion-msp-dim（语音 VAD）； HSEmotion / EmotiEffLib EfficientNet（面部效价/唤醒+分类）； RoBERTa-GoEmotions + NRC-VAD 映射（对话影响）；基于 MERT 的 V/A 回归量（配乐/音乐影响，如果相关）； Qwen2.5-VL-7B 或 GPT-4o 作为窗口级多模态融合/标注器； LIRIS-ACCEDE/MuSe 训练的连续回归量，用于观看者引发的效价/唤醒（作为与所有表现出的情感模型分开的流保存）

**可能多余：**
- EmoNet 与HSEmotion 是多余的，用于面价/唤醒+分类 — 将 HSEmotion 保留为主要（更快、更轻、更宽松的许可证、活跃的 ABAW 结果），EmoNet 仅用于交叉验证
- AffectGPT 与作为开放 MLLM 融合/推理层的 Emotion-LLaMA 是多余的 — 选择一个（AffectGPT 用于开放词汇/描述性输出，Emotion-LLaMA 用于统包基准标签）
- Emotion-LLaMA/AffectGPT 与通用 MLLM (GPT-4o/Qwen2.5-VL) 重叠 — 专门的 MLLM 添加基准描述情感准确性，通用 MLLM 增加模式灵活性和引发与描述提示；运行所有三个是浪费
- EmoBank/NRC-VAD 维度文本回归量部分重复 RoBERTa-GoEmotions（相同文本、维度与分类视图）——仅在需要跨模态 VAD 对齐时才包含两者
- 每模态堆栈 (wav2vec2 + HSEmotion + GoEmotions) 与任何融合 MLLM 的内部分支重叠；可解释的每模态信号通常更适合作为主要特征，而 MLLM 作为添加的融合/推理层而不是替代层

**开放问题：**
- 该项目是否需要描绘（角色表达）情感、观众引发（诱发）情感，或两者兼而有之？这决定了 LIRIS-ACCEDE/MuSe 风格的回归量是否是强制性的（它是唯一由观众引发的源）与所表现出的情感堆栈。
- 目标时间分辨率：真正的每秒需要滑动窗口推理以及跳跃大小和标签平滑的决策； MLLM-per-shot 标注更便宜，但每秒的电影更粗糙且成本更高。
- 下游使用许可：audeering wav2vec2 (CC-BY-NC-SA)、EmoNet，MLLM 专用模型仅供非商业/研究；如果计划进行任何商业重新分发，请优先选择 Apache/MIT 选项（HSEmotion、GoEmotions、Qwen2.5-VL）。
- 音轨处理：当它们在电影音频中混合时，是否需要源分离来将乐谱影响 (MERT) 与语音影响 (wav2vec2) 分开？
- 真值/验证计划：将使用哪种人工评级基准（SEND、SEWA、MuSe、LIRIS-ACCEDE）来校准和交叉检查自动流，以及如何融合面部/语音/文本流（后期融合与 MLLM）？
- 人脸处理流程依赖性：在产生场景级信号之前，HSEmotion/EmoNet需要上游检测器+跟踪器（RetinaFace/MediaPipe）和多人脸场景策略（which/aggregate）。

<details><summary>参考文献</summary>

- **audeering wav2vec2-large-robust-12-ft-emotion-msp-dim** — Wagner et al. 2023 IEEE TPAMI 'Dawn of Transformer Era in SER'; HF [audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim](https://huggingface.co/audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim)
- **HSEmotion / EmotiEffLib (EfficientNet-B0/B2 + MT-MobileFaceNet, AffectNet-trained)** — Savchenko, HSEmotion (Software Impacts 2022); ABAW 6/7/8 reports [arXiv:2403.11590](https://arxiv.org/abs/2403.11590), [2407.13184](https://arxiv.org/abs/2407.13184); [github.com/sb-ai-lab/EmotiEffLib](https://github.com/sb-ai-lab/EmotiEffLib)
- **EmoNet (face-analysis/emonet, Toisoul et al. Nature Mach. Intell. 2021)** — Toisoul et al. 2021 Nat. Mach. Intell.; [github.com/face-analysis/emonet](https://github.com/face-analysis/emonet)
- **RoBERTa fine-tuned on GoEmotions (SamLowe/roberta-base-go_emotions)** — Demszky et al. GoEmotions ACL 2020; HF [SamLowe/roberta-base-go_emotions](https://huggingface.co/SamLowe/roberta-base-go_emotions)
- **EmoBank / NRC-VAD dimensional text regressor (VAD lexicon + transformer)** — Buechel & Hahn EmoBank EACL 2017; Mohammad NRC-VAD ACL 2018
- **MERT-based music emotion regressor (MERT-v1-95M/330M embeddings + V/A head)** — Li et al. MERT ICLR 2024 ([arXiv:2306.00107](https://arxiv.org/abs/2306.00107)); DEAM/MediaEval; 'Unified MER' [arXiv:2502.03979](https://arxiv.org/abs/2502.03979)
- **Emotion-LLaMA (ZebangCheng/Emotion-LLaMA, NeurIPS 2024)** — Cheng et al. [arXiv:2406.11161](https://arxiv.org/abs/2406.11161) (NeurIPS 2024); [github.com/ZebangCheng/Emotion-LLaMA](https://github.com/ZebangCheng/Emotion-LLaMA)
- **AffectGPT (zeroQiaoba/AffectGPT, ICML 2025)** — Lian et al. [arXiv:2501.16566](https://arxiv.org/abs/2501.16566) / [2407.07653](https://arxiv.org/abs/2407.07653) (ICML 2025); [github.com/zeroQiaoba/AffectGPT](https://github.com/zeroQiaoba/AffectGPT)
- **General MLLM as affect annotator (GPT-4o / Qwen2.5-VL-7B/72B with structured prompting)** — Qwen2.5-VL [arXiv:2502.13923](https://arxiv.org/abs/2502.13923); EmoBench-M [arXiv:2502.04424](https://arxiv.org/abs/2502.04424); MMAFFBen [arXiv:2505.24423](https://arxiv.org/abs/2505.24423); GPT-4o (OpenAI)
- **Continuous induced-affect regressors (LIRIS-ACCEDE / MediaEval Emotional Impact; AttendAffectNet)** — Baveye et al. LIRIS-ACCEDE IEEE TAC 2015; MediaEval Emotional Impact of Movies 2016/2018; AttendAffectNet [arXiv:2010.11188](https://arxiv.org/abs/2010.11188); MuSe/SEWA benchmarks

</details>
