"""Generate building PNG images using Pillow at high resolution."""

import os
from PIL import Image, ImageDraw, ImageFont

SIZE = 240  # Draw at 2x, will be scaled down for crisp display
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

try:
    FONT = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
    FONT_SM = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
except Exception:
    FONT = ImageFont.load_default()
    FONT_SM = FONT


def draw_lemonade_stand():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Poles
    d.rectangle([44, 55, 52, 120], fill="#8B7355", outline="#6B5340", width=1)
    d.rectangle([188, 55, 196, 120], fill="#8B7355", outline="#6B5340", width=1)

    # Striped awning
    stripe_colors = ["#FF5555", "#FFFFFF", "#FF5555", "#FFFFFF", "#FF5555"]
    aw_top, aw_bot = 35, 62
    stripe_w = (210 - 30) // len(stripe_colors)
    for i, c in enumerate(stripe_colors):
        x1 = 30 + i * stripe_w
        x2 = x1 + stripe_w
        d.polygon([(x1, aw_bot), (x2, aw_bot),
                   (x2 - 6, aw_top + 4), (x1 - 6, aw_top + 4)], fill=c)
    # Awning outline
    d.line([(24, aw_bot + 2), (216, aw_bot + 2)], fill="#CC3333", width=3)
    # Awning scallop edge
    for x in range(30, 210, 20):
        d.arc([x - 10, aw_bot - 4, x + 10, aw_bot + 8], 0, 180, fill="#CC3333", width=2)

    # Counter / stand body
    d.rounded_rectangle([32, 120, 208, 195], radius=6, fill="#FFE566", outline="#D4A800", width=3)
    # Counter top - wood plank look
    d.rounded_rectangle([26, 110, 214, 125], radius=4, fill="#FFCC00", outline="#D4A800", width=3)
    # Wood grain lines on counter
    d.line([(34, 117), (206, 117)], fill="#E6B800", width=1)

    # Pitcher
    d.rounded_rectangle([65, 80, 85, 110], radius=4, fill="#FFFFFF", outline="#CCCCCC", width=2)
    d.rounded_rectangle([67, 85, 83, 108], radius=3, fill="#FFF44F")
    # Pitcher handle
    d.arc([80, 85, 95, 105], 270, 90, fill="#CCCCCC", width=2)

    # Cups on counter
    for cx in [105, 135, 165]:
        d.rounded_rectangle([cx, 93, cx + 16, 110], radius=2, fill="#FFFFFF", outline="#DDDDDD", width=2)
        d.rounded_rectangle([cx + 2, 96, cx + 14, 108], radius=2, fill="#FFF44F")
        # Straw
        d.line([(cx + 8, 88), (cx + 10, 98)], fill="#FF6666", width=2)

    # Sign on front
    d.rounded_rectangle([55, 140, 185, 175], radius=6, fill="#FFFFFF", outline="#D4A800", width=2)
    d.text((120, 157), "LEMONADE", fill="#CC8800", font=FONT, anchor="mm")

    # Lemon decoration on top
    d.ellipse([105, 38, 135, 58], fill="#FFF44F", outline="#D4A800", width=2)
    # Leaf
    d.polygon([(132, 38), (142, 30), (138, 42)], fill="#66BB44")

    return img


