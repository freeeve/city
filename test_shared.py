"""Tests for shared.py - building data and math problem generator."""

import unittest
from shared import (BUILDINGS, BUILDING_ORDER, BUILDING_COLORS,
                    CARS, CAR_ORDER, BUILDING_POPULATION, UNLOCK_REQUIREMENTS,
                    generate_problem)


class TestBuildingData(unittest.TestCase):
    def test_all_buildings_in_order(self):
        for name in BUILDING_ORDER:
            self.assertIn(name, BUILDINGS)

    def test_order_covers_all_buildings(self):
        self.assertEqual(set(BUILDING_ORDER), set(BUILDINGS.keys()))

    def test_all_buildings_have_colors(self):
        for name in BUILDINGS:
            self.assertIn(name, BUILDING_COLORS)

    def test_building_costs_are_positive(self):
        for name, (cost, income) in BUILDINGS.items():
            self.assertGreater(cost, 0, f"{name} cost should be positive")

    def test_building_incomes_are_positive(self):
        for name, (cost, income) in BUILDINGS.items():
            self.assertGreater(income, 0, f"{name} income should be positive")

    def test_buildings_cost_increases(self):
        costs = [BUILDINGS[name][0] for name in BUILDING_ORDER]
        for i in range(1, len(costs)):
            self.assertGreater(costs[i], costs[i - 1])

    def test_building_income_increases(self):
        incomes = [BUILDINGS[name][1] for name in BUILDING_ORDER]
        for i in range(1, len(incomes)):
            self.assertGreater(incomes[i], incomes[i - 1])

    def test_colors_are_rgb_tuples(self):
        for name, color in BUILDING_COLORS.items():
            self.assertEqual(len(color), 3)
            for c in color:
                self.assertGreaterEqual(c, 0)
                self.assertLessEqual(c, 255)


class TestCarData(unittest.TestCase):
    def test_all_cars_in_order(self):
        for name in CAR_ORDER:
            self.assertIn(name, CARS)

    def test_order_covers_all_cars(self):
        self.assertEqual(set(CAR_ORDER), set(CARS.keys()))

    def test_car_costs_are_positive(self):
        for name, (cost, pop_boost, color) in CARS.items():
            self.assertGreater(cost, 0, f"{name} cost should be positive")

    def test_car_pop_boost_positive(self):
        for name, (cost, pop_boost, color) in CARS.items():
            self.assertGreater(pop_boost, 0, f"{name} pop boost should be positive")

    def test_car_colors_are_rgb(self):
        for name, (cost, pop_boost, color) in CARS.items():
            self.assertEqual(len(color), 3)
            for c in color:
                self.assertGreaterEqual(c, 0)
                self.assertLessEqual(c, 255)


class TestBuildingPopulation(unittest.TestCase):
    def test_all_buildings_have_population(self):
        for name in BUILDINGS:
            self.assertIn(name, BUILDING_POPULATION, f"{name} missing from BUILDING_POPULATION")

    def test_population_values_positive(self):
        for name, pop in BUILDING_POPULATION.items():
            self.assertGreater(pop, 0, f"{name} population should be positive")


class TestUnlockRequirements(unittest.TestCase):
    def test_unlock_items_exist(self):
        for name in UNLOCK_REQUIREMENTS:
            self.assertTrue(name in BUILDINGS or name in CARS,
                            f"{name} in UNLOCK_REQUIREMENTS not found in BUILDINGS or CARS")

    def test_unlock_values_positive(self):
        for name, req in UNLOCK_REQUIREMENTS.items():
            self.assertGreater(req, 0)


class TestGenerateProblem(unittest.TestCase):
    def test_returns_required_keys(self):
        p = generate_problem()
        self.assertIn("text", p)
        self.assertIn("answer", p)
        self.assertIn("reward", p)

    def test_answer_is_int(self):
        for _ in range(50):
            p = generate_problem()
            self.assertIsInstance(p["answer"], int)

    def test_reward_is_positive(self):
        for _ in range(50):
            p = generate_problem()
            self.assertGreater(p["reward"], 0)

    def test_text_is_nonempty_string(self):
        for _ in range(50):
            p = generate_problem()
            self.assertIsInstance(p["text"], str)
            self.assertTrue(len(p["text"]) > 0)

    def test_addition_is_correct(self):
        for _ in range(100):
            p = generate_problem()
            if "+" in p["text"]:
                parts = p["text"].split("+")
                a, b = int(parts[0].strip()), int(parts[1].strip())
                self.assertEqual(p["answer"], a + b)

    def test_subtraction_is_correct(self):
        for _ in range(100):
            p = generate_problem()
            if "-" in p["text"]:
                parts = p["text"].split("-")
                a, b = int(parts[0].strip()), int(parts[1].strip())
                self.assertEqual(p["answer"], a - b)

    def test_subtraction_answer_not_negative(self):
        for _ in range(200):
            p = generate_problem()
            if "-" in p["text"]:
                self.assertGreaterEqual(p["answer"], 0)

    def test_multiplication_is_correct(self):
        for _ in range(100):
            p = generate_problem()
            if "×" in p["text"]:
                parts = p["text"].split("×")
                a, b = int(parts[0].strip()), int(parts[1].strip())
                self.assertEqual(p["answer"], a * b)

    def test_multiplication_reward_is_higher(self):
        for _ in range(100):
            p = generate_problem()
            if "×" in p["text"]:
                self.assertEqual(p["reward"], 10)
            else:
                self.assertEqual(p["reward"], 5)

    def test_generates_all_types(self):
        types = {"add": False, "sub": False, "mul": False}
        for _ in range(200):
            p = generate_problem()
            if "+" in p["text"]:
                types["add"] = True
            elif "-" in p["text"]:
                types["sub"] = True
            elif "×" in p["text"]:
                types["mul"] = True
        self.assertTrue(all(types.values()), f"Not all types generated: {types}")


if __name__ == "__main__":
    unittest.main()
