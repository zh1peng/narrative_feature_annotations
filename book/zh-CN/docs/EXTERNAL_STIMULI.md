# 外部刺激材料（HCP 与 CamCAN）

三个广泛使用的自然功能磁共振成像刺激集丰富了这个语料库，并能够与大量已发表的大脑数据进行比较。 **Narratives**有声故事集已公开可用，并且**已经下载并集成**； **HCP 7T 电影** 剪辑和 **CamCAN** Hitchcock 剪辑需要数据访问请求。此页面提供了每个的出处/许可以及如何（重新）获取和集成它们。

| 刺激 | 它是什么 | 可以公开下载吗？ | 通道 | 状态 |
|----------|-----------|----------------------|---------|--------|
| Narratives | 29 个有声故事音频片段（约 5.3 小时） | ✅ 数据集 CC0；为非商业研究共享的刺激（合理使用） | OpenNeuro ds002345 | **集成** |
| HCP 7T 电影 | 4 个串联的 `.mp4`s CC Vimeo 剪辑 + 好莱坞摘录 | ❌（免费帐户+数据使用条款；好莱坞部分受版权保护） | 连接数据库 | 要求 |
| CamCAN 电影 | 希区柯克的《*爆炸》的 8 分钟剪辑你死了* | ❌（申请+协议；版权所有） | Cam-CAN数据访问 | 要求 |

---

## 1. Narratives有声故事刺激（已获得）

**它是什么。** 29 个自然主义 **有声故事音频** 剪辑（约 3–56 分钟，约 5.3 小时），来自“Narratives”fMRI 数据集（Nastase 等人，2021 年）、OpenNeuro **ds002345** — 自然故事（《馅饼人》、《隧道》、《贫民窟领主》、《银河系》、《夏洛克》、《梅林传奇》……），几个加扰/释义的控制变体，以及一些简短的电视/电影音频片段。此处集成为`data/stories/narratives/`下的**纯音频**刺激（ASR 转录它们；音频与语言/影响/事件通道运行；视觉通道为 `NaN`）。

**如何获取（可重现）。** 从 OpenNeuro 的公共 S3 存储桶下载：
```bash
base="https://s3.amazonaws.com/openneuro.org/ds002345/stimuli"
for s in pieman tunnel slumlordreach ... ; do curl -fsSL -o "data/stories/narratives/${s}_audio.wav" "$base/${s}_audio.wav"; done
```
（完整的文件列表位于 S3 的 `ds002345/stimuli/` 下；如果您想要真实的转录本而不是 ASR，则单词/音素转录本和温和对齐也位于 ds002345 中。）

**许可/条款。**数据集是**CC0**，但音频片段**不是公共领域**——它们是在“合理使用”下**用于非营利、非商业学术研究**（有些是受版权保护的电视/电影音频）；不要重新分发。归属+详细信息：`data/stories/narratives/SOURCES.md`。权利持有者可以通过数据集的联系人请求删除。

**状态。** 已下载并在清单中编目；标注通过标准音频配置（`--audio-hl --events --template`）运行。

---

## 2. HCP 7T 观影刺激

**它是什么。** 四部电影运行 (`MOVIE1–MOVIE4`)，每个运行 `~12–14 min` `.mp4` 连接来自两个来源的短（1–4.3 分钟）剪辑：
- **Creative-Commons Vimeo** 独立电影（文件名标记为 `CC`） — 真正开放，
- **好莱坞**电影摘录（由 *Cutting 等人* 出版的集） — **受版权保护**，
加上运行期间显示的重复 Vimeo“验证”剪辑。元数据文件 `HCP_7T_Movie_Info.csv`（剪辑起点）和 `HCP_7T_Movie_Clip_Timing.csv`（每个剪辑和 REST 块的开始/停止）伴随刺激。

**如何获取（官方）。**
1. 在 **ConnectomeDB** 注册免费帐户 - <https://db.humanconnectome.org>。
2. 接受 **HCP 开放访问数据使用条款**。
3. 打开 **WU-Minn HCP 1200 科目 (S1200)** 项目页面并找到 **“7T 电影资源”** — 下载 **7T 电影刺激 zip** 以及 `HCP_7T_Movie_Info.csv` 和 `HCP_7T_Movie_Clip_Timing.csv`。直接项目链接：<https://db.humanconnectome.org/data/projects/HCP_1200>。
4. **开放子集（可选）：** 如果您只需要自由许可的部分，则以 `CC` 命名的剪辑是 CC Vimeo 影片； `HCP_7T_Movie_Info.csv` 列出每个剪辑的来源，因此可以单独获取这些剪辑。 （这*不会*重现确切的 HCP 刺激，其中还包括受版权保护的好莱坞摘录和特定的串联/时间安排。）

