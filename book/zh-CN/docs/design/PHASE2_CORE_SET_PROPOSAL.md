# 核心特征集（已定稿）

**目的：** 在第 2 阶段构建的最小、易于处理、一流的特征集。源自 `docs/scoping_review/09_recommendations.md`。标记每一行**保留✓/删除✗/→扩展**并自由编辑；您在底部的签字会冻结第 2 阶段的范围。这里的所有内容都在 A 层 (CPU) + B 层（一个 24-48 GB GPU）上**本地**运行。每行的默认答案是**保留**。

注意：保留所有我没有回答的内容。 x = 已选择（即，x 加 keep 表示保留。x 加 Change 表示更改）
---

## 1. 全局参数

| 参数 | 建议默认 | 决定 |
|---|---|---|
| 普通电网费率 | **1 Hz**，中心参考箱 | x 保留 更改：____ |
| 发出交替网格 | 否（单个网格；缓存原始采样率以便重新网格化） | x 保持 ☐ 也发出：____ |
| 输出容器 | **HDF5 规范 + JSON sidecar** （+ 可选标量 Parquet） | x 保留 更改：____ |
| 托管 (API) 模型 | **默认关闭**；仅本地核心 | 保留 x 允许选择加入：OpenAI text-embedding-3-large、ChatGPT5.x 及更高版本____ |
| 描绘与引发的情感 | **两个独立的流**（不可协商） | x 保留 更改：____ |

---

## 2.核心提取通道（提取一次→路由到所有类）

核心集约为 18 个模型通道，而不是 146 个工具，因为信号是共享的。下面的每个通道都是一个可部署的提取器； “feeds”显示哪些特征类别使用它。

### 视觉
| 通行证 | 型号 | 等级 | 饲料 | 每个时间点的关键输出 | 保留？ |
|---|---|---|---|---|---|
| Low-level image stats | scikit-image + OpenCV + Hasler colorfulness | CPU | 视觉 | 亮度、RMS 对比度、颜色平均值 (RGB/HSV/Lab)、色彩度、边缘密度、熵、FFT 斜率 | x |
| Orientation/SF bank | pyrtools / plenoptic | CPU | 视觉 | 尺度×方向能量向量 | x |
| Semantic image probe | **SigLIP 2** | GPU | 视觉、情境 | 图像嵌入 + 每个提示对象/场景/地点/属性分数 | x |
| Label-free embedding | **DINOv2** | GPU | 视觉 | CLS 嵌入（用于 RSA / 探针） | x |
| Faces + identity | **InsightFace** (RetinaFace+ArcFace) | GPU | 视觉、社交 | 人脸计数、身份轨迹、地标、头部姿势、512-d id 嵌入 | x |
| Face AUs + expression | **OpenFace 3.0** | CPU | 视觉、情感 | AU、凝视、头部姿势、离散情感 | x |
| Body pose | **MMPose RTMPose** (+ByteTrack) | GPU | 视觉、社交 | 17/133个关键点→姿势、方向、接近度、接触代理 | x |
| Optical flow | **SEA-RAFT** | GPU | 视觉 | 流量大小、方向历史、相机与物体运动 | x |
| Motion energy | **pymoten** | CPU | 视觉 | 大脑对齐运动能量向量 | x |
| Shot boundaries | **TransNetV2 + PySceneDetect** | GPU/CPU | 视觉、情境、动作 | 每帧剪切概率、镜头片段 | x |
| Action recognition | **VideoMAE V2** + X-CLIP | GPU | 视觉 | 动力学后验+零样本动作短语得分 | x |
| Saliency + depth | **ViNet + Depth-Anything-V2** | GPU | 视觉 | 显著性熵/峰值、深度平均值/范围、前景分数 | x |

### 音频/语音
| 通行证 | 型号 | 等级 | 饲料 | 主要产出 | 保留？ |
|---|---|---|---|---|---|
| Low-level acoustic | **librosa + openSMILE eGeMAPS + Parselmouth** | CPU | 音频、言语、影响 | RMS、频谱、MFCC、色度、F0、抖动/振幅微扰/HNR、节奏/节拍 | ☐ |
| Audio events/scenes | **BEATs + CLAP** | GPU | 音频 | 527-d AudioSet probs + open-vocab提示相似度 | ☐ |
| Speech/music/noise | **inaSpeechSegmenter** | CPU | 音频 | 带时间戳的语音/音乐/噪音片段 | ☐ |
| ASR (the hub) | **faster-whisper large-v3 + WhisperX** | GPU | 言语、语言、社交、情境、情感 | 单词/片段文本+时间戳+语速 | ☐ |
| Diarization + VAD | **pyannote + Silero VAD** | GPU/CPU | 演讲、社交 | 谁-何时发言、当前发言者、重叠、语音活动 | ☐ |
| Vocal affect | **audEERING wav2vec2-dim** | GPU | 言语、影响 | 语音效价/唤醒/支配+嵌入 | ☐ |

