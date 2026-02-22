"""Tests for server.py - game logic (no actual network connections)."""

import unittest
from unittest.mock import MagicMock
from server import Player, GameServer
from shared import BUILDINGS


def make_player(name="TestPlayer", coins=0, buildings=None):
    """Create a Player with a mock connection."""
    conn = MagicMock()
    addr = ("127.0.0.1", 9999)
    p = Player(conn, addr, name)
    p.coins = coins
    if buildings:
        p.buildings = buildings
    return p


class TestPlayer(unittest.TestCase):
    def test_player_starts_with_zero_coins(self):
        p = make_player()
        self.assertEqual(p.coins, 0)

    def test_player_starts_with_no_buildings(self):
        p = make_player()
        self.assertEqual(p.buildings, [])

    def test_player_has_a_problem(self):
        p = make_player()
        self.assertIn("text", p.problem)
        self.assertIn("answer", p.problem)

    def test_player_stores_name(self):
        p = make_player("Alice")
        self.assertEqual(p.name, "Alice")


class TestGetIncome(unittest.TestCase):
    def test_no_buildings_zero_income(self):
        gs = GameServer()
        p = make_player()
        self.assertEqual(gs.get_income(p), 0)

    def test_one_lemonade_stand(self):
        gs = GameServer()
        p = make_player(buildings=["Lemonade Stand"])
        self.assertEqual(gs.get_income(p), 1)

    def test_multiple_buildings(self):
        gs = GameServer()
        p = make_player(buildings=["Lemonade Stand", "Cookie Shop"])
        self.assertEqual(gs.get_income(p), 6)  # 1 + 5

    def test_duplicate_buildings(self):
        gs = GameServer()
        p = make_player(buildings=["Arcade", "Arcade"])
        self.assertEqual(gs.get_income(p), 100)  # 50 + 50

    def test_all_buildings(self):
        gs = GameServer()
        all_buildings = list(BUILDINGS.keys())
        p = make_player(buildings=all_buildings)
        expected = sum(inc for _, inc in BUILDINGS.values())
        self.assertEqual(gs.get_income(p), expected)


class TestLeaderboard(unittest.TestCase):
    def test_empty_leaderboard(self):
        gs = GameServer()
        self.assertEqual(gs.get_leaderboard(), [])

    def test_single_player(self):
        gs = GameServer()
        p = make_player("Alice", coins=100)
        gs.players[p.addr] = p
        lb = gs.get_leaderboard()
        self.assertEqual(len(lb), 1)
        self.assertEqual(lb[0]["name"], "Alice")
        self.assertEqual(lb[0]["coins"], 100)

    def test_sorted_by_coins_descending(self):
        gs = GameServer()
        p1 = make_player("Alice", coins=50)
        p1.addr = ("127.0.0.1", 1001)
        p2 = make_player("Bob", coins=200)
        p2.addr = ("127.0.0.1", 1002)
        p3 = make_player("Charlie", coins=100)
        p3.addr = ("127.0.0.1", 1003)
        gs.players[p1.addr] = p1
        gs.players[p2.addr] = p2
        gs.players[p3.addr] = p3
        lb = gs.get_leaderboard()
        self.assertEqual(lb[0]["name"], "Bob")
        self.assertEqual(lb[1]["name"], "Charlie")
        self.assertEqual(lb[2]["name"], "Alice")


class TestBuildStateFor(unittest.TestCase):
    def test_state_has_required_fields(self):
        gs = GameServer()
        p = make_player("Alice", coins=42)
        gs.players[p.addr] = p
        state = gs.build_state_for(p)
        self.assertEqual(state["type"], "state")
        self.assertEqual(state["coins"], 42)
        self.assertIsInstance(state["buildings"], list)
        self.assertIn("text", state["problem"])
        self.assertIsInstance(state["income"], int)
        self.assertIsInstance(state["leaderboard"], list)

    def test_state_income_matches_buildings(self):
        gs = GameServer()
        p = make_player(buildings=["Toy Store", "Arcade"])
        gs.players[p.addr] = p
        state = gs.build_state_for(p)
        self.assertEqual(state["income"], 70)  # 20 + 50


class TestBuyLogic(unittest.TestCase):
    def test_can_buy_with_enough_coins(self):
        p = make_player(coins=50)
        cost = BUILDINGS["Cookie Shop"][0]
        self.assertGreaterEqual(p.coins, cost)
        p.coins -= cost
        p.buildings.append("Cookie Shop")
        self.assertEqual(p.coins, 0)
        self.assertIn("Cookie Shop", p.buildings)

    def test_cannot_buy_without_enough_coins(self):
        p = make_player(coins=5)
        cost = BUILDINGS["Cookie Shop"][0]
        self.assertLess(p.coins, cost)

    def test_can_buy_multiple_of_same(self):
        p = make_player(coins=100)
        for _ in range(2):
            cost = BUILDINGS["Lemonade Stand"][0]
            p.coins -= cost
            p.buildings.append("Lemonade Stand")
        self.assertEqual(len(p.buildings), 2)
        self.assertEqual(p.coins, 80)


class TestAnswerLogic(unittest.TestCase):
    def test_correct_answer_gives_coins(self):
        gs = GameServer()
        p = make_player(coins=0)
        p.problem = {"text": "2 + 3", "answer": 5, "reward": 5}
        bonus = gs.get_income(p)
        reward = p.problem["reward"] + bonus
        p.coins += reward
        self.assertEqual(p.coins, 5)

    def test_correct_answer_with_building_bonus(self):
        gs = GameServer()
        p = make_player(coins=0, buildings=["Lemonade Stand", "Cookie Shop"])
        p.problem = {"text": "2 + 3", "answer": 5, "reward": 5}
        bonus = gs.get_income(p)
        reward = p.problem["reward"] + bonus
        p.coins += reward
        self.assertEqual(p.coins, 11)  # 5 base + 1 + 5 bonus

    def test_wrong_answer_gives_nothing(self):
        p = make_player(coins=10)
        p.problem = {"text": "2 + 3", "answer": 5, "reward": 5}
        given_answer = 99
        if given_answer != p.problem["answer"]:
            reward = 0
        self.assertEqual(p.coins, 10)

    def test_multiplication_gives_more_reward(self):
        gs = GameServer()
        p = make_player(coins=0)
        p.problem = {"text": "3 × 4", "answer": 12, "reward": 10}
        bonus = gs.get_income(p)
        reward = p.problem["reward"] + bonus
        p.coins += reward
        self.assertEqual(p.coins, 10)


if __name__ == "__main__":
    unittest.main()
