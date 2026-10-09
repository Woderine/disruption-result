"""Build a shot-indexed manifest; image layouts and folder groups are independent."""
import argparse
import json
import os
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
FILENAME = re.compile(r"shot_(\d+)(?:_(.+))?\.(png|jpg|jpeg|webp)", re.I)


def image_record(image):
    relative = image.relative_to(ROOT / "results")
    parts = relative.parts
    match = FILENAME.fullmatch(image.name)
    if not match:
        raise ValueError(f"Use shot_<number>[_description] filenames: {relative}")
    directory = parts[:-1]
    series_id = "/".join(directory) or "shared"
    label = " / ".join(directory) or "共享结果"
    title = match[2].lstrip("_").replace("_", " ") if match[2] else "结果图"
    return {
        "path": image.relative_to(ROOT).as_posix(),
        "shot": str(int(match[1])),
        "series": series_id,
        "title": title,
    }, {"id": series_id, "label": label}


def build(output=None):
    images, series = [], {}
    results = ROOT / "results"
    for image in sorted(results.rglob("*")):
        if image.is_symlink():
            raise ValueError(f"Symbolic links are not allowed: {image}")
        if not image.is_file() or image.suffix.lower() not in EXTENSIONS:
            continue
        if not image.resolve().is_relative_to(results.resolve()):
            raise ValueError(f"Image outside results: {image}")
        if image.suffix.lower() == ".png" and image.read_bytes()[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError(f"Invalid PNG: {image}")
        record, source = image_record(image)
        images.append(record)
        series[source["id"]] = source
    if not images:
        raise ValueError("No named result images found")
    data = {
        "repository": os.environ.get("GITHUB_REPOSITORY", "Woderine/disruption"),
        "series": sorted(series.values(), key=lambda s: s["id"]),
        "images": images,
    }
    (ROOT / "assets").mkdir(exist_ok=True)
    (ROOT / "assets" / "data.js").write_text("window.RESULTS_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    lines = ["# 图片索引", "", "炮号是唯一匹配索引；同炮可有多个来源及多张图片。", "", "| 炮号 | 来源 | 图片 | 原图 |", "| --- | --- | --- | --- |"]
    from urllib.parse import quote
    for image in sorted(images, key=lambda i: (int(i["shot"]), i["series"], i["path"])):
        label = series[image["series"]]["label"].replace("|", "\\|")
        title = image["title"].replace("|", "\\|")
        lines.append(f'| {image["shot"]} | {label} | {title} | [查看]({quote(image["path"], safe="/")}) |')
    (ROOT / "BROWSE.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    if output:
        destination = Path(output).resolve()
        if destination == ROOT or destination.is_relative_to(results) or not destination.is_relative_to(ROOT):
            raise ValueError("Output must be a separate directory inside the public repository")
        destination.mkdir(parents=True, exist_ok=True)
        page_files = ("index.html", "README.md", "BROWSE.md", "UPLOAD_RULES.md")
        asset_files = ("app.js", "catalog-model.js", "style.css", "data.js")
        for name in page_files:
            shutil.copyfile(ROOT / name, destination / name)
        (destination / "catalog.json").write_text(json.dumps([i["path"] for i in images], ensure_ascii=False), encoding="utf-8")
        (destination / "assets").mkdir(exist_ok=True)
        for name in asset_files:
            shutil.copyfile(ROOT / "assets" / name, destination / "assets" / name)
        for image in images:
            target = destination / image["path"]
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / image["path"], target)
        allowed = set(page_files) | {"catalog.json"} | {f"assets/{n}" for n in asset_files} | {i["path"] for i in images}
        for old in destination.rglob("*"):
            if old.is_file() and old.relative_to(destination).as_posix() not in allowed:
                old.unlink()
    print(f"Generated {len(images)} images, {len(set(i['shot'] for i in images))} shots, {len(series)} sources")
    return data


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", help="Optional static output, e.g. _site")
    build(parser.parse_args().output)
