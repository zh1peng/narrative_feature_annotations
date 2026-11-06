# 提取器与实现进度

标注程序位于 `src/nfe/`。它读入材料，运行适用于该材料的提取器，再把各路信号重采样到统一的时间轴，最终写出 HDF5 数据文件和 JSON 配套清单。详见[标注输出格式规范](ANNOTATION_FORMAT.md)。

## 快速入门

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
PYTHONPATH=src .venv/bin/python -m nfe.run path/to/movie.mp4 --out annotations/output --rate 1.0
```

输出：`annotations/output/<id>/<id>.h5`（+`<id>.manifest.json`）。在 MATLAB 中加载：

```matlab
ann = readAnnotations("annotations/output/<id>");   % folder, .h5, or .json
tt  = featuresToTimetable(ann);                       % scalars on the common grid
ch  = getFeature(ann, "audio/low_level/mfcc");        % one channel + metadata
```

## 处理流程核心 — 完成并经过验证

- `base.py` — 类型、公共网格 `TimeGrid`（中心参考箱）、`FeatureChannel` 和原始采样率→网格重采样器（平均值/最大/总和/最近/模式/计数 + 事件开始）。
- `ingest.py` — PyAV 解码（以分析 fps 缩小 RGB 帧）+ 通过 imageio-ffmpeg 静态二进制文件提取音频。 **没有系统 ffmpeg，没有 cv2** （避免 macOS 上的 PyAV/OpenCV ffmpeg-dylib 冲突）。
- `emit.py` — HDF5 编写器（分层组、每通道属性、保留 `/human/` 组、`/provenance` 模型注册表）+带有 `data_ref` 指针的 JSON sidecar 清单。
- `pipeline.py` / `run.py` — 编排 + CLI、每个提取器错误隔离、模态驱动的适用性。
- MATLAB 读取器扩展到规范的 `.h5` 路径 (`matlab/readAnnotations.m`)，对生成的输出（标量、向量、事件发生、时间表）进行端到端验证。

## 提取器

| 状态 | 提取器 | 冷冻核心镐 | 标注 |
|--------|-----------|------------------|-------|
| ✅ 运行（CPU） | `visual_lowlevel` | scikit-image + OpenCV | 亮度、对比度、色彩、边缘、熵、颜色平均值、FFT 斜率 |
| ✅ 运行（CPU） | `visual_shots` | TransNetV2 + PySceneDetect | **替代**：颜色直方图切割检测器；在 GPU 层上交换 TransNetV2 |
| ✅ 运行（CPU） | `audio_lowlevel` | librosa + openSMILE + Parselmouth | RMS、频谱、MFCC、色度、F0 (pyin)、起始点、节奏。 openSMILE/Praat 添加 |
| ✅ 运行（CPU） | `asr` (transcript hub) | faster-whisper + WhisperX | 字/段时间戳；将成绩单附加到摄取；发出speech_present、word_rate、asr_text。默认型号 `small`（CT2 = Apple Silicon 上的 CPU）；通过`--asr-model large-v3`进行生产。 Diarization (pyannote) 是后来的社交通行证 |
| ✅ 运行（CPU） | `language_lexical`, `language_syntax` | spaCy + wordfreq + norms + minicons | freq_zipf、word_length、VAD/具体性/AoA 规范（NaN，除非存在 `data/lexicons/*.csv`）；树深度、依赖距离、内容/名词/动词分数。使用`en_core_web_sm`（→ trf 用于生产）； LLM惊喜（迷你图标）是后来的火炬传递 |
| ✅ 运行 (MPS) | `visual_semantic` (SigLIP2 + DINOv2) | SigLIP 2 + DINOv2 | 每帧图像嵌入 (768-d)、零样本探测分数 (16-d)、DINOv2 CLS 嵌入 (384-d)。 `--vision`。默认基本/小型检查点（→ so400m / dinov2-large 用于生产） |
| ✅ 运行 (MPS) | `visual_motion` (RAFT), `visual_depth` (Depth-Anything-V2), `visual_action` (VideoMAE) | SEA-RAFT, Depth-Anything, VideoMAE V2 | 流量大小/摄像机/残余运动；深度平均值/范围/fg/熵； Kinetics-400 后部 + 顶部标签。 RAFT 替代 SEA-RAFT； VideoMAE 在 Transformer 5.x 中存在良性 q/v-bias 键名称不匹配（输出已验证正确） |
| ✅ 运行 (MPS) | `audio_events` (AST), `audio_clap` (CLAP), `vocal_affect` (wav2vec2-dim) | BEATs + CLAP, audEERING | AudioSet-527 标签 + 顶部；开放词汇音频嵌入+探针；语音唤醒/主导/效价（如图所示）。 `--audio-hl`。 AST 替代品 BEATs |
| ✅ 运行（CPU/MPS） | `faces` (MTCNN), `pose` (Keypoint R-CNN) | InsightFace/OpenFace, MMPose RTMPose | n_faces/present/max_face_frac/det_prob + `social/n_agents`； n_persons/present/kp_score + `social/min_pair_distance`。无 cv2 的替代品（facenet-pytorch、torchvision）。身份/AU/凝视 + 133-kpt 全身稍后（OpenFace 隔离；RTMPose） |
| ✅ 运行 (MPS) | `qwen_reasoning` (Qwen2.5-VL-3B) | Qwen2.5-VL-7B | 每个窗口一个 VLM 通行证 → JSON 填充社交/情境/影响：场景描述、设置、室内/室外、交互类型、主导地位、描述的情感 + 效价/唤醒。 `--reason`（慢）。默认为 3B（→ 生产时为 7B） |
| ✅ 运行 (MPS) | `text_emotion` (GoEmotions), `text_sentiment` (CardiffNLP), `language_surprisal` (GPT-2) | RoBERTa-GoEmotions, twitter-roberta-sentiment, minicons | 28-情感向量+顶部； neg/neu/pos 情绪 + 极性标量（影响/描述）；每段惊喜 + 熵（位）。全部消耗转录本；在`--audio-hl` |
| ✅ 运行 (MPS) | `visual_emonet` (EmoNet, Kragel 2019) | EmoNet (AlexNet, Sci Adv 2019) | 每帧 20 路图像情感模式分布 → 影响/描述/emonet(+top)。供应端口（ecco-laboratory），来自 OSF 的权重。 `--vision` |
| ✅ 运行（CPU/MPS） | `face_emotion` (HSEmotion `enet_b0_8_va_mtl`) | HSEmotion / EmotiEffLib (AffectNet SOTA) | 8 个面部表情 + 每张 MTCNN 面部的面部效价/唤醒度，每帧平均 → 影响/描述/face_emotion(+top)、face_valence、face_arousal。需要`timm==0.9.16`。 `--vision` |
| ✅ 运行（CPU） | `visual_saliency` (spectral-residual) | ViNet | 显著性平均值/峰值/熵+显著面积分数。无模型注意力代理；在`--vision`（ViNet 用于生产） |
| ✅ 运行（CPU） | `event_segmentation` (GSBS) — **post-pass** | GSBS | 在组装标量矩阵上的所有提取器之后运行→情况/事件ID（每个箱的状态）+事件边界（起始点）。 `--events` |
| ⬜ 下一个 | `speech_diarization` (pyannote), elicited affect (LIRIS/MuSe) | pyannote, LIRIS-ACCEDE | pyannote需要HF代币+接受的条款；没有现成的引发影响的检查点 |
| ⬜ | `vlm_reasoning` (Qwen2.5-VL) | one consolidated VLM pass | Social/Situation/Affect/narrative |
| ⬜ | `event_segmentation`, `text_emotion`, `elicited_affect` | GSBS, GoEmotions, LIRIS/MuSe | |
| ⬜ | hosted (opt-in) | OpenAI text-embedding-3-large, GPT-5.x | 由`allow_hosted`门控；每次确认 |

## 固定维度输出约定 — 完成
每个刺激都可以通过自动生成的通道模板产生相同的通道集（`schema/channel_template.json`，由`tools/build_channel_template.py`从真正的完整运行中构建 - 没有手动维护的规格列表）。使用 `--template schema/channel_template.json` 运行：未生成的通道（类不适用于模态，或禁用传递）被填充为 `applicable=false`，所有具有正确 dtype/dim/组件的 `NaN` 占位通道。已验证：仅 CPU 运行 + 模板 = 与完整堆栈相同的 103 通道层次结构（例如 kungfury：78 个测量值 + 8 个骨架；仅 CPU 运行相应地具有更多占位通道）。这将解锁第 3/4 阶段堆叠。

## 代码审查修复 (2026-07)
经过验证的审查通过已修复：`event_id` 退化 GSBS 分支上的 dtype 一致性（固定维度）；提取器**现在跟踪失败**（摘要中的`n_failed`/`failed` + `corpus_index.csv`中的`status=partial`），而不是默默地重新标记为“不适用”；对于未测量的 bin，`faces_present`/`pose_present` 计算为任何 in-bin，NaN（源自平均值，消除缺失）；临时工作目录已清理；零长度媒体/文本现在会出错，而不是写入空的“ok”文件； `nearest` 重采样器返回最近的 bin 中心； MATLAB reader 始终以时间优先的方式定向向量； `featuresToTimetable`从分析矩阵中排除分类类代码通道； `analyzeCorpus` 容忍恒定通道；并且批次索引会跨过滤的运行进行合并。 **共享帧解码完成：** `Ingest` 缓存解码帧（对于很长的电影有上限），因此 ~9 个视觉通道共享一个解码而不是重新解码。

## 第二次审核通过（2026-07-08）
修复：占位事件和布尔通道的填充值不再作为真实数据泄漏到分析中（`featuresToTimetable` + 搜索索引生成器将`applicable=false`视为 NaN/不存在）；设计工具排除了由估算/缺失细胞主导的候选片段（它们之前可以赢得目标*因为*数据缺失）； `refreshAnalysis` 现在可以通过一个命令生成完整记录的工件集（完整语料库 + AV 子集统计/数字、NaN 安全类查找、崩溃防护应急拆分）；网络搜索修复（四舍五入零标准擦除、检查时忽略高/低切换、纯文本播放死胡同、排除类似索引的通道、显示缺失功能覆盖范围）；查看器适用于纯音频/文本刺激，并具有干净的计时器拆卸功能；演练根检测； **SigLIP2/CLAP 文本塔预先计算**（已验证与组合前向位相同；视觉语义传递速度约快 3 倍）。

## 已知的后续行动
- **F0 (pyin) 是运行时瓶颈**（~0.85× 音频持续时间）；使可选/更粗糙。
- CLAP 馈送 22 kHz 音频（丢失 >11 kHz）；可以选择为其提取 48 kHz 流。
- 用冻结的 GPU 选择替换 CPU 替代品（直方图切割）。
- 尚未构建的计划 MATLAB API：`listFeatures`、`getFeatureMatrix`、`writeHumanChannel`、延迟读取（请参阅 ANNOTATION_FORMAT §7 状态说明）。
