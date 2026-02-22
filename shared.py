"""Shared definitions for City: buildings, protocol helpers, math problems."""

import random

# Building definitions: name -> (cost, income_per_solve)
BUILDINGS = {
    "Lemonade Stand": (10, 1),
    "Ice Cream Truck": (25, 2),
    "Cookie Shop": (50, 5),
    "Flower Shop": (75, 7),
    "Pet Shop": (100, 10),
    "Bakery": (150, 15),
    "Toy Store": (200, 20),
    "Bookstore": (275, 25),
    "Movie Theater": (350, 35),
    "Pizza Place": (425, 40),
    "Arcade": (500, 50),
    "Gym": (650, 60),
    "Hospital": (800, 75),
    "Water Park": (1000, 100),
    "Library": (1200, 110),
    "Museum": (1500, 140),
    "Theme Park": (2000, 200),
    "Stadium": (3000, 300),
    "Airport": (4000, 400),
    "Space Station": (5000, 500),
    "Underwater Base": (7000, 650),
    "Sky Castle": (9000, 800),
    "Robot Factory": (12000, 1000),
    "Volcano Lair": (15000, 1200),
    "Crystal Palace": (20000, 1500),
    "Time Machine": (25000, 1800),
    "Dragon Tower": (35000, 2500),
    "Moon Colony": (50000, 3500),
    "Galactic Hub": (75000, 5000),
    "Dyson Sphere": (100000, 7500),
    "Quantum Computer": (250000, 15000),
    "Terraformer": (500000, 25000),
    "Star Forge": (1000000, 50000),
    "Antimatter Plant": (2500000, 100000),
    "Warp Gate": (5000000, 200000),
    "Planet Engine": (10000000, 400000),
    "Galaxy Brain": (25000000, 800000),
    "Universe Simulator": (50000000, 1500000),
    "Multiverse Portal": (100000000, 3000000),
    "Reality Engine": (250000000, 6000000),
    "Cosmic Citadel": (500000000, 10000000),
    "Infinity Tower": (1000000000, 20000000),
    "Omega Station": (2500000000, 50000000),
    "Big Bang Lab": (5000000000, 100000000),
}

BUILDING_ORDER = [
    "Lemonade Stand", "Ice Cream Truck", "Cookie Shop", "Flower Shop",
    "Pet Shop", "Bakery", "Toy Store", "Bookstore",
    "Movie Theater", "Pizza Place", "Arcade", "Gym", "Hospital",
    "Water Park", "Library", "Museum",
    "Theme Park", "Stadium", "Airport", "Space Station",
    "Underwater Base", "Sky Castle", "Robot Factory", "Volcano Lair",
    "Crystal Palace", "Time Machine", "Dragon Tower", "Moon Colony",
    "Galactic Hub", "Dyson Sphere",
    "Quantum Computer", "Terraformer", "Star Forge", "Antimatter Plant",
    "Warp Gate", "Planet Engine", "Galaxy Brain", "Universe Simulator",
    "Multiverse Portal", "Reality Engine", "Cosmic Citadel", "Infinity Tower",
    "Omega Station", "Big Bang Lab",
]

# Colors for each building (R, G, B)
BUILDING_COLORS = {
    "Lemonade Stand": (255, 230, 50),
    "Ice Cream Truck": (255, 180, 200),
    "Cookie Shop": (210, 140, 70),
    "Flower Shop": (240, 130, 180),
    "Pet Shop": (160, 210, 120),
    "Bakery": (230, 190, 130),
    "Toy Store": (100, 200, 255),
    "Bookstore": (140, 110, 80),
    "Movie Theater": (80, 80, 120),
    "Pizza Place": (220, 80, 40),
    "Arcade": (200, 100, 255),
    "Gym": (70, 70, 70),
    "Hospital": (240, 240, 250),
    "Water Park": (60, 180, 220),
    "Library": (160, 130, 100),
    "Museum": (200, 190, 170),
    "Theme Park": (255, 100, 130),
    "Stadium": (90, 140, 60),
    "Airport": (180, 195, 210),
    "Space Station": (180, 200, 220),
    "Underwater Base": (30, 120, 160),
    "Sky Castle": (200, 220, 255),
    "Robot Factory": (140, 150, 160),
    "Volcano Lair": (180, 50, 20),
    "Crystal Palace": (220, 200, 255),
    "Time Machine": (100, 200, 180),
    "Dragon Tower": (160, 40, 60),
    "Moon Colony": (210, 210, 200),
    "Galactic Hub": (80, 60, 140),
    "Dyson Sphere": (255, 200, 50),
    "Quantum Computer": (0, 200, 220),
    "Terraformer": (60, 180, 100),
    "Star Forge": (255, 120, 30),
    "Antimatter Plant": (180, 0, 200),
    "Warp Gate": (100, 80, 255),
    "Planet Engine": (200, 100, 60),
    "Galaxy Brain": (255, 100, 200),
    "Universe Simulator": (30, 30, 80),
    "Multiverse Portal": (200, 50, 255),
    "Reality Engine": (255, 255, 200),
    "Cosmic Citadel": (80, 50, 120),
    "Infinity Tower": (255, 220, 100),
    "Omega Station": (150, 220, 255),
    "Big Bang Lab": (255, 60, 60),
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
    "Helicopter": (5000, 50, (40, 120, 180)),
    "Yacht": (15000, 80, (240, 240, 255)),
    "Jet": (50000, 150, (200, 200, 210)),
    "Submarine": (150000, 250, (60, 100, 140)),
    "Rocket": (500000, 500, (220, 80, 60)),
    "UFO": (2000000, 1000, (140, 255, 140)),
    "Teleporter": (10000000, 2500, (180, 100, 255)),
    "Time Ship": (50000000, 5000, (100, 200, 255)),
}

