// Game configuration constants
var Game = window.Game || {};

Game.Config = {
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 320,
  TILE_SIZE: 16,
  MAP_COLS: 30,
  MAP_ROWS: 20,
  SCALE: 1,

  // Tile types
  TILE: {
    GRASS: 0,
    ROAD: 1,
    WATER: 2,
    WALL: 3,
    TREE: 4,
    ONSEN: 5,
    FIELD: 6,
    BORDER: 7,
    DOOR: 8,
    FLOOR: 9
  },

  // Tile colors
  TILE_COLORS: {
    0: '#4a8c3f',  // grass
    1: '#c4a66a',  // road
    2: '#3366aa',  // water
    3: '#555555',  // wall
    4: '#2d5a1e',  // tree
    5: '#88ccee',  // onsen
    6: '#6eb854',  // field
    7: '#cc3333',  // border
    8: '#8b6914',  // door
    9: '#9e8b72'   // floor
  },

  // Passable tiles
  PASSABLE: [0, 1, 5, 6, 8, 9],

  // Game states
  STATE: {
    TITLE: 'title',
    EXPLORING: 'exploring',
    DIALOG: 'dialog',
    BATTLE: 'battle',
    PUZZLE: 'puzzle',
    MENU: 'menu',
    TRANSITION: 'transition',
    SHOP: 'shop',
    SAVE: 'save',
    EVENT: 'event',
    ENDING: 'ending',
    GAMEOVER: 'gameover'
  },

  // Colors
  COLORS: {
    BLACK: '#000000',
    WHITE: '#ffffff',
    DIALOG_BG: 'rgba(0, 0, 40, 0.9)',
    MENU_BG: 'rgba(0, 0, 40, 0.95)',
    HP_GREEN: '#44cc44',
    HP_RED: '#cc4444',
    GOLD: '#ffcc00',
    HIGHLIGHT: '#ffff88'
  }
};
