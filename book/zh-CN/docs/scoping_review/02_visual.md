# 视觉特征

> **译者注**　下表区分两个尺度。“逐帧”表示算法每次读取一幅画面；“逐秒”表示写入标注的时间间隔。例如，一秒内可以先得到多次亮度测量，再用均值代表这一秒。

## 逐帧测量画面的基本属性

亮度、均方根对比度（RMS contrast）、颜色、边缘和空间频率等指标，都可以直接从每帧的像素计算。scikit-image、OpenCV 和 NumPy 能完成大部分统计；若要分析不同方向和尺度上的能量，可用 pyrtools 或 plenoptic 的可转向金字塔。SHINE 提供与视觉科学文献一致的亮度、对比度和傅里叶幅度测量；Rosenholtz 的特征拥挤度和子带熵则用来刻画画面有多杂乱。GIST 用一个紧凑的描述符概括场景的整体空间布局，连接低层统计与中层结构。对于这类已有明确定义的测量，学习模型能带来的额外收益很小。用 pliers 等工具按每秒 1–25 帧运行经典运算即可。普通 CPU 就能胜任，实际工作主要在于批量处理画面和对齐时间戳。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [scikit-image (skimage) 0.24/0.25 + NumPy](https://scikit-image.org) | **简单来说：**任何人都可以描绘的每帧图像统计信息 - 帧的亮度（亮度）、明暗变化（RMS 对比度）、平均红/绿/蓝和色调/饱和度、色彩有多丰富、边缘数量/混乱程度（边缘密度、熵）以及细节是粗糙还是精细（空间频率斜率）；处理流程每秒存储 12 个这样的标量。通用每帧像素统计：亮度/强度、RMS 对比度（亮度标准）、色彩空间转换（rgb2hsv、rgb2lab、rgb2gray）、香农熵（skimage.measure.shannon_entropy 和局部熵滤波器）、边缘图（Sobel、Scharr、Canny、边缘密度）、纹理（通过 greycomatrix/graycoprops 的 GLCM、局部二进制模式）、以及通过 skimage.filters 和 FFT 助手的频率内容。 | 每帧标量和图：平均亮度、RMS 对比度（基于 Michelson/Weber/std）、每通道 R/G/B 和 H/S/V 和 L*/a*/b* 平均值和 stds、全局/局部香农熵（位）、边缘像素分数（边缘密度）、GLCM 对比度/能量/均匀性/相关性、LBP 直方图。全部可减少至 1 个值/帧。 | 视频帧 | 逐帧 | CPU 即可 | 同类首选 | 纳入 |
| [OpenCV (cv2) 4.x](https://opencv.org) | 快速每帧图像统计和基元：颜色空间转换（cvtColor 到 HSV/Lab/YCrCb/Gray）、直方图、Sobel/Laplacian/Canny 边缘、用于方向/空间频率能量的 Gabor 内核 (getGaborKernel)、DFT/幅度谱、拉普拉斯方差锐度/模糊以及用于时间线锁定提取的高效视频帧 I/O (VideoCapture)。 | 每帧：平均/标准亮度、任何空间中的每通道颜色平均值、颜色直方图、边缘密度、拉普拉斯方差（焦点/锐度标量）、每个方向/频率的 Gabor-bank 响应能量、FFT 径向功率谱斜率。加上为每个帧添加时间戳的帧抓取层。 | 视频帧 | 逐帧 | CPU 即可 | 同类首选 | 纳入 |
| [SHINE toolbox (+ SHINE_color fork)](https://mapageweb.umontreal.ca/gosselif/shine) | 低级图像属性的规范视觉科学测量和控制：平均亮度、RMS 对比度、亮度直方图和每个空间频率的旋转（方向平均）傅立叶振幅谱/能量。主要是控制/均衡工具，但其测量功能是现场标准定义。 | 每帧（每图像）：平均亮度、RMS 对比度、全亮度直方图、一维旋转平均傅里叶幅度谱（能量与空间频率）和幅度谱斜率。 SHINE_color 扩展到颜色通道。 | 视频帧 | 逐帧 | CPU 即可 | 表现良好 | 纳入 |
| [pyrtools (LabForComputationalVision) / matlabPyrTools](https://github.com/LabForComputationalVision/pyrtools) | 多尺度、多方向可操纵金字塔和拉普拉斯/QMF/小波分解。在多个尺度和方向上提供生物驱动的方向能量和空间频率子带响应（类似 V1 的 Gabor/可操纵滤波器组）。 | 每帧：每子带（尺度 x 方向）系数能量/方差、每个方向带的总能量（方向能量直方图）、每个空间频率尺度的能量、定向边缘能量。每帧产生一个方向 x 尺度能量的紧凑向量。 | 视频帧 | 逐帧 | CPU 即可 | 表现良好 | 纳入 |
| [Rosenholtz Feature Congestion + Subband Entropy clutter measures](https://persci.mit.edu/research/clutter) | 视觉杂乱度的两种互补模型。特征拥塞捕获颜色、亮度对比度和方向的局部变化（通过特征图的高斯金字塔协方差）；子带熵将杂波捕获为小波亮度和色度子带中的熵/信息。 | 每帧：全局特征拥塞杂波标量（以及密集的每像素杂波图）和全局子带熵杂波标量；可选择分为颜色、对比度和方向杂波子组件。 | 视频帧 | 逐帧 | CPU 即可 | 表现良好 | 纳入 |
| [Hasler & Susstrunk colorfulness metric (+ warmth from CIELAB)](https://pyimagesearch.com) | **简单来说：**根据人类色彩判断验证单个“该帧的色彩有多鲜艳”分数；每秒一个值。来自对手颜色统计的自然图像的感知色彩，根据人类色彩评级（> 90% 相关性）进行验证。与基于 CIELAB 的“温暖度”（a* 红绿/b* 黄蓝平均值或色调分布）和 HSV 的饱和度简单搭配。 | 每帧标量：色彩指数 M = sqrt(std_rg^2 + std_yb^2) + 0.3*sqrt(mean_rg^2 +mean_yb^2);加上平均 a*/b*（暖色/冷色）、平均 HSV 饱和度、主色调摘要。 | 视频帧 | 逐帧 | CPU 即可 | 表现良好 | 纳入 |
| [GIST / spatial envelope descriptor (lear-gist-python, pyGist, LMgist)](https://github.com/whitphx/lear-gist-python) | 整体低到中级场景描述符：方向 x 空间频率能量（Gabor 滤波器组，通常为 8 个方向 x 4 个尺度）汇集在 4x4 空间网格上，总结全局场景结构（开放度、粗糙度、自然度相关维度）。 | 窗口方向能量值的每帧固定长度向量（例如 8 个方向 x 4 个尺度 x 4x4 网格的 512-d）；紧凑的全局纹理/结构签名，可直接用作每帧特征向量。 | 视频帧 | 逐帧 | CPU 即可 | 可用 | 资源允许时纳入 |
| [pliers (PsychoinformaticsLab) low-level image extractors](https://github.com/PsychoinformaticsLab/pliers) | 编排框架，在视频帧上运行低级图像提取器（BrightnessExtractor、SharpnessExtractor、VibranceExtractor、SaliencyExtractor 以及 scikit-image/OpenCV 的包装器），具有自动时间戳和整洁的长格式输出，而不是手动滚动每帧循环。 | 每帧，带时间戳：亮度（平均值/亮度）、锐度（拉普拉斯方差）、振动度（RGB 通道间的方差）、显著性摘要；发出一个开始/持续时间标记的数据帧，准备用于 fMRI/时间线对齐。 | 视频帧 | 逐帧 | CPU 即可 | 可用 | 纳入 |

**推荐（同类最佳）：** scikit-image + OpenCV + NumPy 作为核心每帧引擎（亮度、RMS 对比度、RGB/HSV/CIELAB 颜色、熵、边缘、FFT 功率谱）； Pyrtools / 全光可操纵金字塔，用于定向能量和空间频率库； SHINE 用于规范的、文献匹配的亮度/对比度/傅里叶幅度谱定义； Rosenholtz 特征拥塞 + 子带熵，解决视觉杂乱度问题；用于感知色彩的 Hasler-Susstrunk 色彩公式（直接实现）； pliers 作为时间戳/编排层，为电影时间线提供数据

**可能多余：**
- OpenCV Gabor 内核库被 Pyrtools/GIST 取代，以实现原则性方向能量（保持 OpenCV 主要用于速度和视频解码）
- 全局香农熵和原始边缘密度是较弱的杂波代理，被 Rosenholtz 特征拥塞/子带熵取代
- GIST 与 Pyrtools 定向能严重重叠；除非特别需要一个紧凑的固定长度整体向量，否则只需要一个
- 学习的低级描述符/CNN 早期层激活为此子类添加了很少的分析亮度/对比度/颜色/频率特征，并且更好地保留给中/高级视觉子类
- pliers 内置提取器重复 scikit-image/OpenCV 计算；它是编排的便利，而不是独立的功能源
- scikit-image 和 OpenCV 本身在颜色/边缘/FFT 运算中大量重叠

<details><summary>参考文献</summary>

- **scikit-image (skimage) 0.24/0.25 + NumPy** — [scikit-image.org](https://scikit-image.org); van der Walt et al. 2014 PeerJ
- **OpenCV (cv2) 4.x** — [opencv.org](https://opencv.org); pyimagesearch colorfulness/blur tutorials
- **SHINE toolbox (+ SHINE_color fork)** — Willenbockel et al. 2010 Behav Res Methods 42:671; [mapageweb.umontreal.ca/gosselif/shine](https://mapageweb.umontreal.ca/gosselif/shine)
- **pyrtools (LabForComputationalVision) / matlabPyrTools** — [github.com/LabForComputationalVision/pyrtools](https://github.com/LabForComputationalVision/pyrtools); Simoncelli & Freeman 1995; plenoptic (Duong et al.)
- **Rosenholtz Feature Congestion + Subband Entropy clutter measures** — Rosenholtz, Li & Nakano 2007 J Vision; [persci.mit.edu/research/clutter](https://persci.mit.edu/research/clutter)
- **Hasler & Susstrunk colorfulness metric (+ warmth from CIELAB)** — Hasler & Susstrunk 2003, SPIE Human Vision; pyimagesearch colorfulness post
- **GIST / spatial envelope descriptor (lear-gist-python, pyGist, LMgist)** — Oliva & Torralba 2001 IJCV; [github.com/whitphx/lear-gist-python](https://github.com/whitphx/lear-gist-python); davidmwatson/pyTools pyGist
- **pliers (PsychoinformaticsLab) low-level image extractors** — McNamara et al. 2017; [github.com/PsychoinformaticsLab/pliers](https://github.com/PsychoinformaticsLab/pliers); Neuroscout (de la Vega 2022 eLife)

</details>

## 高级静态视觉：物体、场景、地点、属性

对于对象、场景、地点和属性的每帧电影/音频故事标注，该领域已经围绕一些基础模型系列进行了整合。两个互补的主干网满足了大多数需求：对比视觉语言编码器（OpenCLIP，SigLIP2）通过文本提示提供开放词汇探测分数和零样本场景/地点/对象/属性标签，以及自监督编码器（DINOv2/DINOv3）提供无标签的密集语义嵌入。对于明确的本地化标签，开放词汇检测器（Grounding DINO 1.5/1.6，YOLO-World）和提示/全景分割器（SAM 2，Mask2Former）发出每个对象的框/掩模。对于丰富的自然语言场景描述和属性/关系推理，请打开 VLM（Qwen2.5-VL、InternVL3、LLaVA-OneVision）字幕框架或回答结构化 VQA。小型实验室可以在单个 24-48GB GPU 上本地运行其中的大部分；主要的权衡是固定词汇分类器（Places365、ImageNet 主干）在很大程度上被开放词汇 CLIP 系列探测所取代，除非明确需要冻结、可再现、可解释的类别向量。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [OpenCLIP (ViT-L/14, ViT-H/14, ViT-bigG/14; LAION-2B / DataComp checkpoints)](https://github.com/mlfoundations/open_clip) | 框架的开放词汇语义内容：图像与任意文本提示之间的相似性，提示对象、场景、地点、属性、动作。 | 每帧：(a) 768-1280 暗淡 L2 归一化图像嵌入； (b) 针对任何用户定义的标签集（例如零样本 Places365 类别、ImageNet-1k 类别、属性提示）的余弦相似度/softmax 分数。每帧每个概念的连续探测得分。 | 视频帧 | 帧（在采样帧上运行，例如 1-4 fps，与时间线对齐） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [SigLIP 2 (google/siglip2 ViT-B/L/So400m, NaFlex variants)](https://arxiv.org/abs/2502.14786) | **简单来说：**将每一帧变成一个 768 个数字的语义“指纹”，通过将帧与短文本提示进行比较，还可以打分 16 个易于阅读的场景标签（室内/室外、自然、人物、文本……）；这是处理流程运行的模型（siglip2-base）。开放词汇图像文本对齐（与 CLIP 作用相同），具有 sigmoid 损失、更强的零样本分类、本地化、多语言（109 种语言）和改进的密集特征。 | 每帧：图像嵌入（768-1152 暗淡）加上对象/场景/地点/属性标签集的每个提示 sigmoid/logit 分数；支持本机分辨率 (NaFlex) 和更好的补丁级密集特征，用于局部属性探测。 | 视频帧 | 逐帧 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [DINOv2 / DINOv3 (ViT-S/B/L/g, self-supervised)](https://arxiv.org/abs/2304.07193) | **简单来说：** 无需任何人类标签即可学习的 384 个数字、无标签视觉“指纹”——用于帧匹配和大脑编码模型的对象、纹理和布局的一般描述（处理流程运行 DINOv2-small）。无标签通用视觉语义和结构；对象/零件/场景的强大密集（补丁级）功能，无需任何文本词汇。 | 每帧：全局 CLS 嵌入（384-1536 暗淡）和每块密集特征图。默认情况下没有人类可读的标签；用作线性探针分类器的表征相似性（RSA）特征，或用作下游属性/场景探针的骨干。 DINOv3 添加了革兰氏锚定的高分辨率密集图。 | 视频帧 | 逐帧 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [Grounding DINO 1.5 / 1.6 (Pro and Edge)](https://arxiv.org/abs/2405.10300) | 开放词汇对象检测：根据自由文本提示（类别名称或引用表达式）本地化任意对象/类别。 | 每帧：检测到的对象列表，带有边界框、自由文本类标签（来自提示词汇）和置信度分数。生成任何概念列表的每帧对象存在/计数/位置。 | 视频帧 | 逐帧 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [YOLO-World (v2, S/M/L/X)](https://arxiv.org/abs/2401.17270) | 实时开放词汇对象检测（CLIP 文本条件 YOLO）。 | 每帧：边界框+开放词汇类标签+置信度分数；速度非常快，非常适合在长影片中密集运行（每一帧）。 | 视频帧 | 逐帧 | 可用 GPU 运行 | 表现良好 | 备选 |
| [Qwen2.5-VL (3B / 7B / 72B)](https://hf.co/Qwen) | 自然语言场景描述、针对对象/场景/属性/关系的结构化 VQA、带坐标的接地字幕；用于语义框架标注的主力开放 VLM。 | 每帧（或每镜头关键帧）：自由文本标题；对固定问题模式的结构化/JSON 答案（例如设置=室内/室外、地点类型、显著对象列表、属性、人数）；用于参考对象的可选接地盒。转换为分类/序数时间序列。 | 视频帧 | 帧/每个镜头（在采样关键帧上运行；还可以本地处理短剪辑） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [InternVL3 (1B-78B; InternVL3-8B/14B common)](https://arxiv.org/abs/2504.10479) | 与 Qwen2.5-VL 相同的场景描述/VQA/接地字幕角色；在感知和推理基准方面最强的开放式 MLLM 之一。 | 每帧：自由文本字幕和结构化 VQA 输出（场景/地点分类、对象清单、属性、空间关系）；支持接地。 | 视频帧 | 帧/每镜头 | 可用 GPU 运行 | 表现良好 | 备选 |
| [Places365 CNN (ResNet-50-places365) and ImageNet backbones (ConvNeXt-V2, EVA-02, BEiT-3)](https://github.com/CSAILVision/places365) | 具有固定、可重现、可解释标签后验的封闭词汇场景/地点识别（365 个场景类别）和对象分类 (ImageNet-1k/-21k)。 | 每帧：365 维场景类别概率向量 (Places365) 和/或 1000/21841 维 ImageNet 类后验；还有场景属性（太阳属性头部）和室内/室外+自然度。完全可解释的每类别时间序列。 | 视频帧 | 逐帧 | CPU 即可 | 可用 | 资源允许时纳入 |
| [Mask2Former / OneFormer (panoptic, COCO/ADE20K/Cityscapes)](https://github.com/facebookresearch/Mask2Former) | 全景/语义/实例分割：将每个区域的像素级标记为“事物”（对象）和“东西”（天空、道路、墙壁、植被）类别。 | 每帧：每像素类图加上带有类标签的每实例掩码；导出每个类别的每帧面积分数（例如％天空、％人、％建筑物）、对象计数、场景组成向量。 | 视频帧 | 逐帧 | 可用 GPU 运行 | 表现良好 | 纳入 |
| [SAM 2 (Segment Anything Model 2, hiera-tiny/small/base/large)](https://arxiv.org/abs/2408.00714) | 对图像和视频中的对象进行与类别无关的即时分割；生成掩码，但本身不生成语义标签。 | 每帧：高质量实例蒙版（来自点/框/自动“一切”模式），具有视频时间蒙版传播/跟踪。与 CLIP/Grounding DINO 配对以粘贴标签 (Grounded-SAM)；生成每个对象的分段区域、大小、计数和一致的轨道 ID。 | 视频片段 | 帧（具有跨剪辑的时间掩模传播） | 可用 GPU 运行 | 表现良好 | 资源允许时纳入 |

**推荐（同类最佳）：** SigLIP 2（或 OpenCLIP ViT-L）作为对象/场景/地点/属性分数的主要开放词汇文本探测编码器； DINOv2/DINOv3 作为 RSA 和线性探针的互补无标记密集嵌入； Qwen2.5-VL-7B 作为结构化场景描述的主要字幕/VQA VLM；接地 DINO（通过 API 实现 1.6 Pro 以获得准确性，或在本地打开 1.0 / YOLO-World）以进行开放词汇表的每个对象检测； Mask2Former/OneFormer 全景场景合成（物体+物体面积分数）

**可能多余：**
- OpenCLIP 和 SigLIP 2 扮演相同的文本探测角色 - 将其中一个作为主要运行（SigLIP 2 通常更强），而不是同时运行
- Qwen2.5-VL、InternVL3 和 LLaVA-OneVision 是可互换的字幕/VQA VLM - 在对提示模式进行基准测试后选择一个主要的
- YOLO-World 在准确度上被 Grounding DINO 1.6 Pro 取代；仅当每帧吞吐量/密度受到限制时才保留
- Places365 CNN 和 ImageNet 训练的主干网很大程度上被相同标签集的零样本 CLIP/SigLIP2 探测所取代 - 仅保留冻结的、可重复的固定分类概率向量
- SAM 2 单独不产生标签，并且与 Mask2Former 重叠以满足静态全景需求；仅通过视频一致跟踪或接地 SAM 来增加价值

**开放问题：**
- 帧采样率达到真正的逐秒对齐与计算预算（1 fps 探测与重型 VLM 的镜头级关键帧）
- 是否通过零样本 CLIP/SigLIP2 提示导出场景/地点标签，还是保留冻结的 Places365 头部以实现功能磁共振成像工作中的再现性/引用
- 与 Apache-2.0 DINOv2 相比，DINOv3 许可（研究/非商业条款）可能会限制使用
- 接地 DINO 1.6 Pro 的最佳精度仅适用于 API - 对于小型实验室来说可以接受，还是退回到开放的 1.0/YOLO-World？
- 需要聚合/解析层将自由文本 VLM 字幕转换为一致的每秒分类特征向量（模式 + JSON 约束解码）

<details><summary>参考文献</summary>

- **OpenCLIP (ViT-L/14, ViT-H/14, ViT-bigG/14; LAION-2B / DataComp checkpoints)** — [github.com/mlfoundations/open_clip](https://github.com/mlfoundations/open_clip); LAION-2B / DataComp-1B; Radford et al. 2021 CLIP
- **SigLIP 2 (google/siglip2 ViT-B/L/So400m, NaFlex variants)** — Tschannen et al. 2025 [arXiv:2502.14786](https://arxiv.org/abs/2502.14786); [hf.co/google](https://hf.co/google) (siglip2)
- **DINOv2 / DINOv3 (ViT-S/B/L/g, self-supervised)** — Oquab et al. 2023 DINOv2; DINOv3 2025 [arXiv:2508.10104](https://arxiv.org/abs/2508.10104)
- **Grounding DINO 1.5 / 1.6 (Pro and Edge)** — Liu et al. 2023; Ren et al. 2024 Grounding DINO 1.5 [arXiv:2405.10300](https://arxiv.org/abs/2405.10300); IDEA-Research/GroundingDINO
- **YOLO-World (v2, S/M/L/X)** — Cheng et al. 2024 [arXiv:2401.17270](https://arxiv.org/abs/2401.17270); [docs.ultralytics.com/models/yolo-world](https://docs.ultralytics.com/models/yolo-world)
- **Qwen2.5-VL (3B / 7B / 72B)** — Qwen2.5-VL Technical Report 2025; [hf.co/Qwen](https://hf.co/Qwen)
- **InternVL3 (1B-78B; InternVL3-8B/14B common)** — InternVL3 2025 [arXiv:2504.10479](https://arxiv.org/abs/2504.10479); [hf.co/OpenGVLab](https://hf.co/OpenGVLab)
- **Places365 CNN (ResNet-50-places365) and ImageNet backbones (ConvNeXt-V2, EVA-02, BEiT-3)** — Zhou et al. 2017 Places365; [github.com/CSAILVision/places365](https://github.com/CSAILVision/places365); huggingface timm
- **Mask2Former / OneFormer (panoptic, COCO/ADE20K/Cityscapes)** — Cheng et al. 2022 Mask2Former; Jain et al. 2023 OneFormer
- **SAM 2 (Segment Anything Model 2, hiera-tiny/small/base/large)** — Ravi et al. 2024 SAM 2 [arXiv:2408.00714](https://arxiv.org/abs/2408.00714); Grounded-SAM (IDEA-Research)

</details>

## 面孔、身体、目光和面部表情

这个子类涵盖了每帧提取面部和身体的位置、他们是谁、他们看起来在哪里以及他们表达什么。成熟的开源堆栈是：检测器/跟踪器（RetinaFace/InsightFace、MediaPipe）提供身份（ArcFace）、地标、头部姿势和凝视（OpenFace 3.0、L2CS-Net）、面部动作单元和离散/连续情感（Py-Feat、OpenFace 3.0、HSEmotion/EmotiEffLib、 EmoNet），以及身体/手部关键点（MMPose 的 RTMPose/RTMW、ViTPose、MediaPipe Holistic）。截至 2025 年，OpenFace 3.0 (arXiv 2506.02891) 将地标+AU+凝视+情感整合为一个轻量级的 CPU 多任务模型，MMPose RTMPose/RTMW 主导实时 2D/全身姿势；这些是小型实验室的建议默认值。所有主要组件都在单个消费级 GPU（通常是 CPU）上运行，使得长电影的逐秒标注成为可能。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [InsightFace (RetinaFace detector + ArcFace 'buffalo_l' pack, ResNet50@WebFace600K)](https://arxiv.org/abs/1905.00641) | 人脸检测、5 点 + 2D-106/3D-68 地标对齐以及用于跨帧识别/跟踪的 512 维人脸身份嵌入。 | 每帧检测到的人脸：边界框 (x,y,w,h) + 检测分数； 5或106个2D地标坐标； 68 个 3D 地标坐标；粗头姿势（来自 3D 拟合的偏航/俯仰/滚动）；年龄估计；二元性别； 512 维 L2 归一化 ArcFace 嵌入（用于身份聚类/跟踪的余弦可比较）。 | 视频帧 | 每帧（每个检测到的人脸） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [RetinaFace (standalone, serengil/retinaface or InsightFace detector)](https://arxiv.org/abs/1905.00641) | 具有面部特征点定位的单级密集人脸检测；大多数现代处理流程下方的检测主干。 | 每帧：人脸边界框+置信度；每张脸有 5 个面部标志（眼睛、鼻子、嘴角）。没有身份/AU。 | 视频帧 | 逐帧 | CPU 即可 | 表现良好 | 备选 |
| [MediaPipe Tasks (Face Detector, Face Landmarker w/ blendshapes, Pose Landmarker, Hand Landmarker; legacy Holistic)](https://ai.google.dev/edge/mediapipe) | 轻量级设备端面部、身体和手部关键点以及 52 个 ARKit 风格的混合形状表达系数和近似头部姿势。 | 每帧：478 个 3D 人脸网格标志； 52 个 BlendShape 系数 (0-1)，涵盖眉毛/眼睛/嘴巴/下巴表情基元； 4x4面部变换矩阵（头部姿势）； 33 个可见的 3D 身体姿势地标；每只手 21 个 3D 手部地标。发出标准化+世界坐标。 | 视频帧 | 逐帧 | CPU 即可 | 表现良好 | 纳入 |
| [OpenFace 3.0 (lightweight multitask, RetinaFace MobileNet-0.25 frontend)](https://arxiv.org/abs/2506.02891) | 统一的每帧面部行为：来自单个共享主干模型的地标、面部动作单元、眼睛注视和离散情感。 | 每帧每张脸：密集的 2D 面部标志； AU 检测（存在/强度，FACS 式集）；眼睛注视方向（注视向量/偏航俯仰）；头部姿势；离散的面部情绪类别+概率。每个视频的时间序列 CSV。 | 视频帧 | 逐帧 | CPU 即可 | 同类首选 | 纳入 |
| [OpenFace 2.0 (TadasBaltrusaitis/OpenFace)](https://github.com/TadasBaltrusaitis/OpenFace) | 经典 CLM/CE-CLM 面部标志、头部姿势、凝视和 AU 强度/存在回归；长期基于 FACS 的 AU 时间序列的现场标准。 | 每帧：68个2D+3​​D地标；头部姿势（Tx、Ty、Tz、俯仰/偏航/滚动）；眼睛注视向量（gaze_0，gaze_1）+注视角度； 17 个 AU 强度（AU01-AU45、0-5）+ 18 个 AU 存在二进制文件；每帧置信度和成功标志。输出整洁的 CSV。 | 视频帧 | 逐帧 | CPU 即可 | 可用 | 备选 |
| [Py-Feat (cosanlab/py-feat)](https://github.com/cosanlab/py-feat) | 模块化 Python 面部表情处理流程：面部检测、地标、头部姿势、AU 和 7 类情感，具有内置可视化和分析（Fex 数据类）。 | 每帧每张脸：bbox + 分数； 68 个地标；头部姿势（俯仰/偏航/滚动）； ~20 AU 概率/强度（可选检测器，例如地标+HOG 上的 XGBoost/SVM）； 7种情绪概率（愤怒、厌恶、恐惧、快乐、悲伤、惊讶、中性）；可选的身份嵌入。返回类似 pandas 的 Fex 时间序列。 | 视频帧 | 逐帧 | 可用 GPU 运行 | 表现良好 | 纳入 |
| [L2CS-Net (Ahmednull/L2CS-Net)](https://arxiv.org/abs/2203.03339) | 基于外观的 3D 凝视方向估计，在不受约束的全 360 度设置中从脸部裁剪（无眼动追踪器硬件）。 | 每帧每张脸：凝视偏航角和俯仰角（弧度/度）-> 3D 凝视方向矢量。 SOTA 3.92 度 (MPIIGaze)、10.41 度 (Gaze360)。 | 视频帧 | 逐帧 | 可用 GPU 运行 | 表现良好 | 资源允许时纳入 |
| [MMPose: RTMPose / RTMW / RTMW3D (open-mmlab/mmpose)](https://arxiv.org/abs/2303.07399) | 实时俯视多人2D全身、全身（身体+脸部+手+脚）、3D全身关键点估计。 | 每帧检测到的人：17 个 COCO 身体关键点 (RTMPose) 或 133 个 COCO-WholeBody 关键点（RTMW：23 个身体+脚、68 个脸、42 个手），每个关键点都有 (x,y) + 置信度； RTMW3D 添加了 3D (x,y,z)。生成每个人的骨骼 -> 派生姿势、手势、头部方向信号。 | 视频帧 | 每帧（每人） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [ViTPose / ViTPose++ (ViTAE-Transformer/ViTPose, in MMPose)](https://arxiv.org/abs/2204.12484) | Vision-transformer 自上而下的人体姿态估计；当精度超过速度时，获得最高精度的 2D 身体关键点。 | 每人每帧：17 个 (COCO) 或最多 133 个（通过 ViTPose+ 的全身）关键点，具有 (x,y)+ 置信度热图衍生坐标。 ViTPose-G 在 COCO 上达到 >80 AP。 | 视频帧 | 每帧（每人） | 需要高性能 GPU | 表现良好 | 备选 |
| [HSEmotion / EmotiEffLib (EmotiEffNet, av-savchenko / sb-ai-lab)](https://arxiv.org/abs/2403.11590) | 基于快速 EfficientNet/MobileViT 的面部表情分类、价唤醒回归和面部裁剪的 AU 预测；调整为视频。 | 每帧每张脸：8级情绪概率（愤怒、蔑视、厌恶、恐惧、快乐、中性、悲伤、惊讶）；连续价和唤醒标量 (-1..1)；所有激活；加上下游时间模型的可重复使用的面部嵌入功能。 | 视频帧 | 每帧（可聚合的每句话/剪辑） | CPU 即可 | 表现良好 | 纳入 |
| [EmoNet (face-analysis/emonet)](https://github.com/face-analysis/emonet) | 连续价唤醒加上自然条件下面部的离散情绪估计（AffectNet 训练）。 | 每帧每张脸：连续价和唤醒度 (-1..1)；离散情感类别（5 类或 8 类模型）+ 概率；面部标志。包括用于视频人脸检测+情感的 demo_video.py。 | 视频帧 | 逐帧 | 可用 GPU 运行 | 可用 | 备选 |

**推荐（同类最佳）：** OpenFace 3.0（一个支持 CPU 的多任务模型中的地标 + AU + 凝视 + 情感）作为主要面部行为提取器； InsightFace buffalo_l（RetinaFace + ArcFace）用于人脸检测、跟踪和身份嵌入； MMPose RTMPose / RTMW 用于实时 2D 和全身（身体+面部+手+脚）关键点； MediaPipe 任务用于廉价的仅 CPU 身体/手/面部地标 + 混合形状作为后备/冗余层； HSEmotion/EmotiEffLib 用于快速连续价态唤醒和表达，以及当高精度 360 度凝视作为主要信号时的 L2CS-Net

**可能多余：**
- OpenFace 2.0 -> 被 OpenFace 3.0 取代（更快、多任务、更好的准确性）；仅保留用于复制传统处理流程或其经过验证的 AU 强度等级
- 独立的 RetinaFace -> 与捆绑它的 InsightFace 是多余的；内部装有探测器 OpenFace 3.0 / Py-Feat
- ViTPose -> 与 MMPose RTMPose/RTMW 冗余，适合典型实验室使用；只有在强大的 GPU 上才能获得最大精度的关键点才值得
- EmoNet -> 价态唤醒很大程度上被 HSEmotion 取代（更快、更新、更多输出）；保留作为可引用的交叉检查
- L2CS-Net 凝视和 Py-Feat/HSEmotion 情感重叠 OpenFace 3.0 的捆绑凝视/情感 -> 仅当这些特定信号需要一流的准确性时才单独运行
- MediaPipe 身体/手部关键点重叠 MMPose（精度较低，单人尽力而为）-> 使用 MediaPipe 实现廉价的仅 CPU 或冗余，使用 MMPose 实现精度/多人

<details><summary>参考文献</summary>

- **InsightFace (RetinaFace detector + ArcFace 'buffalo_l' pack, ResNet50@WebFace600K)** — [github.com/deepinsight/insightface](https://github.com/deepinsight/insightface); RetinaFace ([arXiv 1905.00641](https://arxiv.org/abs/1905.00641)); ArcFace ([arXiv 1801.07698](https://arxiv.org/abs/1801.07698))
- **RetinaFace (standalone, serengil/retinaface or InsightFace detector)** — [arXiv 1905.00641](https://arxiv.org/abs/1905.00641); [github.com/serengil/retinaface](https://github.com/serengil/retinaface)
- **MediaPipe Tasks (Face Detector, Face Landmarker w/ blendshapes, Pose Landmarker, Hand Landmarker; legacy Holistic)** — [ai.google.dev/edge/mediapipe](https://ai.google.dev/edge/mediapipe); [developers.google.com/mediapipe](https://developers.google.com/mediapipe)
- **OpenFace 3.0 (lightweight multitask, RetinaFace MobileNet-0.25 frontend)** — [arXiv 2506.02891](https://arxiv.org/abs/2506.02891); [huggingface.co/papers/2506.02891](https://huggingface.co/papers/2506.02891)
- **OpenFace 2.0 (TadasBaltrusaitis/OpenFace)** — [github.com/TadasBaltrusaitis/OpenFace](https://github.com/TadasBaltrusaitis/OpenFace); OpenFace 2.0 (FG 2018)
- **Py-Feat (cosanlab/py-feat)** — Cheong et al., Behavior Research Methods 2023; [github.com/cosanlab/py-feat](https://github.com/cosanlab/py-feat)
- **L2CS-Net (Ahmednull/L2CS-Net)** — [arXiv 2203.03339](https://arxiv.org/abs/2203.03339); [github.com/Ahmednull/L2CS-Net](https://github.com/Ahmednull/L2CS-Net)
- **MMPose: RTMPose / RTMW / RTMW3D (open-mmlab/mmpose)** — RTMPose [arXiv 2303.07399](https://arxiv.org/abs/2303.07399); RTMW [arXiv 2407.08634](https://arxiv.org/abs/2407.08634); [github.com/open-mmlab/mmpose](https://github.com/open-mmlab/mmpose)
- **ViTPose / ViTPose++ (ViTAE-Transformer/ViTPose, in MMPose)** — ViTPose [arXiv 2204.12484](https://arxiv.org/abs/2204.12484); ViTPose++ [arXiv 2212.04246](https://arxiv.org/abs/2212.04246)
- **HSEmotion / EmotiEffLib (EmotiEffNet, av-savchenko / sb-ai-lab)** — Savchenko, HSEmotion (CVPR 2023 workshops; [arXiv 2403.11590](https://arxiv.org/abs/2403.11590)); [github.com/av-savchenko/hsemotion](https://github.com/av-savchenko/hsemotion); [github.com/sb-ai-lab/EmotiEffLib](https://github.com/sb-ai-lab/EmotiEffLib)
- **EmoNet (face-analysis/emonet)** — Toisoul et al., Nature Machine Intelligence 2021; [github.com/face-analysis/emonet](https://github.com/face-analysis/emonet)

</details>

## 动态视觉：运动、光流、运动能量

该子类涵盖低级动态视觉信号：密集光流（每像素运动矢量）、来自时空滤波器组的聚合运动能量、相机与对象运动分离、镜头/剪切边界以及帧到帧的视觉变化/新颖性。这些是故意的前语义特征（物体移动的程度/方向，镜头切换时），与语义动作识别不同。该领域已经成熟并且基本上是开源的：RAFT 及其 2024 后继者 SEA-RAFT 主导着密集流，MemFlow/VideoFlow 添加了多帧时间平滑，pymoten 提供了规范的神经科学运动能量金字塔，TransNetV2 加上 PySceneDetect 覆盖镜头检测。对于小型实验室，实用的默认处理流程是：用于剪切的 PySceneDetect/TransNetV2、用于大脑对齐运动能量回归量的 pymoten 以及用于密集流的 SEA-RAFT（或 RAFT），从中可以导出全局/平均流幅度（相机运动的代理）和残余流（对象运动）。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [SEA-RAFT (Princeton-VL, ECCV 2024)](https://arxiv.org/abs/2405.14793) | 连续帧之间的密集每像素光流（2D 运动矢量场）；开放流模型中当前最佳精度/速度权衡 | 全分辨率下每像素 (u,v) 位移场；可导出的每帧标量：平均/中值流矢量幅度、流方向直方图、发散/卷曲、通过稳健拟合和残余（对象）运动幅度进行的全局运动（相机）估计 | 视频帧 | 帧（每个连续帧对） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [RAFT (Teed & Deng, ECCV 2020)](https://github.com/princeton-vl/RAFT) | **简单来说：**测量事物在帧之间移动的程度和方式；处理流程（运行 RAFT）每秒将其总结为整体光流大小、相机运动和剩余物体运动。通过循环全对相关实现密集的每像素光流；长期可靠的基线，广泛应用（torchvision、ptlflow） | 每像素（u，v）流场；与 SEA-RAFT 相同的导出每帧标量（平均幅度、方向熵、相机/对象分解） | 视频帧 | 逐帧 | 可用 GPU 运行 | 表现良好 | 备选 |
| [MemFlow (Dong et al., CVPR 2024)](https://github.com/dqiaole/MemFlow) | 具有聚合历史运动的内存模块的多帧光流，提供时间上更平滑的光流和大运动鲁棒性；即时的 | 每像素 (u,v) 流场，在整个剪辑中时间上一致；相同的导出标量，帧间抖动较小，对于逐秒时间序列有用 | 视频片段 | 帧（具有时间上下文） | 可用 GPU 运行 | 表现良好 | 资源允许时纳入 |
| [VideoFlow (Shi et al., ICCV 2023)](https://arxiv.org/abs/2303.08340) | 利用时间线索的多帧（三帧 TROF + 传播）光流； Sintel/KITTI 上的高精度 | 跨多个帧的双向每像素 (u,v) 流；导出的每帧运动幅度/方向系列 | 视频片段 | 框架（多框架上下文） | 可用 GPU 运行 | 可用 | 舍弃 |
| [pymoten (Gallant Lab; Nunez-Elizalde et al. 2021)](https://github.com/gallantlab/pymoten) | 来自多个空间/时间频率、方向、位置、大小的时空 Gabor 正交滤波器金字塔的运动能量 — 用于 fMRI 编码的规范低级运动模型 (Nishimoto & Gallant 2011) | 滤波器激活能量的每帧高维（数百到数千维）向量，每个 Gabor 通道一个值（空间频率 x 时间频率 x 方向 x 位置）。可直接用作体素编码模型回归量或可简化为总结运动能量标量 | 视频帧 | 帧（可配置；通常下采样至每秒或 TR） | CPU 即可 | 同类首选 | 纳入 |
| [TransNetV2 (Soucek & Lokoc 2020)](https://arxiv.org/abs/2008.04838) | **简单来说：**找到镜头之间的剪辑。该处理流程使用基于直方图的轻量级剪切检测器作为 TransNetV2 的替代品，标记每个镜头变化并对镜头进行编号。通过深度扩张 3D-CNN 进行镜头/剪切边界检测，包括硬剪切和逐渐过渡（溶解、淡入淡出、擦除）；当前镜头边界的开放 SOTA | 每帧剪切概率（0-1）；镜头边界帧索引和镜头片段的阈值列表；处理渐变、闪烁、运动模糊 | 视频片段 | 每帧概率产生每镜头分割 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [PySceneDetect (v0.6+)](https://github.com/Breakthrough/PySceneDetect) | 通过内容感知 HSV 直方图变化 (ContentDetector) 或自适应/阈值检测器进行镜头/剪切检测；轻量级CPU工具 | 剪切帧/时间码边界和场景片段列表；每帧内容变化分数时间序列（原始 HSV-delta 信号本身就是一个可用的视觉变化/新奇功能） | 视频帧 | 每帧变化分数；每镜头分割 | CPU 即可 | 表现良好 | 纳入 |
| [AutoShot (Zhu et al., CVPRW 2023)](https://arxiv.org/abs/2304.06116) | 在 SHOT/短视频数据集上训练的镜头边界检测；报告了短格式/社交视频的 SOTA，其中 TransNetV2 在不同的分布上进行了训练 | 每帧镜头边界分数和镜头片段 | 视频片段 | 每帧/每镜头 | 可用 GPU 运行 | 可用 | 备选 |
| [OpenCV Farneback / DIS dense optical flow](https://docs.opencv.org) | 经典（非深度）密集光流——Farneback多项式展开或DISOpticalFlow；当没有 GPU 可用时仅使用 CPU 回退 | 每像素（u，v）流场；导出每帧平均幅度和方向直方图 | 视频帧 | 逐帧 | CPU 即可 | 可用 | 备选 |

**推荐（同类最佳）：** SEA-RAFT（密集光流；导出全局相机运动与残余物体运动和平均流幅度）； pymoten（用于直接 fMRI 编码的神经科学标准运动能量金字塔特征）； TransNetV2（镜头/剪切边界检测，包括逐渐过渡）； PySceneDetect（快速 CPU 剪切检测 + 连续每帧视觉变化/新颖性评分）

**可能多余：**
- RAFT -> 被 SEA-RAFT 取代（精度更高，速度提高约 2.3 倍）；只保留简单的 torchvision 后备
- VideoFlow -> 被 MemFlow 取代（更快、参数更少、多帧流精度更高）
- AutoShot -> 与 TransNetV2 重叠；仅适用于短片/社交视频刺激
- OpenCV Farneback/DIS -> 在准确度上被 SEA-RAFT/RAFT 取代；仅保留作为无 GPU 后备
- GMFlow/FlowFormer 系列 -> 被 SEA-RAFT 所覆盖，作为选定的单一密流模型；无需运行多个深度流网络

**开放问题：**
- 相机与对象运动分离不是交钥匙工具：它必须源自密集流模型（例如流场上的鲁棒单应性/仿射全局运动拟合，然后残差 = 对象运动）。决定是实施这个还是采用 SLAM/egomotion 包。
- 选择时间聚合策略：流和运动能量是每帧的，因此定义如何针对神经影像时间线对每秒或每 TR（均值、RMS 或 HRF 卷积）进行装箱/下采样。
- 对于长篇叙事电影，根据逐秒系列中的抖动是否存在问题来决定是使用每对流 (SEA-RAFT) 还是时间平滑多帧流 (MemFlow)。
- 确认 SEA-RAFT 与 MemFlow 在您的实际刺激域（动画、档案电影、弱光）上的泛化，因为流模型主要在 Sintel/KITTI/Spring 上进行训练。

<details><summary>参考文献</summary>

- **SEA-RAFT (Princeton-VL, ECCV 2024)** — [github.com/princeton-vl/SEA-RAFT](https://github.com/princeton-vl/SEA-RAFT) ; [arXiv 2405.14793](https://arxiv.org/abs/2405.14793) ; Spring benchmark EPE 3.69
- **RAFT (Teed & Deng, ECCV 2020)** — [github.com/princeton-vl/RAFT](https://github.com/princeton-vl/RAFT) ; pytorch.org/vision optical_flow
- **MemFlow (Dong et al., CVPR 2024)** — [github.com/dqiaole/MemFlow](https://github.com/dqiaole/MemFlow) ; CVPR 2024 ; [dqiaole.github.io/MemFlow](https://dqiaole.github.io/MemFlow)
- **VideoFlow (Shi et al., ICCV 2023)** — [arXiv 2303.08340](https://arxiv.org/abs/2303.08340) ; [github.com/XiaoyuShi97/VideoFlow](https://github.com/XiaoyuShi97/VideoFlow)
- **pymoten (Gallant Lab; Nunez-Elizalde et al. 2021)** — [github.com/gallantlab/pymoten](https://github.com/gallantlab/pymoten) ; Nishimoto & Gallant 2011 J Neurosci ; [gallantlab.org/voxelwise_tutorials](https://gallantlab.org/voxelwise_tutorials)
- **TransNetV2 (Soucek & Lokoc 2020)** — [github.com/soCzech/TransNetV2](https://github.com/soCzech/TransNetV2) ; [arXiv 2008.04838](https://arxiv.org/abs/2008.04838)
- **PySceneDetect (v0.6+)** — [github.com/Breakthrough/PySceneDetect](https://github.com/Breakthrough/PySceneDetect) ; [scenedetect.com](https://scenedetect.com)
- **AutoShot (Zhu et al., CVPRW 2023)** — [arXiv 2304.06116](https://arxiv.org/abs/2304.06116) ; [github.com/wentaoyu/AutoShot](https://github.com/wentaoyu/AutoShot)
- **OpenCV Farneback / DIS dense optical flow** — [docs.opencv.org](https://docs.opencv.org) optical flow tutorial; Kroeger et al. DIS ECCV 2016

</details>

## 动作和活动识别（视频理解）

电影/音频故事时间线的计算动作/活动识别分为三个可用层：(1) 片段级识别主干，在短滑动窗口上发出 Kinetics/Something-Something 类后验和/或池化时空嵌入（VideoMAE V2、InternVideo2、V-JEPA 2、TimeSformer、VideoSwin、SlowFast），最好以固定窗口步幅运行（例如 16 帧） / 1-2 s) 产生每秒特征； (2) 时间动作定位 (TAL) 头（ActionFormer / OpenTAD，通常提供 InternVideo2 或 VideoMAE 特征），可以自信地将这些每个窗口的嵌入转换为开始结束动作片段； (3) 视频 LLM（Qwen3-VL、VideoLLaMA3、InternVL3、Video-LLaVA），可生成带有时间戳的开放词汇密集事件描述，对于固定标签集限制过多的自然主义电影很有价值。对于小型实验室来说，最大的优势来自：VideoMAE V2 / InternVideo2 作为滑动窗口上的冻结特征提取器，X-CLIP 用于零样本开放词汇动作概率，以及一个用于密集字幕的视频-LLM。纯剪辑分类器 (TimeSformer/VideoSwin/SlowFast) 现在已作为独立选择在很大程度上被取代，但作为标准、有据可查的 MMAction2/PySlowFast 主干和 TAL 特征源仍然很有价值。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [VideoMAE V2 (OpenGVLab, CVPR 2023; ViT-B/L/g, UnlabeledHybrid-1M pretrain, K400/K710 finetune)](https://arxiv.org/abs/2303.16727) | **简单来说：** 从短片中识别人们在做什么，对 400 多个日常动作类别进行评分（例如跑步、跳舞、烹饪、握手、弹吉他）；该处理流程存储完整的 400 值概率向量以及每秒的单个顶部操作（部署模型：在 Kinetics-400 上微调的 VideoMAE 基础）。自监督屏蔽自动编码器视频主干；片段级人类动作类和短窗口上的强池化时空嵌入 | 每个窗口（16 帧）400-dim Kinetics-400（或 710）动作 softmax 后验和/或冻结池化嵌入（768-dim ViT-B、1024-dim ViT-L、1408-dim ViT-g）用作下游 TAL 的事实特征 | 视频片段 | 每个剪辑（滑动 16 帧窗口；通过跨步每秒发出） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [InternVideo2 (OpenGVLab, ECCV 2024; Stage2 1B & 6B, video-text contrastive)](https://arxiv.org/abs/2403.15377) | 大型多模态视频基础模型； SOTA 片段级动作识别、通过视频文本匹配进行零样本/开放词汇动作分类，以及最强的已发布 TAL 特征提取器 | 每个窗口的视频嵌入（与文本嵌入空间对齐）为任意动作标签词汇提供零样本相似度分数；监督 K400/SSv2 类后验；汇集特征 (1B/6B) 喂养 ActionFormer 风格的 TAL | 多模态 | 每个剪辑（滑动窗口；通过跨步每秒发出） | 需要高性能 GPU | 同类首选 | 纳入 |
| [V-JEPA 2 (Meta AI, June 2025; ViT-L/H/g, facebook/vjepa2-vitl-fpc64-256)](https://arxiv.org/abs/2506.09985) | 自监督（非生成、潜在预测）视频世界模型；以运动为中心的时空表示，对时间/运动理解和动作预期有很强的影响 | 冻结每窗口时空嵌入（注意力探针给出动作类后验，例如 SSv2/EK100）；支持动作预期（recall@5）输出；嵌入可用作丰富运动的时间线功能 | 视频片段 | 每个剪辑（16 帧/64 帧窗口；每秒步幅） | 可用 GPU 运行 | 表现良好 | 资源允许时纳入 |
| [X-CLIP (Microsoft, ECCV 2022; microsoft/xclip-base-patch16/32, zero-shot variant)](https://arxiv.org/abs/2208.02816) | CLIP扩展到具有跨帧注意力的视频；通过视频文本相似性进行开放词汇/零样本片段级动作分类 | 对任意用户提供的动作短语列表的每个窗口相似度得分（softmax）；或 512 维联合视频嵌入用于检索 | 多模态 | 每个剪辑（8 帧窗口；每秒的步幅） | 可用 GPU 运行 | 表现良好 | 纳入 |
| [ActionFormer + OpenTAD (ECCV 2022 / CVPR-W 2025; TAL on InternVideo2/VideoMAE features)](https://arxiv.org/abs/2202.07925) | 时间动作定位：将每个窗口的骨干特征转换为带有类别和置信度的时间戳动作片段（单次、无锚、多尺度局部注意力） | 每个视频的（start_time、end_time、action_class、confidence）片段列表；密集覆盖时间线，可直接与电影时钟对齐 | 视频片段 | 每镜头/每段（亚秒精度的边界） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [Qwen3-VL (Alibaba, 2025; 4B/8B/30B/235B, video; predecessor Qwen2.5-VL)](https://arxiv.org/abs/2511.21631) | 用于开放词汇密集事件描述和时间基础的视频大语言模型；描述人们正在做什么，并通过文本时间戳对齐及时定位它 | 具有明确开始/结束时间戳的自由文本密集字幕和事件分段（文本时间戳对齐）；回答“t1-t2 之间发生了什么动作”；时间接地输出（Charades-STA 风格） | 多模态 | 每个话语/每个事件（模型发出的时间戳，〜秒精度） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [VideoLLaMA3 (DAMO/Alibaba, 2025; 2B/7B)](https://arxiv.org/abs/2501.13106) | 统一图像+视频大语言模型，专门针对时间基础和密集视频字幕 | 带有开始结束标记时间戳的密集字幕； ActivityNet/YouCook2/Charades-STA/Ego4D/COIN 上的时间基础；每个时间戳范围的开放词汇动作/事件描述 | 多模态 | 每个事件/每个话语（开始-结束令牌时间戳） | 可用 GPU 运行 | 表现良好 | 备选 |
| [InternVL3 (video) (OpenGVLab/Shanghai AI Lab, 2025; 1B-78B)](https://arxiv.org/abs/2504.10479) | 具有竞争性视频理解的通用多模式大语言模型；开放词汇事件/动作描述和采样帧的视频 QA | 查询窗口的操作/活动的自由文本描述；视频问答解答；可以提示输入带时间戳的事件列表（比 Qwen3-VL 弱的本地时间戳接地） | 多模态 | 每个剪辑/每个事件（取决于提示） | 可用 GPU 运行 | 表现良好 | 备选 |
| [TimeSformer / VideoSwin / SlowFast (via MMAction2 + PySlowFast)](https://arxiv.org/abs/2102.05095) | 经典的监督片段级动作分类器（分割时空注意力/分层3D窗口变压器/双路径3D-CNN）；发射动力学/SSv2 动作后部 | 每窗口动作 softmax 后验（例如 400-dim K400、174-dim Something-Something v2）和池化剪辑嵌入； SlowFast 功能是 VideoMAE/InternVideo2 之前的长期标准 TAL 输入 | 视频片段 | 每个剪辑（8-32 帧窗口；每秒的步幅） | 可用 GPU 运行 | 可用 | 资源允许时纳入 |

**推荐（同类最佳）：** VideoMAE V2 (ViT-L/g) 或 InternVideo2-1B 作为冻结滑动窗口特征提取器 + 动力学分类器； X-CLIP 用于基于自定义电影词汇的轻量级零样本开放词汇动作概率； ActionFormer/OpenTAD over InternVideo2/VideoMAE 功能用于带时间戳的动作片段； Qwen3-VL (8B) 作为主要视频大语言模型，用于开放词汇密集、带时间戳的事件描述

**可能多余：**
- TimeSformer / VideoSwin / SlowFast 作为独立识别器 -> 被 VideoMAE V2 和 InternVideo2 取代（仅保留方便的 MMAction2/PySlowFast 处理流程或作为旧版 TAL 功能）
- InternVL3（视频）和 VideoLLaMA3 -> 与 Qwen3-VL 重叠，实现密集字幕/时间基础；选择一个视频-LLM 作为主要（Qwen3-VL 具有最强的本地时间戳基础）
- X-CLIP 零样本 vs InternVideo2 零样本 -> 相同的开放词汇角色； InternVideo2 更准确但更重，X-CLIP 是便宜的默认值
- V-JEPA 2 与 VideoMAE V2 -> 都是自监督主干网； V-JEPA 2 是更多运动/时间偏向的补充，而不是严格的复制品

**开放问题：**
- 许可：VideoMAE V2 和 InternVideo2 权重仅供非商业/研究使用；确认这对于项目的使用和发布计划是可以接受的。
- 窗口步幅和时间分辨率：剪辑主干原生输出每 16 帧（~0.5-1 s）特征；目标逐秒节奏需要选择步幅/重叠以及需要跨特征标准化的池化规则。
- 标签分类：Kinetics-400/700 和 Something-Something 类是日常/原子动作，可能很难映射到叙事电影事件；决定是否依赖具有自定义分类法的 TAL 与开放词汇 X-CLIP/video-LLM 输出。
- Video-LLM 时间戳可靠性：Qwen3-VL/VideoLLaMA3 发出时间戳，但它们在自然长片上的秒级精度尚未得到很好的验证；可能需要根据 TAL 进行校准或手动抽查。
- 计算预算：InternVideo2-6B 和 Qwen3-VL-30B+ 超过单 GPU 小型实验室设置；确认1B/8B级模型是否足以满足所需的标注质量。

<details><summary>参考文献</summary>

- **VideoMAE V2 (OpenGVLab, CVPR 2023; ViT-B/L/g, UnlabeledHybrid-1M pretrain, K400/K710 finetune)** — [arXiv:2303.16727](https://arxiv.org/abs/2303.16727); HF OpenGVLab/VideoMAEv2-giant; [github.com/OpenGVLab/VideoMAEv2](https://github.com/OpenGVLab/VideoMAEv2)
- **InternVideo2 (OpenGVLab, ECCV 2024; Stage2 1B & 6B, video-text contrastive)** — [arXiv:2403.15377](https://arxiv.org/abs/2403.15377); ECCV 2024; HF collection OpenGVLab/InternVideo2
- **V-JEPA 2 (Meta AI, June 2025; ViT-L/H/g, facebook/vjepa2-vitl-fpc64-256)** — [arXiv:2506.09985](https://arxiv.org/abs/2506.09985); [ai.meta.com/blog/v-jepa-2-world-model-benchmarks](https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks); HF facebook/vjepa2-vitl-fpc64-256
- **X-CLIP (Microsoft, ECCV 2022; microsoft/xclip-base-patch16/32, zero-shot variant)** — [arXiv:2208.02816](https://arxiv.org/abs/2208.02816); HF docs/transformers model_doc/xclip
- **ActionFormer + OpenTAD (ECCV 2022 / CVPR-W 2025; TAL on InternVideo2/VideoMAE features)** — [arXiv:2202.07925](https://arxiv.org/abs/2202.07925); OpenTAD [arXiv:2502.20361](https://arxiv.org/abs/2502.20361); [github.com/OpenGVLab/OpenTAD](https://github.com/OpenGVLab/OpenTAD)
- **Qwen3-VL (Alibaba, 2025; 4B/8B/30B/235B, video; predecessor Qwen2.5-VL)** — Qwen3-VL Technical Report [arXiv:2511.21631](https://arxiv.org/abs/2511.21631); [github.com/QwenLM/Qwen3-VL](https://github.com/QwenLM/Qwen3-VL)
- **VideoLLaMA3 (DAMO/Alibaba, 2025; 2B/7B)** — [arXiv:2501.13106](https://arxiv.org/abs/2501.13106); HF DAMO-NLP-SG/VideoLLaMA3
- **InternVL3 (video) (OpenGVLab/Shanghai AI Lab, 2025; 1B-78B)** — [arXiv:2504.10479](https://arxiv.org/abs/2504.10479); HF OpenGVLab/InternVL3
- **TimeSformer / VideoSwin / SlowFast (via MMAction2 + PySlowFast)** — TimeSformer [arXiv:2102.05095](https://arxiv.org/abs/2102.05095); Video Swin [arXiv:2106.13230](https://arxiv.org/abs/2106.13230); SlowFast [arXiv:1812.03982](https://arxiv.org/abs/1812.03982); [github.com/open-mmlab/mmaction2](https://github.com/open-mmlab/mmaction2)

</details>

## 视觉显著性、注意力、美观性、深度

该子类生成每帧注意力/复杂性代理：预测的人类注视/显著性图（静态和视频）、单眼深度图以及美学、技术质量和记忆性的标量图像级分数。对于电影/音频故事时间线，与时间线最相关的输出是时空视频显著性图（每帧一个图，可概括为显著性浓度/熵和显著区域数量等标量）和深度图（每帧的平均值/范围/前景分数）。该领域已经成熟且绝大多数开源：用于静态固定的 DeepGaze IIE/III、用于视频显著性的 ViNet/TASED-Net/UNISAL、用于深度的 Depth-Anything-V2（以及用于公制的 Apple Depth Pro）以及用于美学/质量/记忆性的基于 CLIP/LMM 的评分器（Q-Align、LAION-Aesthetics、ResMem）。所有这些都在单个消费级 GPU 上运行；大多数在 CPU 上运行速度也很慢。推荐一种视频显著性模型+一种深度模型+一种美观/质量评分器+记忆性为核心，静态图像显著性仅作为替代。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [DeepGaze IIE (Linardos et al., ICCV 2021)](https://arxiv.org/abs/2105.12441) | 静态每图像预测人体注视密度（自由观看显著性），在域内/域外进行良好校准 | 每帧单通道概率显著性/注视密度图（对数密度，归一化为空间概率分布）；导出标量：显著性熵/色散、峰值显著性、质心、top-k 显著区域计数 | 视频帧 | 帧（每帧独立应用） | 可用 GPU 运行 | 表现良好 | 备选 |
| [TASED-Net (Min & Corso, ICCV 2019)](https://arxiv.org/abs/1908.05786) | 视频时空显著性：给定剪辑的当前帧的预测注视图，捕获运动驱动的注意力 | 每帧单通道显著性图（0-1）；标量：显著性浓度/熵、峰值位置和值、显著区域分数、帧到帧显著性偏移（注意力重新定向的代理） | 视频片段 | 帧（~32 帧的滑动窗口 -> 每帧一个输出图） | 可用 GPU 运行 | 表现良好 | 备选 |
| [ViNet / ViNet-S+ViNet-A ensemble (Jain et al., IROS 2021; updated)](https://arxiv.org/abs/2012.06170) | 视频（和视听）显著性：预测的动态注视图、多个 DHF1K/Hollywood2/AViMoS 风格基准上的当前 SOTA | 每帧单通道显著图； TASED-Net 的标量（浓度/熵、峰值、显著区域分数、时间显著性偏移）。视听变体 (ViNet-A) 集成了配乐 | 视频片段 | 帧（基于剪辑，每帧一张地图） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [UNISAL (Droste et al., ECCV 2020)](https://arxiv.org/abs/2003.05477) | 一种模型统一图像+视频显著性；静态图像和剪辑的预测注视图 | 每帧显著性图（0-1）加上相同的导出标量；在一个网络中处理静态帧和视频 | 视频片段 | 帧（视频）/每幅图像（静止图像） | 可用 GPU 运行 | 表现良好 | 备选 |
| [Depth-Anything-V2 (Yang et al., NeurIPS 2024)](https://arxiv.org/abs/2406.09414) | **简单来说：**估计帧的每个部分（深度图）的远近，每秒总结为平均深度、深度范围、深度复杂性以及帧的特写前景的比例。每个像素的单目（相对，可选公制）深度；基础MDE模型，跨场景稳健 | 每帧密集的每像素深度/逆深度图；标量：平均/中值深度、深度范围、前景分数（近相机像素）、深度熵/分层、深度梯度（空间复杂性）。公制检查点给出米 | 视频帧 | 帧（每帧独立） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [Apple Depth Pro (Bochkovskii et al., 2024)](https://arxiv.org/abs/2410.02073) | 清晰的零样本公制（绝对，以米为单位）单目深度，具有高频边界细节，无需相机内部参数 | 每帧每像素度量深度图（米）；与 Depth-Anything 相同的标量加上真实比例的前景距离和绝对深度范围（以米为单位） | 视频帧 | 逐帧 | 可用 GPU 运行 | 表现良好 | 资源允许时纳入 |
| [Q-Align / OneAlign (Wu et al., ICML 2024)](https://arxiv.org/abs/2312.17090) | 图像（和视频）技术质量 (IQA) 和美学质量 (IAA)，通过 LMM 根据离散文本定义的级别进行评分； SOTA统一记分器 | 每帧标量质量得分和标量美学得分（连续，从评级级别概率得出）； VQA 变体提供每个剪辑的质量 | 视频帧 | 帧（每帧）/每个剪辑（VQA 模式） | 需要高性能 GPU | 同类首选 | 纳入 |
| [LAION-Aesthetics Predictor V2 (improved-aesthetic-predictor)](https://github.com/christophschuhmann/improved-aesthetic-predictor) | 作为单个标量的图像审美吸引力（用于过滤 LAION/稳定扩散训练数据的分数） | 每帧标量美学分数（~1-10）；时间线上的廉价美学代理 | 视频帧 | 逐帧 | CPU 即可 | 可用 | 备选 |
| [CLIP-IQA / QualiCLIP](https://arxiv.org/abs/2207.12396) | 通过 CLIP 文本图像对齐实现无参考技术图像质量（和感知属性），意见不敏感 | 每帧标量质量得分 (0-1)；反义词提示变体也会产生属性分数（锐利/模糊、明亮/黑暗、自然） | 视频帧 | 逐帧 | 可用 GPU 运行 | 可用 | 备选 |
| [ResMem (Needell & Bainbridge, 2022)](https://github.com/Brain-Bridge-Lab/resmem) | 内在图像可记忆性：预测图像被记住的概率 | 每帧标量记忆分数（0-1，LaMem 校准） | 视频帧 | 逐帧 | CPU 即可 | 表现良好 | 纳入 |
| [IQA-PyTorch (toolkit, chaofengc)](https://github.com/chaofengc/IQA-PyTorch) | 不是单一模型：一个统一的库，在一个 API 下公开 40 多个无参考 IQA/IAA 指标（CLIP-IQA、MUSIQ、NIMA、DBCNN、LAION-AES、MANIQA 等） | 无论选择哪个指标，每帧标量质量/美学分数；方便一次发出多个质量标量 | 视频帧 | 逐帧 | 可用 GPU 运行 | 表现良好 | 资源允许时纳入 |

**推荐（同类最佳）：** ViNet（或用于视听的 ViNet-A）用于每帧视频显著图 -> 显著浓度/熵、峰值、显著区域、时间偏移； Depth-Anything-V2 用于每帧相对深度（仅在需要公制/米深度时添加 Apple Depth Pro）-> 平均/范围深度、前景分数、深度复杂性； Q-Align/OneAlign 用于组合每帧美学 + 技术质量标量（子采样至约 1 fps），并使用 IQA-PyTorch (MUSIQ/NIMA/LAION-AES) 作为轻量级后备； ResMem 用于每帧图像记忆标量

**可能多余：**
- MiDaS / DPT / ZoeDepth — 被 Depth-Anything-V2（相对）和 Apple Depth Pro（公制）取代
- TASED-Net 和 UNISAL — 与 ViNet 相同的视频显著性输出；选择一个（ViNet 精度最高，UNISAL 最轻）
- DeepGaze IIE/III（静态固定）——用于被运动感知视频显著性模型取代的视频时间线；仅保留作为纯静态图像注意力代理
- LAION-Aesthetics V2 和 CLIP-IQA/QualiCLIP — 包含在 Q-Align 的 IAA/IQA 分支中（当 7B LMM 太重时仅将它们用作轻量级替代品）
- MemNet / ResMem-Net — 旧的或不太标准化的记忆预测器被维护的、可 pip 安装的 ResMem 取代

<details><summary>参考文献</summary>

- **DeepGaze IIE (Linardos et al., ICCV 2021)** — [arXiv:2105.12441](https://arxiv.org/abs/2105.12441); [github.com/matthias-k/DeepGaze](https://github.com/matthias-k/DeepGaze)
- **TASED-Net (Min & Corso, ICCV 2019)** — [arXiv:1908.05786](https://arxiv.org/abs/1908.05786); [github.com/MichiganCOG/TASED-Net](https://github.com/MichiganCOG/TASED-Net)
- **ViNet / ViNet-S+ViNet-A ensemble (Jain et al., IROS 2021; updated)** — [arXiv:2012.06170](https://arxiv.org/abs/2012.06170); [github.com/samyak0210/ViNet](https://github.com/samyak0210/ViNet); AIM 2024 Video Saliency Challenge (ECCV-W)
- **UNISAL (Droste et al., ECCV 2020)** — [arXiv:2003.05477](https://arxiv.org/abs/2003.05477); [github.com/rdroste/unisal](https://github.com/rdroste/unisal)
- **Depth-Anything-V2 (Yang et al., NeurIPS 2024)** — [arXiv:2406.09414](https://arxiv.org/abs/2406.09414); [github.com/DepthAnything/Depth-Anything-V2](https://github.com/DepthAnything/Depth-Anything-V2)
- **Apple Depth Pro (Bochkovskii et al., 2024)** — [arXiv:2410.02073](https://arxiv.org/abs/2410.02073); [github.com/apple/ml-depth-pro](https://github.com/apple/ml-depth-pro)
- **Q-Align / OneAlign (Wu et al., ICML 2024)** — [arXiv:2312.17090](https://arxiv.org/abs/2312.17090); [github.com/Q-Future/Q-Align](https://github.com/Q-Future/Q-Align); [q-align.github.io](https://q-align.github.io)
- **LAION-Aesthetics Predictor V2 (improved-aesthetic-predictor)** — [github.com/christophschuhmann/improved-aesthetic-predictor](https://github.com/christophschuhmann/improved-aesthetic-predictor); LAION-5B
- **CLIP-IQA / QualiCLIP** — CLIP-IQA [arXiv:2207.12396](https://arxiv.org/abs/2207.12396); QualiCLIP [github.com/miccunifi/QualiCLIP](https://github.com/miccunifi/QualiCLIP); IQA-PyTorch
- **ResMem (Needell & Bainbridge, 2022)** — Needell & Bainbridge 2022; [github.com/Brain-Bridge-Lab/resmem](https://github.com/Brain-Bridge-Lab/resmem); LaMem dataset
- **IQA-PyTorch (toolkit, chaofengc)** — [github.com/chaofengc/IQA-PyTorch](https://github.com/chaofengc/IQA-PyTorch) (pyiqa)

</details>
