# 推荐工具与特征组合

> **译者注**　本章汇总范围综述中的选型建议。若要知道某个模型是否已经接入当前代码，可对照第二阶段的[提取器与实现进度](../design/PHASE2_STATUS.md)。

本节将特征目录和冗余分析转化为可操作的每类建议。对于每个特征类别（及其子类），它指定了同类最佳工具、要提取的关键要素、该工具是否在本地运行以及优先级：**核心**（最小的易处理集 - 每个信号一个提取器、最大跨子类重用、单个消费者 GPU + CPU）或**扩展**（仅在资源或特定精度/独特信号需求证明合理时添加）。

## 推荐表

| 类别 | 子类 | 推荐工具 | 输出特征 | 本地？ | 优先级 |
|---|---|---|---|---|---|
| 视觉 | 低级静态视觉 | scikit-image + OpenCV + NumPy | 平均亮度、RMS 对比度、RGB/HSV/CIELAB 颜色平均值+标准、香农熵、边缘密度、FFT 功率谱斜率、GLCM/LBP 纹理 | 是（CPU） | 核心 |
| 视觉 | 低级静态视觉 | Hasler-Susstrunk colorfulness (direct impl) | 色彩指数 M、平均 a*/b*（暖度）、HSV 饱和度、主色调 | 是（CPU） | 核心 |
| 视觉 | 低级静态视觉 | pyrtools / plenoptic steerable pyramid | 每个子带（尺度 x 方向）能量；方向能量和空间频带向量 | 是（CPU） | 核心 |
| 视觉 | 低级静态视觉 | SHINE (+ SHINE_color) | 规范亮度、RMS 对比度、一维旋转平均傅立叶振幅谱 + 斜率 | 是（CPU） | 扩展 |
| 视觉 | 低级静态视觉 | Rosenholtz Feature-Congestion + Subband-Entropy | 全局杂波标量（+每像素图）、颜色/对比度/方向杂波子组件 | 是（CPU） | 扩展 |
| 视觉 | 低级静态视觉 | GIST / spatial envelope | 固定长度整体取向能量描述符（例如 512-d） | 是（CPU） | 扩展 |
| 视觉 | 高级静态视觉（对象/场景/地点/属性） | SigLIP 2 | 图像嵌入 (768-1152-d) + 对象/场景/地点/属性标签集的每个提示 sigmoid 分数 | 是（GPU） | 核心 |
| 视觉 | 高级静态视觉 | DINOv2 / DINOv3 | 无标记 CLS 嵌入 (384-1536-d) + 用于 RSA/线性探针的密集补丁图 | 是（GPU） | 核心 |
| 视觉 | 高级静态视觉 | Grounding DINO 1.5/1.6 | 每个对象框 + 自由文本标签 + 置信度（存在/计数/位置） | 是（GPU） | 扩展 |
| 视觉 | 高级静态视觉 | Mask2Former / OneFormer (panoptic) | 每像素类图+实例掩码；每个类别的面积分数、对象计数、组成向量 | 是（GPU） | 扩展 |
| 视觉 | 高级静态视觉 | SAM 2 | 视频跟踪实例掩码（大小、计数、轨道 ID）；通过接地 SAM 进行标签 | 是（GPU） | 扩展 |
| 视觉 | 高级静态视觉 | Places365 ResNet-50 | 冻结 365 维场景后部 + 室内/室外 + 场景属性（可重现的固定分类法） | 是（CPU） | 扩展 |
| 视觉 | 面孔/身体/目光/表情 | OpenFace 3.0 | 地标 + FACS AU + 眼睛注视 + 头部姿势 + 离散情感（一个多任务模型） | 是（CPU） | 核心 |
| 视觉 | 面孔/身体/目光/表情 | InsightFace buffalo_l (RetinaFace + ArcFace) | 面部bbox +分数，5/106/68标志，头部姿势，年龄/性别，512-d身份嵌入 | 是（GPU） | 核心 |
| 视觉 | 面孔/身体/目光/表情 | MMPose RTMPose / RTMW | 每人 17 个身体或 133 个全身关键点 (x,y,conf) -> 姿势、手势、方向 | 是（GPU） | 核心 |
| 视觉 | 面孔/身体/目光/表情 | Py-Feat | 经过验证的 AU 概率/强度 + 7 种情绪 + 头部姿势（Fex 时间序列） | 是（GPU） | 扩展 |
| 视觉 | 面孔/身体/目光/表情 | L2CS-Net | 高精度注视偏航/俯仰 -> 3D 注视矢量 | 是（GPU） | 扩展 |
| 视觉 | 面孔/身体/目光/表情 | MediaPipe Tasks | 478 个面部网格地标、52 个混合形状、33 个身体 + 21 个手部地标（CPU 冗余层） | 是（CPU） | 扩展 |
| 视觉 | 动态视觉（运动/流动） | SEA-RAFT | 密集 (u,v) 流 -> 平均流幅度、方向直方图、相机与对象运动分解 | 是（GPU） | 核心 |
| 视觉 | 动态视觉 | pymoten | 高暗度运动能量滤波器组向量（脑对齐编码回归量） | 是（CPU） | 核心 |
| 视觉 | 动态视觉 | TransNetV2 + PySceneDetect | 每帧剪切概率、镜头边界/片段、每帧视觉变化分数 | 是（GPU/CPU） | 核心 |
| 视觉 | 动态视觉 | MemFlow | 时间相干 (u,v) 流（较低的帧间抖动） | 是（GPU） | 扩展 |
| 视觉 | 动作/活动识别 | VideoMAE V2 | 每窗口动力学 - 400/710 后验 + 池化嵌入（滑动 16 帧窗口） | 是（GPU） | 核心 |
| 视觉 | 动作/活动识别 | X-CLIP | 任意动作短语词汇上的每个窗口零样本相似度得分 | 是（GPU） | 核心 |
| 视觉 | 动作/活动识别 | InternVideo2-1B | 更强的零样本动作相似度 + TAL 功能 | 是（重型 GPU） | 扩展 |
| 视觉 | 动作/活动识别 | V-JEPA 2 | 运动/时间偏置自监督窗口嵌入+动作后验 | 是（GPU） | 扩展 |
| 视觉 | 动作/活动识别 | ActionFormer / OpenTAD | （开始、结束、action_class、置信度）带时间戳的操作片段 | 是（GPU） | 扩展 |
| 视觉 | 显著性/注意力/美观/深度 | ViNet (ViNet-A audio-visual) | 每帧显著图 -> 浓度/熵、峰值、显著区域分数、时间平移 | 是（GPU） | 核心 |
| 视觉 | 显著性/注意力/美观/深度 | Depth-Anything-V2 | 每帧深度图 -> 平均/范围深度、前景分数、深度熵/梯度 | 是（GPU） | 核心 |
| 视觉 | 显著性/注意力/美观/深度 | Q-Align / OneAlign | 每帧美学+技术质量标量 | 是（重型 GPU） | 扩展 |
| 视觉 | 显著性/注意力/美观/深度 | ResMem | 每帧记忆标量 (0-1) | 是（CPU） | 扩展 |
| 视觉 | 显著性/注意力/美观/深度 | Apple Depth Pro | 每帧度量（米）深度图 + 真实比例前景距离 | 是（GPU） | 扩展 |
| 音频 | 低声级声学 | librosa | RMS、频谱质心/带宽/滚降/平坦度/对比度、ZCR、MFCC+deltas、色度、tonnetz、起始包络、节奏/节拍、pYIN F0、HPSS | 是（CPU） | 核心 |
| 音频 | 低声级声学 | openSMILE eGeMAPS (opensmile-python) | ~10 ms LLD（F0、响度、抖动、闪烁、HNR、频谱、MFCC1-4、共振峰）+ 88-d eGeMAPS 泛函 | 是（CPU） | 核心 |
| 音频 | 低声级声学 | Parselmouth (Praat) | F0/强度/共振峰轮廓；抖动/振幅微扰/HNR 语音质量；谱矩，CPP | 是（CPU） | 核心 |
| 音频 | 低声级声学 | Essentia | 不和谐/粗糙度、不和谐、HPCP、频谱复杂性、稳健的节拍跟踪 | 是（CPU） | 扩展 |
| 音频 | 低声级声学 | CREPE / torchcrepe | 高精度每帧 F0 + 发声置信度 + 显著性矩阵 | 是（GPU） | 扩展 |
| 音频 | 低声级声学 | mosqito | 基于标准的响度 (sones)、锐度 (acum)、粗糙度 (asper)、波动强度 | 是（CPU） | 扩展 |
| 音频 | 高级音频（事件/场景/音乐/语音） | BEATs | 每个窗口 527-d AudioSet 事件/场景概率 + 768-d 嵌入 | 是（GPU） | 核心 |
| 音频 | 高水平音频 | CLAP (general + music_and_speech) | 512-d 联合音频/文本嵌入；每个提示余弦相似度时间序列；零样本标签 | 是（GPU） | 核心 |
| 音频 | 高水平音频 | inaSpeechSegmenter | 带时间戳的语音/音乐/噪音片段（+可选的说话者性别） | 是（CPU） | 核心 |
| 音频 | 高水平音频 | Essentia + TF models | BPM/节奏、调+音阶、流派/情绪标签、效价唤醒回归量、乐器标签 | 是（CPU） | 扩展 |
| 音频 | 高水平音频 | madmom / Beat This! | 节拍 + 强拍时间戳、每节拍速度曲线、节拍、和弦标签 | 是（CPU） | 扩展 |
| 音频 | 高水平音频 | PANNs CNN14 | 用于起始/偏移定位的逐帧（数十毫秒）SED | 是（GPU） | 扩展 |
| 音频 | 语音（ASR/分类/韵律/情感） | faster-whisper (large-v3) + WhisperX | 段+字级文本和时间戳、置信度、语言、语速 | 是（GPU） | 核心 |
| 音频 | 演讲 | pyannote diarization (community-1 / 3.1) | 说话者转弯段、每帧语音活动、重叠标志、说话者嵌入 | 是（GPU） | 核心 |
| 音频 | 演讲 | Parselmouth (Praat) | 每帧 F0、强度、共振峰 F1-F4、HNR、抖动、闪烁；停顿结构 | 是（CPU） | 核心 |
| 音频 | 演讲 | audEERING wav2vec2-large-robust-12-ft-emotion-msp-dim | 每个窗口的唤醒/价/支配标量 + 1024 维语音影响嵌入 | 是（GPU） | 核心 |
| 音频 | 演讲 | Silero VAD v5 | ~30 ms 语音概率；语音/非语音边界；总演讲时间 | 是（CPU） | 核心 |
| 音频 | 演讲 | emotion2vec+ | 9类分类情感后验+情感嵌入 | 是（GPU） | 扩展 |
| 音频 | 演讲 | NeMo Parakeet-TDT / Canary + Sortformer | 字/段ASR+时间戳；每帧说话者活动（多语言交叉检查） | 是（GPU） | 扩展 |
| 音频 | 演讲 | CREPE / torchcrepe | 稳健的每帧 F0 + 在嘈杂/吱吱作响的语音上发声 | 是（GPU） | 扩展 |
| 语言 | 低级词汇/单词级 | spaCy (en_core_web_trf) | 每个令牌引理、UPOS + 精细 POS、依赖性、NER、is_stop/punct 标志 | 是（CPU） | 核心 |
| 语言 | 低级词汇 | wordfreq + SUBTLEX-US | Zipf/log 频率、上下文多样性、已知百分比 | 是（CPU） | 核心 |
| 语言 | 低级词汇 | Brysbaert concreteness + Kuperman AoA + Warriner/NRC-VAD | 每个单词的具体性、迎角、效价/唤醒/支配性 | 是（CPU） | 核心 |
| 语言 | 低级词汇 | NRC EmoLex | 每个词 8 个二元情感关联 + 正/负情感 | 是（CPU） | 核心 |
| 语言 | 低级词汇 | minicons (GPT-2-medium / Pythia) | 每个标记的惊喜（位）、下一个单词熵、对数概率（整个单词聚合） | 是（GPU） | 核心 |
| 语言 | 低级词汇 | LIWC-22 | 经过验证的代词/人称+虚词类别；分段汇总分数 | 是（CPU） | 扩展 |
| 语言 | 低级词汇 | GLiNER | 用户定义的实体类型跨度+置信度 | 是（GPU） | 扩展 |
| 语言 | 句法/语法结构 | spaCy (en_core_web_trf) | 依存标签+中心词、词性、形态（时态/体/语气）、名词块 | 是（CPU） | 核心 |
| 语言 | 句法结构 | benepar | PTB 选区树 -> 树深度、子句计数、短语类型计数 | 是（GPU） | 核心 |
| 语言 | 句法结构 | L2SCA (+ Yngve/Frazier from trees) | 14 个复杂性指数（子句/T 单元比率、从属子句、复杂名词） | 是（CPU） | 核心 |
| 语言 | 句法结构 | Maverick | 共指簇（每个提到的人/事） | 是（GPU） | 核心 |
| 语言 | 句法结构 | Stanza | 真正的 UD 方案依赖项 + UFeats + 选区（跨工具复杂性指标） | 是（GPU） | 扩展 |
| 语言 | 句法结构 | textstat | 滑动窗口上的 Flesch-Kincaid/Gunning Fog/SMOG 可读性 | 是（CPU） | 扩展 |
| 语言 | 句法结构 | Dialogue-act classifier (DialogTag/SwDA) | 每个话语的 DA 标签（陈述/问题/反向渠道/...）+ 概率 | 是（CPU） | 扩展 |
| 语言 | 高层语义/话语/叙述 | Qwen3-Embedding (0.6B; scale to 4B/8B) | 每窗口 L2 归一化嵌入（1024-4096-d，Matryoshka 可截断） | 是（GPU） | 核心 |
| 语言 | 语义/话语/叙述 | Sliding-window cosine pipeline | 每个时间点的局部连贯性、语义漂移、新颖性、分割边界得分 | 是（CPU） | 核心 |
| 语言 | 语义/话语/叙述 | BERTopic (topics-over-time) | 每窗口主题id+软主题分布；每个 bin 主题流行度系列 | 是（CPU） | 核心 |
| 语言 | 语义/话语/叙述 | Autoregressive LLM hidden-state extractor (GPT-2 / Llama-3.1-8B) | 每个令牌隐藏状态向量 + 惊喜/熵，每个 TR 重新采样（神经成像标准） | 是（GPU） | 核心 |
| 语言 | 语义/话语/叙述 | Instruction-tuned LLM (Llama-3.1-8B / Qwen2.5-7B-Instruct) | 结构化JSON：叙事阶段、转折点、话语关系、张力、总结 | 是（GPU） | 核心 |
| 语言 | 语义/话语/叙述 | DMRST (neural RST parser) | EDU 边界 + 话语树关系/核心性（可复制标签） | 是（GPU） | 扩展 |
| 语言 | 语义/话语/叙述 | Supervised turning-point model (TRIPOD-style) | 5 TP型概率、标准化故事位置、情感弧值 | 是（GPU） | 扩展 |
| 语言 | 语义/话语/叙述 | API embeddings (OpenAI/Voyage/Gemini) | 每个窗口嵌入排行榜榜首（仅当可接受异地传输时） | 仅限 API | 扩展 |
| 社交 | 社交和人际交往 | pyannote diarization (3.1 / community-1) | 发言者轮次、当前发言者 ID、发言者计数、重叠、轮流转换 | 是（GPU） | 核心 |
| 社交 | 社交和人际交往 | Light-ASD / LR-ASD | 每面每帧说话概率 -> 主动说话者、说话者与听众角色 | 是（GPU） | 核心 |
| 社交 | 社交和人际交往 | InsightFace (SCRFD + ArcFace) | 人脸计数、身份追踪、角色呈现集、共现矩阵（社交网络种子） | 是（GPU） | 核心 |
| 社交 | 社交和人际交往 | Gaze-LLE | 每人注视目标 + 热图 -> 相互注视和共同注意信号 | 是（GPU） | 核心 |
| 社交 | 社交和人际交往 | MMPose RTMPose + ByteTrack | 跟踪骨骼 -> 人际距离、身体方向、接触/触摸代理、接近/撤退 | 是（GPU） | 核心 |
| 社交 | 社交和人际交往 | Qwen2.5-VL (7B) | 每镜头交互类型、主导/附属、ToM/意图、收件人、社交网络边缘 | 是（重型 GPU） | 核心 |
| 社交 | 社交和人际交往 | Social-IQ 2.0 / Social Genome (schema) | 标签模式、少样本样本、社交提取器保留的评估项目 | 是（CPU） | 核心 |
| 社交 | 社交和人际交往 | InternVL3 or frontier API judge | 用于评估者间一致性/金标签验证的第二个 VLM | 图形处理器/API | 扩展 |
| 情况 | 情境/模式/事件分段 | GSBS / statesegmentation | 每个时间点状态标签、排序边界、最优 K、分层边界 | 是（CPU） | 核心 |
| 情况 | 情境/事件细分 | TransNetV2 + PySceneDetect | 镜头边界时间戳 + 每帧变化分数（事件边界先验） | 是（GPU/CPU） | 核心 |
| 情况 | 情境/事件细分 | SigLIP 2 / OpenCLIP zero-shot | 每帧位置/时间/设置/脚本属性分数（自定义分类） | 是（GPU） | 核心 |
| 情况 | 情境/事件细分 | Qwen2.5-VL (7B) | 带时间戳的事件边界+事件索引字段（空间/时间/因果关系/意图/主角），脚本标签 | 是（GPU） | 核心 |
| 情况 | 情境/事件细分 | Instruction-tuned / API LLM (transcript) | 脚本事件边界 + 每个事件的情境字段（尤其是音频故事） | 是（重型 GPU）/API | 核心 |
| 情况 | 情境/事件细分 | Places365 ResNet-50 | 校准的固定分类位置/设置+场景属性 | 是（GPU） | 扩展 |
| 情况 | 情境/事件细分 | BrainIAK EventSegment HMM | 软事件后验/再激活建模 | 是（CPU） | 扩展 |
| 影响 | 情感和影响（多模式） | audEERING wav2vec2-dim | 每个窗口的语音唤醒度/效价/支配度 + 1024-d 嵌入 | 是（GPU） | 核心 |
| 影响 | 情感与影响 | HSEmotion / EmotiEffLib | 每张脸的分类情感 + 连续效价/唤醒 + 1280-d 嵌入 | 是（CPU） | 核心 |
| 影响 | 情感与影响 | RoBERTa-GoEmotions (+ NRC-VAD mapping) | 每句话 28 个情绪分数 -> 效价/唤醒代理 | 是（CPU） | 核心 |
| 影响 | 情感与影响 | Qwen2.5-VL (7B) | 每个窗口 JSON：分类情感、V/A/D、强度、置信度、理由（描述与查看者） | 是（GPU） | 核心 |
| 影响 | 情感与影响 | LIRIS-ACCEDE / MuSe-trained continuous regressor | 每秒观看者引发的效价/唤醒（作为单独的流保存） | 是（GPU） | 核心 |
| 影响 | 情感与影响 | MERT-based V/A regressor | 每个窗口的配乐/音乐效价/唤醒 + 情绪标签 | 是（GPU） | 扩展 |
| 影响 | 情感与影响 | Emotion-LLaMA or AffectGPT | 每个剪辑基准/开放词汇描绘情感标签+多模式提示解释 | 是（重型 GPU） | 扩展 |
| 影响 | 情感与影响 | EmoNet | 每张脸的效价/唤醒+表达（可引用的交叉检查） | 是（GPU） | 扩展 |

