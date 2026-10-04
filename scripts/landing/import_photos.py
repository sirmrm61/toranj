#!/usr/bin/env python3
"""Build the WebGL landing assets from studio photographs."""

from __future__ import annotations

import argparse
import itertools
import json
import statistics
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps
from rembg import new_session, remove
from transformers import pipeline


IMAGE_SIZE = (848, 1264)
BACKGROUND_SIZE = (1229, 768)
POSTER_SIZE = (1920, 1200)
DEPTH_MODEL = "depth-anything/Depth-Anything-V2-Small-hf"
REMBG_MODEL = "birefnet-portrait"
GOWN_ORDER = ("morvarid", "mah", "nasim", "shokoufeh", "setareh", "yas")
ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT / "public" / "landing"
CHECKER_LIGHT = (218, 218, 218)
CHECKER_DARK = (174, 174, 174)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sources", required=True, type=Path, help="JSON key-to-source-file mapping")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--review-output", type=Path, help="Optional review sheet output path")
    parser.add_argument("--rembg-model", default=REMBG_MODEL)
    parser.add_argument("--depth-model", default=DEPTH_MODEL)
    return parser.parse_args()


def read_sources(path: Path) -> dict[str, Path]:
    raw: dict[str, str] = json.loads(path.read_text(encoding="utf-8"))
    required = {"background", "groom", *GOWN_ORDER}
    missing = required - raw.keys()
    extra = raw.keys() - required
    if missing or extra:
        raise ValueError(f"Source mapping keys mismatch; missing={sorted(missing)}, extra={sorted(extra)}")

    result = {}
    for key, value in raw.items():
        source = Path(value).expanduser()
        if not source.is_absolute():
            source = path.parent / source
        source = source.resolve()
        if not source.is_file():
            raise FileNotFoundError(f"{key} source not found: {source}")
        result[key] = source
    return result


def load_landing_config(output_dir: Path) -> dict[str, Any]:
    config_path = output_dir / "landing.json"
    if not config_path.is_file():
        config_path = ROOT / "public" / "landing" / "landing.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    by_key = {gown["key"]: gown for gown in config["gowns"]}
    if set(by_key) != set(GOWN_ORDER):
        raise ValueError(f"Landing config gown keys must be {GOWN_ORDER}, got {tuple(by_key)}")
    config["gowns"] = [by_key[key] for key in GOWN_ORDER]
    config["gowns"][-1]["tagline"] = "طراحی پیلی‌دار با سرشانه‌های مجسمه‌ای و آستین گیپور"
    return config


def backdrop_color(image: Image.Image) -> np.ndarray:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    samples = np.concatenate(
        [
            rgb[:12, :, :].reshape(-1, 3),
            rgb[-12:, :, :].reshape(-1, 3),
            rgb[:, :12, :].reshape(-1, 3),
            rgb[:, -12:, :].reshape(-1, 3),
        ],
        axis=0,
    )
    return np.median(samples, axis=0)


def remove_background(image: Image.Image, session: Any) -> Image.Image:
    rgb = image.convert("RGB")
    cutout = remove(rgb, session=session).convert("RGBA")
    alpha = np.asarray(cutout.getchannel("A"), dtype=np.uint8)
    alpha = cv2.erode(alpha, np.ones((3, 3), dtype=np.uint8), iterations=1)
    alpha = cv2.GaussianBlur(alpha, (0, 0), sigmaX=0.35).astype(np.float32) / 255.0

    source = np.asarray(rgb, dtype=np.float32)
    bg = backdrop_color(rgb).astype(np.float32)
    safe_alpha = np.maximum(alpha[:, :, None], 0.12)
    unmatte = np.clip((source - bg[None, None, :] * (1.0 - alpha[:, :, None])) / safe_alpha, 0, 255)
    unmatte[alpha <= 0.01] = 0
    rgba = np.dstack((unmatte.astype(np.uint8), np.round(alpha * 255).astype(np.uint8)))
    return Image.fromarray(rgba, "RGBA")


