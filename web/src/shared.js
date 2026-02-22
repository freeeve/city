// Port of shared.py — buildings, cars, unlock requirements, math problems

export const BUILDINGS = {
  "Lemonade Stand": { cost: 10, income: 1 },
  "Ice Cream Truck": { cost: 25, income: 2 },
  "Cookie Shop": { cost: 50, income: 5 },
  "Flower Shop": { cost: 75, income: 7 },
  "Pet Shop": { cost: 100, income: 10 },
  "Bakery": { cost: 150, income: 15 },
  "Toy Store": { cost: 200, income: 20 },
  "Bookstore": { cost: 275, income: 25 },
  "Movie Theater": { cost: 350, income: 35 },
  "Pizza Place": { cost: 425, income: 40 },
  "Arcade": { cost: 500, income: 50 },
  "Gym": { cost: 650, income: 60 },
  "Hospital": { cost: 800, income: 75 },
  "Water Park": { cost: 1000, income: 100 },
  "Library": { cost: 1200, income: 110 },
  "Museum": { cost: 1500, income: 140 },
  "Theme Park": { cost: 2000, income: 200 },
  "Stadium": { cost: 3000, income: 300 },
  "Airport": { cost: 4000, income: 400 },
  "Space Station": { cost: 5000, income: 500 },
  "Underwater Base": { cost: 7000, income: 650 },
  "Sky Castle": { cost: 9000, income: 800 },
  "Robot Factory": { cost: 12000, income: 1000 },
  "Volcano Lair": { cost: 15000, income: 1200 },
  "Crystal Palace": { cost: 20000, income: 1500 },
  "Time Machine": { cost: 25000, income: 1800 },
  "Dragon Tower": { cost: 35000, income: 2500 },
  "Moon Colony": { cost: 50000, income: 3500 },
  "Galactic Hub": { cost: 75000, income: 5000 },
  "Dyson Sphere": { cost: 100000, income: 7500 },
  "Quantum Computer": { cost: 250000, income: 15000 },
  "Terraformer": { cost: 500000, income: 25000 },
  "Star Forge": { cost: 1000000, income: 50000 },
  "Antimatter Plant": { cost: 2500000, income: 100000 },
  "Warp Gate": { cost: 5000000, income: 200000 },
  "Planet Engine": { cost: 10000000, income: 400000 },
  "Galaxy Brain": { cost: 25000000, income: 800000 },
  "Universe Simulator": { cost: 50000000, income: 1500000 },
  "Multiverse Portal": { cost: 100000000, income: 3000000 },
  "Reality Engine": { cost: 250000000, income: 6000000 },
  "Cosmic Citadel": { cost: 500000000, income: 10000000 },
  "Infinity Tower": { cost: 1000000000, income: 20000000 },
  "Omega Station": { cost: 2500000000, income: 50000000 },
  "Big Bang Lab": { cost: 5000000000, income: 100000000 },
};

export const BUILDING_ORDER = [
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
];

export const BUILDING_COLORS = {
  "Lemonade Stand": [255, 230, 50],
  "Ice Cream Truck": [255, 180, 200],
  "Cookie Shop": [210, 140, 70],
  "Flower Shop": [240, 130, 180],
  "Pet Shop": [160, 210, 120],
  "Bakery": [230, 190, 130],
  "Toy Store": [100, 200, 255],
  "Bookstore": [140, 110, 80],
  "Movie Theater": [80, 80, 120],
  "Pizza Place": [220, 80, 40],
  "Arcade": [200, 100, 255],
  "Gym": [70, 70, 70],
  "Hospital": [240, 240, 250],
  "Water Park": [60, 180, 220],
  "Library": [160, 130, 100],
  "Museum": [200, 190, 170],
  "Theme Park": [255, 100, 130],
  "Stadium": [90, 140, 60],
  "Airport": [180, 195, 210],
  "Space Station": [180, 200, 220],
  "Underwater Base": [30, 120, 160],
  "Sky Castle": [200, 220, 255],
  "Robot Factory": [140, 150, 160],
  "Volcano Lair": [180, 50, 20],
  "Crystal Palace": [220, 200, 255],
  "Time Machine": [100, 200, 180],
  "Dragon Tower": [160, 40, 60],
  "Moon Colony": [210, 210, 200],
  "Galactic Hub": [80, 60, 140],
  "Dyson Sphere": [255, 200, 50],
  "Quantum Computer": [0, 200, 220],
  "Terraformer": [60, 180, 100],
  "Star Forge": [255, 120, 30],
  "Antimatter Plant": [180, 0, 200],
  "Warp Gate": [100, 80, 255],
  "Planet Engine": [200, 100, 60],
  "Galaxy Brain": [255, 100, 200],
  "Universe Simulator": [30, 30, 80],
  "Multiverse Portal": [200, 50, 255],
  "Reality Engine": [255, 255, 200],
  "Cosmic Citadel": [80, 50, 120],
  "Infinity Tower": [255, 220, 100],
  "Omega Station": [150, 220, 255],
  "Big Bang Lab": [255, 60, 60],
};