## 权衡

**跨子类重用主导子类内修剪。** 多个信号出现在多个类中，必须提取一次并路由到任何地方，而不是每个目录重新运行。最清晰的案例：人脸检测/身份（InsightFace）提供人脸、社交和高级视觉；面部情绪 (HSEmotion/OpenFace 3.0) 提供面部、社交和情感；身体姿势 (MMPose RTMPose) 提供面部、社交和动态视觉；日记化 (pyannote) 为语音和社交提供信息；韵律 (Parselmouth + openSMILE) 提供言语、低级声学和情感；镜头边界 (TransNetV2/PySceneDetect) 提供动态视觉、情境和动作；声音情感 (audEERING wav2vec2-dim) 提供言语和情感； LLM 的惊喜和隐藏状态（迷你图标）为词汇和语义提供支持； lexical-VAD/GoEmotions 提供 Lexical 和 Affect。围绕共享通道（而不是每个类提取器）连接处理流程，使得整个集合在单个消费者 GPU 上易于处理。

**最大的计算节省是将高级推理整合到一个视频 LLM 通道中。** 动作描述、情境维度（空间/时间/因果关系/意图/主角）、社交互动类型/主导/ToM 以及所描述的情感均由 Qwen2.5/3-VL 级模型实现。使用统一的多字段 JSON 架构为每个镜头运行一次 Qwen-VL 通道，取代了四个单独的 VLM 部署。 InternVL3、VideoLLaMA3、LLaVA-OneVision、Emotion-LLaMA 和 AffectGPT 可以互换用于此角色；最多保留一个主要附加项，可选地，为黄金标签验证而不是常规标注保留一个前沿 API 判断。

