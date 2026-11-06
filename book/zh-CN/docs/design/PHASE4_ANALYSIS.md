# 分析方法、工具与图表

MATLAB 工具可加载带标注的语料库并跨刺激分析标注的结构，并提供交互式查看。基于第三阶段 (`annotations/corpus/`) 的固定维度语料库构建。

## 完成

### `readAnnotationCorpus(folder)`
将`folder`下的每个`<id>/<id>.h5`加载到一个分析结构中：
- `C.ids` / `C.ann` — 刺激 ID 和完整标注结构
- `C.channels` — 共享标量通道集（固定维度 → 刺激之间相同）
- `C.X` `[sumT x P]` — 所有刺激的所有时间点堆叠到一个矩形矩阵中
- `C.stim`、`C.time_sec`、`C.nT` — `X` 每行的刺激 ID 和刺激内时间

对部分写入的文件具有鲁棒性（跳过+警告），因此它可以在第 3 阶段批处理仍在填充语料库时运行。 `X` 是相关/PCA/设计工具的直接输入。示例：

```matlab
C = readAnnotationCorpus("annotations/corpus");
R = corr(C.X, 'rows','pairwise');          % cross-feature correlation across the corpus
[coeff,score,~,~,expl] = pca(normalize(C.X)); % principal components of the annotation set
```

### `annotationMovieViewer(movieFile, annPath)`
播放影片，其标注时间序列在下方同步，每个序列上的红色标记跟踪播放位置。播放/暂停+滑动滑块； `"Channels"` 和 `"Speed"` 名称-值选项。例子：

```matlab
m = "data/movies/spacetop/videos/ses-01/ses-01_run-01_order-04_content-parkour.mp4";
annotationMovieViewer(m, "annotations/corpus/ses-01_run-01_order-04_content-parkour")
```

### `analyzeCorpus(C)`
对堆叠语料库矩阵的结构分析 → `analysis/figures/` 中的数字：聚类跨特征**相关热图**、**PCA** 屏幕/累积方差、通道**相关网络**（按特征类别着色的节点，边`|r|≥thresh`）和**特征类别网络**（边=类之间的平均值`|r|`）。返回 `R`、簇 `order`、PCA `coeff/score/explained` 和 `classR`。 PCA 之前的 NaN 感知 z 评分。 NaN 感知。在 83 个刺激模态混合语料库中，12 个 PC 在跨模态共享的 26 个音频与语言通道上达到了 80%；在 77 种刺激的视听子集中，18 个 PC 达到 80%，具有适度的类别耦合——最强影响↔社交（平均值 |r| 0.15），然后是视觉↔社交和音频↔社交（0.11）——在内容上大致稳定。 （所表现出的情感、社交和情境标量来自 VLM 推理过程，现在贯穿整个视听子集；语言类在对话光 AV 剪辑中仍然代表性不足；对于视觉/社交结构，请分析视听子集 — 请参阅 REVIEW_PAPER §5-6。）

### `selectStimulusSet(C)`
实验设计/刺激选择工具。将每个刺激分成固定长度的候选片段， **贪婪地最大化 `log det(cov)`** 连接标注时间序列的（投影到领先的 PC 上）——共同奖励主要特征维度的高方差和特征时间序列的独立性（标注空间上的 D 最优性）。退货 `sel.table` （选定的部分）和 `objTrace` 与随机基线。以缺失/估算数据为主的候选细分被排除在外（它们不能通过空白来赢得目标）。在 83 个刺激语料库上，选择 20 × 10 s 片段达到 `log det(cov)` 12.8 vs 2.5（随机）——远远超过广义方差的 5 倍——从跨模态的 16 种不同刺激中提取。

### `refreshAnalysis(corpusFolder)`
与文档匹配的一命令刷新：完整语料库统计数据 + 设计图、视听子集结构图（综述论文的图 1-5）和类耦合、语音丰富与语音稀疏比较，以及具有完整和 AV 子集数的 `analysis/corpus_stats.json`（缺失的类导出为 NaN，从不为空）。

另请参阅[`../CONTENTS.md`](../CONTENTS.md)（完整指南）和[`../walkthrough.m`](../walkthrough.m)。

### 交互式网络搜索 — `analysis/web/`
基于预先计算的分段索引的静态浏览器应用程序（`tools/build_search_index.py` → `analysis/web/segments.json`；5684 × 5 s 分段，174 个可搜索通道 - 排除类似索引的通道和不适用的骨架填充，并且可解释的矢量通道扩展到每个组件列，因此例如 EmoNet 的 20 个情绪类别和 8 个面部表情可单独搜索）。选择任意特征组合，切换高/低，分段按平均 z 分数排名（当分段缺少某些选定通道时，会显示特征覆盖计数）； **▶ 播放** 寻找该片段的实际剪辑（音频故事作为声音播放；纯文本不播放）。从项目根目录提供服务（`python3 tools/serve.py` → `analysis/web/index.html`；捆绑服务器添加了 HTTP Range 支持，因此视频搜索有效）。排名验证良好——高流量的动作场景、高字率的对话片段、EmoNet“审美”海滩日落片段等。启动+重建笔记：[`../../analysis/web/app_readme.md`](../../analysis/web/app_readme.md)。

### 综述论文
[`../REVIEW_PAPER.md`](../REVIEW_PAPER.md) - 审查草案，涵盖每个标注背后的模型/算法和标注空间的经验结构（冗余，维度：12-18 PC→80％，类网络 - 耦合适度，最强影响↔社交 ≈ 0.15，并且在语音密度上大致稳定 - 和 D 最优设计工具）。群条件图是`analysis/figures/class_coupling_by_group.png`。

## 第四阶段完成
语料库阅读器、同步查看器、相关性/PCA/网络分析、实验设计工具、网络搜索界面和草稿综述论文都已就位。未来的工作（根据论文的第 9 节）：交换生产模型、扩展 VLM 推理过程、添加诱发情感 + 二值化、根据人类评级/大脑数据进行验证。
