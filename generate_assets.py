"""Generate building PNG images using Pillow."""

import os
from PIL import Image, ImageDraw, ImageFont

SIZE = 120
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)


def draw_lemonade_stand():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Ground
    d.rounded_rectangle([5, 100, 115, 115], radius=5, fill=(136, 204, 68, 128))
    # Stand base
    d.rounded_rectangle([20, 60, 100, 100], radius=4, fill="#ffe566", outline="#ccad00", width=2)
    # Counter top
    d.rounded_rectangle([15, 55, 105, 65], radius=3, fill="#ffcc00", outline="#ccad00", width=2)
    # Roof (umbrella)
    d.polygon([(10, 32), (60, 8), (110, 32)], fill="#ff6b6b", outline="#cc4444")
    # Poles
    d.rectangle([22, 32, 26, 55], fill="#aa8844")
    d.rectangle([94, 32, 98, 55], fill="#aa8844")
    # Lemon
    d.ellipse([50, 34, 70, 50], fill="#fff44f", outline="#ccad00", width=2)
    # Cups
    for cx in [35, 56, 77]:
        d.rectangle([cx, 48, cx + 8, 56], fill="#ffffff", outline="#cccccc")
        d.rectangle([cx + 1, 50, cx + 7, 55], fill="#fff44f")
    # Sign
    d.rounded_rectangle([30, 68, 90, 88], radius=3, fill="#ffffff", outline="#ccad00")
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 10)
    except Exception:
        font = ImageFont.load_default()
    d.text((60, 78), "LEMONADE", fill="#cc8800", font=font, anchor="mm")
    return img


def draw_cookie_shop():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Ground
    d.rounded_rectangle([5, 100, 115, 115], radius=5, fill=(136, 204, 68, 128))
    # Building
    d.rounded_rectangle([15, 40, 105, 100], radius=4, fill="#e8a050", outline="#b87830", width=2)
    # Roof
    d.polygon([(5, 42), (60, 12), (115, 42)], fill="#c0522e", outline="#993a1e")
    # Door
    d.rounded_rectangle([48, 70, 72, 100], radius=3, fill="#8b5e3c", outline="#6b4530", width=2)
    d.ellipse([63, 84, 69, 90], fill="#ffcc00")
    # Windows
    for wx in [(22, 42), (78, 98)]:
        d.rounded_rectangle([wx[0], 52, wx[1], 70], radius=2, fill="#ffe8a0", outline="#b87830", width=2)
        mid = (wx[0] + wx[1]) // 2
        d.line([(mid, 52), (mid, 70)], fill="#b87830", width=1)
        d.line([(wx[0], 61), (wx[1], 61)], fill="#b87830", width=1)
    # Chimney
    d.rectangle([80, 14, 94, 34], fill="#994433", outline="#773322", width=2)
    # Cookie sign
    d.ellipse([42, 25, 78, 45], fill="#d4956a", outline="#b87830", width=2)
    for cx, cy, r in [(54, 33, 2), (62, 37, 2), (66, 31, 2), (56, 38, 2)]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill="#553322")
    return img


def draw_toy_store():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Ground
    d.rounded_rectangle([5, 100, 115, 115], radius=5, fill=(136, 204, 68, 128))
    # Building
    d.rounded_rectangle([12, 35, 108, 100], radius=4, fill="#6bc5ff", outline="#3a99dd", width=2)
    # Roof
    d.polygon([(5, 37), (60, 10), (115, 37)], fill="#4488cc", outline="#336699")
    # Door
    d.rounded_rectangle([46, 68, 74, 100], radius=4, fill="#ff6b6b", outline="#cc4444", width=2)
    d.ellipse([65, 83, 71, 89], fill="#ffcc00")
    # Windows
    d.rounded_rectangle([18, 45, 42, 67], radius=3, fill="#e0f4ff", outline="#3a99dd", width=2)
    d.rounded_rectangle([78, 45, 102, 67], radius=3, fill="#e0f4ff", outline="#3a99dd", width=2)
    # Teddy bear in left window
    d.ellipse([24, 50, 36, 62], fill="#cc8844")
    d.ellipse([22, 46, 30, 54], fill="#cc8844")
    d.ellipse([30, 46, 38, 54], fill="#cc8844")
    d.ellipse([27, 54, 29, 56], fill="#332211")
    d.ellipse([31, 54, 33, 56], fill="#332211")
    # Star in right window
    d.polygon([(90, 49), (92, 55), (98, 55), (93, 59), (95, 65), (90, 61), (85, 65), (87, 59), (82, 55), (88, 55)],
              fill="#ffcc00", outline="#ddaa00")
    # Sign
    d.rounded_rectangle([30, 18, 90, 34], radius=4, fill="#ff9944", outline="#dd7722", width=2)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 10)
    except Exception:
        font = ImageFont.load_default()
    d.text((60, 26), "TOY STORE", fill="#ffffff", font=font, anchor="mm")
    # Balloons
    d.ellipse([11, 13, 25, 27], fill=(255, 68, 102, 200))
    d.ellipse([95, 13, 109, 27], fill=(68, 221, 102, 200))
    d.line([(18, 27), (18, 38)], fill="#888888")
    d.line([(102, 27), (102, 38)], fill="#888888")
    return img


