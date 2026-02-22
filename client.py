"""Math Tycoon client - Pygame UI with network communication."""

import pygame
import socket
import threading
import json
import os
from shared import BUILDINGS, BUILDING_ORDER, BUILDING_COLORS, PORT

# --- Constants ---
WIDTH, HEIGHT = 1000, 750
FPS = 30

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BG_COLOR = (230, 245, 255)
HEADER_COLOR = (60, 130, 200)
COIN_COLOR = (255, 200, 50)
GREEN = (50, 200, 80)
RED = (220, 60, 60)
LIGHT_GRAY = (220, 220, 220)
DARK_GRAY = (100, 100, 100)
SHOP_BG = (240, 240, 255, 230)
INPUT_BG = (255, 255, 255)
BUTTON_COLOR = (80, 160, 240)
BUTTON_HOVER = (60, 130, 200)
GRASS_COLOR = (120, 190, 80)
GRASS_DARK = (100, 170, 60)
ROAD_COLOR = (160, 155, 145)
ROAD_LINE = (220, 210, 190)
DIRT_COLOR = (180, 160, 120)

# Town layout: fixed plot positions for each building (x, y) within the town area
TOWN_PLOTS = {
    "Lemonade Stand": (30, 30),
    "Cookie Shop": (175, 30),
    "Toy Store": (320, 30),
    "Arcade": (100, 190),
    "Theme Park": (270, 190),
}


