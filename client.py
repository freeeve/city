"""Math Tycoon client - Pygame UI with network communication."""

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
        pygame.display.set_caption("Math Tycoon")
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
        # Gradient background
        self.draw_gradient_rect(0, 0, WIDTH, HEIGHT, BG_TOP, BG_BOT)

        # Decorative circles
        for i, (cx, cy, r, a) in enumerate([(80, 650, 120, 15), (920, 100, 80, 12),
                                             (150, 120, 40, 18), (850, 600, 60, 14)]):
            s = pygame.Surface((r * 2, r * 2), pygame.SRCALPHA)
            pygame.draw.circle(s, (ACCENT[0], ACCENT[1], ACCENT[2], a), (r, r), r)
            self.screen.blit(s, (cx - r, cy - r))

        # Center card
        card_w, card_h = 460, 380
        card_x = (WIDTH - card_w) // 2
        card_y = (HEIGHT - card_h) // 2 + 30
        self.draw_shadow(card_x, card_y, card_w, card_h, radius=16, offset=6, alpha=35)
        pygame.draw.rect(self.screen, WHITE, (card_x, card_y, card_w, card_h), border_radius=16)

        # Title above card
        self.draw_text("Math Tycoon", self.font_title, ACCENT, WIDTH // 2, card_y - 60, center=True, shadow=True)
        self.draw_text("Solve math, earn coins, build your town!", self.font_sm, MID_GRAY, WIDTH // 2, card_y - 15, center=True)

        # Form inside card
        fx = card_x + 40
        fw = card_w - 80

        self.draw_text("Your Name", self.font_xs, DARK_GRAY, fx, card_y + 30)
        self.name_rect = self.draw_input(self.name_text, fx, card_y + 52, fw, 42, self.active_field == "name")

        self.draw_text("Server IP", self.font_xs, DARK_GRAY, fx, card_y + 115)
        self.ip_rect = self.draw_input(self.ip_text, fx, card_y + 137, fw, 42, self.active_field == "ip")

        self.connect_btn = self.draw_button("Connect", fx + 40, card_y + 220, fw - 80, 50, GREEN, GREEN_HOVER, self.font_med)

        if self.connect_error:
            color = MID_GRAY if self.connect_error == "Connecting..." else RED
            self.draw_text(self.connect_error, self.font_xs, color, WIDTH // 2, card_y + 300, center=True)

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

        self.draw_text("Math Tycoon", self.font_med, WHITE, 18, 16, shadow=True)

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
        # Trunk
        tw = int(6 * s)
        th = int(14 * s)
        pygame.draw.rect(self.screen, TREE_TRUNK, (x - tw // 2, y - th, tw, th), border_radius=2)
        # Foliage layers
        r1 = int(16 * s)
        r2 = int(12 * s)
        pygame.draw.circle(self.screen, TREE_GREEN, (x, y - th - r1 // 2), r1)
        pygame.draw.circle(self.screen, TREE_LIGHT, (x - int(4 * s), y - th - r1 // 2 - int(4 * s)), r2)
        pygame.draw.circle(self.screen, TREE_GREEN, (x + int(5 * s), y - th - r1 // 2 - int(2 * s)), int(10 * s))

    def draw_flower(self, x, y, color):
        pygame.draw.circle(self.screen, color, (x, y), 4)
        pygame.draw.circle(self.screen, (255, 255, 200), (x, y), 2)

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

        # Grass background
        pygame.draw.rect(self.screen, GRASS_1, (town_x, town_y, town_w, view_h), border_radius=14)

        # Grass patches (tile with both scrolls)
        patch_templates = [(40, 80, 60, 40), (200, 50, 50, 30), (400, 90, 70, 35),
                           (80, 300, 55, 30), (350, 320, 65, 35), (500, 250, 45, 25),
                           (700, 150, 55, 35), (850, 220, 45, 30)]
        for px, py, pw, ph in patch_templates:
            draw_x = town_x + px - (sx % 500)
            while draw_x < town_x + view_w:
                draw_y = town_y + py - (sy % 400)
                while draw_y < town_y + view_h:
                    if draw_y + ph > town_y - ph and draw_x + pw > town_x - pw:
                        s = pygame.Surface((pw, ph), pygame.SRCALPHA)
                        pygame.draw.ellipse(s, (*GRASS_2, 90), (0, 0, pw, ph))
                        self.screen.blit(s, (draw_x, draw_y))
                    draw_y += 400
                draw_x += 500

        # --- Vertical roads ---
        for road_vx in ROAD_V_POSITIONS:
            vx = town_x + road_vx - sx
            if vx + ROAD_THICK + 8 < town_x or vx - 4 > town_x + view_w:
                continue
            pygame.draw.rect(self.screen, SIDEWALK, (vx - 4, town_y, ROAD_THICK + 8, view_h))
            pygame.draw.rect(self.screen, ROAD_FILL, (vx, town_y, ROAD_THICK, view_h))
            pygame.draw.line(self.screen, ROAD_EDGE, (vx, town_y), (vx, town_y + view_h), 2)
            pygame.draw.line(self.screen, ROAD_EDGE, (vx + ROAD_THICK, town_y), (vx + ROAD_THICK, town_y + view_h), 2)
            dash_start = -(sy % 44)
            for ry_off in range(int(dash_start), view_h + 44, 44):
                pygame.draw.rect(self.screen, ROAD_DASH, (vx + ROAD_THICK // 2 - 2, town_y + ry_off, 4, 24), border_radius=2)

        # --- Horizontal roads between sections ---
        section_h = ROW_HEIGHT * 2 + ROAD_THICK + 16
        for section in range(8):
            road_local_y = section * section_h + ROW_HEIGHT * 2 - 15
            hy = town_y + road_local_y - sy
            if hy > town_y + view_h + 10 or hy + ROAD_THICK < town_y - 10:
                continue
            road_draw_x = town_x - sx
            road_draw_w = total_w + 40
            pygame.draw.rect(self.screen, SIDEWALK, (road_draw_x, hy - 4, road_draw_w, ROAD_THICK + 8))
            pygame.draw.rect(self.screen, ROAD_FILL, (road_draw_x, hy, road_draw_w, ROAD_THICK))
            pygame.draw.line(self.screen, ROAD_EDGE, (road_draw_x, hy), (road_draw_x + road_draw_w, hy), 2)
            pygame.draw.line(self.screen, ROAD_EDGE, (road_draw_x, hy + ROAD_THICK), (road_draw_x + road_draw_w, hy + ROAD_THICK), 2)
            dash_sx = -(sx % 44)
            for rx_off in range(int(dash_sx), view_w + 44, 44):
                pygame.draw.rect(self.screen, ROAD_DASH, (town_x + rx_off, hy + ROAD_THICK // 2 - 2, 24, 4), border_radius=2)
            # Intersections
            for road_vx in ROAD_V_POSITIONS:
                ivx = town_x + road_vx - sx
                pygame.draw.rect(self.screen, ROAD_FILL, (ivx, hy, ROAD_THICK, ROAD_THICK))

        # --- Trees (scattered, tiled with both scrolls) ---
        tree_templates = [(130, 50, 0.9), (270, 120, 1.1), (40, 300, 1.0),
                          (520, 280, 0.85), (750, 200, 1.05), (900, 100, 0.7),
                          (450, 50, 0.95), (180, 350, 0.8)]
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
                            (700, 180, (255, 200, 100)), (850, 260, (200, 100, 255))]
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
