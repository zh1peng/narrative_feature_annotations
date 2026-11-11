# 特征冗余与精简

> **译者注**　这里的冗余指不同特征携带了相近的信息。两列数值高度相关，可以提示它们存在重叠；是否舍弃其中一列，还取决于研究问题，以及两种测量对哪些场景有效。

# 冗余和简约分析：计算叙事特征提取

本章对照 16 份工具目录，找出输出重复或高度相关的提取器。每组优先推荐一种工具，也说明何时值得同时保留两种测量。最后给出精简组合和完整组合，供不同规模的研究选用。

---

## A. 子类内冗余

这些是产生几乎相同输出的对/组。保留一个；其余的都是可互换的变体。

| # | 冗余组 | 为什么相关 | 保持（同类最佳） | 删除/有条件 |
|---|---|---|---|---|
| 1 | scikit-image 与 OpenCV（颜色/边缘/FFT） | 相同的像素级运算符 | **scikit-image + OpenCV 一起**作为一个引擎（OpenCV 用于解码/速度，skimage 用于统计） | 将其视为单个工具，而不是两个功能 |
| 2 | OpenCV Gabor 滤波器组 vs Pyrtools 与 GIST | 全部 = 定向空间频率能量 | **pyrtools**（有原则的可操纵金字塔） | 仅当需要紧凑的固定长度整体向量时才使用 GIST；删除 OpenCV Gabor |
| 3 | 全局熵/边缘密度与 Rosenholtz 杂波 | 弱杂波代理与强杂波代理 | **Rosenholtz 特征-拥塞 + 子带-熵** | 熵/边缘密度作为杂波而冗余 |
| 4 | OpenCLIP 与 SigLIP 2 | 相同的开放词汇文本探测角色 | **SigLIP 2** | 二选一时保留 SigLIP 2 |
| 5 | Places365 / ImageNet CNN 与 CLIP/SigLIP 探测 | 相同的场景/对象类别 | **SigLIP 2 零样本探针** | 仅保留 Places365 用于固定且可复现的固定分类向量 |
| 6 | Qwen2.5/3-VL vs InternVL3 vs LLaVA-OneVision vs VideoLLaMA3 | 可互换字幕/VQA VLM | **Qwen-VL（图像用 2.5，视频用 3）** | 其他模型不作为主力；通过 API 调用的评判模型仅用于验证 |
| 7 | YOLO-World 与 Grounding DINO | 相同开放词汇检测 | **Grounding DINO**（准确度） | YOLO-World 仅当每帧吞吐量成为瓶颈时 |
| 8 | SAM 2 与 Mask2Former（静态全景） | 重叠分割 | **Mask2Former** 用于合成 | SAM 2 仅用于视频一致跟踪/接地 SAM |
| 9 | OpenFace 2.0 与 OpenFace 3.0 | 取代 | **OpenFace 3.0** | 仅在复现旧版结果或原有动作单元量表时保留 OpenFace 2.0 |
| 10 | 独立 RetinaFace 与 InsightFace | InsightFace 捆绑 RetinaFace | **InsightFace buffalo_l** | 放弃独立的 RetinaFace |
| 11 | ViTPose 与 MMPose RTMPose/RTMW | 相同的关键点 | **MMPose RTMPose/RTMW** | ViTPose 仅在强大的 GPU 上实现最大精度 |
| 12 | EmoNet vs HSEmotion（面 V/A） | 同一张脸价唤醒 | **HSEmotion/EmotiEffLib** | EmoNet 仅可引用交叉检查 |
| 13 | RAFT / MemFlow / VideoFlow / Farneback 与 SEA-RAFT | 相同的密流 | **海筏** | MemFlow（如果需要时间平滑）； Farneback = 无 GPU 后备 |
| 14 | AutoShot 与 TransNetV2 | 同一镜头检测 | **TransNetV2**（+ PySceneDetect CPU 优先） | 放下自动射击 |
| 15 | TimeSformer/VideoSwin/SlowFast 与 VideoMAE V2 / InternVideo2 | 取代的剪辑分类器 | **VideoMAE V2** (+ InternVideo2) | 仅适用于 TAL 功能的旧骨干网 |
| 16 | X-CLIP 与 InternVideo2 零样本对比 | 相同的开放词汇动作角色 | **X-CLIP**（廉价默认） | 如果需要精度，InternVideo2 零样本 |
| 17 | MiDaS/DPT/ZoeDepth 与 Depth-Anything-V2 | 取代深度 | **深度-任意-V2** | 仅当需要公制（米）时才使用 Apple Depth Pro |
| 18 | TASED-Net / UNISAL 与 ViNet 对比 | 相同的视频显著性 | **ViNet**（用于视听的 ViNet-A） | UNISAL 如果需要最轻 |
| 19 | DeepGaze（静态）与 ViNet（视频） | 静态取代视频 | **越南网** | DeepGaze 仅作为纯静态注意力代理 |
| 20 | LAION-美学 / CLIP-IQA 与 Q-Align | 纳入 Q-Align IAA/IQA | **Q-Align/OneAlign** | 当 7B LMM 太重时的轻量级后备方案 |
| 21 | torchaudio / Essentia Spectrum/MFCC 与 librosa | 相同的 DSP 描述符 | **librosa**（主要 MIR） | 粗糙度/节拍的本质； torchaudio 如果 GPU/可微分 |
| 22 | librosa pyin / torchaudio 球场 vs CREPE/Praat | F0较弱 | **Praat (Parselmouth)** + **绉纱** | 删除pyin/torchaudio F0 |
| 23 | openSMILE 抖动/振幅微扰/HNR 与 Parselmouth | 相同的语音质量 | **Parselmouth**（规范） | openSMILE 用于标准化 88 维 eGeMAPS 摘要 |
| 24 | AST / PANN / YAMNet 与 BEATs / PaSST | 高度相关的527类 | **BEATs**（一个主要标记者） | 用于逐帧 SED 的 PANN；仅 YAMNet CPU |
| 25 | Essentia tempo vs madmom/Beat This! | 重叠节拍追踪 | **妈妈/打败这个！** | 精华节奏多余 |
| 26 | openai-whisper / 耳语.cpp / 速度极快 vs faster-whisper | 相同重量 | **faster-whisper + WhisperX** | 掉落变体 |
| 27 | pyannote 3.1 与 Community-1 | 取代 | **pyannote Community-1**（社交目录中的 3.1） | 使用最新的 |
| 28 | WebRTC VAD / audiotok 与 Silero/pyannote VAD | 取代 | **西勒罗 VAD** | 删除旧的 VAD |
| 29 | NeMo ASR /情感2vec+ vs Whisper/audEERING | 重叠的默认值 | **faster-whisper + audEERING wav2vec2-dim** | NeMo 多语言；情感2vec+用于分类 |
| 30 | NLTK 与 spaCy | 取代 | **spaCy (trf)** | 仅适用于 WordNet 同义词集的 NLTK |
| 31 | `surprisal` pkg 与迷你图标 | 直接重叠 | **迷你图标** | 选择一个 |
| 32 | ANEW / MRC / 格拉斯哥 vs 沃里纳 / 布里斯巴特 / 库珀曼 | 较小覆盖范围的范数集 | **Warriner VAD + Brysbaert + Kuperman + NRC-VAD** | 格拉斯哥仅考虑成像能力/尺寸 |
| 33 | Trankit / supar VS spaCy / Stanza / benepar | 重叠解析器 | **spaCy + Stanza + benepar** | 用于多语言细分的 Trankit；超级 CRF 边际值 |
| 34 | 快克雷夫 vs 特立独行 | 取代准确性 | **特立独行** | 用于高吞吐量批处理的 fastcoref |
| 35 | textstat 与 L2SCA | 表面复杂性与深层复杂性 | **L2SCA**（+ Yngve/Frazier） | textstat 廉价滑动窗口标量 |
| 36 | 多语言-e5 / GTE / BGE / API 嵌入与 Qwen3-Embedding | 可互换编码器 | **Qwen3-嵌入** | 选择一个；仅当需要排行榜名列前茅时才使用 API |
| 37 | DMRST / TRIPOD 转折点与指令调整的 LLM | 被 LLM 提取器包含 | **指令调整大语言模型** | 仅当需要可复制标签时才使用受监督模型 |
| 38 | BrainIAK HMM 与 GSBS | 重叠边界检测器 | **GSBS**（自动 K，更快） | 用于软事件后部/重新激活的 HMM |
| 39 | MovieCLIP 与零样本 CLIP / Places365 | 重叠设置分类 | **SigLIP/CLIP 零样本** | MovieCLIP（如果适合 179 部电影分类法） |
| 40 | TalkNet-ASD 与 Light-ASD/LR-ASD | 相同的任务，23 个参数 | **轻-ASD/LR-ASD** | 删除TalkNet |
| 41 | OpenPose 与 RTMPose/ViTPose | 遗产 | **RTM姿势** | 放下开放姿势 |
| 42 | Emotion-LLaMA vs AffectGPT vs 一般 MLLM | 重叠融合/推理 | **一个 MLLM（Qwen-VL 或 GPT-4o）** | 用于基准标签的 Emotion-LLaMA； AffectGPT 对于开放词汇 — 并非全部三者 |

