# 结果图片上传规则

**炮号是网页匹配图片的唯一索引。** 相同炮号的图片会出现在同一条炮次记录中，展开后可左右比较。图片不必使用相同列数、尺寸、模型、坐标轴或图形内容；无需按快慢组分类。

## 1. 文件名包含炮号

支持 PNG、JPG、JPEG、WebP。使用以下命名：

~~~
shot_16845.png
shot_16845_prediction.png
shot_16845_heatmap.jpg
shot_16845_diagnostics.webp
~~~

数字必须是真实炮号。炮号后的说明可选；同一炮有多张图时，使用不同说明，避免覆盖。网页把这些文件都归到炮 16845，展开后可通过图片选择框切换。炮号前导零会被忽略。

## 2. 按作者和实验保存

推荐目录：

~~~
results/
  alice/
    model_a_20261009/
      shot_16845_prediction.png
      shot_16845_heatmap.jpg
      shot_16909_prediction.png
  bob/
    experiment_b/
      shot_16845_diagnostics.png
~~~

当前 Woderine 的图片统一放在 `results/Woderine/four_arms_full_time/`。新增实验请在自己的作者目录下另建实验目录。

作者、实验名和可选子目录用来标明图片来源，不参与炮号匹配。推荐使用英文、数字、下划线或连字符命名目录。双方不需要使用相同的目录名、分组名或图形格式。

例如 Alice 的 prediction、heatmap 与 Bob 的 diagnostics 都属于炮 16845，可以在网页展开同一炮后任意选择左右图片比较。没有相同炮号时，网页显示该来源缺图，不会拿其他炮号凑对。

## 3. 写清图的含义

保留清晰的炮号、图例、坐标轴名称和单位。每个实验可附 README.md，说明作者、实验名称、模型、指标含义及必要的评估背景。这些说明帮助读图，不作为网页强制匹配条件。

## 4. 上传到 GitHub

有写权限时，打开仓库的 results 目录，通过 **Add file → Upload files** 上传作者/实验文件夹，并提交到 main。也可以使用 Git 提交。没有写权限时，可通过 Fork 和 Pull Request 贡献。

保留其他作者和旧实验的结果，在自己的目录内新增图片。GitHub Pages 发布完成后，网页会自动收集符合命名规则的图片；无需修改网页或手工维护图片索引。

只上传准备公开的图片与说明。网页不要求原始数据文件或研究代码。
