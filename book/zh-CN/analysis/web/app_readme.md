# 片段浏览器使用说明

按特征组合查找影片或故事中的片段，并从对应时刻开始播放。

## 启动

在**项目根目录**启动项目自带的服务器，再打开浏览器：

```bash
cd <project-root>
python3 tools/serve.py            # http://localhost:8000  (pass a port to change it)
# then open:  http://localhost:8000/analysis/web/index.html
```

`tools/serve.py` 支持 HTTP 字节范围请求（`Range`），播放器因此可以直接跳到文件中间的指定时刻。项目说明指出，使用 `python -m http.server` 时进度条和片段跳转会受限。请从项目根目录提供服务，让播放器能按 `/data/movies/...` 找到本地媒体。直接双击 HTML 文件无法完整使用播放功能。

## 查找和播放片段

1. 在左侧按类别浏览或筛选特征，勾选想用来检索的通道。为每项选择“高”或“低”，指定想找数值较大还是较小的片段。
2. 可按材料来源筛选，也可指定显示多少条结果。浏览器综合所选特征的标准化分数，对片段排序。
3. 点击“片段”会跳到该段起点，并在终点自动停止；点击“全片”则播放完整材料。播放器下方也提供这两个操作。
4. 时间序列图显示所选特征在整份材料中的变化，标记线随播放进度移动。点图上的任意时刻或拖动播放进度条，即可跳转。

## 重建索引

索引 `segments.json` 来自已标注的语料库。添加材料后，或需要调整片段窗口时，重新生成索引。下例的窗口长为 5 秒：

```bash
PYTHONPATH=src .venv/bin/python tools/build_search_index.py --seglen 5
```