---

## B. 跨子类冗余

这些产品涵盖多个目录，是最容易错过的节省。相同的基础模型或信号出现在多个子类中。

| # | 出现在 | 冗余信号 | 分辨率 |
|---|---|---|---|
| C1 | 面孔、情感、社交 | **面部表情** (Py-Feat / OpenFace 3.0 / HSEmotion / EmoNet) | 运行**HSEmotion**一次；将其输出提供给情感流和社交流。不要针对每个目录单独提取面部情感。 |
| C2 | 面孔、言语、情感 | **语音情感**（HSEmotion音频？否 - audEERING wav2vec2-dim）出现在音频-语音和影响中 | 运行 **audEERING wav2vec2-dim** 一次；双方共享 |
| C3 | 演讲、社交 | **二值化** (pyannote) | 一次 pyannote 运行可提供 ASR 说话者归因和社交说话者转向图 |
| C4 | 言语、低声学、影响 | **韵律 / F0 / 音质** (Parselmouth, openSMILE) | 一张 Parselmouth + openSMILE 通行证；为所有三种用途重新采样 |
| C5 | 面孔、社交、动态视觉 | **身体姿势** (MMPose RTMPose) | 一种姿势运行可提供手势（面部）、接近/触摸（社交） |
| C6 | 面孔、社交 | **凝视** (OpenFace 3.0 / L2CS-Net / Gaze-LLE) | L2CS-Net 或 Gaze-LLE 一次；社交衍生的相互凝视/共同关注 |
| C7 | 面孔、社交、高级对象 | **人脸检测+身份** (InsightFace) | 单个 InsightFace 轨迹可在任何地方提供字符计数/身份 |
| C8 | 动态视觉、情境、动作 | **镜头/剪切边界** (TransNetV2 / PySceneDetect) | 运行一次；共享事件边界先验 |
| C9 | 行动、情境、社会、影响 | **视频-LLM** (Qwen-VL) | **每次射击单个 Qwen-VL 通行证**与组合的多字段提示模式（动作 + 情境 + 社交 + 情感）取代 4 个单独的 VLM 通行证。这是最大的一次计算节省。 |
| C10 | 高级视觉、情境 | **场景/地点识别** (CLIP / Places365) | 一个带有合并标签集的SigLIP探针 |
| C11 | 语义、情感（文本）、词汇 | **文本/对话影响** (RoBERTa-GoEmotions、NRC-VAD、Warriner) | Lexical-VAD 查找和 GoEmotions 在 Language-Lexical 和 Affect 之间共享 |
| C12 | 语义、影响 | **自回归大语言模型令人惊讶**（迷你图标 GPT-2/Llama） | 提取器一台；惊喜既用作理解特征（语义）又用作唤醒代理 |
| C13 | 音频高电平、音频低电平、影响 | **音乐情感/MIR**（Essentia、MERT） | Essentia 运行一次提供节奏/调 (MIR) 和价唤醒 (Affect) |
| C14 | 低层视觉、高级视觉 | **CLIP早期层/取向能量** | 低级分析功能（pyrtools）； CLIP 保留给中/高级 - 不要重复 |

