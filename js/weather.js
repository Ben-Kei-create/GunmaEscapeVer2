// Weather and atmosphere overlay system
Game.Weather = (function() {
  var SCREEN_WIDTH = Game.Config.CANVAS_WIDTH;
  var SCREEN_HEIGHT = Game.Config.CANVAS_HEIGHT;
  var currentWeather = 'clear';
  var previousWeather = null;
  var targetWeather = null;
  var transitionPhase = 'idle';
  var transitionTimer = 0;
  var frameCount = 0;
  var lightningTimer = 0;
  var lightningFrames = 0;

  var mapWeather = {
    '前橋': 'clear',
    '高崎': 'clear',
    '草津': 'onsen_steam',
    '下仁田': 'autumn_leaves',
    '嬬恋': 'clear',
    '田村': 'fog',
    '森': 'fog',
    '小沼': 'rain',
    '大沼': 'rain',
    '赤城牧場': 'storm',
    '赤城神社': 'night'
  };

  var systems = {
    clear: { particles: [] },
    rain: { particles: [] },
    snow: { particles: [] },
    fog: { particles: [] },
    storm: { particles: [] },
    onsen_steam: { particles: [] },
    autumn_leaves: { particles: [] },
    night: { particles: [] }
  };

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeWeather(type) {
    if (!type || !systems[type]) {
      return 'clear';
    }
    return type;
  }

  function initRainParticles(system, count, minVy, maxVy) {
    system.particles = [];
    for (var i = 0; i < count; i++) {
      system.particles.push({
        x: rand(0, SCREEN_WIDTH),
        y: rand(0, SCREEN_HEIGHT),
        vx: -1,
        vy: rand(minVy, maxVy),
        length: 6
      });
    }
  }

  function initSnowParticles(system) {
    system.particles = [];
    for (var i = 0; i < 60; i++) {
      system.particles.push({
        x: rand(0, SCREEN_WIDTH),
        y: rand(0, SCREEN_HEIGHT),
        baseX: rand(0, SCREEN_WIDTH),
        drift: rand(2, 8),
        swaySpeed: rand(0.015, 0.045),
        swayPhase: rand(0, Math.PI * 2),
        vy: rand(1, 3)
      });
    }
  }

  function initFogParticles(system) {
    system.particles = [];
    for (var i = 0; i < 12; i++) {
      system.particles.push({
        x: rand(-80, SCREEN_WIDTH),
        y: rand(10, SCREEN_HEIGHT - 40),
        w: randInt(64, 140),
        h: randInt(18, 50),
        vx: rand(0.15, 0.45),
        alpha: rand(0.10, 0.22)
      });
    }
  }

  function initSteamParticles(system) {
    system.particles = [];
    for (var i = 0; i < 70; i++) {
      system.particles.push({
        x: rand(0, SCREEN_WIDTH),
        y: rand(SCREEN_HEIGHT * 0.66, SCREEN_HEIGHT + 60),
        vx: rand(-0.2, 0.2),
        vy: rand(0.35, 1.1),
        drift: rand(0.3, 1.2),
        swaySpeed: rand(0.02, 0.05),
        swayPhase: rand(0, Math.PI * 2),
        size: randInt(2, 4),
        life: randInt(100, 180),
        maxLife: 180
      });
    }
  }

  function initLeafParticles(system) {
    var leafColors = ['#d94b2b', '#f28c28', '#f0c541', '#8a5a3c'];
    system.particles = [];
    for (var i = 0; i < 30; i++) {
      system.particles.push({
        x: rand(0, SCREEN_WIDTH),
        y: rand(-SCREEN_HEIGHT, SCREEN_HEIGHT),
        baseX: rand(0, SCREEN_WIDTH),
        sway: rand(6, 16),
        swaySpeed: rand(0.025, 0.06),
        swayPhase: rand(0, Math.PI * 2),
        vy: rand(1.8, 3.8),
        rotationStep: randInt(0, 1),
        color: leafColors[randInt(0, leafColors.length - 1)]
      });
    }
  }

  function initNightParticles(system) {
    system.particles = [];
    for (var i = 0; i < 45; i++) {
      system.particles.push({
        x: randInt(0, SCREEN_WIDTH - 1),
        y: randInt(0, SCREEN_HEIGHT - 1),
        visible: Math.random() > 0.35,
        twinkleRate: randInt(18, 60),
        twinkleOffset: randInt(0, 59)
      });
    }
  }

  function initWeather(type) {
    type = normalizeWeather(type);
    switch (type) {
      case 'rain':
        initRainParticles(systems.rain, 100, 8, 12);
        break;
      case 'snow':
        initSnowParticles(systems.snow);
        break;
      case 'fog':
        initFogParticles(systems.fog);
        break;
      case 'storm':
        initRainParticles(systems.storm, 200, 10, 15);
        lightningFrames = 0;
        lightningTimer = randInt(180, 300);
        break;
      case 'onsen_steam':
        initSteamParticles(systems.onsen_steam);
        break;
      case 'autumn_leaves':
        initLeafParticles(systems.autumn_leaves);
        break;
      case 'night':
        initNightParticles(systems.night);
        break;
      case 'clear':
      case 'snow':
      default:
        break;
    }
  }

  function recycleRainDrop(drop, speedMin, speedMax) {
    if (drop.y > SCREEN_HEIGHT) {
      drop.y = -drop.length;
      drop.x = rand(0, SCREEN_WIDTH);
      drop.vy = rand(speedMin, speedMax);
    }
    if (drop.x < -2) {
      drop.x = SCREEN_WIDTH + 2;
    }
  }

  function updateRain(system, speedMin, speedMax) {
    for (var i = 0; i < system.particles.length; i++) {
      var drop = system.particles[i];
      drop.x += drop.vx;
      drop.y += drop.vy;
      recycleRainDrop(drop, speedMin, speedMax);
    }
  }

  function updateSnow(system) {
    for (var i = 0; i < system.particles.length; i++) {
      var flake = system.particles[i];
      flake.y += flake.vy;
      flake.x = flake.baseX + Math.sin(frameCount * flake.swaySpeed + flake.swayPhase) * flake.drift;
      if (flake.y > SCREEN_HEIGHT + 2) {
        flake.y = -4;
        flake.baseX = rand(0, SCREEN_WIDTH);
        flake.vy = rand(1, 3);
      }
      if (flake.x < -4) flake.baseX += SCREEN_WIDTH;
      if (flake.x > SCREEN_WIDTH + 4) flake.baseX -= SCREEN_WIDTH;
    }
  }

  function updateFog(system) {
    for (var i = 0; i < system.particles.length; i++) {
      var patch = system.particles[i];
      patch.x += patch.vx;
      if (patch.x > SCREEN_WIDTH + 20) {
        patch.x = -patch.w - rand(10, 80);
        patch.y = rand(10, SCREEN_HEIGHT - patch.h);
      }
    }
  }

  function updateSteam(system) {
    for (var i = 0; i < system.particles.length; i++) {
      var puff = system.particles[i];
      puff.life--;
      puff.y -= puff.vy;
      puff.x += puff.vx + Math.sin(frameCount * puff.swaySpeed + puff.swayPhase) * puff.drift;
      if (puff.y < SCREEN_HEIGHT * 0.3 || puff.life <= 0) {
        puff.x = rand(0, SCREEN_WIDTH);
        puff.y = rand(SCREEN_HEIGHT * 0.72, SCREEN_HEIGHT + 50);
        puff.life = randInt(110, 180);
        puff.maxLife = puff.life;
        puff.vy = rand(0.35, 1.1);
        puff.size = randInt(2, 4);
        puff.swayPhase = rand(0, Math.PI * 2);
      }
      if (puff.x < -8) puff.x = SCREEN_WIDTH + 8;
      if (puff.x > SCREEN_WIDTH + 8) puff.x = -8;
    }
  }

  function updateLeaves(system) {
    for (var i = 0; i < system.particles.length; i++) {
      var leaf = system.particles[i];
      leaf.y += leaf.vy;
      leaf.x = leaf.baseX + Math.sin(frameCount * leaf.swaySpeed + leaf.swayPhase) * leaf.sway;
      if (leaf.y > SCREEN_HEIGHT + 6) {
        leaf.y = -6;
        leaf.baseX = rand(0, SCREEN_WIDTH);
        leaf.vy = rand(1.8, 3.8);
        leaf.color = ['#d94b2b', '#f28c28', '#f0c541', '#8a5a3c'][randInt(0, 3)];
      }
      if (leaf.x < -6) leaf.baseX += SCREEN_WIDTH;
      if (leaf.x > SCREEN_WIDTH + 6) leaf.baseX -= SCREEN_WIDTH;
    }
  }

  function updateNight(system) {
    for (var i = 0; i < system.particles.length; i++) {
      var star = system.particles[i];
      if ((frameCount + star.twinkleOffset) % star.twinkleRate === 0) {
        star.visible = !star.visible;
      }
    }
  }

  function updateType(type) {
    switch (type) {
      case 'rain':
        updateRain(systems.rain, 8, 12);
        break;
      case 'snow':
        updateSnow(systems.snow);
        break;
      case 'fog':
        updateFog(systems.fog);
        break;
      case 'storm':
        updateRain(systems.storm, 10, 15);
        if (lightningFrames > 0) {
          lightningFrames--;
        } else {
          lightningTimer--;
          if (lightningTimer <= 0) {
            lightningFrames = 3;
            lightningTimer = randInt(180, 300);
          }
        }
        break;
      case 'onsen_steam':
        updateSteam(systems.onsen_steam);
        break;
      case 'autumn_leaves':
        updateLeaves(systems.autumn_leaves);
        break;
      case 'night':
        updateNight(systems.night);
        break;
    }
  }

  function getMapWeatherType(mapName) {
    if (!mapName) return 'clear';
    if (mapWeather[mapName]) return mapWeather[mapName];

    for (var key in mapWeather) {
      if (mapWeather.hasOwnProperty(key) && mapName.indexOf(key) >= 0) {
        return mapWeather[key];
      }
    }

    return 'clear';
  }

  function getPlayerScreenPosition() {
    var pd = Game.Player && Game.Player.getData ? Game.Player.getData() : null;
    if (!pd) {
      return { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 };
    }

    var ts = Game.Config.TILE_SIZE;
    var worldWidth = Game.Config.MAP_COLS * ts;
    var worldHeight = Game.Config.MAP_ROWS * ts;
    var cameraX = Math.max(0, Math.min(pd.x + ts / 2 - SCREEN_WIDTH / 2, worldWidth - SCREEN_WIDTH));
    var cameraY = Math.max(0, Math.min(pd.y + ts / 2 - SCREEN_HEIGHT / 2, worldHeight - SCREEN_HEIGHT));

    return {
      x: pd.x - cameraX + ts / 2,
      y: pd.y - cameraY + ts / 2
    };
  }

  function fillScreen(color, alphaScale) {
    if (alphaScale === undefined) alphaScale = 1;
    var rgba = color;
    if (alphaScale !== 1) {
      rgba = color.replace(/rgba\(([^)]+),\s*([0-9.]+)\)/, function(match, prefix, alpha) {
        return 'rgba(' + prefix + ',' + clamp(parseFloat(alpha) * alphaScale, 0, 1) + ')';
      });
    }
    Game.Renderer.drawRectAbsolute(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, rgba);
  }

  function drawRain(system, alphaScale) {
    fillScreen('rgba(70,95,130,0.18)', alphaScale);
    for (var i = 0; i < system.particles.length; i++) {
      var drop = system.particles[i];
      Game.Renderer.drawRectAbsolute(Math.floor(drop.x), Math.floor(drop.y), 1, drop.length, 'rgba(170,220,255,' + (0.65 * alphaScale) + ')');
    }
  }

  function drawSnow(system, alphaScale) {
    fillScreen('rgba(255,255,255,0.10)', alphaScale);
    for (var i = 0; i < system.particles.length; i++) {
      var flake = system.particles[i];
      Game.Renderer.drawRectAbsolute(Math.floor(flake.x), Math.floor(flake.y), 2, 2, 'rgba(255,255,255,' + (0.85 * alphaScale) + ')');
    }
  }

  function drawFog(system, alphaScale) {
    fillScreen('rgba(245,245,255,0.30)', alphaScale);
    for (var i = 0; i < system.particles.length; i++) {
      var patch = system.particles[i];
      Game.Renderer.drawRectAbsolute(Math.floor(patch.x), Math.floor(patch.y), patch.w, patch.h, 'rgba(255,255,255,' + (patch.alpha * alphaScale) + ')');
    }
  }

  function drawSteam(system, alphaScale) {
    fillScreen('rgba(210,235,245,0.07)', alphaScale);
    for (var i = 0; i < system.particles.length; i++) {
      var puff = system.particles[i];
      var alpha = clamp((puff.life / puff.maxLife) * 0.35, 0.05, 0.35) * alphaScale;
      Game.Renderer.drawRectAbsolute(Math.floor(puff.x), Math.floor(puff.y), puff.size, puff.size + 1, 'rgba(240,250,255,' + alpha + ')');
    }
  }

  function drawLeaves(system, alphaScale) {
    fillScreen('rgba(160,120,80,0.08)', alphaScale);
    for (var i = 0; i < system.particles.length; i++) {
      var leaf = system.particles[i];
      var drawX = Math.floor(leaf.x);
      var drawY = Math.floor(leaf.y);
      Game.Renderer.drawRectAbsolute(drawX, drawY, 3, 3, leaf.color);
      if (leaf.rotationStep === 1) {
        Game.Renderer.drawRectAbsolute(drawX + 1, drawY - 1, 1, 1, 'rgba(255,240,210,' + (0.5 * alphaScale) + ')');
      }
    }
  }

  function drawNight(system, alphaScale) {
    var playerPos = getPlayerScreenPosition();
    var cellSize = 24;

    for (var gy = 0; gy < SCREEN_HEIGHT; gy += cellSize) {
      for (var gx = 0; gx < SCREEN_WIDTH; gx += cellSize) {
        var cellCenterX = gx + cellSize / 2;
        var cellCenterY = gy + cellSize / 2;
        var dx = cellCenterX - playerPos.x;
        var dy = cellCenterY - playerPos.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var alpha = 0.4;
        if (dist < 110) {
          alpha = 0.12 + (dist / 110) * 0.16;
        } else if (dist < 170) {
          alpha = 0.28 + ((dist - 110) / 60) * 0.12;
        }
        Game.Renderer.drawRectAbsolute(gx, gy, cellSize, cellSize, 'rgba(10,18,42,' + clamp(alpha * alphaScale, 0, 1) + ')');
      }
    }

    for (var i = 0; i < system.particles.length; i++) {
      var star = system.particles[i];
      if (star.visible) {
        var starAlpha = ((frameCount + star.twinkleOffset) % 20 < 10 ? 0.85 : 0.45) * alphaScale;
        Game.Renderer.drawRectAbsolute(star.x, star.y, 1, 1, 'rgba(255,255,255,' + starAlpha + ')');
      }
    }
  }

  function drawStorm(system, alphaScale) {
    fillScreen('rgba(35,45,68,0.28)', alphaScale);
    for (var i = 0; i < system.particles.length; i++) {
      var drop = system.particles[i];
      Game.Renderer.drawRectAbsolute(Math.floor(drop.x), Math.floor(drop.y), 1, drop.length, 'rgba(175,220,255,' + (0.72 * alphaScale) + ')');
    }
    if (lightningFrames > 0) {
      fillScreen('rgba(255,255,255,0.88)', alphaScale);
    }
  }

  function drawType(type, alphaScale) {
    alphaScale = alphaScale === undefined ? 1 : alphaScale;
    switch (type) {
      case 'rain':
        drawRain(systems.rain, alphaScale);
        break;
      case 'snow':
        drawSnow(systems.snow, alphaScale);
        break;
      case 'fog':
        drawFog(systems.fog, alphaScale);
        break;
      case 'storm':
        drawStorm(systems.storm, alphaScale);
        break;
      case 'onsen_steam':
        drawSteam(systems.onsen_steam, alphaScale);
        break;
      case 'autumn_leaves':
        drawLeaves(systems.autumn_leaves, alphaScale);
        break;
      case 'night':
        drawNight(systems.night, alphaScale);
        break;
    }
  }

  function setWeather(type) {
    type = normalizeWeather(type);

    if (targetWeather === type && transitionPhase !== 'idle') {
      return;
    }

    if (currentWeather === type && transitionPhase === 'idle') {
      return;
    }

    if (transitionPhase === 'fade_in') {
      currentWeather = targetWeather || currentWeather;
      targetWeather = null;
      transitionPhase = 'idle';
      transitionTimer = 0;
    }

    previousWeather = currentWeather;
    targetWeather = type;
    transitionPhase = 'fade_out';
    transitionTimer = 0;
  }

  function setMapWeather(mapName) {
    setWeather(getMapWeatherType(mapName));
  }

  function update() {
    frameCount++;
    updateType(currentWeather);

    if (transitionPhase === 'fade_out' && previousWeather && previousWeather !== currentWeather) {
      updateType(previousWeather);
    }

    if (transitionPhase === 'fade_out') {
      transitionTimer++;
      if (transitionTimer >= 60) {
        currentWeather = targetWeather || 'clear';
        initWeather(currentWeather);
        transitionPhase = 'fade_in';
        transitionTimer = 0;
      }
    } else if (transitionPhase === 'fade_in') {
      transitionTimer++;
      if (transitionTimer >= 60) {
        transitionPhase = 'idle';
        transitionTimer = 0;
        previousWeather = null;
        targetWeather = null;
      }
    }
  }

  function draw() {
    if (transitionPhase === 'fade_out') {
      if (previousWeather && previousWeather !== 'clear') {
        drawType(previousWeather, 1 - transitionTimer / 60);
      }
      return;
    }

    if (transitionPhase === 'fade_in') {
      if (currentWeather !== 'clear') {
        drawType(currentWeather, transitionTimer / 60);
      }
      return;
    }

    if (currentWeather !== 'clear') {
      drawType(currentWeather, 1);
    }
  }

  initWeather(currentWeather);

  return {
    setWeather: setWeather,
    setMapWeather: setMapWeather,
    update: update,
    draw: draw,
    getWeather: function() {
      return transitionPhase === 'fade_out' ? (targetWeather || currentWeather) : currentWeather;
    }
  };
})();
