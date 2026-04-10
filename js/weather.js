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

  // 各マップのデフォルト天候（必要に応じて変更してください）
  var mapWeather = {
    '前橋': 'clear',
    '高崎': 'sunbeams', // 変更: 寂れた街に差し込む斜光
    '草津': 'onsen_steam',
    '下仁田': 'autumn_leaves',
    '嬬恋': 'clear',
    '田村': 'fog',
    '森': 'fog',
    '小沼': 'rain',
    '大沼': 'snow', // 変更: 標高の高い大沼は雪に
    '赤城牧場': 'storm',
    '赤城神社': 'night',
    '白根': 'ash',    // 新規: 硫黄と火山灰
    '尾瀬': 'miasma', // 新規: 異界の底の瘴気
    '境界': 'sakura'  // 新規: 記憶の果ての桜
  };

  var systems = {
    clear: { particles: [] },
    rain: { particles: [] },
    snow: { particles: [] },
    fog: { particles: [] },
    storm: { particles: [] },
    onsen_steam: { particles: [] },
    autumn_leaves: { particles: [] },
    night: { particles: [] },
    sakura: { particles: [] },    // 新規
    ash: { particles: [] },       // 新規
    miasma: { particles: [] },    // 新規
    sunbeams: { particles: [] }   // 新規
  };

  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function normalizeWeather(type) {
    if (!type || !systems[type]) return 'clear';
    return type;
  }

  // === パーティクル初期化 ===

  function initRainParticles(system, count, minVy, maxVy, hasWind) {
    system.particles = [];
    for (var i = 0; i < count; i++) {
      var depth = Math.random(); // 0.0 (遠く) 〜 1.0 (近く)
      system.particles.push({
        x: rand(0, SCREEN_WIDTH + 100),
        y: rand(0, SCREEN_HEIGHT),
        vx: hasWind ? rand(-3, -1.5) : rand(-0.5, 0.5),
        vy: rand(minVy, maxVy) * (0.5 + depth * 0.5),
        length: Math.floor(4 + depth * 6),
        alpha: 0.2 + depth * 0.4
      });
    }
  }

  function initSnowParticles(system) {
    system.particles = [];
    for (var i = 0; i < 80; i++) {
      system.particles.push({
        x: rand(0, SCREEN_WIDTH),
        y: rand(0, SCREEN_HEIGHT),
        baseX: rand(0, SCREEN_WIDTH),
        drift: rand(3, 12),
        swaySpeed: rand(0.01, 0.03),
        swayPhase: rand(0, Math.PI * 2),
        vy: rand(0.5, 2.5),
        size: Math.random() > 0.8 ? 2 : 1 // たまに大粒の雪
      });
    }
  }

  function initFogParticles(system) {
    system.particles = [];
    for (var i = 0; i < 15; i++) {
      system.particles.push({
        x: rand(-80, SCREEN_WIDTH),
        y: rand(10, SCREEN_HEIGHT - 40),
        w: randInt(80, 160),
        h: randInt(20, 60),
        vx: rand(0.1, 0.35),
        swayPhase: rand(0, Math.PI * 2),
        alpha: rand(0.08, 0.18)
      });
    }
  }

  function initSteamParticles(system) {
    system.particles = [];
    for (var i = 0; i < 70; i++) {
      system.particles.push({
        x: rand(0, SCREEN_WIDTH),
        y: rand(SCREEN_HEIGHT * 0.5, SCREEN_HEIGHT + 60),
        vx: rand(-0.3, 0.3),
        vy: rand(0.4, 1.2),
        drift: rand(0.5, 1.5),
        swaySpeed: rand(0.02, 0.05),
        swayPhase: rand(0, Math.PI * 2),
        size: randInt(2, 5),
        life: randInt(100, 180),
        maxLife: 180
      });
    }
  }

  function initLeafParticles(system) {
    var leafColors = ['#d94b2b', '#f28c28', '#f0c541', '#8a5a3c'];
    system.particles = [];
    for (var i = 0; i < 35; i++) {
      system.particles.push({
        x: rand(0, SCREEN_WIDTH),
        y: rand(-SCREEN_HEIGHT, SCREEN_HEIGHT),
        baseX: rand(0, SCREEN_WIDTH),
        sway: rand(8, 20),
        swaySpeed: rand(0.02, 0.05),
        swayPhase: rand(0, Math.PI * 2),
        flipSpeed: rand(0.05, 0.15), // 裏返る速度
        flipPhase: rand(0, Math.PI * 2),
        vy: rand(1.5, 3.5),
        color: leafColors[randInt(0, leafColors.length - 1)]
      });
    }
  }

  function initNightParticles(system) {
    system.particles = [];
    for (var i = 0; i < 60; i++) {
      system.particles.push({
        x: randInt(0, SCREEN_WIDTH - 1),
        y: randInt(0, SCREEN_HEIGHT - 1),
        visible: Math.random() > 0.4,
        twinkleRate: randInt(20, 80),
        twinkleOffset: randInt(0, 79),
        color: Math.random() > 0.8 ? '#d4e4ff' : '#ffffff' // たまに青白い星
      });
    }
  }

  // --- 新規パーティクル初期化 ---

  function initSakuraParticles(system) {
    var colors = ['#ffb7c5', '#e89bb0', '#ffcbd5'];
    system.particles = [];
    for (var i = 0; i < 40; i++) {
      system.particles.push({
        x: rand(0, SCREEN_WIDTH),
        y: rand(-SCREEN_HEIGHT, SCREEN_HEIGHT),
        baseX: rand(0, SCREEN_WIDTH),
        sway: rand(10, 25),
        swaySpeed: rand(0.015, 0.035),
        swayPhase: rand(0, Math.PI * 2),
        flipSpeed: rand(0.04, 0.1),
        flipPhase: rand(0, Math.PI * 2),
        vy: rand(0.8, 2.0), // 落ち葉よりフワッと遅く落ちる
        color: colors[randInt(0, colors.length - 1)]
      });
    }
  }

  function initAshParticles(system) {
    var colors = ['#8c2e2e', '#d95b2b', '#2a2626', '#4a4040'];
    system.particles = [];
    for (var i = 0; i < 60; i++) {
      system.particles.push({
        x: rand(0, SCREEN_WIDTH),
        y: rand(0, SCREEN_HEIGHT + 100),
        baseX: rand(0, SCREEN_WIDTH),
        drift: rand(2, 15),
        swaySpeed: rand(0.02, 0.06),
        swayPhase: rand(0, Math.PI * 2),
        vy: rand(-0.5, -2.5), // 下から上へ舞い上がる
        size: Math.random() > 0.7 ? 2 : 1,
        color: colors[randInt(0, colors.length - 1)],
        life: rand(0, Math.PI) // 明滅用
      });
    }
  }

  function initMiasmaParticles(system) {
    system.particles = [];
    for (var i = 0; i < 20; i++) {
      system.particles.push({
        x: rand(-100, SCREEN_WIDTH),
        y: rand(SCREEN_HEIGHT * 0.4, SCREEN_HEIGHT - 10),
        w: randInt(100, 200),
        h: randInt(30, 80),
        vx: rand(0.05, 0.2),
        swayPhase: rand(0, Math.PI * 2),
        swaySpeed: rand(0.005, 0.015),
        alpha: rand(0.1, 0.3)
      });
    }
  }

  function initSunbeamsParticles(system) {
    system.particles = [];
    // 光の中を舞う細かい塵（ダスト）
    for (var i = 0; i < 40; i++) {
      system.particles.push({
        x: rand(0, SCREEN_WIDTH),
        y: rand(0, SCREEN_HEIGHT),
        vx: rand(-0.1, 0.1),
        vy: rand(-0.05, 0.1),
        alphaPhase: rand(0, Math.PI * 2),
        alphaSpeed: rand(0.02, 0.05)
      });
    }
  }

  // === 天候セットアップ ===

  function initWeather(type) {
    type = normalizeWeather(type);
    switch (type) {
      case 'rain':          initRainParticles(systems.rain, 120, 10, 14, false); break;
      case 'storm':         initRainParticles(systems.storm, 250, 12, 18, true); 
                            lightningFrames = 0; lightningTimer = randInt(120, 260); break;
      case 'snow':          initSnowParticles(systems.snow); break;
      case 'fog':           initFogParticles(systems.fog); break;
      case 'onsen_steam':   initSteamParticles(systems.onsen_steam); break;
      case 'autumn_leaves': initLeafParticles(systems.autumn_leaves); break;
      case 'night':         initNightParticles(systems.night); break;
      case 'sakura':        initSakuraParticles(systems.sakura); break;
      case 'ash':           initAshParticles(systems.ash); break;
      case 'miasma':        initMiasmaParticles(systems.miasma); break;
      case 'sunbeams':      initSunbeamsParticles(systems.sunbeams); break;
      case 'clear': default: break;
    }
  }

  // === 更新ロジック ===

  function recycleRainDrop(drop, speedMin, speedMax) {
    if (drop.y > SCREEN_HEIGHT || drop.x < -10 || drop.x > SCREEN_WIDTH + 10) {
      drop.y = -drop.length;
      drop.x = rand(0, SCREEN_WIDTH + (drop.vx < 0 ? 100 : 0));
      drop.vy = rand(speedMin, speedMax) * (0.5 + (drop.alpha - 0.2));
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
        flake.vy = rand(0.5, 2.5);
      }
      if (flake.x < -10) flake.baseX += SCREEN_WIDTH + 10;
      if (flake.x > SCREEN_WIDTH + 10) flake.baseX -= SCREEN_WIDTH + 10;
    }
  }

  function updateFog(system) {
    for (var i = 0; i < system.particles.length; i++) {
      var patch = system.particles[i];
      patch.x += patch.vx;
      // サイン波で少し上下に揺らす
      patch.yOffset = Math.sin(frameCount * 0.01 + patch.swayPhase) * 10;
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
      if (puff.y < SCREEN_HEIGHT * 0.2 || puff.life <= 0) {
        puff.x = rand(0, SCREEN_WIDTH);
        puff.y = rand(SCREEN_HEIGHT * 0.6, SCREEN_HEIGHT + 50);
        puff.life = randInt(110, 180);
        puff.maxLife = puff.life;
        puff.vy = rand(0.4, 1.2);
        puff.swayPhase = rand(0, Math.PI * 2);
      }
    }
  }

  function updateFallingLeaves(system, isSakura) {
    for (var i = 0; i < system.particles.length; i++) {
      var leaf = system.particles[i];
      leaf.y += leaf.vy;
      leaf.x = leaf.baseX + Math.sin(frameCount * leaf.swaySpeed + leaf.swayPhase) * leaf.sway;
      leaf.flipPhase += leaf.flipSpeed;
      if (leaf.y > SCREEN_HEIGHT + 6) {
        leaf.y = -6;
        leaf.baseX = rand(0, SCREEN_WIDTH);
      }
      if (leaf.x < -10) leaf.baseX += SCREEN_WIDTH + 10;
      if (leaf.x > SCREEN_WIDTH + 10) leaf.baseX -= SCREEN_WIDTH + 10;
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

  function updateAsh(system) {
    for (var i = 0; i < system.particles.length; i++) {
      var ash = system.particles[i];
      ash.y += ash.vy; // 上に登る
      ash.x = ash.baseX + Math.sin(frameCount * ash.swaySpeed + ash.swayPhase) * ash.drift;
      ash.life += 0.05; // 明滅スピード
      if (ash.y < -10) {
        ash.y = SCREEN_HEIGHT + rand(10, 50);
        ash.baseX = rand(0, SCREEN_WIDTH);
      }
    }
  }

  function updateSunbeams(system) {
    for (var i = 0; i < system.particles.length; i++) {
      var mote = system.particles[i];
      mote.x += mote.vx;
      mote.y += mote.vy;
      mote.alphaPhase += mote.alphaSpeed;
      if (mote.y > SCREEN_HEIGHT || mote.x > SCREEN_WIDTH || mote.x < 0 || mote.y < 0) {
        mote.x = rand(0, SCREEN_WIDTH);
        mote.y = rand(0, SCREEN_HEIGHT);
      }
    }
  }

  function updateType(type) {
    switch (type) {
      case 'rain':          updateRain(systems.rain, 8, 12); break;
      case 'storm':         updateRain(systems.storm, 12, 18);
                            if (lightningFrames > 0) lightningFrames--;
                            else if (--lightningTimer <= 0) {
                              lightningFrames = 3; lightningTimer = randInt(120, 260);
                            } break;
      case 'snow':          updateSnow(systems.snow); break;
      case 'fog':           updateFog(systems.fog); break;
      case 'onsen_steam':   updateSteam(systems.onsen_steam); break;
      case 'autumn_leaves': updateFallingLeaves(systems.autumn_leaves, false); break;
      case 'sakura':        updateFallingLeaves(systems.sakura, true); break;
      case 'night':         updateNight(systems.night); break;
      case 'ash':           updateAsh(systems.ash); break;
      case 'miasma':        updateFog(systems.miasma); break; // 動きはFogと同じ
      case 'sunbeams':      updateSunbeams(systems.sunbeams); break;
    }
  }

  // === 描画ロジック ===

  function getMapWeatherType(mapName) {
    if (!mapName) return 'clear';
    if (mapWeather[mapName]) return mapWeather[mapName];
    for (var key in mapWeather) {
      if (mapName.indexOf(key) >= 0) return mapWeather[key];
    }
    return 'clear';
  }

  function getPlayerScreenPosition() {
    var pd = Game.Player && Game.Player.getData ? Game.Player.getData() : null;
    if (!pd) return { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 };
    var ts = Game.Config.TILE_SIZE;
    var worldWidth = Game.Config.MAP_COLS * ts;
    var worldHeight = Game.Config.MAP_ROWS * ts;
    var cameraX = Math.max(0, Math.min(pd.x + ts / 2 - SCREEN_WIDTH / 2, worldWidth - SCREEN_WIDTH));
    var cameraY = Math.max(0, Math.min(pd.y + ts / 2 - SCREEN_HEIGHT / 2, worldHeight - SCREEN_HEIGHT));
    return { x: pd.x - cameraX + ts / 2, y: pd.y - cameraY + ts / 2 };
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

  function drawRain(system, alphaScale, isStorm) {
    fillScreen(isStorm ? 'rgba(30,40,60,0.35)' : 'rgba(50,75,100,0.15)', alphaScale);
    for (var i = 0; i < system.particles.length; i++) {
      var drop = system.particles[i];
      var a = drop.alpha * alphaScale;
      // 落ちる角度を表現するため、横幅を少し広くする（高速移動の錯覚）
      var w = Math.abs(drop.vx) > 1 ? 2 : 1; 
      Game.Renderer.drawRectAbsolute(Math.floor(drop.x), Math.floor(drop.y), w, drop.length, 'rgba(180,225,255,' + a + ')');
    }
    if (isStorm && lightningFrames > 0) {
      fillScreen('rgba(230,240,255,0.85)', alphaScale);
    }
  }

  function drawSnow(system, alphaScale) {
    fillScreen('rgba(255,255,255,0.08)', alphaScale);
    for (var i = 0; i < system.particles.length; i++) {
      var flake = system.particles[i];
      Game.Renderer.drawRectAbsolute(Math.floor(flake.x), Math.floor(flake.y), flake.size, flake.size, 'rgba(255,255,255,' + (0.9 * alphaScale) + ')');
    }
  }

  function drawFog(system, alphaScale, colorBase) {
    var base = colorBase || '245,255,255'; // デフォルトは白っぽい霧
    fillScreen('rgba(' + base + ',0.15)', alphaScale);
    for (var i = 0; i < system.particles.length; i++) {
      var patch = system.particles[i];
      var y = patch.y + (patch.yOffset || 0);
      Game.Renderer.drawRectAbsolute(Math.floor(patch.x), Math.floor(y), patch.w, patch.h, 'rgba(' + base + ',' + (patch.alpha * alphaScale) + ')');
    }
  }

  function drawSteam(system, alphaScale) {
    fillScreen('rgba(210,235,245,0.05)', alphaScale);
    for (var i = 0; i < system.particles.length; i++) {
      var puff = system.particles[i];
      var alpha = clamp((puff.life / puff.maxLife) * 0.4, 0.0, 0.4) * alphaScale;
      Game.Renderer.drawRectAbsolute(Math.floor(puff.x), Math.floor(puff.y), puff.size, puff.size + 1, 'rgba(240,250,255,' + alpha + ')');
    }
  }

  function drawLeaves(system, alphaScale, isSakura) {
    var bgAlpha = isSakura ? '0.04' : '0.08';
    var bgColor = isSakura ? '255,220,230' : '160,120,80';
    fillScreen('rgba(' + bgColor + ',' + bgAlpha + ')', alphaScale);
    
    for (var i = 0; i < system.particles.length; i++) {
      var leaf = system.particles[i];
      var drawX = Math.floor(leaf.x);
      var drawY = Math.floor(leaf.y);
      // サイン波で横幅を変え、ヒラヒラと裏返る様子を表現
      var flipW = Math.max(1, Math.abs(Math.sin(leaf.flipPhase)) * 3);
      
      Game.Renderer.drawRectAbsolute(drawX, drawY, Math.floor(flipW), 3, leaf.color);
      if (!isSakura && Math.sin(leaf.flipPhase) > 0.8) {
        Game.Renderer.drawRectAbsolute(drawX, drawY, 1, 1, 'rgba(255,240,210,' + (0.5 * alphaScale) + ')');
      }
    }
  }

  function drawNight(system, alphaScale) {
    var playerPos = getPlayerScreenPosition();
    var cellSize = 16; // より細かく滑らかなグラデーションに

    // 全体を深い夜色で覆う
    fillScreen('rgba(8,12,30,' + (0.85 * alphaScale) + ')', 1);

    // 主人公の周りだけ光（透明な穴）を疑似的に開ける
    for (var gy = 0; gy < SCREEN_HEIGHT; gy += cellSize) {
      for (var gx = 0; gx < SCREEN_WIDTH; gx += cellSize) {
        var dx = (gx + cellSize / 2) - playerPos.x;
        var dy = (gy + cellSize / 2) - playerPos.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 120) {
          // 近いほど夜の闇を薄くする（疑似的な乗算クリアができないため、薄い黄色を重ねて明かりを表現）
          var lightAlpha = (1 - (dist / 120)) * 0.25 * alphaScale;
          Game.Renderer.drawRectAbsolute(gx, gy, cellSize, cellSize, 'rgba(255,230,150,' + lightAlpha + ')');
        }
      }
    }

    for (var i = 0; i < system.particles.length; i++) {
      var star = system.particles[i];
      if (star.visible) {
        var starAlpha = ((frameCount + star.twinkleOffset) % 20 < 10 ? 0.9 : 0.3) * alphaScale;
        Game.Renderer.drawRectAbsolute(star.x, star.y, 1, 1, star.color);
      }
    }
  }

  function drawAsh(system, alphaScale) {
    fillScreen('rgba(40,10,10,0.1)', alphaScale);
    for (var i = 0; i < system.particles.length; i++) {
      var ash = system.particles[i];
      var glow = Math.abs(Math.sin(ash.life)); // 0.0 ~ 1.0 で明滅
      var a = (0.3 + glow * 0.7) * alphaScale;
      
      // 暗い灰色の場合は明滅させない
      if (ash.color === '#2a2626' || ash.color === '#4a4040') a = 0.6 * alphaScale;
      
      var cStr = ash.color; // hex to rgba approximation is hard without a helper, so we just draw over it
      // 1px ずつ描画
      Game.Renderer.drawRectAbsolute(Math.floor(ash.x), Math.floor(ash.y), ash.size, ash.size, ash.color);
      // 光るエフェクト（白を重ねる）
      if (glow > 0.8 && ash.color.indexOf('#8c') !== -1) {
        Game.Renderer.drawRectAbsolute(Math.floor(ash.x), Math.floor(ash.y), 1, 1, 'rgba(255,255,200,' + (0.8*alphaScale) + ')');
      }
    }
  }

  function drawSunbeams(system, alphaScale) {
    // 画面全体にうっすらと暖色フィルター
    fillScreen('rgba(255,220,150,0.06)', alphaScale);
    
    // 斜めの光の帯（固定）
    Game.Renderer.drawRectAbsolute(40, 0, 80, SCREEN_HEIGHT, 'rgba(255,245,200,' + (0.05 * alphaScale) + ')');
    Game.Renderer.drawRectAbsolute(200, 0, 120, SCREEN_HEIGHT, 'rgba(255,245,200,' + (0.04 * alphaScale) + ')');
    Game.Renderer.drawRectAbsolute(380, 0, 60, SCREEN_HEIGHT, 'rgba(255,245,200,' + (0.06 * alphaScale) + ')');

    // 漂う塵
    for (var i = 0; i < system.particles.length; i++) {
      var mote = system.particles[i];
      var a = Math.abs(Math.sin(mote.alphaPhase)) * 0.6 * alphaScale;
      Game.Renderer.drawRectAbsolute(Math.floor(mote.x), Math.floor(mote.y), 1, 1, 'rgba(255,250,200,' + a + ')');
    }
  }

  function drawType(type, alphaScale) {
    alphaScale = alphaScale === undefined ? 1 : alphaScale;
    switch (type) {
      case 'rain':          drawRain(systems.rain, alphaScale, false); break;
      case 'storm':         drawRain(systems.storm, alphaScale, true); break;
      case 'snow':          drawSnow(systems.snow, alphaScale); break;
      case 'fog':           drawFog(systems.fog, alphaScale, '245,255,255'); break; // 白い霧
      case 'onsen_steam':   drawSteam(systems.onsen_steam, alphaScale); break;
      case 'autumn_leaves': drawLeaves(systems.autumn_leaves, alphaScale, false); break;
      case 'sakura':        drawLeaves(systems.sakura, alphaScale, true); break;
      case 'night':         drawNight(systems.night, alphaScale); break;
      case 'ash':           drawAsh(systems.ash, alphaScale); break;
      case 'miasma':        drawFog(systems.miasma, alphaScale, '80,20,100'); break; // 毒々しい紫の霧
      case 'sunbeams':      drawSunbeams(systems.sunbeams, alphaScale); break;
    }
  }

  // === 状態管理 ===

  function setWeather(type) {
    type = normalizeWeather(type);
    if (targetWeather === type && transitionPhase !== 'idle') return;
    if (currentWeather === type && transitionPhase === 'idle') return;

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