---

## C. 何时值得保留两种测量

尽管表面相似，但这些并不是多余的——记录为单独的流。

| 配对 | 为什么两者都需要 |
|---|---|
| **DINOv2/DINOv3 + SigLIP 2** | 无标签自监督密集嵌入（RSA，无人类标签）与文本探测的可解释概念分数——真正不同的表示 |
| **视频MAE V2 + V-JEPA 2** | 两者都是自我监督的，但 V-JEPA 2 是运动/时间偏差的；互补，不重复 |
| **pymoten（运动能量）+SEA-RAFT（光流）** | 大脑对齐滤波器组回归量与可解释的相机与对象流分解——不同的科学用途 |
| **动作识别 (VideoMAE) + 低级运动 (SEA-RAFT/pymoten)** | 语义“什么动作”与前语义“多少动作”——故意分开层 |
| **表现出的情感（面部/语音/文本模型）+引发的情感（LIRIS-ACCEDE/MuSe 回归量）** | 角色表达的情感与观众引发的情感——相关但不可互换；必须是不同的流 |
| **每模态影响 (wav2vec2 + HSEmotion + GoEmotions) + 融合 MLLM** | 可解释的单峰信号作为主要特征； MLLM 作为附加的推理/融合层，而不是替代层 |
| **绉纱 + Parselmouth F0** | CREPE 清洁剂可去除嘈杂/吱吱作响的语音； Praat 是语音科学抖动/振幅微扰/HNR 的规范 — 保持 Praat 的语音质量，CREPE 以获得稳健的音调轮廓 |
| **openSMILE eGeMAPS + Parselmouth** | openSMILE 的标准化 88 维情感计算摘要与 Praat 的每帧规范轮廓 |
| **Mask2Former（全景构图）+ Grounding DINO（物体盒/计数）** | 面积分数场景组合与离散对象存在/计数/位置 |
| **BEATs（AudioSet 事件）+ CLAP（开放词汇提示）** | 修复了 527 类校准标记与任意自定义文本提示相似性 |
| **inaSpeechSegmenter + pyannote 二值化** | 语音/音乐/噪声分割与谁说话-当扬声器转动时——不同的分区 |
| **词汇惊喜（LLM）+词汇规范（频率/具体性/AoA/VAD）** | 上下文预测错误与上下文无关的单词属性 |
| **spaCy（清晰/快速）+ Stanza（真正的 UD）** | 仅当需要跨工具 UD 方案复杂性指标时才合理；否则选择一个 |
| **GSBS + BrainIAK HMM** | GSBS 用于硬边界/auto-K；仅当软后验/再激活建模是目标时才使用 HMM |

