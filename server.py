"""City server - manages all game state for up to 6 players."""

import socket
import threading
import json
import os
from shared import BUILDINGS, BUILDING_ORDER, CARS, CAR_ORDER, BUILDING_POPULATION, UNLOCK_REQUIREMENTS, generate_problem, PORT, MAX_PLAYERS

SAVE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "save.json")


class Player:
    def __init__(self, conn, addr, name):
        self.conn = conn
        self.addr = addr
        self.name = name
        self.coins = 0
        self.buildings = []  # list of building names owned
        self.cars = []  # list of car names owned
        self.rebirths = 0
        self.grade = 3
        self.problem = generate_problem()


class GameServer:
    def __init__(self):
        self.players = {}  # addr -> Player
        self.saved_data = {}  # name -> {coins, buildings, cars}
        self.lock = threading.Lock()
        self.running = True
        self._load_save()

    def _load_save(self):
        """Load saved player data from disk."""
        if os.path.exists(SAVE_FILE):
            try:
                with open(SAVE_FILE, 'r') as f:
                    self.saved_data = json.load(f)
                print(f"Loaded {len(self.saved_data)} saved players from {SAVE_FILE}")
            except (json.JSONDecodeError, IOError) as e:
                print(f"Warning: could not load save file: {e}")
                self.saved_data = {}

    def _save(self):
        """Persist all player data to disk. Call with lock held."""
        # Update saved_data from active players
        for p in self.players.values():
            self.saved_data[p.name] = {
                "coins": p.coins,
                "buildings": p.buildings[:],
                "cars": p.cars[:],
                "grade": p.grade,
                "rebirths": p.rebirths,
            }
        try:
            tmp = SAVE_FILE + ".tmp"
            with open(tmp, 'w') as f:
                json.dump(self.saved_data, f, indent=2)
            os.replace(tmp, SAVE_FILE)
        except IOError as e:
            print(f"Warning: could not save: {e}")

    def _restore_player(self, player):
        """Restore a player's saved state if it exists."""
        if player.name in self.saved_data:
            data = self.saved_data[player.name]
            player.coins = data.get("coins", 0)
            player.buildings = data.get("buildings", [])
            player.cars = data.get("cars", [])
            player.rebirths = data.get("rebirths", 0)
            saved_grade = data.get("grade", None)
            if saved_grade is not None:
                player.grade = saved_grade
            print(f"  Restored {player.name}: {player.coins} coins, {len(player.buildings)} buildings, {len(player.cars)} cars")

    def get_leaderboard(self):
        entries = {}
        # Include saved (offline) players
        for name, data in self.saved_data.items():
            entries[name] = {"name": name, "coins": data.get("coins", 0)}
        # Override with live player data
        for p in self.players.values():
            entries[p.name] = {"name": p.name, "coins": p.coins}
        result = list(entries.values())
        result.sort(key=lambda e: e["coins"], reverse=True)
        return result

    def get_population(self, player):
        pop = 0
        for b in player.buildings:
            pop += BUILDING_POPULATION.get(b, 0)
        for c in player.cars:
            pop += CARS[c][1]
        return pop

    def get_pop_multiplier(self, player):
        pop = self.get_population(player)
        return 1.0 + (pop // 100) * 0.1 + player.rebirths * 0.5

    def get_income(self, player):
        total = 0
        for b in player.buildings:
            total += BUILDINGS[b][1]
        return total

    def build_state_for(self, player):
        pop = self.get_population(player)
        pop_mult = self.get_pop_multiplier(player)
        return {
            "type": "state",
            "coins": player.coins,
            "buildings": player.buildings,
            "cars": player.cars,
            "problem": {"text": player.problem["text"]},
            "income": self.get_income(player),
            "population": pop,
            "pop_bonus": pop_mult,
            "leaderboard": self.get_leaderboard(),
            "rebirths": player.rebirths,
        }

    def send_to(self, player, msg):
        try:
            data = json.dumps(msg) + "\n"
            player.conn.sendall(data.encode())
        except Exception:
            pass

    def broadcast_states(self):
        with self.lock:
            for p in list(self.players.values()):
                self.send_to(p, self.build_state_for(p))

    def handle_client(self, conn, addr):
        buf = ""
        player = None
        try:
            while self.running:
                data = conn.recv(4096)
                if not data:
                    break
                buf += data.decode()
                while "\n" in buf:
                    line, buf = buf.split("\n", 1)
                    if not line.strip():
                        continue
                    msg = json.loads(line)
                    if msg["type"] == "join":
                        with self.lock:
                            if len(self.players) >= MAX_PLAYERS:
                                self.send_to_raw(conn, {"type": "error", "message": "Server full"})
                                conn.close()
                                return
                            player = Player(conn, addr, msg["name"])
                            player.grade = max(1, min(8, msg.get("grade", 3)))
                            player.problem = generate_problem(player.grade)
                            self._restore_player(player)
                            self.players[addr] = player
                            print(f"{msg['name']} joined from {addr} (grade {player.grade})")
                        self.broadcast_states()

                    elif msg["type"] == "answer" and player:
                        with self.lock:
                            try:
                                answer = int(msg["answer"])
                            except (ValueError, TypeError):
                                continue
                            if answer == player.problem["answer"]:
                                bonus = self.get_income(player)
                                base_reward = player.problem["reward"] + bonus
                                pop_mult = self.get_pop_multiplier(player)
                                reward = int(base_reward * pop_mult)
                                player.coins += reward
                                result = "correct"
                            else:
                                reward = 0
                                result = "wrong"
                            player.problem = generate_problem(player.grade)
                            self.send_to(player, {
                                "type": "result",
                                "result": result,
                                "reward": reward,
                            })
                            self._save()
                        self.broadcast_states()

                    elif msg["type"] == "view_city" and player:
                        with self.lock:
                            target_name = msg.get("player_name", "")
                            target_data = None
                            # Check live players first
                            for p in self.players.values():
                                if p.name == target_name:
                                    target_data = {
                                        "coins": p.coins,
                                        "buildings": p.buildings[:],
                                        "cars": p.cars[:],
                                        "population": self.get_population(p),
                                        "pop_bonus": self.get_pop_multiplier(p),
                                    }
                                    break
                            # Fall back to saved data
                            if target_data is None and target_name in self.saved_data:
                                sd = self.saved_data[target_name]
                                buildings = sd.get("buildings", [])
                                cars = sd.get("cars", [])
                                pop = sum(BUILDING_POPULATION.get(b, 0) for b in buildings)
                                pop += sum(CARS[c][1] for c in cars if c in CARS)
                                pop_bonus = 1.0 + (pop // 100) * 0.1
                                target_data = {
                                    "coins": sd.get("coins", 0),
                                    "buildings": buildings,
                                    "cars": cars,
                                    "population": pop,
                                    "pop_bonus": pop_bonus,
                                }
                            if target_data:
                                self.send_to(player, {
                                    "type": "city_view",
                                    "player_name": target_name,
                                    **target_data,
                                })

                    elif msg["type"] == "rebirth" and player:
                        with self.lock:
                            if player.coins >= 1_000_000:
                                player.coins = 0
                                player.buildings = []
                                player.cars = []
                                player.rebirths += 1
                                self._save()
                        self.broadcast_states()

                    elif msg["type"] == "buy" and player:
                        with self.lock:
                            item_name = msg.get("building") or msg.get("name", "")
                            pop = self.get_population(player)
                            req = UNLOCK_REQUIREMENTS.get(item_name, 0)
                            if req > 0 and pop < req:
                                self.send_to(player, {"type": "error", "message": f"Needs {req} population"})
                            elif item_name in BUILDINGS:
                                cost = BUILDINGS[item_name][0]
                                if player.coins >= cost:
                                    player.coins -= cost
                                    player.buildings.append(item_name)
                                    self.send_to(player, {"type": "bought", "building": item_name})
                                else:
                                    self.send_to(player, {"type": "error", "message": "Not enough coins"})
                            elif item_name in CARS:
                                cost = CARS[item_name][0]
                                if player.coins >= cost:
                                    player.coins -= cost
                                    player.cars.append(item_name)
                                    self.send_to(player, {"type": "bought", "building": item_name})
                                else:
                                    self.send_to(player, {"type": "error", "message": "Not enough coins"})
                            self._save()
                        self.broadcast_states()

        except (ConnectionResetError, BrokenPipeError, json.JSONDecodeError):
            pass
        finally:
            with self.lock:
                if addr in self.players:
                    print(f"{self.players[addr].name} disconnected")
                    self._save()
                    del self.players[addr]
            conn.close()
            self.broadcast_states()

    def send_to_raw(self, conn, msg):
        try:
            data = json.dumps(msg) + "\n"
            conn.sendall(data.encode())
        except Exception:
            pass

    def run(self):
        server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_sock.bind(("0.0.0.0", PORT))
        server_sock.listen(MAX_PLAYERS)
        print(f"City server running on port {PORT}")
        print("Waiting for players...")

        try:
            while self.running:
                conn, addr = server_sock.accept()
                t = threading.Thread(target=self.handle_client, args=(conn, addr), daemon=True)
                t.start()
        except KeyboardInterrupt:
            print("\nServer shutting down.")
            self.running = False
        finally:
            server_sock.close()


if __name__ == "__main__":
    GameServer().run()
