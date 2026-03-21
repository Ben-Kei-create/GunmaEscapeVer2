// Rendering system
Game.Renderer = (function() {
  var canvas, ctx;
  var cameraX = 0, cameraY = 0;

  function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  function clear(color) {
    ctx.fillStyle = color || '#000';
    ctx.fillRect(0, 0, Game.Config.CANVAS_WIDTH, Game.Config.CANVAS_HEIGHT);
  }

  function setCamera(x, y) {
    var ts = Game.Config.TILE_SIZE;
    var cw = Game.Config.CANVAS_WIDTH;
    var ch = Game.Config.CANVAS_HEIGHT;
    var mw = Game.Config.MAP_COLS * ts;
    var mh = Game.Config.MAP_ROWS * ts;

    cameraX = Math.max(0, Math.min(x - cw / 2, mw - cw));
    cameraY = Math.max(0, Math.min(y - ch / 2, mh - ch));
  }

  function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x - cameraX), Math.floor(y - cameraY), w, h);
  }

  function drawRectAbsolute(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawBorder(x, y, w, h, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 2;
    ctx.strokeRect(x, y, w, h);
  }

  function drawText(text, x, y, color, size, align) {
    ctx.fillStyle = color || '#fff';
    ctx.font = (size || 12) + 'px "Courier New", monospace';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  function drawTextJP(text, x, y, color, size, align) {
    ctx.fillStyle = color || '#fff';
    ctx.font = (size || 14) + 'px "Hiragino Kaku Gothic ProN", "Meiryo", "MS Gothic", sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  function drawSprite(spriteData, x, y, palette, flipped) {
    var px = Math.floor(x - cameraX);
    var py = Math.floor(y - cameraY);
    for (var row = 0; row < spriteData.length; row++) {
      for (var col = 0; col < spriteData[row].length; col++) {
        var colorIdx = spriteData[row][col];
        if (colorIdx === 0) continue; // transparent
        ctx.fillStyle = palette[colorIdx];
        var drawCol = flipped ? (spriteData[row].length - 1 - col) : col;
        ctx.fillRect(px + drawCol, py + row, 1, 1);
      }
    }
  }

  function drawSpriteAbsolute(spriteData, x, y, palette, scale) {
    scale = scale || 1;
    for (var row = 0; row < spriteData.length; row++) {
      for (var col = 0; col < spriteData[row].length; col++) {
        var colorIdx = spriteData[row][col];
        if (colorIdx === 0) continue;
        ctx.fillStyle = palette[colorIdx];
        ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
      }
    }
  }

  function drawTile(type, x, y) {
    var ts = Game.Config.TILE_SIZE;
    var px = Math.floor(x * ts - cameraX);
    var py = Math.floor(y * ts - cameraY);

    // Skip if off screen
    if (px + ts < 0 || px > Game.Config.CANVAS_WIDTH ||
        py + ts < 0 || py > Game.Config.CANVAS_HEIGHT) return;

    ctx.fillStyle = Game.Config.TILE_COLORS[type] || '#000';
    ctx.fillRect(px, py, ts, ts);

    // Tile decorations
    switch (type) {
      case Game.Config.TILE.TREE:
        // Tree top
        ctx.fillStyle = '#3d7a2e';
        ctx.fillRect(px + 3, py + 1, 10, 8);
        ctx.fillStyle = '#2d5a1e';
        ctx.fillRect(px + 5, py + 3, 6, 4);
        // Trunk
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(px + 6, py + 9, 4, 7);
        break;
      case Game.Config.TILE.WATER:
        // Wave lines
        ctx.fillStyle = '#4488cc';
        ctx.fillRect(px + 2, py + 4, 4, 1);
        ctx.fillRect(px + 9, py + 8, 5, 1);
        ctx.fillRect(px + 3, py + 12, 4, 1);
        break;
      case Game.Config.TILE.WALL:
        // Brick pattern
        ctx.fillStyle = '#666';
        ctx.fillRect(px, py + 4, ts, 1);
        ctx.fillRect(px, py + 9, ts, 1);
        ctx.fillRect(px, py + 14, ts, 1);
        ctx.fillRect(px + 8, py, 1, 4);
        ctx.fillRect(px + 4, py + 5, 1, 4);
        ctx.fillRect(px + 12, py + 10, 1, 4);
        break;
      case Game.Config.TILE.ONSEN:
        // Steam
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        var t = Date.now() / 500;
        ctx.fillRect(px + 4 + Math.sin(t) * 2, py + 2, 2, 3);
        ctx.fillRect(px + 9 + Math.sin(t + 1) * 2, py + 1, 2, 3);
        break;
      case Game.Config.TILE.FIELD:
        // Crop rows
        ctx.fillStyle = '#5a9e44';
        for (var i = 0; i < 4; i++) {
          ctx.fillRect(px + 1, py + i * 4 + 2, 14, 2);
        }
        break;
      case Game.Config.TILE.BORDER:
        // Dashed border line
        ctx.fillStyle = '#ff4444';
        for (var i = 0; i < 4; i++) {
          ctx.fillRect(px + i * 4, py + 7, 3, 2);
        }
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(px + 2, py + 1, 12, 5);
        drawText('!', px + 6, py + 0, '#cc0000', 8);
        break;
      case Game.Config.TILE.DOOR:
        ctx.fillStyle = '#a07828';
        ctx.fillRect(px + 3, py + 1, 10, 14);
        ctx.fillStyle = '#c4a030';
        ctx.fillRect(px + 9, py + 7, 2, 2);
        break;
    }
  }

  function drawDialogBox(x, y, w, h) {
    // Background
    ctx.fillStyle = Game.Config.COLORS.DIALOG_BG;
    ctx.fillRect(x, y, w, h);
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.strokeStyle = '#88aaff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  }

  function fadeOverlay(alpha) {
    ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    ctx.fillRect(0, 0, Game.Config.CANVAS_WIDTH, Game.Config.CANVAS_HEIGHT);
  }

  function getContext() {
    return ctx;
  }

  return {
    init: init,
    clear: clear,
    setCamera: setCamera,
    drawRect: drawRect,
    drawRectAbsolute: drawRectAbsolute,
    drawBorder: drawBorder,
    drawText: drawText,
    drawTextJP: drawTextJP,
    drawSprite: drawSprite,
    drawSpriteAbsolute: drawSpriteAbsolute,
    drawTile: drawTile,
    drawDialogBox: drawDialogBox,
    fadeOverlay: fadeOverlay,
    getContext: getContext
  };
})();
