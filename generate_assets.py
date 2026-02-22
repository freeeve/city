"""Generate building PNG images using Pillow at high resolution."""

import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SIZE = 360  # Draw at 3x for maximum detail
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

try:
    FONT = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
    FONT_SM = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    FONT_XS = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12)
except Exception:
    FONT = ImageFont.load_default()
    FONT_SM = FONT
    FONT_XS = FONT


def add_shadow(img, offset=4, blur=6):
    """Add a drop shadow under the building."""
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    # Use the alpha channel of the original as shadow shape
    alpha = img.split()[3]
    shadow.paste((0, 0, 0, 50), (offset, offset), alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    # Composite: shadow behind original
    result = Image.alpha_composite(shadow, img)
    return result


def draw_lemonade_stand():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ground / grass patch
    d.ellipse([20, 265, 340, 320], fill=(130, 195, 80, 100))

    # Wooden poles with grain
    for px in [62, 282]:
        d.rectangle([px, 80, px + 12, 180], fill="#9B8365", outline="#7B6345", width=2)
        for gy in range(85, 175, 12):
            d.line([(px + 2, gy), (px + 10, gy + 4)], fill="#8B7355", width=1)

    # Striped awning with depth
    stripe_colors = ["#FF4444", "#FFFFFF", "#FF4444", "#FFFFFF", "#FF4444", "#FFFFFF", "#FF4444"]
    aw_top, aw_bot = 48, 92
    stripe_w = (320 - 36) // len(stripe_colors)
    for i, c in enumerate(stripe_colors):
        x1 = 36 + i * stripe_w
        x2 = x1 + stripe_w
        d.polygon([(x1, aw_bot), (x2, aw_bot),
                   (x2 - 8, aw_top + 4), (x1 - 8, aw_top + 4)], fill=c)
    # Awning front bar
    d.rounded_rectangle([30, aw_bot, 326, aw_bot + 6], radius=3, fill="#CC2222")
    # Scallop trim
    for x in range(40, 320, 24):
        d.arc([x - 12, aw_bot + 1, x + 12, aw_bot + 14], 0, 180, fill="#CC2222", width=2)

    # Counter body - wood panels
    d.rounded_rectangle([46, 180, 310, 290], radius=8, fill="#FFE070", outline="#D4A800", width=3)
    # Vertical wood plank lines
    for px in range(80, 300, 40):
        d.line([(px, 184), (px, 286)], fill="#E6C040", width=1)
    # Counter top surface
    d.rounded_rectangle([36, 166, 320, 184], radius=5, fill="#FFCC00", outline="#D4A800", width=3)
    # Counter top shine
    d.line([(46, 174), (310, 174)], fill="#FFE060", width=2)

    # Ice bucket
    d.rounded_rectangle([50, 130, 80, 166], radius=4, fill="#C0D8E8", outline="#90B0C8", width=2)
    d.rounded_rectangle([52, 135, 78, 160], radius=3, fill="#E0F0FF")
    # Ice cubes
    for ix, iy in [(56, 138), (64, 142), (58, 148)]:
        d.rectangle([ix, iy, ix + 8, iy + 7], fill=(220, 240, 255, 180), outline="#B0D0E0")

    # Pitcher
    d.rounded_rectangle([95, 115, 125, 165], radius=6, fill="#FFFFFF", outline="#CCCCCC", width=2)
    d.rounded_rectangle([98, 122, 122, 162], radius=4, fill="#FFF44F")
    # Pitcher handle
    d.arc([118, 125, 140, 155], 270, 90, fill="#BBBBBB", width=3)
    # Pitcher lip
    d.arc([92, 110, 128, 125], 200, 340, fill="#CCCCCC", width=2)

    # Cups with lemonade and straws
    for cx in [150, 195, 240]:
        # Cup
        d.rounded_rectangle([cx, 138, cx + 24, 166], radius=3, fill="#FFFFFF", outline="#DDDDDD", width=2)
        # Lemonade
        d.rounded_rectangle([cx + 3, 143, cx + 21, 163], radius=2, fill="#FFF44F")
        # Lemon slice
        d.ellipse([cx + 7, 140, cx + 17, 150], fill="#FFE820", outline="#D4B000", width=1)
        # Straw
        d.line([(cx + 12, 128), (cx + 15, 145)], fill="#FF5566", width=3)
        # Cup highlight
        d.line([(cx + 4, 145), (cx + 4, 160)], fill=(255, 255, 255, 120), width=1)

    # Sign on front panel
    d.rounded_rectangle([80, 205, 276, 250], radius=8, fill="#FFFFFF", outline="#D4A800", width=2)
    # Sign inner border
    d.rounded_rectangle([86, 210, 270, 245], radius=6, outline="#FFE060", width=1)
    d.text((178, 227), "LEMONADE", fill="#CC8800", font=FONT, anchor="mm")
    # Price tag
    d.rounded_rectangle([112, 252, 244, 272], radius=4, fill=(255, 255, 255, 180), outline="#D4A800", width=1)
    d.text((178, 262), "Fresh & Cold!", fill="#E8A020", font=FONT_XS, anchor="mm")

    # Lemon decorations on awning
    for lx in [100, 180, 260]:
        d.ellipse([lx - 14, 54, lx + 14, 78], fill="#FFF44F", outline="#D4A800", width=2)
        d.polygon([(lx + 10, 54), (lx + 22, 44), (lx + 18, 60)], fill="#66BB44")
        # Lemon segment lines
        d.line([(lx, 58), (lx, 74)], fill="#E8D830", width=1)
        d.line([(lx - 6, 62), (lx + 6, 70)], fill="#E8D830", width=1)

    return add_shadow(img)


def draw_ice_cream_truck():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ground
    d.ellipse([15, 275, 345, 325], fill=(130, 195, 80, 100))

    # Truck body
    d.rounded_rectangle([40, 120, 300, 270], radius=10, fill="#FFB6C8", outline="#E8849E", width=3)
    # Horizontal stripe
    d.rectangle([40, 185, 300, 210], fill="#FF8FAA", outline="#E8849E", width=1)

    # Cab section (front)
    d.rounded_rectangle([255, 145, 330, 270], radius=8, fill="#FF99B5", outline="#E8849E", width=3)
    # Windshield
    d.rounded_rectangle([268, 155, 322, 200], radius=5, fill="#C8E8FF", outline="#88AAC8", width=2)
    # Windshield reflection
    d.line([(275, 160), (285, 195)], fill=(255, 255, 255, 100), width=2)
    # Headlight
    d.ellipse([310, 225, 326, 240], fill="#FFEE88", outline="#DDCC66", width=2)

    # Serving window
    d.rounded_rectangle([70, 135, 170, 180], radius=6, fill="#FFEEBB", outline="#E8849E", width=3)
    # Window awning
    d.polygon([(62, 135), (178, 135), (172, 120), (68, 120)], fill="#FF5588", outline="#DD3366", width=2)
    # Scallop trim
    for x in range(68, 175, 16):
        d.arc([x - 8, 131, x + 8, 142], 0, 180, fill="#DD3366", width=2)

    # Ice cream cone on side
    d.polygon([(190, 230), (215, 150), (240, 230)], fill="#E8C880", outline="#C8A860", width=2)
    # Waffle pattern
    for y in range(165, 228, 10):
        t = (y - 150) / 80
        lx = int(190 + (215 - 190) * (1 - t))
        rx = int(240 - (240 - 215) * (1 - t))
        d.line([(lx + 3, y), (rx - 3, y)], fill="#D8B870", width=1)
    # Scoops
    d.ellipse([195, 128, 235, 168], fill="#FF88AA", outline="#DD6688", width=2)  # strawberry
    d.ellipse([200, 108, 230, 138], fill="#FFFFCC", outline="#DDDD88", width=2)  # vanilla
    d.ellipse([205, 90, 230, 118], fill="#885533", outline="#663311", width=2)    # chocolate
    # Cherry on top
    d.ellipse([210, 82, 224, 96], fill="#FF2244", outline="#CC0022", width=2)
    d.line([(217, 82), (220, 72)], fill="#228822", width=2)

    # Wheels
    for wx in [80, 260]:
        d.ellipse([wx - 22, 256, wx + 22, 300], fill="#444444", outline="#333333", width=3)
        d.ellipse([wx - 12, 266, wx + 12, 290], fill="#888888", outline="#666666", width=2)
        d.ellipse([wx - 4, 274, wx + 4, 282], fill="#AAAAAA")

    # Roof items - soft serve sign
    d.rounded_rectangle([90, 70, 220, 118], radius=10, fill="#FFFFFF", outline="#E8849E", width=3)
    d.text((155, 80), "ICE CREAM", fill="#FF5588", font=FONT_SM, anchor="mt")
    # Mini cone icon on sign
    d.polygon([(145, 110), (155, 95), (165, 110)], fill="#E8C880")
    d.ellipse([143, 88, 167, 102], fill="#FF88CC")

    # Menu items in window
    d.text((120, 150), "$1  $2  $3", fill="#885544", font=FONT_XS, anchor="mm")

    return add_shadow(img)


def draw_cookie_shop():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ground
    d.ellipse([10, 275, 350, 330], fill=(130, 195, 80, 100))

    # Main building wall
    d.rectangle([30, 110, 330, 300], fill="#E8A050", outline="#C07830", width=3)
    # Brick pattern
    for y in range(122, 300, 18):
        d.line([(33, y), (327, y)], fill="#D49040", width=1)
        offset = 25 if ((y - 122) // 18) % 2 == 0 else 0
        for bx in range(33 + offset, 327, 50):
            d.line([(bx, y), (bx, y + 18)], fill="#D49040", width=1)

    # Foundation
    d.rectangle([26, 290, 334, 305], fill="#998877", outline="#776655", width=2)

    # Roof
    d.polygon([(16, 114), (180, 24), (344, 114)], fill="#C0522E", outline="#8B3A1E", width=3)
    # Shingle rows
    for y in range(40, 114, 14):
        t = (y - 24) / (114 - 24)
        lx = int(16 + (180 - 16) * (1 - t))
        rx = int(180 + (344 - 180) * t)
        d.line([(lx + 5, y), (rx - 5, y)], fill="#A04020", width=1)
        # Individual shingle tabs
        for sx in range(lx + 10, rx - 10, 20):
            d.arc([sx - 8, y - 2, sx + 8, y + 10], 0, 180, fill="#A04020", width=1)

    # Chimney with bricks
    d.rectangle([248, 28, 282, 85], fill="#884433", outline="#663322", width=2)
    d.rectangle([242, 22, 288, 34], fill="#884433", outline="#663322", width=2)
    for cy in range(36, 82, 10):
        d.line([(250, cy), (280, cy)], fill="#774030", width=1)
    # Smoke puffs
    d.ellipse([260, 4, 282, 22], fill=(210, 210, 210, 90))
    d.ellipse([270, -8, 290, 10], fill=(210, 210, 210, 65))
    d.ellipse([280, -16, 296, 0], fill=(210, 210, 210, 40))

    # Door
    d.rounded_rectangle([138, 200, 222, 300], radius=6, fill="#6B4530", outline="#4A3020", width=3)
    # Door arch
    d.pieslice([138, 190, 222, 230], 180, 0, fill="#6B4530", outline="#4A3020", width=3)
    # Door panels
    d.rounded_rectangle([146, 220, 214, 255], radius=3, fill="#7B5540", outline="#5A3828", width=2)
    d.rounded_rectangle([146, 262, 214, 295], radius=3, fill="#7B5540", outline="#5A3828", width=2)
    # Doorknob
    d.ellipse([200, 268, 212, 280], fill="#FFD700", outline="#CCA800", width=2)
    # Door window in arch
    d.pieslice([150, 196, 210, 225], 180, 0, fill="#FFEEBB", outline="#5A3828", width=1)

    # Windows with flower boxes
    for wx1, wx2 in [(44, 120), (240, 316)]:
        # Window frame
        d.rounded_rectangle([wx1, 140, wx2, 188], radius=4, fill="#FFEEBB", outline="#C07830", width=3)
        # Window panes
        mid_x = (wx1 + wx2) // 2
        mid_y = 164
        d.line([(mid_x, 143), (mid_x, 185)], fill="#C07830", width=2)
        d.line([(wx1 + 3, mid_y), (wx2 - 3, mid_y)], fill="#C07830", width=2)
        # Curtains
        d.polygon([(wx1 + 4, 143), (wx1 + 18, 143), (wx1 + 4, 165)], fill=(255, 240, 220, 140))
        d.polygon([(wx2 - 4, 143), (wx2 - 18, 143), (wx2 - 4, 165)], fill=(255, 240, 220, 140))
        # Shutters with slats
        for sw1, sw2 in [(wx1 - 12, wx1 - 2), (wx2 + 2, wx2 + 12)]:
            d.rectangle([sw1, 140, sw2, 188], fill="#2E8B57", outline="#1E6B40", width=1)
            for sy in range(146, 185, 8):
                d.line([(sw1 + 1, sy), (sw2 - 1, sy)], fill="#248B48", width=1)
        # Flower box
        d.rounded_rectangle([wx1 - 4, 190, wx2 + 4, 205], radius=3, fill="#8B5E3C", outline="#6B4530", width=2)
        # Flowers
        for fx in range(wx1 + 8, wx2, 16):
            d.line([(fx, 192), (fx, 182)], fill="#228822", width=1)
            d.ellipse([fx - 5, 175, fx + 5, 185], fill="#FF6688")
            d.ellipse([fx - 2, 178, fx + 2, 182], fill="#FFEE88")

    # Cookie sign above door
    d.ellipse([126, 85, 234, 130], fill="#D4956A", outline="#A06030", width=3)
    # Chocolate chips with highlights
    for cx, cy in [(158, 102), (182, 116), (200, 98), (170, 118), (192, 108), (148, 112)]:
        d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill="#3B2010", outline="#2A1508", width=1)
        d.ellipse([cx - 2, cy - 3, cx + 1, cy - 1], fill=(100, 70, 40, 100))

    # Welcome mat
    d.rounded_rectangle([148, 292, 212, 304], radius=2, fill="#AA7744", outline="#886633", width=1)
    d.text((180, 298), "WELCOME", fill="#664422", font=FONT_XS, anchor="mm")

    # Hanging sign
    d.line([(160, 110), (160, 128)], fill="#886644", width=2)
    d.line([(200, 110), (200, 128)], fill="#886644", width=2)
    d.rounded_rectangle([148, 128, 212, 148], radius=3, fill="#FFF8E0", outline="#C07830", width=1)
    d.text((180, 138), "OPEN", fill="#C07830", font=FONT_XS, anchor="mm")

    return add_shadow(img)


def draw_pet_shop():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ground
    d.ellipse([10, 278, 350, 328], fill=(130, 195, 80, 100))

    # Main building
    d.rectangle([30, 100, 330, 300], fill="#A8D870", outline="#78A848", width=3)
    # Horizontal siding
    for y in range(112, 300, 16):
        d.line([(33, y), (327, y)], fill="#98C860", width=1)

    # Foundation
    d.rectangle([26, 290, 334, 305], fill="#998877", outline="#776655", width=2)

    # Roof
    d.polygon([(18, 104), (180, 28), (342, 104)], fill="#66AA44", outline="#448822", width=3)
    for y in range(42, 104, 13):
        t = (y - 28) / (104 - 28)
        lx = int(18 + (180 - 18) * (1 - t))
        rx = int(180 + (342 - 180) * t)
        d.line([(lx + 5, y), (rx - 5, y)], fill="#559933", width=1)

    # Door
    d.rounded_rectangle([140, 195, 220, 300], radius=6, fill="#885533", outline="#664422", width=3)
    d.rounded_rectangle([148, 208, 212, 256], radius=4, fill="#FFEEBB", outline="#664422", width=2)
    d.ellipse([202, 268, 214, 280], fill="#FFD700", outline="#CCA800", width=2)
    # Paw print on door
    d.ellipse([165, 265, 180, 278], fill="#AA7744")
    d.ellipse([160, 256, 170, 264], fill="#AA7744")
    d.ellipse([175, 256, 185, 264], fill="#AA7744")

    # Display windows with animals
    for wx1, wx2 in [(40, 126), (234, 320)]:
        d.rounded_rectangle([wx1, 135, wx2, 190], radius=5, fill="#E8F6FF", outline="#78A848", width=3)
        mid_x = (wx1 + wx2) // 2
        d.line([(mid_x, 138), (mid_x, 187)], fill="#78A848", width=2)

    # Cat in left window
    # Body
    d.ellipse([52, 156, 80, 186], fill="#FF9944", outline="#DD7722", width=2)
    # Head
    d.ellipse([56, 140, 78, 162], fill="#FF9944", outline="#DD7722", width=2)
    # Ears
    d.polygon([(58, 143), (55, 132), (64, 140)], fill="#FF9944", outline="#DD7722", width=1)
    d.polygon([(74, 143), (77, 132), (68, 140)], fill="#FF9944", outline="#DD7722", width=1)
    d.polygon([(59, 144), (57, 135), (63, 141)], fill="#FFB870")
    d.polygon([(73, 144), (75, 135), (69, 141)], fill="#FFB870")
    # Eyes
    d.ellipse([62, 147, 66, 153], fill="#44AA44")
    d.ellipse([70, 147, 74, 153], fill="#44AA44")
    d.ellipse([63, 148, 65, 152], fill="#111111")
    d.ellipse([71, 148, 73, 152], fill="#111111")
    # Nose
    d.polygon([(65, 155), (67, 155), (66, 157)], fill="#FF6688")
    # Tail
    d.arc([72, 155, 95, 185], 250, 50, fill="#FF9944", width=3)

    # Dog in left window (right pane)
    d.ellipse([92, 152, 120, 186], fill="#CC9955", outline="#AA7733", width=2)
    d.ellipse([96, 136, 120, 160], fill="#CC9955", outline="#AA7733", width=2)
    # Floppy ears
    d.ellipse([92, 140, 102, 162], fill="#BB8844", outline="#AA7733", width=1)
    d.ellipse([114, 140, 124, 162], fill="#BB8844", outline="#AA7733", width=1)
    # Eyes
    d.ellipse([102, 146, 107, 151], fill="#332211")
    d.ellipse([111, 146, 116, 151], fill="#332211")
    # Nose
    d.ellipse([106, 152, 112, 157], fill="#332211")
    # Tongue
    d.ellipse([106, 157, 112, 166], fill="#FF6688")

    # Fish tank in right window
    d.rounded_rectangle([240, 148, 280, 186], radius=3, fill="#88CCFF", outline="#5599CC", width=2)
    # Fish
    d.polygon([(250, 164), (258, 160), (258, 168)], fill="#FF6633")
    d.ellipse([256, 158, 270, 172], fill="#FF6633", outline="#DD4411", width=1)
    d.ellipse([264, 163, 267, 166], fill="#111111")
    # Bubbles
    d.ellipse([254, 152, 258, 156], fill=(200, 230, 255, 150))
    d.ellipse([260, 148, 263, 151], fill=(200, 230, 255, 120))

    # Bird in right window (right pane)
    d.ellipse([295, 152, 315, 178], fill="#44BB44", outline="#228822", width=2)
    d.ellipse([298, 138, 316, 158], fill="#44BB44", outline="#228822", width=2)
    # Beak
    d.polygon([(316, 146), (324, 148), (316, 150)], fill="#FFAA00")
    # Eye
    d.ellipse([308, 143, 313, 148], fill="#111111")
    d.ellipse([309, 144, 311, 146], fill="#FFFFFF")
    # Perch
    d.line([(288, 178), (320, 178)], fill="#AA7744", width=3)

    # Sign
    d.rounded_rectangle([80, 45, 280, 88], radius=10, fill="#FFFFFF", outline="#78A848", width=3)
    d.text((180, 58), "PET SHOP", fill="#448822", font=FONT, anchor="mt")
    # Paw prints on sign
    for px in [95, 260]:
        d.ellipse([px - 6, 70, px + 6, 82], fill="#78A848")
        d.ellipse([px - 9, 64, px - 3, 72], fill="#78A848")
        d.ellipse([px + 3, 64, px + 9, 72], fill="#78A848")

    return add_shadow(img)


def draw_toy_store():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ground
    d.ellipse([8, 278, 352, 330], fill=(130, 195, 80, 100))

    # Main building
    d.rectangle([22, 95, 338, 300], fill="#6BC5FF", outline="#3A99DD", width=3)
    # Horizontal siding lines
    for y in range(105, 300, 14):
        d.line([(25, y), (335, y)], fill="#5EB8F0", width=1)

    # Foundation
    d.rectangle([18, 290, 342, 305], fill="#889098", outline="#667078", width=2)

    # Roof
    d.polygon([(10, 98), (180, 18), (350, 98)], fill="#4488CC", outline="#2E6699", width=3)
    # Shingles
    for y in range(32, 98, 12):
        t = (y - 18) / (98 - 18)
        lx = int(10 + (180 - 10) * (1 - t))
        rx = int(180 + (350 - 180) * t)
        d.line([(lx + 5, y), (rx - 5, y)], fill="#3878B0", width=1)

    # Door with window
    d.rounded_rectangle([135, 195, 225, 300], radius=8, fill="#FF5555", outline="#CC3333", width=3)
    d.rounded_rectangle([145, 205, 215, 255], radius=5, fill="#FFD0D0", outline="#CC3333", width=2)
    # Door handle
    d.ellipse([205, 260, 216, 271], fill="#FFD700", outline="#CCA800", width=2)
    # "PUSH" sign
    d.rounded_rectangle([155, 268, 200, 282], radius=3, fill="#FFD0D0", outline="#CC3333", width=1)
    d.text((178, 275), "PUSH", fill="#CC3333", font=FONT_XS, anchor="mm")

    # Display windows with awnings
    for wx1, wx2 in [(34, 120), (240, 326)]:
        # Mini awning
        d.polygon([(wx1 - 4, 120), (wx2 + 4, 120),
                   (wx2 + 8, 108), (wx1 - 8, 108)], fill="#FF9944", outline="#DD7722", width=2)
        # Window
        d.rounded_rectangle([wx1, 120, wx2, 185], radius=5, fill="#E8F6FF", outline="#3A99DD", width=3)
        # Window shelf
        d.rectangle([wx1 + 2, 175, wx2 - 2, 182], fill="#F0F4F8")

    # Teddy bear in left window
    # Body
    d.ellipse([55, 138, 95, 175], fill="#CC8844", outline="#AA6622", width=2)
    # Head
    d.ellipse([62, 118, 90, 146], fill="#CC8844", outline="#AA6622", width=2)
    # Ears
    d.ellipse([60, 114, 72, 126], fill="#CC8844", outline="#AA6622", width=2)
    d.ellipse([80, 114, 92, 126], fill="#CC8844", outline="#AA6622", width=2)
    d.ellipse([63, 117, 69, 123], fill="#E0AA66")
    d.ellipse([83, 117, 89, 123], fill="#E0AA66")
    # Eyes
    d.ellipse([70, 128, 75, 133], fill="#221100")
    d.ellipse([80, 128, 85, 133], fill="#221100")
    d.ellipse([71, 129, 73, 131], fill="#FFFFFF")
    d.ellipse([81, 129, 83, 131], fill="#FFFFFF")
    # Nose
    d.ellipse([74, 135, 80, 140], fill="#331100")
    # Belly
    d.ellipse([66, 148, 86, 168], fill="#E0AA66")
    # Bow tie
    d.polygon([(72, 144), (76, 148), (80, 144), (76, 146)], fill="#FF4444")
    d.polygon([(72, 148), (76, 144), (80, 148), (76, 146)], fill="#FF4444")

    # Right window: toy rocket and blocks
    # Rocket
    d.polygon([(278, 128), (285, 118), (292, 128)], fill="#FF4444", outline="#CC2222", width=1)
    d.rectangle([278, 128, 292, 165], fill="#EEEEEE", outline="#CCCCCC", width=2)
    d.rectangle([280, 140, 290, 150], fill="#4488FF")
    d.polygon([(275, 165), (278, 155), (278, 165)], fill="#FF8800")
    d.polygon([(295, 165), (292, 155), (292, 165)], fill="#FF8800")
    # Flame
    d.polygon([(282, 165), (285, 178), (288, 165)], fill="#FFAA00")
    d.polygon([(283, 165), (285, 174), (287, 165)], fill="#FFEE00")
    # Blocks
    d.rectangle([250, 158, 270, 178], fill="#FF4444", outline="#CC2222", width=2)
    d.rectangle([268, 158, 288, 178], fill="#44CC44", outline="#228822", width=2)
    d.rectangle([259, 140, 279, 158], fill="#4488FF", outline="#2266CC", width=2)
    d.text((260, 168), "A", fill="#FFFFFF", font=FONT_SM, anchor="mm")
    d.text((278, 168), "B", fill="#FFFFFF", font=FONT_SM, anchor="mm")
    d.text((269, 149), "C", fill="#FFFFFF", font=FONT_SM, anchor="mm")
    # Ball
    d.ellipse([302, 160, 320, 178], fill="#FFAA00", outline="#DD8800", width=2)
    d.arc([306, 162, 316, 172], 200, 340, fill="#FFD060", width=1)

    # Sign with shadow
    d.rounded_rectangle([72, 40, 288, 80], radius=8, fill="#FF9944", outline="#DD7722", width=3)
    d.text((180, 60), "TOY STORE", fill="#FFFFFF", font=FONT, anchor="mm")

    # Balloons - more details
    balloon_data = [(28, "#FF4466"), (180, "#4488FF"), (332, "#44DD66")]
    for bx, col in balloon_data:
        d.ellipse([bx - 16, 22, bx + 16, 62], fill=col)
        # Highlight
        d.ellipse([bx - 8, 28, bx - 2, 40], fill=(255, 255, 255, 100))
        # Knot
        d.polygon([(bx - 3, 62), (bx + 3, 62), (bx, 68)], fill=col)
        # String
        d.line([(bx, 68), (bx - 4, 95)], fill="#999999", width=1)

    # Stars on building front
    for sx, sy in [(55, 210), (305, 220), (45, 260), (315, 250)]:
        points = []
        for i in range(5):
            angle = math.radians(i * 72 - 90)
            points.append((sx + int(8 * math.cos(angle)), sy + int(8 * math.sin(angle))))
            angle2 = math.radians(i * 72 - 90 + 36)
            points.append((sx + int(4 * math.cos(angle2)), sy + int(4 * math.sin(angle2))))
        d.polygon(points, fill="#FFDD44", outline="#DDAA00", width=1)

    return add_shadow(img)


def draw_movie_theater():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ground
    d.ellipse([5, 280, 355, 330], fill=(130, 195, 80, 100))

    # Main building
    d.rectangle([20, 80, 340, 300], fill="#3A3A50", outline="#2A2A3A", width=3)

    # Art deco facade top
    d.rectangle([20, 80, 340, 110], fill="#CC8822", outline="#AA6600", width=2)
    d.rectangle([20, 105, 340, 115], fill="#FFD700")
    # Decorative triangles
    for x in range(30, 340, 30):
        d.polygon([(x, 80), (x + 15, 68), (x + 30, 80)], fill="#DDaa44", outline="#CC8822", width=1)

    # Marquee - lit up sign
    d.rounded_rectangle([50, 118, 310, 160], radius=6, fill="#220022", outline="#FFD700", width=3)
    # Light bulbs around marquee
    bulb_colors = ["#FF4444", "#FFEE44", "#44FF44", "#44AAFF", "#FF44FF",
                   "#FFEE44", "#FF4444", "#44FF44", "#44AAFF", "#FF44FF", "#FFEE44"]
    for i, c in enumerate(bulb_colors):
        bx = 58 + i * 24
        d.ellipse([bx - 4, 118, bx + 4, 126], fill=c)
        d.ellipse([bx - 4, 152, bx + 4, 160], fill=c)
    # Now showing text
    d.text((180, 132), "NOW SHOWING", fill="#FF4444", font=FONT_SM, anchor="mm")
    d.text((180, 148), "MATH HEROES", fill="#FFEE44", font=FONT_XS, anchor="mm")

    # Poster boxes
    for px, color in [(30, "#FF4455"), (280, "#4488FF")]:
        d.rounded_rectangle([px, 168, px + 50, 225], radius=3, fill=color, outline="#FFD700", width=2)
        # Simple poster art
        d.rectangle([px + 5, 173, px + 45, 200], fill=(0, 0, 0, 80))
        d.text((px + 25, 212), "RATED", fill="#FFFFFF", font=FONT_XS, anchor="mm")
        d.text((px + 25, 186), "PG", fill="#FFFFFF", font=FONT_SM, anchor="mm")

    # Double doors
    d.rounded_rectangle([110, 190, 250, 300], radius=8, fill="#661122", outline="#440011", width=3)
    d.line([(180, 195), (180, 300)], fill="#440011", width=3)
    # Door windows
    d.rounded_rectangle([118, 200, 172, 240], radius=4, fill=(100, 60, 80, 160), outline="#440011", width=2)
    d.rounded_rectangle([188, 200, 242, 240], radius=4, fill=(100, 60, 80, 160), outline="#440011", width=2)
    # Door handles
    d.rounded_rectangle([163, 250, 170, 270], radius=2, fill="#FFD700")
    d.rounded_rectangle([190, 250, 197, 270], radius=2, fill="#FFD700")

    # "TICKETS" booth on left
    d.rounded_rectangle([30, 235, 100, 300], radius=4, fill="#FFD700", outline="#CC8822", width=2)
    d.rounded_rectangle([36, 242, 94, 270], radius=3, fill="#FFEEBB", outline="#CC8822", width=1)
    d.text((65, 256), "TICKETS", fill="#882200", font=FONT_XS, anchor="mm")
    d.text((65, 282), "$", fill="#882200", font=FONT, anchor="mm")

    # Carpet / entrance
    d.rectangle([120, 290, 240, 305], fill="#CC2244")
    # Rope barriers
    for rx in [105, 255]:
        d.rectangle([rx, 265, rx + 6, 300], fill="#FFD700", outline="#CC8822", width=1)
        d.ellipse([rx - 2, 260, rx + 8, 270], fill="#FFD700")
    d.line([(108, 268), (258, 268)], fill="#CC2244", width=3)

    # Stars on building
    for sx, sy in [(160, 56), (200, 52), (180, 40)]:
        points = []
        for i in range(5):
            angle = math.radians(i * 72 - 90)
            points.append((sx + int(10 * math.cos(angle)), sy + int(10 * math.sin(angle))))
            angle2 = math.radians(i * 72 - 90 + 36)
            points.append((sx + int(5 * math.cos(angle2)), sy + int(5 * math.sin(angle2))))
        d.polygon(points, fill="#FFD700", outline="#CC8822", width=1)

    return add_shadow(img)


def draw_arcade():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ground
    d.ellipse([6, 280, 354, 330], fill=(130, 195, 80, 100))

    # Main building
    d.rectangle([20, 70, 340, 300], fill="#7744BB", outline="#5522AA", width=3)
    # Gradient darkening at bottom
    for y in range(240, 300):
        alpha = int((y - 240) * 2.5)
        d.line([(23, y), (337, y)], fill=(0, 0, 0, alpha), width=1)

    # Neon side pipes
    for nx in [20, 340]:
        d.line([(nx, 70), (nx, 300)], fill="#FF44FF", width=3)
        d.line([(nx, 70), (nx, 300)], fill=(255, 150, 255, 80), width=5)

    # Marquee banner
    d.rounded_rectangle([10, 48, 350, 76], radius=8, fill="#DD77FF", outline="#AA44DD", width=3)
    # Light bulb border top and bottom
    light_colors = ["#FFEE44", "#FF4466", "#44EEFF", "#44FF66", "#FF8844", "#FF4466", "#44EEFF", "#44FF66", "#FFEE44"]
    for i, c in enumerate(light_colors):
        cx = 30 + i * 34
        # Top row
        d.ellipse([cx - 6, 50, cx + 6, 62], fill="#333333", outline="#222222", width=1)
        d.ellipse([cx - 4, 52, cx + 4, 60], fill=c)
        # Bottom row
        d.ellipse([cx - 6, 64, cx + 6, 76], fill="#333333", outline="#222222", width=1)
        d.ellipse([cx - 4, 66, cx + 4, 74], fill=c)

    # ARCADE text with glow
    d.text((181, 34), "ARCADE", fill="#FFCC00", font=FONT, anchor="mm")
    d.text((180, 33), "ARCADE", fill="#FFEE44", font=FONT, anchor="mm")

    # Main entrance
    d.rounded_rectangle([115, 180, 245, 300], radius=10, fill="#4411AA", outline="#330088", width=3)
    # Glass double doors
    d.rounded_rectangle([122, 188, 178, 295], radius=5, fill=(170, 140, 230, 160), outline="#5522AA", width=2)
    d.rounded_rectangle([182, 188, 238, 295], radius=5, fill=(170, 140, 230, 160), outline="#5522AA", width=2)
    # Door handles
    d.rounded_rectangle([165, 240, 171, 260], radius=2, fill="#CCAA00")
    d.rounded_rectangle([189, 240, 195, 260], radius=2, fill="#CCAA00")
    # ENTER sign
    d.rounded_rectangle([140, 170, 220, 186], radius=4, fill="#FFEE44", outline="#CCAA00", width=1)
    d.text((180, 178), "ENTER", fill="#4411AA", font=FONT_SM, anchor="mm")

    # Arcade cabinet left - detailed
    d.rounded_rectangle([30, 100, 100, 195], radius=4, fill="#222244", outline="#111133", width=2)
    # Screen bezel
    d.rectangle([36, 105, 94, 144], fill="#111122")
    # Screen
    d.rectangle([39, 108, 91, 141], fill="#001100")
    # Game scene - space invaders style
    d.rectangle([39, 108, 91, 141], fill="#000022")
    # Stars
    for sx, sy in [(45, 112), (60, 118), (78, 110), (52, 130), (85, 125)]:
        d.rectangle([sx, sy, sx + 2, sy + 2], fill="#FFFFFF")
    # Player ship
    d.polygon([(62, 135), (65, 128), (68, 135)], fill="#00FF00")
    # Aliens
    for ax in [45, 55, 65, 75]:
        d.rectangle([ax, 113, ax + 6, 117], fill="#FF4444")
        d.rectangle([ax + 1, 111, ax + 3, 113], fill="#FF4444")
        d.rectangle([ax + 3, 111, ax + 5, 113], fill="#FF4444")
    # Bullets
    d.rectangle([66, 122, 67, 126], fill="#FFFF00")
    # Controls
    d.rectangle([36, 148, 94, 190], fill="#333366")
    # Joystick base and stick
    d.ellipse([48, 155, 66, 170], fill="#444488")
    d.ellipse([53, 152, 61, 160], fill="#FF3333", outline="#CC0000", width=1)
    # Buttons
    d.ellipse([72, 158, 82, 168], fill="#FF0000", outline="#CC0000", width=1)
    d.ellipse([82, 162, 92, 172], fill="#0088FF", outline="#0066CC", width=1)
    # Coin slot
    d.rounded_rectangle([56, 178, 74, 188], radius=2, fill="#444488", outline="#333366", width=1)
    d.text((65, 183), "COIN", fill="#888888", font=FONT_XS, anchor="mm")

    # Arcade cabinet right - racing game
    d.rounded_rectangle([260, 100, 330, 195], radius=4, fill="#222244", outline="#111133", width=2)
    d.rectangle([266, 105, 324, 144], fill="#111122")
    d.rectangle([269, 108, 321, 141], fill="#003366")
    # Road
    d.polygon([(285, 141), (305, 141), (310, 108), (280, 108)], fill="#444444")
    d.line([(292, 141), (294, 108)], fill="#FFFF00", width=1)
    d.line([(298, 141), (296, 108)], fill="#FFFF00", width=1)
    # Car
    d.rectangle([290, 125, 300, 138], fill="#FF0000", outline="#CC0000", width=1)
    # Sky
    d.rectangle([269, 108, 321, 118], fill="#4488CC")
    # Mountains
    d.polygon([(269, 118), (285, 108), (300, 118)], fill="#228833")
    d.polygon([(290, 118), (310, 106), (321, 118)], fill="#1E7730")
    # Controls
    d.rectangle([266, 148, 324, 190], fill="#333366")
    # Steering wheel
    d.ellipse([278, 154, 306, 180], fill="#222244", outline="#555588", width=2)
    d.ellipse([286, 162, 298, 174], fill="#555588")
    d.line([(280, 167), (304, 167)], fill="#555588", width=2)
    d.line([(292, 156), (292, 178)], fill="#555588", width=2)

    # Prize shelf above entrance
    d.rectangle([120, 88, 240, 106], fill="#553399", outline="#442288", width=2)
    # Trophies
    d.polygon([(140, 106), (145, 92), (150, 106)], fill="#FFD700")
    d.rectangle([142, 88, 148, 92], fill="#FFD700")
    d.polygon([(190, 106), (195, 95), (200, 106)], fill="#FFD700")
    d.rectangle([192, 88, 198, 95], fill="#FFD700")
    # Stars
    d.ellipse([165, 92, 175, 102], fill="#FF44FF")
    d.ellipse([215, 92, 225, 102], fill="#44FFFF")

    # Floor tiles at entrance
    for fx in range(115, 245, 16):
        color = "#3B1199" if ((fx - 115) // 16) % 2 == 0 else "#4422BB"
        d.rectangle([fx, 290, fx + 16, 300], fill=color)

    return add_shadow(img)


def draw_water_park():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ground
    d.ellipse([5, 280, 355, 330], fill=(130, 195, 80, 100))

    # Main pool area
    d.rounded_rectangle([30, 170, 330, 300], radius=20, fill="#33BBDD", outline="#1199BB", width=3)
    # Water waves
    for wy in range(180, 295, 15):
        for wx in range(40, 320, 30):
            offset = (wy * 3 + wx) % 20 - 10
            d.arc([wx + offset, wy, wx + 20 + offset, wy + 12], 0, 180, fill=(100, 220, 255, 120), width=2)

    # Entrance building
    d.rounded_rectangle([100, 110, 260, 180], radius=8, fill="#FF6644", outline="#DD4422", width=3)
    # Roof
    d.polygon([(90, 114), (180, 60), (270, 114)], fill="#FF4422", outline="#CC2200", width=3)
    # Sign
    d.rounded_rectangle([115, 120, 245, 150], radius=5, fill="#FFFFFF", outline="#DD4422", width=2)
    d.text((180, 135), "WATER PARK", fill="#1199BB", font=FONT_SM, anchor="mm")
    # Door
    d.rounded_rectangle([155, 152, 205, 180], radius=4, fill="#884422", outline="#663311", width=2)

    # Water slide - big curvy one
    # Slide tower
    d.rectangle([290, 60, 330, 180], fill="#FF8844", outline="#DD6622", width=2)
    d.rectangle([286, 55, 334, 66], fill="#FF8844", outline="#DD6622", width=2)
    # Platform
    d.rectangle([280, 60, 340, 72], fill="#FFAA66", outline="#DD6622", width=2)
    # Railing
    d.line([(285, 60), (285, 45)], fill="#DD6622", width=2)
    d.line([(335, 60), (335, 45)], fill="#DD6622", width=2)
    d.line([(285, 45), (335, 45)], fill="#DD6622", width=2)
    # Slide tube
    d.line([(295, 72), (260, 100)], fill="#44DDFF", width=14)
    d.line([(260, 100), (300, 130)], fill="#44DDFF", width=14)
    d.line([(300, 130), (250, 170)], fill="#44DDFF", width=14)
    # Slide highlights
    d.line([(295, 72), (260, 100)], fill=(150, 240, 255, 150), width=6)
    d.line([(260, 100), (300, 130)], fill=(150, 240, 255, 150), width=6)
    d.line([(300, 130), (250, 170)], fill=(150, 240, 255, 150), width=6)

    # Second slide (smaller, left side)
    d.rectangle([30, 90, 60, 180], fill="#FF66AA", outline="#DD4488", width=2)
    d.rectangle([26, 85, 64, 95], fill="#FF66AA", outline="#DD4488", width=2)
    d.line([(48, 95), (80, 120)], fill="#FF88CC", width=10)
    d.line([(80, 120), (50, 150)], fill="#FF88CC", width=10)
    d.line([(50, 150), (80, 175)], fill="#FF88CC", width=10)
    d.line([(48, 95), (80, 120)], fill=(255, 180, 220, 150), width=4)
    d.line([(80, 120), (50, 150)], fill=(255, 180, 220, 150), width=4)
    d.line([(50, 150), (80, 175)], fill=(255, 180, 220, 150), width=4)

    # Palm trees
    for tx, ty in [(20, 170), (340, 165)]:
        # Trunk
        d.line([(tx, ty), (tx + 5, ty - 50)], fill="#AA8844", width=6)
        d.line([(tx, ty), (tx + 5, ty - 50)], fill="#BB9955", width=4)
        # Fronds
        for angle_deg in [-40, -10, 20, 50, 80]:
            angle = math.radians(angle_deg)
            ex = tx + 5 + int(35 * math.cos(angle))
            ey = ty - 50 + int(25 * math.sin(angle)) - 10
            d.line([(tx + 5, ty - 50), (ex, ey)], fill="#44AA22", width=3)

    # Splash effects
    for sx, sy in [(120, 195), (220, 210), (170, 250)]:
        for i in range(5):
            angle = math.radians(i * 72 - 90)
            dx = int(8 * math.cos(angle))
            dy = int(6 * math.sin(angle))
            d.ellipse([sx + dx - 3, sy + dy - 3, sx + dx + 3, sy + dy + 3],
                      fill=(200, 240, 255, 140))

    # Float / inner tube
    d.ellipse([140, 220, 175, 250], fill="#FF4466", outline="#CC2244", width=3)
    d.ellipse([148, 228, 167, 242], fill="#33BBDD")

    return add_shadow(img)


def draw_theme_park():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ground
    d.ellipse([5, 280, 355, 335], fill=(130, 195, 80, 100))

    # Castle base wall
    d.rectangle([40, 125, 320, 300], fill="#FF8899", outline="#DD4060", width=3)
    # Stone pattern
    for y in range(140, 300, 20):
        d.line([(43, y), (317, y)], fill="#FF7888", width=1)
        offset = 25 if ((y - 140) // 20) % 2 == 0 else 0
        for bx in range(43 + offset, 317, 50):
            d.line([(bx, y), (bx, y + 20)], fill="#FF7888", width=1)

    # Main tower
    d.rectangle([122, 48, 238, 300], fill="#FFAABB", outline="#DD4060", width=3)
    # Tower stone pattern
    for y in range(60, 300, 20):
        d.line([(125, y), (235, y)], fill="#FF99AA", width=1)

    # Main tower roof - pointy
    d.polygon([(114, 52), (180, -6), (246, 52)], fill="#FF4466", outline="#CC2244", width=3)
    # Roof detail lines
    for y in range(8, 52, 10):
        t = (y + 6) / 58
        lx = int(114 + (180 - 114) * (1 - t))
        rx = int(180 + (246 - 180) * t)
        d.line([(lx + 3, y), (rx - 3, y)], fill="#E83355", width=1)

    # Flag
    d.line([(180, -6), (180, -30)], fill="#8B7355", width=4)
    d.polygon([(180, -30), (212, -20), (180, -10)], fill="#FFD700", outline="#CCA800", width=2)
    # Flag detail
    d.line([(184, -26), (206, -20)], fill="#FFAA00", width=1)
    d.line([(184, -18), (200, -16)], fill="#FFAA00", width=1)

    # Left turret
    d.rectangle([28, 95, 68, 200], fill="#FFAABB", outline="#DD4060", width=2)
    d.polygon([(22, 98), (48, 58), (74, 98)], fill="#FF4466", outline="#CC2244", width=2)
    # Turret flag
    d.line([(48, 58), (48, 42)], fill="#8B7355", width=2)
    d.polygon([(48, 42), (62, 48), (48, 54)], fill="#44AAFF")
    # Crenellations
    for x in [28, 44, 56]:
        d.rectangle([x, 88, x + 10, 98], fill="#FFAABB", outline="#DD4060", width=1)

    # Right turret
    d.rectangle([292, 95, 332, 200], fill="#FFAABB", outline="#DD4060", width=2)
    d.polygon([(286, 98), (312, 58), (338, 98)], fill="#FF4466", outline="#CC2244", width=2)
    d.line([(312, 58), (312, 42)], fill="#8B7355", width=2)
    d.polygon([(312, 42), (326, 48), (312, 54)], fill="#FF88FF")
    for x in [292, 308, 320]:
        d.rectangle([x, 88, x + 10, 98], fill="#FFAABB", outline="#DD4060", width=1)

    # Main gate - arched
    d.pieslice([140, 195, 220, 260], 180, 0, fill="#882244", outline="#661133", width=3)
    d.rectangle([140, 228, 220, 300], fill="#882244", outline="#661133", width=3)
    # Gate doors
    d.line([(180, 200), (180, 300)], fill="#661133", width=3)
    # Gate portcullis lines
    for gy in range(215, 295, 12):
        d.line([(144, gy), (216, gy)], fill=(100, 30, 60, 100), width=1)
    # Arch keystones
    d.arc([138, 193, 222, 262], 180, 0, fill="#AA3355", width=4)
    # Gate torch holders
    for tx in [130, 224]:
        d.rectangle([tx, 220, tx + 6, 244], fill="#886644")
        # Flame
        d.polygon([(tx - 2, 220), (tx + 3, 206), (tx + 8, 220)], fill="#FFAA00")
        d.polygon([(tx, 218), (tx + 3, 210), (tx + 6, 218)], fill="#FFEE00")

    # Tower window (arched) with detail
    d.pieslice([148, 75, 212, 125], 180, 0, fill="#FFEEBB", outline="#DD4060", width=2)
    d.rectangle([148, 100, 212, 130], fill="#FFEEBB", outline="#DD4060", width=2)
    # Cross bars
    d.line([(180, 80), (180, 130)], fill="#DD4060", width=2)
    d.line([(151, 110), (209, 110)], fill="#DD4060", width=2)
    # Window sill
    d.rectangle([144, 130, 216, 136], fill="#DD4060")

    # Turret windows
    for wx in [38, 302]:
        d.pieslice([wx, 115, wx + 20, 140], 180, 0, fill="#FFEEBB", outline="#DD4060", width=2)
        d.rectangle([wx, 128, wx + 20, 145], fill="#FFEEBB", outline="#DD4060", width=2)

    # Wall windows
    for wx in [62, 260]:
        d.rounded_rectangle([wx, 160, wx + 36, 190], radius=4, fill="#FFEEBB", outline="#DD4060", width=2)
        d.line([(wx + 18, 163), (wx + 18, 187)], fill="#DD4060", width=1)
        d.line([(wx + 3, 175), (wx + 33, 175)], fill="#DD4060", width=1)

    # Banner garlands between towers
    for i in range(8):
        t = i / 7
        lx = 68 + int(54 * t)
        ly = 135 + int(15 * math.sin(t * math.pi))
        rx = lx + 8
        colors = ["#FFD700", "#FF4466", "#4488FF", "#44DD66", "#FF8844", "#DD44FF", "#44DDDD", "#FFD700"]
        d.polygon([(lx, ly), (lx + 4, ly + 10), (lx + 8, ly)], fill=colors[i])

    for i in range(8):
        t = i / 7
        lx = 238 + int(54 * t)
        ly = 135 + int(15 * math.sin(t * math.pi))
        colors = ["#FFD700", "#FF4466", "#4488FF", "#44DD66", "#FF8844", "#DD44FF", "#44DDDD", "#FFD700"]
        d.polygon([(lx, ly), (lx + 4, ly + 10), (lx + 8, ly)], fill=colors[i])

    # Clock on tower
    d.ellipse([164, 145, 196, 177], fill="#FFFFFF", outline="#DD4060", width=2)
    d.ellipse([168, 149, 192, 173], outline="#FFCCDD", width=1)
    # Clock hands
    d.line([(180, 161), (180, 152)], fill="#333333", width=2)
    d.line([(180, 161), (190, 161)], fill="#333333", width=2)
    d.ellipse([178, 159, 182, 163], fill="#FF4466")
    # Hour markers
    for i in range(12):
        angle = math.radians(i * 30 - 90)
        mx = 180 + int(10 * math.cos(angle))
        my = 161 + int(10 * math.sin(angle))
        d.ellipse([mx - 1, my - 1, mx + 1, my + 1], fill="#DD4060")

    return add_shadow(img)


def draw_space_station():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Starfield background circle
    d.ellipse([20, 30, 340, 330], fill=(10, 10, 40, 120))
    # Stars
    import random
    rng = random.Random(42)  # deterministic
    for _ in range(40):
        sx = rng.randint(30, 330)
        sy = rng.randint(40, 320)
        size = rng.randint(1, 3)
        d.ellipse([sx, sy, sx + size, sy + size], fill=(255, 255, 255, rng.randint(100, 255)))

    # Main hub (center sphere)
    d.ellipse([120, 110, 240, 230], fill="#B8C8D8", outline="#8898A8", width=3)
    # Hub window ring
    for angle_deg in range(0, 360, 45):
        angle = math.radians(angle_deg)
        wx = 180 + int(40 * math.cos(angle))
        wy = 170 + int(40 * math.sin(angle))
        d.ellipse([wx - 8, wy - 8, wx + 8, wy + 8], fill="#44AAFF", outline="#2288CC", width=2)
        d.ellipse([wx - 4, wy - 6, wx + 2, wy - 2], fill=(150, 220, 255, 120))

    # Hub highlight
    d.ellipse([135, 120, 175, 155], fill=(220, 230, 240, 80))

    # Solar panel arrays - left
    d.rectangle([20, 155, 115, 185], fill="#2244AA", outline="#113388", width=2)
    # Panel grid
    for px in range(24, 112, 12):
        d.line([(px, 158), (px, 182)], fill="#1133AA", width=1)
    for py in range(158, 183, 8):
        d.line([(22, py), (113, py)], fill="#1133AA", width=1)
    # Connection arm
    d.rectangle([110, 165, 125, 175], fill="#889098", outline="#667078", width=1)

    # Solar panel arrays - right
    d.rectangle([245, 155, 340, 185], fill="#2244AA", outline="#113388", width=2)
    for px in range(249, 337, 12):
        d.line([(px, 158), (px, 182)], fill="#1133AA", width=1)
    for py in range(158, 183, 8):
        d.line([(247, py), (338, py)], fill="#1133AA", width=1)
    d.rectangle([235, 165, 250, 175], fill="#889098", outline="#667078", width=1)

    # Upper solar panels
    d.rectangle([40, 75, 130, 100], fill="#2244AA", outline="#113388", width=2)
    for px in range(44, 127, 12):
        d.line([(px, 78), (px, 97)], fill="#1133AA", width=1)
    d.rectangle([125, 88, 140, 115], fill="#889098", outline="#667078", width=1)

    d.rectangle([230, 75, 320, 100], fill="#2244AA", outline="#113388", width=2)
    for px in range(234, 317, 12):
        d.line([(px, 78), (px, 97)], fill="#1133AA", width=1)
    d.rectangle([220, 88, 235, 115], fill="#889098", outline="#667078", width=1)

    # Habitation modules (cylinders)
    # Top module
    d.rounded_rectangle([150, 60, 210, 115], radius=8, fill="#C0C8D0", outline="#8898A8", width=2)
    d.rounded_rectangle([155, 65, 205, 75], radius=3, fill="#44AAFF", outline="#2288CC", width=1)
    d.line([(180, 75), (180, 110)], fill="#A0A8B0", width=1)

    # Bottom module
    d.rounded_rectangle([150, 225, 210, 280], radius=8, fill="#C0C8D0", outline="#8898A8", width=2)
    d.rounded_rectangle([155, 260, 205, 270], radius=3, fill="#44AAFF", outline="#2288CC", width=1)
    d.line([(180, 230), (180, 260)], fill="#A0A8B0", width=1)

    # Antenna on top
    d.line([(180, 60), (180, 30)], fill="#889098", width=3)
    d.ellipse([174, 24, 186, 36], fill="#FF4444", outline="#CC2222", width=2)
    # Signal waves
    for r in [14, 22, 30]:
        d.arc([180 - r, 30 - r // 2, 180 + r, 30 + r // 2], 200, 340, fill=(255, 80, 80, 120), width=2)

    # Docking port at bottom
    d.rounded_rectangle([165, 280, 195, 310], radius=4, fill="#889098", outline="#667078", width=2)
    d.ellipse([172, 290, 188, 305], fill="#445566", outline="#334455", width=1)

    # Thruster glow
    for tx, ty in [(165, 308), (195, 308)]:
        d.polygon([(tx - 4, ty), (tx, ty + 15), (tx + 4, ty)], fill=(80, 150, 255, 100))
        d.polygon([(tx - 2, ty), (tx, ty + 10), (tx + 2, ty)], fill=(150, 200, 255, 140))

    # Label
    d.rounded_rectangle([110, 186, 250, 210], radius=5, fill=(0, 0, 0, 100))
    d.text((180, 198), "SPACE STATION", fill="#FFFFFF", font=FONT_SM, anchor="mm")

    return add_shadow(img)


def main():
    buildings = {
        "lemonade_stand": draw_lemonade_stand,
        "ice_cream_truck": draw_ice_cream_truck,
        "cookie_shop": draw_cookie_shop,
        "pet_shop": draw_pet_shop,
        "toy_store": draw_toy_store,
        "movie_theater": draw_movie_theater,
        "arcade": draw_arcade,
        "water_park": draw_water_park,
        "theme_park": draw_theme_park,
        "space_station": draw_space_station,
    }
    for name, draw_fn in buildings.items():
        img = draw_fn()
        path = os.path.join(ASSETS_DIR, f"{name}.png")
        img.save(path)
        print(f"Saved {path} ({img.size[0]}x{img.size[1]})")
    print("All assets generated!")


if __name__ == "__main__":
    main()
