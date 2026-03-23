// Rendering system
Game.Renderer = (function() {
  var canvas, ctx;
  var cameraX = 0, cameraY = 0;
  var animFrame = 0;
  var onsenSteam = [];
  var effects = {
    shake: { active: false, intensity: 0, timer: 0 },
    flash: { active: false, color: '#fff', timer: 0, maxTimer: 0 },
    fade: { active: false, alpha: 0, start: 0, target: 0, timer: 0, maxTimer: 0, callback: null },
    tint: { active: false, color: '#000', alpha: 0 }
  };
  var shakeOffsetX = 0;
  var shakeOffsetY = 0;

  function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function applyScreenX(x) {
    return Math.floor(x + shakeOffsetX);
  }

  function applyScreenY(y) {
    return Math.floor(y + shakeOffsetY);
  }

  function getWorldScreenX(x) {
    return applyScreenX(x - cameraX);
  }

  function getWorldScreenY(y) {
    return applyScreenY(y - cameraY);
  }

  function mixHexColors(colorA, colorB, t) {
    var amount = clamp(t, 0, 1);
    var a = parseInt(colorA.slice(1), 16);
    var b = parseInt(colorB.slice(1), 16);
    var ar = (a >> 16) & 255;
    var ag = (a >> 8) & 255;
    var ab = a & 255;
    var br = (b >> 16) & 255;
    var bg = (b >> 8) & 255;
    var bb = b & 255;
    var r = Math.round(ar + (br - ar) * amount);
    var g = Math.round(ag + (bg - ag) * amount);
    var blue = Math.round(ab + (bb - ab) * amount);
    return 'rgb(' + r + ',' + g + ',' + blue + ')';
  }

  function clear(color) {
    animFrame++;
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
    ctx.fillRect(getWorldScreenX(x), getWorldScreenY(y), w, h);
  }

  function drawRectAbsolute(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(applyScreenX(x), applyScreenY(y), w, h);
  }

  function drawBorder(x, y, w, h, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 2;
    ctx.strokeRect(applyScreenX(x), applyScreenY(y), w, h);
  }

  function drawText(text, x, y, color, size, align) {
    ctx.fillStyle = color || '#fff';
    ctx.font = (size || 12) + 'px "Courier New", monospace';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, applyScreenX(x), applyScreenY(y));
  }

  function drawTextJP(text, x, y, color, size, align) {
    ctx.fillStyle = color || '#fff';
    ctx.font = (size || 14) + 'px "Hiragino Kaku Gothic ProN", "Meiryo", "MS Gothic", sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, applyScreenX(x), applyScreenY(y));
  }

  function drawSpriteShadow(px, py, width) {
    var shadowWidth = Math.max(6, Math.min(10, width - 2));
    var shadowHeight = 2;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(px + width / 2, py + 14, shadowWidth / 2, shadowHeight, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOutlinedPixel(px, py, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(px - 1, py, 1, 1);
    ctx.fillRect(px + 1, py, 1, 1);
    ctx.fillRect(px, py - 1, 1, 1);
    ctx.fillRect(px, py + 1, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(px, py, 1, 1);
  }

  function drawSprite(spriteData, x, y, palette, flipped) {
    var px = getWorldScreenX(x);
    var py = getWorldScreenY(y);
    var width = spriteData[0] ? spriteData[0].length : 0;
    drawSpriteShadow(px, py, width);
    for (var row = 0; row < spriteData.length; row++) {
      for (var col = 0; col < spriteData[row].length; col++) {
        var colorIdx = spriteData[row][col];
        if (colorIdx === 0) continue;
        var drawCol = flipped ? (spriteData[row].length - 1 - col) : col;
        drawOutlinedPixel(px + drawCol, py + row, palette[colorIdx]);
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
        ctx.fillRect(applyScreenX(x + col * scale), applyScreenY(y + row * scale), scale, scale);
      }
    }
  }

  function updateOnsenSteam() {
    for (var i = onsenSteam.length - 1; i >= 0; i--) {
      var particle = onsenSteam[i];
      particle.life--;
      particle.offsetY -= 0.2;
      if (particle.life <= 0) {
        onsenSteam.splice(i, 1);
      }
    }
  }

  function maybeSpawnOnsenSteam(tileX, tileY) {
    if (Math.random() < 0.02) {
      onsenSteam.push({
        tileX: tileX,
        tileY: tileY,
        offsetX: 3 + Math.floor(Math.random() * 8),
        offsetY: 0,
        life: 15
      });
    }
  }

  function drawOnsenSteam(tileX, tileY, px, py) {
    for (var i = 0; i < onsenSteam.length; i++) {
      var particle = onsenSteam[i];
      if (particle.tileX !== tileX || particle.tileY !== tileY) continue;
      var alpha = particle.life / 15;
      ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(2) + ')';
      ctx.fillRect(px + particle.offsetX, py - 2 + particle.offsetY, 1, 1);
    }
  }

  function drawTile(type, x, y) {
    var ts = Game.Config.TILE_SIZE;
    var px = getWorldScreenX(x * ts);
    var py = getWorldScreenY(y * ts);

    if (px + ts < 0 || px > Game.Config.CANVAS_WIDTH ||
        py + ts < 0 || py > Game.Config.CANVAS_HEIGHT) return;

    var pulse;
    var wave;
    ctx.fillStyle = Game.Config.TILE_COLORS[type] || '#000';

    switch (type) {
      case Game.Config.TILE.WATER:
        ctx.fillStyle = Math.floor(animFrame / 30) % 2 === 0 ? '#3366aa' : '#2255bb';
        break;
      case Game.Config.TILE.ONSEN:
        pulse = (Math.sin((animFrame % 20) / 20 * Math.PI * 2) + 1) / 2;
        ctx.fillStyle = mixHexColors('#88ccee', '#99ddff', pulse);
        break;
      case Game.Config.TILE.FIELD:
        wave = (Math.sin((x * 0.8) + animFrame / 18) + 1) / 2;
        ctx.fillStyle = mixHexColors('#65b14d', '#79c35f', wave * 0.6);
        break;
      case Game.Config.TILE.BORDER:
        pulse = (Math.sin(animFrame / 12) + 1) / 2;
        ctx.fillStyle = mixHexColors('#cc3333', '#ff4444', pulse);
        break;
    }

    ctx.fillRect(px, py, ts, ts);

    switch (type) {
      case Game.Config.TILE.TREE:
        ctx.fillStyle = '#3d7a2e';
        ctx.fillRect(px + 3, py + 1, 10, 8);
        ctx.fillStyle = '#2d5a1e';
        ctx.fillRect(px + 5, py + 3, 6, 4);
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(px + 6, py + 9, 4, 7);
        break;
      case Game.Config.TILE.WATER:
        ctx.fillStyle = '#4488cc';
        ctx.fillRect(px + 2, py + 4, 4, 1);
        ctx.fillRect(px + 9, py + 8, 5, 1);
        ctx.fillRect(px + 3, py + 12, 4, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        var rippleOffset = animFrame % 4;
        ctx.fillRect(px + 2 + rippleOffset, py + 2, 3, 1);
        ctx.fillRect(px + 8 + rippleOffset, py + 10, 2, 1);
        break;
      case Game.Config.TILE.WALL:
        ctx.fillStyle = '#666';
        ctx.fillRect(px, py + 4, ts, 1);
        ctx.fillRect(px, py + 9, ts, 1);
        ctx.fillRect(px, py + 14, ts, 1);
        ctx.fillRect(px + 8, py, 1, 4);
        ctx.fillRect(px + 4, py + 5, 1, 4);
        ctx.fillRect(px + 12, py + 10, 1, 4);
        break;
      case Game.Config.TILE.ONSEN:
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(px + 4 + Math.sin(animFrame / 10) * 2, py + 2, 2, 3);
        ctx.fillRect(px + 9 + Math.sin(animFrame / 10 + 1) * 2, py + 1, 2, 3);
        maybeSpawnOnsenSteam(x, y);
        drawOnsenSteam(x, y, px, py);
        break;
      case Game.Config.TILE.FIELD:
        ctx.fillStyle = '#5a9e44';
        for (var i = 0; i < 4; i++) {
          ctx.fillRect(px + 1 + (i % 2), py + i * 4 + 2, 14, 2);
        }
        break;
      case Game.Config.TILE.BORDER:
        ctx.fillStyle = '#ff4444';
        for (var dash = 0; dash < 4; dash++) {
          ctx.fillRect(px + dash * 4, py + 7, 3, 2);
        }
        if ((animFrame + x + y) % 25 === 0) {
          ctx.fillStyle = '#ff8800';
          ctx.fillRect(px + 4 + ((animFrame / 5) % 7), py + 3 + ((animFrame / 7) % 5), 1, 1);
        }
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(px + 2, py + 1, 12, 5);
        drawText('!', px + 6 - shakeOffsetX, py + 0 - shakeOffsetY, '#cc0000', 8);
        break;
      case Game.Config.TILE.DOOR:
        ctx.fillStyle = '#a07828';
        ctx.fillRect(px + 3, py + 1, 10, 14);
        ctx.fillStyle = '#c4a030';
        ctx.fillRect(px + 9, py + 7, 2, 2);
        break;
    }
  }

  function drawParallaxBackground(map) {
    if (!map) return;
    var baseY = 96 - cameraY * 0.1;
    var offsetX = -((cameraX * 0.5) % 180);
    ctx.fillStyle = '#61705f';
    for (var x = offsetX - 180; x < Game.Config.CANVAS_WIDTH + 180; x += 120) {
      ctx.beginPath();
      ctx.moveTo(applyScreenX(x), applyScreenY(baseY + 30));
      ctx.lineTo(applyScreenX(x + 35), applyScreenY(baseY - 10));
      ctx.lineTo(applyScreenX(x + 70), applyScreenY(baseY + 30));
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#495547';
    for (var x2 = offsetX - 90; x2 < Game.Config.CANVAS_WIDTH + 180; x2 += 140) {
      ctx.beginPath();
      ctx.moveTo(applyScreenX(x2), applyScreenY(baseY + 38));
      ctx.lineTo(applyScreenX(x2 + 45), applyScreenY(baseY - 2));
      ctx.lineTo(applyScreenX(x2 + 90), applyScreenY(baseY + 38));
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(applyScreenX(0), applyScreenY(baseY + 25), Game.Config.CANVAS_WIDTH, 2);
  }

  function drawDialogBox(x, y, w, h) {
    ctx.fillStyle = Game.Config.COLORS.DIALOG_BG;
    ctx.fillRect(applyScreenX(x), applyScreenY(y), w, h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(applyScreenX(x + 1), applyScreenY(y + 1), w - 2, h - 2);
    ctx.strokeStyle = '#88aaff';
    ctx.lineWidth = 1;
    ctx.strokeRect(applyScreenX(x + 3), applyScreenY(y + 3), w - 6, h - 6);
  }

  function fadeOverlay(alpha) {
    ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    ctx.fillRect(0, 0, Game.Config.CANVAS_WIDTH, Game.Config.CANVAS_HEIGHT);
  }

  function screenShake(intensity, duration) {
    effects.shake.active = duration > 0;
    effects.shake.intensity = intensity || 0;
    effects.shake.timer = duration || 0;
  }

  function screenFlash(color, duration) {
    effects.flash.active = duration > 0;
    effects.flash.color = color || '#fff';
    effects.flash.timer = duration || 0;
    effects.flash.maxTimer = duration || 0;
  }

  function screenFade(targetAlpha, duration, callback) {
    effects.fade.active = true;
    effects.fade.start = effects.fade.alpha;
    effects.fade.target = clamp(targetAlpha, 0, 1);
    effects.fade.timer = duration || 0;
    effects.fade.maxTimer = duration || 0;
    effects.fade.callback = callback || null;
    if (!duration) {
      effects.fade.alpha = effects.fade.target;
      effects.fade.active = false;
      if (effects.fade.callback) {
        var immediate = effects.fade.callback;
        effects.fade.callback = null;
        immediate();
      }
    }
  }

  function screenTint(color, alpha) {
    effects.tint.color = color || '#000';
    effects.tint.alpha = clamp(alpha || 0, 0, 1);
    effects.tint.active = effects.tint.alpha > 0;
  }

  function updateEffects() {
    updateOnsenSteam();

    if (effects.shake.active) {
      shakeOffsetX = Math.round((Math.random() * 2 - 1) * effects.shake.intensity);
      shakeOffsetY = Math.round((Math.random() * 2 - 1) * effects.shake.intensity);
      effects.shake.timer--;
      if (effects.shake.timer <= 0) {
        effects.shake.active = false;
        shakeOffsetX = 0;
        shakeOffsetY = 0;
      }
    } else {
      shakeOffsetX = 0;
      shakeOffsetY = 0;
    }

    if (effects.flash.active) {
      effects.flash.timer--;
      if (effects.flash.timer <= 0) {
        effects.flash.active = false;
      }
    }

    if (effects.fade.active && effects.fade.maxTimer > 0) {
      effects.fade.timer--;
      var progress = 1 - (effects.fade.timer / effects.fade.maxTimer);
      effects.fade.alpha = effects.fade.start + (effects.fade.target - effects.fade.start) * progress;
      if (effects.fade.timer <= 0) {
        effects.fade.alpha = effects.fade.target;
        effects.fade.active = false;
        if (effects.fade.callback) {
          var callback = effects.fade.callback;
          effects.fade.callback = null;
          callback();
        }
      }
    }
  }

  function drawEffects() {
    if (effects.tint.active) {
      ctx.fillStyle = effects.tint.color;
      ctx.globalAlpha = effects.tint.alpha;
      ctx.fillRect(0, 0, Game.Config.CANVAS_WIDTH, Game.Config.CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }

    if (effects.flash.active) {
      var flashAlpha = effects.flash.maxTimer > 0 ? (effects.flash.timer / effects.flash.maxTimer) * 0.6 : 0;
      ctx.fillStyle = effects.flash.color;
      ctx.globalAlpha = flashAlpha;
      ctx.fillRect(0, 0, Game.Config.CANVAS_WIDTH, Game.Config.CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }

    if (effects.fade.alpha > 0) {
      ctx.fillStyle = '#000';
      ctx.globalAlpha = clamp(effects.fade.alpha, 0, 1);
      ctx.fillRect(0, 0, Game.Config.CANVAS_WIDTH, Game.Config.CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }
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
    drawParallaxBackground: drawParallaxBackground,
    drawDialogBox: drawDialogBox,
    fadeOverlay: fadeOverlay,
    screenShake: screenShake,
    screenFlash: screenFlash,
    screenFade: screenFade,
    screenTint: screenTint,
    updateEffects: updateEffects,
    drawEffects: drawEffects,
    getContext: getContext
  };
})();
