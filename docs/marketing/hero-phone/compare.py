"""Compare the hero phone replica render against the reference image.

Usage: python3 -I compare.py <reference.png|webp> <replica.png> <outDir>

Writes:
  overlay.png  - 50% onion skin (reference red-tinted, ours cyan-tinted)
  sidebyside.png - reference | ours on white
  edges.png    - 4x crops of left/right/bottom panel edges, reference above ours
Prints the mean luminance of each panel edge band (outside the panel, 0-12px)
for both images; the baseline gate is |delta| <= 1 on every side.
"""
import sys
from PIL import Image, ImageChops
import numpy as np

S = 1024
# Panel box at 1024 scale (measured from the reference).
PANEL = dict(left=287, right=735, top=34, bottom=998)


def load(p):
    im = Image.open(p).convert("RGBA").resize((S, S), Image.LANCZOS)
    white = Image.new("RGBA", im.size, (255, 255, 255, 255))
    white.alpha_composite(im)
    return white.convert("RGB")


def band(img, side, y_or_x):
    a = np.asarray(img).astype(float).mean(-1)
    if side == "left":
        return a[y_or_x[0]:y_or_x[1], PANEL["left"] - 12:PANEL["left"]].mean()
    if side == "right":
        return a[y_or_x[0]:y_or_x[1], PANEL["right"] + 1:PANEL["right"] + 13].mean()
    return a[PANEL["bottom"] + 1:PANEL["bottom"] + 13, y_or_x[0]:y_or_x[1]].mean()


def main(ref_path, ours_path, out):
    ref, ours = load(ref_path), load(ours_path)

    tint_r = ImageChops.multiply(ref, Image.new("RGB", ref.size, (255, 170, 170)))
    tint_o = ImageChops.multiply(ours, Image.new("RGB", ours.size, (170, 230, 255)))
    Image.blend(tint_r, tint_o, 0.5).save(f"{out}/overlay.png")

    side = Image.new("RGB", (S * 2, S), "white")
    side.paste(ref, (0, 0))
    side.paste(ours, (S, 0))
    side.save(f"{out}/sidebyside.png")

    crops = [
        (PANEL["left"] - 40, 600, PANEL["left"] + 40, 760),
        (PANEL["right"] - 40, 600, PANEL["right"] + 40, 760),
        (440, PANEL["bottom"] - 50, 600, PANEL["bottom"] + 20),
    ]
    tiles = []
    for c in crops:
        w, h = (c[2] - c[0]) * 4, (c[3] - c[1]) * 4
        tiles.append((ref.crop(c).resize((w, h), Image.NEAREST), ours.crop(c).resize((w, h), Image.NEAREST)))
    width = sum(t[0].width for t in tiles) + 20 * (len(tiles) - 1)
    height = max(t[0].height for t in tiles) * 2 + 20
    sheet = Image.new("RGB", (width, height), (230, 60, 60))
    x = 0
    for r, o in tiles:
        sheet.paste(r, (x, 0))
        sheet.paste(o, (x, r.height + 20))
        x += r.width + 20
    sheet.save(f"{out}/edges.png")

    # Rows/cols that only cross bare panel edge in both images (no overhanging bubble/card).
    for name, rng in (("left", (280, 455)), ("right", (300, 860)), ("bottom", (420, 600))):
        r, o = band(ref, name, rng), band(ours, name, rng)
        print(f"{name:6s} edge band  ref {r:6.2f}  ours {o:6.2f}  delta {o - r:+.2f}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
