"""Shared definitions for City: buildings, protocol helpers, math problems."""

import random

# Building definitions: name -> (cost, income_per_solve)
BUILDINGS = {
    "Lemonade Stand": (10, 1),
    "Ice Cream Truck": (25, 2),
    "Cookie Shop": (50, 5),
    "Pet Shop": (100, 10),
    "Toy Store": (200, 20),
    "Movie Theater": (350, 35),
    "Arcade": (500, 50),
    "Water Park": (1000, 100),
    "Theme Park": (2000, 200),
    "Space Station": (5000, 500),
}

BUILDING_ORDER = [
    "Lemonade Stand", "Ice Cream Truck", "Cookie Shop", "Pet Shop", "Toy Store",
    "Movie Theater", "Arcade", "Water Park", "Theme Park", "Space Station",
]

# Colors for each building (R, G, B)
BUILDING_COLORS = {
    "Lemonade Stand": (255, 230, 50),
    "Ice Cream Truck": (255, 180, 200),
    "Cookie Shop": (210, 140, 70),
    "Pet Shop": (160, 210, 120),
    "Toy Store": (100, 200, 255),
    "Movie Theater": (80, 80, 120),
    "Arcade": (200, 100, 255),
    "Water Park": (60, 180, 220),
    "Theme Park": (255, 100, 130),
    "Space Station": (180, 200, 220),
}

# Car definitions: name -> (cost, population_boost, color)
CARS = {
    "Bicycle": (15, 1, (100, 180, 220)),
    "Scooter": (40, 2, (220, 100, 100)),
    "Sedan": (80, 5, (70, 130, 200)),
    "Taxi": (150, 8, (255, 210, 50)),
    "Bus": (300, 20, (60, 160, 80)),
    "Sports Car": (600, 15, (220, 40, 40)),
    "Fire Truck": (1000, 25, (200, 30, 30)),
    "Ice Cream Van": (1500, 30, (255, 200, 220)),
}

CAR_ORDER = ["Bicycle", "Scooter", "Sedan", "Taxi", "Bus", "Sports Car", "Fire Truck", "Ice Cream Van"]

# Population contributed by each building type
BUILDING_POPULATION = {
    "Lemonade Stand": 2,
    "Ice Cream Truck": 5,
    "Cookie Shop": 10,
    "Pet Shop": 20,
    "Toy Store": 35,
    "Movie Theater": 60,
    "Arcade": 80,
    "Water Park": 150,
    "Theme Park": 300,
    "Space Station": 500,
}

# Minimum population required to unlock certain buildings/cars
UNLOCK_REQUIREMENTS = {
    "Movie Theater": 30,
    "Arcade": 80,
    "Water Park": 200,
    "Theme Park": 500,
    "Space Station": 1000,
    "Bus": 50,
    "Sports Car": 100,
    "Fire Truck": 250,
    "Ice Cream Van": 400,
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