def detect_face_and_eyes(image: Image.Image, key: str) -> dict[str, Any]:
    cv_image = cv2.cvtColor(np.asarray(image.convert("RGB")), cv2.COLOR_RGB2GRAY)
    cascade_dir = Path(cv2.data.haarcascades)
    face_cascade = cv2.CascadeClassifier(str(cascade_dir / "haarcascade_frontalface_default.xml"))
    eye_cascade = cv2.CascadeClassifier(str(cascade_dir / "haarcascade_eye.xml"))
    faces = face_cascade.detectMultiScale(
        cv_image,
        scaleFactor=1.05,
        minNeighbors=4,
        minSize=(36, 36),
        maxSize=(int(cv_image.shape[1] * 0.22), int(cv_image.shape[0] * 0.22)),
        flags=cv2.CASCADE_SCALE_IMAGE,
    )
    faces = [
        face
        for face in faces
        if abs((face[0] + face[2] / 2) - cv_image.shape[1] / 2) <= cv_image.shape[1] * 0.22
        and face[1] + face[3] / 2 <= cv_image.shape[0] * 0.4
    ]
    if len(faces) == 0:
        alt_face = cv2.CascadeClassifier(str(cascade_dir / "haarcascade_frontalface_alt2.xml"))
        faces = alt_face.detectMultiScale(
            cv_image,
            scaleFactor=1.05,
            minNeighbors=3,
            minSize=(36, 36),
            maxSize=(int(cv_image.shape[1] * 0.22), int(cv_image.shape[0] * 0.22)),
        )
        faces = [
            face
            for face in faces
            if abs((face[0] + face[2] / 2) - cv_image.shape[1] / 2) <= cv_image.shape[1] * 0.22
            and face[1] + face[3] / 2 <= cv_image.shape[0] * 0.4
        ]
    if len(faces) == 0:
        raise RuntimeError(f"OpenCV could not detect a face in {key}")
    x, y, width, height = max(faces, key=lambda face: int(face[2]) * int(face[3]))

    eye_roi_height = int(height * 0.68)
    roi = cv_image[y : y + eye_roi_height, x : x + width]
    detected = eye_cascade.detectMultiScale(
        roi,
        scaleFactor=1.05,
        minNeighbors=3,
        minSize=(8, 6),
        flags=cv2.CASCADE_SCALE_IMAGE,
    )
    candidates = [
        (int(ex), int(ey), int(ew), int(eh))
        for ex, ey, ew, eh in detected
        if 0.18 * height <= ey + eh / 2 <= 0.62 * height
        and 0.12 * width <= ex + ew / 2 <= 0.88 * width
    ]
    pairs = []
    for left, right in itertools.combinations(candidates, 2):
        if left[0] > right[0]:
            left, right = right, left
        separation = right[0] + right[2] / 2 - (left[0] + left[2] / 2)
        if not 0.2 * width <= separation <= 0.72 * width:
            continue
        cost = (
            abs((left[1] + left[3] / 2) - (right[1] + right[3] / 2))
            + abs(left[3] - right[3]) * 0.4
            + abs(left[2] - right[2]) * 0.2
        )
        pairs.append((cost, left, right))

    fallback = not pairs
    if pairs:
        _, left_eye, right_eye = min(pairs, key=lambda pair: pair[0])
        eyes = []
        for ex, ey, ew, eh in (left_eye, right_eye):
            eyes.append(
                {
                    "x": x + ex + ew / 2,
                    "y": y + ey + eh / 2,
                    "width": ew,
                    "height": eh,
                }
            )
    else:
        eyes = [
            {"x": x + width * 0.34, "y": y + height * 0.42, "width": width * 0.22, "height": height * 0.10},
            {"x": x + width * 0.66, "y": y + height * 0.42, "width": width * 0.22, "height": height * 0.10},
        ]

    return {
        "eyes": eyes,
        "face": {"x": x, "y": y, "width": width, "height": height},
        "fallback": fallback,
    }


def mean(values: list[float]) -> float:
    return statistics.fmean(values)