---

## D. 推荐的特征集

### 最小可处理集（单个消费者 GPU + CPU；每种模式一次通过）

设计原则：**每个信号一个提取器，一个共享 VLM 通道，最大程度的跨子类重用。**

**视觉——低级**
- scikit-image + OpenCV 核心（亮度、RMS 对比度、RGB/HSV/CIELAB 颜色、熵、边缘、FFT 斜率、Hasler-Susstrunk 色彩）
- Pyrtools 可操纵金字塔（方向×尺度能量）

**视觉——动态**
- SEA-RAFT（流量大小，相机与对象分解）
- pymoten（脑对齐运动能量回归量）
- TransNetV2 + PySceneDetect（镜头边界 - 与情境/动作共享）

**视觉——高层/面孔/动作/显著性**
- SigLIP 2（对象/场景/地点/属性探测器 - 与情境共享）
- DINOv2（RSA 无标签嵌入）
- InsightFace（人脸计数/身份 - 与 Social 共享）
- OpenFace 3.0（一个模型中的地标 + AU + 凝视 + 情感 - 与情感/社交共享）
- MMPose RTMPose（姿势 - 与社交共享）
- VideoMAE V2（滑动窗口动作后验+嵌入）+ X-CLIP（零样本动作）
- ViNet（视频显著性）+ Depth-Anything-V2（深度）

**音频**
- librosa（光谱/MFCC/色度/起始/节奏）
- openSMILE eGeMAPS（标准化 88 维 LLD）
- Parselmouth（F0、共振峰、抖动/振幅微扰/HNR）
- BEATs（AudioSet 事件）+ CLAP（开放词汇提示）
- inaSpeechSegmenter（语音/音乐/噪音）
- faster-whisper + WhisperX（ASR + 单词对齐）
- pyannote Community-1（二值化 — 与 Social 共享）
- audEERING wav2vec2-dim（人声 A/V/D — 与 Affect 共享）

**语言**
- spaCy trf（POS/dep/NER/morph）
- wordfreq + Brysbaert + Kuperman + Warriner/NRC-VAD + NRC-EmoLex（词汇规范 — 与 Affect 共享）
- 迷你图标 GPT-2/Llama（令人惊讶的 + 隐藏状态 - 与 Semantics 共享）
- benepar + L2SCA（语法复杂性）
- 特立独行（共指）
- Qwen3-Embedding + 滑动窗口一致性/漂移 + BERTopic（语义）
- RoBERTa-GoEmotions（对话影响 — 与 Affect 共享）

