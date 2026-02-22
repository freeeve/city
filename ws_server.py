"""City WebSocket server - same game logic as server.py, WebSocket transport."""

import asyncio
import json
import os
import websockets

from shared import (
    BUILDINGS, BUILDING_ORDER, CARS, CAR_ORDER, BUILDING_POPULATION,
    UNLOCK_REQUIREMENTS, generate_problem, MAX_PLAYERS,
)

WS_PORT = 5556
SAVE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "save.json")


class Player:
    def __init__(self, ws, name):
        self.ws = ws
        self.name = name
        self.coins = 0
        self.buildings = []
        self.cars = []
        self.rebirths = 0
        self.grade = 3
        self.problem = generate_problem()
        self.viewing_city_of = None
        self.visitor_x = 80.0
        self.visitor_y = 140.0
        self.visitor_dir = 'right'
        self.visitor_moving = False
        self.own_x = 80.0
        self.own_y = 140.0
        self.own_dir = 'right'
        self.own_moving = False


class GameServer:
    def __init__(self):
        self.players = {}  # id(ws) -> Player
        self.saved_data = {}
        self.lock = asyncio.Lock()
        self._load_save()

    def _load_save(self):
        if os.path.exists(SAVE_FILE):
            try:
                with open(SAVE_FILE, 'r') as f:
                    self.saved_data = json.load(f)
                print(f"Loaded {len(self.saved_data)} saved players from {SAVE_FILE}")
            except (json.JSONDecodeError, IOError) as e:
                print(f"Warning: could not load save file: {e}")
                self.saved_data = {}

    def _save(self):
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
        for name, data in self.saved_data.items():
            entries[name] = {"name": name, "coins": data.get("coins", 0), "rebirths": data.get("rebirths", 0)}
        for p in self.players.values():
            entries[p.name] = {"name": p.name, "coins": p.coins, "rebirths": p.rebirths}
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

    def get_visitors_of(self, city_owner_name, exclude_id=None):
        visitors = []
        for ws_id, p in self.players.items():
            if ws_id == exclude_id:
                continue
            if p.viewing_city_of == city_owner_name:
                visitors.append({
                    "name": p.name,
                    "x": p.visitor_x,
                    "y": p.visitor_y,
                    "dir": p.visitor_dir,
                    "moving": p.visitor_moving,
                    "seed": hash(p.name) & 0xFFFF,
                })
            elif p.name == city_owner_name and p.viewing_city_of is None:
                visitors.append({
                    "name": p.name,
                    "x": p.own_x,
                    "y": p.own_y,
                    "dir": p.own_dir,
                    "moving": p.own_moving,
                    "seed": hash(p.name) & 0xFFFF,
                    "is_owner": True,
                })
        return visitors

    async def broadcast_visitors(self, city_owner_name):
        for ws_id, p in list(self.players.items()):
            if p.viewing_city_of == city_owner_name:
                visitors = self.get_visitors_of(city_owner_name, exclude_id=ws_id)
                await self.send_to(p, {"type": "visitors", "visitors": visitors})
            elif p.name == city_owner_name and p.viewing_city_of is None:
                visitors = self.get_visitors_of(city_owner_name, exclude_id=ws_id)
                await self.send_to(p, {"type": "visitors", "visitors": visitors})

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

    async def send_to(self, player, msg):
        try:
            await player.ws.send(json.dumps(msg) + "\n")
        except Exception:
            pass

    async def broadcast_states(self):
        async with self.lock:
            for p in list(self.players.values()):
                await self.send_to(p, self.build_state_for(p))

    async def handle_client(self, ws):
        player = None
        ws_id = id(ws)
        try:
            async for raw in ws:
                # Handle newline-delimited JSON (may get multiple messages in one frame)
                for line in raw.strip().split("\n"):
                    if not line.strip():
                        continue
                    try:
                        msg = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    if msg["type"] == "join":
                        async with self.lock:
                            if len(self.players) >= MAX_PLAYERS:
                                await ws.send(json.dumps({"type": "error", "message": "Server full"}) + "\n")
                                await ws.close()
                                return
                            player = Player(ws, msg["name"])
                            player.grade = max(1, min(8, msg.get("grade", 3)))
                            player.problem = generate_problem(player.grade)
                            self._restore_player(player)
                            self.players[ws_id] = player
                            print(f"{msg['name']} joined (grade {player.grade})")
                        await self.broadcast_states()

                    elif msg["type"] == "answer" and player:
                        async with self.lock:
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
                            await self.send_to(player, {
                                "type": "result",
                                "result": result,
                                "reward": reward,
                            })
                            self._save()
                        await self.broadcast_states()

                    elif msg["type"] == "view_city" and player:
                        async with self.lock:
                            target_name = msg.get("player_name", "")
                            target_data = None
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
                                await self.send_to(player, {
                                    "type": "city_view",
                                    "player_name": target_name,
                                    **target_data,
                                })

                    elif msg["type"] == "enter_city" and player:
                        async with self.lock:
                            player.viewing_city_of = msg.get("target")
                            player.visitor_x = 80.0
                            player.visitor_y = 140.0
                            player.visitor_dir = 'right'
                            player.visitor_moving = False
                            await self.broadcast_visitors(player.viewing_city_of)

                    elif msg["type"] == "leave_city" and player:
                        async with self.lock:
                            old_city = player.viewing_city_of
                            player.viewing_city_of = None
                            if old_city:
                                await self.broadcast_visitors(old_city)
                            await self.broadcast_visitors(player.name)

                    elif msg["type"] == "visitor_pos" and player:
                        async with self.lock:
                            player.visitor_x = msg.get("x", player.visitor_x)
                            player.visitor_y = msg.get("y", player.visitor_y)
                            player.visitor_dir = msg.get("dir", player.visitor_dir)
                            player.visitor_moving = msg.get("moving", player.visitor_moving)
                            if player.viewing_city_of:
                                await self.broadcast_visitors(player.viewing_city_of)

                    elif msg["type"] == "own_pos" and player:
                        async with self.lock:
                            player.own_x = msg.get("x", player.own_x)
                            player.own_y = msg.get("y", player.own_y)
                            player.own_dir = msg.get("dir", player.own_dir)
                            player.own_moving = msg.get("moving", player.own_moving)
                            await self.broadcast_visitors(player.name)

                    elif msg["type"] == "rebirth" and player:
                        async with self.lock:
                            if player.coins >= 1_000_000:
                                player.coins = 0
                                player.buildings = []
                                player.cars = []
                                player.rebirths += 1
                                self._save()
                        await self.broadcast_states()

                    elif msg["type"] == "buy" and player:
                        async with self.lock:
                            item_name = msg.get("building") or msg.get("name", "")
                            pop = self.get_population(player)
                            req = UNLOCK_REQUIREMENTS.get(item_name, 0)
                            if req > 0 and pop < req:
                                await self.send_to(player, {"type": "error", "message": f"Needs {req} population"})
                            elif item_name in BUILDINGS:
                                cost = BUILDINGS[item_name][0]
                                if player.coins >= cost:
                                    player.coins -= cost
                                    player.buildings.append(item_name)
                                    await self.send_to(player, {"type": "bought", "building": item_name})
                                else:
                                    await self.send_to(player, {"type": "error", "message": "Not enough coins"})
                            elif item_name in CARS:
                                cost = CARS[item_name][0]
                                if player.coins >= cost:
                                    player.coins -= cost
                                    player.cars.append(item_name)
                                    await self.send_to(player, {"type": "bought", "building": item_name})
                                else:
                                    await self.send_to(player, {"type": "error", "message": "Not enough coins"})
                            self._save()
                        await self.broadcast_states()

        except websockets.ConnectionClosed:
            pass
        except Exception as e:
            print(f"Error handling client: {e}")
        finally:
            async with self.lock:
                if ws_id in self.players:
                    p = self.players[ws_id]
                    old_city = p.viewing_city_of
                    if old_city:
                        p.viewing_city_of = None
                    print(f"{p.name} disconnected")
                    self._save()
                    del self.players[ws_id]
                    if old_city:
                        await self.broadcast_visitors(old_city)
            await self.broadcast_states()

    async def run(self):
        print(f"City WebSocket server running on port {WS_PORT}")
        print("Waiting for players...")
        async with websockets.serve(self.handle_client, "0.0.0.0", WS_PORT):
            await asyncio.Future()  # run forever


if __name__ == "__main__":
    server = GameServer()
    try:
        asyncio.run(server.run())
    except KeyboardInterrupt:
        print("\nServer shutting down.")
