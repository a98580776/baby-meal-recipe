"""Generate ingredient images from public/images/ingredients/remaining-32-ingredients-prompts.md
using Gemini (gemini-2.5-flash-image), writing to public/images/ingredients/{id}/{id}_{type}.png
(matches the existing convention, e.g. public/images/ingredients/carrot/carrot_doneness.png).

Usage:
  python scripts/generate_ingredient_images.py                              # full run (all parsed prompts, skip existing)
  python scripts/generate_ingredient_images.py --select apple:raw,chestnut:doneness --out-dir public/images/ingredients/_test
  python scripts/generate_ingredient_images.py --list                       # parse only, print what would be generated

Safety guards (do not remove without re-reading CLAUDE.md safety/cost rules):
  - GEMINI_API_KEY must be set; the key value itself is never logged.
  - MAX_IMAGES_PER_RUN caps how many images a single invocation may request.
  - Existing files are never overwritten.
  - A 429 (quota exceeded) aborts immediately; no retry loop.
"""

import argparse
import os
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
PROMPTS_FILE = REPO_ROOT / "public" / "images" / "ingredients" / "remaining-32-ingredients-prompts.md"
DEFAULT_OUT_ROOT = REPO_ROOT / "public" / "images" / "ingredients"
MODEL = "gemini-2.5-flash-image"

# Intentionally low for this run only (test batch). Raise deliberately for the
# full 43-image batch in a later, separately-approved run.
MAX_IMAGES_PER_RUN = 3

KNOWN_TYPES = ["doneness", "texture", "safety", "raw"]

HEADER_RE = re.compile(r"^##\s+(.*)$")
BRACKET_PREFIX_RE = re.compile(r"^\[[^\]]*\]\s*")
BOLD_RE = re.compile(r"^\*\*(.+?)\*\*\s*$")
PAREN_HEADER_RE = re.compile(r"^([a-zA-Z0-9_]+)\s*\(.+\)\s*$")
PLAIN_IDENT_RE = re.compile(r"^([a-zA-Z0-9_]+)$")


def slugify_type(raw_label: str) -> str:
    token = raw_label.strip().split("(")[0].strip()
    token = token.split()[0] if token.split() else token
    token = re.sub(r"[^a-zA-Z0-9_+]", "_", token).lower()
    return token


def _read_code_block(lines, start_idx):
    """From start_idx, skip forward to the next ``` fence and return
    (prompt_text, index_after_closing_fence), or (None, start_idx) if no
    fence is found before the next header/bold line."""
    j = start_idx
    n = len(lines)
    while j < n:
        stripped = lines[j].strip()
        if stripped.startswith("```"):
            j += 1
            code_lines = []
            while j < n and not lines[j].strip().startswith("```"):
                code_lines.append(lines[j])
                j += 1
            j += 1  # skip closing fence
            return "\n".join(code_lines).strip(), j
        if HEADER_RE.match(lines[j]) or BOLD_RE.match(stripped):
            return None, start_idx
        j += 1
    return None, start_idx


def parse_prompts(md_path: Path):
    text = md_path.read_text(encoding="utf-8")
    lines = text.split("\n")
    n = len(lines)
    entries = []

    current_section_id = None
    current_section_is_multi = False

    i = 0
    while i < n:
        line = lines[i]
        m = HEADER_RE.match(line)
        if m:
            header_content = BRACKET_PREFIX_RE.sub("", m.group(1).strip()).strip()

            paren_m = PAREN_HEADER_RE.match(header_content)
            ident_m = PLAIN_IDENT_RE.match(header_content) if not paren_m else None

            if paren_m:
                # "## id (한글명)" section — one or more **type** sub-blocks follow.
                current_section_id = paren_m.group(1)
                current_section_is_multi = True
            elif ident_m:
                # "## [note] id_type" section — id_type still has a **type (...)**
                # sub-header before its code fence (matches the trailing type
                # suffix here), so parse it the same way as the paren case.
                full_id = ident_m.group(1)
                ingredient_id = full_id
                for t in KNOWN_TYPES:
                    suffix = "_" + t
                    if full_id.endswith(suffix):
                        ingredient_id = full_id[: -len(suffix)]
                        break
                current_section_id = ingredient_id
                current_section_is_multi = True
            else:
                current_section_id = None
                current_section_is_multi = False
            i += 1
            continue

        bm = BOLD_RE.match(line.strip())
        if bm and current_section_is_multi and current_section_id:
            type_slug = slugify_type(bm.group(1))
            prompt, j = _read_code_block(lines, i + 1)
            if prompt:
                entries.append({"ingredient_id": current_section_id, "type": type_slug, "prompt": prompt})
            i = j
            continue

        i += 1

    return entries


