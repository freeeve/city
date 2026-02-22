"""City client - Pygame UI with network communication."""

import pygame
import socket
import threading
import json
import os
import math
from shared import BUILDINGS, BUILDING_ORDER, BUILDING_COLORS, CARS, CAR_ORDER, BUILDING_POPULATION, UNLOCK_REQUIREMENTS, GRADE_LABELS, PORT

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
GOLD_BTN = (220, 180, 40)
GOLD_BTN_HOVER = (190, 155, 30)

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

# 3D oblique projection
DEPTH_PX = 20
SIDE_DX = 10   # horizontal offset for side/top faces
SIDE_DY = -10  # vertical offset (upward)

# Leaderboard medal colors
GOLD = (255, 200, 50)
SILVER = (190, 195, 205)
BRONZE = (205, 150, 90)

# Town layout
ROAD_THICK = 36
ROW_HEIGHT = 160
PLOT_W, PLOT_H = 120, 115

# Grid: columns of plots separated by vertical roads
# Column positions (x offsets in world space)
PLOT_COLS = [10, 170, 380, 540, 750, 910]
# Vertical road x positions (in world space)
ROAD_V_POSITIONS = [330, 700]
# Total town world width
TOWN_WORLD_W = 1070

# Residential neighbourhood
HOUSE_W, HOUSE_H = 40, 45
RESIDENTIAL_Y_START = 402 * 6  # Below all 6 commercial sections (2412)
HOUSE_COLORS = [(180,120,90), (160,170,185), (200,180,140), (170,140,130),
                (190,200,170), (220,200,180), (150,160,180), (200,160,140)]
ROOF_COLORS = [(140,60,50), (80,80,90), (120,90,60), (60,80,60)]


