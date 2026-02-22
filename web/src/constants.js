// Layout
export const WIDTH = 1000;
export const HEIGHT = 750;
export const FPS = 30;

// Colors (hex)
export const WHITE = 0xffffff;
export const BLACK = 0x000000;
export const BG_TOP = 0xc8e1ff;
export const BG_BOT = 0xebf5ff;
export const HEADER_TOP = 0x2d64b4;
export const HEADER_BOT = 0x418cdc;
export const ACCENT = 0x3778c8;
export const COIN_GOLD = 0xffd23c;
export const COIN_DARK = 0xc8a01e;
export const GREEN = 0x3cbe5a;
export const GREEN_HOVER = 0x2da046;
export const RED = 0xdc4646;
export const RED_HOVER = 0xbe3232;
export const LIGHT_GRAY = 0xe1e1e6;
export const MID_GRAY = 0xa0a0aa;
export const DARK_GRAY = 0x5a5a64;
export const INPUT_BG = 0xfafaff;
export const INPUT_BORDER = 0xb4bed2;
export const INPUT_ACTIVE = 0x3778c8;
export const PURPLE = 0x8c50dc;
export const PURPLE_HOVER = 0x783cbe;
export const GOLD_BTN = 0xdcb428;
export const GOLD_BTN_HOVER = 0xbe9b1e;

// Town colors
export const GRASS_1 = 0x69b94b;
export const GRASS_2 = 0x73c355;
export const GRASS_3 = 0x5faf41;
export const ROAD_FILL = 0x8c8a84;
export const ROAD_EDGE = 0x737068;
export const ROAD_DASH = 0xc8c3b4;
export const SIDEWALK = 0xc3beb4;
export const TREE_TRUNK = 0x785532;
export const TREE_GREEN = 0x3c9637;
export const TREE_LIGHT = 0x50af46;
export const FENCE_COLOR = 0xa58c64;

// 3D oblique projection
export const DEPTH_PX = 20;
export const SIDE_DX = 10;
export const SIDE_DY = -10;

// Leaderboard medal colors
export const GOLD = 0xffc832;
export const SILVER = 0xbec3cd;
export const BRONZE = 0xcd965a;

// Town layout
export const ROAD_THICK = 36;
export const ROW_HEIGHT = 160;
export const PLOT_W = 120;
export const PLOT_H = 115;
export const PLOT_COLS = [10, 170, 380, 540, 750, 910];
export const ROAD_V_POSITIONS = [330, 700];
export const TOWN_WORLD_W = 1070;

// Town viewport
export const TOWN_X = 15;
export const TOWN_Y = 200;
export const TOWN_VIEW_W = 605;

// Helper to convert (r,g,b) tuple to hex
export function rgb(r, g, b) {
  return (r << 16) | (g << 8) | b;
}

// Format large numbers with K, M, B suffixes
export function formatNumber(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 10_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}
