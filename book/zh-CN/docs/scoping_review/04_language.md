# 语言特征

> **译者注**　词汇惊异度（surprisal）衡量一个词在给定上文后有多出乎语言模型的预期。常写作 −log P(词｜上文)。它描述模型对词的预测，与观众觉得剧情有多意外是两种量。

## 词汇与心理语言学特征

要给每个词添加标注，通常先用 spaCy 分词、标记词性、识别命名实体并分析依存关系，再查询词汇数据库。SUBTLEX 和 wordfreq 提供词频，Brysbaert 提供具体性评分，Kuperman 提供习得年龄（AoA），Warriner 和 NRC-VAD 提供效价、唤醒度与支配感，NRC-EmoLex 和 LIWC 则提供情感类别。这些操作大多可在 CPU 上完成。词汇惊异度和熵需要语言模型：可用 minicons 或 surprisal 等工具，从 GPT-2 或更大的自回归模型中计算。每个词的时间戳来自上游音频与转写文本的强制对齐，例如 WhisperX 或 Montreal Forced Aligner，再据此将逐词测量映射到影片的逐秒时间轴。实践中要权衡三点：词库的授权与合并方式，未收录词及词形还原的处理，以及语言模型大小和预测效果之间的取舍。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [spaCy (3.7+, en_core_web_trf / en_core_web_lg)](https://spacy.io) | **简单来说：**将转录本分割成单词并标记每个单词的词性和语法——每个单词特征附加到的主干（处理流程运行 en_core_web_sm）。分词、词形还原、词性（粗 UPOS + 细 PTB 标签）、形态特征、依存解析、命名实体以及所有下游每个单词查找的锚点 | 每个标记：引理、UPOS 标签（~17 之一）、细粒度 POS 标签、依赖关系+head、is_stop/is_punct 标志、NER 标签（PERSON/ORG/GPE/DATE/等）以及 BILUO 范围；可从 PronType + PERSON 实体派生的人称/代词参考 | 转写文本 | 每个单词（每个标记） | CPU 即可 | 同类首选 | 纳入 |
| [wordfreq (Speer 2022, Python) / SUBTLEX-US norms](https://github.com/rspeer/wordfreq) | **简单来说：**每个单词在日常语言中的常见程度（越罕见的单词越难处理），以对数“Zipf”尺度加上单词长度。词频/词汇熟悉度，阅读时间和神经反应的单一最具预测性的低级词汇变量 | 每个单词：Zipf 频率（十亿分之一 log10，~1-7）、原始频率、可导出的对数频率； SUBTLEX-US 添加了 Lg10WF、上下文多样性 (Lg10CD)、%known | 转写文本 | 逐词 | CPU 即可 | 同类首选 | 纳入 |
| [Brysbaert Concreteness Norms (40,000 words)](https://doi.org/10.3758/s13428-013-0403-5) | **简单来说：**每个词的具体与抽象程度，来自人类评分（“锤子”具体，“正义”抽象）。每个单词所指对象的具体性（并作为可形象性的代表） | 每个单词：具体性平均值（1=抽象到5=具体）、SD、已知百分比；涵盖 37,058 个英语引理 + 2,896 个双词表达 | 转写文本 | 逐词 | CPU 即可 | 同类首选 | 纳入 |
| [Kuperman Age-of-Acquisition Norms (30,000 words)](https://doi.org/10.3758/s13428-012-0210-4) | **简单来说：**学习每个单词的典型年龄——代表它的基础性和易懂程度。通常学习单词的估计年龄（发展/词汇可访问性） | 每个单词：AoA 评级（平均值）、SD、已知百分比； ~30,121 英语单词 | 转写文本 | 逐词 | CPU 即可 | 同类首选 | 纳入 |
| [Warriner VAD Norms (13,915 lemmas) + NRC-VAD lexicon (20,000 words)](https://doi.org/10.3758/s13428-012-0314-x) | **简单来说：**人类评级中每个词的情感感受——愉悦感（效价）、强度（唤醒度）和控制感（支配感）。词义的连续情感维度：价（愉快）、唤醒（强度）、支配（控制） | 每个单词：效价、唤醒度、主导度，每个等级都在 ~1-9 范围内（Warriner，带 SD）或 0-1（NRC-VAD）；取代 1,034 字的小型 ANEW 集 | 转写文本 | 逐词 | CPU 即可 | 同类首选 | 纳入 |
| [NRC Emotion Lexicon (EmoLex, ~14,000 words)](https://doi.org/10.1111/j.1467-8640.2012.00460.x) | 每个单词的离散 (Plutchik) 情感类别成员资格 - 超出 VAD 连续体的分类情感 | 每个单词：8 个二元情感关联（愤怒、期待、厌恶、恐惧、喜悦、悲伤、惊讶、信任）+ 积极/消极情绪标记；可以归纳为每秒的情绪密度信号 | 转写文本 | 逐词 | CPU 即可 | 表现良好 | 纳入 |
| [LIWC-22](https://www.liwc.app) | 基于词典的心理和语言类别成员资格——代词/人称、情感、认知/社会过程词、功能词风格 | 每个单词（并且每个窗口可聚合）：最多 118 个类别的成员资格，包括。第一/第二/第三人称代词、积极/消极情绪、认知过程、社会性、确定性/暂时性；分段级别的汇总分数（分析、影响力、真实性、语气） | 转写文本 | 每个单词（类别命中）/每个片段（摘要分数） | CPU 即可 | 表现良好 | 备选 |
| [minicons (IncrementalLMScorer) — GPT-2 / Pythia / GPT-Neo surprisal](https://arxiv.org/abs/2203.13112) | **简单来说：** 每个单词前面的单词（用 GPT-2 计算）有多么令人惊讶，加上模型对下一个单词的不确定性有多大——这两者都是理解努力和大脑反应的有力预测因素。单词汇惊异度和熵：每个单词在其左侧上下文中的意外程度，阅读时间和 N400/神经反应的核心信息论预测因子 | 每个标记：surprisal = -log2 P(word \| left context) in bits;下一个词的熵；每个单词的对数概率；将子词片段聚合为整个词的惊喜 | 转写文本 | 逐词 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [surprisal (aalok-sathe, Python)](https://github.com/aalok-sathe/surprisal) | 与迷你图标相同——单词/令牌惊喜——通过跨神经、n-gram (KenLM) 和黑盒 API 模型的统一接口 | 每个标记/单词：令人惊讶的位、对数概率；方便的 .word_level 聚合和内置绘图；可以针对 OpenAI/Petals/HF 后端 | 转写文本 | 逐词 | 可用 GPU 运行 | 表现良好 | 备选 |
| [GLiNER (urchade/gliner, 2024)](https://arxiv.org/abs/2311.08526) | 当您需要 spaCy 固定本体之外的实体类型（例如角色名称、虚构地点、叙述中的自定义指示对象）时，零样本/开放式命名实体识别 | 每个跨度：实体标签（用户定义类型）+置信度得分；映射到每个单词的实体标志（is_named_entity、entity_type、person-reference） | 转写文本 | 每个单词（跨度派生） | 可用 GPU 运行 | 表现良好 | 资源允许时纳入 |
| [NLTK](https://nltk.org) | 词性标记、词性标记、词干提取、基本词汇实用程序（遗留） | 每个标记：Penn-Treebank POS 标签、词干/引理 (WordNet)、基本块标签 | 转写文本 | 逐词 | CPU 即可 | 已有替代方案 | 舍弃 |

**推荐（同类最佳）：** spaCy (en_core_web_trf/lg) 作为分词器/POS/NER/依赖主干； wordfreq + SUBTLEX-US 表示频率； Brysbaert 具体性 + Kuperman AoA + Warriner/NRC-VAD 规范连接用于心理语言学每个单词的特征； NRC EmoLex 用于离散情感通道；带有 GPT-2-medium/Pythia 的迷你图标（或惊喜），用于词汇惊异度和熵

**可能多余：**
- NLTK — 被 spaCy 取代，用于标记化/POS/NER（仅保留用于 WordNet 同义词集访问）
- 惊喜包——与迷你图标直接重叠；选择一个令人惊喜的图书馆
- ANEW（1,034 字）— 被 Warriner VAD（13,915）和 NRC-VAD（20,000）取代
- MRC 心理语言学数据库 — 遗留的形象性/具体性，被 Brysbaert 和格拉斯哥规范取代
- LIWC-22 影响类别 — 大多数每个单词的影响内容都可以使用免费的 NRC EmoLex + Warriner VAD + spaCy POS 重现； LIWC 的合理性主要在于其经过验证的代词/人称指称和功能词类别方案
- 格拉斯哥规范 — 在相同维度上以较小的覆盖范围重叠 Brysbaert/Kuperman/Warriner；仅作为单源合并或其形象性/熟悉度/语义大小/性别尺度有用
- VADER — 句子/社交媒体调整的情绪，与 Warriner+NRC 对于每个单词的效价是多余的

**开放问题：**
- 时间对齐是上游：每个字的特征仅与强制对齐（WhisperX/Montreal Forced Aligner）一样好，强制对齐为每个令牌分配开始/结束时间戳 - 在分箱到每秒之前确认处理流程使用哪个对齐器。
- 词形还原与表面形式查找：范数数据库关键在于引理/基本形式，而惊喜和频率可以是表面形式；需要一致的 OOV 和形态策略（例如回退引理 -> 表面 -> 子词）。
- 是否将 Warriner 和 NRC-VAD 合并（以及以什么优先级）来确定效价/唤醒/支配性，而不是选择一个来避免重复计算相关特征。
- 令人惊讶的 LM 的选择：较小的 GPT-2/Pythia 模型通常比最大的 LLM 更适合人类阅读时间/神经数据 - 决定目标是最佳心理语言学拟合（小模型）还是最佳原始语言建模（大模型）。
- 对专有名词和口语叙述记录中的不流畅进行覆盖/OOV 处理，这在电影/音频故事中很常见，但在规范数据库中不存在。
- LLM 生成的规范估计（2024-2026 年工作）可以填补具体性/效价/AoA 的 OOV 差距，但需要在使用前根据人类表格进行验证/微调。

<details><summary>参考文献</summary>

- **spaCy (3.7+, en_core_web_trf / en_core_web_lg)** — [spacy.io](https://spacy.io); [github.com/explosion/spaCy](https://github.com/explosion/spaCy)
- **wordfreq (Speer 2022, Python) / SUBTLEX-US norms** — [github.com/rspeer/wordfreq](https://github.com/rspeer/wordfreq); Brysbaert & New 2009 SUBTLEX-US
- **Brysbaert Concreteness Norms (40,000 words)** — Brysbaert, Warriner & Kuperman 2014, Behavior Research Methods
- **Kuperman Age-of-Acquisition Norms (30,000 words)** — Kuperman, Stadthagen-Gonzalez & Brysbaert 2012, Behavior Research Methods
- **Warriner VAD Norms (13,915 lemmas) + NRC-VAD lexicon (20,000 words)** — Warriner, Kuperman & Brysbaert 2013; Mohammad 2018 NRC-VAD
- **NRC Emotion Lexicon (EmoLex, ~14,000 words)** — Mohammad & Turney 2013, NRC EmoLex
- **LIWC-22** — Boyd, Ashokkumar, Seraj & Pennebaker 2022, LIWC-22
- **minicons (IncrementalLMScorer) — GPT-2 / Pythia / GPT-Neo surprisal** — Misra 2022 ([arXiv:2203.13112](https://arxiv.org/abs/2203.13112)); [github.com/kanishkamisra/minicons](https://github.com/kanishkamisra/minicons)
- **surprisal (aalok-sathe, Python)** — [github.com/aalok-sathe/surprisal](https://github.com/aalok-sathe/surprisal)
- **GLiNER (urchade/gliner, 2024)** — Zaratiana et al. 2024 ([arXiv:2311.08526](https://arxiv.org/abs/2311.08526)); [github.com/urchade/GLiNER](https://github.com/urchade/GLiNER)
- **NLTK** — [nltk.org](https://nltk.org)

</details>

## 句法和语法结构

电影/音频叙事的句子/话语级句法标注依赖于成熟的堆栈：一些 NLP 处理流程（spaCy、Stanza、Trankit）发出依存解析、POS/形态（作为 UD 功能的时态/方面/情绪）以及每个标记的引理；专用选区解析器（benepar、supar、Stanza/CoreNLP conparse）生成短语结构树，从中导出复杂性度量（树深度、Yngve/Frazier 分数、L2SCA 子句/T 单元比率）；共指（Maverick、fastcoref、Stanza-coref）跨时间线链接提及；轻量级库（textstat、可读性）加上 DA 分类器处理可读性和对话行为。所有核心工具都是开源的并且可在CPU上运行； Transformer 变体需要适度的 GPU。主要工作流程是：解析与电影/音频时间轴时间对齐的转录话语（通过其他地方的强制对齐），然后计算每个话语/每秒的语法特征。大多数复杂性、可读性和 Yngve/Frazier 指标都是从解析器输出事后得出的，而不是单独的模型。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [spaCy 3.8 (en_core_web_trf / en_core_web_lg)](https://spacy.io) | **简单来说：**通过解析来衡量句子语法和复杂性——实词、名词和动词的份额，句子结构嵌套的深度，以及语法上链接的单词的距离。完整的标记级句法处理流程：依存分析、词性/标签、词法、引理、句子分段、名词块 | 每个标记：依存标签（UD / CLEAR），头索引，UPOS +精细POS标签，形态特征（时态，体，语气，数字，人称，动词形式），引理；每个跨度：名词块；句子边界。 OntoNotes 上的 trf 模型 LAS ~87.9，UAS ~89.6（CLEAR 方案）。 | 转写文本 | 每个话语（解析句子；标记映射到时间线） | CPU 即可 | 同类首选 | 纳入 |
| [Stanza 1.10 (Stanford NLP, UD pipeline)](https://stanfordnlp.github.io/stanza) | 神经UD处理流程：分词、MWT、POS/UPOS+XPOS、引理、形态特征、双仿射依赖解析；加上可选的选区解析器和神经共指 | Per-token：UD依赖关系+头、UPOS/XPOS、UFeats（时态/体/语气/语音/动词形式/人称/数字等）、引理；选区树（PTB 式）； coref 集群。真正的通用依赖关系标签（跨工具复杂性指标比 spaCy 的 CLEAR 更清晰）。 | 转写文本 | 逐话语 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [benepar (Berkeley Neural Parser, self-attentive-parser)](https://github.com/nikitakit/self-attentive-parser) | 使用自注意力编码器进行选区（短语结构）解析；树深度、Yngve、Frazier 和基于子句的复杂性度量的基础 | 每句 PTB 式选区树（NP/VP/S/SBAR 标签、嵌套深度）可集成为 spaCy 组件；修订版《华尔街日报》上的 ~95.4-96.3 F1。从树中您可以得出：最大/平均树深度、# 子句、# SBAR、短语类型计数、Yngve/Frazier 分数。 | 转写文本 | 逐话语 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [supar (yzhangcs/parser)](https://github.com/yzhangcs/parser) | 最先进的 biaffine/CRF 依赖和选区解析（以及语义依赖）；具有明确评分算法的研究级树 | 每个令牌依赖弧+标签（Biaffine、CRF、CRF2o）；每句选区 CRF 树；语义依赖图。暴露MST/Eisner/CKY/TreeCRF；当您需要标记树概率/边际来进行复杂性加权时很有用。 | 转写文本 | 逐话语 | 可用 GPU 运行 | 表现良好 | 备选 |
| [Trankit 1.x](https://github.com/nlp-uoregon/trankit) | 轻型多语言转换器（XLM-R + 适配器）UD 处理流程：标记化、句子段、POS、词法、引理、依存解析 | 每个token UD依赖关系+头，UPOS/XPOS，形态UFeats，引理；句子边界。在 UD v2.5 上的 Stanza 上以多种语言报告了 +5 LAS / +4 sent-seg；最强的句子分割，这对于话语对齐很重要。 | 转写文本 | 逐话语 | 可用 GPU 运行 | 表现良好 | 备选 |
| [Maverick (coreference resolution)](https://arxiv.org/abs/2407.21489) | 共指解析：将提及（代词、名称、NP）链接到整个叙述中的实体集群，以便在时间轴上跟踪所指对象 | 提及按簇 ID 分组为共指簇的跨度；解析每个代词所指的人/物。 CoNLL-2012 (OntoNotes) 上的 SOTA 具有约 500M 参数、比 13B 生成 coref 模型快约 170 倍的推理速度和少得多的内存。 | 转写文本 | 每个话语（集群跨越文档/场景） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [fastcoref / F-coref (LingMess)](https://arxiv.org/abs/2209.04280) | 快速、简单的英语共指解析； LingMess（准确）和 F-coref（快速）模式 | 每个文档的提及跨度的共指簇。 LingMess 接近 SOTA 精度； F-coref 在 V100 上处理 2.8K OntoNotes 文档大约需要 25 秒（旧系统需要 6-12 分钟），准确性略有下降。 | 转写文本 | 每个话语（文档级集群） | 可用 GPU 运行 | 表现良好 | 备选 |
| [L2 Syntactic Complexity Analyzer (L2SCA) + Tregex](https://personal.psu.edu/xxl13) | 从选区解析得出的句法复杂性指数：子句、T 单元、协调和短语复杂性 | 每个文本 14 个索引，包括子句/T 单元/句子的平均长度、每个 T 单元的子句、每个子句的从属子句、每个子句的复杂名词、每个 T 单元的并列短语、每个句子的 T 单元。用于句法复杂性评分的经过验证的标准集。 | 转写文本 | 每个话语/每个窗口（跨范围聚合） | CPU 即可 | 表现良好 | 纳入 |
| [textstat (Python)](https://github.com/textstat/textstat) | 可读性和表面复杂性指数作为语法/处理难度的粗略代理 | 每个文本标量：Flesch Reading Ease、Flesch-Kincaid Grade、Gunning Fog、SMOG、Coleman-Liau、ARI、Dale-Chall，以及音节/单词/句子计数和词典计数。在滑动转录窗口上计算时每秒成本低廉的功能。 | 转写文本 | 每个窗口/每个话语 | CPU 即可 | 可用 | 资源允许时纳入 |
| [Dialogue act classifier (DialogTag / DistilBERT-SwDA / silicone-finetuned)](https://github.com/bhavitvyas/DialogTag) | 每个话语的对话行为/言语行为（对话中的功能），与对话较多的电影/音频相关 | 每个话语的分类 DA 标签（SwDA 42 标签或 DAMSL 集：陈述、是非问题、wh 问题、反向渠道、协议、意见等）以及类别概率。直接映射到时间对齐的对话回合。 | 转写文本 | 逐话语 | CPU 即可 | 可用 | 资源允许时纳入 |

**推荐（同类最佳）：** spaCy 3.8 (en_core_web_trf) 用于依赖性/POS/形态； Stanza 1.10 用于 UD 方案解析 + 内置选区 + coref 在一个工具中；有利于选区树提供复杂性指标； Maverick 用于共指解析； L2SCA（+ 来自树的 Yngve/Frazier）作为派生句法复杂性层

**可能多余：**
- Trankit — 英语被 spaCy/Stanza 取代；仅保留多语言或高级句子切分需求
- supar — 与 benepar/Stanza 重叠；仅当您需要联合 dep+选区或 CRF 边际时使用
- fastcoref/F-coref — 在准确性+效率方面被 Maverick 取代；保留高吞吐量批处理 coref
- textstat — 与 py-readability-metrics 重叠；仅限表面，与 L2SCA 更深层次的语法复杂性无关
- 斯坦福 CoreNLP 选区/coref — 很大程度上被 Stanza 的神经处理流程和 Maverick 取代

<details><summary>参考文献</summary>

- **spaCy 3.8 (en_core_web_trf / en_core_web_lg)** — [spacy.io](https://spacy.io); [github.com/explosion/spaCy](https://github.com/explosion/spaCy); en_core_web_trf
- **Stanza 1.10 (Stanford NLP, UD pipeline)** — [stanfordnlp.github.io/stanza](https://stanfordnlp.github.io/stanza); Qi et al. 2020
- **benepar (Berkeley Neural Parser, self-attentive-parser)** — [github.com/nikitakit/self-attentive-parser](https://github.com/nikitakit/self-attentive-parser); Kitaev & Klein 2018/2019
- **supar (yzhangcs/parser)** — [github.com/yzhangcs/parser](https://github.com/yzhangcs/parser); Zhang et al. ACL/IJCAI 2020
- **Trankit 1.x** — [github.com/nlp-uoregon/trankit](https://github.com/nlp-uoregon/trankit); Nguyen et al. EACL 2021
- **Maverick (coreference resolution)** — [github.com/SapienzaNLP/maverick-coref](https://github.com/SapienzaNLP/maverick-coref); Martinelli et al. ACL 2024; [arXiv:2407.21489](https://arxiv.org/abs/2407.21489)
- **fastcoref / F-coref (LingMess)** — [github.com/shon-otmazgin/fastcoref](https://github.com/shon-otmazgin/fastcoref); Otmazgin et al. AACL 2022; [arXiv:2209.04280](https://arxiv.org/abs/2209.04280)
- **L2 Syntactic Complexity Analyzer (L2SCA) + Tregex** — Lu 2010; [personal.psu.edu/xxl13](https://personal.psu.edu/xxl13) (L2SCA); [en.wikipedia.org/wiki/L2_Syntactic_Complexity_Analyzer](https://en.wikipedia.org/wiki/L2_Syntactic_Complexity_Analyzer)
- **textstat (Python)** — [github.com/textstat/textstat](https://github.com/textstat/textstat)
- **Dialogue act classifier (DialogTag / DistilBERT-SwDA / silicone-finetuned)** — [github.com/bhavitvyas/DialogTag](https://github.com/bhavitvyas/DialogTag); SwDA/SILICONE benchmark; Raheja & Tetreault N19-1373

</details>

## 高层语义、话语和叙述

该子类涵盖句子/段落/场景级别的含义：密集的语义嵌入、主题结构、随时间变化的语义连贯性/相似性、话语关系和叙事结构（弧线、转折点、摘要、LLM 衍生标签）。对于电影/音频故事时间线，实际的处理流程是：对齐转录本（与 ASR 中的单词/话语时间戳），将其窗口化为滚动片段（例如，每个句子、每个话语或滑动 N 秒窗口），然后发出每个片段的特征。 2024-2026 年最主要、最灵活的特征源是来自指令调整编码器的密集段落嵌入（Qwen3-Embedding、E5/multilingual-e5、GTE、BGE，以及 OpenAI/Voyage/Gemini 等 API 选项），从中可以得出连贯性（相邻窗口之间的余弦相似性）、漂移和主题集群。 BERTopic 提供随时间变化的可解释主题。用作零/少样本特征提取器的指令调整 LLM（Llama-3、Qwen2.5、GPT-4o-class）现在涵盖了更难、更抽象的信号——转折点、话语关系、事件/场景分割、叙述标签和结构化摘要——没有专门的监督模型可以稳健地做到这一点。注意：在这个神经成像上下文中，自回归 LLM（GPT-2 到 Llama-3）的 LAST-token/last-layer 隐藏状态本身就是主要的每单词/每 TR 特征，也是自然语言理解编码模型的当前标准。

| 工具 | 测量内容 | 各时间点的输出 | 输入模态 | 时间粒度 | 本地运行条件 | 工具评价 | 选用建议 |
|------|----------|----------------------|----------|-------------|-------|--------|-----|
| [Qwen3-Embedding (0.6B / 4B / 8B)](https://github.com/QwenLM/Qwen3-Embedding) | **在此处理流程中（已部署）：** Qwen3-Embedding-0.6B 生成 `language/embedding/qwen3` 通道（每个话语 1024-d，跨度填充至 1 Hz）；相邻窗口余弦给出语义连贯性/漂移/新颖性/惊喜标量。句子/段落的指令调整密集语义嵌入；支持在文本前面添加特定于任务的指令。截至 2025 年中期，MTEB 多语言上的最佳开放权重模型 (8B = 70.58)。 | 每窗口 L2 归一化嵌入向量（0.6B 为 1024 维，8B 高达 4096 维；Matryoshka 可截断）。导出的每个时间点信号：与相邻窗口的余弦相似度（局部一致性）、与运行平均值的余弦（语义漂移/新颖性）、与主题/场景质心的距离、与固定语义探针的每个窗口相似度（例如“恐惧”、“社交互动”）。 | 转写文本 | 每个话语/每个句子/每个滑动窗口（通过转录文本的分段方式设置） | 可用 GPU 运行 | 同类首选 | 纳入 |
| [multilingual-e5-large-instruct / e5-mistral-7b-instruct](https://arxiv.org/abs/2212.03533) | 通用指令调整的段落嵌入；强大的、广泛使用的、有据可查的基线。 e5-mistral 是一个 7B 解码器即嵌入器； multilingual-e5-large 是一款紧凑型 560M 编码器。 | 每个窗口嵌入（multilingual-e5-large 为 1024-dim；e5-mistral 为 4096-dim）。与 Qwen3 导出的信号相同（相邻窗口余弦相干性、漂移、探针相似性、簇分配）。 | 转写文本 | 每个话语/每个句子/每个滑动窗口 | 可用 GPU 运行 | 表现良好 | 备选 |
| [GTE (gte-Qwen2-7B-instruct / gte-large-en-v1.5) and BGE (bge-m3, bge-large-en-v1.5)](https://huggingface.co/Alibaba-NLP/gte-Qwen2-7B-instruct) | 另外两个顶级开放嵌入系列。 gte-Qwen2-7B-instruct是一款高MTEB指令嵌入器； bge-m3 因多功能（密集 + 稀疏 + ColBERT 多向量）和 8k 上下文而闻名，可用于嵌入较长的段落/场景。 | 每个窗口密集嵌入（1024-dim bge-large/gte-large；7B 变体高达 3584/4096）。 bge-m3 另外还产生稀疏词汇权重和标记级多向量。推导：连贯性、漂移、词汇重叠与语义分歧。 | 转写文本 | 每个话语/每个句子/每个滑动窗口/每个场景 | 可用 GPU 运行 | 表现良好 | 备选 |
| [OpenAI text-embedding-3-large / Voyage-3 / Gemini Embedding (API)](https://platform.openai.com/docs/guides/embeddings) | 商业管理嵌入。方便，无需本地GPU； Gemini Embedding 和 Voyage-3 目前在多个排行榜上名列前茅。 text-embedding-3-large 被广泛使用，但自 2024 年 1 月以来没有更新，现在被开放模型匹配/击败。 | 每个窗口嵌入（3072-dim openai-3-large，维度可缩减；1024/2048 Voyage；~3072 Gemini）。相同导出的相干/漂移/探测信号。 | 转写文本 | 每个话语/每个句子/每个滑动窗口 | 仅限 API | 可用 | 备选 |
| [BERTopic (with dynamic / topics-over-time)](https://arxiv.org/abs/2203.05794) | 神经主题建模：集群嵌入（UMAP+HDBSCAN）和基于类的 TF-IDF 标签集群； topic_over_time 重新计算每个时间仓的主题表示，无需重新调整，从而给出可解释的主题时间线。 | 每个窗口：硬主题分配（主题 id）和软主题概率分布； per-time-bin：主题流行度/频率系列以及每个主题随时间变化的热门关键词。生成一个分类主题标签以及每个时间点的连续主题激活向量。 | 转写文本 | 每个窗口（作业）+每个时间段（患病率系列） | CPU 即可 | 同类首选 | 纳入 |
| 语义一致性/随时间的漂移（滑动窗口余弦处理流程） | 派生分析层（不是模型）：从任何句子嵌入流，计算时间线上的局部语义连贯性、主题漂移、新颖性和重现性。反映了心理语言学/临床 NLP 中使用的经典潜在语义一致性测量，并通过 Transformer 嵌入进行了现代化。 | 每个时间点标量：cosine(window_t, window_{t-1}) = 局部一致性；余弦（window_t，运行平均值）=漂移/积分； 1-与过去的最大相似度=新颖性；滞后窗口内的平均相似度 = 滞后一致性；事件/场景剪切的分割边界得分（相似性槽）。 | 转写文本 | 每个窗口/每秒（重新采样到刺激时间线后） | CPU 即可 | 同类首选 | 纳入 |
| [Autoregressive LLM hidden-state extractor (GPT-2, Llama-3-8B, Qwen2.5-7B) for encoding models](https://www.biorxiv.org/content/10.1101/2021.04.20.440622) | **在此处理流程中（已部署）：** Llama-3.1-8B 中间层隐藏状态 (4096-d) 形成 `language/embedding/llama_ar` 通道，令牌时间扩展至 1 Hz — 标准 fMRI/MEG 语言编码回归量； GPT-2 还提供词汇惊异度/熵。当刺激被逐字读取时，来自因果 LM 的上下文化的每个单词/每个标记表示。在神经影像学中，这是自然语言理解的标准高层语义特征。层激活预测理解和大脑反应。 | 所选层的每个令牌隐藏状态向量（例如 768-dim GPT-2、4096-dim Llama-3-8B）；下一个词的意外/熵 (-log p)；每个令牌上下文嵌入。聚合到每个单词，然后在刺激时间线的每个 TR/秒内进行平均。 | 转写文本 | 每个字（时间戳对齐）然后每秒/每个 TR 重新采样 | 可用 GPU 运行 | 同类首选 | 纳入 |
| [Instruction-tuned LLM as zero/few-shot feature extractor (Llama-3.1-8B-Instruct / Qwen2.5-7B-Instruct local; GPT-4o / Claude API)](https://arxiv.org/abs/2405.16714) | **在此处理流程中（已部署）：** Llama-3.1-8B-Instruct 根据前面的上下文 (`language/hl/narrative_expectedness` / `narrative_surprise`) 对每行的 **叙事预期** 进行评级 - 一个高级叙事惊喜信号。在转录窗口上提示经过指令调整的大语言模型，发出结构化的高层语义/叙事标签，而没有专门的监督模型可以稳健地涵盖这些标签：场景/主题标签、叙事阶段分类、转折点可能性、相邻片段之间的话语关系、人物/事件提及、抽象性和结构化摘要。 | 每窗口结构化标签（JSON）：分类叙事阶段（设置/冲突/高潮/解决），转折点标记+类型，话语关系标签（原因/对比/阐述），价/张力李克特评分，主题/主题标签，实体/事件列表，一行摘要。另外，“可解释的嵌入”= 对固定问题组是/否答案的向量（Benara/Gao 2024）。 | 转写文本 | 每个窗口/每个场景/每个话语 | 可用 GPU 运行 | 表现良好 | 纳入 |
| [DMRST / neural RST discourse parser](https://arxiv.org/abs/2110.04518) | 有监督的修辞结构理论解析：将文本分割成基本篇章单元（EDU）并在段落中构建带标签的篇章树（核心+关系标签）。向大语言模型询问话语关系的结构化、基于理论的替代方案。 | 每通道：EDU 分段边界；带有关系标签（阐述、对比、原因、背景、~18-30 关系类）和核（核/卫星）的话语树边缘。每个时间点可导出：话语边界指标、局部树深度、每个边界的关系类型。 | 转写文本 | 每个 EDU/每个句子（在通道窗口内） | 可用 GPU 运行 | 可用 | 资源允许时纳入 |
| [Supervised narrative turning-point / story-arc model (TRIPOD / Papalampidi-style; sentiment-arc tooling)](https://arxiv.org/abs/2511.11857) | 识别剧本/故事转折点（机会、计划改变、不归点、重大挫折、高潮）和/或计算整个叙述中的情感/情绪弧（里根的“六个故事形状”）。 | 每个场景/每个片段：5种TP类型中每一种的转折点概率；标准化的故事位置；连续情感/情感弧值（平滑价轨迹）；弧形类。产生每个时间点的张力/弧标量以及稀疏的转折点标记。 | 转写文本 | 每个场景/每个片段（平滑为连续弧） | 可用 GPU 运行 | 可用 | 备选 |

**推荐（同类最佳）：** Qwen3-Embedding-0.6B（实验室默认开放编码器；如果 GPU 允许，可缩放至 4B/8B）作为所有语义特征的骨干；这些嵌入之上的滑动窗口余弦相干/漂移处理流程，以产生每秒时间分辨的标量； BERTopic 具有主题随时间变化的可解释主题时间线（重用相同的嵌入）；自回归LLM隐藏状态+惊喜提取器（GPT-2 / Llama-3.1-8B），用于词级/每TR理解特征（神经影像标准）；指令调整的 LLM（Llama-3.1-8B-Instruct / Qwen2.5-7B-Instruct local，或 GPT-4o/Claude API）作为叙事阶段、转折点、话语关系和结构化标签的零/少样本提取器

**可能多余：**
- multilingual-e5、GTE、BGE — 选择一个主要开放编码器；其他是 Qwen3-Embedding 的可互换替代品，而不是单独的功能
- OpenAI/Voyage/Gemini 嵌入 API — 已被开放编码器 (Qwen3/E5) 取代以满足大多数需求；仅当需要嵌入排行榜顶级 API 并且可接受场外成绩单传输时才使用
- 有监督的 RST 解析器 (DMRST) 和有监督的转折点模型 - 很大程度上包含在指令调整的 LLM 提取器中，该提取器在口语成绩单上更加灵活；仅当特别需要标准化、可复制的话语标签时才保留受监督的话语标签
- 独立的原始嵌入聚类 - 被 BERTopic 取代，它将聚类与标签和动态主题一起包装起来

<details><summary>参考文献</summary>

- **Qwen3-Embedding (0.6B / 4B / 8B)** — [github.com/QwenLM/Qwen3-Embedding](https://github.com/QwenLM/Qwen3-Embedding); [huggingface.co/Qwen/Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B); MTEB/MMTEB
- **multilingual-e5-large-instruct / e5-mistral-7b-instruct** — [huggingface.co/intfloat/multilingual-e5-large-instruct](https://huggingface.co/intfloat/multilingual-e5-large-instruct); [arXiv:2212.03533](https://arxiv.org/abs/2212.03533), [2401.00368](https://arxiv.org/abs/2401.00368)
- **GTE (gte-Qwen2-7B-instruct / gte-large-en-v1.5) and BGE (bge-m3, bge-large-en-v1.5)** — [huggingface.co/Alibaba-NLP/gte-Qwen2-7B-instruct](https://huggingface.co/Alibaba-NLP/gte-Qwen2-7B-instruct); [huggingface.co/BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3)
- **OpenAI text-embedding-3-large / Voyage-3 / Gemini Embedding (API)** — [platform.openai.com/docs/guides/embeddings](https://platform.openai.com/docs/guides/embeddings); [docs.voyageai.com](https://docs.voyageai.com); [ai.google.dev](https://ai.google.dev) embeddings
- **BERTopic (with dynamic / topics-over-time)** — [github.com/MaartenGr/BERTopic](https://github.com/MaartenGr/BERTopic); [arXiv:2203.05794](https://arxiv.org/abs/2203.05794); [maartengr.github.io/BERTopic/getting_started/topicsovertime](https://maartengr.github.io/BERTopic/getting_started/topicsovertime)
- **Semantic coherence / drift over time (sliding-window cosine pipeline)** — Standard sliding-window cosine; cf. coherence/tangentiality NLP literature; TextTiling for segmentation
- **Autoregressive LLM hidden-state extractor (GPT-2, Llama-3-8B, Qwen2.5-7B) for encoding models** — Caucheteux & King 2022; Goldstein et al. 2022; 'Narratives' fMRI dataset (Nastase et al.); [biorxiv 2021.04.20.440622](https://www.biorxiv.org/content/10.1101/2021.04.20.440622)
- **Instruction-tuned LLM as zero/few-shot feature extractor (Llama-3.1-8B-Instruct / Qwen2.5-7B-Instruct local; GPT-4o / Claude API)** — Benara/Gao 'QA-Emb / Crafting Interpretable Embeddings by Asking LLMs Questions' [arXiv:2405.16714](https://arxiv.org/abs/2405.16714); Papalampidi turning-point work; Story Ribbons [arXiv:2508.06772](https://arxiv.org/abs/2508.06772)
- **DMRST / neural RST discourse parser** — Liu et al. DMRST ([arXiv:2110.04518](https://arxiv.org/abs/2110.04518) / [2012.01704](https://arxiv.org/abs/2012.01704)); eRST (Computational Linguistics 2025); GUM/RST-DT corpora
- **Supervised narrative turning-point / story-arc model (TRIPOD / Papalampidi-style; sentiment-arc tooling)** — Papalampidi et al. TRIPOD 'Movie Plot Analysis via Turning Points'; Reagan et al. 'emotional arcs of stories'; [arXiv:2511.11857](https://arxiv.org/abs/2511.11857); culturalanalytics.org Beyond Plot

</details>
