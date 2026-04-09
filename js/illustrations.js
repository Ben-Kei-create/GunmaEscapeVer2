Game.Illustrations = (function() {
  var ART_WIDTH = 176;
  var ART_HEIGHT = 96;
  var cache = {};

  var EVENT_MOTION_KEYS = {
    road_trip: 'opening_highway',
    van_memory: 'van_memory',
    border_glitch: 'border_glitch',
    forest_wake: 'forest_wake',
    dawn_frontier: 'frontier_dawn',
    white_girl_dawn: 'white_girl_dawn',
    white_girl_platform: 'white_girl_platform',
    white_girl_threshold: 'white_girl_threshold',
    gururin_stop: 'gururin_loop',
    gururin_loop: 'gururin_loop',
    akagi_approach: 'akagi_approach',
    sulfur_ridge: 'sulfur_ridge',
    school_hall: 'school_hall',
    tunnel_drift: 'tunnel_drift',
    lake_mist: 'lake_mist',
    marsh_breath: 'marsh_breath',
    valley_crosswind: 'valley_crosswind',
    boundary_gate: 'boundary_gate',
    constellation_altar: 'constellation_altar'
  };

  var EVENT_ID_KEYS = {
    opening: 'opening_highway',
    special_dice_intro: 'frontier_dawn',
    gururin: 'gururin_loop',
    arrival_forest_auto: 'forest_wake',
    arrival_takasaki_auto: 'akagi_approach',
    arrival_tsumagoi_auto: 'valley_crosswind',
    arrival_shimonita_auto: 'valley_crosswind',
    arrival_tomioka_auto: 'akagi_approach',
    arrival_tamura_auto: 'akagi_approach',
    arrival_kusatsu_auto: 'sulfur_ridge',
    arrival_konuma_auto: 'lake_mist',
    arrival_onuma_auto: 'lake_mist',
    arrival_ikaho_auto: 'frontier_dawn',
    arrival_akagi_ranch_auto: 'forest_wake',
    arrival_akagi_shrine_auto: 'forest_wake',
    arrival_shirane_trail_auto: 'sulfur_ridge',
    arrival_kusatsu_deep_auto: 'sulfur_ridge',
    arrival_jomo_gakuen_auto: 'school_hall',
    arrival_tanigawa_tunnel_auto: 'tunnel_drift',
    arrival_haruna_lake_auto: 'lake_mist',
    arrival_oze_marsh_auto: 'marsh_breath',
    arrival_minakami_valley_auto: 'valley_crosswind',
    arrival_border_tunnel_auto: 'boundary_gate'
  };

  var BOSS_KEYS = {
    ruined_checkpoint: 'boss_ruined_checkpoint',
    darumaMaster: 'boss_daruma_master',
    threadMaiden: 'boss_thread_maiden',
    echo_guardian: 'boss_echo_guardian',
    haruna_lake_beast: 'boss_haruna_beast',
    oze_mud_wraith: 'boss_oze_wraith',
    juke_final: 'boss_boundary_final'
  };

  function createCanvas() {
    var canvas = document.createElement('canvas');
    canvas.width = ART_WIDTH;
    canvas.height = ART_HEIGHT;
    return canvas;
  }

  function fillRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  function drawBands(ctx, colors) {
    var bandH = Math.ceil(ART_HEIGHT / colors.length);
    for (var i = 0; i < colors.length; i++) {
      fillRect(ctx, 0, i * bandH, ART_WIDTH, bandH, colors[i]);
    }
  }

  function drawStars(ctx, color, count, seed) {
    var value = seed || 17;
    for (var i = 0; i < count; i++) {
      value = (value * 37 + 19) % 9973;
      var x = value % ART_WIDTH;
      value = (value * 41 + 7) % 9973;
      var y = value % 42;
      fillRect(ctx, x, y, 1 + (value % 2), 1, color);
    }
  }

  function drawMountainLayer(ctx, baseY, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, ART_HEIGHT);
    ctx.lineTo(0, baseY + points[0]);
    for (var i = 1; i < points.length; i++) {
      var x = (ART_WIDTH / (points.length - 1)) * i;
      ctx.lineTo(x, baseY + points[i]);
    }
    ctx.lineTo(ART_WIDTH, ART_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  function drawRoad(ctx, topY, bottomY, topW, bottomW, color) {
    var centerX = Math.floor(ART_WIDTH * 0.5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX - topW * 0.5, topY);
    ctx.lineTo(centerX + topW * 0.5, topY);
    ctx.lineTo(centerX + bottomW * 0.5, bottomY);
    ctx.lineTo(centerX - bottomW * 0.5, bottomY);
    ctx.closePath();
    ctx.fill();
  }

  function drawLaneMarkers(ctx, topY, bottomY, color) {
    for (var i = 0; i < 7; i++) {
      var t = i / 6;
      var y = topY + (bottomY - topY) * t;
      var w = 2 + t * 5;
      var h = 3 + t * 6;
      fillRect(ctx, ART_WIDTH * 0.5 - w * 0.5, y, w, h, color);
    }
  }

  function drawTreeLine(ctx, baseY, colorDark, colorLight) {
    for (var i = 0; i < 9; i++) {
      var x = 4 + i * 20;
      fillRect(ctx, x + 5, baseY + 10, 4, 12, colorDark);
      fillRect(ctx, x + 2, baseY + 3, 10, 8, colorLight);
      fillRect(ctx, x, baseY + 7, 14, 5, colorDark);
    }
  }

  function drawFigure(ctx, x, y, palette) {
    fillRect(ctx, x + 2, y, 4, 5, palette.skin || '#d7c1b2');
    fillRect(ctx, x + 1, y + 5, 6, 7, palette.coat || '#274b8c');
    fillRect(ctx, x, y + 6, 1, 5, palette.shadow || '#1b2238');
    fillRect(ctx, x + 7, y + 6, 1, 5, palette.shadow || '#1b2238');
    fillRect(ctx, x + 2, y + 12, 2, 5, palette.leg || '#2b2a31');
    fillRect(ctx, x + 4, y + 12, 2, 5, palette.leg || '#2b2a31');
  }

  function drawAngelGirl(ctx, x, y, palette) {
    palette = palette || {};
    fillRect(ctx, x + 4, y, 4, 5, palette.hair || '#f3f7ff');
    fillRect(ctx, x + 3, y + 1, 6, 4, palette.skin || '#e8d8cd');
    fillRect(ctx, x + 1, y + 4, 10, 4, palette.hair || '#f3f7ff');
    fillRect(ctx, x, y + 7, 12, 3, palette.halo || '#d9ecff');
    fillRect(ctx, x - 4, y + 8, 4, 10, palette.wing || '#dce8ff');
    fillRect(ctx, x + 12, y + 8, 4, 10, palette.wing || '#dce8ff');
    fillRect(ctx, x - 2, y + 10, 16, 3, palette.wingShadow || '#a7c2ea');
    fillRect(ctx, x + 3, y + 6, 6, 3, palette.collar || '#8cb9ff');
    fillRect(ctx, x + 2, y + 9, 8, 11, palette.dress || '#f8fbff');
    fillRect(ctx, x + 1, y + 14, 10, 7, palette.skirt || '#d7ebff');
    fillRect(ctx, x + 3, y + 21, 2, 5, palette.leg || '#d8dbe7');
    fillRect(ctx, x + 7, y + 21, 2, 5, palette.leg || '#d8dbe7');
    fillRect(ctx, x + 2, y + 25, 3, 2, palette.shoe || '#5c76a8');
    fillRect(ctx, x + 7, y + 25, 3, 2, palette.shoe || '#5c76a8');
    fillRect(ctx, x + 4, y + 10, 1, 1, palette.eye || '#3b5f97');
    fillRect(ctx, x + 7, y + 10, 1, 1, palette.eye || '#3b5f97');
    fillRect(ctx, x + 5, y + 12, 2, 1, palette.mouth || '#cda9b3');
  }

  function drawSteamPlumes(ctx, color, alphaColor) {
    for (var i = 0; i < 6; i++) {
      var x = 16 + i * 24;
      fillRect(ctx, x, 34 - (i % 2) * 4, 5, 20, alphaColor);
      fillRect(ctx, x + 3, 22 - (i % 3) * 3, 6, 18, color);
    }
  }

  function drawGlow(ctx, x, y, radius, color, halo) {
    fillRect(ctx, x - radius, y - radius, radius * 2, radius * 2, halo);
    fillRect(ctx, x - Math.floor(radius / 2), y - Math.floor(radius / 2), radius, radius, color);
  }

  function drawWater(ctx, y, color, highlight) {
    fillRect(ctx, 0, y, ART_WIDTH, ART_HEIGHT - y, color);
    for (var i = 0; i < 11; i++) {
      fillRect(ctx, 8 + i * 15, y + 6 + (i % 3) * 5, 7, 1, highlight);
      fillRect(ctx, 4 + i * 15, y + 14 + (i % 2) * 4, 9, 1, highlight);
    }
  }

  function drawMist(ctx, y, color) {
    for (var i = 0; i < 6; i++) {
      fillRect(ctx, 8 + i * 28, y + (i % 2) * 6, 36, 8, color);
    }
  }

  function drawWindows(ctx, rows, cols, color, startX, startY, gapX, gapY) {
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        fillRect(ctx, startX + x * gapX, startY + y * gapY, 4, 4, color);
      }
    }
  }

  function drawThreads(ctx, startX, endX, colorA, colorB) {
    for (var i = 0; i < 9; i++) {
      fillRect(ctx, startX + i * 8, 8, 1, 70, i % 2 === 0 ? colorA : colorB);
      fillRect(ctx, startX + i * 8 + 2, 12, 1, 66, i % 2 === 0 ? colorB : colorA);
    }
    fillRect(ctx, startX - 6, 16, endX - startX + 12, 3, '#3a2538');
    fillRect(ctx, startX - 6, 72, endX - startX + 12, 3, '#3a2538');
  }

  function drawNoise(ctx, color, stride, offset) {
    for (var y = offset || 0; y < ART_HEIGHT; y += stride || 4) {
      for (var x = (y * 7) % 11; x < ART_WIDTH; x += 17) {
        fillRect(ctx, x, y, 1, 1, color);
      }
    }
  }

  function renderArt(key) {
    var canvas = createCanvas();
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    switch (key) {
      case 'opening_highway':
        drawBands(ctx, ['#03050d', '#0a1021', '#111a2f', '#111827']);
        drawStars(ctx, '#9aa6c9', 24, 13);
        drawMountainLayer(ctx, 40, [18, 8, 12, 4, 15, 9, 13], '#10152a');
        drawRoad(ctx, 30, ART_HEIGHT, 26, 130, '#05070f');
        drawLaneMarkers(ctx, 30, ART_HEIGHT - 8, '#f0d25d');
        fillRect(ctx, 0, 74, ART_WIDTH, 8, '#162038');
        fillRect(ctx, 18, 78, 26, 14, '#090c16');
        fillRect(ctx, 24, 84, 4, 2, '#b24d57');
        fillRect(ctx, 34, 84, 4, 2, '#b24d57');
        break;
      case 'van_memory':
        drawBands(ctx, ['#06080f', '#0d1220', '#151a2d', '#1a2032']);
        fillRect(ctx, 0, 0, ART_WIDTH, 12, '#03050b');
        fillRect(ctx, 0, 12, ART_WIDTH, 14, '#0c111d');
        fillRect(ctx, 24, 18, 128, 34, '#1d2537');
        fillRect(ctx, 30, 24, 116, 22, '#273045');
        drawRoad(ctx, 28, 60, 44, 110, '#10141f');
        drawLaneMarkers(ctx, 31, 56, '#e0c66a');
        fillRect(ctx, 82, 8, 12, 6, '#0f1522');
        fillRect(ctx, 86, 14, 4, 8, '#0f1522');
        drawFigure(ctx, 40, 54, { skin: '#b89984', coat: '#32486a', shadow: '#1e2330', leg: '#23222a' });
        drawFigure(ctx, 82, 48, { skin: '#c3a58f', coat: '#4c4059', shadow: '#252334', leg: '#2a2834' });
        drawFigure(ctx, 122, 52, { skin: '#a68f80', coat: '#4f5c73', shadow: '#1f2533', leg: '#272733' });
        drawNoise(ctx, 'rgba(255,255,255,0.08)', 6, 4);
        break;
      case 'border_glitch':
        drawBands(ctx, ['#04070e', '#091120', '#10182b', '#151829']);
        drawRoad(ctx, 36, ART_HEIGHT, 34, 110, '#070a12');
        drawLaneMarkers(ctx, 40, ART_HEIGHT - 8, '#ffe588');
        fillRect(ctx, 28, 24, 120, 4, '#4c566f');
        fillRect(ctx, 36, 28, 4, 26, '#4c566f');
        fillRect(ctx, 136, 28, 4, 26, '#4c566f');
        fillRect(ctx, 42, 40, 92, 2, '#8c98c4');
        fillRect(ctx, 54, 17, 68, 5, '#b6c2db');
        for (var g = 0; g < 8; g++) {
          fillRect(ctx, 18 + g * 18, 18 + (g % 3) * 11, 16, 2, g % 2 ? '#ff5a6e' : '#7bc8ff');
        }
        break;
      case 'forest_wake':
        drawBands(ctx, ['#09120a', '#142114', '#1f2e18', '#26341f']);
        fillRect(ctx, 0, 0, ART_WIDTH, 18, '#07070b');
        fillRect(ctx, 128, 0, 22, 10, '#612030');
        fillRect(ctx, 150, 0, 8, 12, '#7c243a');
        drawTreeLine(ctx, 26, '#1b2416', '#314225');
        fillRect(ctx, 0, 68, ART_WIDTH, 28, '#24291c');
        drawFigure(ctx, 78, 60, { skin: '#d2ba9f', coat: '#273a62', shadow: '#1d2230', leg: '#262631' });
        fillRect(ctx, 69, 74, 22, 4, '#3d4332');
        fillRect(ctx, 72, 77, 18, 2, '#5b2a30');
        break;
      case 'frontier_dawn':
        drawBands(ctx, ['#1b1627', '#3a2542', '#70506b', '#d98b54', '#f2cf9a']);
        drawMountainLayer(ctx, 46, [10, 16, 6, 12, 4, 15, 8], '#2b2140');
        fillRect(ctx, 0, 62, ART_WIDTH, 34, '#28324f');
        drawRoad(ctx, 48, ART_HEIGHT, 22, 86, '#6f604e');
        drawFigure(ctx, 120, 48, { skin: '#c9ab93', coat: '#3c5ea9', shadow: '#27324a', leg: '#2d2c33' });
        fillRect(ctx, 18, 48, 22, 18, '#433c48');
        fillRect(ctx, 42, 44, 14, 22, '#2a3146');
        fillRect(ctx, 23, 54, 5, 5, '#f6c963');
        break;
      case 'white_girl_dawn':
        drawBands(ctx, ['#12182c', '#25355c', '#6b83bb', '#b9d3ff', '#eef6ff']);
        drawMountainLayer(ctx, 48, [10, 14, 8, 16, 7, 13, 9], '#20304f');
        fillRect(ctx, 0, 58, ART_WIDTH, 38, '#5d6f8f');
        drawRoad(ctx, 54, ART_HEIGHT, 18, 72, '#6a6475');
        fillRect(ctx, 20, 46, 4, 30, '#6d7898');
        fillRect(ctx, 14, 44, 18, 6, '#edf5ff');
        fillRect(ctx, 118, 42, 26, 14, '#24304a');
        fillRect(ctx, 122, 46, 18, 6, '#9bd0ff');
        fillRect(ctx, 112, 56, 8, 26, '#2e3b55');
        fillRect(ctx, 0, 76, ART_WIDTH, 20, '#39465f');
        fillRect(ctx, 108, 64, 34, 2, '#f2f7ff');
        drawAngelGirl(ctx, 70, 38, {
          hair: '#f6fbff',
          skin: '#ecd9d2',
          wing: '#f1f6ff',
          wingShadow: '#b7ccf4',
          collar: '#8ab8ff',
          dress: '#ffffff',
          skirt: '#d9edff',
          shoe: '#5d78ae'
        });
        fillRect(ctx, 66, 34, 20, 2, 'rgba(255,255,255,0.6)');
        break;
      case 'white_girl_platform':
        drawBands(ctx, ['#08101f', '#10203b', '#1b3558', '#315784']);
        fillRect(ctx, 0, 62, ART_WIDTH, 34, '#182433');
        fillRect(ctx, 0, 70, ART_WIDTH, 2, '#f4f8ff');
        fillRect(ctx, 0, 74, ART_WIDTH, 18, '#39475d');
        fillRect(ctx, 124, 18, 5, 56, '#5d6986');
        fillRect(ctx, 112, 18, 30, 7, '#edf5ff');
        fillRect(ctx, 32, 42, 34, 6, '#52607a');
        fillRect(ctx, 34, 48, 4, 10, '#404e68');
        fillRect(ctx, 58, 48, 4, 10, '#404e68');
        for (var p = 0; p < 5; p++) {
          fillRect(ctx, 14 + p * 30, 28 + (p % 2) * 8, 3, 1, '#dfefff');
        }
        drawAngelGirl(ctx, 82, 34, {
          hair: '#eef6ff',
          skin: '#ecd9d2',
          wing: '#eef5ff',
          wingShadow: '#abc3eb',
          collar: '#78aef8',
          dress: '#ffffff',
          skirt: '#d5e9ff',
          shoe: '#4e6b98'
        });
        fillRect(ctx, 74, 61, 24, 3, '#aacdff');
        break;
      case 'white_girl_threshold':
        drawBands(ctx, ['#040814', '#0a1022', '#12203a', '#1b2d50']);
        fillRect(ctx, 0, 58, ART_WIDTH, 38, '#121829');
        fillRect(ctx, 18, 20, 140, 6, '#d8ebff');
        fillRect(ctx, 28, 26, 6, 48, '#394762');
        fillRect(ctx, 142, 26, 6, 48, '#394762');
        fillRect(ctx, 44, 56, 88, 4, '#f4f7ff');
        fillRect(ctx, 44, 62, 88, 2, '#91bcff');
        for (var b = 0; b < 6; b++) {
          fillRect(ctx, 30 + b * 20, 34 + (b % 3) * 7, 10, 1, b % 2 ? '#8ecbff' : '#ffffff');
        }
        drawAngelGirl(ctx, 78, 30, {
          hair: '#f7fbff',
          skin: '#efdcd4',
          wing: '#f2f7ff',
          wingShadow: '#aac6f3',
          collar: '#7fb2ff',
          dress: '#ffffff',
          skirt: '#dceeff',
          shoe: '#5873a6'
        });
        fillRect(ctx, 66, 26, 24, 2, 'rgba(210,232,255,0.75)');
        fillRect(ctx, 74, 70, 16, 2, '#f8fbff');
        break;
      case 'gururin_loop':
        drawBands(ctx, ['#0a0d16', '#10172a', '#16223a', '#1d273b']);
        fillRect(ctx, 0, 72, ART_WIDTH, 24, '#2f2b26');
        fillRect(ctx, 22, 42, 116, 26, '#2f7e4e');
        fillRect(ctx, 30, 46, 24, 14, '#d7eef4');
        fillRect(ctx, 58, 46, 24, 14, '#d7eef4');
        fillRect(ctx, 86, 46, 24, 14, '#d7eef4');
        fillRect(ctx, 114, 46, 16, 14, '#d7eef4');
        fillRect(ctx, 12, 48, 10, 10, '#d8e4f0');
        fillRect(ctx, 12, 58, 20, 8, '#227045');
        fillRect(ctx, 134, 49, 18, 6, '#f2e48b');
        fillRect(ctx, 28, 68, 16, 4, '#15181c');
        fillRect(ctx, 112, 68, 16, 4, '#15181c');
        break;
      case 'akagi_approach':
        drawBands(ctx, ['#101722', '#172439', '#22344b', '#2d3b53']);
        fillRect(ctx, 0, 68, ART_WIDTH, 28, '#2a3148');
        fillRect(ctx, 20, 44, 34, 26, '#23293b');
        fillRect(ctx, 68, 40, 24, 30, '#34384c');
        fillRect(ctx, 110, 48, 20, 22, '#2a3045');
        fillRect(ctx, 44, 50, 4, 4, '#f3c66c');
        fillRect(ctx, 75, 46, 3, 3, '#cdd4ec');
        drawFigure(ctx, 118, 46, { skin: '#c5aa91', coat: '#366fc2', shadow: '#20304a', leg: '#292732' });
        drawFigure(ctx, 78, 54, { skin: '#d2b9a2', coat: '#394564', shadow: '#242b3a', leg: '#2a2a31' });
        break;
      case 'sulfur_ridge':
        drawBands(ctx, ['#120f12', '#332627', '#664c3d', '#c68b5d', '#f3d2ab']);
        drawMountainLayer(ctx, 34, [16, 4, 10, 0, 12, 6, 18], '#473433');
        fillRect(ctx, 0, 66, ART_WIDTH, 30, '#4b392f');
        drawSteamPlumes(ctx, '#d9d4c8', 'rgba(240,236,229,0.32)');
        drawFigure(ctx, 120, 54, { skin: '#c7aa8c', coat: '#7d3c2a', shadow: '#3d2c2d', leg: '#252228' });
        break;
      case 'school_hall':
        drawBands(ctx, ['#0d1016', '#151a25', '#1d2533', '#212939']);
        fillRect(ctx, 24, 0, 128, ART_HEIGHT, '#111821');
        fillRect(ctx, 34, 0, 2, ART_HEIGHT, '#2a3343');
        fillRect(ctx, 140, 0, 2, ART_HEIGHT, '#2a3343');
        for (var s = 0; s < 5; s++) {
          fillRect(ctx, 46 + s * 18, 18, 10, 54, '#1c2431');
          fillRect(ctx, 46 + s * 18, 18, 10, 2, '#55607b');
          fillRect(ctx, 46 + s * 18, 44, 10, 1, '#364055');
        }
        fillRect(ctx, 58, 10, 60, 3, '#dfe8f0');
        fillRect(ctx, 74, 66, 12, 18, '#0d1016');
        fillRect(ctx, 78, 68, 4, 4, '#9fa9bf');
        break;
      case 'tunnel_drift':
        drawBands(ctx, ['#090e18', '#141d2c', '#1e293b', '#2b3549']);
        fillRect(ctx, 0, 64, ART_WIDTH, 32, '#1d2431');
        fillRect(ctx, 32, 18, 112, 52, '#0c1118');
        fillRect(ctx, 42, 28, 92, 32, '#27374d');
        fillRect(ctx, 32, 18, 12, 52, '#1f2736');
        fillRect(ctx, 132, 18, 12, 52, '#1f2736');
        for (var snow = 0; snow < 18; snow++) {
          fillRect(ctx, 14 + snow * 9, 8 + (snow * 5) % 48, 2, 1, '#dce5f1');
        }
        drawRoad(ctx, 56, ART_HEIGHT, 10, 88, '#3e4858');
        break;
      case 'lake_mist':
        drawBands(ctx, ['#09111a', '#142234', '#1d3551', '#4e6f7c']);
        drawWater(ctx, 54, '#1e3c4c', '#6d9ca9');
        drawMist(ctx, 46, 'rgba(221,236,242,0.22)');
        fillRect(ctx, 118, 34, 2, 26, '#241d1a');
        fillRect(ctx, 110, 42, 18, 2, '#6f4536');
        fillRect(ctx, 114, 30, 10, 2, '#6f4536');
        fillRect(ctx, 144, 44, 8, 14, '#1f2936');
        drawGlow(ctx, 148, 40, 5, '#e7d59a', 'rgba(231,213,154,0.14)');
        break;
      case 'marsh_breath':
        drawBands(ctx, ['#0a120f', '#13211b', '#1c3023', '#2a4633']);
        fillRect(ctx, 0, 58, ART_WIDTH, 38, '#25352b');
        for (var reed = 0; reed < 12; reed++) {
          fillRect(ctx, 12 + reed * 13, 48 + (reed % 3) * 2, 2, 22, '#728b5d');
        }
        fillRect(ctx, 30, 62, 84, 6, '#5f543f');
        fillRect(ctx, 40, 68, 72, 5, '#6a5f49');
        drawMist(ctx, 44, 'rgba(216,231,214,0.15)');
        fillRect(ctx, 128, 54, 12, 18, '#3a2b22');
        fillRect(ctx, 130, 52, 8, 4, '#73857f');
        break;
      case 'valley_crosswind':
        drawBands(ctx, ['#0d1520', '#172b3b', '#274661', '#56708a', '#bcd0d6']);
        drawMountainLayer(ctx, 34, [18, 8, 12, 6, 10, 16, 20], '#20344b');
        drawMountainLayer(ctx, 48, [16, 24, 14, 22, 18, 24, 16], '#2c425a');
        fillRect(ctx, 0, 72, ART_WIDTH, 24, '#394a5b');
        fillRect(ctx, 26, 50, 126, 2, '#c6d6e0');
        fillRect(ctx, 38, 52, 2, 18, '#bccdda');
        fillRect(ctx, 138, 52, 2, 18, '#bccdda');
        for (var gust = 0; gust < 5; gust++) {
          fillRect(ctx, 18 + gust * 28, 34 + (gust % 2) * 10, 10, 1, '#d6e0ea');
          fillRect(ctx, 28 + gust * 28, 35 + (gust % 2) * 10, 4, 1, '#d6e0ea');
        }
        break;
      case 'boundary_gate':
        drawBands(ctx, ['#05070d', '#0d1420', '#141f2e', '#1d2736']);
        fillRect(ctx, 40, 18, 96, 54, '#0b1118');
        fillRect(ctx, 46, 24, 84, 42, '#19242f');
        fillRect(ctx, 32, 18, 8, 54, '#46515c');
        fillRect(ctx, 136, 18, 8, 54, '#46515c');
        fillRect(ctx, 48, 30, 80, 4, '#6b778a');
        fillRect(ctx, 54, 42, 68, 2, '#d0dbec');
        for (var staticLine = 0; staticLine < 7; staticLine++) {
          fillRect(ctx, 24 + staticLine * 18, 20 + (staticLine % 4) * 12, 14, 1, staticLine % 2 ? '#89d4ff' : '#ff657f');
        }
        fillRect(ctx, 0, 74, ART_WIDTH, 22, '#11161e');
        break;
      case 'constellation_altar':
        drawBands(ctx, ['#03050b', '#0b0f1a', '#11172a', '#1f2340']);
        drawStars(ctx, '#cad8ff', 32, 41);
        fillRect(ctx, 0, 72, ART_WIDTH, 24, '#171a2b');
        fillRect(ctx, 68, 54, 40, 8, '#5a4c63');
        fillRect(ctx, 74, 46, 28, 8, '#78658d');
        fillRect(ctx, 84, 26, 8, 20, '#4b4163');
        for (var star = 0; star < 5; star++) {
          drawGlow(ctx, 48 + star * 20, 18 + (star % 2) * 6, 3, '#f0de94', 'rgba(240,222,148,0.12)');
        }
        break;
      case 'boss_ruined_checkpoint':
        drawBands(ctx, ['#090d13', '#101824', '#172434', '#253041']);
        fillRect(ctx, 0, 72, ART_WIDTH, 24, '#171b23');
        fillRect(ctx, 28, 18, 120, 52, '#0a0f15');
        fillRect(ctx, 36, 26, 104, 40, '#202733');
        fillRect(ctx, 20, 18, 10, 52, '#5a616a');
        fillRect(ctx, 148, 18, 10, 52, '#5a616a');
        fillRect(ctx, 46, 36, 84, 3, '#d4dbe8');
        fillRect(ctx, 68, 44, 40, 10, '#303949');
        fillRect(ctx, 80, 48, 16, 18, '#161b22');
        break;
      case 'boss_daruma_master':
        drawBands(ctx, ['#17090d', '#2c1018', '#5d1e2d', '#8d3d37']);
        fillRect(ctx, 0, 72, ART_WIDTH, 24, '#301711');
        fillRect(ctx, 58, 8, 60, 56, '#8d2d28');
        fillRect(ctx, 64, 16, 48, 44, '#b4473e');
        fillRect(ctx, 72, 26, 12, 10, '#f0e7da');
        fillRect(ctx, 92, 26, 12, 10, '#f0e7da');
        fillRect(ctx, 78, 30, 4, 4, '#101010');
        fillRect(ctx, 98, 30, 4, 4, '#101010');
        fillRect(ctx, 80, 44, 16, 4, '#201214');
        fillRect(ctx, 32, 50, 8, 16, '#ebc568');
        fillRect(ctx, 136, 50, 8, 16, '#ebc568');
        break;
      case 'boss_thread_maiden':
        drawBands(ctx, ['#120d19', '#241529', '#433045', '#6f5466']);
        drawThreads(ctx, 42, 132, '#f0e4da', '#b79db5');
        drawFigure(ctx, 84, 42, { skin: '#d6bfaa', coat: '#e7e0e7', shadow: '#5a4a5d', leg: '#473348' });
        fillRect(ctx, 76, 54, 24, 10, 'rgba(255,255,255,0.12)');
        fillRect(ctx, 0, 74, ART_WIDTH, 22, '#251a25');
        break;
      case 'boss_echo_guardian':
        drawBands(ctx, ['#0a0f17', '#101a28', '#183042', '#26485e']);
        fillRect(ctx, 0, 70, ART_WIDTH, 26, '#172634');
        fillRect(ctx, 72, 18, 12, 46, '#4f5b67');
        fillRect(ctx, 60, 22, 36, 8, '#6f7f8f');
        for (var wave = 0; wave < 5; wave++) {
          fillRect(ctx, 20 + wave * 24, 40 + (wave % 2) * 6, 12, 1, '#9bd8ff');
          fillRect(ctx, 24 + wave * 24, 44 + (wave % 2) * 6, 6, 1, '#9bd8ff');
        }
        drawGlow(ctx, 78, 34, 6, '#ffe6aa', 'rgba(255,230,170,0.10)');
        break;
      case 'boss_haruna_beast':
        drawBands(ctx, ['#071019', '#0d1c2c', '#17304a', '#31566d']);
        drawWater(ctx, 60, '#153543', '#6fa3b0');
        drawMist(ctx, 46, 'rgba(219,237,242,0.16)');
        ctx.fillStyle = '#0f1923';
        ctx.beginPath();
        ctx.moveTo(82, 64);
        ctx.lineTo(112, 40);
        ctx.lineTo(124, 58);
        ctx.lineTo(142, 52);
        ctx.lineTo(154, 66);
        ctx.closePath();
        ctx.fill();
        fillRect(ctx, 112, 42, 4, 4, '#d8f4f8');
        break;
      case 'boss_oze_wraith':
        drawBands(ctx, ['#08110e', '#122119', '#1a3023', '#294133']);
        fillRect(ctx, 0, 60, ART_WIDTH, 36, '#223127');
        drawMist(ctx, 44, 'rgba(221,234,218,0.16)');
        fillRect(ctx, 82, 34, 12, 26, '#3a4d3b');
        fillRect(ctx, 76, 52, 24, 10, '#51644d');
        fillRect(ctx, 74, 28, 4, 18, '#5e755e');
        fillRect(ctx, 98, 28, 4, 18, '#5e755e');
        fillRect(ctx, 84, 22, 8, 6, '#d2e0cd');
        break;
      case 'boss_boundary_final':
        drawBands(ctx, ['#05070b', '#0c1017', '#161524', '#2d2141']);
        fillRect(ctx, 30, 12, 116, 58, '#090d13');
        fillRect(ctx, 40, 22, 96, 40, '#1a1f2a');
        fillRect(ctx, 24, 12, 8, 58, '#4c4c59');
        fillRect(ctx, 146, 12, 8, 58, '#4c4c59');
        for (var line = 0; line < 12; line++) {
          fillRect(ctx, 16 + line * 13, 18 + (line % 5) * 9, 10, 1, line % 2 ? '#6fd6ff' : '#ff5f79');
        }
        fillRect(ctx, 78, 26, 20, 20, '#0c0f18');
        fillRect(ctx, 84, 32, 4, 4, '#ffffff');
        fillRect(ctx, 92, 32, 4, 4, '#ffffff');
        break;
      default:
        drawBands(ctx, ['#0b1020', '#162038', '#24324b', '#32455f']);
        drawNoise(ctx, '#90a3cc', 5, 2);
        break;
    }

    fillRect(ctx, 0, ART_HEIGHT - 1, ART_WIDTH, 1, 'rgba(255,255,255,0.08)');
    return canvas;
  }

  function getArt(key) {
    if (!key) return null;
    if (!cache[key]) {
      cache[key] = renderArt(key);
    }
    return cache[key];
  }

  function getEventKey(scene, eventId) {
    if (scene && scene.illustration && getArt(scene.illustration)) return scene.illustration;
    if (scene && scene.motion && EVENT_MOTION_KEYS[scene.motion]) return EVENT_MOTION_KEYS[scene.motion];
    return EVENT_ID_KEYS[eventId] || '';
  }

  function getBossKey(enemyId) {
    return BOSS_KEYS[enemyId] || '';
  }

  function drawCardAbsolute(key, x, y, width, height, options) {
    var art = getArt(key);
    if (!art || !Game.Renderer || !Game.Renderer.getContext) return false;
    var ctx = Game.Renderer.getContext();
    options = options || {};
    var accent = options.accent || '#8fb8ff';
    var outerX = Math.floor(x);
    var outerY = Math.floor(y);
    var outerW = Math.floor(width);
    var outerH = Math.floor(height);
    var inset = options.inset || 6;

    ctx.fillStyle = options.shadowColor || 'rgba(0,0,0,0.42)';
    ctx.fillRect(outerX + 4, outerY + 4, outerW, outerH);
    ctx.fillStyle = options.frameColor || 'rgba(7, 10, 24, 0.92)';
    ctx.fillRect(outerX, outerY, outerW, outerH);
    ctx.strokeStyle = '#f4f7ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(outerX + 1, outerY + 1, outerW - 2, outerH - 2);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(outerX + 4, outerY + 4, outerW - 8, outerH - 8);
    ctx.drawImage(art, outerX + inset, outerY + inset, outerW - inset * 2, outerH - inset * 2);

    if (options.matteAlpha) {
      ctx.fillStyle = 'rgba(7, 10, 24, ' + options.matteAlpha + ')';
      ctx.fillRect(outerX + inset, outerY + inset, outerW - inset * 2, outerH - inset * 2);
    }

    if (options.label) {
      ctx.fillStyle = 'rgba(6, 10, 24, 0.78)';
      ctx.fillRect(outerX + inset, outerY + outerH - 22, outerW - inset * 2, 16);
      if (Game.Renderer.drawTextJP) {
        Game.Renderer.drawTextJP(options.label, outerX + inset + 6, outerY + outerH - 19, accent, 8);
      }
    }
    return true;
  }

  return {
    getEventKey: getEventKey,
    getBossKey: getBossKey,
    hasKey: function(key) { return !!getArt(key); },
    drawCardAbsolute: drawCardAbsolute
  };
})();
