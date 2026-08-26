from __future__ import annotations

import json
import shutil
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(r"E:\Nueva carpeta")
MAPPING_PATH = ROOT / ".artifacts" / "image_mapping_data.json"
REVIEW_DIR = ROOT / "public" / "images" / "product-review"
CATALOG_DIR = ROOT / "public" / "images" / "catalog"
DATA_PATH = ROOT / "src" / "data" / "image-review.json"
BACKUP_DIR = (
    ROOT
    / ".artifacts"
    / f"catalog-image-backup-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
)


def find_sources() -> dict[str, Path]:
    wanted = {row["file"] for row in json.loads(MAPPING_PATH.read_text(encoding="utf-8"))}
    found: dict[str, Path] = {}
    for path in SOURCE_ROOT.rglob("*"):
        if path.is_file() and path.name in wanted:
            found.setdefault(path.name, path)
    missing = sorted(wanted - found.keys())
    if missing:
        raise RuntimeError(f"Faltan {len(missing)} imágenes: {', '.join(missing)}")
    return found


def optimized_product_image(source: Path, destination: Path) -> None:
    with Image.open(source) as image:
        image.load()
        if image.mode in {"RGBA", "LA"} or "transparency" in image.info:
            rgba = image.convert("RGBA")
            background = Image.new("RGBA", rgba.size, "white")
            background.alpha_composite(rgba)
            image = background.convert("RGB")
        else:
            image = image.convert("RGB")
        image.thumbnail((900, 1200), Image.Resampling.LANCZOS)
        image.save(destination, "WEBP", quality=86, method=6)


def main() -> None:
    mapping: list[dict[str, str]] = json.loads(MAPPING_PATH.read_text(encoding="utf-8"))
    sources = find_sources()
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    by_slug: dict[str, list[dict[str, str]]] = defaultdict(list)
    review_rows: list[dict[str, str]] = []
    for row in mapping:
        source = sources[row["file"]]
        shutil.copy2(source, REVIEW_DIR / row["file"])
        by_slug[row["slug"]].append(row)
        review_rows.append(
            {
                **row,
                "imagePath": f"/images/product-review/{row['file']}",
                "productPath": f"/productos/{row['slug']}",
            }
        )

    role_priority = {"Principal": 0, "Producto y caja": 1, "Variante": 2, "Recarga": 3, "Secundaria": 4}
    for slug, candidates in by_slug.items():
        selected = min(
            candidates,
            key=lambda row: (
                role_priority.get(row.get("role", ""), 9),
                0 if row.get("confidence") == "Confirmado" else 1,
                row["file"],
            ),
        )
        destination = CATALOG_DIR / f"{slug}.webp"
        if destination.exists():
            shutil.copy2(destination, BACKUP_DIR / destination.name)
        optimized_product_image(sources[selected["file"]], destination)

    DATA_PATH.write_text(
        json.dumps(review_rows, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "reviewImages": len(review_rows),
                "catalogProductsUpdated": len(by_slug),
                "backup": str(BACKUP_DIR),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
