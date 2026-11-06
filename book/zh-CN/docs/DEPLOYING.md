# 文档站点的部署

文档书从此仓库发布到 GitHub Pages，地址为 **<https://canlab.github.io/narrative_feature_annotations/>**。 GitHub Actions 工作流程 (`.github/workflows/deploy-book.yml`) 会在每次推送到 `main` 时重建并重新发布它。

> **译者注**　以上网址指向 CANlab 英文原站。本 fork 将译稿保存在 `book/zh-CN/`；修改中文版请编辑该目录中的 Markdown，再运行本章的构建命令。构建时会将译稿与共用图表、检索索引合并到 `book/src/`。

## 哪些文件随仓库分发

该项目将小型可共享文本与大型受版权保护的媒体混合在一起。分裂是：

| 保存在**git / GitHub** | 仅保存在 **Dropbox**（git 忽略） |
|--------------------------|----------------------------------------|
| 处理流程代码（`src/`、`matlab/`、`tools/`） | 刺激 **媒体** — 电影和音频 (`data/**/*.mp4,*.wav,…`，~11 GB) |
| 文档 (`docs/`、`README.md`) 和书籍配置 (`book/book.toml`) | 标注**衍生**（`annotations/`，约 217 MB 的 `.h5` + sidecar） |
| 模式 (`schema/`)、数字 (`analysis/figures/`)、搜索索引 (`analysis/web/`) | |
| 语料库**元数据**（`data/manifest.csv`、`data/**/SOURCES.md`、词典 CSV、文本故事） | 参考 **PDF** (`PDFs/`, ~100 MB) — 每个模型背后的论文的出版商/预印本 PDF |

为什么媒体、标注和参考 PDF 不包含在 git 中：

- **媒体**超过 GitHub 的每个文件 100 MB 限制，并且受 **版权保护**（`spacetop` 剪辑、*Narratives* 音频和 *Kung Fury* 是第三方 IP）。只有 CC-BY Blender 开放影片可以自由重新分发。
- **标注**是大型衍生数据（其 ASR 转录本再现了电影对话）。它们可以从媒体中重新生成，因此它们保存在 Dropbox 中，并且如果需要可引用的数据集，可以单独发布（例如带有 DOI 的 OSF/Zenodo）。
- **参考 PDF** (`PDFs/`) 是受版权保护的出版商/预印本，为离线方便而保存；文档链接到公共 arXiv/DOI URL，因此该网站不需要 PDF。

发布的网站**不需要**任何一个：它是根据文档、图表和交互式搜索索引构建的，所有这些都已提交。

## 一次性设置

```bash
cd "<this folder>"

# 1. Initialize git and keep Dropbox out of git's internals (see "Dropbox" below).
git init
xattr -w com.dropbox.ignored 1 .git      # macOS: stop Dropbox syncing the .git folder

# 2. Stage everything; .gitignore already excludes media, annotations, .venv, book build.
git add -A
git status                                 # sanity check: no .mp4/.wav/.h5 should appear

# 3. First commit.
git commit -m "Narrative Feature Extraction: pipeline, docs, and documentation book"

# 4. Create the GitHub repo and push (org: canlab).
git branch -M main
gh repo create canlab/narrative_feature_annotations --source=. --remote=origin --push --public
#   …or, if the repo already exists:
#   git remote add origin https://github.com/canlab/narrative_feature_annotations.git
#   git push -u origin main
```

然后启用页面**一次**：repo **设置→页面→构建和部署→来源：“GitHub Actions”**。下一次推送（或手动运行*部署文档手册*工作流程）将发布该站点。 GitHub Pages 需要免费计划的 **公共** 仓库。

## 更新网站

在 `docs/`（或 `README.md`）下编辑 Markdown，提交并推送 — 工作流程重新生成书籍并重新部署。首先在本地预览：

```bash
brew install mdbook                  # one-time; or: cargo install mdbook
python3 tools/build_book.py          # assemble book/src/ from docs/
mdbook serve book                    # live preview at http://localhost:3000
```

生成`book/src/`和`book/book/`（git忽略）；切勿手动编辑它们。

## 重新生成标注（不在仓库中）

因为 `annotations/` 仅适用于 Dropbox，所以新的 `git clone` 具有代码和文档，但没有衍生产品。要重建它们，您需要媒体（也仅限 Dropbox）就位，然后：

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
PYTHONPATH=src .venv/bin/python -m nfe.batch --manifest data/manifest.csv \
    --out annotations/corpus --template schema/channel_template.json \
    --vision --audio-hl --events
# then refresh derivatives the site uses:
PYTHONPATH=src .venv/bin/python tools/build_search_index.py    # analysis/web/segments.json
# (MATLAB) refreshAnalysis("annotations/corpus")               # analysis/figures + stats
```

有关完整刷新工作流程，请参阅[`ADDING_MOVIES.md`](ADDING_MOVIES.md)。

## Dropbox + git

该工作文件夹位于 Dropbox 中。这很好 - GitHub Pages 不关心本地文件夹在哪里 - 但有一个警告：**Dropbox 持续同步 `.git` 文件夹**，跨多台机器（或者如果它在提交中同步）可能会在 `.git` 内创建“冲突副本”文件并损坏仓库。缓解措施：

- 告诉 Dropbox 忽略 `.git`（上面的 `xattr` 命令），这样 Dropbox 就不会打扰 git。
- 这种安排在其他方面是互补的：**Dropbox** 拥有大型媒体 + 标注； **GitHub** 拥有代码+文档。不要通过 Dropbox 在计算机之间同步 *repo* - 使用 `git clone`/`pull`/`push` 来同步，并让 Dropbox 仅携带媒体。