export const CARS = {
  "Bicycle": { cost: 15, population: 1, color: [100, 180, 220] },
  "Scooter": { cost: 40, population: 2, color: [220, 100, 100] },
  "Sedan": { cost: 80, population: 5, color: [70, 130, 200] },
  "Taxi": { cost: 150, population: 8, color: [255, 210, 50] },
  "Bus": { cost: 300, population: 20, color: [60, 160, 80] },
  "Sports Car": { cost: 600, population: 15, color: [220, 40, 40] },
  "Fire Truck": { cost: 1000, population: 25, color: [200, 30, 30] },
  "Ice Cream Van": { cost: 1500, population: 30, color: [255, 200, 220] },
  "Helicopter": { cost: 5000, population: 50, color: [40, 120, 180] },
  "Yacht": { cost: 15000, population: 80, color: [240, 240, 255] },
  "Jet": { cost: 50000, population: 150, color: [200, 200, 210] },
  "Submarine": { cost: 150000, population: 250, color: [60, 100, 140] },
  "Rocket": { cost: 500000, population: 500, color: [220, 80, 60] },
  "UFO": { cost: 2000000, population: 1000, color: [140, 255, 140] },
  "Teleporter": { cost: 10000000, population: 2500, color: [180, 100, 255] },
  "Time Ship": { cost: 50000000, population: 5000, color: [100, 200, 255] },
};

export const CAR_ORDER = [
  "Bicycle", "Scooter", "Sedan", "Taxi", "Bus", "Sports Car",
  "Fire Truck", "Ice Cream Van", "Helicopter", "Yacht", "Jet",
  "Submarine", "Rocket", "UFO", "Teleporter", "Time Ship",
];

export const BUILDING_POPULATION = {
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
};

export const UNLOCK_REQUIREMENTS = {
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
};

export const GRADE_LABELS = {
  1: "Add & Subtract to 20",
  2: "Add & Subtract to 100",
  3: "Multiply & Divide to 10×10",
  4: "Multi-Digit × and ÷",
  5: "Order of Operations",
  6: "Integers & Exponents",
  7: "Proportions & Equations",
  8: "Expressions & Percents",
};

// Map building names to PNG asset keys (only these have images)
export const BUILDING_IMAGES = {
  "Lemonade Stand": "lemonade_stand",
  "Ice Cream Truck": "ice_cream_truck",
  "Cookie Shop": "cookie_shop",
  "Pet Shop": "pet_shop",
  "Toy Store": "toy_store",
  "Movie Theater": "movie_theater",
  "Arcade": "arcade",
  "Water Park": "water_park",
  "Theme Park": "theme_park",
  "Space Station": "space_station",
};