def draw_cookie_shop():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Main building wall
    d.rectangle([24, 75, 216, 200], fill="#E8A050", outline="#C07830", width=3)
    # Wall texture - horizontal brick lines
    for y in range(88, 200, 16):
        d.line([(27, y), (213, y)], fill="#D49040", width=1)

    # Roof
    d.polygon([(14, 78), (120, 18), (226, 78)], fill="#C0522E", outline="#8B3A1E", width=3)
    # Roof shingle lines
    for y in range(35, 78, 12):
        t = (y - 18) / (78 - 18)
        lx = int(14 + (120 - 14) * (1 - t))
        rx = int(120 + (226 - 120) * t)
        d.line([(lx + 5, y), (rx - 5, y)], fill="#A04020", width=1)

    # Chimney
    d.rectangle([160, 22, 185, 60], fill="#884433", outline="#663322", width=2)
    d.rectangle([155, 18, 190, 28], fill="#884433", outline="#663322", width=2)
    # Smoke puffs
    d.ellipse([170, 4, 186, 18], fill=(200, 200, 200, 100))
    d.ellipse([178, -4, 192, 10], fill=(200, 200, 200, 70))

    # Door
    d.rounded_rectangle([92, 138, 148, 200], radius=5, fill="#6B4530", outline="#4A3020", width=3)
    # Door panels
    d.rounded_rectangle([98, 144, 142, 168], radius=3, fill="#7B5540", outline="#5A3828", width=1)
    d.rounded_rectangle([98, 174, 142, 196], radius=3, fill="#7B5540", outline="#5A3828", width=1)
    # Doorknob
    d.ellipse([133, 175, 141, 183], fill="#FFD700", outline="#CCA800", width=1)

    # Windows
    for wx1, wx2 in [(34, 78), (162, 206)]:
        # Window frame
        d.rounded_rectangle([wx1, 95, wx2, 130], radius=3, fill="#FFEEBB", outline="#C07830", width=3)
        # Window panes
        mid_x = (wx1 + wx2) // 2
        mid_y = 112
        d.line([(mid_x, 98), (mid_x, 127)], fill="#C07830", width=2)
        d.line([(wx1 + 3, mid_y), (wx2 - 3, mid_y)], fill="#C07830", width=2)
        # Shutters
        d.rectangle([wx1 - 8, 95, wx1 - 2, 130], fill="#2E8B57", outline="#1E6B40", width=1)
        d.rectangle([wx2 + 2, 95, wx2 + 8, 130], fill="#2E8B57", outline="#1E6B40", width=1)

    # Cookie sign above door
    d.ellipse([88, 60, 152, 90], fill="#D4956A", outline="#A06030", width=3)
    # Chocolate chips
    for cx, cy in [(108, 72), (125, 80), (135, 68), (115, 82), (130, 75)]:
        d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill="#3B2010")

    return img


def draw_toy_store():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Main building
    d.rectangle([18, 65, 222, 200], fill="#6BC5FF", outline="#3A99DD", width=3)

    # Roof
    d.polygon([(8, 68), (120, 14), (232, 68)], fill="#4488CC", outline="#2E6699", width=3)
    # Roof lines
    for y in range(28, 68, 10):
        t = (y - 14) / (68 - 14)
        lx = int(8 + (120 - 8) * (1 - t))
        rx = int(120 + (232 - 120) * t)
        d.line([(lx + 5, y), (rx - 5, y)], fill="#3B78B0", width=1)

    # Door
    d.rounded_rectangle([90, 132, 150, 200], radius=6, fill="#FF6B6B", outline="#CC4444", width=3)
    d.rounded_rectangle([96, 138, 144, 170], radius=3, fill="#FF8888", outline="#CC4444", width=1)
    d.ellipse([137, 168, 145, 176], fill="#FFD700")
    # Door window
    d.rounded_rectangle([102, 140, 138, 164], radius=3, fill="#FFE0E0", outline="#CC4444", width=1)

    # Display windows
    for wx1, wx2 in [(28, 80), (160, 212)]:
        d.rounded_rectangle([wx1, 82, wx2, 125], radius=4, fill="#E8F6FF", outline="#3A99DD", width=3)

    # Teddy bear in left window
    d.ellipse([42, 94, 66, 118], fill="#CC8844", outline="#AA6622", width=2)
    # Bear head
    d.ellipse([46, 82, 62, 98], fill="#CC8844", outline="#AA6622", width=2)
    # Bear ears
    d.ellipse([44, 80, 52, 88], fill="#CC8844", outline="#AA6622", width=1)
    d.ellipse([56, 80, 64, 88], fill="#CC8844", outline="#AA6622", width=1)
    # Bear eyes and nose
    d.ellipse([50, 87, 53, 90], fill="#221100")
    d.ellipse([57, 87, 60, 90], fill="#221100")
    d.ellipse([53, 92, 57, 95], fill="#221100")

    # Blocks in right window
    d.rectangle([172, 104, 188, 120], fill="#FF4444", outline="#CC2222", width=2)
    d.rectangle([186, 104, 202, 120], fill="#44CC44", outline="#228822", width=2)
    d.rectangle([179, 88, 195, 104], fill="#4488FF", outline="#2266CC", width=2)
    d.text((180, 112), "A", fill="#FFFFFF", font=FONT_SM, anchor="mm")
    d.text((194, 112), "B", fill="#FFFFFF", font=FONT_SM, anchor="mm")

    # Sign
    d.rounded_rectangle([55, 32, 185, 58], radius=6, fill="#FF9944", outline="#DD7722", width=2)
    d.text((120, 45), "TOY STORE", fill="#FFFFFF", font=FONT, anchor="mm")

    # Balloons
    for bx, col in [(22, "#FF4466"), (218, "#44DD66")]:
        d.ellipse([bx - 12, 18, bx + 12, 48], fill=col, outline=None)
        # Balloon highlight
        d.ellipse([bx - 6, 24, bx, 32], fill=(255, 255, 255, 80))
        d.line([(bx, 48), (bx, 68)], fill="#888888", width=1)

    return img


