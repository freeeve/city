"""City client - Pygame UI with network communication."""

import pygame
import socket
import threading
import json
import os
import math
from shared import BUILDINGS, BUILDING_ORDER, BUILDING_COLORS, PORT

# --- Constants ---
WIDTH, HEIGHT = 1000, 750
FPS = 30

# Color palette
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BG_TOP = (200, 225, 255)
BG_BOT = (235, 245, 255)
HEADER_TOP = (45, 100, 180)
HEADER_BOT = (65, 140, 220)
ACCENT = (55, 120, 200)
COIN_GOLD = (255, 210, 60)
COIN_DARK = (200, 160, 30)
GREEN = (60, 190, 90)
GREEN_HOVER = (45, 160, 70)
RED = (220, 70, 70)
RED_HOVER = (190, 50, 50)
LIGHT_GRAY = (225, 225, 230)
MID_GRAY = (160, 160, 170)
DARK_GRAY = (90, 90, 100)
INPUT_BG = (250, 250, 255)
INPUT_BORDER = (180, 190, 210)
INPUT_ACTIVE = (55, 120, 200)
PURPLE = (140, 80, 220)
PURPLE_HOVER = (120, 60, 190)

# Town colors
GRASS_1 = (105, 185, 75)
GRASS_2 = (115, 195, 85)
GRASS_3 = (95, 175, 65)
ROAD_FILL = (140, 138, 132)
ROAD_EDGE = (115, 112, 108)
ROAD_DASH = (200, 195, 180)
SIDEWALK = (195, 190, 180)
TREE_TRUNK = (120, 85, 50)
TREE_GREEN = (60, 150, 55)
TREE_LIGHT = (80, 175, 70)
FENCE_COLOR = (165, 140, 100)

# Leaderboard medal colors
GOLD = (255, 200, 50)
SILVER = (190, 195, 205)
BRONZE = (205, 150, 90)

# Town layout
ROAD_THICK = 36
ROW_HEIGHT = 175
PLOT_W, PLOT_H = 135, 130

# Grid: columns of plots separated by vertical roads
# Column positions (x offsets in world space)
PLOT_COLS = [10, 155, 340, 485, 670, 815]
# Vertical road x positions (in world space)
ROAD_V_POSITIONS = [295, 630]
# Total town world width
TOWN_WORLD_W = 960