**基础模型取代了大多数固定分类 CNN，但并非总是如此。** SigLIP 2 零样本探测涵盖了 Places365 和 ImageNet 主干网（以及音频中的 YAMNet/AST）用来填充的对象/场景/地点/属性角色。仅当可解释性明确需要冻结、校准、可重复的概率向量时，才保留固定分类模型。同样，经典流 (RAFT/Farneback)、深度 (MiDaS/ZoeDepth)、显著性 (TASED-Net/UNISAL) 和镜头检测 (AutoShot) 分别被 SEA-RAFT、Depth-Anything-V2、ViNet 和 TransNetV2 取代；旧工具只能作为无 GPU 的后备方案而生存。

**一些表面相似对确实不同，必须都保留。** DINOv2（RSA 的无标签密集嵌入）与 SigLIP 2（文本探测可解释分数）是不同的表示。 pymoten（大脑对齐的运动能量回归量）与 SEA-RAFT（可解释的相机与对象流）以及语义动作识别（VideoMAE）与前语义运动（SEA-RAFT/pymoten）是故意分开的层。 BEATs（校准 527 级）与 CLAP（任意开放词汇提示）、inaSpeechSegmenter（语音/音乐/噪声分区）与 pyannote（谁在何时发言）、Mask2Former（面积分数组成）与 Grounding DINO（对象计数/位置）以及 CREPE（稳健音高轮廓）与Parselmouth（规范语音质量）都携带补充信息。

**不可协商的“保留两个”是描绘与引发的情感。**面部/语音/文本情感模型预测角色表达（描绘）的情感，而 LIRIS-ACCEDE/MuSe 训练的回归量预测观众引发（引发）的情感。这些是相关的但不能互换；将它们记录为单个流将是一个科学错误，而不是一个简约的收益。同样，可解释的每模态影响信号 (wav2vec2 + HSEmotion + GoEmotions) 应仍然是主要特征，任何融合 MLLM 作为附加的推理层而不是替代层。

**本地优先始终是可行的。** 每个核心建议都在本地运行；大多数低级音频和词汇工具仅支持 CPU，最重的核心组件（Qwen-VL、VideoMAE、SigLIP 2、DINOv2、pyannote、Whisper）适合单个 24-48 GB GPU。 API 嵌入和前沿 API VLM 评委是唯一的仅 API 条目，并且仅限于扩展层，仅在需要排行榜第一的准确性并且可以接受成绩单/帧的异地传输时使用。