### 语言（使用成绩单）
| 通行证 | 型号 | 等级 | 饲料 | 主要产出 | 保留？ |
|---|---|---|---|---|---|
| Lexical + syntax | **spaCy trf** + wordfreq/SUBTLEX + concreteness/AoA/VAD norms + NRC EmoLex | CPU | 语言、情感 | POS、部门、NER；频率、具体性、迎角、效价、每个单词的情感 | ☐ |
| Syntactic complexity | **benepar + L2SCA + Maverick (coref)** | GPU/CPU | 语言 | 树深度、子句比率、复杂度指数、coref 链 | ☐ |
| LLM surprisal/hidden | **minicons (GPT-2/Pythia)** | GPU | 语言 | 每个令牌的惊喜、熵、隐藏状态向量 | ☐ |
| Semantic embedding | **Qwen3-Embedding** + sliding-window coherence + BERTopic | GPU/CPU | 语言、情境 | 嵌入、连贯性、漂移、新颖性、主题系列 | ☐ |

### 高级推理（一次综合 VLM/LLM 通过）
| 通行证 | 型号 | 等级 | 饲料 | 主要产出 | 保留？ |
|---|---|---|---|---|---|
| Per-shot video-LLM | **Qwen2.5-VL 7B** (unified JSON schema) | GPU | 社会、情境、情感、语言 | 交互类型、主导/从属关系、ToM/意图、收件人；事件索引字段（空间/时间/原因/意图/主角）、脚本标签、事件边界；描绘情感+V/A/D；叙事阶段/转折点 | ☐ |
| Active-speaker | **Light-ASD** | GPU | 社交 | 每个面孔的说话概率 → 说话者/听众角色 | ☐ |
| Gaze target | **Gaze-LLE** | GPU | 社交 | 相互凝视，共同关注 | ☐ |

### 情况/影响（算法+专用）
| 通行证 | 型号 | 等级 | 饲料 | 主要产出 | 保留？ |
|---|---|---|---|---|---|
| Event segmentation | **GSBS / statesegmentation** | CPU | 情况 | 每个时间点状态标签、排序边界、最优 K | ☐ |
| Dialogue-text emotion | **RoBERTa-GoEmotions** (+NRC-VAD) | CPU | 影响 | 28 个情绪分数 → 每个话语的 V/A 代理 | ☐ |
| Elicited affect | **LIRIS-ACCEDE / MuSe regressor** | GPU | 影响（单独流） | 每秒观看者引起的效价/唤醒度 | ☐ |

---

## 3. 刻意保留两者（不同的信号，而不是冗余）
DINOv2 (RSA) 与 SigLIP 2（可解释）； pymoten（大脑对齐）vs SEA-RAFT（可解释）vs VideoMAE（语义动作）； BEATs（固定 527）与 CLAP（开放词汇）； inaSpeechSegmenter（分区）与 pyannote（谁说话）； **描绘与引发的情感**。接受所有 编辑：____

## 4. 留给*扩展*层的值得注意的项目（默认关闭）
接地-DINO/Mask2Former/SAM2（对象框/掩模）、Places365（校准分类）、Q-Align（美学）、Essentia/madmom（音乐调/节拍/情绪）、DMRST（RST 话语）、转折点模型、API 嵌入、前沿 API VLM 判断（金标签验证）。 ○ 好的 ○ 晋升为核心：____

## 5. 模态适用性（自动标记缺失的规则）
纯音频故事 → 所有 `visual` 通道 `applicable=false` (NaN)。仅文本 → 视觉+音频无效，语言/社交/情境/影响在文本上运行。接受

---

## 确认
- 批准人：__Tor Wager__ 日期：__6/19/2026__
- 常用电网频率冻结在：___1___ Hz
- 托管模型： ☐ 无 x 已启用：_OpenAI ChatGPT 模型_________________
- 标注/编辑：________________________________________________

_在确认时，第 2 阶段在 `base.py` 接口后面为每个保留通道构建一个 `Extractor` (`src/extractors/<class>/`)，连接到上面的共享通道周围。_