CAR_ORDER = ["Bicycle", "Scooter", "Sedan", "Taxi", "Bus", "Sports Car", "Fire Truck", "Ice Cream Van",
             "Helicopter", "Yacht", "Jet", "Submarine", "Rocket", "UFO", "Teleporter", "Time Ship"]

# Population contributed by each building type
BUILDING_POPULATION = {
    "Lemonade Stand": 2,
    "Ice Cream Truck": 5,
    "Cookie Shop": 10,
    "Flower Shop": 12,
    "Pet Shop": 20,
    "Bakery": 25,
    "Toy Store": 35,
    "Bookstore": 40,
    "Movie Theater": 60,
    "Pizza Place": 70,
    "Arcade": 80,
    "Gym": 90,
    "Hospital": 100,
    "Water Park": 150,
    "Library": 120,
    "Museum": 140,
    "Theme Park": 300,
    "Stadium": 400,
    "Airport": 450,
    "Space Station": 500,
    "Underwater Base": 600,
    "Sky Castle": 700,
    "Robot Factory": 850,
    "Volcano Lair": 1000,
    "Crystal Palace": 1200,
    "Time Machine": 1500,
    "Dragon Tower": 2000,
    "Moon Colony": 2500,
    "Galactic Hub": 3500,
    "Dyson Sphere": 5000,
    "Quantum Computer": 8000,
    "Terraformer": 12000,
    "Star Forge": 20000,
    "Antimatter Plant": 35000,
    "Warp Gate": 50000,
    "Planet Engine": 80000,
    "Galaxy Brain": 120000,
    "Universe Simulator": 200000,
    "Multiverse Portal": 350000,
    "Reality Engine": 500000,
    "Cosmic Citadel": 750000,
    "Infinity Tower": 1000000,
    "Omega Station": 2000000,
    "Big Bang Lab": 5000000,
}

# Minimum population required to unlock certain buildings/cars
UNLOCK_REQUIREMENTS = {
    "Bakery": 15,
    "Bookstore": 40,
    "Movie Theater": 30,
    "Pizza Place": 60,
    "Arcade": 80,
    "Gym": 120,
    "Hospital": 160,
    "Water Park": 200,
    "Library": 250,
    "Museum": 350,
    "Theme Park": 500,
    "Stadium": 700,
    "Airport": 900,
    "Space Station": 1000,
    "Underwater Base": 1200,
    "Sky Castle": 1500,
    "Robot Factory": 1800,
    "Volcano Lair": 2200,
    "Crystal Palace": 2800,
    "Time Machine": 3500,
    "Dragon Tower": 4500,
    "Moon Colony": 6000,
    "Galactic Hub": 8000,
    "Dyson Sphere": 10000,
    "Quantum Computer": 12000,
    "Terraformer": 18000,
    "Star Forge": 25000,
    "Antimatter Plant": 40000,
    "Warp Gate": 60000,
    "Planet Engine": 100000,
    "Galaxy Brain": 150000,
    "Universe Simulator": 250000,
    "Multiverse Portal": 400000,
    "Reality Engine": 600000,
    "Cosmic Citadel": 900000,
    "Infinity Tower": 1500000,
    "Omega Station": 3000000,
    "Big Bang Lab": 5000000,
    "Bus": 50,
    "Sports Car": 100,
    "Fire Truck": 250,
    "Ice Cream Van": 400,
    "Helicopter": 800,
    "Yacht": 2000,
    "Jet": 5000,
    "Submarine": 10000,
    "Rocket": 25000,
    "UFO": 60000,
    "Teleporter": 200000,
    "Time Ship": 500000,
}

PORT = 5555
MAX_PLAYERS = 6