def draw_arcade():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Main building
    d.rectangle([16, 50, 224, 200], fill="#7744BB", outline="#5522AA", width=3)
    # Building gradient effect - darker at bottom
    for y in range(160, 200):
        alpha = int((y - 160) * 2)
        d.line([(19, y), (221, y)], fill=(0, 0, 0, alpha), width=1)

    # Marquee banner
    d.rounded_rectangle([8, 34, 232, 56], radius=6, fill="#CC66FF", outline="#9933CC", width=3)
    # Marquee lights
    light_colors = ["#FFEE44", "#FF4466", "#44EEFF", "#44FF66", "#FFEE44", "#FF4466", "#44EEFF"]
    for i, c in enumerate(light_colors):
        cx = 28 + i * 28
        d.ellipse([cx - 5, 38, cx + 5, 50], fill=c, outline="#00000030", width=1)

    # ARCADE text
    d.text((120, 26), "ARCADE", fill="#FFEE44", font=FONT, anchor="mm")

    # Main entrance
    d.rounded_rectangle([78, 120, 162, 200], radius=8, fill="#4411AA", outline="#330088", width=3)
    # Glass doors
    d.rounded_rectangle([84, 126, 118, 196], radius=4, fill=(160, 130, 220, 160), outline="#5522AA", width=2)
    d.rounded_rectangle([122, 126, 156, 196], radius=4, fill=(160, 130, 220, 160), outline="#5522AA", width=2)

    # Arcade cabinet left
    d.rounded_rectangle([24, 72, 66, 130], radius=3, fill="#222244", outline="#111133", width=2)
    # Screen
    d.rectangle([29, 76, 61, 100], fill="#001100")
    d.rectangle([30, 77, 60, 99], fill="#00CC44")
    # Pixel characters
    for px, py, pc in [(36, 82, "#FFFF00"), (48, 88, "#FF0000"), (42, 94, "#00FFFF")]:
        d.rectangle([px, py, px + 6, py + 6], fill=pc)
    # Joystick area
    d.rectangle([29, 104, 61, 126], fill="#333355")
    d.ellipse([40, 108, 50, 118], fill="#FF0000")

    # Arcade cabinet right
    d.rounded_rectangle([174, 72, 216, 130], radius=3, fill="#222244", outline="#111133", width=2)
    d.rectangle([179, 76, 211, 100], fill="#001100")
    d.rectangle([180, 77, 210, 99], fill="#4488FF")
    for px, py, pc in [(186, 84, "#FFFF00"), (198, 80, "#FF8800"), (192, 90, "#FFFFFF")]:
        d.rectangle([px, py, px + 6, py + 6], fill=pc)
    d.rectangle([179, 104, 211, 126], fill="#333355")
    d.ellipse([190, 108, 200, 118], fill="#00FF00")

    # Neon border at top
    d.line([(16, 50), (224, 50)], fill="#FF66FF", width=2)
    d.line([(16, 200), (224, 200)], fill="#FF66FF", width=2)

    return img