class Client:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("City")
        self.clock = pygame.time.Clock()
        self.tick = 0

        # Fonts
        self.font_title = pygame.font.SysFont("Arial", 48, bold=True)
        self.font_big = pygame.font.SysFont("Arial", 38, bold=True)
        self.font_med = pygame.font.SysFont("Arial", 26, bold=True)
        self.font_sm = pygame.font.SysFont("Arial", 20)
        self.font_xs = pygame.font.SysFont("Arial", 16)
        self.font_tiny = pygame.font.SysFont("Arial", 13)

        # Load building images
        self.building_images = {}
        self.building_images_shop = {}
        assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
        name_to_file = {
            "Lemonade Stand": "lemonade_stand.png",
            "Ice Cream Truck": "ice_cream_truck.png",
            "Cookie Shop": "cookie_shop.png",
            "Pet Shop": "pet_shop.png",
            "Toy Store": "toy_store.png",
            "Movie Theater": "movie_theater.png",
            "Arcade": "arcade.png",
            "Water Park": "water_park.png",
            "Theme Park": "theme_park.png",
            "Space Station": "space_station.png",
        }
        for name, filename in name_to_file.items():
            path = os.path.join(assets_dir, filename)
            if os.path.exists(path):
                img = pygame.image.load(path).convert_alpha()
                self.building_images[name] = pygame.transform.smoothscale(img, (90, 90))
                self.building_images_shop[name] = pygame.transform.smoothscale(img, (52, 52))

        # Network
        self.sock = None
        self.connected = False
        self.recv_thread = None

        # Game state from server
        self.coins = 0
        self.buildings = []
        self.problem_text = ""
        self.income = 0
        self.leaderboard = []
        self.last_result = ""
        self.result_timer = 0

        # Screens
        self.screen_state = "connect"
        self.shop_open = False

        # Connect screen fields
        self.ip_text = "localhost"
        self.name_text = ""
        self.active_field = "name"
        self.connect_error = ""

        # Game screen input
        self.answer_text = ""

        # Town scrolling (2D)
        self.town_scroll_x = 0
        self.town_scroll_y = 0
        self.town_dragging = False
        self.drag_start = (0, 0)
        self.drag_scroll_start = (0, 0)

        # Shop scrolling
        self.shop_scroll = 0

        self.running = True

    # --- Networking ---
    def connect_to_server(self, ip, name):
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.settimeout(5)
            self.sock.connect((ip, PORT))
            self.sock.settimeout(None)
            msg = json.dumps({"type": "join", "name": name}) + "\n"
            self.sock.sendall(msg.encode())
            self.connected = True
            self.recv_thread = threading.Thread(target=self.recv_loop, daemon=True)
            self.recv_thread.start()
            return True
        except Exception as e:
            self.connect_error = str(e)
            return False

    def recv_loop(self):
        buf = ""
        try:
            while self.connected:
                data = self.sock.recv(4096)
                if not data:
                    break
                buf += data.decode()
                while "\n" in buf:
                    line, buf = buf.split("\n", 1)
                    if not line.strip():
                        continue
                    msg = json.loads(line)
                    self.handle_message(msg)
        except Exception:
            pass
        self.connected = False

    def handle_message(self, msg):
        if msg["type"] == "state":
            self.coins = msg["coins"]
            self.buildings = msg["buildings"]
            self.problem_text = msg["problem"]["text"]
            self.income = msg["income"]
            self.leaderboard = msg["leaderboard"]
        elif msg["type"] == "result":
            self.last_result = msg["result"]
            self.result_timer = FPS * 2
        elif msg["type"] == "error":
            self.connect_error = msg.get("message", "Error")

    def send(self, msg):
        if self.connected and self.sock:
            try:
                data = json.dumps(msg) + "\n"
                self.sock.sendall(data.encode())
            except Exception:
                pass

    # --- Drawing helpers ---
    def draw_gradient_rect(self, x, y, w, h, color_top, color_bot, radius=0):
        surf = pygame.Surface((w, h), pygame.SRCALPHA)
        for row in range(h):
            t = row / max(h - 1, 1)
            r = int(color_top[0] + (color_bot[0] - color_top[0]) * t)
            g = int(color_top[1] + (color_bot[1] - color_top[1]) * t)
            b = int(color_top[2] + (color_bot[2] - color_top[2]) * t)
            pygame.draw.line(surf, (r, g, b), (0, row), (w, row))
        if radius > 0:
            mask = pygame.Surface((w, h), pygame.SRCALPHA)
            pygame.draw.rect(mask, (255, 255, 255), (0, 0, w, h), border_radius=radius)
            surf.blit(mask, (0, 0), special_flags=pygame.BLEND_RGBA_MIN)
        self.screen.blit(surf, (x, y))

    def draw_shadow(self, x, y, w, h, radius=8, offset=3, alpha=30):
        shadow = pygame.Surface((w + offset * 2, h + offset * 2), pygame.SRCALPHA)
        pygame.draw.rect(shadow, (0, 0, 0, alpha), (0, 0, w + offset * 2, h + offset * 2), border_radius=radius)
        self.screen.blit(shadow, (x - offset + 3, y - offset + 3))

    def draw_text(self, text, font, color, x, y, center=False, shadow=False):
        if shadow:
            s = font.render(text, True, (0, 0, 0, 60))
            sr = s.get_rect()
            if center:
                sr.center = (x + 1, y + 2)
            else:
                sr.topleft = (x + 1, y + 2)
            s.set_alpha(50)
            self.screen.blit(s, sr)
        surf = font.render(text, True, color)
        rect = surf.get_rect()
        if center:
            rect.center = (x, y)
        else:
            rect.topleft = (x, y)
        self.screen.blit(surf, rect)
        return rect

    def draw_button(self, text, x, y, w, h, color, hover_color=None, font=None):
        if font is None:
            font = self.font_sm
        if hover_color is None:
            hover_color = tuple(max(0, c - 25) for c in color)
        mx, my = pygame.mouse.get_pos()
        hovered = x <= mx <= x + w and y <= my <= y + h
        c = hover_color if hovered else color
        self.draw_shadow(x, y, w, h, radius=10, alpha=25)
        pygame.draw.rect(self.screen, c, (x, y, w, h), border_radius=10)
        # Subtle highlight on top half
        highlight = pygame.Surface((w, h // 2), pygame.SRCALPHA)
        pygame.draw.rect(highlight, (255, 255, 255, 30), (0, 0, w, h // 2), border_radius=10)
        self.screen.blit(highlight, (x, y))
        self.draw_text(text, font, WHITE, x + w // 2, y + h // 2, center=True)
        return pygame.Rect(x, y, w, h)

    def draw_input(self, text, x, y, w, h, active=False):
        self.draw_shadow(x, y, w, h, radius=8, alpha=15)
        pygame.draw.rect(self.screen, INPUT_BG, (x, y, w, h), border_radius=8)
        border_color = INPUT_ACTIVE if active else INPUT_BORDER
        pygame.draw.rect(self.screen, border_color, (x, y, w, h), 2, border_radius=8)
        cursor = "|" if active and (self.tick // 15) % 2 == 0 else ""
        self.draw_text(text + cursor, self.font_sm, BLACK, x + 12, y + h // 2 - 10)
        return pygame.Rect(x, y, w, h)

    def draw_coin_icon(self, x, y, size=12):
        pygame.draw.circle(self.screen, COIN_DARK, (x, y), size)
        pygame.draw.circle(self.screen, COIN_GOLD, (x, y), size - 2)
        self.draw_text("$", self.font_tiny, COIN_DARK, x, y, center=True)

    # --- Connect Screen ---
    def draw_connect_screen(self):
        # Sky gradient - warm sunset
        sky_top = (40, 60, 120)
        sky_mid = (130, 100, 160)
        sky_bot = (240, 150, 100)
        for row in range(HEIGHT):
            t = row / HEIGHT
            if t < 0.5:
                t2 = t / 0.5
                r = int(sky_top[0] + (sky_mid[0] - sky_top[0]) * t2)
                g = int(sky_top[1] + (sky_mid[1] - sky_top[1]) * t2)
                b = int(sky_top[2] + (sky_mid[2] - sky_top[2]) * t2)
            else:
                t2 = (t - 0.5) / 0.5
                r = int(sky_mid[0] + (sky_bot[0] - sky_mid[0]) * t2)
                g = int(sky_mid[1] + (sky_bot[1] - sky_mid[1]) * t2)
                b = int(sky_mid[2] + (sky_bot[2] - sky_mid[2]) * t2)
            pygame.draw.line(self.screen, (r, g, b), (0, row), (WIDTH, row))

        # Stars
        import random
        rng = random.Random(99)
        for _ in range(60):
            sx = rng.randint(0, WIDTH)
            sy = rng.randint(0, HEIGHT // 3)
            brightness = rng.randint(120, 255)
            twinkle = abs(math.sin(self.tick * 0.05 + sx * 0.1)) * 80
            alpha = min(255, int(brightness * 0.5 + twinkle))
            sz = rng.choice([1, 1, 1, 2])
            star_s = pygame.Surface((sz * 2, sz * 2), pygame.SRCALPHA)
            pygame.draw.circle(star_s, (255, 255, 240, alpha), (sz, sz), sz)
            self.screen.blit(star_s, (sx - sz, sy - sz))

        # Moon
        moon_s = pygame.Surface((60, 60), pygame.SRCALPHA)
        pygame.draw.circle(moon_s, (255, 250, 220, 200), (30, 30), 25)
        pygame.draw.circle(moon_s, (255, 255, 240, 60), (30, 30), 30)
        pygame.draw.circle(moon_s, (220, 210, 190, 80), (24, 26), 6)
        pygame.draw.circle(moon_s, (220, 210, 190, 60), (34, 20), 4)
        pygame.draw.circle(moon_s, (220, 210, 190, 50), (30, 34), 3)
        self.screen.blit(moon_s, (780, 40))

        # City skyline silhouette
        ground_y = HEIGHT - 160
        buildings_data = [
            (0, 80, 60, (50, 55, 70)),
            (55, 130, 50, (45, 50, 65)),
            (100, 100, 70, (55, 60, 75)),
            (165, 160, 55, (40, 45, 60)),
            (215, 90, 65, (50, 55, 70)),
            (275, 140, 50, (45, 48, 63)),
            (320, 110, 75, (52, 57, 72)),
            (390, 170, 45, (42, 47, 62)),
            (430, 95, 60, (48, 53, 68)),
            (485, 125, 70, (44, 49, 64)),
            (550, 85, 55, (50, 55, 70)),
            (600, 150, 60, (46, 51, 66)),
            (655, 105, 80, (52, 57, 72)),
            (730, 135, 50, (43, 48, 63)),
            (775, 115, 65, (49, 54, 69)),
            (835, 155, 55, (45, 50, 65)),
            (885, 90, 70, (51, 56, 71)),
            (950, 120, 55, (47, 52, 67)),
        ]
        for bx, bh, bw, color in buildings_data:
            by = ground_y - bh
            pygame.draw.rect(self.screen, color, (bx, by, bw, bh + 200))
            # Windows - lit up yellow/warm
            for wy in range(by + 8, ground_y - 10, 18):
                for wx in range(bx + 6, bx + bw - 8, 14):
                    lit = rng.random() > 0.35
                    if lit:
                        wc = rng.choice([(255, 230, 130, 200), (255, 210, 100, 180),
                                         (200, 220, 255, 150), (255, 200, 80, 160)])
                        ws = pygame.Surface((8, 10), pygame.SRCALPHA)
                        pygame.draw.rect(ws, wc, (0, 0, 8, 10), border_radius=1)
                        self.screen.blit(ws, (wx, wy))
                    else:
                        ws = pygame.Surface((8, 10), pygame.SRCALPHA)
                        pygame.draw.rect(ws, (30, 35, 50, 120), (0, 0, 8, 10), border_radius=1)
                        self.screen.blit(ws, (wx, wy))
            # Roof details
            if bw > 50:
                pygame.draw.rect(self.screen, (max(0, color[0] - 10), max(0, color[1] - 10), max(0, color[2] - 10)),
                                 (bx + bw // 3, by - 12, bw // 4, 12))

        # Ground
        pygame.draw.rect(self.screen, (30, 35, 45), (0, ground_y, WIDTH, HEIGHT - ground_y))
        # Road on ground
        pygame.draw.rect(self.screen, (55, 55, 60), (0, ground_y + 10, WIDTH, 30))
        pygame.draw.line(self.screen, (180, 170, 80), (0, ground_y + 25), (WIDTH, ground_y + 25), 2)
        # Sidewalk
        pygame.draw.rect(self.screen, (70, 70, 80), (0, ground_y, WIDTH, 12))

        # Street lights
        for lx in [150, 400, 650, 900]:
            pygame.draw.rect(self.screen, (80, 80, 90), (lx, ground_y - 50, 4, 55))
            pygame.draw.ellipse(self.screen, (80, 80, 90), (lx - 8, ground_y - 55, 20, 8))
            # Light glow
            glow = pygame.Surface((40, 60), pygame.SRCALPHA)
            pygame.draw.ellipse(glow, (255, 230, 130, 25), (0, 0, 40, 60))
            self.screen.blit(glow, (lx - 18, ground_y - 30))

        # Center card with glass effect
        card_w, card_h = 460, 400
        card_x = (WIDTH - card_w) // 2
        card_y = 140
        # Card glow
        glow_s = pygame.Surface((card_w + 30, card_h + 30), pygame.SRCALPHA)
        pygame.draw.rect(glow_s, (255, 255, 255, 10), (0, 0, card_w + 30, card_h + 30), border_radius=22)
        self.screen.blit(glow_s, (card_x - 15, card_y - 15))
        # Card background
        card_s = pygame.Surface((card_w, card_h), pygame.SRCALPHA)
        pygame.draw.rect(card_s, (20, 25, 45, 210), (0, 0, card_w, card_h), border_radius=18)
        self.screen.blit(card_s, (card_x, card_y))
        # Card border
        pygame.draw.rect(self.screen, (100, 110, 140), (card_x, card_y, card_w, card_h), 1, border_radius=18)

        # Title
        title_font = self.font_title
        # Title glow
        tglow = title_font.render("City", True, (255, 210, 60))
        tglow.set_alpha(40)
        tr = tglow.get_rect(center=(WIDTH // 2 + 1, card_y + 46))
        self.screen.blit(tglow, tr)
        self.draw_text("City", title_font, COIN_GOLD, WIDTH // 2, card_y + 45, center=True)
        self.draw_text("Solve math, earn coins, build your city!", self.font_xs, (180, 185, 200), WIDTH // 2, card_y + 80, center=True)

        # Divider line
        div_s = pygame.Surface((card_w - 80, 1), pygame.SRCALPHA)
        for dx in range(card_w - 80):
            alpha = int(60 * (1 - abs(dx / (card_w - 80) - 0.5) * 2))
            div_s.set_at((dx, 0), (200, 200, 220, alpha))
        self.screen.blit(div_s, (card_x + 40, card_y + 100))

        # Form inside card
        fx = card_x + 50
        fw = card_w - 100

        self.draw_text("Your Name", self.font_xs, (170, 175, 195), fx, card_y + 115)
        self.name_rect = self._draw_dark_input(self.name_text, fx, card_y + 138, fw, 42, self.active_field == "name")

        self.draw_text("Server IP", self.font_xs, (170, 175, 195), fx, card_y + 200)
        self.ip_rect = self._draw_dark_input(self.ip_text, fx, card_y + 223, fw, 42, self.active_field == "ip")

        self.connect_btn = self.draw_button("Play", fx + 50, card_y + 300, fw - 100, 52, GREEN, GREEN_HOVER, self.font_med)

        if self.connect_error:
            color = (170, 175, 195) if self.connect_error == "Connecting..." else (255, 100, 100)
            self.draw_text(self.connect_error, self.font_xs, color, WIDTH // 2, card_y + 370, center=True)

    def _draw_dark_input(self, text, x, y, w, h, active=False):
        """Dark-themed input field for connect screen."""
        s = pygame.Surface((w, h), pygame.SRCALPHA)
        pygame.draw.rect(s, (15, 18, 35, 200), (0, 0, w, h), border_radius=8)
        self.screen.blit(s, (x, y))
        border_color = COIN_GOLD if active else (70, 75, 95)
        pygame.draw.rect(self.screen, border_color, (x, y, w, h), 2, border_radius=8)
        cursor = "|" if active and (self.tick // 15) % 2 == 0 else ""
        self.draw_text(text + cursor, self.font_sm, (230, 235, 245), x + 14, y + h // 2 - 10)
        return pygame.Rect(x, y, w, h)

    def handle_connect_events(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN:
            if self.name_rect.collidepoint(event.pos):
                self.active_field = "name"
            elif self.ip_rect.collidepoint(event.pos):
                self.active_field = "ip"
            elif self.connect_btn.collidepoint(event.pos):
                self.try_connect()
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_TAB:
                self.active_field = "ip" if self.active_field == "name" else "name"
            elif event.key == pygame.K_RETURN:
                self.try_connect()
            elif event.key == pygame.K_BACKSPACE:
                if self.active_field == "name":
                    self.name_text = self.name_text[:-1]
                else:
                    self.ip_text = self.ip_text[:-1]
            else:
                char = event.unicode
                if char and char.isprintable():
                    if self.active_field == "name" and len(self.name_text) < 16:
                        self.name_text += char
                    elif self.active_field == "ip" and len(self.ip_text) < 45:
                        self.ip_text += char

    def try_connect(self):
        name = self.name_text.strip()
        ip = self.ip_text.strip()
        if not name:
            self.connect_error = "Please enter your name!"
            return
        if not ip:
            self.connect_error = "Please enter a server IP!"
            return
        self.connect_error = "Connecting..."
        pygame.display.flip()
        if self.connect_to_server(ip, name):
            self.screen_state = "game"
        else:
            if not self.connect_error or self.connect_error == "Connecting...":
                self.connect_error = "Could not connect to server"

    # --- Main Game Screen ---
    def draw_game_screen(self):
        self.draw_gradient_rect(0, 0, WIDTH, HEIGHT, BG_TOP, BG_BOT)

        # Header bar
        self.draw_gradient_rect(0, 0, WIDTH, 60, HEADER_TOP, HEADER_BOT)
        # Subtle bottom border
        pygame.draw.line(self.screen, (35, 80, 150), (0, 60), (WIDTH, 60), 2)

        self.draw_text("City", self.font_med, WHITE, 18, 16, shadow=True)

        # Coin display
        self.draw_coin_icon(WIDTH - 260, 22, 14)
        self.draw_text(f"{self.coins:,}", self.font_med, WHITE, WIDTH - 240, 12, shadow=True)
        self.draw_text("coins", self.font_tiny, (180, 210, 255), WIDTH - 240, 40)

        if self.income > 0:
            self.draw_text(f"+{self.income} bonus/solve", self.font_tiny, (170, 230, 170), WIDTH - 175, 40)

        # --- Math problem card ---
        prob_x, prob_y, prob_w, prob_h = 18, 72, 600, 120
        self.draw_shadow(prob_x, prob_y, prob_w, prob_h, radius=12, alpha=20)
        pygame.draw.rect(self.screen, WHITE, (prob_x, prob_y, prob_w, prob_h), border_radius=12)

        # "Solve" label with accent strip
        pygame.draw.rect(self.screen, ACCENT, (prob_x, prob_y, 6, prob_h), border_radius=3)
        self.draw_text("Solve:", self.font_xs, MID_GRAY, prob_x + 20, prob_y + 8)

        # Problem text
        self.draw_text(self.problem_text, self.font_big, BLACK, prob_x + prob_w // 2, prob_y + 28, center=True, shadow=True)

        # Answer input and submit
        self.answer_rect = self.draw_input(self.answer_text, prob_x + 20, prob_y + 72, 320, 38, True)
        self.submit_btn = self.draw_button("Submit", prob_x + 355, prob_y + 72, 110, 38, GREEN, GREEN_HOVER)

        # Result feedback
        if self.result_timer > 0:
            fade = min(255, self.result_timer * 12)
            if self.last_result == "correct":
                s = self.font_med.render("Correct!", True, GREEN)
            else:
                s = self.font_med.render("Try again!", True, RED)
            s.set_alpha(fade)
            r = s.get_rect()
            r.midleft = (prob_x + 480, prob_y + 91)
            self.screen.blit(s, r)
            self.result_timer -= 1

        # --- Town area ---
        self.draw_town()

        # --- Shop button ---
        self.shop_btn = self.draw_button("Shop", prob_x + prob_w - 105, prob_y + 8, 95, 36, PURPLE, PURPLE_HOVER)

        # --- Leaderboard ---
        self.draw_leaderboard()

        # --- Shop overlay ---
        if self.shop_open:
            self.draw_shop()

    # --- Town ---
    def draw_tree(self, x, y, size=1.0):
        s = size
        tw = int(6 * s)
        th = int(16 * s)
        # Shadow
        shadow_s = pygame.Surface((int(28 * s), int(10 * s)), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_s, (0, 0, 0, 30), shadow_s.get_rect())
        self.screen.blit(shadow_s, (x - int(14 * s), y - int(2 * s)))
        # Trunk with bark texture
        pygame.draw.rect(self.screen, (100, 70, 40), (x - tw // 2, y - th, tw, th), border_radius=2)
        pygame.draw.rect(self.screen, TREE_TRUNK, (x - tw // 2 + 1, y - th, tw - 2, th), border_radius=2)
        # Foliage - multiple overlapping circles for fuller look
        r1 = int(18 * s)
        dark_green = (45, 130, 45)
        mid_green = (60, 155, 55)
        light_green = (85, 180, 70)
        highlight = (110, 200, 90)
        pygame.draw.circle(self.screen, dark_green, (x + int(3 * s), y - th - r1 // 2 + int(3 * s)), int(14 * s))
        pygame.draw.circle(self.screen, mid_green, (x, y - th - r1 // 2), r1)
        pygame.draw.circle(self.screen, TREE_GREEN, (x - int(6 * s), y - th - r1 // 2 - int(2 * s)), int(13 * s))
        pygame.draw.circle(self.screen, light_green, (x + int(5 * s), y - th - r1 // 2 - int(4 * s)), int(11 * s))
        pygame.draw.circle(self.screen, highlight, (x - int(3 * s), y - th - r1 // 2 - int(6 * s)), int(7 * s))

    def draw_bush(self, x, y, size=1.0):
        s = size
        shadow_s = pygame.Surface((int(22 * s), int(8 * s)), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_s, (0, 0, 0, 25), shadow_s.get_rect())
        self.screen.blit(shadow_s, (x - int(11 * s), y - int(1 * s)))
        pygame.draw.ellipse(self.screen, (50, 140, 50), (x - int(10 * s), y - int(8 * s), int(20 * s), int(12 * s)))
        pygame.draw.ellipse(self.screen, (65, 160, 60), (x - int(7 * s), y - int(10 * s), int(14 * s), int(10 * s)))
        pygame.draw.ellipse(self.screen, (80, 175, 70), (x - int(4 * s), y - int(11 * s), int(9 * s), int(7 * s)))

    def draw_flower(self, x, y, color):
        # Stem
        pygame.draw.line(self.screen, (60, 140, 50), (x, y), (x, y + 6), 1)
        # Petals
        for angle_deg in range(0, 360, 72):
            angle = math.radians(angle_deg)
            px = x + int(3 * math.cos(angle))
            py = y + int(3 * math.sin(angle))
            pygame.draw.circle(self.screen, color, (px, py), 3)
        # Center
        pygame.draw.circle(self.screen, (255, 240, 150), (x, y), 2)

    def get_plot_positions(self):
        """Generate plot positions in a wide grid. Sections stack vertically,
        each with 2 rows of plots across all columns."""
        positions = []
        section_h = ROW_HEIGHT * 2 + ROAD_THICK + 16
        for section in range(6):  # 6 sections
            base_y = section * section_h
            # Top row
            for x in PLOT_COLS:
                positions.append((x, base_y + 10))
            # Bottom row
            for x in PLOT_COLS:
                positions.append((x, base_y + ROW_HEIGHT))
        return positions

    def draw_town(self):
        town_x, town_y = 15, 200
        town_w, town_h = 605, HEIGHT - town_y - 15
        view_w = town_w
        view_h = town_h

        # Count buildings
        counts = {}
        for b in self.buildings:
            counts[b] = counts.get(b, 0) + 1

        # Generate all plot positions
        all_plots = self.get_plot_positions()

        # Assign buildings to plots
        plot_assignments = []
        for name in BUILDING_ORDER:
            if name in counts:
                plot_assignments.append((name, counts[name]))
        while len(plot_assignments) < len(all_plots):
            plot_assignments.append(None)

        # Total content size
        if all_plots:
            max_content_y = max(py for _, py in all_plots) + PLOT_H + 40
            max_content_x = max(px for px, _ in all_plots) + PLOT_W + 20
        else:
            max_content_y = view_h
            max_content_x = view_w
        total_h = max(max_content_y, view_h)
        total_w = max(max_content_x, view_w)

        # Clamp scroll
        max_scroll_y = max(0, total_h - view_h)
        max_scroll_x = max(0, total_w - view_w)
        self.town_scroll_y = max(0, min(self.town_scroll_y, max_scroll_y))
        self.town_scroll_x = max(0, min(self.town_scroll_x, max_scroll_x))
        sx = self.town_scroll_x
        sy = self.town_scroll_y

        # Clip region for town
        clip_rect = pygame.Rect(town_x, town_y, town_w, view_h)
        self.screen.set_clip(clip_rect)

        # Grass background - base color
        pygame.draw.rect(self.screen, (95, 175, 65), (town_x, town_y, town_w, view_h), border_radius=14)

        # Grass shade variation - large soft patches for natural look
        grass_shades = [
            (40, 80, 70, 50, (110, 190, 78, 70)),
            (200, 50, 60, 40, (100, 180, 68, 60)),
            (400, 90, 80, 45, (118, 198, 82, 65)),
            (80, 300, 65, 35, (90, 170, 60, 55)),
            (350, 320, 75, 40, (108, 188, 74, 60)),
            (500, 250, 55, 30, (120, 200, 85, 50)),
            (700, 150, 65, 40, (105, 185, 72, 60)),
            (850, 220, 50, 35, (98, 178, 66, 55)),
            (150, 200, 90, 55, (115, 195, 80, 50)),
            (600, 100, 70, 45, (108, 186, 75, 55)),
        ]
        for gpx, gpy, gpw, gph, gc in grass_shades:
            draw_x = town_x + gpx - (sx % 520)
            while draw_x < town_x + view_w + gpw:
                draw_y = town_y + gpy - (sy % 420)
                while draw_y < town_y + view_h + gph:
                    if draw_y + gph > town_y - gph and draw_x + gpw > town_x - gpw:
                        gs = pygame.Surface((gpw, gph), pygame.SRCALPHA)
                        pygame.draw.ellipse(gs, gc, (0, 0, gpw, gph))
                        self.screen.blit(gs, (draw_x, draw_y))
                    draw_y += 420
                draw_x += 520

        # Grass blade tufts - small lines for texture
        import random
        rng = random.Random(42)
        tuft_positions = [(rng.randint(0, 960), rng.randint(0, 960)) for _ in range(80)]
        for tpx, tpy in tuft_positions:
            draw_x = town_x + tpx - (sx % 480)
            draw_y = town_y + tpy - (sy % 480)
            if draw_x < town_x - 10 or draw_x > town_x + view_w + 10:
                continue
            if draw_y < town_y - 10 or draw_y > town_y + view_h + 10:
                continue
            blade_col = rng.choice([(80, 165, 55), (100, 185, 70), (70, 155, 50)])
            for _ in range(3):
                bx = rng.randint(-3, 3)
                pygame.draw.line(self.screen, blade_col, (draw_x + bx, draw_y), (draw_x + bx + rng.randint(-2, 2), draw_y - rng.randint(3, 7)), 1)

        # --- Vertical roads ---
        for road_vx in ROAD_V_POSITIONS:
            vx = town_x + road_vx - sx
            if vx + ROAD_THICK + 12 < town_x or vx - 8 > town_x + view_w:
                continue
            # Sidewalk with curb
            pygame.draw.rect(self.screen, (185, 180, 170), (vx - 7, town_y, ROAD_THICK + 14, view_h))
            pygame.draw.rect(self.screen, SIDEWALK, (vx - 5, town_y, ROAD_THICK + 10, view_h))
            # Road surface
            pygame.draw.rect(self.screen, ROAD_FILL, (vx, town_y, ROAD_THICK, view_h))
            # Subtle road texture
            for ry_off in range(-(int(sy) % 8), view_h + 8, 8):
                shade = 135 + (ry_off % 16 < 8) * 5
                pygame.draw.line(self.screen, (shade, shade - 2, shade - 6),
                                 (vx + 1, town_y + ry_off), (vx + ROAD_THICK - 1, town_y + ry_off), 1)
            # Curb edges
            pygame.draw.line(self.screen, (170, 165, 155), (vx - 1, town_y), (vx - 1, town_y + view_h), 2)
            pygame.draw.line(self.screen, (170, 165, 155), (vx + ROAD_THICK + 1, town_y), (vx + ROAD_THICK + 1, town_y + view_h), 2)
            # Center line - double yellow
            cx = vx + ROAD_THICK // 2
            pygame.draw.line(self.screen, (220, 200, 80), (cx - 2, town_y), (cx - 2, town_y + view_h), 2)
            pygame.draw.line(self.screen, (220, 200, 80), (cx + 2, town_y), (cx + 2, town_y + view_h), 2)

        # --- Horizontal roads between sections ---
        section_h = ROW_HEIGHT * 2 + ROAD_THICK + 16
        for section in range(8):
            road_local_y = section * section_h + ROW_HEIGHT * 2 - 15
            hy = town_y + road_local_y - sy
            if hy > town_y + view_h + 15 or hy + ROAD_THICK < town_y - 15:
                continue
            road_draw_x = town_x - sx - 10
            road_draw_w = total_w + 60
            # Sidewalk with curb
            pygame.draw.rect(self.screen, (185, 180, 170), (road_draw_x, hy - 7, road_draw_w, ROAD_THICK + 14))
            pygame.draw.rect(self.screen, SIDEWALK, (road_draw_x, hy - 5, road_draw_w, ROAD_THICK + 10))
            # Road surface
            pygame.draw.rect(self.screen, ROAD_FILL, (road_draw_x, hy, road_draw_w, ROAD_THICK))
            # Road texture
            for rx_off in range(0, road_draw_w, 8):
                shade = 135 + (rx_off % 16 < 8) * 5
                pygame.draw.line(self.screen, (shade, shade - 2, shade - 6),
                                 (road_draw_x + rx_off, hy + 1), (road_draw_x + rx_off, hy + ROAD_THICK - 1), 1)
            # Curb edges
            pygame.draw.line(self.screen, (170, 165, 155), (road_draw_x, hy - 1), (road_draw_x + road_draw_w, hy - 1), 2)
            pygame.draw.line(self.screen, (170, 165, 155), (road_draw_x, hy + ROAD_THICK + 1), (road_draw_x + road_draw_w, hy + ROAD_THICK + 1), 2)
            # Center line - double yellow
            cy = hy + ROAD_THICK // 2
            pygame.draw.line(self.screen, (220, 200, 80), (road_draw_x, cy - 2), (road_draw_x + road_draw_w, cy - 2), 2)
            pygame.draw.line(self.screen, (220, 200, 80), (road_draw_x, cy + 2), (road_draw_x + road_draw_w, cy + 2), 2)
            # Crosswalks at intersections
            for road_vx in ROAD_V_POSITIONS:
                ivx = town_x + road_vx - sx
                # Fill intersection
                pygame.draw.rect(self.screen, ROAD_FILL, (ivx - 5, hy - 5, ROAD_THICK + 10, ROAD_THICK + 10))
                # Crosswalk stripes (white bars)
                # Across vertical road (above and below intersection)
                for cwy in [hy - 14, hy + ROAD_THICK + 3]:
                    for cwx in range(ivx + 2, ivx + ROAD_THICK - 2, 7):
                        pygame.draw.rect(self.screen, (230, 225, 215), (cwx, cwy, 5, 10), border_radius=1)
                # Across horizontal road (left and right of intersection)
                for cwx in [ivx - 14, ivx + ROAD_THICK + 3]:
                    for cwy in range(hy + 2, hy + ROAD_THICK - 2, 7):
                        pygame.draw.rect(self.screen, (230, 225, 215), (cwx, cwy, 10, 5), border_radius=1)

        # --- Bushes along roads ---
        bush_templates = [(280, 60, 0.7), (620, 90, 0.8), (280, 200, 0.6), (620, 250, 0.75),
                          (280, 340, 0.65), (620, 380, 0.7)]
        for bx, by, bs in bush_templates:
            draw_x = town_x + bx - sx
            if draw_x < town_x - 20 or draw_x > town_x + view_w + 20:
                continue
            draw_y = town_y + by - (sy % 450)
            while draw_y < town_y + view_h + 20:
                if draw_y > town_y - 20:
                    self.draw_bush(draw_x, draw_y, bs)
                draw_y += 450

        # --- Trees (scattered, tiled with both scrolls) ---
        tree_templates = [(130, 50, 0.9), (260, 120, 1.15), (40, 300, 1.0),
                          (520, 280, 0.9), (750, 200, 1.1), (900, 100, 0.75),
                          (450, 50, 1.0), (180, 350, 0.85), (370, 200, 0.95),
                          (810, 320, 0.8)]
        for tx, ty, ts in tree_templates:
            draw_x = town_x + tx - sx
            if draw_x < town_x - 40 or draw_x > town_x + view_w + 40:
                continue
            draw_y = town_y + ty - (sy % 500)
            while draw_y < town_y + view_h + 40:
                if draw_y > town_y - 40:
                    self.draw_tree(draw_x, draw_y, ts)
                draw_y += 500

        # --- Flowers (tiled with both scrolls) ---
        flower_templates = [(30, 130, (255, 100, 120)), (500, 80, (180, 120, 255)),
                            (545, 300, (255, 130, 80)), (100, 140, (120, 200, 255)),
                            (700, 180, (255, 200, 100)), (850, 260, (200, 100, 255)),
                            (60, 250, (255, 180, 200)), (420, 160, (255, 255, 100)),
                            (780, 300, (255, 140, 160)), (200, 80, (200, 160, 255))]
        for fx, fy, fc in flower_templates:
            draw_x = town_x + fx - sx
            if draw_x < town_x - 10 or draw_x > town_x + view_w + 10:
                continue
            draw_y = town_y + fy - (sy % 400)
            while draw_y < town_y + view_h + 10:
                if draw_y > town_y - 10:
                    self.draw_flower(draw_x, draw_y, fc)
                draw_y += 400

        # --- Building plots ---
        for i, (px, py) in enumerate(all_plots):
            abs_x = town_x + px - sx
            abs_y = town_y + py - sy

            # Skip if off screen
            if (abs_y > town_y + view_h + 20 or abs_y + PLOT_H < town_y - 20 or
                    abs_x > town_x + view_w + 20 or abs_x + PLOT_W < town_x - 20):
                continue

            if i < len(plot_assignments) and plot_assignments[i] is not None:
                name, count = plot_assignments[i]
                inc = BUILDINGS[name][1]

                # Building image
                if name in self.building_images:
                    img = self.building_images[name]
                    img_x = abs_x + (PLOT_W - 90) // 2
                    img_y = abs_y + 2
                    shadow = pygame.Surface((94, 18), pygame.SRCALPHA)
                    pygame.draw.ellipse(shadow, (0, 0, 0, 35), (0, 0, 94, 18))
                    self.screen.blit(shadow, (img_x - 2, img_y + 78))
                    self.screen.blit(img, (img_x, img_y))

                # Count badge
                bx, by = abs_x + PLOT_W - 16, abs_y + 6
                pygame.draw.circle(self.screen, ACCENT, (bx, by), 14)
                pygame.draw.circle(self.screen, WHITE, (bx, by), 14, 2)
                self.draw_text(f"x{count}", self.font_xs, WHITE, bx, by, center=True)

                # Name plate
                plate_cx = abs_x + PLOT_W // 2
                plate_y = abs_y + 96
                tw = self.font_xs.size(name)[0] + 14
                ps = pygame.Surface((tw, 20), pygame.SRCALPHA)
                pygame.draw.rect(ps, (255, 255, 255, 210), (0, 0, tw, 20), border_radius=5)
                self.screen.blit(ps, (plate_cx - tw // 2, plate_y))
                self.draw_text(name, self.font_xs, DARK_GRAY, plate_cx, plate_y + 10, center=True)

                # Income label
                inc_text = f"+{inc * count}/solve"
                iw = self.font_tiny.size(inc_text)[0] + 10
                inc_s = pygame.Surface((iw, 16), pygame.SRCALPHA)
                pygame.draw.rect(inc_s, (60, 150, 60, 160), (0, 0, iw, 16), border_radius=4)
                self.screen.blit(inc_s, (plate_cx - iw // 2, plate_y + 22))
                self.draw_text(inc_text, self.font_tiny, WHITE, plate_cx, plate_y + 30, center=True)
            else:
                # Empty plot
                eh = PLOT_H - 10
                ps = pygame.Surface((PLOT_W, eh), pygame.SRCALPHA)
                pygame.draw.rect(ps, (0, 0, 0, 18), (0, 0, PLOT_W, eh), border_radius=10)
                for ssx in range(0, PLOT_W, 12):
                    pygame.draw.rect(ps, (255, 255, 255, 50), (ssx, 0, 6, 2))
                    pygame.draw.rect(ps, (255, 255, 255, 50), (ssx, eh - 2, 6, 2))
                for ssy in range(0, eh, 12):
                    pygame.draw.rect(ps, (255, 255, 255, 50), (0, ssy, 2, 6))
                    pygame.draw.rect(ps, (255, 255, 255, 50), (PLOT_W - 2, ssy, 2, 6))
                self.screen.blit(ps, (abs_x, abs_y))

                sign_cx = abs_x + PLOT_W // 2
                sign_y = abs_y + eh // 2 - 15
                pygame.draw.rect(self.screen, FENCE_COLOR, (sign_cx - 2, sign_y + 15, 4, 20))
                ss = pygame.Surface((70, 24), pygame.SRCALPHA)
                pygame.draw.rect(ss, (255, 255, 255, 180), (0, 0, 70, 24), border_radius=4)
                pygame.draw.rect(ss, (*FENCE_COLOR, 200), (0, 0, 70, 24), 1, border_radius=4)
                self.screen.blit(ss, (sign_cx - 35, sign_y - 6))
                self.draw_text("FOR SALE", self.font_tiny, FENCE_COLOR, sign_cx, sign_y + 5, center=True)

        # Reset clip
        self.screen.set_clip(None)

        # Town label (on top, not scrolled)
        ls = pygame.Surface((130, 28), pygame.SRCALPHA)
        pygame.draw.rect(ls, (255, 255, 255, 190), (0, 0, 130, 28), border_radius=8)
        self.screen.blit(ls, (town_x + 6, town_y + 6))
        self.draw_text("Your Town", self.font_sm, GRASS_3, town_x + 71, town_y + 20, center=True)

        # Vertical scrollbar
        if max_scroll_y > 0:
            bar_h = view_h - 20
            thumb_h = max(30, int(bar_h * (view_h / total_h)))
            thumb_y = town_y + 10 + int((bar_h - thumb_h) * (sy / max_scroll_y))
            bar_x = town_x + town_w - 10
            track_s = pygame.Surface((6, bar_h), pygame.SRCALPHA)
            pygame.draw.rect(track_s, (0, 0, 0, 30), (0, 0, 6, bar_h), border_radius=3)
            self.screen.blit(track_s, (bar_x, town_y + 10))
            thumb_s = pygame.Surface((6, thumb_h), pygame.SRCALPHA)
            pygame.draw.rect(thumb_s, (0, 0, 0, 80), (0, 0, 6, thumb_h), border_radius=3)
            self.screen.blit(thumb_s, (bar_x, thumb_y))

        # Horizontal scrollbar
        if max_scroll_x > 0:
            bar_w = view_w - 20
            thumb_w = max(30, int(bar_w * (view_w / total_w)))
            thumb_x = town_x + 10 + int((bar_w - thumb_w) * (sx / max_scroll_x))
            bar_y = town_y + view_h - 10
            track_s = pygame.Surface((bar_w, 6), pygame.SRCALPHA)
            pygame.draw.rect(track_s, (0, 0, 0, 30), (0, 0, bar_w, 6), border_radius=3)
            self.screen.blit(track_s, (town_x + 10, bar_y))
            thumb_s = pygame.Surface((thumb_w, 6), pygame.SRCALPHA)
            pygame.draw.rect(thumb_s, (0, 0, 0, 80), (0, 0, thumb_w, 6), border_radius=3)
            self.screen.blit(thumb_s, (thumb_x, bar_y))

    # --- Leaderboard ---
    def draw_leaderboard(self):
        lx = 635
        lb_w = WIDTH - lx - 15
        lb_h = HEIGHT - 215

        # Card
        self.draw_shadow(lx, 200, lb_w, lb_h, radius=14, alpha=20)
        pygame.draw.rect(self.screen, WHITE, (lx, 200, lb_w, lb_h), border_radius=14)

        # Header
        self.draw_gradient_rect(lx, 200, lb_w, 42, HEADER_TOP, HEADER_BOT, radius=14)
        # Fix bottom corners of header (overlap with card body)
        pygame.draw.rect(self.screen, HEADER_BOT, (lx, 228, lb_w, 14))
        pygame.draw.rect(self.screen, WHITE, (lx, 236, lb_w, 10))
        self.draw_text("Leaderboard", self.font_sm, WHITE, lx + lb_w // 2, 214, center=True)

        medal_colors = [GOLD, SILVER, BRONZE]
        y = 255
        for i, entry in enumerate(self.leaderboard[:6]):
            name = entry["name"]
            if len(name) > 10:
                name = name[:9] + ".."

            # Row highlight for top 3
            if i < 3:
                row_s = pygame.Surface((lb_w - 20, 28), pygame.SRCALPHA)
                pygame.draw.rect(row_s, (*medal_colors[i], 25), (0, 0, lb_w - 20, 28), border_radius=6)
                self.screen.blit(row_s, (lx + 10, y - 4))

            # Medal or number
            if i < 3:
                pygame.draw.circle(self.screen, medal_colors[i], (lx + 24, y + 9), 10)
                self.draw_text(str(i + 1), self.font_tiny, WHITE, lx + 24, y + 9, center=True)
            else:
                self.draw_text(f"{i + 1}.", self.font_xs, MID_GRAY, lx + 16, y)

            self.draw_text(name, self.font_xs, DARK_GRAY, lx + 42, y)

            # Coin amount
            coins_text = f"{entry['coins']:,}"
            self.draw_coin_icon(lx + lb_w - 55, y + 9, 7)
            self.draw_text(coins_text, self.font_xs, COIN_DARK, lx + lb_w - 44, y)

            y += 34

    # --- Shop ---
    def draw_shop(self):
        # Overlay
        overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 140))
        self.screen.blit(overlay, (0, 0))

        # Shop panel
        sw, sh = 720, 580
        sx = (WIDTH - sw) // 2
        sy = (HEIGHT - sh) // 2
        self.draw_shadow(sx, sy, sw, sh, radius=16, offset=8, alpha=40)
        pygame.draw.rect(self.screen, WHITE, (sx, sy, sw, sh), border_radius=16)

        # Header area
        self.draw_gradient_rect(sx, sy, sw, 55, HEADER_TOP, HEADER_BOT, radius=16)
        pygame.draw.rect(self.screen, HEADER_BOT, (sx, sy + 40, sw, 15))
        pygame.draw.rect(self.screen, WHITE, (sx, sy + 50, sw, 10))
        self.draw_text("Shop", self.font_med, WHITE, sx + sw // 2, sy + 22, center=True, shadow=True)

        # Close button
        self.shop_close_btn = self.draw_button("X", sx + sw - 48, sy + 8, 36, 36, RED, RED_HOVER, self.font_sm)

        # Coin balance
        self.draw_coin_icon(sx + sw // 2 - 60, sy + 73, 10)
        self.draw_text(f"{self.coins:,} coins", self.font_sm, COIN_DARK, sx + sw // 2 - 45, sy + 64)

        # Scrollable building list area
        list_top = sy + 95
        list_h = sh - 105
        row_h = 78
        row_gap = 8
        total_content = len(BUILDING_ORDER) * (row_h + row_gap) + 10
        max_shop_scroll = max(0, total_content - list_h)
        self.shop_scroll = max(0, min(self.shop_scroll, max_shop_scroll))

        # Clip to list area
        clip_rect = pygame.Rect(sx, list_top, sw, list_h)
        self.screen.set_clip(clip_rect)

        # Building rows
        self.buy_buttons = []
        for idx, name in enumerate(BUILDING_ORDER):
            cost, inc = BUILDINGS[name]
            color = BUILDING_COLORS[name]
            can_afford = self.coins >= cost

            y = list_top + idx * (row_h + row_gap) - int(self.shop_scroll)

            # Skip if off screen
            if y + row_h < list_top - 10 or y > list_top + list_h + 10:
                continue

            # Row card
            row_w = sw - 40
            row_s = pygame.Surface((row_w, row_h), pygame.SRCALPHA)
            pygame.draw.rect(row_s, (*color, 35), (0, 0, row_w, row_h), border_radius=10)
            pygame.draw.rect(row_s, (*color, 120), (0, 0, row_w, row_h), 2, border_radius=10)
            self.screen.blit(row_s, (sx + 20, y))

            # Building image
            if name in self.building_images_shop:
                self.screen.blit(self.building_images_shop[name], (sx + 30, y + 13))

            # Text
            text_x = sx + 92
            self.draw_text(name, self.font_med, BLACK, text_x, y + 10)
            self.draw_coin_icon(text_x, y + 50, 7)
            self.draw_text(f"{cost:,}", self.font_xs, COIN_DARK, text_x + 12, y + 42)
            cost_w = self.font_xs.size(f"{cost:,}")[0]
            self.draw_text(f"  +{inc}/solve", self.font_xs, (60, 140, 60), text_x + 12 + cost_w, y + 42)

            # Buy button
            btn_color = GREEN if can_afford else LIGHT_GRAY
            btn_hover = GREEN_HOVER if can_afford else LIGHT_GRAY
            btn_text = "Buy" if can_afford else "---"
            btn = self.draw_button(btn_text, sx + sw - 130, y + 19, 95, 40, btn_color, btn_hover)
            self.buy_buttons.append((btn, name, can_afford))

        self.screen.set_clip(None)

        # Scroll indicator for shop
        if max_shop_scroll > 0:
            bar_h = list_h - 20
            thumb_h = max(30, int(bar_h * (list_h / total_content)))
            thumb_y = list_top + 10 + int((bar_h - thumb_h) * (self.shop_scroll / max_shop_scroll))
            bar_x = sx + sw - 14
            track_s = pygame.Surface((6, bar_h), pygame.SRCALPHA)
            pygame.draw.rect(track_s, (0, 0, 0, 30), (0, 0, 6, bar_h), border_radius=3)
            self.screen.blit(track_s, (bar_x, list_top + 10))
            thumb_s = pygame.Surface((6, thumb_h), pygame.SRCALPHA)
            pygame.draw.rect(thumb_s, (0, 0, 0, 80), (0, 0, 6, thumb_h), border_radius=3)
            self.screen.blit(thumb_s, (bar_x, thumb_y))

    def handle_game_events(self, event):
        if event.type == pygame.MOUSEWHEEL:
            if self.shop_open:
                self.shop_scroll -= event.y * 30
            else:
                mods = pygame.key.get_mods()
                if mods & pygame.KMOD_SHIFT:
                    self.town_scroll_x -= event.y * 30
                else:
                    self.town_scroll_y -= event.y * 30
                    if event.x != 0:
                        self.town_scroll_x -= event.x * 30
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if self.shop_open:
                if self.shop_close_btn.collidepoint(event.pos):
                    self.shop_open = False
                for btn, name, can_afford in self.buy_buttons:
                    if btn.collidepoint(event.pos) and can_afford:
                        self.send({"type": "buy", "building": name})
            else:
                if self.shop_btn.collidepoint(event.pos):
                    self.shop_open = True
                    self.shop_scroll = 0
                    self.buy_buttons = []
                elif self.submit_btn.collidepoint(event.pos):
                    self.submit_answer()
                elif event.button == 1:
                    # Start drag panning in town area
                    town_rect = pygame.Rect(15, 200, 605, HEIGHT - 215)
                    if town_rect.collidepoint(event.pos):
                        self.town_dragging = True
                        self.drag_start = event.pos
                        self.drag_scroll_start = (self.town_scroll_x, self.town_scroll_y)
        elif event.type == pygame.MOUSEBUTTONUP:
            self.town_dragging = False
        elif event.type == pygame.MOUSEMOTION:
            if self.town_dragging and not self.shop_open:
                dx = self.drag_start[0] - event.pos[0]
                dy = self.drag_start[1] - event.pos[1]
                self.town_scroll_x = self.drag_scroll_start[0] + dx
                self.town_scroll_y = self.drag_scroll_start[1] + dy
        elif event.type == pygame.KEYDOWN and not self.shop_open:
            if event.key == pygame.K_RETURN:
                self.submit_answer()
            elif event.key == pygame.K_BACKSPACE:
                self.answer_text = self.answer_text[:-1]
            elif event.key == pygame.K_ESCAPE:
                if self.shop_open:
                    self.shop_open = False
            else:
                char = event.unicode
                if char and (char.isdigit() or char == "-"):
                    if len(self.answer_text) < 10:
                        self.answer_text += char
        elif event.type == pygame.KEYDOWN and self.shop_open:
            if event.key == pygame.K_ESCAPE:
                self.shop_open = False

    def submit_answer(self):
        if self.answer_text.strip():
            try:
                val = int(self.answer_text.strip())
                self.send({"type": "answer", "answer": val})
            except ValueError:
                pass
            self.answer_text = ""

    # --- Main loop ---
    def run(self):
        self.name_rect = pygame.Rect(0, 0, 0, 0)
        self.ip_rect = pygame.Rect(0, 0, 0, 0)
        self.connect_btn = pygame.Rect(0, 0, 0, 0)
        self.submit_btn = pygame.Rect(0, 0, 0, 0)
        self.shop_btn = pygame.Rect(0, 0, 0, 0)
        self.shop_close_btn = pygame.Rect(0, 0, 0, 0)
        self.buy_buttons = []
        self.answer_rect = pygame.Rect(0, 0, 0, 0)

        while self.running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                elif self.screen_state == "connect":
                    self.handle_connect_events(event)
                elif self.screen_state == "game":
                    self.handle_game_events(event)

            if self.screen_state == "connect":
                self.draw_connect_screen()
            elif self.screen_state == "game":
                if not self.connected:
                    self.screen_state = "connect"
                    self.connect_error = "Disconnected from server"
                else:
                    self.draw_game_screen()

            pygame.display.flip()
            self.clock.tick(FPS)
            self.tick += 1

        if self.sock:
            self.sock.close()
        pygame.quit()


if __name__ == "__main__":
    Client().run()
