// Particle effects system
Game.Particles = (function() {
  var particles = [];
  var MAX_PARTICLES = 600;

  var TYPE_DEFAULTS = {
    dice_roll:      { count: 14, spread: 16, speed: 3.5 },
    damage:         { count: 16, spread: 20, speed: 4.5 },
    heal:           { count: 12, spread: 14, speed: 1.5 },
    levelup:        { count: 24, spread: 20, speed: 2.5 },
    victory:        { count: 30, spread: 24, speed: 4.0 },
    fire:           { count: 18, spread: 12, speed: 2.0 },
    onsen_steam:    { count: 10, spread: 14, speed: 0.8 },
    cherry_blossom: { count: 12, spread: 24, speed: 1.2 },
    thunder:        { count: 12, spread: 16, speed: 4.0 },
    konnyaku_bounce:{ count: 12, spread: 16, speed: 2.5 },
    
    // --- 新規追加エフェクト ---
    ritual_glow:    { count: 20, spread: 18, speed: 1.2 }, // 儀式成功時の優しい光
    dark_aura:      { count: 25, spread: 20, speed: 1.5 }, // 敵の怒り・フェーズ変化
    support_ward:   { count: 15, spread: 16, speed: 2.0 }, // 仲間支援の守り
    slash:          { count: 8,  spread: 10, speed: 5.0 }  // 鋭い斬撃の火花
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

  function addParticle(x, y, vx, vy, life, color, size, gravity, extra) {
    extra = extra || {};
    particles.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      life: life,
      maxLife: life,
      color: color,
      size: size || 2,
      gravity: gravity || 0,
      
      // 拡張プロパティ
      friction: extra.friction || 1.0,     // 空気抵抗 (1.0 = 抵抗なし, 0.9 = 毎フレーム10%減速)
      shrink: extra.shrink || 0,           // 毎フレームの縮小量
      glow: extra.glow || false,           // 背後に薄い光を描画するか
      drift: extra.drift || 0,             // 横風による流され
      floorY: extra.floorY || 320,         // バウンドする床のY座標
      bounce: extra.bounce || 0,           // バウンド係数
      flicker: extra.flicker || 0,         // 明滅の強さ
      sway: extra.sway || 0,               // 揺れの幅
      swayPhase: extra.swayPhase || 0      // 揺れの位相
    });

    while (particles.length > MAX_PARTICLES) {
      particles.shift();
    }
  }

  function emit(type, x, y, options) {
    options = options || {};
    var defaults = TYPE_DEFAULTS[type] || { count: 10, spread: 12, speed: 2 };
    var count = options.count || defaults.count;
    var spread = options.spread || defaults.spread;
    var speed = options.speed || defaults.speed;
    var i;
    var color;

    for (i = 0; i < count; i++) {
      switch (type) {
        case 'dice_roll':
          color = Math.random() > 0.35 ? [255, 220, 90] : [255, 245, 170];
          addParticle(
            x + rand(-4, 4), y + rand(-4, 4),
            rand(-speed, speed), rand(-speed * 1.5, speed * 0.2),
            randInt(14, 24), color, rand(1.5, 3), 0.15, // 重力を少し強めに
            { friction: 0.92, bounce: 0.4, floorY: y + rand(10, 20), flicker: rand(0.05, 0.1) }
          );
          break;

        case 'damage':
          // 初速はメチャクチャ速いが、すぐに減速（friction: 0.82）して血しぶきのように散る
          color = Math.random() > 0.5 ? [255, 60, 60] : [180, 10, 20];
          addParticle(
            x + rand(-spread/4, spread/4), y + rand(-spread/4, spread/4),
            rand(-speed, speed), rand(-speed, speed * 0.5),
            randInt(15, 25), color, rand(1.5, 3.5), 0.1,
            { friction: 0.82, shrink: 0.05 }
          );
          break;

        case 'slash': // 鋭い火花
          color = Math.random() > 0.5 ? [255, 255, 255] : [150, 220, 255];
          var angle = rand(0, Math.PI * 2);
          addParticle(
            x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            randInt(8, 14), color, rand(1, 2.5), 0,
            { friction: 0.85, glow: true }
          );
          break;

        case 'heal':
          // 上に向かってフワァ…と浮かび上がり、光りながら小さくなる
          color = Math.random() > 0.5 ? [90, 255, 130] : [170, 255, 190];
          addParticle(
            x + rand(-spread, spread), y + rand(-spread/2, spread/2),
            rand(-0.4, 0.4), rand(-speed - 0.5, -0.2),
            randInt(25, 40), color, rand(2, 4), -0.02, // 負の重力で上に加速
            { glow: true, shrink: 0.03, sway: rand(0.03, 0.06), swayPhase: rand(0, Math.PI * 2) }
          );
          break;

        case 'ritual_glow':
          // 儀式用。黄金色の光がゆっくりと天へ登る
          color = Math.random() > 0.4 ? [255, 214, 107] : [255, 245, 210];
          addParticle(
            x + rand(-spread, spread), y + rand(-spread, spread),
            rand(-0.2, 0.2), rand(-speed, -0.5),
            randInt(40, 70), color, rand(2, 5), -0.01,
            { glow: true, shrink: 0.02, flicker: 0.05, sway: rand(0.01, 0.03), swayPhase: rand(0, Math.PI*2) }
          );
          break;

        case 'support_ward':
          // 仲間の支援用。円形に広がる光
          color = Math.random() > 0.5 ? [143, 224, 255] : [216, 230, 255];
          var rad = (i / count) * Math.PI * 2; // 放射状に配置
          var v = rand(speed * 0.5, speed);
          addParticle(
            x + Math.cos(rad) * 4, y + Math.sin(rad) * 4,
            Math.cos(rad) * v, Math.sin(rad) * v,
            randInt(20, 30), color, rand(2, 3), 0,
            { friction: 0.85, glow: true, shrink: 0.05 } // すぐに減速して光る
          );
          break;

        case 'dark_aura':
          // ボス覚醒・怒り。紫や黒の瘴気が上に立ち上る
          color = Math.random() > 0.5 ? [100, 30, 120] : [30, 15, 40];
          addParticle(
            x + rand(-spread, spread), y + rand(-spread/2, spread),
            rand(-0.5, 0.5), rand(-speed, -0.2),
            randInt(30, 50), color, rand(3, 6), -0.03,
            { friction: 0.95, shrink: 0.04, sway: 0.05, swayPhase: rand(0, Math.PI*2) }
          );
          break;

        case 'levelup':
          color = Math.random() > 0.5 ? [255, 210, 70] : [255, 245, 180];
          var luRad = (i / Math.max(count, 1)) * Math.PI * 2;
          addParticle(
            x + Math.cos(luRad) * rand(2, spread * 0.35),
            y + Math.sin(luRad) * rand(2, spread * 0.35),
            Math.cos(luRad) * speed * rand(0.5, 1.2),
            Math.sin(luRad) * speed * rand(0.5, 1.2) - 1.0, // 上方向へのバイアス
            randInt(25, 40), color, rand(2.5, 4.5), 0.05,
            { friction: 0.9, glow: true, shrink: 0.04, sway: rand(0.05, 0.09), swayPhase: i * 0.4 }
          );
          break;

        case 'victory':
          var confettiColors = [
            [255, 80, 80], [80, 220, 255], [255, 230, 80], [120, 255, 120], [255, 130, 220], [255, 255, 255]
          ];
          color = confettiColors[randInt(0, confettiColors.length - 1)];
          addParticle(
            x + rand(-spread, spread), y + rand(-spread/2, spread/2),
            rand(-speed, speed), rand(-speed * 1.5, -speed * 0.5),
            randInt(30, 60), color, rand(2, 4), 0.08, // 紙吹雪のように落ちる
            { friction: 0.96, flicker: rand(0.05, 0.15), sway: 0.1, swayPhase: rand(0, Math.PI*2) }
          );
          break;

        case 'fire':
          // 白→黄→赤→灰と色が温度で変わるような表現を shrink と組み合わせて行う
          color = Math.random() > 0.3 ? [255, 120, 30] : [255, 200, 50];
          addParticle(
            x + rand(-spread * 0.4, spread * 0.4), y + rand(-4, 4),
            rand(-0.6, 0.6), rand(-speed, -speed * 0.3),
            randInt(15, 25), color, rand(3, 5), -0.02,
            { friction: 0.9, glow: true, shrink: 0.1, flicker: rand(0.1, 0.2), sway: rand(0.03, 0.06), swayPhase: rand(0, Math.PI * 2) }
          );
          break;

        case 'onsen_steam':
          color = Math.random() > 0.4 ? [255, 255, 255] : [210, 235, 255];
          addParticle(
            x + rand(-spread, spread), y + rand(-4, 4),
            rand(-0.3, 0.3), rand(-speed, -0.2),
            randInt(30, 50), color, rand(3, 6), -0.005,
            { friction: 0.95, shrink: 0.05, sway: rand(0.04, 0.08), swayPhase: rand(0, Math.PI * 2) }
          );
          break;

        case 'thunder':
          color = Math.random() > 0.4 ? [255, 255, 180] : [220, 240, 255];
          addParticle(
            x + rand(-spread, spread), y + rand(-spread, spread),
            rand(-speed, speed), rand(-speed, speed),
            randInt(6, 12), color, rand(2, 4), 0,
            { friction: 0.8, glow: true, shrink: 0.2, flicker: 0.3 }
          );
          break;
          
        case 'konnyaku_bounce':
        case 'cherry_blossom':
          // （既存の良さを残しつつ、少しパラメータ調整）
          color = type === 'cherry_blossom' ? 
                  (Math.random() > 0.5 ? [255, 190, 215] : [245, 160, 200]) :
                  (Math.random() > 0.45 ? [150, 150, 150] : [210, 210, 210]);
          addParticle(
            x + rand(-spread, spread), y + rand(-spread, spread),
            rand(-speed*0.5, speed*0.5), rand(-speed, speed*0.5),
            randInt(20, 40), color, rand(2, 3), type === 'konnyaku_bounce' ? 0.2 : 0.02,
            { friction: 0.95, bounce: type === 'konnyaku_bounce' ? 0.4 : 0, floorY: y + rand(8, 18), sway: type === 'cherry_blossom' ? 0.08 : 0, swayPhase: rand(0, Math.PI*2) }
          );
          break;

        default:
          addParticle(
            x, y, rand(-speed, speed), rand(-speed, speed),
            randInt(12, 20), [255, 255, 255], rand(2, 3), 0.05,
            { friction: 0.9, shrink: 0.05 }
          );
          break;
      }
    }
  }

  function update() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];

      // 空気抵抗（摩擦）
      p.vx *= p.friction;
      p.vy *= p.friction;

      p.x += p.vx;
      p.y += p.vy;

      if (p.sway) {
        p.swayPhase += p.sway;
        p.x += Math.sin(p.swayPhase) * 0.3;
      }

      if (p.gravity !== 0) {
        p.vy += p.gravity;
      }

      if (p.bounce > 0 && p.y >= p.floorY) {
        p.y = p.floorY;
        p.vy = -Math.abs(p.vy) * p.bounce;
        p.bounce *= 0.75;
        p.vx *= 0.8; // バウンド時に横方向も少し減速
      }

      // サイズの縮小
      if (p.shrink > 0) {
        p.size -= p.shrink;
      }

      p.life--;

      if (p.life <= 0 || p.size <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function draw() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.size <= 0) continue;

      var alpha = clamp(p.life / p.maxLife, 0, 1);
      
      // 火や雷のチカチカした明滅効果
      if (p.flicker) {
        alpha *= 0.7 + Math.sin((p.maxLife - p.life) * p.flicker * 10) * 0.3;
      }
      alpha = clamp(alpha, 0, 1);

      // ピクセルアートのシャープさを保つため、座標は整数化
      var px = Math.round(p.x);
      var py = Math.round(p.y);
      var pSize = Math.max(1, Math.round(p.size));

      // 発光（Glow）エフェクト: 背後に薄く大きな四角を描く
      if (p.glow) {
        var glowAlpha = alpha * 0.35;
        var glowColor = 'rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',' + glowAlpha.toFixed(3) + ')';
        var glowSize = pSize + 2;
        Game.Renderer.drawRectAbsolute(px - 1, py - 1, glowSize, glowSize, glowColor);
      }

      // 芯（コア）の描画
      var color = 'rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',' + alpha.toFixed(3) + ')';
      Game.Renderer.drawRectAbsolute(px, py, pSize, pSize, color);
    }
  }

  function clear() {
    particles = [];
  }

  return {
    emit: emit,
    update: update,
    draw: draw,
    clear: clear
  };
})();