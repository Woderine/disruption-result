# disruption

破裂研究的公开共享结果。浏览网站首页可按 CQ 快慢组、炮号和图集筛选，选择第二个图集并排比较，点击图片放大。当前筛选保存在网址中，可以复制链接分享。

初始图集包含 20 个测试炮次、40 张 PNG：

- `results/cq_test_fast10/`：10 个快速 CQ 炮次。
- `results/cq_test_slow10/`：10 个慢速 CQ 炮次。
- 每组包含 `four_arms_full_time/`（四组全时间轴对照）与 `sigma_three_arms/`（三组均值与尺度对照）。

这些是选定炮次的可视化，不代表全量测试集的统计结论；图中的尺度带保留原图含义。查看 [图片索引](BROWSE.md) 可直接打开原图。

## 合作者添加结果

仓库所有者在 **Settings → Collaborators** 中邀请合作者。写权限成员可通过 GitHub 的 **Add file → Upload files** 上传，或通过 Git 提交；其他贡献者可提交 Pull Request。

建议每个实验单独建目录，结构为：

```text
results/
  <author>/
    <run>/
      cq_test_fast10/
        <view>/shot_16845.png
      cq_test_slow10/
        <view>/shot_16400.png
```

图片名使用 `shot_<炮号>.png`（也支持 JPG、JPEG、WebP）。同一作者、同一实验、同一 `<view>` 自动归为一个图集，快慢组共用图集名称。为便于比较，双方使用相同炮号和分组。每次实验保留独立目录；在实验目录的 `README.md` 中说明模型名称、标签版本、评估协议和图例，仅填写准备公开的信息。

合并或推送到 `main` 后，GitHub Pages 自动发布网页，通过 Jekyll 收集图片路径；网页自动展示新图集，不需要手工修改索引。数值文件、研究代码、检查点及私有项目文档不属于本仓库的初始导出内容。

## 本地查看

```text
python tools/build_gallery.py
```

然后直接打开 `index.html`。如需 HTTP 预览：

```text
python -m http.server 8000
```

浏览 `http://localhost:8000/`。本地使用生成的图片清单；网站为静态页面，上传通过 GitHub 完成。也可以运行 `python tools/build_gallery.py --output _site` 后在 `_site` 中启动 HTTP 服务，预览完整静态发布产物。

## GitHub Pages

仓库设为公开；在 **Settings → Pages → Build and deployment → Source** 选择 **Deploy from a branch**，选择 **main / (root)** 后保存。后续每次推送都会自动发布。

部署成功后，网站地址为 `https://<owner>.github.io/disruption/`。
