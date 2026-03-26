// Rendering system with animated tiles and screen effects
Game.Renderer = (function() {
  var canvas, ctx;
  var cameraX = 0, cameraY = 0;
  var animFrame = 0;

  // Screen effects state
  var effects = {
    shake: { active: false, intensity: 0, timer: 0 },
    flash: { active: false, color: '#fff', timer: 0, maxTimer: 0 },
    fade: { active: false, alpha: 0, target: 0, speed: 0, callback: null },
    tint: { active: false, color: '#000', alpha: 0 }
  };

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
    
    var currentMap = (Game.Map && Game.Map.getCurrentMap) ? Game.Map.getCurrentMap() : null;
    var mapCols = currentMap ? currentMap.tiles[0].length : Game.Config.MAP_COLS;
    var mapRows = currentMap ? currentMap.tiles.length : Game.Config.MAP_ROWS;
    
    var mw = mapCols * ts;
    var mh = mapRows * ts;

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

    // Apply screen shake offset
    if (effects.shake.active) {
      px += (Math.random() - 0.5) * effects.shake.intensity;
      py += (Math.random() - 0.5) * effects.shake.intensity;
    }

    // Skip if off screen
    if (px + ts < 0 || px > Game.Config.CANVAS_WIDTH ||
        py + ts < 0 || py > Game.Config.CANVAS_HEIGHT) return;

    animFrame++;

    ctx.fillStyle = Game.Config.TILE_COLORS[type] || '#000';
    ctx.fillRect(px, py, ts, ts);

    // Tile decorations with animations
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
        // Animated water: alternate shades
        var waterPhase = Math.floor(animFrame / 30) % 2;
        ctx.fillStyle = waterPhase ? '#2255bb' : '#3366aa';
        ctx.fillRect(px, py, ts, ts);
        // Animated wave lines
        var waveOff = Math.sin(animFrame / 15 + x * 0.5) * 2;
        ctx.fillStyle = '#4488cc';
        ctx.fillRect(px + 2 + waveOff, py + 4, 4, 1);
        ctx.fillRect(px + 9 - waveOff, py + 8, 5, 1);
        ctx.fillRect(px + 3 + waveOff, py + 12, 4, 1);
        // Ripple highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        var ripX = ((animFrame / 10 + x * 3) % 14);
        ctx.fillRect(px + ripX, py + 6, 2, 1);
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
        // Animated onsen: pulse color
        var onsenPhase = Math.sin(animFrame / 20) * 0.5 + 0.5;
        var onR = Math.floor(0x88 + onsenPhase * 0x17);
        var onG = Math.floor(0xcc + onsenPhase * 0x11);
        ctx.fillStyle = 'rgb(' + onR + ',' + onG + ',238)';
        ctx.fillRect(px, py, ts, ts);
        // Rising steam particles
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        var t = animFrame / 30;
        ctx.fillRect(px + 4 + Math.sin(t + x) * 2, py + 2 - (animFrame % 10) * 0.3, 2, 3);
        ctx.fillRect(px + 9 + Math.sin(t + 1 + x) * 2, py + 1 - (animFrame % 12) * 0.3, 2, 3);
        if ((animFrame + x * 7) % 40 < 10) {
          ctx.fillRect(px + 7 + Math.sin(t + 2) * 1.5, py - 1, 1, 2);
        }
        break;
      case Game.Config.TILE.FIELD:
        // Wind effect: wave across fields
        var windOff = Math.sin(animFrame / 25 + x * 0.4) * 1.5;
        ctx.fillStyle = '#5a9e44';
        for (var i = 0; i < 4; i++) {
          ctx.fillRect(px + 1 + windOff * (i % 2 ? 1 : -1), py + i * 4 + 2, 14, 2);
        }
        break;
      case Game.Config.TILE.BORDER:
        // Animated border: pulse
        var borderPulse = Math.floor(animFrame / 15) % 2;
        ctx.fillStyle = borderPulse ? '#ff4444' : '#cc3333';
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = '#ff4444';
        for (var i = 0; i < 4; i++) {
          ctx.fillRect(px + i * 4, py + 7, 3, 2);
        }
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(px + 2, py + 1, 12, 5);
        drawText('!', px + 6, py + 0, '#cc0000', 8);
        // Occasional ember
        if ((animFrame + x * 13 + y * 7) % 60 < 5) {
          ctx.fillStyle = '#ff8800';
          ctx.fillRect(px + Math.random() * 14, py + Math.random() * 4, 1, 1);
        }
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

  // Screen effects
  function screenShake(intensity, duration) {
    effects.shake.active = true;
    effects.shake.intensity = intensity || 4;
    effects.shake.timer = duration || 20;
  }

  function screenFlash(color, duration) {
    effects.flash.active = true;
    effects.flash.color = color || '#fff';
    effects.flash.timer = duration || 10;
    effects.flash.maxTimer = duration || 10;
  }

  function screenFade(targetAlpha, duration, callback) {
    effects.fade.active = true;
    effects.fade.target = targetAlpha;
    effects.fade.speed = Math.abs(targetAlpha - effects.fade.alpha) / (duration || 30);
    effects.fade.callback = callback || null;
  }

  function screenTint(color, alpha) {
    if (alpha <= 0) {
      effects.tint.active = false;
    } else {
      effects.tint.active = true;
      effects.tint.color = color || '#000';
      effects.tint.alpha = alpha;
    }
  }

  function updateEffects() {
    if (effects.shake.active) {
      effects.shake.timer--;
      if (effects.shake.timer <= 0) {
        effects.shake.active = false;
        effects.shake.intensity = 0;
      }
    }
    if (effects.flash.active) {
      effects.flash.timer--;
      if (effects.flash.timer <= 0) {
        effects.flash.active = false;
      }
    }
    if (effects.fade.active) {
      if (effects.fade.alpha < effects.fade.target) {
        effects.fade.alpha = Math.min(effects.fade.alpha + effects.fade.speed, effects.fade.target);
      } else {
        effects.fade.alpha = Math.max(effects.fade.alpha - effects.fade.speed, effects.fade.target);
      }
      if (Math.abs(effects.fade.alpha - effects.fade.target) < 0.01) {
        effects.fade.alpha = effects.fade.target;
        effects.fade.active = false;
        if (effects.fade.callback) {
          effects.fade.callback();
          effects.fade.callback = null;
        }
      }
    }
  }

  function drawEffects() {
    if (effects.flash.active) {
      var flashAlpha = effects.flash.timer / effects.flash.maxTimer;
      ctx.fillStyle = effects.flash.color;
      ctx.globalAlpha = flashAlpha * 0.6;
      ctx.fillRect(0, 0, Game.Config.CANVAS_WIDTH, Game.Config.CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }
    if (effects.tint.active) {
      ctx.fillStyle = effects.tint.color;
      ctx.globalAlpha = effects.tint.alpha;
      ctx.fillRect(0, 0, Game.Config.CANVAS_WIDTH, Game.Config.CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }
    if (effects.fade.alpha > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + effects.fade.alpha + ')';
      ctx.fillRect(0, 0, Game.Config.CANVAS_WIDTH, Game.Config.CANVAS_HEIGHT);
    }
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
    getContext: getContext,
    screenShake: screenShake,
    screenFlash: screenFlash,
    screenFade: screenFade,
    screenTint: screenTint,
    updateEffects: updateEffects,
    drawEffects: drawEffects
  };
})();