GRADE_LABELS = {
    1: "Easy Addition",
    2: "Basic Arithmetic",
    3: "Times Tables",
    4: "Division",
    5: "Harder Numbers",
    6: "Order of Operations",
    7: "Exponents & Negatives",
    8: "Multi-Step Problems",
}


def generate_problem(grade=3):
    """Return a dict with 'text' (str) and 'answer' (int) for a math problem scaled to grade level."""
    grade = max(1, min(8, grade))

    if grade == 1:
        kind = random.choice(["add", "sub"])
        a = random.randint(1, 10)
        b = random.randint(1, 10)
        if kind == "add":
            return {"text": f"{a} + {b}", "answer": a + b, "reward": 3}
        else:
            a, b = max(a, b), min(a, b)
            return {"text": f"{a} - {b}", "answer": a - b, "reward": 3}

    elif grade == 2:
        kind = random.choice(["add", "sub", "mul"])
        if kind == "add":
            a = random.randint(1, 20)
            b = random.randint(1, 20)
            return {"text": f"{a} + {b}", "answer": a + b, "reward": 5}
        elif kind == "sub":
            a = random.randint(5, 20)
            b = random.randint(1, a)
            return {"text": f"{a} - {b}", "answer": a - b, "reward": 5}
        else:
            a = random.randint(2, 5)
            b = random.randint(2, 5)
            return {"text": f"{a} × {b}", "answer": a * b, "reward": 5}

    elif grade == 3:
        kind = random.choice(["add", "sub", "mul"])
        if kind == "add":
            a = random.randint(1, 50)
            b = random.randint(1, 50)
            return {"text": f"{a} + {b}", "answer": a + b, "reward": 5}
        elif kind == "sub":
            a = random.randint(10, 50)
            b = random.randint(1, a)
            return {"text": f"{a} - {b}", "answer": a - b, "reward": 5}
        else:
            a = random.randint(2, 12)
            b = random.randint(2, 12)
            return {"text": f"{a} × {b}", "answer": a * b, "reward": 10}

    elif grade == 4:
        kind = random.choice(["add", "mul", "div"])
        if kind == "add":
            a = random.randint(10, 100)
            b = random.randint(10, 100)
            return {"text": f"{a} + {b}", "answer": a + b, "reward": 8}
        elif kind == "mul":
            a = random.randint(2, 12)
            b = random.randint(2, 12)
            return {"text": f"{a} × {b}", "answer": a * b, "reward": 12}
        else:
            b = random.randint(2, 12)
            answer = random.randint(2, 12)
            a = b * answer
            return {"text": f"{a} ÷ {b}", "answer": answer, "reward": 12}

    elif grade == 5:
        kind = random.choice(["add", "mul", "div"])
        if kind == "add":
            a = random.randint(10, 200)
            b = random.randint(10, 200)
            return {"text": f"{a} + {b}", "answer": a + b, "reward": 10}
        elif kind == "mul":
            a = random.randint(5, 15)
            b = random.randint(5, 15)
            return {"text": f"{a} × {b}", "answer": a * b, "reward": 15}
        else:
            b = random.randint(3, 15)
            answer = random.randint(3, 15)
            a = b * answer
            return {"text": f"{a} ÷ {b}", "answer": answer, "reward": 15}

    elif grade == 6:
        kind = random.choice(["mul", "ooo"])
        if kind == "mul":
            a = random.randint(10, 25)
            b = random.randint(10, 25)
            return {"text": f"{a} × {b}", "answer": a * b, "reward": 15}
        else:
            a = random.randint(2, 15)
            b = random.randint(2, 10)
            c = random.randint(2, 10)
            return {"text": f"{a} + {b} × {c}", "answer": a + b * c, "reward": 20}

    elif grade == 7:
        kind = random.choice(["exp", "neg"])
        if kind == "exp":
            base = random.randint(2, 10)
            exp = random.choice([2, 3])
            sym = "²" if exp == 2 else "³"
            return {"text": f"{base}{sym}", "answer": base ** exp, "reward": 20}
        else:
            a = random.randint(-20, -1)
            b = random.randint(-20, 20)
            return {"text": f"({a}) + ({b})", "answer": a + b, "reward": 25}

    else:  # grade 8
        kind = random.choice(["multi", "pct"])
        if kind == "multi":
            a = random.randint(2, 10)
            b = random.randint(2, 10)
            c = random.randint(2, 10)
            d = random.randint(2, 10)
            return {"text": f"{a}×{b} + {c}×{d}", "answer": a * b + c * d, "reward": 25}
        else:
            pct = random.choice([10, 20, 25, 50])
            num = random.choice([40, 60, 80, 100, 120, 200, 250, 500])
            return {"text": f"{pct}% of {num}", "answer": pct * num // 100, "reward": 30}