export function generateProblem(grade = 3) {
  grade = Math.max(1, Math.min(8, grade));
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (grade === 1) {
    const kind = choice(["add", "add", "sub", "add10", "sub10"]);
    if (kind === "add10") {
      const a = rand(1, 9);
      const b = rand(1, 10 - a);
      return { text: `${a} + ${b}`, answer: a + b, reward: 3 };
    } else if (kind === "sub10") {
      const a = rand(2, 10);
      const b = rand(1, a);
      return { text: `${a} - ${b}`, answer: a - b, reward: 3 };
    } else if (kind === "add") {
      const a = rand(1, 15);
      const b = rand(1, 20 - a);
      return { text: `${a} + ${b}`, answer: a + b, reward: 3 };
    } else {
      const a = rand(3, 20);
      const b = rand(1, a);
      return { text: `${a} - ${b}`, answer: a - b, reward: 3 };
    }
  } else if (grade === 2) {
    const kind = choice(["add", "sub", "add2", "sub2", "skip"]);
    if (kind === "add") {
      const a = rand(10, 60);
      const b = rand(1, 99 - a);
      return { text: `${a} + ${b}`, answer: a + b, reward: 5 };
    } else if (kind === "sub") {
      const a = rand(20, 99);
      const b = rand(1, a);
      return { text: `${a} - ${b}`, answer: a - b, reward: 5 };
    } else if (kind === "add2") {
      const a = rand(10, 50);
      const b = rand(10, 99 - a);
      return { text: `${a} + ${b}`, answer: a + b, reward: 5 };
    } else if (kind === "sub2") {
      const a = rand(30, 99);
      const b = rand(10, a - 1);
      return { text: `${a} - ${b}`, answer: a - b, reward: 5 };
    } else {
      const step = choice([2, 5, 10]);
      const count = rand(2, 6);
      return { text: `${step} × ${count}`, answer: step * count, reward: 6 };
    }
  } else if (grade === 3) {
    const kind = choice(["mul", "mul", "div", "add", "sub"]);
    if (kind === "mul") {
      const a = rand(2, 10);
      const b = rand(2, 10);
      return { text: `${a} × ${b}`, answer: a * b, reward: 8 };
    } else if (kind === "div") {
      const b = rand(2, 10);
      const answer = rand(1, 10);
      const a = b * answer;
      return { text: `${a} ÷ ${b}`, answer, reward: 8 };
    } else if (kind === "add") {
      const a = rand(100, 600);
      const b = rand(10, 999 - a);
      return { text: `${a} + ${b}`, answer: a + b, reward: 7 };
    } else {
      const a = rand(100, 999);
      const b = rand(10, a);
      return { text: `${a} - ${b}`, answer: a - b, reward: 7 };
    }
  } else if (grade === 4) {
    const kind = choice(["mul12", "mul_multi", "div", "add"]);
    if (kind === "mul12") {
      const a = rand(2, 12);
      const b = rand(2, 12);
      return { text: `${a} × ${b}`, answer: a * b, reward: 10 };
    } else if (kind === "mul_multi") {
      let a, b;
      if (Math.random() < 0.5) {
        a = rand(11, 99); b = rand(2, 9);
      } else {
        a = rand(100, 300); b = rand(2, 5);
      }
      return { text: `${a} × ${b}`, answer: a * b, reward: 12 };
    } else if (kind === "div") {
      const b = rand(2, 9);
      const answer = rand(10, 99);
      const a = b * answer;
      return { text: `${a} ÷ ${b}`, answer, reward: 12 };
    } else {
      const a = rand(500, 5000);
      const b = rand(100, 5000);
      return { text: `${a} + ${b}`, answer: a + b, reward: 10 };
    }
  } else if (grade === 5) {
    const kind = choice(["ooo", "ooo", "mul", "div", "frac"]);
    if (kind === "ooo") {
      const variant = choice(["paren_add", "paren_mul", "no_paren"]);
      if (variant === "paren_add") {
        const a = rand(2, 12), b = rand(2, 12), c = rand(2, 8);
        return { text: `(${a} + ${b}) × ${c}`, answer: (a + b) * c, reward: 15 };
      } else if (variant === "paren_mul") {
        const a = rand(2, 10), b = rand(2, 10), c = rand(1, 15);
        return { text: `${c} + ${a} × ${b}`, answer: c + a * b, reward: 15 };
      } else {
        const a = rand(2, 20), b = rand(2, 8), c = rand(1, 10);
        return { text: `${a} + ${b} × ${c}`, answer: a + b * c, reward: 15 };
      }
    } else if (kind === "mul") {
      const a = rand(11, 50), b = rand(11, 30);
      return { text: `${a} × ${b}`, answer: a * b, reward: 15 };
    } else if (kind === "div") {
      const b = rand(11, 25);
      const answer = rand(5, 40);
      const a = b * answer;
      return { text: `${a} ÷ ${b}`, answer, reward: 15 };
    } else {
      const denom = choice([2, 3, 4, 5, 6]);
      const whole = denom * rand(2, 12);
      const numer = rand(1, denom - 1);
      const answer = Math.floor((numer * whole) / denom);
      return { text: `${numer}/${denom} of ${whole}`, answer, reward: 15 };
    }
  } else if (grade === 6) {
    const kind = choice(["int_add", "int_sub", "int_mul", "exp", "square"]);
    if (kind === "int_add") {
      let a = rand(-20, 20), b = rand(-20, 20);
      if (a >= 0 && b >= 0) a = a > 0 ? -a : -rand(1, 20);
      return { text: `(${a}) + (${b})`, answer: a + b, reward: 18 };
    } else if (kind === "int_sub") {
      const a = rand(-15, 15), b = rand(-15, 15);
      return { text: `(${a}) - (${b})`, answer: a - b, reward: 18 };
    } else if (kind === "int_mul") {
      let a = rand(-10, -2), b = rand(2, 10);
      if (Math.random() < 0.5) [a, b] = [b, a];
      return { text: `(${a}) × (${b})`, answer: a * b, reward: 18 };
    } else if (kind === "exp") {
      const base = rand(2, 10);
      const exp = choice([2, 3]);
      const sym = exp === 2 ? "\u00B2" : "\u00B3";
      return { text: `${base}${sym}`, answer: Math.pow(base, exp), reward: 20 };
    } else {
      const n = rand(2, 15);
      return { text: `\u221A${n * n}`, answer: n, reward: 18 };
    }
  } else if (grade === 7) {
    const kind = choice(["pct", "pct", "equation", "sqrt", "proportion"]);
    if (kind === "pct") {
      let pct = choice([10, 15, 20, 25, 30, 40, 50, 75]);
      let num = choice([40, 60, 80, 100, 120, 160, 200, 300, 500]);
      let answer = Math.floor(pct * num / 100);
      if (answer !== pct * num / 100 || answer <= 0) {
        pct = choice([10, 20, 25, 50]);
        num = choice([40, 60, 80, 100, 200]);
        answer = Math.floor(pct * num / 100);
      }
      return { text: `${pct}% of ${num}`, answer, reward: 22 };
    } else if (kind === "equation") {
      const a = rand(2, 8), x = rand(1, 15), b = rand(1, 20);
      const c = a * x + b;
      return { text: `${a}x + ${b} = ${c}, x = ?`, answer: x, reward: 25 };
    } else if (kind === "sqrt") {
      const n = rand(2, 20);
      return { text: `\u221A${n * n}`, answer: n, reward: 22 };
    } else {
      const unit = rand(2, 8), count1 = rand(2, 5), count2 = rand(6, 12);
      const total1 = unit * count1;
      const answer = unit * count2;
      return { text: `If ${count1} items cost ${total1}, what do ${count2} cost?`, answer, reward: 22 };
    }
  } else {
    const kind = choice(["expr", "expr", "pct_adv", "multi", "power"]);
    if (kind === "expr") {
      const variant = choice(["exp_add", "exp_sub", "paren_exp"]);
      if (variant === "exp_add") {
        const base = rand(2, 6), c = rand(1, 20);
        return { text: `${base}\u00B2 + ${c}`, answer: base * base + c, reward: 25 };
      } else if (variant === "exp_sub") {
        const base = rand(2, 8);
        const c = rand(1, base * base - 1);
        return { text: `${base}\u00B2 - ${c}`, answer: base * base - c, reward: 25 };
      } else {
        const a = rand(2, 5), b = rand(2, 5), c = rand(1, 10);
        return { text: `(${a} + ${b})\u00B2 - ${c}`, answer: (a + b) * (a + b) - c, reward: 28 };
      }
    } else if (kind === "pct_adv") {
      const pct = choice([5, 8, 10, 15, 20]);
      const price = choice([20, 40, 50, 60, 80, 100, 200]);
      const tip = Math.floor(pct * price / 100);
      const total = price + tip;
      return { text: `$${price} + ${pct}% tip = ?`, answer: total, reward: 28 };
    } else if (kind === "multi") {
      const a = rand(2, 10), b = rand(2, 10), c = rand(2, 10), d = rand(2, 10);
      return { text: `${a} × ${b} + ${c} × ${d}`, answer: a * b + c * d, reward: 25 };
    } else {
      const base = rand(2, 5);
      const exp = choice([2, 3]);
      const sym = exp === 2 ? "\u00B2" : "\u00B3";
      const mult = rand(2, 5);
      return { text: `${mult} × ${base}${sym}`, answer: mult * Math.pow(base, exp), reward: 28 };
    }
  }
}
