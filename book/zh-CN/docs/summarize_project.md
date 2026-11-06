# 可重复使用的提示——“现在总结项目”

当用户说**“现在总结项目”**（或要求提供项目摘要）时，对整个项目及其当前注释状态进行简短的叙述性回顾，并将其与特征表和 1-3 个数字一起写入 **`docs/feature_summary_table.docx`**（Word 格式，用于导入 Google 文档）。

## 观众及基调
专家科学家**不一定**是人工智能/机器学习专家。清楚、公正地传达**做了什么**、注释的**当前状态**，以及重要的是**为什么**重要（科学动机）。准确；不要夸大。叙述≤ **半页**。

## 摘要必须包含的内容（按此顺序，在 .docx 中）
1. **叙述评论**（两个短段落，≤ ½ 页）：
   - *内容和原因：*自然主义神经影像学需要对动态电影/故事刺激进行定量、逐秒的描述；对一流的视觉/听觉/语言模型进行范围审查；选择标准（大量训练数据、**开放权重**可重复性、一流的经过验证的性能）；选定的提取器（可解释的经典机器学习/信号处理特征**和**大型基础/变压器模型，具体示例例如DINOv2、SigLIP2、CLAP、VideoMAE、EmoNet）；六大领域（视觉、听觉、语言、社交、情感、情境）分为低/中/高级别（表 1）。
   - *应用和结构：*从多少个剪辑/故事中提取了多少个特征变量时间序列以及多少秒（1 Hz）；用于 QC 的交互式查看器；域内探索性因子分析及其显示的结果 - 一些模型输出是**不可约**（第一主因子仅解释了百分之几；例如，动作后验、DINOv2、SigLIP2、AudioSet、EmoNet），其他的**高度可约**（第一分量 > 50%；例如，色度、情感）。
2. **表 1** — 类别 × 级别特征汇总表。
3. **图**来自`matlab/figures/`（来自`plotFactorScores`和`plot_tsne_umap_annotations`），放置在**表格后面**，每个图都有一个简短的标题。选择最清晰、最美观地显示注释的注释（默认值：`01_factor_timeseries`、`04_correlation_matrix`、`05_tsne` 和 `08_umap_annotations` — 按域着色的完整 2,768 个变量注释空间，带有图例）。

## 如何生成它（机制）
所有标题数字都是实时提取的，因此随着语料库的增长，散文保持正确：
- `schema/channel_template.json` → 通道和变量计数。
- `analysis/corpus_stats.json` → 刺激计数、模式分割、总分钟数。
- `analysis/factor_reducibility.json` → 每个类别的first-PC %（由 MATLAB 因子分析编写；如果语料库发生变化则重新生成 - 见下文）。

步骤：
1. 如果语料库或因素发生变化，请首先刷新输入：
   - 在 MATLAB 中：`F = readAnnotationCorpusFull("annotations/corpus"); F = extractCategoryFactors(F, "Save","analysis/extracted_factors.mat");`，然​​后`plotFactorScores();`（写入数字，并通过助手写入可归约数）。如果 `analysis/factor_reducibility.json` 已过时，请重新计算每个类别的first-PC % 并重写它。
2. **审查并在需要时重写`tools/build_project_summary.py`中的叙述**，使其对于当前状态来说是准确和公平的（这是判断步骤 - 不要只是盲目地运行脚本；随着项目的发展更新散文、示例和图形选择）。
3. 运行：`python3 tools/build_project_summary.py`→写入`docs/feature_summary_table.docx`。
4. 验证（可选）：转换为 PDF，并目视叙述内容≤ ½ 页，表格适合一页，并且图形 + 标题已呈现。

表本身由 `tools/build_feature_summary.py` 构建（由摘要构建器重用）。