def draw_arcade():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Ground
    d.rounded_rectangle([5, 100, 115, 115], radius=5, fill=(136, 204, 68, 128))
    # Building
    d.rounded_rectangle([10, 30, 110, 100], radius=4, fill="#9955dd", outline="#7733bb", width=2)
    # Marquee
    d.rounded_rectangle([5, 22, 115, 36], radius=4, fill="#cc66ff", outline="#aa44dd", width=2)
    # Marquee lights
    colors = ["#ffee44", "#ff4466", "#44ddff", "#44ff66", "#ffee44", "#ff4466"]
    for i, c in enumerate(colors):
        cx = 18 + i * 16
        d.ellipse([cx - 3, 26, cx + 3, 32], fill=c)
    # Door
    d.rounded_rectangle([42, 65, 78, 100], radius=4, fill="#6622aa", outline="#551199", width=2)
    d.rounded_rectangle([46, 69, 74, 89], radius=2, fill=(187, 153, 238, 128))
    # Arcade cabinets
    for cx in [16, 82]:
        d.rounded_rectangle([cx, 45, cx + 22, 75], radius=2, fill="#333355", outline="#222244", width=2)
        d.rectangle([cx + 3, 48, cx + 19, 60], fill="#00ff88" if cx == 16 else "#4488ff")
        d.rectangle([cx + 6, 51, cx + 10, 55], fill="#ff0000")
        d.rectangle([cx + 12, 53, cx + 16, 57], fill="#ffff00")
    # Title
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12)
    except Exception:
        font = ImageFont.load_default()
    d.text((60, 18), "ARCADE", fill="#ffee44", font=font, anchor="mm")
    return img


def draw_theme_park():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Ground
    d.rounded_rectangle([5, 100, 115, 115], radius=5, fill=(136, 204, 68, 128))
    # Castle base
    d.rounded_rectangle([20, 45, 100, 100], radius=3, fill="#ff7088", outline="#dd4060", width=2)
    # Main tower
    d.rounded_rectangle([42, 22, 78, 100], radius=2, fill="#ff8899", outline="#dd4060", width=2)
    # Main tower roof
    d.polygon([(40, 24), (60, 4), (80, 24)], fill="#ff4466", outline="#dd2244")
    # Flag pole and flag
    d.line([(60, 4), (60, -2)], fill="#886644", width=2)
    d.polygon([(60, -4), (75, 0), (60, 4)], fill="#ffcc00")
    # Left turret
    d.rectangle([15, 38, 33, 68], fill="#ff8899", outline="#dd4060", width=2)
    d.polygon([(13, 40), (24, 24), (35, 40)], fill="#ff4466", outline="#dd2244")
    # Right turret
    d.rectangle([87, 38, 105, 68], fill="#ff8899", outline="#dd4060", width=2)
    d.polygon([(85, 40), (96, 24), (107, 40)], fill="#ff4466", outline="#dd2244")
    # Gate
    d.pieslice([48, 60, 72, 84], 180, 0, fill="#aa2244", outline="#881133", width=2)
    d.rectangle([48, 72, 72, 100], fill="#aa2244", outline="#881133", width=2)
    # Windows
    d.rounded_rectangle([53, 32, 67, 44], radius=7, fill="#ffeebb", outline="#dd4060", width=1)
    d.ellipse([20, 44, 28, 52], fill="#ffeebb", outline="#dd4060", width=1)
    d.ellipse([92, 44, 100, 52], fill="#ffeebb", outline="#dd4060", width=1)
    # Stars
    for sx, sy, r in [(30, 60, 3), (90, 60, 3), (60, 52, 2)]:
        d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=(255, 238, 68, 180))
    return img


def main():
    buildings = {
        "lemonade_stand": draw_lemonade_stand,
        "cookie_shop": draw_cookie_shop,
        "toy_store": draw_toy_store,
        "arcade": draw_arcade,
        "theme_park": draw_theme_park,
    }
    for name, draw_fn in buildings.items():
        img = draw_fn()
        path = os.path.join(ASSETS_DIR, f"{name}.png")
        img.save(path)
        print(f"Saved {path}")
    print("All assets generated!")


if __name__ == "__main__":
    main()
