"""Shared definitions for Math Tycoon: buildings, protocol helpers, math problems."""

import random

# Building definitions: name -> (cost, income_per_second)
BUILDINGS = {
    "Lemonade Stand": (10, 1),
    "Cookie Shop": (50, 5),
    "Toy Store": (200, 20),
    "Arcade": (500, 50),
    "Theme Park": (2000, 200),
}

BUILDING_ORDER = ["Lemonade Stand", "Cookie Shop", "Toy Store", "Arcade", "Theme Park"]

# Colors for each building (R, G, B)
BUILDING_COLORS = {
    "Lemonade Stand": (255, 230, 50),
    "Cookie Shop": (210, 140, 70),
    "Toy Store": (100, 200, 255),
    "Arcade": (200, 100, 255),
    "Theme Park": (255, 100, 130),
}

PORT = 5555
MAX_PLAYERS = 6


def generate_problem():
    """Return a dict with 'text' (str) and 'answer' (int) for a kid-friendly math problem."""
    kind = random.choice(["add", "sub", "mul"])
    if kind == "add":
        a = random.randint(1, 50)
        b = random.randint(1, 50)
        return {"text": f"{a} + {b}", "answer": a + b, "reward": 5}
    elif kind == "sub":
        a = random.randint(10, 60)
        b = random.randint(1, a)
        return {"text": f"{a} - {b}", "answer": a - b, "reward": 5}
    else:  # mul
        a = random.randint(2, 12)
        b = random.randint(2, 12)
        return {"text": f"{a} × {b}", "answer": a * b, "reward": 10}
