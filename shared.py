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
    1: "Add & Subtract to 20",
    2: "Add & Subtract to 100",
    3: "Multiply & Divide to 10×10",
    4: "Multi-Digit × and ÷",
    5: "Order of Operations",
    6: "Integers & Exponents",
    7: "Proportions & Equations",
    8: "Expressions & Percents",
}


def generate_problem(grade=3):
    """Return a dict with 'text' (str) and 'answer' (int) for a math problem.

    Aligned to Virginia Standards of Learning (SOL) 2023 by grade level.
    """
    grade = max(1, min(8, grade))

    if grade == 1:
        # VA SOL 1.CE.1: Add/subtract within 20, automaticity within 10
        kind = random.choice(["add", "add", "sub", "add10", "sub10"])
        if kind == "add10":
            # Automaticity: facts within 10
            a = random.randint(1, 9)
            b = random.randint(1, 10 - a)
            return {"text": f"{a} + {b}", "answer": a + b, "reward": 3}
        elif kind == "sub10":
            a = random.randint(2, 10)
            b = random.randint(1, a)
            return {"text": f"{a} - {b}", "answer": a - b, "reward": 3}
        elif kind == "add":
            # Within 20
            a = random.randint(1, 15)
            b = random.randint(1, 20 - a)
            return {"text": f"{a} + {b}", "answer": a + b, "reward": 3}
        else:
            a = random.randint(3, 20)
            b = random.randint(1, a)
            return {"text": f"{a} - {b}", "answer": a - b, "reward": 3}

    elif grade == 2:
        # VA SOL 2.CE: Add/subtract within 100, place value, skip counting
        kind = random.choice(["add", "sub", "add2", "sub2", "skip"])
        if kind == "add":
            a = random.randint(10, 60)
            b = random.randint(1, 99 - a)
            return {"text": f"{a} + {b}", "answer": a + b, "reward": 5}
        elif kind == "sub":
            a = random.randint(20, 99)
            b = random.randint(1, a)
            return {"text": f"{a} - {b}", "answer": a - b, "reward": 5}
        elif kind == "add2":
            # Two-digit + two-digit within 100
            a = random.randint(10, 50)
            b = random.randint(10, 99 - a)
            return {"text": f"{a} + {b}", "answer": a + b, "reward": 5}
        elif kind == "sub2":
            a = random.randint(30, 99)
            b = random.randint(10, a - 1)
            return {"text": f"{a} - {b}", "answer": a - b, "reward": 5}
        else:
            # Skip counting (intro to multiplication)
            step = random.choice([2, 5, 10])
            count = random.randint(2, 6)
            return {"text": f"{step} × {count}", "answer": step * count, "reward": 6}

    elif grade == 3:
        # VA SOL 3.CE.1: Add/sub to 1000; 3.CE.2: Multiply/divide facts through 10×10
        kind = random.choice(["mul", "mul", "div", "add", "sub"])
        if kind == "mul":
            a = random.randint(2, 10)
            b = random.randint(2, 10)
            return {"text": f"{a} × {b}", "answer": a * b, "reward": 8}
        elif kind == "div":
            b = random.randint(2, 10)
            answer = random.randint(1, 10)
            a = b * answer
            return {"text": f"{a} ÷ {b}", "answer": answer, "reward": 8}
        elif kind == "add":
            a = random.randint(100, 600)
            b = random.randint(10, 999 - a)
            return {"text": f"{a} + {b}", "answer": a + b, "reward": 7}
        else:
            a = random.randint(100, 999)
            b = random.randint(10, a)
            return {"text": f"{a} - {b}", "answer": a - b, "reward": 7}

    elif grade == 4:
        # VA SOL 4.CE.2: Facts through 12×12, multi-digit ×, ÷ with 1-digit divisor
        kind = random.choice(["mul12", "mul_multi", "div", "add"])
        if kind == "mul12":
            a = random.randint(2, 12)
            b = random.randint(2, 12)
            return {"text": f"{a} × {b}", "answer": a * b, "reward": 10}
        elif kind == "mul_multi":
            # 2-digit × 1-digit or 3-digit × 1-digit
            if random.random() < 0.5:
                a = random.randint(11, 99)
                b = random.randint(2, 9)
            else:
                a = random.randint(100, 300)
                b = random.randint(2, 5)
            return {"text": f"{a} × {b}", "answer": a * b, "reward": 12}
        elif kind == "div":
            b = random.randint(2, 9)
            answer = random.randint(10, 99)
            a = b * answer
            return {"text": f"{a} ÷ {b}", "answer": answer, "reward": 12}
        else:
            a = random.randint(500, 5000)
            b = random.randint(100, 5000)
            return {"text": f"{a} + {b}", "answer": a + b, "reward": 10}

    elif grade == 5:
        # VA SOL 5.CE.1: Multi-digit ops; 5.CE.4: Order of operations with parentheses
        kind = random.choice(["ooo", "ooo", "mul", "div", "frac"])
        if kind == "ooo":
            # Order of operations (up to 5 numbers, one set of parentheses)
            variant = random.choice(["paren_add", "paren_mul", "no_paren"])
            if variant == "paren_add":
                a = random.randint(2, 12)
                b = random.randint(2, 12)
                c = random.randint(2, 8)
                return {"text": f"({a} + {b}) × {c}", "answer": (a + b) * c, "reward": 15}
            elif variant == "paren_mul":
                a = random.randint(2, 10)
                b = random.randint(2, 10)
                c = random.randint(1, 15)
                return {"text": f"{c} + {a} × {b}", "answer": c + a * b, "reward": 15}
            else:
                a = random.randint(2, 20)
                b = random.randint(2, 8)
                c = random.randint(1, 10)
                return {"text": f"{a} + {b} × {c}", "answer": a + b * c, "reward": 15}
        elif kind == "mul":
            # 2-digit × 2-digit
            a = random.randint(11, 50)
            b = random.randint(11, 30)
            return {"text": f"{a} × {b}", "answer": a * b, "reward": 15}
        elif kind == "div":
            # 2-digit divisor
            b = random.randint(11, 25)
            answer = random.randint(5, 40)
            a = b * answer
            return {"text": f"{a} ÷ {b}", "answer": answer, "reward": 15}
        else:
            # Fraction of a whole number (5.CE.2)
            denom = random.choice([2, 3, 4, 5, 6])
            whole = denom * random.randint(2, 12)
            numer = random.randint(1, denom - 1)
            answer = (numer * whole) // denom
            return {"text": f"{numer}/{denom} of {whole}", "answer": answer, "reward": 15}

    elif grade == 6:
        # VA SOL 6.CE.2: Integer operations; 6.NS.3: Exponents and perfect squares
        kind = random.choice(["int_add", "int_sub", "int_mul", "exp", "square"])
        if kind == "int_add":
            a = random.randint(-20, 20)
            b = random.randint(-20, 20)
            if a >= 0 and b >= 0:
                a = -a if a > 0 else -random.randint(1, 20)
            return {"text": f"({a}) + ({b})", "answer": a + b, "reward": 18}
        elif kind == "int_sub":
            a = random.randint(-15, 15)
            b = random.randint(-15, 15)
            return {"text": f"({a}) - ({b})", "answer": a - b, "reward": 18}
        elif kind == "int_mul":
            a = random.randint(-10, -2)
            b = random.randint(2, 10)
            if random.random() < 0.5:
                a, b = b, a
            return {"text": f"({a}) × ({b})", "answer": a * b, "reward": 18}
        elif kind == "exp":
            base = random.randint(2, 10)
            exp = random.choice([2, 3])
            sym = "²" if exp == 2 else "³"
            return {"text": f"{base}{sym}", "answer": base ** exp, "reward": 20}
        else:
            # Perfect squares
            n = random.randint(2, 15)
            return {"text": f"√{n * n}", "answer": n, "reward": 18}

    elif grade == 7:
        # VA SOL 7.CE: Rational number ops, proportions, percentages, two-step equations
        kind = random.choice(["pct", "pct", "equation", "sqrt", "proportion"])
        if kind == "pct":
            pct = random.choice([10, 15, 20, 25, 30, 40, 50, 75])
            num = random.choice([40, 60, 80, 100, 120, 160, 200, 300, 500])
            answer = pct * num // 100
            if answer == int(answer) and answer > 0:
                return {"text": f"{pct}% of {num}", "answer": int(answer), "reward": 22}
            # Fallback to simpler percent
            pct = random.choice([10, 20, 25, 50])
            num = random.choice([40, 60, 80, 100, 200])
            return {"text": f"{pct}% of {num}", "answer": pct * num // 100, "reward": 22}
        elif kind == "equation":
            # Two-step equation: ax + b = c, solve for x
            a = random.randint(2, 8)
            x = random.randint(1, 15)
            b = random.randint(1, 20)
            c = a * x + b
            return {"text": f"{a}x + {b} = {c}, x = ?", "answer": x, "reward": 25}
        elif kind == "sqrt":
            # Square roots of perfect squares 0-400
            n = random.randint(2, 20)
            return {"text": f"√{n * n}", "answer": n, "reward": 22}
        else:
            # Simple proportion: if 3 items cost 12, how much do 7 cost?
            unit = random.randint(2, 8)
            count1 = random.randint(2, 5)
            count2 = random.randint(6, 12)
            total1 = unit * count1
            answer = unit * count2
            return {"text": f"If {count1} items cost {total1}, what do {count2} cost?",
                    "answer": answer, "reward": 22}

    else:  # grade 8
        # VA SOL 8.CE: Expressions with exponents, order of ops, multi-step, scientific notation
        kind = random.choice(["expr", "expr", "pct_adv", "multi", "power"])
        if kind == "expr":
            # Expressions with exponents and order of operations
            variant = random.choice(["exp_add", "exp_sub", "paren_exp"])
            if variant == "exp_add":
                base = random.randint(2, 6)
                exp = 2
                c = random.randint(1, 20)
                return {"text": f"{base}² + {c}", "answer": base ** 2 + c, "reward": 25}
            elif variant == "exp_sub":
                base = random.randint(2, 8)
                c = random.randint(1, base ** 2 - 1)
                return {"text": f"{base}² - {c}", "answer": base ** 2 - c, "reward": 25}
            else:
                a = random.randint(2, 5)
                b = random.randint(2, 5)
                c = random.randint(1, 10)
                return {"text": f"({a} + {b})² - {c}", "answer": (a + b) ** 2 - c, "reward": 28}
        elif kind == "pct_adv":
            # Advanced percent: find original, tax/tip problems
            pct = random.choice([5, 8, 10, 15, 20])
            price = random.choice([20, 40, 50, 60, 80, 100, 200])
            tip = pct * price // 100
            total = price + tip
            return {"text": f"${price} + {pct}% tip = ?", "answer": total, "reward": 28}
        elif kind == "multi":
            # Multi-step with rational numbers
            a = random.randint(2, 10)
            b = random.randint(2, 10)
            c = random.randint(2, 10)
            d = random.randint(2, 10)
            return {"text": f"{a} × {b} + {c} × {d}", "answer": a * b + c * d, "reward": 25}
        else:
            # Powers and roots combined
            base = random.randint(2, 5)
            exp = random.choice([2, 3])
            sym = "²" if exp == 2 else "³"
            mult = random.randint(2, 5)
            return {"text": f"{mult} × {base}{sym}", "answer": mult * base ** exp, "reward": 28}