class Client:
    def __init__(self):
        pygame.init()
        self.fullscreen = False
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.RESIZABLE | pygame.SCALED)
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
            "Flower Shop": "flower_shop.png",
            "Pet Shop": "pet_shop.png",
            "Bakery": "bakery.png",
            "Toy Store": "toy_store.png",
            "Bookstore": "bookstore.png",
            "Movie Theater": "movie_theater.png",
            "Pizza Place": "pizza_place.png",
            "Arcade": "arcade.png",
            "Gym": "gym.png",
            "Hospital": "hospital.png",
            "Water Park": "water_park.png",
            "Library": "library.png",
            "Museum": "museum.png",
            "Theme Park": "theme_park.png",
            "Stadium": "stadium.png",
            "Airport": "airport.png",
            "Space Station": "space_station.png",
        }
        for name, filename in name_to_file.items():
            path = os.path.join(assets_dir, filename)
            if os.path.exists(path):
                img = pygame.image.load(path).convert_alpha()
                self.building_images[name] = pygame.transform.smoothscale(img, (72, 72))
                self.building_images_shop[name] = pygame.transform.smoothscale(img, (42, 42))

        # Pre-render 3D building composites
        self.building_images_3d = {}
        for name, front_img in self.building_images.items():
            base_color = BUILDING_COLORS.get(name, (150, 150, 150))
            fw, fh = front_img.get_size()  # 72x72
            # Composite surface: extra room for side/top faces
            comp_w = fw + abs(SIDE_DX) + 2
            comp_h = fh + abs(SIDE_DY) + 2
            comp = pygame.Surface((comp_w, comp_h), pygame.SRCALPHA)
            # Right side face (darker) - parallelogram on right edge of front
            dark = (max(0, base_color[0] - 60), max(0, base_color[1] - 60), max(0, base_color[2] - 60))
            side_pts = [
                (fw, abs(SIDE_DY)),          # front top-right
                (fw + SIDE_DX, abs(SIDE_DY) + SIDE_DY),  # back top-right
                (fw + SIDE_DX, fh + SIDE_DY),             # back bottom-right
                (fw, fh + abs(SIDE_DY)),                   # front bottom-right
            ]
            # Correct the points: front face sits at y=abs(SIDE_DY)
            front_y0 = abs(SIDE_DY)
            side_pts = [
                (fw, front_y0),                     # front top-right
                (fw + SIDE_DX, front_y0 + SIDE_DY), # back top-right (shifts up and right)
                (fw + SIDE_DX, front_y0 + fh + SIDE_DY),  # back bottom-right
                (fw, front_y0 + fh),                        # front bottom-right
            ]
            pygame.draw.polygon(comp, dark, side_pts)
            # Top face (lighter) - parallelogram on top edge of front
            light = (min(255, base_color[0] + 40), min(255, base_color[1] + 40), min(255, base_color[2] + 40))
            top_pts = [
                (0, front_y0),                       # front top-left
                (SIDE_DX, front_y0 + SIDE_DY),       # back top-left
                (fw + SIDE_DX, front_y0 + SIDE_DY),  # back top-right
                (fw, front_y0),                       # front top-right
            ]
            pygame.draw.polygon(comp, light, top_pts)
            # Edge lines for definition
            pygame.draw.polygon(comp, (max(0, dark[0] - 20), max(0, dark[1] - 20), max(0, dark[2] - 20)), side_pts, 1)
            pygame.draw.polygon(comp, (max(0, light[0] - 30), max(0, light[1] - 30), max(0, light[2] - 30)), top_pts, 1)
            # Front face (the existing PNG)
            comp.blit(front_img, (0, front_y0))
            self.building_images_3d[name] = comp

        # Network
        self.sock = None
        self.connected = False
        self.recv_thread = None

        # Game state from server
        self.coins = 0
        self.buildings = []
        self.cars = []
        self.population = 0
        self.pop_bonus = 1.0
        self.problem_text = ""
        self.income = 0
        self.leaderboard = []
        self.last_result = ""
        self.result_timer = 0
        self.rebirths = 0
        self.rebirth_btn = pygame.Rect(0, 0, 0, 0)

        # Car animation state
        self.car_anims = []
        self.car_anim_count = 0  # track when to reinitialize

        # Pedestrian animation state
        self.pedestrian_anims = []
        self.pedestrian_count = 0

        # Screens
        self.screen_state = "connect"
        self.shop_open = False

        # City viewing
        self.viewing_city = None  # dict with player_name, buildings, cars, etc.
        self.leaderboard_name_rects = []  # (rect, player_name) pairs
        self.view_scroll_x = 0
        self.view_scroll_y = 0
        self.view_close_btn = pygame.Rect(0, 0, 0, 0)

        # Connect screen fields
        self.ip_text = "localhost"
        self.name_text = ""
        self.active_field = "name"
        self.connect_error = ""
        self.grade = 3
        self.grade_left_btn = pygame.Rect(0, 0, 0, 0)
        self.grade_right_btn = pygame.Rect(0, 0, 0, 0)

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

        # Scratch pad
        self.scratch_surface = None  # created on first draw
        self.scratch_drawing = False
        self.scratch_last_pos = None
        self.scratch_rect = pygame.Rect(0, 0, 0, 0)
        self.scratch_clear_btn = pygame.Rect(0, 0, 0, 0)
        self.scratch_scroll_x = 0
        self.scratch_pad_w = 0  # visible width, set during draw
        self.scratch_typing = False  # toggle between draw and type mode
        self.scratch_text_lines = [""]  # lines of typed text
        self.scratch_cursor_line = 0
        self.scratch_cursor_col = 0
        self.scratch_type_btn = pygame.Rect(0, 0, 0, 0)
        self.scratch_draw_btn = pygame.Rect(0, 0, 0, 0)
        self.scratch_focused = False

        # Player character state
        self.player_x = 80.0   # world position (near first building plot)
        self.player_y = 140.0
        self.player_dir = 'right'
        self.player_moving = False
        self.player_speed = 3

        self.running = True

    # --- Networking ---
    def connect_to_server(self, ip, name):
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.settimeout(5)
            self.sock.connect((ip, PORT))
            self.sock.settimeout(None)
            msg = json.dumps({"type": "join", "name": name, "grade": self.grade}) + "\n"
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
            self.cars = msg.get("cars", [])
            self.population = msg.get("population", 0)
            self.pop_bonus = msg.get("pop_bonus", 1.0)
            self.problem_text = msg["problem"]["text"]
            self.income = msg["income"]
            self.leaderboard = msg["leaderboard"]
            self.rebirths = msg.get("rebirths", 0)
        elif msg["type"] == "result":
            self.last_result = msg["result"]
            self.result_timer = FPS * 2
        elif msg["type"] == "city_view":
            self.viewing_city = {
                "player_name": msg["player_name"],
                "coins": msg["coins"],
                "buildings": msg["buildings"],
                "cars": msg.get("cars", []),
                "population": msg.get("population", 0),
                "pop_bonus": msg.get("pop_bonus", 1.0),
            }
            self.view_scroll_x = 0
            self.view_scroll_y = 0
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

    def draw_person_icon(self, x, y, size=10):
        """Draw a small person silhouette."""
        # Head
        pygame.draw.circle(self.screen, WHITE, (x, y - size // 2), size // 3)
        # Body
        pygame.draw.rect(self.screen, WHITE, (x - size // 4, y - size // 6, size // 2, size // 2))
        # Legs
        pygame.draw.rect(self.screen, WHITE, (x - size // 4, y + size // 3, size // 5, size // 3))
        pygame.draw.rect(self.screen, WHITE, (x + size // 20, y + size // 3, size // 5, size // 3))

    def draw_car(self, surf, x, y, car_type, direction='right', scale=1.0):
        """Draw a car on the given surface at (x, y), facing its direction of travel."""
        color = CARS[car_type][2]
        dark = (max(0, color[0] - 40), max(0, color[1] - 40), max(0, color[2] - 40))
        window_color = (180, 210, 240)

        # Determine temp surface size for drawing car facing right
        if car_type == "Bicycle":
            tw, th = int(20 * scale), int(16 * scale)
        elif car_type == "Bus":
            tw, th = int(46 * scale), int(22 * scale)
        elif car_type == "Fire Truck":
            tw, th = int(44 * scale), int(20 * scale)
        elif car_type == "Scooter":
            tw, th = int(24 * scale), int(16 * scale)
        elif car_type == "Sports Car":
            tw, th = int(34 * scale), int(16 * scale)
        elif car_type == "Ice Cream Van":
            tw, th = int(36 * scale), int(22 * scale)
        else:
            tw, th = int(30 * scale), int(18 * scale)

        tmp = pygame.Surface((tw, th), pygame.SRCALPHA)
        cx, cy = tw // 2, th // 2  # center of temp surface

        if car_type == "Bicycle":
            w, h = int(16 * scale), int(10 * scale)
            pygame.draw.circle(tmp, (50, 50, 50), (cx - w // 3, cy + h // 3), int(3 * scale))
            pygame.draw.circle(tmp, (50, 50, 50), (cx + w // 3, cy + h // 3), int(3 * scale))
            pygame.draw.line(tmp, color, (cx - w // 3, cy + h // 3), (cx, cy - h // 3), max(1, int(scale)))
            pygame.draw.line(tmp, color, (cx + w // 3, cy + h // 3), (cx, cy - h // 3), max(1, int(scale)))
            pygame.draw.line(tmp, color, (cx - w // 3, cy + h // 3), (cx + w // 6, cy), max(1, int(scale)))
            pygame.draw.rect(tmp, dark, (cx - int(2 * scale), cy - h // 3 - int(2 * scale), int(4 * scale), int(2 * scale)))
        elif car_type == "Bus":
            w, h = int(40 * scale), int(16 * scale)
            bx = cx - w // 2
            pygame.draw.rect(tmp, color, (bx, cy - h // 2, w, h), border_radius=int(3 * scale))
            for wx in range(bx + int(4 * scale), bx + w - int(6 * scale), int(8 * scale)):
                pygame.draw.rect(tmp, window_color, (wx, cy - h // 2 + int(2 * scale), int(5 * scale), int(5 * scale)), border_radius=1)
            pygame.draw.circle(tmp, (40, 40, 40), (bx + int(8 * scale), cy + h // 2 - int(1 * scale)), int(3 * scale))
            pygame.draw.circle(tmp, (40, 40, 40), (bx + w - int(8 * scale), cy + h // 2 - int(1 * scale)), int(3 * scale))
            pygame.draw.rect(tmp, dark, (bx, cy + int(2 * scale), w, int(2 * scale)))
            # Front windshield (right side = front)
            pygame.draw.rect(tmp, (200, 225, 250), (bx + w - int(6 * scale), cy - h // 2 + int(2 * scale), int(5 * scale), int(8 * scale)), border_radius=1)
        elif car_type == "Fire Truck":
            w, h = int(38 * scale), int(14 * scale)
            bx = cx - w // 2
            pygame.draw.rect(tmp, color, (bx, cy - h // 2, w, h), border_radius=int(2 * scale))
            # Cab window at front (right side)
            pygame.draw.rect(tmp, window_color, (bx + w - int(10 * scale), cy - h // 2 + int(2 * scale), int(8 * scale), int(5 * scale)), border_radius=1)
            pygame.draw.rect(tmp, (180, 170, 130), (bx + int(4 * scale), cy - h // 2 - int(2 * scale), int(20 * scale), int(2 * scale)))
            blink = (self.tick // 8) % 2
            light_c = (255, 50, 50) if blink else (255, 150, 150)
            pygame.draw.circle(tmp, light_c, (bx + w - int(6 * scale), cy - h // 2 - int(1 * scale)), int(2 * scale))
            pygame.draw.circle(tmp, (40, 40, 40), (bx + int(8 * scale), cy + h // 2 - int(1 * scale)), int(3 * scale))
            pygame.draw.circle(tmp, (40, 40, 40), (bx + w - int(8 * scale), cy + h // 2 - int(1 * scale)), int(3 * scale))
        else:
            # Generic car shape (Scooter, Sedan, Taxi, Sports Car, Ice Cream Van)
            if car_type == "Scooter":
                w, h = int(18 * scale), int(10 * scale)
            elif car_type == "Sports Car":
                w, h = int(28 * scale), int(10 * scale)
            elif car_type == "Ice Cream Van":
                w, h = int(30 * scale), int(14 * scale)
            else:
                w, h = int(24 * scale), int(12 * scale)
            bx = cx - w // 2
            pygame.draw.rect(tmp, color, (bx, cy - h // 2, w, h), border_radius=int(3 * scale))
            # Roof / window (slightly toward back)
            roof_w = int(w * 0.4)
            roof_x = bx + int(w * 0.2)
            pygame.draw.rect(tmp, window_color, (roof_x, cy - h // 2 + int(1 * scale), roof_w, int(h * 0.4)), border_radius=int(2 * scale))
            # Wheels
            pygame.draw.circle(tmp, (40, 40, 40), (bx + int(5 * scale), cy + h // 2 - int(1 * scale)), int(2.5 * scale))
            pygame.draw.circle(tmp, (40, 40, 40), (bx + w - int(5 * scale), cy + h // 2 - int(1 * scale)), int(2.5 * scale))
            # Front headlight (right side)
            pygame.draw.circle(tmp, (255, 255, 200), (bx + w - int(2 * scale), cy), int(1.5 * scale))
            # Rear taillight (left side)
            pygame.draw.circle(tmp, (255, 50, 50), (bx + int(2 * scale), cy), int(1 * scale))
            if car_type == "Ice Cream Van":
                pygame.draw.circle(tmp, (255, 220, 180), (bx + w // 2, cy - h // 2 - int(3 * scale)), int(3 * scale))
                pygame.draw.polygon(tmp, (200, 160, 100), [
                    (bx + w // 2 - int(2 * scale), cy - h // 2 - int(1 * scale)),
                    (bx + w // 2, cy - h // 2 + int(2 * scale)),
                    (bx + w // 2 + int(2 * scale), cy - h // 2 - int(1 * scale)),
                ])

        # Transform based on direction
        if direction == 'left':
            tmp = pygame.transform.flip(tmp, True, False)
        elif direction == 'up':
            tmp = pygame.transform.rotate(tmp, 90)
        elif direction == 'down':
            tmp = pygame.transform.rotate(tmp, -90)

        # Blit centered on (x, y)
        rw, rh = tmp.get_size()
        surf.blit(tmp, (x - rw // 2, y - rh // 2))

    def draw_pedestrian(self, surf, x, y, direction='right', color_seed=0):
        """Draw a walking pedestrian (about 18px tall)."""
        import random
        rng = random.Random(color_seed)
        skin = rng.choice([(240, 210, 180), (210, 170, 130), (180, 130, 90), (140, 100, 70)])
        shirt = (rng.randint(60, 230), rng.randint(60, 230), rng.randint(60, 230))
        pants = rng.choice([(50, 50, 120), (80, 80, 80), (100, 70, 50), (40, 40, 40)])
        hair = rng.choice([(40, 30, 20), (80, 50, 30), (180, 140, 60), (20, 20, 20)])
        ix, iy = int(x), int(y)
        # Head
        pygame.draw.circle(surf, skin, (ix, iy - 13), 5)
        # Hair
        pygame.draw.arc(surf, hair, (ix - 5, iy - 18, 10, 8), 0, 3.14, 2)
        # Body
        pygame.draw.rect(surf, shirt, (ix - 4, iy - 8, 8, 9))
        # Arms
        arm_phase = (self.tick // 6) % 2
        if arm_phase == 0:
            pygame.draw.rect(surf, shirt, (ix - 6, iy - 7, 2, 6))
            pygame.draw.rect(surf, shirt, (ix + 4, iy - 5, 2, 6))
        else:
            pygame.draw.rect(surf, shirt, (ix - 6, iy - 5, 2, 6))
            pygame.draw.rect(surf, shirt, (ix + 4, iy - 7, 2, 6))
        # Legs - animate based on tick
        leg_phase = (self.tick // 6) % 2
        if leg_phase == 0:
            lx_off = -2 if direction == 'right' else 2
            pygame.draw.rect(surf, pants, (ix - 4 + lx_off, iy + 1, 3, 7))
            pygame.draw.rect(surf, pants, (ix + 1 - lx_off, iy + 1, 3, 6))
        else:
            lx_off = 2 if direction == 'right' else -2
            pygame.draw.rect(surf, pants, (ix - 4 + lx_off, iy + 1, 3, 6))
            pygame.draw.rect(surf, pants, (ix + 1 - lx_off, iy + 1, 3, 7))

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
        card_w, card_h = 460, 470
        card_x = (WIDTH - card_w) // 2
        card_y = 110
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

        # Grade selector
        self.draw_text("Math Level", self.font_xs, (170, 175, 195), fx, card_y + 280)
        grade_y = card_y + 303
        arrow_w, arrow_h = 38, 36
        grade_text = f"Grade {self.grade}"
        grade_desc = GRADE_LABELS.get(self.grade, "")

        # Left arrow
        self.grade_left_btn = pygame.Rect(fx, grade_y, arrow_w, arrow_h)
        left_color = (50, 55, 80) if self.grade > 1 else (30, 33, 50)
        s = pygame.Surface((arrow_w, arrow_h), pygame.SRCALPHA)
        pygame.draw.rect(s, (*left_color, 200), (0, 0, arrow_w, arrow_h), border_radius=6)
        self.screen.blit(s, (fx, grade_y))
        pygame.draw.rect(self.screen, (80, 85, 110), (fx, grade_y, arrow_w, arrow_h), 1, border_radius=6)
        lc = (200, 205, 220) if self.grade > 1 else (80, 85, 100)
        self.draw_text("<", self.font_sm, lc, fx + arrow_w // 2, grade_y + arrow_h // 2 - 9, center=True)

        # Grade text in center
        center_x = fx + fw // 2
        self.draw_text(grade_text, self.font_sm, (230, 235, 245), center_x, grade_y + 4, center=True)

        # Right arrow
        rx = fx + fw - arrow_w
        self.grade_right_btn = pygame.Rect(rx, grade_y, arrow_w, arrow_h)
        right_color = (50, 55, 80) if self.grade < 8 else (30, 33, 50)
        s = pygame.Surface((arrow_w, arrow_h), pygame.SRCALPHA)
        pygame.draw.rect(s, (*right_color, 200), (0, 0, arrow_w, arrow_h), border_radius=6)
        self.screen.blit(s, (rx, grade_y))
        pygame.draw.rect(self.screen, (80, 85, 110), (rx, grade_y, arrow_w, arrow_h), 1, border_radius=6)
        rc = (200, 205, 220) if self.grade < 8 else (80, 85, 100)
        self.draw_text(">", self.font_sm, rc, rx + arrow_w // 2, grade_y + arrow_h // 2 - 9, center=True)

        # Description below
        self.draw_text(grade_desc, self.font_xs, (140, 145, 170), center_x, grade_y + 40, center=True)

        self.connect_btn = self.draw_button("Play", fx + 50, card_y + 370, fw - 100, 52, GREEN, GREEN_HOVER, self.font_med)

        if self.connect_error:
            color = (170, 175, 195) if self.connect_error == "Connecting..." else (255, 100, 100)
            self.draw_text(self.connect_error, self.font_xs, color, WIDTH // 2, card_y + 440, center=True)

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
            elif self.grade_left_btn.collidepoint(event.pos):
                self.grade = max(1, self.grade - 1)
            elif self.grade_right_btn.collidepoint(event.pos):
                self.grade = min(8, self.grade + 1)
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

        # Population display
        self.draw_person_icon(100, 22, 10)
        self.draw_text(f"{self.population}", self.font_sm, WHITE, 115, 15)
        self.draw_text("pop", self.font_tiny, (180, 210, 255), 115, 36)
        if self.pop_bonus > 1.0:
            self.draw_text(f"x{self.pop_bonus:.1f}", self.font_tiny, (170, 255, 170), 155, 36)

        # Coin display
        self.draw_coin_icon(WIDTH - 260, 22, 14)
        self.draw_text(f"{self.coins:,}", self.font_med, WHITE, WIDTH - 240, 12, shadow=True)
        self.draw_text("coins", self.font_tiny, (180, 210, 255), WIDTH - 240, 40)

        if self.rebirths > 0:
            star_x = WIDTH - 265 - 60
            self.draw_text(f"\u2605 {self.rebirths}", self.font_sm, COIN_GOLD, star_x, 18, shadow=True)

        if self.income > 0:
            bonus_text = f"+{self.income} bonus/solve"
            if self.pop_bonus > 1.0:
                bonus_text += f" (x{self.pop_bonus:.1f})"
            self.draw_text(bonus_text, self.font_tiny, (170, 230, 170), WIDTH - 175, 40)

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

        # Rebirth button (only when >= 1M coins)
        if self.coins >= 1_000_000:
            self.rebirth_btn = self.draw_button("Rebirth \u2605", prob_x + 475, prob_y + 72, 120, 38, GOLD_BTN, GOLD_BTN_HOVER)
        else:
            self.rebirth_btn = pygame.Rect(0, 0, 0, 0)

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

        # --- Scratch Pad ---
        self.draw_scratch_pad()

        # --- Leaderboard ---
        self.draw_leaderboard()

        # --- Shop overlay ---
        if self.shop_open:
            self.draw_shop()

        # --- City view overlay ---
        if self.viewing_city:
            self.draw_city_view()

    # --- Town ---
    def draw_street_lamp(self, x, y):
        """Draw a small street lamp with warm glow."""
        # Pole
        pygame.draw.rect(self.screen, (90, 90, 100), (x - 2, y - 30, 4, 32))
        # Arm
        pygame.draw.rect(self.screen, (90, 90, 100), (x - 1, y - 32, 12, 3))
        # Lamp housing
        pygame.draw.rect(self.screen, (70, 70, 80), (x + 6, y - 34, 8, 6), border_radius=2)
        # Light glow
        glow = pygame.Surface((24, 30), pygame.SRCALPHA)
        pygame.draw.ellipse(glow, (255, 230, 130, 30), (0, 0, 24, 30))
        self.screen.blit(glow, (x - 2, y - 28))
        # Warm bulb
        pygame.draw.circle(self.screen, (255, 240, 180), (x + 10, y - 29), 3)

    def draw_pond(self, x, y, w, h):
        """Draw a small decorative pond."""
        # Water shadow
        shadow_s = pygame.Surface((w + 4, h + 4), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_s, (0, 0, 0, 20), shadow_s.get_rect())
        self.screen.blit(shadow_s, (x - 2, y))
        # Dark water edge
        pygame.draw.ellipse(self.screen, (40, 100, 130), (x, y, w, h))
        # Main water
        pygame.draw.ellipse(self.screen, (70, 140, 180), (x + 2, y + 2, w - 4, h - 4))
        # Light reflection
        pygame.draw.ellipse(self.screen, (110, 175, 210, 140), (x + w // 4, y + 3, w // 3, h // 4))
        # Sparkle
        pygame.draw.circle(self.screen, (180, 220, 255), (x + w // 3, y + h // 3), 2)
        # Lily pad
        lx, ly = x + w * 2 // 3, y + h // 2
        pygame.draw.ellipse(self.screen, (50, 140, 50), (lx, ly, 8, 5))
        pygame.draw.ellipse(self.screen, (70, 165, 60), (lx + 1, ly + 1, 6, 3))
        # Tiny pink flower on lily pad
        pygame.draw.circle(self.screen, (255, 150, 180), (lx + 4, ly + 2), 2)

    def draw_bench(self, x, y):
        """Draw a small park bench."""
        # Legs
        pygame.draw.rect(self.screen, (100, 75, 45), (x, y, 3, 8))
        pygame.draw.rect(self.screen, (100, 75, 45), (x + 17, y, 3, 8))
        # Seat
        pygame.draw.rect(self.screen, (140, 100, 55), (x - 1, y - 2, 22, 4), border_radius=1)
        # Back
        pygame.draw.rect(self.screen, (130, 90, 50), (x, y - 8, 20, 3), border_radius=1)
        # Highlight
        pygame.draw.line(self.screen, (160, 120, 70), (x, y - 2), (x + 20, y - 2), 1)

    def draw_flower_garden(self, x, y, seed=0):
        """Draw a small cluster of flowers in a garden patch."""
        import random
        rng = random.Random(seed)
        # Garden dirt patch
        gs = pygame.Surface((26, 14), pygame.SRCALPHA)
        pygame.draw.ellipse(gs, (110, 85, 50, 80), (0, 0, 26, 14))
        self.screen.blit(gs, (x - 13, y - 2))
        # Several flowers
        colors = [(255, 100, 120), (255, 200, 80), (180, 120, 255), (255, 160, 200), (120, 200, 255)]
        for _ in range(4):
            fx = x + rng.randint(-8, 8)
            fy = y + rng.randint(-5, 3)
            fc = rng.choice(colors)
            pygame.draw.line(self.screen, (60, 130, 50), (fx, fy + 2), (fx, fy + 6), 1)
            for angle_deg in range(0, 360, 72):
                angle = math.radians(angle_deg + rng.randint(-10, 10))
                px = fx + int(2.5 * math.cos(angle))
                py_f = fy + int(2.5 * math.sin(angle))
                pygame.draw.circle(self.screen, fc, (px, py_f), 2)
            pygame.draw.circle(self.screen, (255, 240, 150), (fx, fy), 1)

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
        # Bark detail lines
        for by_off in range(3, th - 2, 4):
            pygame.draw.line(self.screen, (90, 65, 35), (x - tw // 2 + 2, y - th + by_off),
                             (x + tw // 2 - 2, y - th + by_off), 1)
        # Foliage - multiple overlapping circles for fuller look
        r1 = int(18 * s)
        dark_green = (45, 130, 45)
        mid_green = (60, 155, 55)
        light_green = (85, 180, 70)
        highlight = (110, 200, 90)
        bright = (140, 215, 110)
        pygame.draw.circle(self.screen, dark_green, (x + int(3 * s), y - th - r1 // 2 + int(3 * s)), int(14 * s))
        pygame.draw.circle(self.screen, mid_green, (x, y - th - r1 // 2), r1)
        pygame.draw.circle(self.screen, TREE_GREEN, (x - int(6 * s), y - th - r1 // 2 - int(2 * s)), int(13 * s))
        pygame.draw.circle(self.screen, light_green, (x + int(5 * s), y - th - r1 // 2 - int(4 * s)), int(11 * s))
        pygame.draw.circle(self.screen, highlight, (x - int(3 * s), y - th - r1 // 2 - int(6 * s)), int(7 * s))
        # Top highlight sparkle
        pygame.draw.circle(self.screen, bright, (x - int(1 * s), y - th - r1 // 2 - int(8 * s)), int(3 * s))

    def draw_bush(self, x, y, size=1.0):
        s = size
        shadow_s = pygame.Surface((int(22 * s), int(8 * s)), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_s, (0, 0, 0, 25), shadow_s.get_rect())
        self.screen.blit(shadow_s, (x - int(11 * s), y - int(1 * s)))
        pygame.draw.ellipse(self.screen, (50, 140, 50), (x - int(10 * s), y - int(8 * s), int(20 * s), int(12 * s)))
        pygame.draw.ellipse(self.screen, (65, 160, 60), (x - int(7 * s), y - int(10 * s), int(14 * s), int(10 * s)))
        pygame.draw.ellipse(self.screen, (80, 175, 70), (x - int(4 * s), y - int(11 * s), int(9 * s), int(7 * s)))
        # Berry dots on some bushes
        if int(x * 7 + y * 3) % 3 == 0:
            pygame.draw.circle(self.screen, (220, 60, 60), (x - int(3 * s), y - int(7 * s)), max(1, int(2 * s)))
            pygame.draw.circle(self.screen, (220, 60, 60), (x + int(4 * s), y - int(9 * s)), max(1, int(2 * s)))
            pygame.draw.circle(self.screen, (240, 80, 80), (x + int(1 * s), y - int(10 * s)), max(1, int(1.5 * s)))

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

    def _overlaps_road(self, x, y, w, h):
        """Check if a rectangle overlaps any vertical or horizontal road."""
        road_pad = 20  # sidewalk + curb buffer (wider to keep visuals off road)
        for rvx in ROAD_V_POSITIONS:
            if x + w > rvx - road_pad and x < rvx + ROAD_THICK + road_pad:
                return True
        # Only check horizontal roads in commercial zone (below residential is grass)
        section_h = ROW_HEIGHT * 2 + ROAD_THICK + 16
        for section in range(8):
            road_y = section * section_h + ROW_HEIGHT * 2 - 15
            if road_y > RESIDENTIAL_Y_START - 50:
                break  # no horizontal roads in residential area
            if y + h > road_y - road_pad and y < road_y + ROAD_THICK + road_pad:
                return True
        return False

    def _on_horizontal_road(self, world_y):
        """Check if a y position falls on a horizontal road."""
        pad = 20  # buffer for lamp/object height
        section_h = ROW_HEIGHT * 2 + ROAD_THICK + 16
        for section in range(8):
            road_y = section * section_h + ROW_HEIGHT * 2 - 15
            if road_y > RESIDENTIAL_Y_START - 50:
                break
            if world_y + pad > road_y - pad and world_y - pad < road_y + ROAD_THICK + pad:
                return True
        return False

    def _overlaps_plot(self, x, y, w, h):
        """Check if a rectangle overlaps any building plot."""
        pad = 8
        for px, py in self.get_plot_positions():
            if (x + w > px - pad and x < px + PLOT_W + pad and
                    y + h > py - pad and y < py + PLOT_H + pad):
                return True
        return False

    def get_house_positions(self):
        """Generate house positions in the residential neighbourhood — 1 per 100 population.
        Neighbourhood is to the right of the commercial area."""
        num_houses = max(1, self.population // 100) if self.population >= 100 else 0
        if num_houses == 0:
            return []

        res_x_start = TOWN_WORLD_W + 40  # right of commercial area
        cols = 6
        col_spacing = (HOUSE_W + 40)
        row_spacing = HOUSE_H + 50

        positions = []
        for i in range(num_houses):
            col = i % cols
            row = i // cols
            x = res_x_start + col * col_spacing
            y = 30 + row * row_spacing
            positions.append((x, y, i))
        return positions

    def draw_house(self, x, y, color_seed=0):
        """Draw a small procedural house (~40x45px) with 3D oblique projection."""
        import random
        rng = random.Random(color_seed * 137 + 53)
        wall_color = rng.choice(HOUSE_COLORS)
        roof_color = rng.choice(ROOF_COLORS)
        dark_wall = (max(0, wall_color[0] - 40), max(0, wall_color[1] - 40), max(0, wall_color[2] - 40))
        light_wall = (min(255, wall_color[0] + 30), min(255, wall_color[1] + 30), min(255, wall_color[2] + 30))
        dark_roof = (max(0, roof_color[0] - 30), max(0, roof_color[1] - 30), max(0, roof_color[2] - 30))
        light_roof = (min(255, roof_color[0] + 40), min(255, roof_color[1] + 40), min(255, roof_color[2] + 40))

        w, h_body = 28, 28
        ix, iy = int(x), int(y)

        # Ground shadow ellipse
        shadow_s = pygame.Surface((w + 20, 12), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_s, (0, 0, 0, 28), shadow_s.get_rect())
        self.screen.blit(shadow_s, (ix - 4, iy + HOUSE_H - 8))

        # Front wall body
        wall_top = iy + HOUSE_H - h_body
        pygame.draw.rect(self.screen, wall_color, (ix, wall_top, w, h_body))
        pygame.draw.rect(self.screen, dark_wall, (ix, wall_top, w, h_body), 1)

        # Wall texture - horizontal siding lines
        for sy_off in range(4, h_body - 2, 5):
            pygame.draw.line(self.screen, (max(0, wall_color[0] - 15), max(0, wall_color[1] - 15), max(0, wall_color[2] - 15)),
                             (ix + 1, wall_top + sy_off), (ix + w - 1, wall_top + sy_off), 1)

        # Foundation strip at bottom of wall
        pygame.draw.rect(self.screen, (120, 115, 110), (ix, wall_top + h_body - 3, w, 3))
        pygame.draw.rect(self.screen, (100, 95, 90), (ix, wall_top + h_body - 3, w, 3), 1)

        # 3D side face (right side, oblique)
        side_dx, side_dy = 8, -8
        side_pts = [
            (ix + w, wall_top),
            (ix + w + side_dx, wall_top + side_dy),
            (ix + w + side_dx, wall_top + h_body + side_dy),
            (ix + w, wall_top + h_body),
        ]
        pygame.draw.polygon(self.screen, dark_wall, side_pts)
        pygame.draw.polygon(self.screen, (max(0, dark_wall[0] - 15), max(0, dark_wall[1] - 15), max(0, dark_wall[2] - 15)), side_pts, 1)
        # Side wall siding lines
        for sy_off in range(4, h_body - 2, 5):
            y1 = wall_top + sy_off
            pygame.draw.line(self.screen, (max(0, dark_wall[0] - 10), max(0, dark_wall[1] - 10), max(0, dark_wall[2] - 10)),
                             (ix + w + 1, y1), (ix + w + side_dx - 1, y1 + side_dy), 1)

        # Pitched triangular roof (front face)
        roof_base_y = wall_top
        roof_peak_y = roof_base_y - 17
        eave = 4  # overhang
        roof_pts = [
            (ix - eave, roof_base_y),
            (ix + w // 2, roof_peak_y),
            (ix + w + eave, roof_base_y),
        ]
        pygame.draw.polygon(self.screen, roof_color, roof_pts)
        # Roof shingle lines
        for ry_off in range(3, 17, 4):
            line_y = roof_peak_y + ry_off
            t = ry_off / 17.0
            left_x = int(ix + w // 2 - (w // 2 + eave) * t)
            right_x = int(ix + w // 2 + (w // 2 + eave) * t)
            pygame.draw.line(self.screen, dark_roof, (left_x, line_y), (right_x, line_y), 1)
        pygame.draw.polygon(self.screen, dark_roof, roof_pts, 1)
        # Roof ridge highlight
        pygame.draw.line(self.screen, light_roof, (ix + w // 2, roof_peak_y), (ix + w // 2 - 2, roof_peak_y + 2), 1)

        # 3D roof side face (right slope)
        roof_side_pts = [
            (ix + w + eave, roof_base_y),
            (ix + w // 2, roof_peak_y),
            (ix + w // 2 + side_dx, roof_peak_y + side_dy),
            (ix + w + eave + side_dx, roof_base_y + side_dy),
        ]
        pygame.draw.polygon(self.screen, dark_roof, roof_side_pts)
        pygame.draw.polygon(self.screen, (max(0, dark_roof[0] - 10), max(0, dark_roof[1] - 10), max(0, dark_roof[2] - 10)), roof_side_pts, 1)

        # Chimney (on some houses)
        if rng.random() < 0.5:
            chim_x = ix + w - 8
            chim_y = roof_peak_y - 2
            chim_color = (140, 100, 80) if rng.random() < 0.5 else (120, 115, 110)
            pygame.draw.rect(self.screen, chim_color, (chim_x, chim_y, 5, 12))
            pygame.draw.rect(self.screen, (max(0, chim_color[0] - 20), max(0, chim_color[1] - 20), max(0, chim_color[2] - 20)), (chim_x, chim_y, 5, 12), 1)
            # Chimney cap
            pygame.draw.rect(self.screen, (max(0, chim_color[0] - 30), max(0, chim_color[1] - 30), max(0, chim_color[2] - 30)), (chim_x - 1, chim_y - 2, 7, 2))

        # Door
        door_x = ix + w // 2 - 4
        door_y = wall_top + h_body - 16
        door_color = rng.choice([(90, 60, 40), (60, 80, 50), (80, 40, 40), (50, 50, 80)])
        pygame.draw.rect(self.screen, door_color, (door_x, door_y, 8, 13))
        pygame.draw.rect(self.screen, (max(0, door_color[0] - 25), max(0, door_color[1] - 25), max(0, door_color[2] - 25)), (door_x, door_y, 8, 13), 1)
        # Door panel detail
        pygame.draw.rect(self.screen, (max(0, door_color[0] - 10), max(0, door_color[1] - 10), max(0, door_color[2] - 10)),
                         (door_x + 2, door_y + 2, 4, 4), 1)
        pygame.draw.rect(self.screen, (max(0, door_color[0] - 10), max(0, door_color[1] - 10), max(0, door_color[2] - 10)),
                         (door_x + 2, door_y + 7, 4, 4), 1)
        # Doorknob
        pygame.draw.circle(self.screen, (210, 190, 110), (door_x + 6, door_y + 8), 1)
        # Doorstep
        pygame.draw.rect(self.screen, (150, 145, 135), (door_x - 1, door_y + 13, 10, 3))

        # Left window with cross pane and sill
        win_x = ix + 3
        win_y = wall_top + 7
        # Window frame
        pygame.draw.rect(self.screen, light_wall, (win_x - 1, win_y - 1, 10, 10))
        # Glass
        win_glow = rng.random() < 0.3
        win_glass = (240, 230, 160, 180) if win_glow else (180, 210, 240)
        if win_glow:
            glow_s = pygame.Surface((14, 14), pygame.SRCALPHA)
            pygame.draw.rect(glow_s, (255, 240, 150, 30), (0, 0, 14, 14))
            self.screen.blit(glow_s, (win_x - 2, win_y - 2))
        pygame.draw.rect(self.screen, win_glass[:3], (win_x, win_y, 8, 8))
        pygame.draw.rect(self.screen, dark_wall, (win_x, win_y, 8, 8), 1)
        # Cross pane
        pygame.draw.line(self.screen, dark_wall, (win_x + 4, win_y), (win_x + 4, win_y + 8), 1)
        pygame.draw.line(self.screen, dark_wall, (win_x, win_y + 4), (win_x + 8, win_y + 4), 1)
        # Window sill
        pygame.draw.rect(self.screen, light_wall, (win_x - 1, win_y + 8, 10, 2))

        # Right window (second window on wider houses)
        win2_x = ix + w - 11
        pygame.draw.rect(self.screen, light_wall, (win2_x - 1, win_y - 1, 10, 10))
        pygame.draw.rect(self.screen, win_glass[:3], (win2_x, win_y, 8, 8))
        pygame.draw.rect(self.screen, dark_wall, (win2_x, win_y, 8, 8), 1)
        pygame.draw.line(self.screen, dark_wall, (win2_x + 4, win_y), (win2_x + 4, win_y + 8), 1)
        pygame.draw.line(self.screen, dark_wall, (win2_x, win_y + 4), (win2_x + 8, win_y + 4), 1)
        pygame.draw.rect(self.screen, light_wall, (win2_x - 1, win_y + 8, 10, 2))

        # House number on door or wall
        house_num = str((color_seed % 42) + 1)
        num_s = self.font_tiny.render(house_num, True, light_wall)
        self.screen.blit(num_s, (door_x + 1, door_y - 9))

        # Mailbox (on some houses)
        if rng.random() < 0.4:
            mb_x = ix - 6
            mb_y = wall_top + h_body - 10
            pygame.draw.rect(self.screen, (80, 80, 90), (mb_x, mb_y, 2, 10))
            pygame.draw.rect(self.screen, (60, 90, 160), (mb_x - 2, mb_y - 2, 6, 4), border_radius=1)

        # Small front garden patch
        if rng.random() < 0.5:
            gx = ix + rng.randint(-3, 2)
            gy = iy + HOUSE_H - 2
            garden_colors = [(60, 150, 55), (70, 160, 60), (80, 140, 50)]
            for _ in range(3):
                gc = rng.choice(garden_colors)
                gox = gx + rng.randint(0, 10)
                pygame.draw.circle(self.screen, gc, (gox, gy), rng.randint(2, 3))
            # Tiny flower
            fc = rng.choice([(255, 100, 120), (255, 200, 80), (180, 120, 255)])
            pygame.draw.circle(self.screen, fc, (gx + 5, gy - 1), 1)

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

        # Assign buildings to plots — one per plot, in purchase order
        plot_assignments = list(self.buildings)
        while len(plot_assignments) < len(all_plots):
            plot_assignments.append(None)

        # Total content size (account for 3D overhang)
        if all_plots:
            max_content_y = max(py for _, py in all_plots) + PLOT_H + 40
            max_content_x = max(px for px, _ in all_plots) + PLOT_W + SIDE_DX + 20
        else:
            max_content_y = view_h
            max_content_x = view_w

        # Extend for residential neighbourhood (to the right)
        house_positions = self.get_house_positions()
        if house_positions:
            max_content_y = max(max_content_y, max(hy for _, hy, _ in house_positions) + HOUSE_H + 40)
            max_content_x = max(max_content_x, max(hx for hx, _, _ in house_positions) + HOUSE_W + 20)

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

        # --- Vertical roads (flat ground plane, always behind everything) ---
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
            # 3D curb edges - left curb with raised side face
            curb_dark = (150, 145, 135)
            pygame.draw.line(self.screen, curb_dark, (vx - 1, town_y), (vx - 1, town_y + view_h), 3)
            pygame.draw.line(self.screen, (175, 170, 160), (vx - 3, town_y), (vx - 3, town_y + view_h), 2)
            # Right curb with raised side face
            pygame.draw.line(self.screen, curb_dark, (vx + ROAD_THICK + 1, town_y), (vx + ROAD_THICK + 1, town_y + view_h), 3)
            pygame.draw.line(self.screen, (175, 170, 160), (vx + ROAD_THICK + 3, town_y), (vx + ROAD_THICK + 3, town_y + view_h), 2)
            # Center line - double yellow
            cx = vx + ROAD_THICK // 2
            pygame.draw.line(self.screen, (220, 200, 80), (cx - 2, town_y), (cx - 2, town_y + view_h), 2)
            pygame.draw.line(self.screen, (220, 200, 80), (cx + 2, town_y), (cx + 2, town_y + view_h), 2)

        # --- Car animation system ---
        total_cars = len(self.cars)
        if total_cars != self.car_anim_count:
            self.car_anim_count = total_cars
            self._init_car_anims()
        self._update_car_anims()

        # --- Pedestrian animation system ---
        ped_target = min(self.population, 50)
        if ped_target != self.pedestrian_count or (ped_target > 0 and not self.pedestrian_anims):
            self.pedestrian_count = ped_target
            if ped_target > 0:
                self._init_pedestrian_anims()
            else:
                self.pedestrian_anims = []
        if self.pedestrian_anims:
            self._update_pedestrian_anims()

        # --- Player movement (continuous key polling) ---
        if not self.shop_open and not self.viewing_city and not self.scratch_focused:
            keys = pygame.key.get_pressed()
            dx = dy = 0
            if keys[pygame.K_LEFT] or keys[pygame.K_a]:
                dx -= self.player_speed
            if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
                dx += self.player_speed
            if keys[pygame.K_UP] or keys[pygame.K_w]:
                dy -= self.player_speed
            if keys[pygame.K_DOWN] or keys[pygame.K_s]:
                dy += self.player_speed
            self.player_moving = dx != 0 or dy != 0
            if dx < 0:
                self.player_dir = 'left'
            elif dx > 0:
                self.player_dir = 'right'
            self.player_x = max(10, min(self.player_x + dx, total_w - 10))
            self.player_y = max(10, min(self.player_y + dy, total_h - 10))

        # --- Camera follows player (smooth lerp) ---
        target_sx = self.player_x - view_w // 2
        target_sy = self.player_y - view_h // 2
        target_sx = max(0, min(target_sx, max_scroll_x))
        target_sy = max(0, min(target_sy, max_scroll_y))
        self.town_scroll_x += (target_sx - self.town_scroll_x) * 0.12
        self.town_scroll_y += (target_sy - self.town_scroll_y) * 0.12
        # Re-clamp and re-assign after lerp
        self.town_scroll_x = max(0, min(self.town_scroll_x, max_scroll_x))
        self.town_scroll_y = max(0, min(self.town_scroll_y, max_scroll_y))
        sx = int(self.town_scroll_x)
        sy = int(self.town_scroll_y)

        # --- Collect all depth-sorted drawables ---
        # Each entry: (sort_y, draw_func)
        drawables = []

        # Horizontal roads (only in commercial zone, not residential)
        section_h = ROW_HEIGHT * 2 + ROAD_THICK + 16
        for section in range(8):
            road_local_y = section * section_h + ROW_HEIGHT * 2 - 15
            if road_local_y > RESIDENTIAL_Y_START - 50:
                break
            hy = town_y + road_local_y - sy
            if hy > town_y + view_h + 15 or hy + ROAD_THICK < town_y - 15:
                continue
            drawables.append((road_local_y, 'hroad', section, hy))

        # Bushes along roads (only on grass)
        bush_templates = [(280, 60, 0.7), (620, 90, 0.8), (280, 200, 0.6), (620, 250, 0.75),
                          (280, 340, 0.65), (620, 380, 0.7)]
        for btx, bty, bs in bush_templates:
            draw_x = town_x + btx - sx
            if draw_x < town_x - 20 or draw_x > town_x + view_w + 20:
                continue
            draw_y_start = town_y + bty - (sy % 450)
            dy = draw_y_start
            while dy < town_y + view_h + 20:
                if dy > town_y - 20:
                    world_y = dy - town_y + sy
                    if not self._overlaps_road(btx, world_y - 10, 20, 12) and not self._overlaps_plot(btx, world_y - 10, 20, 12):
                        drawables.append((world_y, 'bush', draw_x, dy, bs))
                dy += 450

        # Trees (only on grass)
        tree_templates = [(130, 50, 0.9), (240, 120, 1.15), (40, 300, 1.0),
                          (520, 280, 0.9), (770, 200, 1.1), (900, 100, 0.75),
                          (450, 50, 1.0), (180, 350, 0.85), (480, 200, 0.95),
                          (830, 320, 0.8)]
        for ttx, tty, ts in tree_templates:
            draw_x = town_x + ttx - sx
            if draw_x < town_x - 40 or draw_x > town_x + view_w + 40:
                continue
            dy = town_y + tty - (sy % 500)
            while dy < town_y + view_h + 40:
                if dy > town_y - 40:
                    world_y = dy - town_y + sy
                    if not self._overlaps_road(ttx, world_y - 30, 30, 30) and not self._overlaps_plot(ttx, world_y - 30, 30, 30):
                        drawables.append((world_y, 'tree', draw_x, dy, ts))
                dy += 500

        # Flowers (only on grass)
        flower_templates = [(30, 130, (255, 100, 120)), (500, 80, (180, 120, 255)),
                            (545, 300, (255, 130, 80)), (100, 140, (120, 200, 255)),
                            (700, 180, (255, 200, 100)), (850, 260, (200, 100, 255)),
                            (60, 250, (255, 180, 200)), (420, 160, (255, 255, 100)),
                            (780, 300, (255, 140, 160)), (200, 80, (200, 160, 255))]
        for ffx, ffy, fc in flower_templates:
            draw_x = town_x + ffx - sx
            if draw_x < town_x - 10 or draw_x > town_x + view_w + 10:
                continue
            dy = town_y + ffy - (sy % 400)
            while dy < town_y + view_h + 10:
                if dy > town_y - 10:
                    world_y = dy - town_y + sy
                    if not self._overlaps_road(ffx, world_y - 5, 10, 10) and not self._overlaps_plot(ffx, world_y - 5, 10, 10):
                        drawables.append((world_y, 'flower', draw_x, dy, fc))
                dy += 400

        # Street lamps along vertical roads (skip horizontal road intersections)
        for road_vx in ROAD_V_POSITIONS:
            lamp_x = town_x + road_vx - sx - 12
            for lamp_world_y in range(60, max_content_y, 120):
                lamp_dy = town_y + lamp_world_y - sy
                if lamp_dy < town_y - 40 or lamp_dy > town_y + view_h + 10:
                    continue
                # Skip if on a horizontal road
                if self._on_horizontal_road(lamp_world_y):
                    continue
                drawables.append((lamp_world_y, 'lamp', lamp_x, lamp_dy))
            # Lamps on right side too
            lamp_x2 = town_x + road_vx + ROAD_THICK - sx + 8
            for lamp_world_y in range(120, max_content_y, 120):
                lamp_dy = town_y + lamp_world_y - sy
                if lamp_dy < town_y - 40 or lamp_dy > town_y + view_h + 10:
                    continue
                if self._on_horizontal_road(lamp_world_y):
                    continue
                drawables.append((lamp_world_y, 'lamp', lamp_x2, lamp_dy))

        # Decorative ponds (a few scattered in world space)
        pond_positions = [(70, 80, 36, 20), (470, 300, 30, 18), (170, 550, 34, 20),
                          (560, 700, 32, 18), (100, 900, 36, 22)]
        for ppx, ppy, pw, ph in pond_positions:
            if self._overlaps_plot(ppx, ppy, pw, ph):
                continue
            pdx = town_x + ppx - sx
            pdy = town_y + ppy - sy
            if pdx < town_x - 40 or pdx > town_x + view_w + 10:
                continue
            if pdy < town_y - 25 or pdy > town_y + view_h + 10:
                continue
            drawables.append((ppy + ph, 'pond', pdx, pdy, pw, ph))

        # Park benches near roads
        bench_positions = [(270, 50), (610, 130), (270, 280), (610, 400),
                           (270, 520), (610, 650)]
        for bbx, bby in bench_positions:
            if self._overlaps_road(bbx, bby, 20, 10):
                continue
            bdx = town_x + bbx - sx
            bdy = town_y + bby - sy
            if bdx < town_x - 25 or bdx > town_x + view_w + 10:
                continue
            if bdy < town_y - 15 or bdy > town_y + view_h + 10:
                continue
            drawables.append((bby, 'bench', bdx, bdy))

        # Flower gardens near building plots
        garden_positions = [(25, 140), (170, 140), (400, 140), (500, 140),
                            (770, 140), (830, 140),
                            (25, 325), (170, 325), (500, 525), (770, 525)]
        for gi, (gx, gy) in enumerate(garden_positions):
            if self._overlaps_plot(gx, gy, 30, 20) or self._overlaps_road(gx, gy, 30, 20):
                continue
            gdx = town_x + gx - sx
            gdy = town_y + gy - sy
            if gdx < town_x - 15 or gdx > town_x + view_w + 15:
                continue
            if gdy < town_y - 10 or gdy > town_y + view_h + 10:
                continue
            drawables.append((gy, 'garden', gdx, gdy, gi))

        # Building plots
        for i, (px, py) in enumerate(all_plots):
            abs_x = town_x + px - sx
            abs_y = town_y + py - sy
            if (abs_y > town_y + view_h + 20 or abs_y + PLOT_H < town_y - 20 or
                    abs_x > town_x + view_w + 20 or abs_x + PLOT_W < town_x - 20):
                continue
            assignment = plot_assignments[i] if i < len(plot_assignments) else None
            drawables.append((py + PLOT_H, 'plot', abs_x, abs_y, i, assignment))

        # Animated cars on roads
        for anim in self.car_anims:
            car_world_x = anim['x']
            car_world_y = anim['y']
            car_screen_x = town_x + car_world_x - sx
            car_screen_y = town_y + car_world_y - sy
            if (car_screen_x < town_x - 40 or car_screen_x > town_x + view_w + 40 or
                    car_screen_y < town_y - 20 or car_screen_y > town_y + view_h + 20):
                continue
            drawables.append((car_world_y, 'car_anim', car_screen_x, car_screen_y, anim['type'], anim['direction']))

        # Parked cars near buildings
        if self.cars:
            import random as _rng_mod
            park_rng = _rng_mod.Random(len(self.cars) * 31 + len(self.buildings) * 7)
            for i, (px, py) in enumerate(all_plots):
                if i >= len(plot_assignments) or plot_assignments[i] is None:
                    continue
                if park_rng.random() < 0.4 and self.cars:
                    car_type = park_rng.choice(self.cars)
                    park_x = px + PLOT_W + 5
                    park_y = py + PLOT_H - 15
                    psx = town_x + park_x - sx
                    psy = town_y + park_y - sy
                    if (psx < town_x - 30 or psx > town_x + view_w + 30 or
                            psy < town_y - 15 or psy > town_y + view_h + 15):
                        continue
                    drawables.append((park_y, 'car_parked', psx, psy, car_type))

        # Animated pedestrians on sidewalks
        for anim in self.pedestrian_anims:
            if anim['state'] == 'entering':
                continue  # hidden while inside building
            ped_screen_x = town_x + anim['x'] - sx
            ped_screen_y = town_y + anim['y'] - sy
            if (ped_screen_x < town_x - 15 or ped_screen_x > town_x + view_w + 15 or
                    ped_screen_y < town_y - 15 or ped_screen_y > town_y + view_h + 15):
                continue
            ped_dir = 'right' if anim['direction'] in ('right', 'down') else 'left'
            drawables.append((anim['y'], 'pedestrian', ped_screen_x, ped_screen_y, ped_dir, anim['color_seed']))

        # Player character
        player_screen_x = town_x + self.player_x - sx
        player_screen_y = town_y + self.player_y - sy
        if (town_x - 15 < player_screen_x < town_x + view_w + 15 and
                town_y - 30 < player_screen_y < town_y + view_h + 15):
            drawables.append((self.player_y, 'player', player_screen_x, player_screen_y))

        # Residential neighbourhood label
        if house_positions:
            label_x = house_positions[0][0]
            label_y = house_positions[0][1] - 25
            label_screen_x = town_x + label_x - sx
            label_screen_y = town_y + label_y - sy
            if (town_y - 20 < label_screen_y < town_y + view_h + 20 and
                    town_x - 200 < label_screen_x < town_x + view_w + 20):
                drawables.append((label_y, 'res_label', label_screen_x, label_screen_y))

        # Houses in residential neighbourhood
        import random as _house_rng_mod
        house_tree_rng = _house_rng_mod.Random(999)
        for hx, hy, hseed in house_positions:
            hsx = town_x + hx - sx
            hsy = town_y + hy - sy
            if (hsx < town_x - HOUSE_W - 10 or hsx > town_x + view_w + 10 or
                    hsy < town_y - HOUSE_H - 20 or hsy > town_y + view_h + 10):
                continue
            drawables.append((hy + HOUSE_H, 'house', hsx, hsy, hseed))
            # Small decorative trees between some houses (only on grass)
            if house_tree_rng.random() < 0.35:
                tree_off_x = hx + HOUSE_W + 8
                tree_off_y = hy + HOUSE_H - 2
                if not self._overlaps_road(tree_off_x, tree_off_y - 30, 20, 30):
                    tsx = town_x + tree_off_x - sx
                    tsy = town_y + tree_off_y - sy
                    if town_x - 20 < tsx < town_x + view_w + 20:
                        drawables.append((tree_off_y, 'tree', tsx, tsy, 0.5))

        # Sort by y-position (back to front)
        drawables.sort(key=lambda d: d[0])

        # Draw all sorted elements
        for item in drawables:
            kind = item[1]
            if kind == 'hroad':
                self._draw_hroad_3d(item[2], item[3], town_x, town_y, view_w, view_h, total_w, sx)
            elif kind == 'bush':
                _, _, dx, dy, bs = item
                # Cast shadow offset to lower-right
                sw, sh = int(24 * bs), int(10 * bs)
                shadow_s = pygame.Surface((sw, sh), pygame.SRCALPHA)
                pygame.draw.ellipse(shadow_s, (0, 0, 0, 25), shadow_s.get_rect())
                self.screen.blit(shadow_s, (dx - sw // 2 + 5, dy + 2))
                self.draw_bush(dx, dy, bs)
            elif kind == 'tree':
                _, _, dx, dy, ts = item
                # Cast shadow - elongated ellipse offset to lower-right
                sw, sh = int(36 * ts), int(14 * ts)
                shadow_s = pygame.Surface((sw, sh), pygame.SRCALPHA)
                pygame.draw.ellipse(shadow_s, (0, 0, 0, 22), shadow_s.get_rect())
                self.screen.blit(shadow_s, (dx - sw // 3 + 8, dy + 2))
                self.draw_tree(dx, dy, ts)
            elif kind == 'flower':
                _, _, dx, dy, fc = item
                self.draw_flower(dx, dy, fc)
            elif kind == 'lamp':
                _, _, lx, ly = item
                self.draw_street_lamp(lx, ly)
            elif kind == 'pond':
                _, _, pdx, pdy, pw, ph = item
                self.draw_pond(pdx, pdy, pw, ph)
            elif kind == 'bench':
                _, _, bdx, bdy = item
                self.draw_bench(bdx, bdy)
            elif kind == 'garden':
                _, _, gdx, gdy, gi = item
                self.draw_flower_garden(gdx, gdy, seed=gi * 17 + 5)
            elif kind == 'car_anim':
                _, _, cx, cy, ctype, cdir = item
                self.draw_car(self.screen, cx, cy, ctype, direction=cdir)
            elif kind == 'car_parked':
                _, _, cx, cy, ctype = item
                self.draw_car(self.screen, cx, cy, ctype, direction='right', scale=0.8)
            elif kind == 'pedestrian':
                _, _, px, py, pdir, pseed = item
                self.draw_pedestrian(self.screen, px, py, direction=pdir, color_seed=pseed)
            elif kind == 'player':
                _, _, px, py = item
                # Draw shadow
                shadow_s = pygame.Surface((20, 8), pygame.SRCALPHA)
                pygame.draw.ellipse(shadow_s, (0, 0, 0, 30), shadow_s.get_rect())
                self.screen.blit(shadow_s, (int(px) - 10, int(py) + 4))
                # Draw body using pedestrian renderer with a fixed seed
                self.draw_pedestrian(self.screen, px, py, direction=self.player_dir, color_seed=12345)
                # Bright downward-pointing triangle indicator above head
                tri_x = int(px)
                tri_y = int(py) - 24
                pygame.draw.polygon(self.screen, (255, 60, 60),
                                    [(tri_x, tri_y + 7), (tri_x - 5, tri_y), (tri_x + 5, tri_y)])
                pygame.draw.polygon(self.screen, (255, 255, 255),
                                    [(tri_x, tri_y + 7), (tri_x - 5, tri_y), (tri_x + 5, tri_y)], 1)
                # Name label below feet
                name = self.name_text if self.name_text else "You"
                label = self.font_tiny.render(name, True, (255, 255, 255))
                lw, lh = label.get_size()
                tag_s = pygame.Surface((lw + 6, lh + 2), pygame.SRCALPHA)
                pygame.draw.rect(tag_s, (0, 0, 0, 140), (0, 0, lw + 6, lh + 2), border_radius=3)
                tag_s.blit(label, (3, 1))
                self.screen.blit(tag_s, (int(px) - (lw + 6) // 2, int(py) + 10))
            elif kind == 'plot':
                _, _, abs_x, abs_y, idx, assignment = item
                self._draw_plot_3d(abs_x, abs_y, assignment)
            elif kind == 'house':
                _, _, hsx, hsy, hseed = item
                self.draw_house(hsx, hsy, hseed)
            elif kind == 'res_label':
                _, _, rlx, rly = item
                # Draw "Neighbourhood" section label
                label_s = pygame.Surface((180, 24), pygame.SRCALPHA)
                pygame.draw.rect(label_s, (255, 255, 255, 180), (0, 0, 180, 24), border_radius=6)
                self.screen.blit(label_s, (rlx + 10, rly))
                self.draw_text("Neighbourhood", self.font_sm, (100, 80, 60), rlx + 100, rly + 12, center=True)

        # Atmospheric depth gradient (subtle darkening from top to bottom)
        atmo = pygame.Surface((view_w, view_h), pygame.SRCALPHA)
        for row in range(0, view_h, 4):
            t = row / max(view_h - 1, 1)
            alpha = int(12 * t)
            pygame.draw.rect(atmo, (0, 0, 30, alpha), (0, row, view_w, 4))
        self.screen.blit(atmo, (town_x, town_y))

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

    def _init_car_anims(self):
        """Initialize car animation state for all owned cars."""
        import random
        rng = random.Random(42 + len(self.cars))
        self.car_anims = []
        section_h = ROW_HEIGHT * 2 + ROAD_THICK + 16
        speeds = {
            "Bicycle": 0.5, "Scooter": 0.8, "Sedan": 1.2, "Taxi": 1.3,
            "Bus": 0.9, "Sports Car": 2.0, "Fire Truck": 1.0, "Ice Cream Van": 0.7,
        }
        for car_type in self.cars:
            # Assign to a random road segment
            if rng.random() < 0.5:
                # Vertical road
                road_vx = rng.choice(ROAD_V_POSITIONS)
                x = road_vx + ROAD_THICK // 2 + rng.randint(-4, 4)
                y = rng.uniform(0, section_h * 4)
                direction = rng.choice(['up', 'down'])
                road_type = 'v'
                road_id = road_vx
            else:
                # Horizontal road
                section = rng.randint(0, 5)
                road_y = section * section_h + ROW_HEIGHT * 2 - 15 + ROAD_THICK // 2
                x = rng.uniform(0, TOWN_WORLD_W)
                y = road_y + rng.randint(-4, 4)
                direction = rng.choice(['left', 'right'])
                road_type = 'h'
                road_id = section
            speed = speeds.get(car_type, 1.0) * (0.8 + rng.random() * 0.4)
            self.car_anims.append({
                'type': car_type,
                'x': x, 'y': y,
                'speed': speed,
                'direction': direction,
                'road_type': road_type,
                'road_id': road_id,
            })

    def _update_car_anims(self):
        """Update car positions each frame."""
        section_h = ROW_HEIGHT * 2 + ROAD_THICK + 16
        max_y = section_h * 6
        for anim in self.car_anims:
            spd = anim['speed']
            if anim['road_type'] == 'v':
                if anim['direction'] == 'down':
                    anim['y'] += spd
                    if anim['y'] > max_y:
                        anim['y'] = 0
                        anim['direction'] = 'down'
                else:
                    anim['y'] -= spd
                    if anim['y'] < 0:
                        anim['y'] = max_y
                        anim['direction'] = 'up'
            else:
                if anim['direction'] == 'right':
                    anim['x'] += spd
                    if anim['x'] > TOWN_WORLD_W + 40:
                        anim['x'] = -40
                else:
                    anim['x'] -= spd
                    if anim['x'] < -40:
                        anim['x'] = TOWN_WORLD_W + 40

    def _init_pedestrian_anims(self):
        """Initialize pedestrian animation state, scaled to population."""
        import random
        rng = random.Random(77 + self.population)
        self.pedestrian_anims = []
        num_peds = min(self.population, 50)
        section_h = ROW_HEIGHT * 2 + ROAD_THICK + 16
        sidewalk_offset = ROAD_THICK // 2 + 8

        # Get occupied plot indices for entering targets
        all_plots = self.get_plot_positions()
        counts = {}
        for b in self.buildings:
            counts[b] = counts.get(b, 0) + 1
        plot_assignments = []
        for name in BUILDING_ORDER:
            if name in counts:
                for _ in range(counts[name]):
                    plot_assignments.append(name)
        occupied_indices = [i for i in range(len(plot_assignments)) if i < len(all_plots)]

        # Get house positions for house-spawning pedestrians
        house_positions = self.get_house_positions()

        for _ in range(num_peds):
            # 60% spawn from houses, 40% road walkers
            if rng.random() < 0.6 and house_positions and occupied_indices:
                # House-spawned pedestrian
                hx, hy, hseed = rng.choice(house_positions)
                # Start at house door position
                x = hx + HOUSE_W // 2
                y = hy + HOUSE_H
                target_plot = rng.choice(occupied_indices)
                self.pedestrian_anims.append({
                    'x': x, 'y': y,
                    'speed': 0.3 + rng.random() * 0.3,
                    'state': 'walking',
                    'spawn_type': 'house',
                    'home': (x, y),
                    'target_plot': target_plot,
                    'returning': False,
                    'road_type': 'v',
                    'direction': 'up',
                    'color_seed': rng.randint(0, 10000),
                    'enter_timer': 0,
                })
            else:
                # Road-walking pedestrian (existing behavior)
                has_target = rng.random() < 0.4 and occupied_indices
                if rng.random() < 0.5:
                    road_vx = rng.choice(ROAD_V_POSITIONS)
                    side = rng.choice([-1, 1])
                    x = road_vx + side * sidewalk_offset
                    y = rng.uniform(0, section_h * 4)
                    direction = rng.choice(['up', 'down'])
                    road_type = 'v'
                else:
                    section = rng.randint(0, 5)
                    road_y = section * section_h + ROW_HEIGHT * 2 - 15
                    side = rng.choice([-1, 1])
                    y = road_y + side * sidewalk_offset
                    x = rng.uniform(0, TOWN_WORLD_W)
                    direction = rng.choice(['left', 'right'])
                    road_type = 'h'

                target_plot = rng.choice(occupied_indices) if has_target else None

                self.pedestrian_anims.append({
                    'x': x, 'y': y,
                    'speed': 0.3 + rng.random() * 0.3,
                    'state': 'walking',
                    'spawn_type': 'road',
                    'home': None,
                    'target_plot': target_plot,
                    'returning': False,
                    'road_type': road_type,
                    'direction': direction,
                    'color_seed': rng.randint(0, 10000),
                    'enter_timer': 0,
                })

    def _update_pedestrian_anims(self):
        """Update pedestrian positions each frame."""
        import random
        section_h = ROW_HEIGHT * 2 + ROAD_THICK + 16
        max_y = section_h * 6
        all_plots = self.get_plot_positions()

        # Compute occupied indices for re-targeting
        counts = {}
        for b in self.buildings:
            counts[b] = counts.get(b, 0) + 1
        plot_assignments = []
        for name in BUILDING_ORDER:
            if name in counts:
                for _ in range(counts[name]):
                    plot_assignments.append(name)
        occupied_indices = [i for i in range(len(plot_assignments)) if i < len(all_plots)]

        for anim in self.pedestrian_anims:
            if anim['state'] == 'entering':
                anim['enter_timer'] -= 1
                if anim['enter_timer'] <= 0:
                    anim['state'] = 'walking'
                    rng = random.Random(anim['color_seed'] + self.tick)

                    if anim.get('spawn_type') == 'house':
                        if anim.get('returning'):
                            # Just exited home, pick a new target shop
                            anim['returning'] = False
                            if occupied_indices:
                                anim['target_plot'] = rng.choice(occupied_indices)
                            else:
                                anim['target_plot'] = None
                        else:
                            # Just exited shop, head back home
                            anim['returning'] = True
                            anim['target_plot'] = None
                    else:
                        # Road pedestrian - pick new direction
                        anim['target_plot'] = None
                        if anim['road_type'] == 'h':
                            anim['direction'] = rng.choice(['left', 'right'])
                        else:
                            anim['direction'] = rng.choice(['up', 'down'])
                continue

            spd = anim['speed']

            # House-spawned pedestrian returning home
            if anim.get('spawn_type') == 'house' and anim.get('returning') and anim.get('home'):
                hx, hy = anim['home']
                dx = hx - anim['x']
                dy = hy - anim['y']
                dist = max(1, (dx * dx + dy * dy) ** 0.5)
                if dist < 10:
                    # Arrived home - enter house
                    anim['state'] = 'entering'
                    anim['enter_timer'] = 60 + random.Random(anim['color_seed']).randint(0, 90)
                    anim['x'] = hx
                    anim['y'] = hy
                    continue
                anim['x'] += (dx / dist) * spd
                anim['y'] += (dy / dist) * spd
                anim['direction'] = 'right' if dx > 0 else 'left'
                continue

            # If has target, steer toward it
            if anim['target_plot'] is not None and anim['target_plot'] < len(all_plots):
                tx, ty = all_plots[anim['target_plot']]
                tx += PLOT_W // 2
                ty += PLOT_H
                dx = tx - anim['x']
                dy = ty - anim['y']
                dist = max(1, (dx * dx + dy * dy) ** 0.5)
                if dist < 10:
                    # Arrived at building - enter
                    anim['state'] = 'entering'
                    anim['enter_timer'] = 90 + random.Random(anim['color_seed']).randint(0, 60)
                    continue
                anim['x'] += (dx / dist) * spd
                anim['y'] += (dy / dist) * spd
                anim['direction'] = 'right' if dx > 0 else 'left'
            else:
                # Walk along road
                if anim['road_type'] == 'v':
                    if anim['direction'] == 'down':
                        anim['y'] += spd
                        if anim['y'] > max_y:
                            anim['y'] = 0
                    else:
                        anim['y'] -= spd
                        if anim['y'] < 0:
                            anim['y'] = max_y
                else:
                    if anim['direction'] == 'right':
                        anim['x'] += spd
                        if anim['x'] > TOWN_WORLD_W + 20:
                            anim['x'] = -20
                    else:
                        anim['x'] -= spd
                        if anim['x'] < -20:
                            anim['x'] = TOWN_WORLD_W + 20

    def _draw_hroad_3d(self, section, hy, town_x, town_y, view_w, view_h, total_w, sx):
        """Draw a horizontal road with 3D curb edges."""
        road_draw_x = town_x - sx - 10
        road_draw_w = town_x + TOWN_WORLD_W - sx - road_draw_x + 10
        # Sidewalk with curb
        pygame.draw.rect(self.screen, (185, 180, 170), (road_draw_x, hy - 7, road_draw_w, ROAD_THICK + 14))
        pygame.draw.rect(self.screen, SIDEWALK, (road_draw_x, hy - 5, road_draw_w, ROAD_THICK + 10))
        # Cobblestone texture on sidewalk
        for sw_x in range(max(road_draw_x, town_x), min(road_draw_x + road_draw_w, town_x + view_w), 10):
            for sw_side in [hy - 5, hy + ROAD_THICK + 2]:
                if (sw_x + sw_side) % 20 < 10:
                    pygame.draw.rect(self.screen, (190, 185, 175), (sw_x, sw_side, 8, 4), border_radius=1)
                else:
                    pygame.draw.rect(self.screen, (200, 195, 185), (sw_x + 3, sw_side + 2, 8, 4), border_radius=1)
        # Road surface
        pygame.draw.rect(self.screen, ROAD_FILL, (road_draw_x, hy, road_draw_w, ROAD_THICK))
        # Road texture
        for rx_off in range(0, road_draw_w, 8):
            shade = 135 + (rx_off % 16 < 8) * 5
            pygame.draw.line(self.screen, (shade, shade - 2, shade - 6),
                             (road_draw_x + rx_off, hy + 1), (road_draw_x + rx_off, hy + ROAD_THICK - 1), 1)
        # 3D curb - top edge (raised face visible)
        curb_top_color = (175, 170, 160)
        curb_shadow = (150, 145, 135)
        # Top curb - 3D raised strip
        pygame.draw.rect(self.screen, curb_top_color, (road_draw_x, hy - 5, road_draw_w, 4))
        pygame.draw.line(self.screen, curb_shadow, (road_draw_x, hy - 1), (road_draw_x + road_draw_w, hy - 1), 2)
        # Bottom curb - 3D raised strip with visible side face
        pygame.draw.rect(self.screen, curb_top_color, (road_draw_x, hy + ROAD_THICK + 1, road_draw_w, 4))
        pygame.draw.line(self.screen, curb_shadow, (road_draw_x, hy + ROAD_THICK + 5), (road_draw_x + road_draw_w, hy + ROAD_THICK + 5), 1)
        # Center line - double yellow
        cy = hy + ROAD_THICK // 2
        pygame.draw.line(self.screen, (220, 200, 80), (road_draw_x, cy - 2), (road_draw_x + road_draw_w, cy - 2), 2)
        pygame.draw.line(self.screen, (220, 200, 80), (road_draw_x, cy + 2), (road_draw_x + road_draw_w, cy + 2), 2)
        # Manhole cover
        mh_x = town_x + 200 - sx
        if road_draw_x < mh_x < road_draw_x + road_draw_w - 20:
            mh_y = hy + ROAD_THICK // 2
            pygame.draw.circle(self.screen, (120, 118, 112), (mh_x, mh_y), 7)
            pygame.draw.circle(self.screen, (130, 128, 122), (mh_x, mh_y), 6)
            pygame.draw.circle(self.screen, (125, 123, 117), (mh_x, mh_y), 4, 1)
            pygame.draw.line(self.screen, (118, 116, 110), (mh_x - 3, mh_y), (mh_x + 3, mh_y), 1)
            pygame.draw.line(self.screen, (118, 116, 110), (mh_x, mh_y - 3), (mh_x, mh_y + 3), 1)
        # Crosswalks at intersections
        for road_vx in ROAD_V_POSITIONS:
            ivx = town_x + road_vx - sx
            pygame.draw.rect(self.screen, ROAD_FILL, (ivx - 5, hy - 5, ROAD_THICK + 10, ROAD_THICK + 10))
            for cwy in [hy - 14, hy + ROAD_THICK + 3]:
                for cwx in range(ivx + 2, ivx + ROAD_THICK - 2, 7):
                    pygame.draw.rect(self.screen, (230, 225, 215), (cwx, cwy, 5, 10), border_radius=1)
            for cwx in [ivx - 14, ivx + ROAD_THICK + 3]:
                for cwy_s in range(hy + 2, hy + ROAD_THICK - 2, 7):
                    pygame.draw.rect(self.screen, (230, 225, 215), (cwx, cwy_s, 10, 5), border_radius=1)

    def _draw_fallback_building(self, name, bx, by, bw, bh, base, dark, light):
        """Draw a 3D building box with unique details per building type."""
        s = self.screen
        # --- 3D shell (shared by all) ---
        side_pts = [(bx + bw, by), (bx + bw + 8, by - 8), (bx + bw + 8, by + bh - 8), (bx + bw, by + bh)]
        pygame.draw.polygon(s, dark, side_pts)
        top_pts = [(bx, by), (bx + 8, by - 8), (bx + bw + 8, by - 8), (bx + bw, by)]
        pygame.draw.polygon(s, light, top_pts)
        pygame.draw.rect(s, base, (bx, by, bw, bh))
        pygame.draw.rect(s, dark, (bx, by, bw, bh), 1)

        if name == "Quantum Computer":
            # Dark screen panel
            pygame.draw.rect(s, (10, 30, 40), (bx + 6, by + 5, bw - 12, 28), border_radius=3)
            # Circuit traces
            for ty in range(by + 10, by + 30, 6):
                pygame.draw.line(s, (0, 255, 220), (bx + 10, ty), (bx + bw - 10, ty), 1)
            for tx in range(bx + 14, bx + bw - 10, 10):
                pygame.draw.line(s, (0, 255, 220), (tx, by + 8), (tx, by + 30), 1)
            # Glowing core
            glow = pygame.Surface((20, 20), pygame.SRCALPHA)
            pygame.draw.circle(glow, (0, 255, 200, 80), (10, 10), 10)
            pygame.draw.circle(glow, (0, 255, 220, 160), (10, 10), 5)
            s.blit(glow, (bx + bw // 2 - 10, by + 34))
            # Blinking LEDs along bottom
            for lx in range(bx + 8, bx + bw - 6, 8):
                c = (0, 255, 180) if (lx + self.tick // 8) % 3 == 0 else (0, 80, 60)
                pygame.draw.circle(s, c, (lx, by + bh - 6), 2)

        elif name == "Terraformer":
            # Glass dome
            pygame.draw.arc(s, (200, 255, 200, 180), (bx + 5, by - 8, bw - 10, 30), 0, 3.14, 2)
            pygame.draw.ellipse(s, (180, 240, 180, 100), (bx + 8, by + 2, bw - 16, 16))
            # Plants/vines inside
            for vx in range(bx + 12, bx + bw - 10, 9):
                vh = 10 + (vx * 7) % 12
                pygame.draw.line(s, (40, 140, 40), (vx, by + bh - 4), (vx, by + bh - vh), 2)
                pygame.draw.circle(s, (60, 180, 50), (vx, by + bh - vh), 4)
                pygame.draw.circle(s, (80, 200, 70), (vx - 1, by + bh - vh - 1), 2)
            # Soil band at bottom
            pygame.draw.rect(s, (100, 70, 40), (bx + 2, by + bh - 6, bw - 4, 6))
            # Small water drops
            for dx in [bx + 15, bx + 30, bx + 45]:
                pygame.draw.circle(s, (100, 180, 255), (dx, by + 18), 2)

        elif name == "Star Forge":
            # Furnace glow behind
            glow = pygame.Surface((bw, bh), pygame.SRCALPHA)
            pygame.draw.rect(glow, (255, 80, 0, 40), (0, 0, bw, bh))
            s.blit(glow, (bx, by))
            # Anvil shape
            pygame.draw.rect(s, (80, 80, 90), (bx + 10, by + 30, bw - 20, 10))
            pygame.draw.rect(s, (60, 60, 70), (bx + 15, by + 22, bw - 30, 10))
            # Flames on top
            flame_colors = [(255, 200, 0), (255, 140, 0), (255, 80, 0)]
            for i, fx in enumerate(range(bx + 10, bx + bw - 8, 10)):
                fh = 14 + (fx + self.tick // 4) % 8
                fc = flame_colors[i % 3]
                pts = [(fx, by + 20), (fx + 5, by + 20 - fh), (fx + 10, by + 20)]
                pygame.draw.polygon(s, fc, pts)
            # Hot metal sparks
            for sx_off in range(3):
                spark_x = bx + 15 + (self.tick * 3 + sx_off * 20) % (bw - 30)
                spark_y = by + 25 + (self.tick * 2 + sx_off * 13) % 15
                pygame.draw.circle(s, (255, 255, 150), (spark_x, spark_y), 1)

        elif name == "Antimatter Plant":
            # Containment rings
            cx, cy = bx + bw // 2, by + bh // 2
            pygame.draw.ellipse(s, (220, 100, 255), (cx - 20, cy - 14, 40, 28), 2)
            pygame.draw.ellipse(s, (180, 60, 220), (cx - 14, cy - 20, 28, 40), 2)
            # Glowing core
            glow = pygame.Surface((24, 24), pygame.SRCALPHA)
            pygame.draw.circle(glow, (255, 150, 255, 60), (12, 12), 12)
            pygame.draw.circle(glow, (255, 200, 255, 130), (12, 12), 6)
            pygame.draw.circle(glow, (255, 255, 255), (12, 12), 3)
            s.blit(glow, (cx - 12, cy - 12))
            # Warning stripes at bottom
            for sx_off in range(bx + 2, bx + bw - 2, 8):
                pygame.draw.rect(s, (255, 200, 0), (sx_off, by + bh - 8, 4, 8))

        elif name == "Warp Gate":
            # Portal ring
            cx, cy = bx + bw // 2, by + bh // 2 - 2
            # Outer ring glow
            glow = pygame.Surface((50, 50), pygame.SRCALPHA)
            pygame.draw.circle(glow, (80, 60, 255, 50), (25, 25), 25)
            s.blit(glow, (cx - 25, cy - 25))
            # Ring structure
            pygame.draw.circle(s, (70, 50, 180), (cx, cy), 22, 4)
            pygame.draw.circle(s, (120, 100, 255), (cx, cy), 20, 2)
            # Swirl inside portal
            import math
            for i in range(6):
                a = (self.tick * 0.05) + i * 1.05
                r = 12 - i * 1.5
                px = cx + int(r * math.cos(a))
                py = cy + int(r * math.sin(a))
                pygame.draw.circle(s, (150, 130, 255), (px, py), 3 - i // 3)
            # Energy bolts at cardinal points
            for angle in [0, 1.57, 3.14, 4.71]:
                ex = cx + int(24 * math.cos(angle))
                ey = cy + int(24 * math.sin(angle))
                pygame.draw.circle(s, (180, 180, 255), (ex, ey), 2)

        elif name == "Planet Engine":
            # Large exhaust at bottom
            for i in range(4):
                ew = 10 + i * 3
                ey = by + bh - 4 + i * 3
                ea = max(0, 120 - i * 30)
                exhaust = pygame.Surface((ew, 6), pygame.SRCALPHA)
                pygame.draw.rect(exhaust, (255, 120 + i * 20, 40, ea), (0, 0, ew, 6), border_radius=3)
                s.blit(exhaust, (bx + bw // 2 - ew // 2, ey))
            # Industrial pipes
            for px in [bx + 8, bx + bw - 14]:
                pygame.draw.rect(s, (160, 80, 40), (px, by + 5, 6, bh - 15))
                pygame.draw.rect(s, (180, 100, 50), (px, by + 5, 6, 3))
            # Rivets
            for ry in range(by + 12, by + bh - 10, 10):
                pygame.draw.circle(s, (140, 70, 30), (bx + 11, ry), 2)
                pygame.draw.circle(s, (140, 70, 30), (bx + bw - 11, ry), 2)
            # Viewport
            pygame.draw.circle(s, (40, 60, 80), (bx + bw // 2, by + 20), 10)
            pygame.draw.circle(s, (80, 140, 180), (bx + bw // 2, by + 20), 8)
            pygame.draw.circle(s, dark, (bx + bw // 2, by + 20), 10, 2)

        elif name == "Galaxy Brain":
            # Brain shape (two hemispheres)
            cx, cy = bx + bw // 2, by + bh // 2 - 4
            pygame.draw.ellipse(s, (255, 130, 220), (cx - 22, cy - 16, 22, 28))
            pygame.draw.ellipse(s, (255, 120, 210), (cx, cy - 16, 22, 28))
            # Brain folds
            for fy in range(cy - 10, cy + 10, 5):
                pygame.draw.arc(s, (220, 80, 180), (cx - 18, fy - 3, 18, 8), 0, 3.14, 1)
                pygame.draw.arc(s, (220, 80, 180), (cx + 2, fy - 3, 18, 8), 0, 3.14, 1)
            # Sparkles/neurons firing
            import math
            for i in range(5):
                a = self.tick * 0.08 + i * 1.26
                r = 14
                nx = cx + int(r * math.cos(a))
                ny = cy + int(r * math.sin(a))
                pygame.draw.circle(s, (255, 255, 200), (nx, ny), 2)
            # Pedestal
            pygame.draw.rect(s, (200, 80, 160), (cx - 12, cy + 16, 24, 8), border_radius=2)

        elif name == "Universe Simulator":
            # Dark screen
            pygame.draw.rect(s, (5, 5, 20), (bx + 4, by + 4, bw - 8, bh - 14), border_radius=3)
            # Star field
            import random
            star_rng = random.Random(42)
            for _ in range(25):
                sx_s = bx + 6 + star_rng.randint(0, bw - 14)
                sy_s = by + 6 + star_rng.randint(0, bh - 20)
                brightness = star_rng.randint(150, 255)
                pygame.draw.circle(s, (brightness, brightness, brightness), (sx_s, sy_s), 1)
            # Spiral galaxy in center
            cx, cy = bx + bw // 2, by + bh // 2 - 5
            import math
            for i in range(20):
                a = i * 0.4 + self.tick * 0.02
                r = 2 + i * 0.8
                gx = cx + int(r * math.cos(a))
                gy = cy + int(r * math.sin(a) * 0.5)
                alpha = max(0, 255 - i * 10)
                pygame.draw.circle(s, (200, 180, 255), (gx, gy), max(1, 3 - i // 8))
            # Console lights at bottom
            pygame.draw.rect(s, (30, 30, 50), (bx + 4, by + bh - 10, bw - 8, 8))
            for lx in range(bx + 8, bx + bw - 6, 6):
                c = (0, 200, 100) if (lx + self.tick // 10) % 4 == 0 else (0, 60, 30)
                pygame.draw.circle(s, c, (lx, by + bh - 6), 2)

        elif name == "Multiverse Portal":
            # Swirling vortex
            cx, cy = bx + bw // 2, by + bh // 2 - 2
            import math
            for ring in range(5, 0, -1):
                r = ring * 5
                a_off = self.tick * 0.06 * (1 if ring % 2 == 0 else -1)
                alpha = 40 + ring * 30
                color = (180 + ring * 10, 30 + ring * 5, 255, min(255, alpha))
                ring_s = pygame.Surface((r * 2 + 4, r * 2 + 4), pygame.SRCALPHA)
                pygame.draw.circle(ring_s, color, (r + 2, r + 2), r, 2)
                s.blit(ring_s, (cx - r - 2, cy - r - 2))
            # Portal particles
            for i in range(8):
                a = self.tick * 0.04 + i * 0.785
                r = 10 + (i * 3 + self.tick // 6) % 14
                px = cx + int(r * math.cos(a))
                py = cy + int(r * math.sin(a))
                pygame.draw.circle(s, (230, 180, 255), (px, py), 2)
            # Bright center
            pygame.draw.circle(s, (255, 220, 255), (cx, cy), 4)

        elif name == "Reality Engine":
            # Gear shapes
            cx, cy = bx + bw // 2, by + bh // 2 - 2
            import math
            # Large gear
            for i in range(8):
                a = i * 0.785 + self.tick * 0.03
                gx = cx - 10 + int(14 * math.cos(a))
                gy = cy + int(14 * math.sin(a))
                pygame.draw.rect(s, (200, 190, 150), (gx - 3, gy - 3, 6, 6))
            pygame.draw.circle(s, (220, 210, 170), (cx - 10, cy), 8)
            pygame.draw.circle(s, (180, 170, 130), (cx - 10, cy), 4)
            # Small gear
            for i in range(6):
                a = -i * 1.047 - self.tick * 0.05
                gx = cx + 12 + int(9 * math.cos(a))
                gy = cy - 4 + int(9 * math.sin(a))
                pygame.draw.rect(s, (200, 190, 150), (gx - 2, gy - 2, 4, 4))
            pygame.draw.circle(s, (220, 210, 170), (cx + 12, cy - 4), 6)
            pygame.draw.circle(s, (180, 170, 130), (cx + 12, cy - 4), 3)
            # Control panel at bottom
            pygame.draw.rect(s, (160, 150, 120), (bx + 6, by + bh - 14, bw - 12, 12), border_radius=2)
            for lx in [bx + 12, bx + 22, bx + 32, bx + 42]:
                pygame.draw.circle(s, (255, 60, 60) if lx % 20 == 12 else (60, 255, 60), (lx, by + bh - 8), 2)

        elif name == "Cosmic Citadel":
            # Central tower (taller)
            tw = 16
            pygame.draw.rect(s, (100, 65, 150), (bx + bw // 2 - tw // 2, by - 10, tw, bh + 8))
            pygame.draw.polygon(s, (120, 80, 170), [
                (bx + bw // 2, by - 20), (bx + bw // 2 - 10, by - 6), (bx + bw // 2 + 10, by - 6)])
            # Side spires
            for offset in [-18, 18]:
                sx_t = bx + bw // 2 + offset
                pygame.draw.rect(s, (90, 55, 140), (sx_t - 5, by + 5, 10, bh - 10))
                pygame.draw.polygon(s, (110, 70, 160), [
                    (sx_t, by - 5), (sx_t - 6, by + 6), (sx_t + 6, by + 6)])
            # Windows (glowing)
            for wy in range(by + 8, by + bh - 8, 12):
                pygame.draw.rect(s, (200, 180, 255), (bx + bw // 2 - 4, wy, 8, 6), border_radius=1)
            # Stars around
            import random
            star_rng = random.Random(77)
            for _ in range(6):
                sx_s = bx + star_rng.randint(2, bw - 2)
                sy_s = by + star_rng.randint(0, 15)
                pygame.draw.circle(s, (200, 180, 255), (sx_s, sy_s), 1)

        elif name == "Infinity Tower":
            # Spiral tower
            cx = bx + bw // 2
            tw = 20
            pygame.draw.rect(s, (200, 170, 70), (cx - tw // 2, by - 6, tw, bh + 4))
            # Spiral bands
            for sy_b in range(by - 4, by + bh, 8):
                band_off = ((sy_b + self.tick // 3) % 16) - 8
                pygame.draw.line(s, (255, 240, 130), (cx - tw // 2, sy_b), (cx + tw // 2, sy_b + 4), 2)
            # Glowing top
            glow = pygame.Surface((20, 20), pygame.SRCALPHA)
            pygame.draw.circle(glow, (255, 255, 150, 100), (10, 10), 10)
            pygame.draw.circle(glow, (255, 255, 200, 200), (10, 10), 5)
            s.blit(glow, (cx - 10, by - 16))
            # Infinity symbol at center
            import math
            for t_val in range(30):
                a = t_val * 0.21
                ix = cx + int(8 * math.sin(a))
                iy = by + bh // 2 + int(5 * math.sin(2 * a))
                pygame.draw.circle(s, (255, 255, 200), (ix, iy), 1)

        elif name == "Omega Station":
            # Main dome
            pygame.draw.arc(s, (180, 240, 255), (bx + 8, by + 5, bw - 16, 30), 0, 3.14, 3)
            pygame.draw.rect(s, (130, 190, 220), (bx + 8, by + 18, bw - 16, 20))
            # Satellite dishes
            for dx_off in [-15, 15]:
                dish_cx = bx + bw // 2 + dx_off
                dish_cy = by + 8
                pygame.draw.arc(s, (170, 210, 240), (dish_cx - 8, dish_cy - 6, 16, 12), 0, 3.14, 2)
                pygame.draw.line(s, (140, 180, 210), (dish_cx, dish_cy), (dish_cx, dish_cy + 14), 2)
            # Antenna on top
            pygame.draw.line(s, (160, 200, 230), (bx + bw // 2, by + 5), (bx + bw // 2, by - 8), 2)
            pygame.draw.circle(s, (255, 100, 100), (bx + bw // 2, by - 9), 3)
            # Panel windows
            for wx in range(bx + 12, bx + bw - 10, 10):
                pygame.draw.rect(s, (200, 230, 255), (wx, by + 24, 7, 8), border_radius=1)
            # Base supports
            pygame.draw.rect(s, (100, 140, 160), (bx + 10, by + bh - 12, bw - 20, 10), border_radius=2)

        elif name == "Big Bang Lab":
            # Explosion burst from center
            cx, cy = bx + bw // 2, by + bh // 2 - 2
            import math
            # Outer glow
            glow = pygame.Surface((bw + 10, bh + 10), pygame.SRCALPHA)
            pygame.draw.circle(glow, (255, 60, 30, 40), (bw // 2 + 5, bh // 2 + 5), bw // 2)
            s.blit(glow, (bx - 5, by - 5))
            # Energy rays
            for i in range(12):
                a = i * 0.524 + self.tick * 0.04
                r1, r2 = 8, 22
                x1 = cx + int(r1 * math.cos(a))
                y1 = cy + int(r1 * math.sin(a))
                x2 = cx + int(r2 * math.cos(a))
                y2 = cy + int(r2 * math.sin(a))
                c = (255, 200, 100) if i % 2 == 0 else (255, 120, 60)
                pygame.draw.line(s, c, (x1, y1), (x2, y2), 2)
            # Central sphere
            pygame.draw.circle(s, (255, 200, 100), (cx, cy), 10)
            pygame.draw.circle(s, (255, 255, 200), (cx, cy), 6)
            pygame.draw.circle(s, (255, 255, 255), (cx - 2, cy - 2), 3)
            # Containment frame
            pygame.draw.rect(s, (180, 40, 30), (bx + 2, by + 2, bw - 4, bh - 4), 2, border_radius=4)
            # Warning corners
            for corner_x, corner_y in [(bx + 4, by + 4), (bx + bw - 10, by + 4),
                                        (bx + 4, by + bh - 10), (bx + bw - 10, by + bh - 10)]:
                pygame.draw.rect(s, (255, 200, 0), (corner_x, corner_y, 6, 6))

        elif name == "Underwater Base":
            # Water tint overlay
            water = pygame.Surface((bw, bh), pygame.SRCALPHA)
            pygame.draw.rect(water, (20, 80, 140, 60), (0, 0, bw, bh))
            s.blit(water, (bx, by))
            # Dome top
            pygame.draw.arc(s, (80, 180, 220), (bx + 5, by - 5, bw - 10, 24), 0, 3.14, 3)
            # Porthole windows
            for px, py_off in [(bx + 12, by + 14), (bx + bw - 22, by + 14),
                                (bx + 12, by + 34), (bx + bw - 22, by + 34)]:
                pygame.draw.circle(s, (40, 100, 150), (px + 5, py_off + 5), 8)
                pygame.draw.circle(s, (80, 170, 220), (px + 5, py_off + 5), 6)
                pygame.draw.circle(s, (100, 190, 240), (px + 3, py_off + 3), 2)
                pygame.draw.circle(s, (60, 120, 170), (px + 5, py_off + 5), 8, 2)
            # Bubbles rising
            import math
            for i in range(4):
                bub_x = bx + 10 + (i * 15 + self.tick * 2) % (bw - 20)
                bub_y = by - 3 - (self.tick + i * 20) % 20
                bub_r = 2 + i % 2
                pygame.draw.circle(s, (140, 200, 240), (bub_x, bub_y), bub_r)
                pygame.draw.circle(s, (180, 230, 255), (bub_x - 1, bub_y - 1), 1)
            # Airlock door
            pygame.draw.rect(s, (50, 90, 130), (bx + bw // 2 - 7, by + bh - 16, 14, 16), border_radius=3)
            pygame.draw.rect(s, (70, 130, 180), (bx + bw // 2 - 7, by + bh - 16, 14, 16), 1, border_radius=3)

        elif name == "Sky Castle":
            # Cloud base
            for cx_off in [-8, 8, 0, -14, 14]:
                pygame.draw.ellipse(s, (230, 240, 255), (bx + bw // 2 + cx_off - 10, by + bh - 8, 20, 12))
            # Castle towers
            tw = 14
            for tx in [bx + 6, bx + bw - 20]:
                pygame.draw.rect(s, (180, 200, 240), (tx, by + 8, tw, bh - 20))
                # Battlements
                for batt_x in range(tx, tx + tw, 5):
                    pygame.draw.rect(s, (160, 180, 220), (batt_x, by + 5, 3, 6))
                # Tower window
                pygame.draw.rect(s, (120, 160, 220), (tx + 3, by + 20, 8, 10), border_radius=4)
                pygame.draw.rect(s, (100, 140, 200), (tx + 3, by + 20, 8, 10), 1, border_radius=4)
            # Center wall
            pygame.draw.rect(s, (190, 210, 245), (bx + 18, by + 14, bw - 36, bh - 26))
            # Gate
            pygame.draw.rect(s, (140, 160, 200), (bx + bw // 2 - 8, by + bh - 22, 16, 14), border_radius=8)
            pygame.draw.rect(s, (120, 140, 180), (bx + bw // 2 - 8, by + bh - 22, 16, 14), 1, border_radius=8)
            # Flag
            pygame.draw.line(s, (160, 170, 190), (bx + bw // 2, by + 2), (bx + bw // 2, by + 16), 2)
            pygame.draw.polygon(s, (220, 100, 100), [
                (bx + bw // 2 + 2, by + 2), (bx + bw // 2 + 12, by + 6), (bx + bw // 2 + 2, by + 10)])

        elif name == "Robot Factory":
            # Conveyor belt at bottom
            pygame.draw.rect(s, (80, 80, 90), (bx + 4, by + bh - 10, bw - 8, 8), border_radius=2)
            belt_offset = (self.tick * 2) % 12
            for cx in range(bx + 4 + belt_offset, bx + bw - 4, 12):
                pygame.draw.line(s, (60, 60, 70), (cx, by + bh - 10), (cx, by + bh - 2), 1)
            # Smoke stack
            pygame.draw.rect(s, (120, 125, 135), (bx + bw - 16, by - 8, 10, 14))
            # Smoke puffs
            for i in range(3):
                smoke_y = by - 10 - i * 6 - (self.tick // 4 + i * 3) % 8
                smoke_r = 4 + i
                smoke_s = pygame.Surface((smoke_r * 2 + 4, smoke_r * 2 + 4), pygame.SRCALPHA)
                pygame.draw.circle(smoke_s, (180, 180, 190, max(0, 100 - i * 30)), (smoke_r + 2, smoke_r + 2), smoke_r)
                s.blit(smoke_s, (bx + bw - 14 - smoke_r, smoke_y - smoke_r))
            # Robot arm (animated)
            import math
            arm_angle = math.sin(self.tick * 0.08) * 0.4
            arm_x = bx + 18
            arm_y = by + 14
            end_x = arm_x + int(18 * math.cos(arm_angle - 0.3))
            end_y = arm_y + int(18 * math.sin(arm_angle + 0.8))
            pygame.draw.line(s, (100, 105, 115), (arm_x, arm_y), (end_x, end_y), 3)
            pygame.draw.circle(s, (130, 135, 145), (arm_x, arm_y), 4)
            pygame.draw.circle(s, (255, 200, 50), (end_x, end_y), 3)
            # Gear
            gear_cx, gear_cy = bx + bw // 2 + 8, by + 20
            for i in range(6):
                a = i * 1.047 + self.tick * 0.05
                gx = gear_cx + int(8 * math.cos(a))
                gy = gear_cy + int(8 * math.sin(a))
                pygame.draw.rect(s, (120, 125, 135), (gx - 2, gy - 2, 4, 4))
            pygame.draw.circle(s, (140, 145, 155), (gear_cx, gear_cy), 5)
            pygame.draw.circle(s, (100, 105, 115), (gear_cx, gear_cy), 3)

        elif name == "Volcano Lair":
            # Volcano shape (triangle mountain)
            pygame.draw.polygon(s, (120, 40, 15), [
                (bx + bw // 2, by + 2), (bx + 2, by + bh), (bx + bw - 2, by + bh)])
            pygame.draw.polygon(s, (100, 30, 10), [
                (bx + bw // 2, by + 2), (bx + 2, by + bh), (bx + bw - 2, by + bh)], 2)
            # Lava streaks
            for lx_off in [-10, 0, 12]:
                lx_s = bx + bw // 2 + lx_off
                pygame.draw.line(s, (255, 120, 20), (lx_s, by + 15), (lx_s + lx_off // 2, by + bh - 5), 2)
                pygame.draw.line(s, (255, 180, 40), (lx_s + 1, by + 18), (lx_s + lx_off // 2 + 1, by + bh - 8), 1)
            # Crater glow at top
            glow = pygame.Surface((20, 12), pygame.SRCALPHA)
            pygame.draw.ellipse(glow, (255, 100, 0, 120), (0, 0, 20, 12))
            s.blit(glow, (bx + bw // 2 - 10, by - 2))
            pygame.draw.ellipse(s, (255, 200, 50), (bx + bw // 2 - 6, by + 1, 12, 6))
            # Eruption sparks
            import math
            for i in range(5):
                a = self.tick * 0.1 + i * 1.26
                r = 8 + (self.tick + i * 7) % 10
                sx_s = bx + bw // 2 + int(r * math.cos(a))
                sy_s = by - 2 - abs(int(r * math.sin(a)))
                pygame.draw.circle(s, (255, 200, 50), (sx_s, sy_s), 1)
            # Evil door carved into rock
            pygame.draw.rect(s, (60, 15, 5), (bx + bw // 2 - 6, by + bh - 16, 12, 16), border_radius=6)
            pygame.draw.circle(s, (255, 60, 20), (bx + bw // 2 + 3, by + bh - 9), 2)

        elif name == "Crystal Palace":
            # Large crystals
            crystal_data = [
                (bx + 8, by + 12, 10, 38, (200, 180, 255)),
                (bx + 22, by + 6, 12, 44, (220, 200, 255)),
                (bx + 38, by + 10, 10, 40, (190, 170, 255)),
                (bx + bw - 18, by + 14, 9, 36, (210, 190, 255)),
            ]
            for cx, cy, cw, ch, cc in crystal_data:
                # Crystal body
                pts = [(cx + cw // 2, cy), (cx, cy + ch // 2), (cx + cw // 2, cy + ch), (cx + cw, cy + ch // 2)]
                pygame.draw.polygon(s, cc, pts)
                # Lighter facet
                light_cc = (min(255, cc[0] + 30), min(255, cc[1] + 30), min(255, cc[2] + 20))
                pts_l = [(cx + cw // 2, cy), (cx + cw, cy + ch // 2), (cx + cw // 2, cy + ch * 2 // 3)]
                pygame.draw.polygon(s, light_cc, pts_l)
                # Outline
                pygame.draw.polygon(s, (160, 140, 200), pts, 1)
            # Sparkle highlights
            import random
            sparkle_rng = random.Random(self.tick // 8)
            for _ in range(4):
                sp_x = bx + sparkle_rng.randint(5, bw - 5)
                sp_y = by + sparkle_rng.randint(5, bh - 5)
                pygame.draw.circle(s, (255, 255, 255), (sp_x, sp_y), 2)
                pygame.draw.circle(s, (230, 220, 255), (sp_x, sp_y), 1)

        elif name == "Time Machine":
            # Clock face
            cx, cy = bx + bw // 2, by + bh // 2 - 6
            pygame.draw.circle(s, (80, 180, 165), (cx, cy), 22)
            pygame.draw.circle(s, (120, 220, 200), (cx, cy), 20)
            pygame.draw.circle(s, (80, 180, 160), (cx, cy), 20, 2)
            # Hour marks
            import math
            for i in range(12):
                a = i * 0.524 - 1.57
                x1 = cx + int(16 * math.cos(a))
                y1 = cy + int(16 * math.sin(a))
                x2 = cx + int(18 * math.cos(a))
                y2 = cy + int(18 * math.sin(a))
                pygame.draw.line(s, (50, 120, 110), (x1, y1), (x2, y2), 2)
            # Spinning hands
            hour_a = (self.tick * 0.01) - 1.57
            min_a = (self.tick * 0.08) - 1.57
            pygame.draw.line(s, (40, 100, 90), (cx, cy),
                             (cx + int(10 * math.cos(hour_a)), cy + int(10 * math.sin(hour_a))), 3)
            pygame.draw.line(s, (50, 130, 120), (cx, cy),
                             (cx + int(14 * math.cos(min_a)), cy + int(14 * math.sin(min_a))), 2)
            pygame.draw.circle(s, (60, 150, 140), (cx, cy), 3)
            # Time vortex swirl at top/bottom
            for i in range(4):
                a = self.tick * 0.06 + i * 1.57
                r = 24 + i
                vx = cx + int(r * math.cos(a))
                vy = cy + int(r * math.sin(a) * 0.4)
                pygame.draw.circle(s, (80, 200, 180), (vx, vy), 2)
            # Base panel
            pygame.draw.rect(s, (70, 160, 150), (bx + 8, by + bh - 10, bw - 16, 8), border_radius=2)

        elif name == "Dragon Tower":
            # Stone tower body
            pygame.draw.rect(s, (140, 35, 50), (bx + 14, by + 4, bw - 28, bh - 6))
            # Stone brick pattern
            for row in range(by + 6, by + bh - 8, 8):
                offset = 4 if ((row - by) // 8) % 2 == 0 else 0
                for col in range(bx + 16 + offset, bx + bw - 16, 14):
                    pygame.draw.rect(s, (120, 25, 40), (col, row, 12, 6), 1)
            # Battlements on top
            for batt_x in range(bx + 12, bx + bw - 12, 8):
                pygame.draw.rect(s, (150, 40, 55), (batt_x, by, 5, 8))
            # Dragon fire breath
            import math
            fire_x = bx + bw // 2
            fire_y = by - 2
            for i in range(6):
                a = -1.57 + math.sin(self.tick * 0.15 + i * 0.5) * 0.6
                r = 4 + i * 3
                fx = fire_x + int(r * math.cos(a))
                fy = fire_y - int(r * abs(math.sin(a))) - i * 2
                fc = (255, max(0, 200 - i * 30), 0) if i < 4 else (255, 100, 0)
                pygame.draw.circle(s, fc, (fx, fy), max(1, 4 - i // 2))
            # Dragon eye window
            pygame.draw.ellipse(s, (255, 200, 0), (bx + bw // 2 - 6, by + 14, 12, 8))
            pygame.draw.ellipse(s, (200, 50, 20), (bx + bw // 2 - 2, by + 15, 4, 6))
            # Arched door
            pygame.draw.rect(s, (80, 15, 20), (bx + bw // 2 - 7, by + bh - 18, 14, 18))
            pygame.draw.arc(s, (100, 20, 30), (bx + bw // 2 - 7, by + bh - 26, 14, 16), 0, 3.14, 2)

        elif name == "Moon Colony":
            # Lunar surface at bottom
            pygame.draw.rect(s, (190, 190, 180), (bx + 2, by + bh - 12, bw - 4, 12))
            # Craters
            for crater_x, crater_r in [(bx + 12, 5), (bx + bw - 15, 4), (bx + bw // 2 + 5, 3)]:
                pygame.draw.circle(s, (170, 170, 160), (crater_x, by + bh - 6), crater_r)
                pygame.draw.circle(s, (180, 180, 170), (crater_x, by + bh - 6), crater_r, 1)
            # Main dome
            pygame.draw.arc(s, (220, 220, 210), (bx + 8, by + 8, bw - 16, 30), 0, 3.14, 3)
            pygame.draw.ellipse(s, (200, 200, 190, 100), (bx + 10, by + 16, bw - 20, 18))
            # Dome glass reflection
            pygame.draw.arc(s, (240, 240, 235), (bx + 14, by + 10, bw - 28, 20), 0.3, 2.5, 2)
            # Habitat modules
            pygame.draw.rect(s, (200, 200, 190), (bx + 6, by + 28, 18, 16), border_radius=4)
            pygame.draw.rect(s, (200, 200, 190), (bx + bw - 24, by + 28, 18, 16), border_radius=4)
            # Module windows
            pygame.draw.rect(s, (150, 200, 230), (bx + 10, by + 31, 8, 6), border_radius=1)
            pygame.draw.rect(s, (150, 200, 230), (bx + bw - 20, by + 31, 8, 6), border_radius=1)
            # Flag
            pygame.draw.line(s, (180, 180, 175), (bx + bw // 2, by + 5), (bx + bw // 2, by + 18), 2)
            pygame.draw.polygon(s, (220, 220, 240), [
                (bx + bw // 2 + 2, by + 5), (bx + bw // 2 + 10, by + 8), (bx + bw // 2 + 2, by + 11)])
            # Stars in background (above dome)
            import random
            star_rng = random.Random(55)
            for _ in range(5):
                sx_s = bx + star_rng.randint(3, bw - 3)
                sy_s = by + star_rng.randint(1, 10)
                pygame.draw.circle(s, (255, 255, 240), (sx_s, sy_s), 1)

        elif name == "Galactic Hub":
            # Space background tint
            space = pygame.Surface((bw, bh), pygame.SRCALPHA)
            pygame.draw.rect(space, (20, 15, 50, 80), (0, 0, bw, bh))
            s.blit(space, (bx, by))
            # Central ring station
            cx, cy = bx + bw // 2, by + bh // 2
            pygame.draw.circle(s, (100, 80, 170), (cx, cy), 18, 3)
            pygame.draw.circle(s, (120, 100, 190), (cx, cy), 14, 2)
            # Station core
            pygame.draw.circle(s, (130, 110, 200), (cx, cy), 8)
            pygame.draw.circle(s, (160, 140, 220), (cx, cy), 5)
            # Docking arms
            import math
            for i in range(4):
                a = i * 1.57 + self.tick * 0.02
                x1 = cx + int(18 * math.cos(a))
                y1 = cy + int(18 * math.sin(a))
                x2 = cx + int(25 * math.cos(a))
                y2 = cy + int(25 * math.sin(a))
                pygame.draw.line(s, (90, 70, 160), (x1, y1), (x2, y2), 2)
                pygame.draw.circle(s, (140, 120, 200), (x2, y2), 3)
            # Stars
            import random
            star_rng = random.Random(88)
            for _ in range(8):
                sx_s = bx + star_rng.randint(2, bw - 2)
                sy_s = by + star_rng.randint(2, bh - 2)
                pygame.draw.circle(s, (200, 190, 240), (sx_s, sy_s), 1)
            # Blinking nav lights
            for nav_a in [0, 1.57, 3.14, 4.71]:
                nx = cx + int(20 * math.cos(nav_a + self.tick * 0.02))
                ny = cy + int(20 * math.sin(nav_a + self.tick * 0.02))
                c = (255, 100, 100) if (self.tick // 10 + int(nav_a)) % 2 == 0 else (100, 100, 255)
                pygame.draw.circle(s, c, (nx, ny), 2)

        elif name == "Dyson Sphere":
            # Central sun
            cx, cy = bx + bw // 2, by + bh // 2
            # Sun glow
            glow = pygame.Surface((36, 36), pygame.SRCALPHA)
            pygame.draw.circle(glow, (255, 200, 50, 50), (18, 18), 18)
            s.blit(glow, (cx - 18, cy - 18))
            pygame.draw.circle(s, (255, 220, 80), (cx, cy), 10)
            pygame.draw.circle(s, (255, 240, 150), (cx, cy), 6)
            pygame.draw.circle(s, (255, 255, 220), (cx - 2, cy - 2), 3)
            # Energy collection rings
            import math
            for ring_i, r in enumerate([18, 22]):
                ring_c = (200, 160, 40) if ring_i == 0 else (180, 140, 30)
                for i in range(12):
                    a = i * 0.524 + self.tick * (0.03 if ring_i == 0 else -0.02)
                    px = cx + int(r * math.cos(a))
                    py = cy + int(r * math.sin(a) * 0.6)
                    pygame.draw.circle(s, ring_c, (px, py), 2)
            # Solar panels (rectangles orbiting)
            for i in range(4):
                a = i * 1.57 + self.tick * 0.025
                px = cx + int(24 * math.cos(a))
                py = cy + int(24 * math.sin(a) * 0.5)
                panel = pygame.Surface((8, 4), pygame.SRCALPHA)
                pygame.draw.rect(panel, (100, 80, 180), (0, 0, 8, 4))
                pygame.draw.rect(panel, (140, 120, 220), (1, 1, 6, 2))
                s.blit(panel, (px - 4, py - 2))
            # Energy beams to sun
            for i in range(3):
                a = self.tick * 0.04 + i * 2.09
                ox = cx + int(22 * math.cos(a))
                oy = cy + int(22 * math.sin(a) * 0.5)
                beam = pygame.Surface((abs(ox - cx) + 4, abs(oy - cy) + 4), pygame.SRCALPHA)
                pygame.draw.line(s, (255, 220, 80, 80), (ox, oy), (cx, cy), 1)

        else:
            # Generic fallback for any other building without an image
            # Windows
            for wy in range(by + 8, by + bh - 15, 18):
                for wx in range(bx + 8, bx + bw - 10, 18):
                    pygame.draw.rect(s, (180, 210, 240), (wx, wy, 12, 10), border_radius=1)
                    pygame.draw.rect(s, dark, (wx, wy, 12, 10), 1)
            # Door
            pygame.draw.rect(s, dark, (bx + bw // 2 - 8, by + bh - 18, 16, 18))
            pygame.draw.rect(s, (max(0, dark[0] - 20), max(0, dark[1] - 20), max(0, dark[2] - 20)),
                             (bx + bw // 2 - 8, by + bh - 18, 16, 18), 1)

    def _draw_plot_3d(self, abs_x, abs_y, assignment):
        """Draw a single plot with 3D building or empty lot."""
        if assignment is not None:
            name = assignment
            inc = BUILDINGS[name][1]

            # 3D Building image (or colored fallback)
            img_x = abs_x + (PLOT_W - 72) // 2
            img_y = abs_y + 2
            shadow = pygame.Surface((80, 16), pygame.SRCALPHA)
            pygame.draw.ellipse(shadow, (0, 0, 0, 30), (0, 0, 80, 16))
            self.screen.blit(shadow, (img_x - 2, img_y + 64))
            if name in self.building_images_3d:
                self.screen.blit(self.building_images_3d[name], (img_x, img_y))
            else:
                # Colored box fallback with 3D effect + unique details
                base = BUILDING_COLORS.get(name, (150, 150, 150))
                dark = (max(0, base[0] - 60), max(0, base[1] - 60), max(0, base[2] - 60))
                light = (min(255, base[0] + 40), min(255, base[1] + 40), min(255, base[2] + 40))
                bw, bh = 60, 58
                bx, by = img_x + 6, img_y + 6
                self._draw_fallback_building(name, bx, by, bw, bh, base, dark, light)

            # Name plate
            plate_cx = abs_x + PLOT_W // 2
            plate_y = abs_y + 80
            tw = self.font_xs.size(name)[0] + 14
            ps = pygame.Surface((tw, 20), pygame.SRCALPHA)
            pygame.draw.rect(ps, (255, 255, 255, 210), (0, 0, tw, 20), border_radius=5)
            self.screen.blit(ps, (plate_cx - tw // 2, plate_y))
            self.draw_text(name, self.font_xs, DARK_GRAY, plate_cx, plate_y + 10, center=True)

            # Income label
            inc_text = f"+{inc}/solve"
            iw = self.font_tiny.size(inc_text)[0] + 10
            inc_s = pygame.Surface((iw, 16), pygame.SRCALPHA)
            pygame.draw.rect(inc_s, (60, 150, 60, 160), (0, 0, iw, 16), border_radius=4)
            self.screen.blit(inc_s, (plate_cx - iw // 2, plate_y + 22))
            self.draw_text(inc_text, self.font_tiny, WHITE, plate_cx, plate_y + 30, center=True)
        else:
            # Empty plot with 3D fence posts
            eh = PLOT_H - 10
            ps = pygame.Surface((PLOT_W, eh), pygame.SRCALPHA)
            pygame.draw.rect(ps, (0, 0, 0, 18), (0, 0, PLOT_W, eh), border_radius=10)
            # Dashed border
            for ssx in range(0, PLOT_W, 12):
                pygame.draw.rect(ps, (255, 255, 255, 50), (ssx, 0, 6, 2))
                pygame.draw.rect(ps, (255, 255, 255, 50), (ssx, eh - 2, 6, 2))
            for ssy in range(0, eh, 12):
                pygame.draw.rect(ps, (255, 255, 255, 50), (0, ssy, 2, 6))
                pygame.draw.rect(ps, (255, 255, 255, 50), (PLOT_W - 2, ssy, 2, 6))
            self.screen.blit(ps, (abs_x, abs_y))

            # 3D fence posts at corners
            post_color = FENCE_COLOR
            post_top = (min(255, post_color[0] + 30), min(255, post_color[1] + 30), min(255, post_color[2] + 30))
            for corner_x, corner_y in [(abs_x + 4, abs_y + 4), (abs_x + PLOT_W - 8, abs_y + 4),
                                        (abs_x + 4, abs_y + eh - 12), (abs_x + PLOT_W - 8, abs_y + eh - 12)]:
                # Post body
                pygame.draw.rect(self.screen, post_color, (corner_x, corner_y, 6, 10))
                # 3D top face
                top_pts = [(corner_x, corner_y), (corner_x + 3, corner_y - 2),
                           (corner_x + 9, corner_y - 2), (corner_x + 6, corner_y)]
                pygame.draw.polygon(self.screen, post_top, top_pts)

            # Slightly raised "FOR SALE" sign
            sign_cx = abs_x + PLOT_W // 2
            sign_y = abs_y + eh // 2 - 18
            # Sign post
            pygame.draw.rect(self.screen, FENCE_COLOR, (sign_cx - 2, sign_y + 15, 4, 22))
            # Sign with 3D top edge
            ss = pygame.Surface((70, 24), pygame.SRCALPHA)
            pygame.draw.rect(ss, (255, 255, 255, 190), (0, 0, 70, 24), border_radius=4)
            pygame.draw.rect(ss, (*FENCE_COLOR, 200), (0, 0, 70, 24), 1, border_radius=4)
            self.screen.blit(ss, (sign_cx - 35, sign_y - 6))
            # Tiny 3D top on sign
            sign_top = pygame.Surface((72, 3), pygame.SRCALPHA)
            pygame.draw.rect(sign_top, (*post_top, 140), (0, 0, 72, 3), border_radius=1)
            self.screen.blit(sign_top, (sign_cx - 36, sign_y - 8))
            self.draw_text("FOR SALE", self.font_tiny, FENCE_COLOR, sign_cx, sign_y + 5, center=True)

    # --- Scratch Pad ---
    def draw_scratch_pad(self):
        lx = 635
        sp_w = WIDTH - lx - 15
        sp_h = 270
        sp_y = 72
        pad_x = lx + 6
        pad_y = sp_y + 36
        pad_w = sp_w - 12
        pad_h = sp_h - 42

        # Card
        self.draw_shadow(lx, sp_y, sp_w, sp_h, radius=14, alpha=20)
        pygame.draw.rect(self.screen, WHITE, (lx, sp_y, sp_w, sp_h), border_radius=14)

        # Header
        self.draw_gradient_rect(lx, sp_y, sp_w, 32, HEADER_TOP, HEADER_BOT, radius=14)
        pygame.draw.rect(self.screen, HEADER_BOT, (lx, sp_y + 22, sp_w, 10))
        pygame.draw.rect(self.screen, WHITE, (lx, sp_y + 30, sp_w, 6))
        self.draw_text("Scratch Paper", self.font_xs, WHITE, lx + 14, sp_y + 8)

        # Mode toggle buttons in header
        mode_y = sp_y + 5
        draw_x = lx + sp_w - 148
        type_x = lx + sp_w - 100

        # Draw mode button
        draw_active = not self.scratch_typing
        draw_s = pygame.Surface((44, 22), pygame.SRCALPHA)
        pygame.draw.rect(draw_s, (255, 255, 255, 140 if draw_active else 40), (0, 0, 44, 22), border_radius=4)
        self.screen.blit(draw_s, (draw_x, mode_y))
        self.draw_text("Draw", self.font_tiny, (255, 255, 255) if draw_active else (180, 185, 200), draw_x + 22, mode_y + 4, center=True)
        self.scratch_draw_btn = pygame.Rect(draw_x, mode_y, 44, 22)

        # Type mode button
        type_active = self.scratch_typing
        type_s = pygame.Surface((44, 22), pygame.SRCALPHA)
        pygame.draw.rect(type_s, (255, 255, 255, 140 if type_active else 40), (0, 0, 44, 22), border_radius=4)
        self.screen.blit(type_s, (type_x, mode_y))
        self.draw_text("Type", self.font_tiny, (255, 255, 255) if type_active else (180, 185, 200), type_x + 22, mode_y + 4, center=True)
        self.scratch_type_btn = pygame.Rect(type_x, mode_y, 44, 22)

        # Clear button in header
        clr_x = lx + sp_w - 52
        clr_y = sp_y + 5
        self.scratch_clear_btn = pygame.Rect(clr_x, clr_y, 44, 22)
        btn_s = pygame.Surface((44, 22), pygame.SRCALPHA)
        pygame.draw.rect(btn_s, (255, 255, 255, 50), (0, 0, 44, 22), border_radius=4)
        self.screen.blit(btn_s, (clr_x, clr_y))
        self.draw_text("Clear", self.font_tiny, (220, 225, 240), clr_x + 22, clr_y + 4, center=True)

        # Drawing area — surface is 3x wider than visible for scrolling
        self.scratch_pad_w = pad_w
        total_w = pad_w * 3
        if self.scratch_surface is None or self.scratch_surface.get_height() != pad_h:
            self.scratch_surface = pygame.Surface((total_w, pad_h))
            self.scratch_surface.fill((245, 245, 240))
            self.scratch_scroll_x = 0
        self.scratch_rect = pygame.Rect(pad_x, pad_y, pad_w, pad_h)
        # Clamp scroll
        max_scroll = total_w - pad_w
        self.scratch_scroll_x = max(0, min(self.scratch_scroll_x, max_scroll))
        # Blit visible portion
        if not self.scratch_typing:
            self.screen.blit(self.scratch_surface, (pad_x, pad_y),
                             area=pygame.Rect(self.scratch_scroll_x, 0, pad_w, pad_h))
        else:
            # Type mode: white background with text
            pygame.draw.rect(self.screen, (245, 245, 240), (pad_x, pad_y, pad_w, pad_h))
            line_h = 18
            max_visible = pad_h // line_h
            # Ensure cursor line is visible by scrolling
            start_line = max(0, self.scratch_cursor_line - max_visible + 1)
            text_y = pad_y + 4
            for i in range(start_line, min(len(self.scratch_text_lines), start_line + max_visible)):
                line = self.scratch_text_lines[i]
                self.draw_text(line, self.font_xs, (50, 50, 60), pad_x + 6, text_y)
                # Draw cursor on current line
                if i == self.scratch_cursor_line and self.tick % 30 < 20:
                    cursor_x_off = self.font_xs.size(line[:self.scratch_cursor_col])[0]
                    pygame.draw.line(self.screen, (50, 50, 60),
                                     (pad_x + 6 + cursor_x_off, text_y),
                                     (pad_x + 6 + cursor_x_off, text_y + line_h - 2), 2)
                text_y += line_h
        pygame.draw.rect(self.screen, (200, 200, 195), (pad_x, pad_y, pad_w, pad_h), 1, border_radius=2)

        # Scroll indicator
        if total_w > pad_w:
            bar_y = pad_y + pad_h - 5
            bar_w = pad_w - 10
            thumb_w = max(20, int(bar_w * pad_w / total_w))
            thumb_x = pad_x + 5 + int((bar_w - thumb_w) * self.scratch_scroll_x / max_scroll) if max_scroll > 0 else pad_x + 5
            track_s = pygame.Surface((bar_w, 4), pygame.SRCALPHA)
            pygame.draw.rect(track_s, (0, 0, 0, 25), (0, 0, bar_w, 4), border_radius=2)
            self.screen.blit(track_s, (pad_x + 5, bar_y))
            thumb_s = pygame.Surface((thumb_w, 4), pygame.SRCALPHA)
            pygame.draw.rect(thumb_s, (0, 0, 0, 60), (0, 0, thumb_w, 4), border_radius=2)
            self.screen.blit(thumb_s, (thumb_x, bar_y))

    # --- Leaderboard ---
    def draw_leaderboard(self):
        lx = 635
        lb_w = WIDTH - lx - 15
        lb_top = 352
        lb_h = HEIGHT - lb_top - 15

        # Card
        self.draw_shadow(lx, lb_top, lb_w, lb_h, radius=14, alpha=20)
        pygame.draw.rect(self.screen, WHITE, (lx, lb_top, lb_w, lb_h), border_radius=14)

        # Header
        self.draw_gradient_rect(lx, lb_top, lb_w, 42, HEADER_TOP, HEADER_BOT, radius=14)
        # Fix bottom corners of header (overlap with card body)
        pygame.draw.rect(self.screen, HEADER_BOT, (lx, lb_top + 28, lb_w, 14))
        pygame.draw.rect(self.screen, WHITE, (lx, lb_top + 36, lb_w, 10))
        self.draw_text("Leaderboard", self.font_sm, WHITE, lx + lb_w // 2, lb_top + 14, center=True)

        medal_colors = [GOLD, SILVER, BRONZE]
        self.leaderboard_name_rects = []
        y = lb_top + 55
        for i, entry in enumerate(self.leaderboard[:6]):
            name = entry["name"]
            full_name = entry["name"]
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

            # Clickable row - full row is the click target for other players
            row_rect = pygame.Rect(lx + 10, y - 4, lb_w - 20, 28)
            mx, my = pygame.mouse.get_pos()
            if row_rect.collidepoint(mx, my) and full_name != self.name_text:
                self.draw_text(name, self.font_xs, ACCENT, lx + 42, y)
                # Underline the name
                name_w = self.font_xs.size(name)[0]
                pygame.draw.line(self.screen, ACCENT, (lx + 42, y + 18), (lx + 42 + name_w, y + 18), 1)
            else:
                self.draw_text(name, self.font_xs, DARK_GRAY, lx + 42, y)
            if full_name != self.name_text:
                self.leaderboard_name_rects.append((row_rect, full_name))

            # Coin amount + rebirths
            rebirths = entry.get("rebirths", 0)
            coins_text = f"{entry['coins']:,}"
            if rebirths > 0:
                coins_text += f" \u2605{rebirths}"
            coin_x = lx + lb_w - 16 - self.font_xs.size(coins_text)[0]
            self.draw_coin_icon(coin_x - 11, y + 9, 7)
            self.draw_text(coins_text, self.font_xs, COIN_DARK, coin_x, y)

            y += 34

    # --- City View ---
    def draw_city_view(self):
        if not self.viewing_city:
            return

        # Dark overlay
        overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 140))
        self.screen.blit(overlay, (0, 0))

        # Header bar
        self.draw_gradient_rect(0, 0, WIDTH, 60, HEADER_TOP, HEADER_BOT)
        pygame.draw.line(self.screen, (35, 80, 150), (0, 60), (WIDTH, 60), 2)

        pname = self.viewing_city["player_name"]
        self.draw_text(f"{pname}'s City", self.font_med, WHITE, WIDTH // 2, 18, center=True, shadow=True)

        # Population display
        view_pop = self.viewing_city["population"]
        view_bonus = self.viewing_city["pop_bonus"]
        self.draw_person_icon(18, 22, 10)
        self.draw_text(f"{view_pop}", self.font_sm, WHITE, 33, 15)
        self.draw_text("pop", self.font_tiny, (180, 210, 255), 33, 36)
        if view_bonus > 1.0:
            self.draw_text(f"x{view_bonus:.1f}", self.font_tiny, (170, 255, 170), 73, 36)

        # Coin display
        self.draw_coin_icon(WIDTH - 200, 22, 14)
        self.draw_text(f"{self.viewing_city['coins']:,}", self.font_med, WHITE, WIDTH - 180, 12, shadow=True)
        self.draw_text("coins", self.font_tiny, (180, 210, 255), WIDTH - 180, 40)

        # Close button — prominent "Back" button
        self.view_close_btn = self.draw_button("Back", WIDTH - 110, 12, 95, 36, RED, RED_HOVER, self.font_sm)

        # Swap state to render viewed city's town
        save_buildings = self.buildings
        save_cars = self.cars
        save_population = self.population
        save_scroll_x = self.town_scroll_x
        save_scroll_y = self.town_scroll_y
        save_car_anims = self.car_anims
        save_car_count = self.car_anim_count
        save_ped_anims = self.pedestrian_anims
        save_ped_count = self.pedestrian_count

        self.buildings = self.viewing_city["buildings"]
        self.cars = self.viewing_city["cars"]
        self.population = self.viewing_city["population"]
        self.town_scroll_x = self.view_scroll_x
        self.town_scroll_y = self.view_scroll_y
        # Use empty anims to avoid reinit thrash — set count to match so no reinit
        self.car_anims = []
        self.car_anim_count = len(self.cars)
        self.pedestrian_anims = []
        self.pedestrian_count = min(self.population, 50)

        self.draw_town()

        # Capture clamped scroll values back
        self.view_scroll_x = self.town_scroll_x
        self.view_scroll_y = self.town_scroll_y

        # Restore
        self.buildings = save_buildings
        self.cars = save_cars
        self.population = save_population
        self.town_scroll_x = save_scroll_x
        self.town_scroll_y = save_scroll_y
        self.car_anims = save_car_anims
        self.car_anim_count = save_car_count
        self.pedestrian_anims = save_ped_anims
        self.pedestrian_count = save_ped_count

        # "View only" label
        self.draw_text("View Only", self.font_xs, (180, 210, 255), WIDTH // 2, 45, center=True)

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
        divider_h = 36
        total_content = len(BUILDING_ORDER) * (row_h + row_gap) + divider_h + len(CAR_ORDER) * (row_h + row_gap) + 10
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
            req = UNLOCK_REQUIREMENTS.get(name, 0)
            locked = req > 0 and self.population < req

            y = list_top + idx * (row_h + row_gap) - int(self.shop_scroll)

            # Skip if off screen
            if y + row_h < list_top - 10 or y > list_top + list_h + 10:
                continue

            # Row card
            row_w = sw - 40
            row_s = pygame.Surface((row_w, row_h), pygame.SRCALPHA)
            if locked:
                pygame.draw.rect(row_s, (150, 150, 150, 35), (0, 0, row_w, row_h), border_radius=10)
                pygame.draw.rect(row_s, (150, 150, 150, 80), (0, 0, row_w, row_h), 2, border_radius=10)
            else:
                pygame.draw.rect(row_s, (*color, 35), (0, 0, row_w, row_h), border_radius=10)
                pygame.draw.rect(row_s, (*color, 120), (0, 0, row_w, row_h), 2, border_radius=10)
            self.screen.blit(row_s, (sx + 20, y))

            # Building image
            if name in self.building_images_shop:
                img = self.building_images_shop[name]
                if locked:
                    dark_img = img.copy()
                    dark_img.set_alpha(80)
                    self.screen.blit(dark_img, (sx + 30, y + 13))
                else:
                    self.screen.blit(img, (sx + 30, y + 13))

            # Text
            text_x = sx + 92
            text_color = MID_GRAY if locked else BLACK
            self.draw_text(name, self.font_med, text_color, text_x, y + 10)
            if locked:
                self.draw_text(f"Needs {req} pop", self.font_xs, MID_GRAY, text_x, y + 42)
            else:
                self.draw_coin_icon(text_x, y + 50, 7)
                self.draw_text(f"{cost:,}", self.font_xs, COIN_DARK, text_x + 12, y + 42)
                cost_w = self.font_xs.size(f"{cost:,}")[0]
                pop_val = BUILDING_POPULATION.get(name, 0)
                self.draw_text(f"  +{inc}/solve  +{pop_val} pop", self.font_xs, (60, 140, 60), text_x + 12 + cost_w, y + 42)

            # Buy button
            if locked:
                btn = self.draw_button("Locked", sx + sw - 130, y + 19, 95, 40, LIGHT_GRAY, LIGHT_GRAY)
                self.buy_buttons.append((btn, name, False))
            else:
                btn_color = GREEN if can_afford else LIGHT_GRAY
                btn_hover = GREEN_HOVER if can_afford else LIGHT_GRAY
                btn_text = "Buy" if can_afford else "---"
                btn = self.draw_button(btn_text, sx + sw - 130, y + 19, 95, 40, btn_color, btn_hover)
                self.buy_buttons.append((btn, name, can_afford))

        # --- VEHICLES divider ---
        div_y_offset = len(BUILDING_ORDER) * (row_h + row_gap)
        div_y = list_top + div_y_offset - int(self.shop_scroll)
        if div_y + divider_h > list_top - 10 and div_y < list_top + list_h + 10:
            pygame.draw.line(self.screen, MID_GRAY, (sx + 40, div_y + divider_h // 2),
                             (sx + sw - 40, div_y + divider_h // 2), 1)
            label_s = pygame.Surface((140, 22), pygame.SRCALPHA)
            pygame.draw.rect(label_s, (255, 255, 255, 255), (0, 0, 140, 22))
            self.screen.blit(label_s, (sx + sw // 2 - 70, div_y + divider_h // 2 - 11))
            self.draw_text("VEHICLES", self.font_xs, MID_GRAY, sx + sw // 2, div_y + divider_h // 2, center=True)

        # Car rows
        car_base_y = div_y_offset + divider_h
        for idx, name in enumerate(CAR_ORDER):
            cost, pop_boost, color = CARS[name]
            can_afford = self.coins >= cost
            req = UNLOCK_REQUIREMENTS.get(name, 0)
            locked = req > 0 and self.population < req

            y = list_top + car_base_y + idx * (row_h + row_gap) - int(self.shop_scroll)

            # Skip if off screen
            if y + row_h < list_top - 10 or y > list_top + list_h + 10:
                continue

            # Row card
            row_w = sw - 40
            row_s = pygame.Surface((row_w, row_h), pygame.SRCALPHA)
            if locked:
                pygame.draw.rect(row_s, (150, 150, 150, 35), (0, 0, row_w, row_h), border_radius=10)
                pygame.draw.rect(row_s, (150, 150, 150, 80), (0, 0, row_w, row_h), 2, border_radius=10)
            else:
                pygame.draw.rect(row_s, (*color, 35), (0, 0, row_w, row_h), border_radius=10)
                pygame.draw.rect(row_s, (*color, 120), (0, 0, row_w, row_h), 2, border_radius=10)
            self.screen.blit(row_s, (sx + 20, y))

            # Car icon (drawn procedurally)
            car_icon_surf = pygame.Surface((56, 40), pygame.SRCALPHA)
            self.draw_car(car_icon_surf, 28, 20, name, direction='right', scale=1.2)
            if locked:
                car_icon_surf.set_alpha(80)
            self.screen.blit(car_icon_surf, (sx + 28, y + 19))

            # Text
            text_x = sx + 92
            text_color = MID_GRAY if locked else BLACK
            self.draw_text(name, self.font_med, text_color, text_x, y + 10)
            if locked:
                self.draw_text(f"Needs {req} pop", self.font_xs, MID_GRAY, text_x, y + 42)
            else:
                self.draw_coin_icon(text_x, y + 50, 7)
                self.draw_text(f"{cost:,}", self.font_xs, COIN_DARK, text_x + 12, y + 42)
                cost_w = self.font_xs.size(f"{cost:,}")[0]
                self.draw_text(f"  +{pop_boost} pop", self.font_xs, (60, 140, 60), text_x + 12 + cost_w, y + 42)

            # Buy button
            if locked:
                btn = self.draw_button("Locked", sx + sw - 130, y + 19, 95, 40, LIGHT_GRAY, LIGHT_GRAY)
                self.buy_buttons.append((btn, name, False))
            else:
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
            if self.viewing_city:
                mods = pygame.key.get_mods()
                if mods & pygame.KMOD_SHIFT:
                    self.view_scroll_x -= event.y * 30
                else:
                    self.view_scroll_y -= event.y * 30
                    if event.x != 0:
                        self.view_scroll_x -= event.x * 30
            elif self.shop_open:
                self.shop_scroll -= event.y * 30
            elif self.scratch_rect.w > 0 and self.scratch_rect.collidepoint(pygame.mouse.get_pos()):
                scroll_amt = event.x * 30 if event.x != 0 else -event.y * 30
                self.scratch_scroll_x += scroll_amt
            else:
                mods = pygame.key.get_mods()
                if mods & pygame.KMOD_SHIFT:
                    self.town_scroll_x -= event.y * 30
                else:
                    self.town_scroll_y -= event.y * 30
                    if event.x != 0:
                        self.town_scroll_x -= event.x * 30
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button in (4, 5):
            # Legacy scroll events from trackpad — treat as scroll, not click
            scroll_dir = 1 if event.button == 4 else -1
            if self.viewing_city:
                self.view_scroll_y -= scroll_dir * 30
            elif self.shop_open:
                self.shop_scroll -= scroll_dir * 30
            elif self.scratch_rect.w > 0 and self.scratch_rect.collidepoint(event.pos):
                self.scratch_scroll_x -= scroll_dir * 30
            else:
                self.town_scroll_y -= scroll_dir * 30
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.viewing_city:
                town_rect = pygame.Rect(15, 200, 605, HEIGHT - 215)
                if self.view_close_btn.collidepoint(event.pos):
                    self.viewing_city = None
                elif town_rect.collidepoint(event.pos):
                    # Drag panning in viewed city
                    self.town_dragging = True
                    self.drag_start = event.pos
                    self.drag_scroll_start = (self.view_scroll_x, self.view_scroll_y)
                else:
                    # Click outside town area closes the view
                    self.viewing_city = None
            elif self.shop_open:
                if self.shop_close_btn.collidepoint(event.pos):
                    self.shop_open = False
                    return
                for btn, name, can_afford in self.buy_buttons:
                    if btn.collidepoint(event.pos) and can_afford:
                        self.send({"type": "buy", "building": name, "name": name})
                        break
            else:
                # Check leaderboard name clicks
                clicked_lb = False
                for rect, pname in self.leaderboard_name_rects:
                    if rect.collidepoint(event.pos):
                        self.send({"type": "view_city", "player_name": pname})
                        clicked_lb = True
                        break
                if not clicked_lb:
                    # Unfocus scratch pad when clicking outside it
                    if not self.scratch_rect.collidepoint(event.pos):
                        self.scratch_focused = False
                    if self.shop_btn.collidepoint(event.pos):
                        self.shop_open = True
                        self.shop_scroll = 0
                        self.buy_buttons = []
                    elif self.scratch_draw_btn.collidepoint(event.pos):
                        self.scratch_typing = False
                    elif self.scratch_type_btn.collidepoint(event.pos):
                        self.scratch_typing = True
                    elif self.scratch_clear_btn.collidepoint(event.pos):
                        if self.scratch_typing:
                            self.scratch_text_lines = [""]
                            self.scratch_cursor_line = 0
                            self.scratch_cursor_col = 0
                        elif self.scratch_surface:
                            self.scratch_surface.fill((245, 245, 240))
                            self.scratch_scroll_x = 0
                    elif self.rebirth_btn.collidepoint(event.pos) and self.coins >= 1_000_000:
                        self.send({"type": "rebirth"})
                    elif self.submit_btn.collidepoint(event.pos):
                        self.submit_answer()
                    elif self.scratch_rect.collidepoint(event.pos):
                        if self.scratch_typing:
                            self.scratch_focused = True
                            # Place cursor near click position
                            click_y = event.pos[1] - self.scratch_rect.y - 4
                            line_h = 18
                            max_visible = self.scratch_rect.h // line_h
                            start_line = max(0, self.scratch_cursor_line - max_visible + 1)
                            clicked_line = start_line + max(0, click_y // line_h)
                            clicked_line = min(clicked_line, len(self.scratch_text_lines) - 1)
                            self.scratch_cursor_line = clicked_line
                            # Find column from x position
                            click_x = event.pos[0] - self.scratch_rect.x - 6
                            line = self.scratch_text_lines[clicked_line]
                            col = len(line)
                            for c in range(len(line) + 1):
                                if self.font_xs.size(line[:c])[0] >= click_x:
                                    col = c
                                    break
                            self.scratch_cursor_col = col
                        else:
                            self.scratch_drawing = True
                            self.scratch_last_pos = (event.pos[0] - self.scratch_rect.x + self.scratch_scroll_x,
                                                     event.pos[1] - self.scratch_rect.y)
                    else:
                        # Start drag panning in town area
                        town_rect = pygame.Rect(15, 200, 605, HEIGHT - 215)
                        if town_rect.collidepoint(event.pos):
                            self.town_dragging = True
                            self.drag_start = event.pos
                            self.drag_scroll_start = (self.town_scroll_x, self.town_scroll_y)
        elif event.type == pygame.MOUSEBUTTONUP:
            if self.viewing_city and self.town_dragging:
                self.town_dragging = False
            else:
                self.town_dragging = False
                self.scratch_drawing = False
                self.scratch_last_pos = None
        elif event.type == pygame.MOUSEMOTION:
            if self.viewing_city and self.town_dragging:
                dx = self.drag_start[0] - event.pos[0]
                dy = self.drag_start[1] - event.pos[1]
                self.view_scroll_x = self.drag_scroll_start[0] + dx
                self.view_scroll_y = self.drag_scroll_start[1] + dy
            elif self.scratch_drawing and self.scratch_surface and not self.shop_open:
                if self.scratch_rect.collidepoint(event.pos):
                    cur = (event.pos[0] - self.scratch_rect.x + self.scratch_scroll_x,
                           event.pos[1] - self.scratch_rect.y)
                    if self.scratch_last_pos:
                        pygame.draw.line(self.scratch_surface, (50, 50, 60),
                                         self.scratch_last_pos, cur, 2)
                    self.scratch_last_pos = cur
                else:
                    self.scratch_last_pos = None
            elif self.town_dragging and not self.shop_open:
                dx = self.drag_start[0] - event.pos[0]
                dy = self.drag_start[1] - event.pos[1]
                self.town_scroll_x = self.drag_scroll_start[0] + dx
                self.town_scroll_y = self.drag_scroll_start[1] + dy
        elif event.type == pygame.KEYDOWN and self.viewing_city:
            if event.key == pygame.K_ESCAPE:
                self.viewing_city = None
        elif event.type == pygame.KEYDOWN and self.scratch_typing and self.scratch_focused and not self.shop_open and not self.viewing_city:
            # Typing into scratch pad
            line = self.scratch_text_lines[self.scratch_cursor_line]
            if event.key == pygame.K_RETURN:
                # Split line at cursor
                before = line[:self.scratch_cursor_col]
                after = line[self.scratch_cursor_col:]
                self.scratch_text_lines[self.scratch_cursor_line] = before
                self.scratch_text_lines.insert(self.scratch_cursor_line + 1, after)
                self.scratch_cursor_line += 1
                self.scratch_cursor_col = 0
            elif event.key == pygame.K_BACKSPACE:
                if self.scratch_cursor_col > 0:
                    self.scratch_text_lines[self.scratch_cursor_line] = line[:self.scratch_cursor_col - 1] + line[self.scratch_cursor_col:]
                    self.scratch_cursor_col -= 1
                elif self.scratch_cursor_line > 0:
                    # Merge with previous line
                    prev = self.scratch_text_lines[self.scratch_cursor_line - 1]
                    self.scratch_cursor_col = len(prev)
                    self.scratch_text_lines[self.scratch_cursor_line - 1] = prev + line
                    del self.scratch_text_lines[self.scratch_cursor_line]
                    self.scratch_cursor_line -= 1
            elif event.key == pygame.K_LEFT:
                if self.scratch_cursor_col > 0:
                    self.scratch_cursor_col -= 1
                elif self.scratch_cursor_line > 0:
                    self.scratch_cursor_line -= 1
                    self.scratch_cursor_col = len(self.scratch_text_lines[self.scratch_cursor_line])
            elif event.key == pygame.K_RIGHT:
                if self.scratch_cursor_col < len(line):
                    self.scratch_cursor_col += 1
                elif self.scratch_cursor_line < len(self.scratch_text_lines) - 1:
                    self.scratch_cursor_line += 1
                    self.scratch_cursor_col = 0
            elif event.key == pygame.K_UP:
                if self.scratch_cursor_line > 0:
                    self.scratch_cursor_line -= 1
                    self.scratch_cursor_col = min(self.scratch_cursor_col, len(self.scratch_text_lines[self.scratch_cursor_line]))
            elif event.key == pygame.K_DOWN:
                if self.scratch_cursor_line < len(self.scratch_text_lines) - 1:
                    self.scratch_cursor_line += 1
                    self.scratch_cursor_col = min(self.scratch_cursor_col, len(self.scratch_text_lines[self.scratch_cursor_line]))
            elif event.key == pygame.K_ESCAPE:
                self.scratch_focused = False
            elif event.key == pygame.K_TAB:
                # Tab switches focus back to answer box
                self.scratch_focused = False
            else:
                char = event.unicode
                if char and char >= ' ':
                    self.scratch_text_lines[self.scratch_cursor_line] = line[:self.scratch_cursor_col] + char + line[self.scratch_cursor_col:]
                    self.scratch_cursor_col += 1
        elif event.type == pygame.KEYDOWN and not self.shop_open:
            if event.key == pygame.K_RETURN:
                self.submit_answer()
            elif event.key == pygame.K_BACKSPACE:
                self.answer_text = self.answer_text[:-1]
            elif event.key == pygame.K_ESCAPE:
                if self.shop_open:
                    self.shop_open = False
            elif event.key == pygame.K_TAB and self.scratch_typing:
                # Tab into scratch pad from answer box
                self.scratch_focused = True
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
    def toggle_fullscreen(self):
        self.fullscreen = not self.fullscreen
        if self.fullscreen:
            self.screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.FULLSCREEN | pygame.SCALED)
        else:
            self.screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.RESIZABLE | pygame.SCALED)

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
                elif event.type == pygame.KEYDOWN and event.key == pygame.K_F11:
                    self.toggle_fullscreen()
                elif event.type == pygame.KEYDOWN and event.key == pygame.K_f and (event.mod & pygame.KMOD_META):
                    self.toggle_fullscreen()
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
