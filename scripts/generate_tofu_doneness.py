"""One-off generator for the single missing public/images/ingredients/tofu/tofu_doneness.png.

Calls Gemini (gemini-2.5-flash-image) with the fixed doneness prompt, then applies
the same crop ratio as watermark_auto_crop.html (left 15.12% / top 12.24% /
width 73.84% / height 74.35%) and resizes to 1280x720, matching the existing
image set's convention.
"""

import os
import sys
from io import BytesIO
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = REPO_ROOT / "public" / "images" / "ingredients" / "tofu" / "tofu_doneness.png"
MODEL = "gemini-2.5-flash-image"

FIXED_CROP = {"left": 0.1512, "top": 0.1224, "width": 0.7384, "height": 0.7435}

PROMPT = (
    "Photorealistic overhead food photography showing a clear side-by-side comparison "
    "on a plain flat light wood cutting board with no grooves or cutouts: left side has "
    "a small cube of raw firm tofu, pale ivory-white color, smooth firm surface holding "
    "its cube shape. Right side has the same tofu after steaming or boiling, visibly "
    "softer, slightly glistening, easily pressed or mashed with the side of a spoon to "
    "show it gives way easily and is no longer firm. The firmness and surface texture "
    "difference between raw (left) and cooked (right) must be clearly visible at a "
    "glance. No added color overlays or warning icons, no fork, no hand or arm visible "
    "in frame. No visible oil sheen, no salt crystals, no seasoning, no garnish. "
    "Photorealistic overhead food photography, warm natural daylight from a window, "
    "plain out-of-focus neutral kitchen background with no extra props, no bowls, no "
    "jars, no cloth, no utensils other than what is specified, no text, no watermark, "
    "no logo, no icon, no sparkle, shallow depth of field, high detail, DSLR quality, "
    "warm natural color grading. The subject is moderately sized within the frame, "
    "occupying roughly the center 50% of the image, with generous empty plain "
    "background space on all four sides. Wide 16:9 landscape composition, subject "
    "centered with equal breathing room on all sides, no vertical framing, no square "
    "framing."
)


def main():
    if OUT_PATH.exists():
        print(f"skip (exists): {OUT_PATH}")
        return

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    from google import genai
    from google.genai import errors as genai_errors
    from PIL import Image

    client = genai.Client(api_key=api_key)

    print("무료 한도 내 실행 — 결제 미연동 확인됨, 예상 비용 $0")
    print(f"model={MODEL}, images to generate=1 (tofu/doneness)")

    try:
        response = client.models.generate_content(model=MODEL, contents=[PROMPT])
    except genai_errors.ClientError as err:
        if getattr(err, "code", None) == 429:
            print("ERROR: quota exceeded (429).", file=sys.stderr)
            print(str(err), file=sys.stderr)
            sys.exit(1)
        raise

    image_bytes = None
    for part in response.candidates[0].content.parts:
        if getattr(part, "inline_data", None) is not None:
            image_bytes = part.inline_data.data
            break

    if image_bytes is None:
        print("ERROR: no image returned.", file=sys.stderr)
        sys.exit(1)

    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    crop_x = w * FIXED_CROP["left"]
    crop_y = h * FIXED_CROP["top"]
    crop_w = w * FIXED_CROP["width"]
    crop_h = h * FIXED_CROP["height"]
    cropped = img.crop((crop_x, crop_y, crop_x + crop_w, crop_y + crop_h))
    resized = cropped.resize((1280, 720), Image.LANCZOS)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    resized.save(OUT_PATH, "PNG")
    print(f"   saved: {OUT_PATH} ({OUT_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
