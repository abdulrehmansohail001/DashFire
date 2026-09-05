export const GRID_COLS = 16;
export const GRID_ROWS = 1;
export const CELL_WIDTH = 226;
export const CELL_HEIGHT = 176;

export const FRAMES = {
  idle: { indices: [0, 1, 2, 3], fps: 4 },      // sitting, blink variations
  fly: { indices: [4, 5, 6, 7], fps: 10 },      // wing flap cycle
  land: { indices: [8, 9], fps: 6 },            // wing folding -> settling
  point: { indices: [13, 15], fps: 3 },         // holding pen, gesturing
};

export const SHEET_SRC = '/sprites/mascot_bird.png';
export const PERCH_POSITION = { left: 32, bottom: 32 };
export const RENDER_WIDTH = 96;
export const RENDER_HEIGHT = (CELL_HEIGHT / CELL_WIDTH) * RENDER_WIDTH;