def select_entries(entries, select_arg):
    if not select_arg:
        return entries
    wanted = []
    for pair in select_arg.split(","):
        pair = pair.strip()
        if not pair:
            continue
        if ":" not in pair:
            raise ValueError(f"--select entries must be 'ingredient_id:type', got: {pair!r}")
        ing, typ = pair.split(":", 1)
        wanted.append((ing.strip(), typ.strip()))

    by_key = {(e["ingredient_id"], e["type"]): e for e in entries}
    selected = []
    missing = []
    for key in wanted:
        if key in by_key:
            selected.append(by_key[key])
        else:
            missing.append(key)
    if missing:
        raise ValueError(f"requested entries not found in prompts file: {missing}")
    return selected


def load_api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        print(
            "ERROR: GEMINI_API_KEY environment variable is not set. "
            "Set it (e.g. `setx GEMINI_API_KEY \"...\"` then restart the shell) and retry.",
            file=sys.stderr,
        )
        sys.exit(1)
    return key


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--select",
        help="Comma-separated ingredient_id:type pairs to restrict generation to, e.g. "
        "'apple:raw,chestnut:doneness,korean_melon:safety'. Omit to run the full parsed set.",
    )
    parser.add_argument(
        "--out-dir",
        default=str(DEFAULT_OUT_ROOT),
        help=f"Root output directory (default: {DEFAULT_OUT_ROOT})",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="Parse and print the entries that would be generated, without calling the API.",
    )
    args = parser.parse_args()

    entries = parse_prompts(PROMPTS_FILE)
    try:
        entries = select_entries(entries, args.select)
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

    out_root = Path(args.out_dir)

    if args.list:
        for e in entries:
            path = out_root / e["ingredient_id"] / f"{e['ingredient_id']}_{e['type']}.png"
            exists = path.exists()
            print(f"{e['ingredient_id']:20s} {e['type']:15s} -> {path} (exists={exists})")
        print(f"total parsed: {len(entries)}")
        return

    todo = []
    for e in entries:
        out_path = out_root / e["ingredient_id"] / f"{e['ingredient_id']}_{e['type']}.png"
        if out_path.exists():
            print(f"skip (exists): {out_path}")
            continue
        todo.append((e, out_path))

    if not todo:
        print("Nothing to generate (all target files already exist).")
        return

    if len(todo) > MAX_IMAGES_PER_RUN:
        raise RuntimeError(
            f"Refusing to run: {len(todo)} images requested but MAX_IMAGES_PER_RUN={MAX_IMAGES_PER_RUN}. "
            "Narrow the request with --select or raise the constant deliberately for an approved larger run."
        )

    api_key = load_api_key()

    from google import genai
    from google.genai import errors as genai_errors

    client = genai.Client(api_key=api_key)

    print("무료 한도 내 실행 — 결제 미연동 확인됨, 예상 비용 $0")
    print(f"model={MODEL}, images to generate={len(todo)}")

    for e, out_path in todo:
        print(f"-> generating {e['ingredient_id']}/{e['type']} ...")
        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=[e["prompt"]],
            )
        except genai_errors.ClientError as err:
            if getattr(err, "code", None) == 429:
                print(f"ERROR: quota exceeded (429) while generating {e['ingredient_id']}/{e['type']}.", file=sys.stderr)
                print(str(err), file=sys.stderr)
                sys.exit(1)
            raise

        image_bytes = None
        for part in response.candidates[0].content.parts:
            if getattr(part, "inline_data", None) is not None:
                image_bytes = part.inline_data.data
                break

        if image_bytes is None:
            print(f"ERROR: no image returned for {e['ingredient_id']}/{e['type']}.", file=sys.stderr)
            sys.exit(1)

        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(image_bytes)
        print(f"   saved: {out_path} ({len(image_bytes)} bytes)")

    print("Done.")


if __name__ == "__main__":
    main()
