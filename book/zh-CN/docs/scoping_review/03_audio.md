# 音频特征

> **译者注**　声学分析中的“帧”是一小段声音。例如，算法可以每隔 10 毫秒测一次音高，再将这些结果汇总到一秒。它与视频的一帧没有固定的对应关系。

## 低层声学特征

响度、基频（F0）、频谱质心、滚降点、频谱通量、MFCC、色度、起音、节拍、谐和度、粗糙度和音质，都有成熟的逐帧提取方法。librosa 适合通用音乐信息检索和数字信号处理；openSMILE 提供情感计算中常用的 eGeMAPS 与 ComParE 特征集；通过 Parselmouth 调用 Praat，则可以测量基频、周期微扰（jitter）、振幅微扰（shimmer）和谐噪比（HNR）。Essentia 的 C++ 引擎补充了音乐与心理声学指标，torchaudio 则提供可微、支持 GPU 批处理的标准变换。若研究特别看重音高，CREPE 和概率方法 pYIN 的准确度优于传统自相关或倒谱跟踪。以上工具均可在 CPU 上使用，CREPE 也能用 GPU 加速。对于影片和录音，先组合 librosa、openSMILE eGeMAPS 和 Parselmouth；音乐较多时可加入 Essentia，对基频精度要求较高时可加入 CREPE。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [librosa (0.10.x / 1.0, 2024)](https://github.com/librosa/librosa) | **简单来说：**每秒声音的基本“形状”——响度 (RMS)、音高 (F0)、节奏、亮度/音色（频谱质心、滚降、平坦度、带宽、过零率、起始强度）、13 个 MFCC 音色指纹和 12 个音符的音乐音高（色度）配置文件。通用 DSP/MIR 特征提取：频谱形状、能量、音调、和声、节奏。用于时间对齐的低级音频描述符的默认瑞士军刀。 | 每帧（基于跳跃）数值向量：RMS 能量；光谱质心、光谱带宽、光谱滚降、光谱平坦度、光谱对比度（7 波段）、零交叉率； MFCC（n_mfcc，默认20）+ delta/delta2；梅尔谱图； chroma_stft/chroma_cqt/chroma_cens（12 维）； tonnetz（6 维）； onset_strength 包络线和起始事件时间；节奏（全局+动态）和节拍帧时间通过beat_track； F0 轮廓 + 浊音标志 + 通过 pyin 的浊音概率（概率 YIN）；和声/打击乐分离。 | 音频 | 帧（可配置的跳数，例如 512 个样本 ~= 23 ms，22.05 kHz；可重新采样到每秒）加上每个剪辑全局变量（节奏） | CPU 即可 | 同类首选 | 纳入 |
| [openSMILE 3.0 + opensmile-python (audEERING, 2023-2024)](https://github.com/audeering/opensmile-python) | 用于语音/情感计算的标准化、可引用论文的声学特征集（eGeMAPS、GeMAPS、ComParE 2016、emobase）。情感/声音建模的通用语言。 | 两个级别。每帧低级描述符 (LLD) (~10 ms)：F0（半音/Hz）、响度、抖动（局部）、闪烁（局部 dB）、HNR/log-HNR、谱通量、α 比、哈马伯格指数、谱斜率 (0-500/500-1500 Hz)、MFCC 1-4、共振峰 1-3 频率/带宽/振幅、谐波比（H1-H2，H1-A3）。泛函：eGeMAPSv02 = 窗口上的 88 个摘要特征； ComParE_2016 = 6373 个特征（65 LLD + 增量 x 统计泛函）。可配置为发出与时间线对齐的每帧 LLD CSV。 | 音频 | 用于时间分辨使用的帧（~10 ms LLD）；每个段/每个窗口的泛函 | CPU 即可 | 同类首选 | 纳入 |
| [Parselmouth (Praat 6.x in Python, 2023-2024)](https://github.com/YannickJadoul/Parselmouth) | 参考级语音质量和语音声学分析——语音科学中 F0、共振峰和扰动测量的黄金标准。 | 每帧时间序列：F0/音高轮廓（Praat自相关/cc，有声/无声）、强度（dB）轮廓、通过 Burg 的共振峰跟踪 F1-F4（频率 + 带宽）。每段语音质量：抖动（local、localabsolute、rap、ppq5、ddp）、shimmer（local、localdB、apq3、apq5、apq11、dda）、HNR、声门脉冲、声音中断、清音分数。可通过 Praat 对象获得谱矩（质心、sd、偏斜、峰度）和倒谱峰值突出度。 | 音频 | 轮廓帧（音调/强度/共振峰，~6.25-10 ms 步长）；每个话语/每个段的抖动/振幅微扰/HNR | CPU 即可 | 同类首选 | 纳入 |
| [Essentia 2.1 (MTG-UPF, 2023-2024)](https://github.com/MTG/essentia) | 快速 C++ MIR/音频分析引擎，具有最广泛的低级描述符集，包括心理声学描述符（粗糙度/不和谐）和不在 librosa 中的强大节奏分析。 | 每帧：光谱质心、滚降、通量、扩展、偏度、峰度、平坦度、减少、能带、MFCC、GFCC、HPCP/色度、光谱对比度、光谱复杂度、HFC、不和谐（感觉粗糙度）、不和谐度、音调（PitchYin、PitchYinFFT、PitchMelodia、PredominantPitchMelodia + 置信度）、三刺激值、奇偶谐波比、动态复杂度、响度/重放增益。节奏：开始检测、BPM/节奏、节拍位置（多特征/degara/响度节拍跟踪）、节拍响度、舞蹈能力。 | 音频 | 描述符的框架（可配置）；每个事件的开始/节拍；每个剪辑的节奏 | CPU 即可 | 表现良好 | 资源允许时纳入 |
| [torchaudio 2.x (PyTorch, 2024-2025)](https://arxiv.org/abs/2110.15018) | 用于 ML 处理流程的标准谱/倒谱变换的 GPU 加速、批量、可微分实现（不是高级 MIR 工具包）。 | 每帧张量：Spectrogram/MelSpectrogram、MFCC（librosa 一致）、LFCC、spectrum_centroid、幅度/功率、deltas（compute_deltas）；通过检测音调频率（自相关 F0）确定音调。重采样、时间/频率掩蔽。无原生色度/节拍/粗糙度/抖动。 | 音频 | 帧（可配置的跳数） | 可用 GPU 运行 | 可用 | 备选 |
| [CREPE (marl/crepe, ICASSP 2018; maintained)](https://arxiv.org/abs/1802.06182) | 通过深度 CNN 对原始波形进行最先进的单声道基频 (F0) 估计；比 DSP 跟踪器具有更高的精度和抗噪声能力。 | 每帧 F0（以 Hz 为单位）、发声置信度 (0-1) 和 360 箱音高显著性激活矩阵。默认10毫秒跳变；输出可直接与时间线对齐的时间/频率/置信度 CSV。 | 音频 | 帧（默认 10 ms；可配置） | 可用 GPU 运行 | 表现良好 | 资源允许时纳入 |
| [MIRtoolbox / mosqito (psychoacoustic roughness & loudness)](https://github.com/Eomys/MoSQITo) | 与感知一致的心理声学描述符 - Zwicker 响度、清晰度和感觉粗糙度 - 一般 MIR 库不会按标准计算。 | 每帧/时变：音调响度 (Zwicker/ISO 532-1)、每个 Bark 频段的特定响度、锐度 (acum)、粗糙度 (asper)、波动强度、音调。 （mosqito = 维护的 Python；MIRtoolbox = 粗糙度/响度/质心/F0 的 MATLAB 等效项。） | 音频 | 帧/每秒时变 | CPU 即可 | 可用 | 资源允许时纳入 |

**推荐（同类最佳）：** librosa（主要通用频谱/MFCC/色度/起始/节奏 + pin F0）； openSMILE eGeMAPS/ComParE，通过 opensmile-python（标准化语音/影响 LLD，时间线索引）； Parselmouth/Praat（黄金标准 F0、共振峰、抖动/振幅微扰/HNR 语音质量）； Essentia（添加音乐丰富的粗糙度/不和谐、不和谐、强大的节拍跟踪）； CREPE/torchcrepe（为语音/人声添加高精度单音 F0）

**可能多余：**
- torchaudio — 小型实验室的光谱/MFCC 完全被 librosa 取代；仅当需要 GPU 批处理或可微前端时才保留
- torchaudio.detect_pitch_Frequency 和 librosa.pyin F0 — 对于 F0 功能，被 CREPE/torchcrepe（准确性）或 Praat（语音科学）取代
- openSMILE 抖动/振幅微扰/HNR/共振峰 LLD 重叠 Parselmouth — 运行两者仅用于交叉验证；否则 Parselmouth 是规范的，openSMILE 提供标准化的 88 维摘要
- Essentia 光谱/MFCC/色度/起始重叠 librosa — 选择一个作为主要 MIR 引擎（librosa 方便，Essentia 速度/粗糙度），不能同时使用相同的描述符
- Essentia“不和谐”与 mosqito 粗糙度——重叠的粗糙度测量；如果感知保真度很重要，那么 mosqito 是基于标准 (asper) 的选择

**开放问题：**
- 处理流程会分析完整的混合音轨（语音+音乐+SFX）还是源分离的音轨？单声道 F0 工具（CREPE、Praat）和语音质量测量在混音时会严重降低 — 可能需要上游 Demucs/源分离。
- 目标输出速率：fMRI/时间线对齐的真实每帧（~10-23 ms）与每秒聚合？这设置了跳跃大小以及是否保留 LLD 或泛函。
- openSMILE 的源可用（非 OSI）许可证和 Essentia 的 AGPL 是否可以接受项目的分发/共享模型？
- 是否需要标准化感知单位（通过 mosqito 表示响度/粗糙度的 sones/asper），或者相对 librosa/Essentia 描述符是否足够？
- 采样率协调：openSMILE/Praat期望具体的速率；电影音频通常为 48 kHz - 确认重采样策略以保持跨工具功能的可比性。

<details><summary>参考文献</summary>

- **librosa (0.10.x / 1.0, 2024)** — [github.com/librosa/librosa](https://github.com/librosa/librosa); [librosa.org](https://librosa.org); McFee et al. 2015 SciPy
- **openSMILE 3.0 + opensmile-python (audEERING, 2023-2024)** — [github.com/audeering/opensmile-python](https://github.com/audeering/opensmile-python); Eyben et al. 2016 (eGeMAPS, IEEE TAC); [audeering.github.io/opensmile-python](https://audeering.github.io/opensmile-python)
- **Parselmouth (Praat 6.x in Python, 2023-2024)** — [github.com/YannickJadoul/Parselmouth](https://github.com/YannickJadoul/Parselmouth); Jadoul et al. 2018 J. Phonetics; [parselmouth.readthedocs.io](https://parselmouth.readthedocs.io)
- **Essentia 2.1 (MTG-UPF, 2023-2024)** — [github.com/MTG/essentia](https://github.com/MTG/essentia); [essentia.upf.edu](https://essentia.upf.edu); Bogdanov et al. 2013 ISMIR
- **torchaudio 2.x (PyTorch, 2024-2025)** — [docs.pytorch.org/audio](https://docs.pytorch.org/audio); Yang et al. 2021 (TorchAudio) [arXiv:2110.15018](https://arxiv.org/abs/2110.15018)
- **CREPE (marl/crepe, ICASSP 2018; maintained)** — [github.com/marl/crepe](https://github.com/marl/crepe); [github.com/maxrmorrison/torchcrepe](https://github.com/maxrmorrison/torchcrepe); Kim et al. 2018 [arXiv:1802.06182](https://arxiv.org/abs/1802.06182)
- **MIRtoolbox / mosqito (psychoacoustic roughness & loudness)** — [github.com/Eomys/MoSQITo](https://github.com/Eomys/MoSQITo); MIRtoolbox (Lartillot & Toiviainen 2007 ISMIR)

</details>

## 高级音频：事件、场景、音乐、语音/非语音

该子类涵盖时间解析的语义音频标注：(1) 527 类 AudioSet 本体上的音频标记/声音事件检测，(2) 声学场景分类，(3) 语音与音乐与噪声分割，以及 (4) 音乐信息检索（节奏、调/模式、节拍/强拍、乐器、情绪/情感）。该领域已经成熟并且大部分是开源的。对于电影/音频故事时间线，推荐的堆栈是在 AudioSet 事件后验的滑动窗口上运行的变压器音频标记器（BEATs 或 PaSST/AST），用于开放词汇/零样本事件标签和音频文本相似性的CLAP，用于语音/音乐/噪声分割的 inaSpeechSegmenter 或 pyannote VAD，以及用于 MIR 的 Essentia + madmom（或 Beat This！）描述符。大多数工具都可以在单个消费级 GPU 甚至 CPU 上轻松运行；这里不需要大量的多 GPU 计算。关键设计选择：窗口大小设置时间粒度（AudioSet 模型在约 10 秒的剪辑上进行训练，但可以在约 1 秒的跳数上运行以进行每秒标注，但需要注意的是，非常短的窗口会降低慢速事件的准确性）。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [BEATs (Microsoft, iter3+ / AS2M checkpoint, 2022-2023)](https://arxiv.org/abs/2212.09058) | 通过在 AudioSet-2M 上微调的自监督声学分词器 ViT 编码器在 527 类 AudioSet 本体上进行音频标记；也是一个强大的通用音频嵌入主干。 | 每个分析窗口的 527 维 AudioSet 类概率向量（例如语音、音乐、车辆、狗、笑声、枪声、掌声等）； 768 维帧/补丁嵌入可用于下游探测或作为特征。 | 音频 | 每个剪辑在约 10 秒的窗口上；滑动窗口到每秒或亚秒（短窗口会降级） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [PaSST (Patchout faSt Spectrogram Transformer, kkoutini, 2022)](https://arxiv.org/abs/2110.05069) | AudioSet 音频标记和声学场景分类使用具有修补正则化的 DeiT 式频谱图转换器；旨在在单个 GPU 上高效地训练/推理。 | 527-dim AudioSet 类每个窗口的 logits/概率；中间变压器嵌入（广泛用作音频特征，例如在类似 CLAP 和字幕系统中）。 | 音频 | 每个剪辑在约 10 秒的窗口上；滑动窗口到每秒 | 可用 GPU 运行 | 表现良好 | 纳入 |
| [AST (Audio Spectrogram Transformer, MIT, 2021)](https://arxiv.org/abs/2104.01778) | **简单来说：** 标记每秒出现的声音，从 Google 的 AudioSet 中对超过 527 个日常声音类别进行评分（语音、音乐、笑声、狗、车辆、枪声、掌声、雨……）；该处理流程保留完整的 527 值向量以及单个顶部声音，并且是已部署的音频标记器。 AudioSet 音频标记使用基于 log-mel 频谱图的纯 ViT；规范的 HF 原生变压器标记器。 | 每约 10 秒窗口 527-dim AudioSet 类概率； CLS/补丁嵌入。 | 音频 | 每个剪辑在约 10 秒的窗口上；滑动窗口到每秒 | 可用 GPU 运行 | 表现良好 | 备选 |
| [PANNs (CNN14, Kong et al., 2020)](https://arxiv.org/abs/1912.10211) | 基于CNN的AudioSet音频标记和声音事件检测；具有逐帧 SED 变体的长期参考基线。 | 527-dim AudioSet 剪辑概率； CNN14 还公开了逐帧（段级）预测，支持起始/偏移定位； 2048-dim 嵌入。 | 音频 | 剪辑加帧 SED（约数十毫秒帧） | 可用 GPU 运行 | 可用 | 备选 |
| [YAMNet (Google, MobileNet-v1)](https://tfhub.dev/google/yamnet) | 轻量级 AudioSet 音频事件标记超过 521 类子集；经典的快速/边缘基线。 | 每 0.96 秒帧（跳跃 0.48 秒）521-dim AudioSet 级分数；每帧 1024 维嵌入。 | 音频 | 每帧（~0.48 s 跳跃，0.96 s 窗口） | CPU 即可 | 可用 | 备选 |
| [CLAP (LAION clap-htsat-fused / larger_clap_general / larger_clap_music_and_speech, 2022-2023)](https://arxiv.org/abs/2211.06687) | **简单来说：**将每一秒的音频转化为与语言对齐的 512 个数字“声音指纹”，以便与文本提示相匹配；处理流程（运行 laion/clap-htsat-unfused）还存储 12 个可读的声音探测器（语音、音乐、歌唱、沉默、掌声、脚步声、引擎、自然、人群、风……）。对比语言音频嵌入可实现开放词汇零样本音频分类和超出固定 AudioSet 本体的音频文本相似性；也是 Microsoft CLAP 变体。 | 512 维联合音频和文本嵌入；每个窗口与任意文本提示的余弦相似度（例如“人群欢呼”、“紧张的管弦乐”、“窗户上的雨”）产生自定义的每个提示时间序列； softmax 超过零样本标签的提示集。 | 多模态 | 窗口段上的每个剪辑（滑动窗口到每秒）； MIR 风格标签的音乐域变体 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [inaSpeechSegmenter (INA, smn engine)](https://github.com/ina-foss/inaSpeechSegmenter) | 将连续音频流分割为语音/音乐/噪声同质区域，并根据说话者性别（男/女）进一步分割语音；专为广播媒体而设计。 | 带时间戳的片段标签{语音、音乐、噪音}以及开始/结束；语音片段上可选的男性/女性标签（歌声 -> 音乐、音乐/噪音上的语音 -> 语音）。 | 音频 | 每个段具有起始/偏移边界（帧级决策 ~0.1 s） | CPU 即可 | 同类首选 | 纳入 |
| [pyannote.audio (segmentation 3.x / VAD pipeline)](https://github.com/pyannote/pyannote-audio) | 语音活动检测、语音分割、重叠语音检测和说话人二值化；用于前台语音的最强开放式 VAD/二值化堆栈。 | 每帧语音活动概率（~16-20 ms 分辨率）和带时间戳的语音/非语音和每个说话者的转弯段；重叠标志。 | 音频 | 每帧（~16-20 ms）和每段 | 可用 GPU 运行 | 表现良好 | 资源允许时纳入 |
| [Essentia + TensorFlow models (MTG-UPF)](https://essentia.upf.edu) | 完整的古典 + 深度 MIR：节奏、调/音阶（模式）、音调特征，以及用于音乐标签、流派、心情/情感（效价唤醒）、可舞性、乐器、声音/乐器和可重复使用嵌入的预训练 TF 模型（MusiCNN、VGGish、Discogs-EffNet、MSD）。 | 标量/分类描述符：BPM/节奏、调+音阶（大调/小调）以及强度、响度；以及流派（MTG-Jamendo/Discogs 分类法）、情绪/主题、效价和唤醒回归量、可舞性、声学/电子、乐器标签的每个标签概率； 200-1280-dim 嵌入。 | 音频 | 全轨或窗口（帧级低级特征；ML 标签的分段/窗口） | CPU 即可 | 同类首选 | 纳入 |
| [madmom (beat/downbeat/tempo/chords) and 'Beat This!' (2024)](https://github.com/CPJKU/madmom) | 节奏/节拍 MIR：开始检测、节拍和强拍跟踪、节奏估计、节拍和和弦识别。 “打败这个！”是一种基于电流互感器的节拍/强拍跟踪器。 | 节拍时间戳、强拍时间戳（小节位置）、每节拍速度 (BPM) 曲线、拍号/节拍以及带有计时的（madmom）和弦标签；产生每节拍或每秒的节奏特征轨道。 | 音频 | 每个节拍/每个事件时间戳（连续节奏曲线） | CPU 即可 | 表现良好 | 资源允许时纳入 |

**推荐（同类最佳）：** BEATs（或 PaSST），用于滑动窗口上的 AudioSet 事件/场景标记； CLAP (laion/larger_clap_general + music_and_speech) 用于开放词汇零样本音频维度和音频文本相似度时间序列； inaSpeechSegmenter 用于清晰的语音/音乐/噪声分割（如果需要话轮交替添加 pyannote VAD/二值化）；用于 MIR 标量和音乐情绪/流派/乐器标签的 Essentia + TF 模型；妈妈或者打败这个！用于节拍/强拍/节奏结构

**可能多余：**
- AudioSet mAP 上的 AST 很大程度上被 BEATs/PaSST 取代（仅保留其简单的 HF 部署）
- PANN CNN14 被变压器标记器取代，但保留了逐帧 SED 和 panns_inference 的简单性
- YAMNet 取代了所有 Transformer 标注器的准确性；仅保留 CPU/实时/边缘约束
- 选择一个主要 AudioSet 标记器（BEATs 或 PaSST），而不是一起运行 AST+PANNs+YAMNet+BEATs，因为它们的 527 类输出高度相关
- Essentia 节奏估算器对于 madmom/Beat This 来说是多余的！节拍跟踪（当精确的节拍/强拍计时很重要时，更喜欢后者）
- CLAP 音乐标签与 Essentia 流派/情绪模型部分重叠；使用 CLAP 进行新颖/自定义提示，使用 Essentia 进行校准价唤醒/节奏/调

<details><summary>参考文献</summary>

- **BEATs (Microsoft, iter3+ / AS2M checkpoint, 2022-2023)** — [arXiv:2212.09058](https://arxiv.org/abs/2212.09058); [github.com/microsoft/unilm/tree/master/beats](https://github.com/microsoft/unilm/tree/master/beats)
- **PaSST (Patchout faSt Spectrogram Transformer, kkoutini, 2022)** — [arXiv:2110.05069](https://arxiv.org/abs/2110.05069); [github.com/kkoutini/PaSST](https://github.com/kkoutini/PaSST)
- **AST (Audio Spectrogram Transformer, MIT, 2021)** — [arXiv:2104.01778](https://arxiv.org/abs/2104.01778); [huggingface.co/MIT/ast-finetuned-audioset-10-10-0.4593](https://huggingface.co/MIT/ast-finetuned-audioset-10-10-0.4593)
- **PANNs (CNN14, Kong et al., 2020)** — [arXiv:1912.10211](https://arxiv.org/abs/1912.10211); [github.com/qiuqiangkong/audioset_tagging_cnn](https://github.com/qiuqiangkong/audioset_tagging_cnn)
- **YAMNet (Google, MobileNet-v1)** — [tfhub.dev/google/yamnet](https://tfhub.dev/google/yamnet); [github.com/tensorflow/models/tree/master/research/audioset/yamnet](https://github.com/tensorflow/models/tree/master/research/audioset/yamnet)
- **CLAP (LAION clap-htsat-fused / larger_clap_general / larger_clap_music_and_speech, 2022-2023)** — [arXiv:2211.06687](https://arxiv.org/abs/2211.06687); [huggingface.co/laion/clap-htsat-fused](https://huggingface.co/laion/clap-htsat-fused); [github.com/microsoft/CLAP](https://github.com/microsoft/CLAP)
- **inaSpeechSegmenter (INA, smn engine)** — [github.com/ina-foss/inaSpeechSegmenter](https://github.com/ina-foss/inaSpeechSegmenter); Doukhan et al. ICASSP 2018
- **pyannote.audio (segmentation 3.x / VAD pipeline)** — [github.com/pyannote/pyannote-audio](https://github.com/pyannote/pyannote-audio); Bredin et al. (Interspeech)
- **Essentia + TensorFlow models (MTG-UPF)** — [essentia.upf.edu](https://essentia.upf.edu); [mtg.github.io/essentia-labs](https://mtg.github.io/essentia-labs); Alonso-Jimenez et al.
- **madmom (beat/downbeat/tempo/chords) and 'Beat This!' (2024)** — [github.com/CPJKU/madmom](https://github.com/CPJKU/madmom); [arXiv:1605.07008](https://arxiv.org/abs/1605.07008); [github.com/CPJKU/beat_this](https://github.com/CPJKU/beat_this) (Foscarin et al. 2024)

</details>

## 语音识别、说话人分段、韵律与语音情感

该子类将电影/故事的语音音频转换为时间对齐的语言和副语言层：带有时间戳的单词/片段级转录（ASR + 强制对齐）、谁说话的时间（二值化 + VAD）、低级韵律（音调/强度/语音质量轮廓）和声音情感（分类和维度 A/V/D）。开放生态系统已经成熟，几乎完全可以在单个消费级 GPU 上进行本地部署。实用的处理流程是用于 ASR+单词时间戳的 faster-whisper/WhisperX，用于二值化的 pyannote (community-1)，用于韵律的 Parselmouth/openSMILE，以及用于声音情感的 audEERING wav2vec2-dim 或情感2vec 模型；大多数其他工具都是这些工具的冗余变体。关键的设计选择是按单词重采样与按秒重采样，因为 ASR/SER 是话语级别的，而韵律本身是帧级别的（10 毫秒）。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [faster-whisper (CTranslate2 Whisper large-v3 / distil-large-v3)](https://github.com/SYSTRAN/faster-whisper) | **简单来说：**转录语音，并从中提供是否有人在说话以及他们每秒说话的速度（每秒单词数）（处理流程运行faster-whisper-小）。自动语音识别：具有分段和单词级时间戳以及语言 ID 的语音到文本；大多数处理流程的骨干。 | 每个片段的文本+开始/结束时间；可选的每个单词开始/结束+标记置信度/avg_logprob；每段 no_speech_prob；检测到语言后部； 99 种语言。可导出的说话速率（根据单词时间戳每秒生成的单词或音节）。 | 音频 | 每个话语/段，可选每个单词 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [WhisperX (faster-whisper + wav2vec2 forced alignment + pyannote)](https://github.com/m-bain/whisperX) | 端到端处理流程：通过音素强制对齐提供准确的单词级时间戳的 ASR，以及每个单词的可选说话人分配。获得单词对齐、说话人归属的文字记录的最直接路径。 | 每个单词的文本 + 严格的开始/结束时间（wav2vec2 CTC 对齐，远优于 Whisper 的内部 DTW 时间戳）；每个段的文本；每个片段/单词的说话人标签（启用分类时）；基于 VAD 的分块消除了沉默时的耳语幻觉。实现精确的语速和每秒单词存在分级。 | 音频 | 每个单词、每个段 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [pyannote.audio speaker-diarization-community-1 (pyannote 4.x)](https://huggingface.co/pyannote/speaker-diarization-community-1) | 说话人分类（谁何时说话）加上底层 VAD 和重叠语音检测；在整个时间线上分配说话者身份。 | 带有说话人标签的带时间戳的说话人轮流段（SPEAKER_00..N）；每帧语音活动和重叠语音概率；预计发言者人数；用于跨段/跨文件身份的说话人嵌入。每秒生成当前发言者和发言者更换功能。 | 音频 | 每段/每帧（分段约为 16-60 毫秒） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [Silero VAD v5](https://github.com/snakers4/silero-vad) | 独立语音活动检测：语音与非语音（音乐/噪声/静音）的帧级概率，用于选通和语音存在时间线。 | 每块（~30 ms）语音概率 0-1；派生语音/非语音段边界；总演讲时间。可用作轻量级每秒“语音呈现”回归量，并可在 ASR/SER 之前屏蔽非语音。 | 音频 | 亚秒级（~30 毫秒帧） | CPU 即可 | 表现良好 | 纳入 |
| [Parselmouth (Praat) / praat-parselmouth](https://github.com/YannickJadoul/Parselmouth) | 直接从波形计算的经典低级韵律和语音质量声学：音高、响度和扰动测量。可解释韵律轮廓的参考。 | 每帧 F0/音高轮廓（Hz，带浊音/清音标记）、强度/响度 (dB)、共振峰 F1-F4、谐波噪声比 (HNR)；抖动（本地/rap/ppq5）和闪烁（本地/apq）；光谱倾斜；停顿/沉默结构。通过音节核脚本的说话/发音速率。全部可重采样为每秒。 | 音频 | 帧（默认~10毫秒跳，可配置） | CPU 即可 | 同类首选 | 纳入 |
| [openSMILE (eGeMAPSv02 / ComParE feature sets)](https://github.com/audeering/opensmile) | 标准化情感计算声学特征提取：大量低级描述符 (LLD) 和泛函用作情感/副语言模型的输入和直接特征。 | 每帧 LLD：F0、响度、抖动、闪烁、HNR、MFCC 1-13、谱通量/斜率/质心、α 比、哈马伯格指数、共振峰频率/带宽/振幅 (eGeMAPS = 25 LLD)。还有话语级泛函（均值、百分位数、斜率）。帧 LLD 给出每秒韵律/频谱向量。 | 音频 | 帧（10 ms LLD）或每个话语泛函 | CPU 即可 | 表现良好 | 资源允许时纳入 |
| [audEERING wav2vec2-large-robust-12-ft-emotion-msp-dim (dimensional SER)](https://huggingface.co/audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim) | **简单来说：**直接从声音中读出情绪 - 积极/消极（效价）、活力（唤醒）程度以及听起来如何主导/自信 - 无需言语。从声音进行维度语音情感识别：连续唤醒、主导、效价直接从波形回归（无需转录）。 | 每个话语/窗口三个标量：唤醒、支配、效价，每个~0-1；加上 1024 维的池化 wav2vec2 嵌入。滑动窗口应用（例如 1-4 秒跳）产生与电影时间轴对齐的每秒 A/D/V 轨迹。 | 音频 | 每个话语或每个窗口（用户选择，可以接近每秒） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [emotion2vec+ (seed / base / large) and emotion2vec foundation model](https://arxiv.org/abs/2312.15185) | 自监督语音情感基础模型：通用情感表示加上分类 SER，在 10 多种语言和录音条件下具有鲁棒性。 | 每个话语的 9 级分类情感后验（愤怒、快乐、悲伤、中立、恐惧、厌恶、惊讶等）；帧级和话语级情感嵌入（特征提取模式）可用于自定义回归量（例如维度 A/V）。滑动窗口给出每秒的分类情绪概率轨迹。 | 音频 | 每个话语（可用帧级嵌入） | 可用 GPU 运行 | 表现良好 | 备选 |
| [NVIDIA NeMo ASR (Parakeet-TDT / Canary) + Sortformer diarization](https://github.com/NVIDIA/NeMo) | 替代高精度 ASR（带时间戳）和端到端神经二值化；如果 Whisper 准确性或吞吐量不足，或者联合 ASR+二值化，则相关。 | ASR：单词/段文本+时间戳、令牌置信度（Parakeet-TDT-1.1B/0.6B 领先英语 Open ASR 排行榜；Canary 多语言）。 Sortformer/MSDD：每帧说话者活动概率和说话者属性片段。与 Whisper+pyannote 相同的下游功能（单词计时、话轮交替、语速）。 | 音频 | 每个字/每个段 (ASR)；每帧（二值化） | 可用 GPU 运行 | 表现良好 | 备选 |
| [CREPE / torchcrepe (deep pitch tracker)](https://github.com/maxrmorrison/torchcrepe) | 数据驱动的单声道基频 (F0) 估计；噪声/表达性语音下 Praat 自相关音调的更稳健的替代方案。 | 每帧 F0 (Hz) 和可配置跳频处的发声置信度（例如 10 ms）；在嘈杂/吱吱作响的语音上，音高轮廓比 Praat 更清晰。每秒提供音高平均值/范围/斜率特征。 | 音频 | 帧（典型值 10 毫秒） | 可用 GPU 运行 | 可用 | 资源允许时纳入 |

**推荐（同类最佳）：** faster-whisper (large-v3) 用于 ASR； WhisperX 用于字级强制对齐+说话者归属的转录； pyannote seller-diarization-community-1 用于二值化/VAD/重叠； Parselmouth (Praat) 用于韵律和语音质量轮廓； audEERING wav2vec2-large-robust-12-ft-emotion-msp-dim 用于维度语音情感（唤醒/价/支配）

**可能多余：**
- openai/whisper、insanely-fast-whisper、whisper.cpp -> 被 faster-whisper 取代（相同的权重，更快的 CTranslate2 运行时间）
- pyannote seller-diarization-3.1 -> 被community-1取代（更好的说话者计数，相同的分割）
- WebRTC VAD / audiotok -> 被 Silero VAD 和 pyannote VAD 取代
- librosa 音高 (pyin/piptrack) 和独立 MFCC 提取 -> 被 Parselmouth (F0/语音质量) + openSMILE (频谱 LLD) 取代
- 通用 HF wav2vec2/HuBERT IEMOCAP 分类 SER 检查点 -> 被情感2vec+（分类）和 audEERING wav2vec2-dim（维度）取代
- NeMo ASR/二值化和情感2vec+ -> 与 Whisper/pyannote/audEERING 默认值重叠；仅保留准确性或多语言/跨域替代方案

**开放问题：**
- 目标时间网格：每个单词（事件锁定）与固定的每秒重采样 - ASR/SER 是话语级别的，需要加窗/插值，而 Parselmouth/openSMILE 本身是 10 毫秒。
- 电影音频与音乐/SFX/重叠扬声器混合；在 ASR/SER 之前我们是否需要源分离（例如 Demucs/Bandit）或音乐 VAD 门以避免污染音调/抖动/闪烁和情绪估计？
- 声音效果应按分类说话人片段计算，而不是在混合音频上计算 - 确认分类优先顺序以及如何处理 SER/韵律的重叠语音。
- 许可：openSMILE eGeMAPS 和 audEERING wav2vec2-dim 仅供研究；确认研究可接受或替代仅情感2vec+/Parselmouth的特征。
- 是否添加副语言/笑声/非语言发声检测器（例如，emotion2vec 声音事件或专用的笑声模型）作为单独的特征流。

<details><summary>参考文献</summary>

- **faster-whisper (CTranslate2 Whisper large-v3 / distil-large-v3)** — [github.com/SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper); [huggingface.co/openai/whisper-large-v3](https://huggingface.co/openai/whisper-large-v3)
- **WhisperX (faster-whisper + wav2vec2 forced alignment + pyannote)** — [github.com/m-bain/whisperX](https://github.com/m-bain/whisperX); Bain et al. Interspeech 2023
- **pyannote.audio speaker-diarization-community-1 (pyannote 4.x)** — [huggingface.co/pyannote/speaker-diarization-community-1](https://huggingface.co/pyannote/speaker-diarization-community-1); [pyannote.ai/blog/community-1](https://pyannote.ai/blog/community-1)
- **Silero VAD v5** — [github.com/snakers4/silero-vad](https://github.com/snakers4/silero-vad)
- **Parselmouth (Praat) / praat-parselmouth** — [github.com/YannickJadoul/Parselmouth](https://github.com/YannickJadoul/Parselmouth); Praat (Boersma & Weenink)
- **openSMILE (eGeMAPSv02 / ComParE feature sets)** — [github.com/audeering/opensmile](https://github.com/audeering/opensmile); Eyben et al. eGeMAPS 2016
- **audEERING wav2vec2-large-robust-12-ft-emotion-msp-dim (dimensional SER)** — [huggingface.co/audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim](https://huggingface.co/audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim); Wagner et al. IEEE TPAMI 2023
- **emotion2vec+ (seed / base / large) and emotion2vec foundation model** — [github.com/ddlBoJack/emotion2vec](https://github.com/ddlBoJack/emotion2vec); Ma et al. ACL Findings 2024; [arXiv:2312.15185](https://arxiv.org/abs/2312.15185)
- **NVIDIA NeMo ASR (Parakeet-TDT / Canary) + Sortformer diarization** — [github.com/NVIDIA/NeMo](https://github.com/NVIDIA/NeMo); [huggingface.co/nvidia/parakeet-tdt-1.1b](https://huggingface.co/nvidia/parakeet-tdt-1.1b); HF Open ASR Leaderboard
- **CREPE / torchcrepe (deep pitch tracker)** — Kim et al. ICASSP 2018; [github.com/maxrmorrison/torchcrepe](https://github.com/maxrmorrison/torchcrepe)

</details>