**情况/社交/影响（主要通过共享通行证）**
- GSBS（嵌入时间线上的数据驱动事件分割）
- Light-ASD（有源扬声器）
- Gaze-LLE（联合/相互关注）
- HSEmotion（面对 V/A — 或重用OpenFace 3.0 情感）
- **每个镜头一次 Qwen2.5/3-VL 通行证**，具有组合的 JSON 模式，涵盖：密集的动作/事件描述 + 情境维度（空间/时间/因果关系/意图/主角）+ 社交互动类型/主导/隶属/ToM + 描述的情感。 **此单次传递取代了四个单独的 VLM 部署。**
- LIRIS-ACCEDE/MuSe 回归量（观众引发的效价/唤醒 — 与所有描绘的情绪流分开）

该集涵盖每个子类，在一个 GPU 上运行，并消除所有 A/B 部分冗余。

### 全套（当资源/特定精度需要证明合理时添加）

仅在需要独特信号或一流精度的情况下添加到最小集合：

- **视觉低级：** SHINE（文献匹配的规范定义）、Rosenholtz 杂波、GIST（紧凑整体向量）
- **视觉高级：** Grounding DINO（物体框/计数）、Mask2Former（全景构图）、SAM 2（视频跟踪掩模/Grounded-SAM）、Places365（冻结固定分类法）
- **动态：** MemFlow（暂时平滑流）
- **Action：** InternVideo2-1B（更强的零样本/功能）、V-JEPA 2（运动偏向补充）、ActionFormer/OpenTAD（带时间戳的 TAL 片段）、VideoLLaMA3（替代视频-LLM）
- **显著性/深度：** Q-Align（美观+质量）、ResMem（记忆性）、Apple Depth Pro（公制深度）、DeepGaze IIE（静态注视）
- **人脸：** Py-Feat（经过验证的 AU 检测器集）、L2CS-Net（一流的 360° 凝视）、MediaPipe（CPU 冗余层）、InsightFace 年龄/性别
- **音频：** Essentia + madmom/击败这个！ （粗糙度/节拍/MIR + 校准情绪/流派/效价唤醒）、CREPE（稳健的 F0）、mosqito（基于标准的心理声学粗糙度/响度/锐度）、MERT 音乐情感回归量
- **语音**：情感2vec+（分类SER），NeMo Parakeet/Canary（多语言ASR交叉检查）
- **语言：** Stanza（真正的 UD 方案）、GLiNER（自定义实体类型）、LIWC-22（经过验证的代词/功能词方案）、DMRST（可复制的 RST 话语标签）、监督 TRIPOD 转折点、textstat（廉价可读性）、对话行为分类器
- **语义：** API 嵌入（OpenAI/Voyage/Gemini）（如果需要跻身排行榜）
- **情况：** BrainIAK HMM（软事件后验/重新激活）、MovieCLIP（电影分类设置）、Llama-3-70B/GPT-4 转录事件分割
- **社交：** InternVL3 或前沿 API 作为第二个 VLM，用于协议/黄金标签验证； Social-IQ 2.0 / 社会基因组模式可快速构建
- **Affect：** Emotion-LLaMA 或 AffectGPT（基准/开放词汇描绘情感推理）、EmoNet（交叉检查）、EmoBank-VAD 文本回归量、AttendAffectNet（融合诱导 V/A）

---

## E. 要点

1. **最大的节省是将所有高级推理整合到一个视频 LLM 通行证中** (C9)。动作、情境、社交和情感描述语义目前均由 Qwen-VL 级模型实现——每个镜头运行一次，并使用统一的多字段提示，而不是四次。
2. **跨子类共享（B 部分）比子类内修剪节省更多。** 面部表情、凝视、姿势、二值化、韵律、镜头边界、惊讶和词汇 VAD 均出现在 2-4 个目录中 — 提取一次，到处路由。
3. **基础模型取代了大多数固定分类的 CNN**（Places365、ImageNet、YAMNet、AST）——仅当明确需要冻结、校准、可重现的概率向量时才保留后者。
4. **描绘了一个不可协商的“保留两个”与引发的情感**——这是不同的结构，将它们混为一谈是一个科学错误，而不是冗余。
