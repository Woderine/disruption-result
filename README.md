# disruption-result

**结果网页：[https://woderine.github.io/disruption-result/](https://woderine.github.io/disruption-result/)**

仓库已从 `disruption` 更名为 `disruption-result`。旧网页地址 `https://woderine.github.io/disruption/` 已停用，请使用上方新地址并更新书签。

这里共享破裂研究的公开结果图片。

首页以炮号列出结果，默认收起，支持全部、快炮、慢炮和未分类筛选。点击炮号后加载图片，可以选择左右来源及该炮的不同图片进行比较；点击图片可放大查看。**唯一匹配索引是炮号**，不要求双方图形格式、布局、分组、指标或模型相同。

当前 Woderine 图集位于 `results/Woderine/four_arms_full_time/`，保留 20 个测试炮次的四组全时间轴图；三组对照图已从公开仓库移除。这些选定炮次的可视化不代表全量测试集的统计结论。

## 上传与协作

阅读 [上传规则](UPLOAD_RULES.md) 与 [协作入门：版本、审核与 PR](COLLABORATION.md)。推荐：

~~~
results/<author>/<experiment>/shot_<number>_<description>.png
~~~

说明后缀可选，同一炮支持多张 PNG、JPG、JPEG、WebP。图片按文件名中的炮号归到同一条记录；作者和实验目录仅表示来源。

仓库所有者可在 Settings → Collaborators 邀请合作者。推荐合作者上传到自己的分支，发起 Pull Request，经你检查后合并到 main；目前尚未启用强制审批。其他贡献者可通过 Fork 提交 Pull Request。main 分支更新后，GitHub Pages 通过 Jekyll 自动收集图片路径并发布网页。

## 本地预览

~~~
python tools/build_gallery.py --output _site
cd _site
python -m http.server 8000
~~~

打开 http://localhost:8000/。也可以生成清单后直接打开根目录 index.html，使用本地清单离线查看。

## 发布设置

GitHub Pages 使用 Deploy from a branch → main → /(root)。网页中的 catalog.json 由 Jekyll 自动生成；不要把原始 Liquid 模板当作 JSON 手工编辑。
