"""Generate a public image manifest and an allowlisted static Pages artifact."""
import argparse
import json
import os
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWS = {
    "four_arms_full_time": "四组对照 · 全时间轴",
    "sigma_three_arms": "三组对照 · 均值与尺度",
}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def build(output=None):
    images = []
    series = {}
    for image in sorted((ROOT / "results").rglob("*")):
        if image.is_symlink():
            raise ValueError(f"Symbolic links are not allowed: {image}")
        if not image.is_file() or image.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        rel = image.relative_to(ROOT).as_posix()
        if not image.resolve().is_relative_to((ROOT / "results").resolve()):
            raise ValueError(f"Image outside results: {image}")
        match = re.fullmatch(r"shot_(\d+)\.(png|jpg|jpeg|webp)", image.name, re.I)
        if not match:
            raise ValueError(f"Use shot_<number> filenames: {rel}")
        parts = image.relative_to(ROOT / "results").parts
        group_index = next((i for i, p in enumerate(parts[:-1]) if p in {"cq_test_fast10", "cq_test_slow10", "fast10", "slow10"}), None)
        if group_index is None:
            group = "other"
            prefix = parts[:-1]
            view = "results"
        else:
            group = "fast" if "fast" in parts[group_index] else "slow"
            prefix = parts[:group_index]
            view = "/".join(parts[group_index + 1:-1]) or "results"
        collection = "/".join(prefix) or "initial-cq"
        series_id = collection + "/" + view
        label = VIEWS.get(view, view.replace("_", " "))
        if prefix:
            label = " / ".join(prefix) + " · " + label
        series[series_id] = {"id": series_id, "label": label}
        width, height = None, None
        if image.suffix.lower() == ".png":
            header = image.read_bytes()[:24]
            if header[:8] != b"\x89PNG\r\n\x1a\n":
                raise ValueError(f"Invalid PNG: {rel}")
            width = int.from_bytes(header[16:20], "big")
            height = int.from_bytes(header[20:24], "big")
        images.append({"path": rel, "shot": match[1], "group": group, "series": series_id, "width": width, "height": height})
    if not images:
        raise ValueError("No result images found")
    keys = [(i["series"], i["group"], i["shot"]) for i in images]
    if len(keys) != len(set(keys)):
        raise ValueError("Duplicate image for the same series, group and shot")
    data = {"repository": os.environ.get("GITHUB_REPOSITORY", ""), "series": sorted(series.values(), key=lambda s: s["id"]), "images": images}
    (ROOT / "assets").mkdir(exist_ok=True)
    (ROOT / "assets" / "data.js").write_text("window.RESULTS_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    lines = ["# 图片索引", "", "在网站首页可以筛选炮号和并排比较；下方链接打开原图。", "", "| 分组 | 炮号 | 图集 | 原图 |", "| --- | --- | --- | --- |"]
    for i in sorted(images, key=lambda i: (i["group"], int(i["shot"]), i["series"])):
        label = series[i["series"]]["label"].replace("|", "\\|")
        lines.append(f'| {i["group"]} | {i["shot"]} | {label} | [查看]({i["path"]}) |')
    (ROOT / "BROWSE.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    if output:
        destination = Path(output).resolve()
        if destination == ROOT or destination.is_relative_to(ROOT / "results") or not destination.is_relative_to(ROOT):
            raise ValueError("Build output must be a separate folder inside the public repository")
        destination.mkdir(parents=True, exist_ok=True)
        for name in ("index.html", "README.md", "BROWSE.md"):
            shutil.copyfile(ROOT / name, destination / name)
        (destination / "catalog.json").write_text(json.dumps([i["path"] for i in images], ensure_ascii=False), encoding="utf-8")
        (destination / "assets").mkdir(exist_ok=True)
        for name in ("app.js", "style.css", "data.js"):
            shutil.copyfile(ROOT / "assets" / name, destination / "assets" / name)
        for i in images:
            target = destination / i["path"]
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / i["path"], target)
        # Remove stale artifact files only after verifying the output remains in ROOT.
        allowed = {"index.html", "README.md", "BROWSE.md", "catalog.json"} | {f"assets/{n}" for n in ("app.js", "style.css", "data.js")} | {i["path"] for i in images}
        for old in destination.rglob("*"):
            if old.is_file() and old.relative_to(destination).as_posix() not in allowed:
                old.unlink()
    print(f"Generated {len(images)} images, {len(set(i['shot'] for i in images))} shots, {len(series)} series")
    return data


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", help="Optional allowlisted deployment directory, e.g. _site")
    arguments = parser.parse_args()
    build(arguments.output)