**许可。** 好莱坞摘录受版权保护； HCP 根据其数据使用条款共享它们以供研究使用——请勿重新分发。 `CC` 剪辑带有其知识共享术语（归属）。

**积分。** 将 `.mp4` 放入 `data/movies/hcp/` 并刷新（如下）。

---

## 3.CamCAN观影刺激

**它是什么。** 阿尔弗雷德·希区柯克的 *“爆炸！你死定了”***（*阿尔弗雷德·希区柯克的礼物*，S7E2，1961）的 **8 分钟编辑版本，从约 25-30 分钟的原作中浓缩而成，同时保留了情节。它受**版权**（环球影业/希区柯克庄园）。特定的 8 分钟 CamCAN 编辑（不仅仅是原始剧集）与已发布的数据及其广泛的现有标注相匹配。

**如何获取（官方）。**
1. 通过 **Cam-CAN 数据访问门户** — <https://camcan-archive.mrc-cbu.cam.ac.uk/dataaccess/> 申请。
2. 提供有效的**学术背景**和**具体假设**，并请求**观看电影**数据/刺激。 Cam-CAN 的标注：他们拒绝模糊的“所有数据”请求和学生提交的申请 - **主管/PI 必须申请**，仅选择提案证明合理的数据类型。
3. 批准后，您会收到 **sftp** 下载说明；希区柯克的刺激也包括在内。

**许可。** 根据 Cam-CAN 协议提供用于研究的受版权保护的电视片段 - 请勿重新分发。 （完整的原创剧集在一些流媒体服务上播出，例如 Roku，但这不是 8 分钟的 Cam-CAN 剪辑。）

**整合。** 将剪辑放入`data/movies/camcan/`并刷新（如下）。

---

## 为什么这些没有自动下载

两者都需要**个人帐户和您必须接受的数据使用协议**，并且都包含**受版权保护的**好莱坞/希区柯克镜头。我没有这样的帐户，从非官方来源获取受版权保护的内容是不合适的。通过上述官方渠道获取；那么整合就是第一步。

## 获得它们后

```
data/movies/hcp/       ← HCP 7T MOVIE1–4 .mp4 files
data/movies/camcan/    ← the 8-min Hitchcock clip
```

然后运行标准刷新（参见 [`ADDING_MOVIES.md`](ADDING_MOVIES.md)）——或者只是告诉 Claude *“刷新数据集”*：

```bash
tools/refresh_corpus.sh                                  # annotates the new stimuli
matlab -batch "addpath matlab; refreshAnalysis('annotations/corpus')"
```

新的刺激在同一个 103 通道固定维度模板上进行标注，并自动折叠到所有分析和搜索界面中。如果您还有 HCP 剪辑定时 CSV，请告诉我，我可以将标注与每个剪辑边界对齐。

---

**来源。** HCP：[7T 成像协议](https://www.humanconnectome.org/hcp-protocols-ya-7t-imaging)、[连接数据库 S1200](https://db.humanconnectome.org/data/projects/HCP_1200)、[HCP 用户：电影刺激](https://groups.google.com/a/humanconnectome.org/g/hcp-users/c/Sa-Z_gfeiLo)、[7T 电影剪辑信息 wiki](https://wiki.humanconnectome.org/docs/7T%20Movie%20watching%20task%20clip%20info%20timing%20versions%20shown%20per%20individual%20subject.html)。 CamCAN：[数据访问门户](https://camcan-archive.mrc-cbu.cam.ac.uk/dataaccess/)、[Cam-CAN 协议（Shafto 等人，2014 年，BMC Neurology）](https://link.springer.com/article/10.1186/s12883-014-0204-1)、[砰！你死定了（希区柯克维基）](https://the.hitchcock.zone/wiki/Alfred_Hitchcock_Presents_-_Bang!_You're_Dead)。
