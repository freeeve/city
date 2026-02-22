"""Tests for generate_assets.py - building image generation."""

import os
import unittest
from PIL import Image
from shared import BUILDING_ORDER

ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")

EXPECTED_FILES = {
    "Lemonade Stand": "lemonade_stand.png",
    "Ice Cream Truck": "ice_cream_truck.png",
    "Cookie Shop": "cookie_shop.png",
    "Pet Shop": "pet_shop.png",
    "Toy Store": "toy_store.png",
    "Movie Theater": "movie_theater.png",
    "Arcade": "arcade.png",
    "Water Park": "water_park.png",
    "Theme Park": "theme_park.png",
    "Space Station": "space_station.png",
}


class TestAssets(unittest.TestCase):
    def test_all_buildings_have_images(self):
        for name in BUILDING_ORDER:
            self.assertIn(name, EXPECTED_FILES)
            path = os.path.join(ASSETS_DIR, EXPECTED_FILES[name])
            self.assertTrue(os.path.exists(path), f"Missing image for {name}: {path}")

    def test_images_are_valid_pngs(self):
        for name, filename in EXPECTED_FILES.items():
            path = os.path.join(ASSETS_DIR, filename)
            img = Image.open(path)
            self.assertEqual(img.format, "PNG")

    def test_images_are_360x360(self):
        for name, filename in EXPECTED_FILES.items():
            path = os.path.join(ASSETS_DIR, filename)
            img = Image.open(path)
            self.assertEqual(img.size, (360, 360), f"{name} image should be 360x360")

    def test_images_have_alpha_channel(self):
        for name, filename in EXPECTED_FILES.items():
            path = os.path.join(ASSETS_DIR, filename)
            img = Image.open(path)
            self.assertEqual(img.mode, "RGBA", f"{name} image should have alpha channel")


if __name__ == "__main__":
    unittest.main()