class Client:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Math Tycoon")
        self.clock = pygame.time.Clock()

        self.font_big = pygame.font.SysFont("Arial", 40, bold=True)
        self.font_med = pygame.font.SysFont("Arial", 28, bold=True)
        self.font_sm = pygame.font.SysFont("Arial", 22)
        self.font_xs = pygame.font.SysFont("Arial", 18)

        # Load building images
        self.building_images = {}
        self.building_images_small = {}
        assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
        name_to_file = {
            "Lemonade Stand": "lemonade_stand.png",
            "Cookie Shop": "cookie_shop.png",
            "Toy Store": "toy_store.png",
            "Arcade": "arcade.png",
            "Theme Park": "theme_park.png",
        }
        for name, filename in name_to_file.items():
            path = os.path.join(assets_dir, filename)
            if os.path.exists(path):
                img = pygame.image.load(path).convert_alpha()
                self.building_images[name] = pygame.transform.smoothscale(img, (80, 80))
                self.building_images_small[name] = pygame.transform.smoothscale(img, (55, 55))

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
        self.last_result = ""  # "correct" or "wrong"
        self.result_timer = 0

        # Screens
        self.screen_state = "connect"  # "connect", "game"
        self.shop_open = False

        # Connect screen fields
        self.ip_text = "localhost"
        self.name_text = ""
        self.active_field = "name"  # "ip" or "name"
        self.connect_error = ""

        # Game screen input
        self.answer_text = ""

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
            self.result_timer = FPS * 2  # show for 2 seconds
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
    def draw_text(self, text, font, color, x, y, center=False):
        surf = font.render(text, True, color)
        rect = surf.get_rect()
        if center:
            rect.center = (x, y)
        else:
            rect.topleft = (x, y)
        self.screen.blit(surf, rect)
        return rect

    def draw_button(self, text, x, y, w, h, color=BUTTON_COLOR):
        mx, my = pygame.mouse.get_pos()
        hovered = x <= mx <= x + w and y <= my <= y + h
        c = BUTTON_HOVER if hovered else color
        pygame.draw.rect(self.screen, c, (x, y, w, h), border_radius=8)
        self.draw_text(text, self.font_sm, WHITE, x + w // 2, y + h // 2, center=True)
        return pygame.Rect(x, y, w, h)

    def draw_input(self, text, x, y, w, h, active=False):
        color = HEADER_COLOR if active else DARK_GRAY
        pygame.draw.rect(self.screen, INPUT_BG, (x, y, w, h), border_radius=6)
        pygame.draw.rect(self.screen, color, (x, y, w, h), 3, border_radius=6)
        self.draw_text(text + ("|" if active else ""), self.font_sm, BLACK, x + 10, y + h // 2 - 11)
        return pygame.Rect(x, y, w, h)

    # --- Connect Screen ---
    def draw_connect_screen(self):
        self.screen.fill(BG_COLOR)
        self.draw_text("Math Tycoon", self.font_big, HEADER_COLOR, WIDTH // 2, 80, center=True)
        self.draw_text("Solve math, earn coins, build your empire!", self.font_sm, DARK_GRAY, WIDTH // 2, 130, center=True)

        # Name field
        self.draw_text("Your Name:", self.font_sm, BLACK, 250, 200)
        self.name_rect = self.draw_input(self.name_text, 250, 230, 400, 40, self.active_field == "name")

        # IP field
        self.draw_text("Server IP:", self.font_sm, BLACK, 250, 290)
        self.ip_rect = self.draw_input(self.ip_text, 250, 320, 400, 40, self.active_field == "ip")

        # Connect button
        self.connect_btn = self.draw_button("Connect!", 350, 400, 200, 50, GREEN)

        # Error
        if self.connect_error:
            self.draw_text(self.connect_error, self.font_xs, RED, WIDTH // 2, 475, center=True)

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
        self.screen.fill(BG_COLOR)

        # Header bar
        pygame.draw.rect(self.screen, HEADER_COLOR, (0, 0, WIDTH, 60))
        self.draw_text("Math Tycoon", self.font_med, WHITE, 15, 15)

        # Coin display
        pygame.draw.circle(self.screen, COIN_COLOR, (WIDTH - 250, 30), 15)
        self.draw_text(f"{self.coins} coins", self.font_med, WHITE, WIDTH - 230, 15)

        # Bonus display
        if self.income > 0:
            self.draw_text(f"+{self.income} bonus/solve", self.font_xs, (200, 255, 200), WIDTH - 250, 48)

        # --- Math problem area ---
        pygame.draw.rect(self.screen, WHITE, (20, 75, 600, 120), border_radius=10)
        pygame.draw.rect(self.screen, HEADER_COLOR, (20, 75, 600, 120), 3, border_radius=10)
        self.draw_text("Solve:", self.font_sm, DARK_GRAY, 40, 85)
        self.draw_text(self.problem_text, self.font_big, BLACK, 310, 105, center=True)

        # Answer input
        self.answer_rect = self.draw_input(self.answer_text, 40, 145, 300, 36, True)

        # Submit button
        self.submit_btn = self.draw_button("Submit", 360, 145, 100, 36, GREEN)

        # Result feedback
        if self.result_timer > 0:
            if self.last_result == "correct":
                self.draw_text("Correct!", self.font_sm, GREEN, 480, 152)
            else:
                self.draw_text("Wrong!", self.font_sm, RED, 480, 152)
            self.result_timer -= 1

        # --- Town area ---
        self.draw_town()

        # --- Shop button ---
        self.shop_btn = self.draw_button("Shop", WIDTH - 130, 75, 110, 40, (200, 100, 255))

        # --- Leaderboard ---
        self.draw_leaderboard()

        # --- Shop overlay ---
        if self.shop_open:
            self.draw_shop()

    def draw_town(self):
        town_x, town_y = 15, 205
        town_w, town_h = 600, 530
        plot_w, plot_h = 130, 150

        # Grass background
        pygame.draw.rect(self.screen, GRASS_COLOR, (town_x, town_y, town_w, town_h), border_radius=12)
        # Grass texture stripes
        for gy in range(town_y + 10, town_y + town_h - 5, 18):
            pygame.draw.line(self.screen, GRASS_DARK, (town_x + 8, gy), (town_x + town_w - 8, gy), 1)

        # Horizontal road
        road_y = town_y + 160
        pygame.draw.rect(self.screen, ROAD_COLOR, (town_x, road_y, town_w, 30))
        # Road dashes
        for rx in range(town_x + 15, town_x + town_w - 15, 40):
            pygame.draw.rect(self.screen, ROAD_LINE, (rx, road_y + 13, 20, 4))

        # Vertical road
        road_x = town_x + 150
        pygame.draw.rect(self.screen, ROAD_COLOR, (road_x, town_y, 30, town_h))
        for ry in range(town_y + 15, town_y + town_h - 15, 40):
            pygame.draw.rect(self.screen, ROAD_LINE, (road_x + 13, ry, 4, 20))

        # Intersection patch
        pygame.draw.rect(self.screen, ROAD_COLOR, (road_x, road_y, 30, 30))

        # Count buildings
        counts = {}
        for b in self.buildings:
            counts[b] = counts.get(b, 0) + 1

        # Draw each plot
        for name in BUILDING_ORDER:
            px, py = TOWN_PLOTS[name]
            abs_x = town_x + px
            abs_y = town_y + py

            owned = name in counts

            if owned:
                count = counts[name]
                inc = BUILDINGS[name][1]

                # Building image
                if name in self.building_images:
                    img = self.building_images[name]
                    img_x = abs_x + (plot_w - 80) // 2
                    img_y = abs_y + 5
                    # Shadow
                    shadow = pygame.Surface((84, 20), pygame.SRCALPHA)
                    pygame.draw.ellipse(shadow, (0, 0, 0, 40), (0, 0, 84, 20))
                    self.screen.blit(shadow, (img_x - 2, img_y + 68))
                    self.screen.blit(img, (img_x, img_y))

                # Count badge
                badge_x = abs_x + plot_w - 18
                badge_y = abs_y + 10
                pygame.draw.circle(self.screen, HEADER_COLOR, (badge_x, badge_y), 15)
                pygame.draw.circle(self.screen, WHITE, (badge_x, badge_y), 15, 2)
                self.draw_text(f"x{count}", self.font_xs, WHITE, badge_x, badge_y, center=True)

                # Name plate
                plate_w = len(name) * 8 + 16
                plate_x = abs_x + plot_w // 2
                plate_y = abs_y + 95
                plate_surf = pygame.Surface((plate_w, 22), pygame.SRCALPHA)
                pygame.draw.rect(plate_surf, (255, 255, 255, 200), (0, 0, plate_w, 22), border_radius=6)
                self.screen.blit(plate_surf, (plate_x - plate_w // 2, plate_y - 2))
                self.draw_text(name, self.font_xs, BLACK, plate_x, plate_y + 8, center=True)

                # Income label
                self.draw_text(f"+{inc * count}/solve", self.font_xs, (255, 255, 255), plate_x, plate_y + 26, center=True)
            else:
                # Empty plot - fenced area
                plot_surf = pygame.Surface((plot_w, plot_h - 30), pygame.SRCALPHA)
                pygame.draw.rect(plot_surf, (0, 0, 0, 25), (0, 0, plot_w, plot_h - 30), border_radius=8)
                self.screen.blit(plot_surf, (abs_x, abs_y))
                # Fence posts
                for fx in range(abs_x + 5, abs_x + plot_w - 5, 20):
                    pygame.draw.rect(self.screen, DIRT_COLOR, (fx, abs_y + plot_h - 50, 4, 18))
                # Fence rail
                pygame.draw.line(self.screen, DIRT_COLOR, (abs_x + 5, abs_y + plot_h - 42), (abs_x + plot_w - 5, abs_y + plot_h - 42), 2)
                # "For Sale" sign
                self.draw_text("FOR SALE", self.font_xs, (180, 160, 120), abs_x + plot_w // 2, abs_y + plot_h // 2 - 20, center=True)

        # Town label
        label_surf = pygame.Surface((120, 26), pygame.SRCALPHA)
        pygame.draw.rect(label_surf, (255, 255, 255, 180), (0, 0, 120, 26), border_radius=6)
        self.screen.blit(label_surf, (town_x + 5, town_y + 5))
        self.draw_text("Your Town", self.font_sm, (60, 100, 40), town_x + 65, town_y + 18, center=True)

    def draw_leaderboard(self):
        lx = 635
        lb_w = WIDTH - lx - 15
        pygame.draw.rect(self.screen, WHITE, (lx, 130, lb_w, HEIGHT - 145), border_radius=10)
        pygame.draw.rect(self.screen, HEADER_COLOR, (lx, 130, lb_w, 40))
        pygame.draw.rect(self.screen, WHITE, (lx, 155, lb_w, 20))
        pygame.draw.rect(self.screen, HEADER_COLOR, (lx, 130, lb_w, 40), border_radius=10)
        self.draw_text("Leaderboard", self.font_sm, WHITE, lx + lb_w // 2, 140, center=True)

        y = 180
        for i, entry in enumerate(self.leaderboard[:6]):
            medal = ""
            if i == 0:
                medal = "1."
            elif i == 1:
                medal = "2."
            elif i == 2:
                medal = "3."
            else:
                medal = f"{i+1}."
            color = BLACK
            name = entry["name"]
            if len(name) > 12:
                name = name[:11] + ".."
            self.draw_text(f"{medal} {name}", self.font_xs, color, lx + 15, y)
            self.draw_text(f"{entry['coins']}c", self.font_xs, COIN_COLOR, lx + lb_w - 60, y)
            y += 30

    def draw_shop(self):
        # Semi-transparent overlay
        overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 120))
        self.screen.blit(overlay, (0, 0))

        # Shop panel
        sx, sy = 100, 60
        sw, sh = 700, 520
        pygame.draw.rect(self.screen, (240, 240, 255), (sx, sy, sw, sh), border_radius=12)
        pygame.draw.rect(self.screen, HEADER_COLOR, (sx, sy, sw, sh), 3, border_radius=12)

        self.draw_text("Shop", self.font_big, HEADER_COLOR, sx + sw // 2, sy + 30, center=True)
        self.draw_text(f"Your coins: {self.coins}", self.font_sm, COIN_COLOR, sx + sw // 2, sy + 70, center=True)

        # Close button
        self.shop_close_btn = self.draw_button("X", sx + sw - 50, sy + 10, 35, 35, RED)

        # Building list
        self.buy_buttons = []
        y = sy + 100
        for name in BUILDING_ORDER:
            cost, inc = BUILDINGS[name]
            color = BUILDING_COLORS[name]

            # Row background
            row_surf = pygame.Surface((sw - 40, 70), pygame.SRCALPHA)
            row_surf.fill((*color, 80))
            self.screen.blit(row_surf, (sx + 20, y))
            pygame.draw.rect(self.screen, color, (sx + 20, y, sw - 40, 70), 2, border_radius=8)

            # Building image in shop row
            if name in self.building_images_small:
                self.screen.blit(self.building_images_small[name], (sx + 28, y + 8))

            text_x = sx + 95
            self.draw_text(name, self.font_med, BLACK, text_x, y + 8)
            self.draw_text(f"Cost: {cost} coins  |  Bonus: +{inc}/solve", self.font_xs, DARK_GRAY, text_x, y + 42)

            can_afford = self.coins >= cost
            btn_color = GREEN if can_afford else LIGHT_GRAY
            btn = self.draw_button("Buy" if can_afford else "---", sx + sw - 130, y + 15, 90, 40, btn_color)
            self.buy_buttons.append((btn, name, can_afford))

            y += 80

    def handle_game_events(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN:
            if self.shop_open:
                if self.shop_close_btn.collidepoint(event.pos):
                    self.shop_open = False
                for btn, name, can_afford in self.buy_buttons:
                    if btn.collidepoint(event.pos) and can_afford:
                        self.send({"type": "buy", "building": name})
            else:
                if self.shop_btn.collidepoint(event.pos):
                    self.shop_open = True
                    self.buy_buttons = []
                elif self.submit_btn.collidepoint(event.pos):
                    self.submit_answer()

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
        # Pre-initialize rects to avoid AttributeError before first draw
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

        if self.sock:
            self.sock.close()
        pygame.quit()


if __name__ == "__main__":
    Client().run()