def summarize_landmarks(landmarks: dict[str, dict[str, Any]]) -> dict[str, Any]:
    by_side = [
        [landmarks[key]["eyes"][side] for key in GOWN_ORDER]
        for side in range(2)
    ]
    mean_eyes = [
        {"u": mean([item["x"] for item in side]) / IMAGE_SIZE[0], "v": mean([item["y"] for item in side]) / IMAGE_SIZE[1]}
        for side in by_side
    ]
    eye_widths = [item["width"] for key in GOWN_ORDER for item in landmarks[key]["eyes"]]
    eye_heights = [item["height"] for key in GOWN_ORDER for item in landmarks[key]["eyes"]]
    face_centers_x = [landmarks[key]["face"]["x"] + landmarks[key]["face"]["width"] / 2 for key in GOWN_ORDER]
    face_centers_y = [landmarks[key]["face"]["y"] + landmarks[key]["face"]["height"] / 2 for key in GOWN_ORDER]
    face_radii = [landmarks[key]["face"]["width"] * 0.55 for key in GOWN_ORDER]
    report = {
        "per_image_eye_centers_px": {
            key: [{"x": round(eye["x"], 1), "y": round(eye["y"], 1)} for eye in landmarks[key]["eyes"]]
            for key in GOWN_ORDER
        },
        "eye_detection": {
            key: "face-relative estimate" if landmarks[key]["fallback"] else "OpenCV Haar eyes"
            for key in GOWN_ORDER
        },
        "eye_mean_normalized": mean_eyes,
        "eye_spread_stddev_px": [
            {
                "x": round(statistics.pstdev([eye["x"] for eye in side]), 2),
                "y": round(statistics.pstdev([eye["y"] for eye in side]), 2),
                "x_range": round(max(eye["x"] for eye in side) - min(eye["x"] for eye in side), 1),
                "y_range": round(max(eye["y"] for eye in side) - min(eye["y"] for eye in side), 1),
            }
            for side in by_side
        ],
        "face_center_mean_normalized": {
            "u": mean(face_centers_x) / IMAGE_SIZE[0],
            "v": mean(face_centers_y) / IMAGE_SIZE[1],
        },
        "face_center_stddev_px": {
            "x": round(statistics.pstdev(face_centers_x), 2),
            "y": round(statistics.pstdev(face_centers_y), 2),
        },
        "eyeSize": {"rx": mean(eye_widths) * 0.45 / IMAGE_SIZE[0], "ry": mean(eye_heights) * 0.42 / IMAGE_SIZE[1]},
        "irisRadius": mean(eye_widths) * 0.22 / IMAGE_SIZE[0],
        "eyeTravel": 4.0 / IMAGE_SIZE[0],
        "head": {
            "u": mean(face_centers_x) / IMAGE_SIZE[0],
            "v": mean(face_centers_y) / IMAGE_SIZE[1],
            "radius": mean(face_radii) / IMAGE_SIZE[0],
        },
    }
    return report


def make_depth_map(
    source: Image.Image,
    cutout: Image.Image,
    estimator: Any,
) -> tuple[Image.Image, bool]:
    prediction = estimator(source.convert("RGB"))["depth"].convert("L")
    depth = np.asarray(prediction.resize(IMAGE_SIZE, Image.Resampling.BICUBIC), dtype=np.float32)
    rgba = np.asarray(cutout.convert("RGBA"), dtype=np.uint8)
    alpha = rgba[:, :, 3].astype(np.float32) / 255.0
    foreground = alpha > 0.55
    background = alpha < 0.05
    if foreground.any() and background.any():
        near_is_high = float(np.median(depth[foreground])) > float(np.median(depth[background]))
    else:
        near_is_high = True

    values = depth[alpha > 0.05]
    if values.size == 0:
        raise RuntimeError("Background removal produced an empty alpha mask")
    low, high = np.percentile(values, [1, 99])
    if high <= low:
        normalized = np.zeros_like(depth)
    else:
        normalized = np.clip((depth - low) / (high - low), 0, 1)
    if not near_is_high:
        normalized = 1.0 - normalized
    normalized = cv2.GaussianBlur(normalized, (0, 0), sigmaX=2.2)
    normalized *= alpha
    normalized[alpha <= 0.01] = 0
    gray = np.round(normalized * 255).astype(np.uint8)
    rgb = np.repeat(gray[:, :, None], 3, axis=2)
    return Image.fromarray(rgb, "RGB"), near_is_high


def make_background(source: Image.Image, output_dir: Path) -> Image.Image:
    background = ImageOps.fit(
        source.convert("RGB"),
        BACKGROUND_SIZE,
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )
    background.save(output_dir / "background.webp", "WEBP", quality=85, method=6)
    return background


