// Gunma World Map - 50x50 overworld with deterministic layout
Game.Maps = Game.Maps || {};
Game.Maps.gunma_world = (function() {
  var W = 50, H = 50;
  // 0=grass, 1=road, 2=water, 3=wall, 4=tree, 8=door

  // Initialize all as grass
  var tiles = [];
  for (var y = 0; y < H; y++) {
    var row = [];
    for (var x = 0; x < W; x++) {
      row.push(0);
    }
    tiles.push(row);
  }

  // Border walls (mountains)
  for (var x = 0; x < W; x++) { tiles[0][x] = 3; tiles[H-1][x] = 3; }
  for (var y = 0; y < H; y++) { tiles[y][0] = 3; tiles[y][W-1] = 3; }

  // Mountain ranges (top-left highlands)
  for (var y = 2; y < 8; y++) {
    for (var x = 2; x < 8; x++) {
      if ((x + y) % 3 !== 0) tiles[y][x] = 3;
    }
  }

  // Rivers (利根川 - central vertical, 渡良瀬川 - southeast diagonal)
  for (var y = 3; y < 45; y++) {
    var rx = 24 + Math.floor(Math.sin(y * 0.3) * 2);
    if (rx >= 0 && rx < W) tiles[y][rx] = 2;
    if (rx + 1 < W) tiles[y][rx + 1] = 2;
  }
  for (var i = 0; i < 20; i++) {
    var rx2 = 30 + i;
    var ry2 = 30 + i;
    if (rx2 < W - 1 && ry2 < H - 1) {
      tiles[ry2][rx2] = 2;
    }
  }

  // Forests (deterministic placement based on coordinates)
  for (var y = 1; y < H - 1; y++) {
    for (var x = 1; x < W - 1; x++) {
      if (tiles[y][x] !== 0) continue; // skip non-grass
      // Deterministic "random" based on position
      var hash = ((x * 7 + y * 13 + x * y) % 17);
      if (hash < 3) tiles[y][x] = 4; // ~18% trees
    }
  }

  // Town/location data
  var townLocs = [
    { id: 'maebashi',  x: 25, y: 25, label: '前橋' },
    { id: 'takasaki',  x: 20, y: 28, label: '高崎' },
    { id: 'tomioka',   x: 15, y: 35, label: '富岡' },
    { id: 'shimonita', x: 10, y: 38, label: '下仁田' },
    { id: 'ikaho',     x: 22, y: 18, label: '伊香保' },
    { id: 'kusatsu',   x: 12, y: 10, label: '草津' },
    { id: 'tsumagoi',  x: 8,  y: 15, label: '嬬恋' },
    { id: 'haruna',    x: 18, y: 15, label: '榛名' },
    { id: 'minakami',  x: 25, y: 5,  label: '水上' },
    { id: 'gakuen',    x: 30, y: 22, label: '学園' },
    { id: 'kentyou',   x: 26, y: 27, label: '県庁' }
  ];

  var npcs = [];
  var exits = [];

  // Clear area around each town and place entrance tiles
  for (var i = 0; i < townLocs.length; i++) {
    var loc = townLocs[i];
    // Clear a 3x3 area of road around each town
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        var cy = loc.y + dy;
        var cx = loc.x + dx;
        if (cy > 0 && cy < H - 1 && cx > 0 && cx < W - 1) {
          tiles[cy][cx] = 1; // road
        }
      }
    }
    // Town entrance icon
    tiles[loc.y][loc.x] = 8; // door

    // Exit definition
    exits.push({
      x: loc.x, y: loc.y,
      target: loc.id,
      spawnX: 14, spawnY: 10,
      dir: 'down'
    });

    // Town label NPC (invisible signpost)
    npcs.push({
      id: 'sign_' + loc.id,
      x: loc.x, y: loc.y - 1,
      name: loc.label,
      dialog: [loc.label + 'への入り口だ。'],
      sprite: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
        [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1: '#8b6914', 2: '#c4a66a' }
    });
  }

  // Connect towns with road paths (simple horizontal/vertical)
  function roadBetween(x1, y1, x2, y2) {
    // Horizontal first, then vertical
    var cx = x1, cy = y1;
    while (cx !== x2) {
      if (tiles[cy][cx] === 0 || tiles[cy][cx] === 4) tiles[cy][cx] = 1;
      cx += (x2 > cx) ? 1 : -1;
    }
    while (cy !== y2) {
      if (tiles[cy][cx] === 0 || tiles[cy][cx] === 4) tiles[cy][cx] = 1;
      cy += (y2 > cy) ? 1 : -1;
    }
  }

  // Main roads connecting towns
  roadBetween(25, 25, 20, 28); // maebashi → takasaki
  roadBetween(20, 28, 15, 35); // takasaki → tomioka
  roadBetween(15, 35, 10, 38); // tomioka → shimonita
  roadBetween(25, 25, 22, 18); // maebashi → ikaho
  roadBetween(22, 18, 18, 15); // ikaho → haruna
  roadBetween(18, 15, 12, 10); // haruna → kusatsu
  roadBetween(12, 10, 8, 15);  // kusatsu → tsumagoi
  roadBetween(25, 25, 25, 5);  // maebashi → minakami (north road)
  roadBetween(25, 25, 30, 22); // maebashi → gakuen
  roadBetween(25, 25, 26, 27); // maebashi → kentyou

  return {
    name: '群馬の地',
    mapType: 'world',
    tiles: tiles,
    npcs: npcs,
    items: [],
    exits: exits
  };
})();