def draw_theme_park():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Castle base wall
    d.rectangle([30, 85, 210, 200], fill="#FF8899", outline="#DD4060", width=3)
    # Stone pattern
    for y in range(100, 200, 18):
        d.line([(33, y), (207, y)], fill="#FF7088", width=1)
        offset = 20 if (y // 18) % 2 == 0 else 30
        for x in range(33 + offset, 207, 40):
            d.line([(x, y), (x, y + 18)], fill="#FF7088", width=1)

    # Main tower
    d.rectangle([82, 35, 158, 200], fill="#FFAABB", outline="#DD4060", width=3)

    # Main tower roof
    d.polygon([(76, 40), (120, 4), (164, 40)], fill="#FF4466", outline="#CC2244", width=3)
    # Flag
    d.line([(120, 4), (120, -10)], fill="#8B7355", width=3)
    d.polygon([(120, -10), (145, -2), (120, 6)], fill="#FFD700", outline="#CCA800", width=1)

    # Left turret
    d.rectangle([22, 65, 50, 130], fill="#FFAABB", outline="#DD4060", width=2)
    d.polygon([(18, 68), (36, 42), (54, 68)], fill="#FF4466", outline="#CC2244", width=2)
    # Turret crenellations
    for x in [22, 34]:
        d.rectangle([x, 60, x + 8, 68], fill="#FFAABB", outline="#DD4060", width=1)

    # Right turret
    d.rectangle([190, 65, 218, 130], fill="#FFAABB", outline="#DD4060", width=2)
    d.polygon([(186, 68), (204, 42), (222, 68)], fill="#FF4466", outline="#CC2244", width=2)
    for x in [190, 202]:
        d.rectangle([x, 60, x + 8, 68], fill="#FFAABB", outline="#DD4060", width=1)

    # Main gate
    d.pieslice([95, 130, 145, 170], 180, 0, fill="#882244", outline="#661133", width=2)
    d.rectangle([95, 150, 145, 200], fill="#882244", outline="#661133", width=2)
    # Gate door lines
    d.line([(120, 135), (120, 200)], fill="#661133", width=2)
    # Gate arch stones
    d.arc([93, 128, 147, 172], 180, 0, fill="#AA3355", width=3)

    # Tower window (arched)
    d.pieslice([102, 55, 138, 85], 180, 0, fill="#FFEEBB", outline="#DD4060", width=2)
    d.rectangle([102, 70, 138, 90], fill="#FFEEBB", outline="#DD4060", width=2)
    # Window cross
    d.line([(120, 58), (120, 90)], fill="#DD4060", width=2)
    d.line([(105, 75), (135, 75)], fill="#DD4060", width=2)

    # Turret windows
    d.ellipse([30, 80, 42, 95], fill="#FFEEBB", outline="#DD4060", width=2)
    d.ellipse([198, 80, 210, 95], fill="#FFEEBB", outline="#DD4060", width=2)

    # Wall windows
    for wx in [48, 170]:
        d.rounded_rectangle([wx, 110, wx + 22, 130], radius=3, fill="#FFEEBB", outline="#DD4060", width=2)

    # Decorative banner between turrets
    d.line([(50, 90), (82, 100)], fill="#FFD700", width=2)
    d.line([(158, 100), (190, 90)], fill="#FFD700", width=2)

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
        print(f"Saved {path} ({img.size[0]}x{img.size[1]})")
    print("All assets generated!")


if __name__ == "__main__":
    main()
