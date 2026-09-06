"""One-off test: generate 3 sample ingredient images via Pollinations.ai's
anonymous image API, for a direct style comparison against the (failed)
Gemini gemini-2.5-flash-image test.

Endpoint / params verified against the official docs before writing this
script (github.com/pollinations/pollinations APIDOCS.md, cross-checked via
raw.githubusercontent.com) rather than assumed:

  GET https://image.pollinations.ai/prompt/{urlencoded_prompt}
  query params used here: model=flux, width=1280, height=720, seed=<fixed>
  - No signup/API key required for this anonymous usage.
  - nologo=true requires a registered account, so it is intentionally NOT
    used here (this run must stay anonymous, no account creation).
  - Anonymous rate limit per the docs: ~1 request / 15s -> this script
    sleeps between requests to respect that.
  - Docs note free-tier images may carry a watermark since 2025-03-31;
    that is expected here and is checked visually after the run.

Fixed to exactly 3 ingredient/type pairs (see SELECTED below) - do not
extend this without a separate approval, per the task's "3 images only"
guard.
"""

import sys
import time
import urllib.parse
from pathlib import Path

import requests

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
from generate_ingredient_images import parse_prompts, PROMPTS_FILE  # noqa: E402

REPO_ROOT = SCRIPT_DIR.parent
OUT_DIR = REPO_ROOT / "public" / "images" / "ingredients" / "_test_pollinations"

BASE_URL = "https://image.pollinations.ai/prompt/"
WIDTH = 1280
HEIGHT = 720
SEED = 42  # fixed (not random) so re-running this exact test is reproducible
MODEL = "flux"

# avocado:safety does not exist in the source doc (avocado is raw/texture
# only - no cooking, not choking-hazard-tagged) - swapped for korean_melon:safety
# per user decision, so all 3 requested types (raw/doneness/safety) are covered.
SELECTED = [
    ("apple", "raw"),
    ("chestnut", "doneness"),
    ("korean_melon", "safety"),
]

MIN_SECONDS_BETWEEN_REQUESTS = 16  # anonymous tier docs say ~1 req/15s


def build_url(prompt_text: str) -> str:
    single_line = " ".join(prompt_text.split())
    encoded = urllib.parse.quote(single_line, safe="")
    query = urllib.parse.urlencode(
        {"model": MODEL, "width": WIDTH, "height": HEIGHT, "seed": SEED}
    )
    return f"{BASE_URL}{encoded}?{query}"


def main():
    entries = parse_prompts(PROMPTS_FILE)
    by_key = {(e["ingredient_id"], e["type"]): e for e in entries}

    missing = [k for k in SELECTED if k not in by_key]
    if missing:
        print(f"ERROR: requested entries not found in prompts file: {missing}", file=sys.stderr)
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    results = []
    for idx, key in enumerate(SELECTED):
        ingredient_id, img_type = key
        entry = by_key[key]
        url = build_url(entry["prompt"])
        out_path = OUT_DIR / f"{ingredient_id}_{img_type}.jpg"

        print(f"-> requesting {ingredient_id}_{img_type} ...")
        print(f"   GET {url}")

        t0 = time.monotonic()
        error = None
        status_code = None
        headers = {}
        try:
            resp = requests.get(url, timeout=120)
            status_code = resp.status_code
            headers = dict(resp.headers)
            if resp.status_code == 200:
                out_path.write_bytes(resp.content)
            else:
                error = f"HTTP {resp.status_code}: {resp.text[:500]}"
        except requests.RequestException as e:
            error = str(e)
        elapsed = time.monotonic() - t0

        rate_limit_headers = {
            k: v for k, v in headers.items() if "rate" in k.lower() or k.lower() == "retry-after"
        }

        results.append(
            {
                "ingredient_id": ingredient_id,
                "type": img_type,
                "url": url,
                "status_code": status_code,
                "elapsed_s": round(elapsed, 2),
                "error": error,
                "out_path": str(out_path) if error is None else None,
                "rate_limit_headers": rate_limit_headers,
            }
        )

        if error:
            print(f"   ERROR: {error}")
        else:
            print(f"   saved: {out_path} (status={status_code}, {elapsed:.2f}s, {out_path.stat().st_size} bytes)")
        if rate_limit_headers:
            print(f"   rate-limit headers: {rate_limit_headers}")

        if idx < len(SELECTED) - 1:
            time.sleep(MIN_SECONDS_BETWEEN_REQUESTS)

    print("\n=== summary ===")
    for r in results:
        print(r)


if __name__ == "__main__":
    main()