def make_poster(
    background: Image.Image,
    groom: Image.Image,
    bride: Image.Image,
    size: tuple[int, int],
    output: Path,
    quality: int,
) -> None:
    width, height = size
    wide = width / height > 1.05
    bride_h = height * (0.9 if wide else 0.8)
    bride_w = bride_h * IMAGE_SIZE[0] / IMAGE_SIZE[1]
    bride_x = -width * (0.16 if wide else 0)
    bride_y = -height / 2 + bride_h / 2 + height * 0.01
    groom_h = bride_h * 0.66
    groom_w = groom_h * IMAGE_SIZE[0] / IMAGE_SIZE[1]
    groom_x = bride_x - bride_w * (0.48 if wide else 0.38)
    groom_y = -height / 2 + groom_h / 2 + height * 0.13

    canvas = ImageOps.fit(background, size, method=Image.Resampling.LANCZOS).convert("RGBA")
    groom_layer = groom.convert("RGBA").resize((round(groom_w), round(groom_h)), Image.Resampling.LANCZOS)
    groom_layer = groom_layer.filter(ImageFilter.GaussianBlur(2.0))
    groom_layer = ImageEnhance.Brightness(groom_layer).enhance(0.7)
    canvas.alpha_composite(
        groom_layer,
        (round(width / 2 + groom_x - groom_w / 2), round(height / 2 - groom_y - groom_h / 2)),
    )

    bride_layer = bride.convert("RGBA").resize((round(bride_w), round(bride_h)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(
        bride_layer,
        (round(width / 2 + bride_x - bride_w / 2), round(height / 2 - bride_y - bride_h / 2)),
    )
    canvas.convert("RGB").save(output, "WEBP", quality=quality, method=6)


def checkerboard(size: tuple[int, int], block: int = 24) -> Image.Image:
    image = Image.new("RGB", size, CHECKER_LIGHT)
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], block):
        for x in range(0, size[0], block):
            if (x // block + y // block) % 2:
                draw.rectangle((x, y, x + block, y + block), fill=CHECKER_DARK)
    return image


def fit_layer(image: Image.Image, size: tuple[int, int], contain: bool = False) -> Image.Image:
    if not contain:
        return ImageOps.fit(image.convert("RGB"), size, method=Image.Resampling.LANCZOS)
    fitted = image.convert("RGBA")
    fitted.thumbnail(size, Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", size, (0, 0, 0, 0))
    frame.alpha_composite(fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2))
    return frame


def make_review_sheet(
    output_dir: Path,
    review_path: Path,
    cutouts: dict[str, Image.Image],
) -> None:
    cell_w, cell_h = 360, 310
    label_h = 42
    margin = 24
    header_h = 54
    columns = ("Checkerboard cutout", "On dark background", "Depth map", "Poster")
    row_keys = ("groom", *GOWN_ORDER)
    height = header_h + len(row_keys) * (cell_h + label_h) + cell_h + label_h + margin * 2
    sheet = Image.new("RGB", (margin * 2 + cell_w * len(columns), height), "#1b1714")
    draw = ImageDraw.Draw(sheet)
    for column, title in enumerate(columns):
        draw.text((margin + column * cell_w + 10, margin), title, fill="white")

    tile_y = margin + header_h
    for key in row_keys:
        draw.text((margin, tile_y - 21), key, fill="#e8c996")
        x0 = margin
        tile_bg = checkerboard((cell_w, cell_h))
        tile_person = fit_layer(cutouts[key], (cell_w - 30, cell_h - 20), contain=True)
        tile_bg.paste(tile_person, ((cell_w - tile_person.width) // 2, (cell_h - tile_person.height) // 2), tile_person)
        sheet.paste(tile_bg, (x0, tile_y))

        dark_bg = ImageOps.fit(
            Image.open(output_dir / "background.webp").convert("RGB"),
            (cell_w, cell_h),
            method=Image.Resampling.LANCZOS,
        )
        dark_person = fit_layer(cutouts[key], (cell_w - 30, cell_h - 20), contain=True)
        dark_bg.paste(dark_person, ((cell_w - dark_person.width) // 2, (cell_h - dark_person.height) // 2), dark_person)
        sheet.paste(dark_bg, (margin + cell_w, tile_y))

        if key == "groom":
            depth_tile = Image.new("RGB", (cell_w, cell_h), "#2b2927")
            draw.text((margin + 2 * cell_w + 100, tile_y + cell_h // 2), "No groom depth map", fill="white")
        else:
            depth = Image.open(output_dir / f"depth-{key}.webp").convert("RGB")
            depth_tile = Image.new("RGB", (cell_w, cell_h), "#45413e")
            depth.thumbnail((cell_w - 30, cell_h - 16), Image.Resampling.LANCZOS)
            depth_tile.paste(depth, ((cell_w - depth.width) // 2, (cell_h - depth.height) // 2))
        sheet.paste(depth_tile, (margin + 2 * cell_w, tile_y))

        poster_path = output_dir / ("poster.webp" if key == "groom" else f"poster-{key}.webp")
        poster_tile = ImageOps.fit(
            Image.open(poster_path).convert("RGB"),
            (cell_w, cell_h),
            method=Image.Resampling.LANCZOS,
        )
        sheet.paste(poster_tile, (margin + 3 * cell_w, tile_y))
        draw.text((margin + 3 * cell_w + 8, tile_y + cell_h - 22), poster_path.name, fill="white")
        tile_y += cell_h + label_h

    draw.text((margin, tile_y - 20), "Master poster", fill="#e8c996")
    master = ImageOps.fit(
        Image.open(output_dir / "poster.webp").convert("RGB"),
        (cell_w * 2, cell_h),
        method=Image.Resampling.LANCZOS,
    )
    sheet.paste(master, (margin, tile_y))
    review_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(review_path, "PNG", optimize=True)


def main() -> None:
    args = parse_args()
    sources = read_sources(args.sources.resolve())
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    config = load_landing_config(output_dir)

    photos: dict[str, Image.Image] = {}
    for key, source_path in sources.items():
        image = Image.open(source_path).convert("RGB")
        if key != "background" and image.size != IMAGE_SIZE:
            raise ValueError(f"{key} must be {IMAGE_SIZE[0]}x{IMAGE_SIZE[1]}, got {image.size}")
        photos[key] = image

    print(f"Loading background-removal model: {args.rembg_model}", flush=True)
    rembg_session = new_session(args.rembg_model, providers=["CPUExecutionProvider"])
    cutouts: dict[str, Image.Image] = {}
    for key in ("groom", *GOWN_ORDER):
        print(f"Removing background: {key}", flush=True)
        cutout = remove_background(photos[key], rembg_session)
        cutouts[key] = cutout
        if key == "groom":
            filename = "groom.webp"
        else:
            filename = f"bride-{key}.webp"
        cutout.save(output_dir / filename, "WEBP", quality=88, method=6, lossless=False)

    print(f"Loading depth model: {args.depth_model}", flush=True)
    estimator = pipeline("depth-estimation", model=args.depth_model, device=-1)
    depth_orientations = {}
    for key in GOWN_ORDER:
        print(f"Estimating depth: {key}", flush=True)
        depth, near_is_high = make_depth_map(photos[key], cutouts[key], estimator)
        depth.save(output_dir / f"depth-{key}.webp", "WEBP", quality=92, method=6)
        depth_orientations[key] = "white=near" if near_is_high else "inverted to white=near"

    background = make_background(photos["background"], output_dir)
    poster_bg = ImageOps.fit(background, POSTER_SIZE, method=Image.Resampling.LANCZOS)
    make_poster(poster_bg, cutouts["groom"], cutouts[GOWN_ORDER[0]], POSTER_SIZE, output_dir / "poster.webp", 85)
    for key in GOWN_ORDER:
        make_poster(poster_bg, cutouts["groom"], cutouts[key], (1280, 800), output_dir / f"poster-{key}.webp", 85)

    landmarks = {key: detect_face_and_eyes(photos[key], key) for key in GOWN_ORDER}
    summary = summarize_landmarks(landmarks)
    config.update(
        {
            "generated": "photos",
            "imageSize": {"w": IMAGE_SIZE[0], "h": IMAGE_SIZE[1]},
            "eyes": summary["eye_mean_normalized"],
            "eyeSize": summary["eyeSize"],
            "irisRadius": summary["irisRadius"],
            "eyeTravel": summary["eyeTravel"],
            "head": summary["head"],
            "eyeOverlay": False,
            "background": "/landing/background.webp",
            "groom": "/landing/groom.webp",
            "poster": "/landing/poster.webp",
        }
    )
    for gown in config["gowns"]:
        key = gown["key"]
        gown.update(
            {
                "image": f"/landing/bride-{key}.webp",
                "depth": f"/landing/depth-{key}.webp",
                "poster": f"/landing/poster-{key}.webp",
            }
        )
    (output_dir / "landing.json").write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if args.review_output:
        make_review_sheet(output_dir, args.review_output.resolve(), cutouts)

    print(json.dumps({"rembg_model": args.rembg_model, "depth_orientation": depth_orientations, **summary}, indent=2))
    print(f"Review sheet: {args.review_output.resolve() if args.review_output else 'not requested'}")


if __name__ == "__main__":
    main()
