// Particle effects system
Game.Particles = (function() {
  var particles = [];
  var MAX_PARTICLES = 500;

  var TYPE_DEFAULTS = {
    dice_roll: { count: 14, spread: 16, speed: 2.2 },
    damage: { count: 12, spread: 18, speed: 2.8 },
    heal: { count: 10, spread: 12, speed: 1.2 },
    levelup: { count: 18, spread: 16, speed: 1.8 },
    victory: { count: 24, spread: 22, speed: 3.0 },
    fire: { count: 14, spread: 12, speed: 1.5 },
    onsen_steam: { count: 8, spread: 12, speed: 0.5 },
    cherry_blossom: { count: 10, spread: 24, speed: 1.0 },
    thunder: { count: 10, spread: 14, speed: 3.2 },
    konnyaku_bounce: { count: 10, spread: 14, speed: 2.0 }
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
      size: clamp(size || 2, 1, 3),
      gravity: gravity || 0,
      drift: extra.drift || 0,
      floorY: extra.floorY || 320,
      bounce: extra.bounce || 0,
      flicker: extra.flicker || 0,
      sway: extra.sway || 0,
      swayPhase: extra.swayPhase || 0
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
            x + rand(-4, 4),
            y + rand(-4, 4),
            rand(-speed, speed),
            rand(-speed - 0.6, speed * 0.2),
            randInt(14, 24),
            color,
            randInt(1, 3),
            0.03,
            { flicker: rand(0.08, 0.16) }
          );
          break;

        case 'damage':
          color = Math.random() > 0.5 ? [255, 70, 70] : [190, 20, 20];
          addParticle(
            x + rand(-2, 2),
            y + rand(-2, 2),
            rand(-spread / 8, spread / 8),
            rand(-speed - 1.2, speed * 0.4),
            randInt(12, 20),
            color,
            randInt(1, 3),
            0.16
          );
          break;

        case 'heal':
          color = Math.random() > 0.5 ? [90, 255, 130] : [170, 255, 190];
          addParticle(
            x + rand(-spread, spread),
            y + rand(-3, 3),
            rand(-0.3, 0.3),
            rand(-speed - 0.5, -0.4),
            randInt(22, 34),
            color,
            randInt(1, 3),
            -0.01,
            { sway: rand(0.03, 0.07), swayPhase: rand(0, Math.PI * 2) }
          );
          break;

        case 'levelup':
          color = Math.random() > 0.5 ? [255, 210, 70] : [255, 245, 180];
          addParticle(
            x + Math.cos(i / Math.max(count, 1) * Math.PI * 2) * rand(2, spread * 0.35),
            y + Math.sin(i / Math.max(count, 1) * Math.PI * 2) * rand(2, spread * 0.35),
            rand(-0.6, 0.6),
            rand(-speed - 0.6, -0.8),
            randInt(24, 38),
            color,
            randInt(1, 3),
            -0.005,
            { sway: rand(0.05, 0.09), swayPhase: i * 0.4 }
          );
          break;

        case 'victory':
          var confettiColors = [
            [255, 80, 80], [80, 220, 255], [255, 230, 80], [120, 255, 120], [255, 130, 220]
          ];
          color = confettiColors[randInt(0, confettiColors.length - 1)];
          addParticle(
            x + rand(-6, 6),
            y + rand(-6, 6),
            rand(-speed, speed),
            rand(-speed - 2.4, -0.3),
            randInt(24, 40),
            color,
            randInt(1, 3),
            0.18,
            { flicker: rand(0.02, 0.08) }
          );
          break;

        case 'fire':
          color = Math.random() > 0.45 ? [255, 140, 40] : [255, 70, 20];
          addParticle(
            x + rand(-spread * 0.4, spread * 0.4),
            y + rand(-2, 2),
            rand(-0.4, 0.4),
            rand(-speed - 0.6, -0.2),
            randInt(12, 20),
            color,
            randInt(1, 3),
            -0.01,
            { flicker: rand(0.08, 0.16), sway: rand(0.03, 0.06), swayPhase: rand(0, Math.PI * 2) }
          );
          break;

        case 'onsen_steam':
          color = Math.random() > 0.4 ? [255, 255, 255] : [210, 235, 255];
          addParticle(
            x + rand(-spread, spread),
            y + rand(-2, 2),
            rand(-0.2, 0.2),
            rand(-speed, -0.1),
            randInt(30, 48),
            color,
            randInt(1, 3),
            -0.003,
            { sway: rand(0.04, 0.08), swayPhase: rand(0, Math.PI * 2) }
          );
          break;

        case 'cherry_blossom':
          color = Math.random() > 0.5 ? [255, 190, 215] : [245, 160, 200];
          addParticle(
            x + rand(-spread, spread),
            y + rand(-spread * 0.3, spread * 0.3),
            rand(speed * 0.15, speed * 0.6),
            rand(-0.2, speed * 0.45),
            randInt(34, 52),
            color,
            randInt(1, 3),
            0.01,
            { sway: rand(0.05, 0.1), swayPhase: rand(0, Math.PI * 2) }
          );
          break;

        case 'thunder':
          color = Math.random() > 0.45 ? [255, 255, 150] : [255, 255, 255];
          addParticle(
            x + rand(-spread * 0.5, spread * 0.5),
            y + rand(-spread * 0.5, spread * 0.5),
            rand(-speed, speed),
            rand(-speed, speed),
            randInt(8, 14),
            color,
            randInt(1, 3),
            0,
            { flicker: rand(0.15, 0.3) }
          );
          break;

        case 'konnyaku_bounce':
          color = Math.random() > 0.45 ? [150, 150, 150] : [210, 210, 210];
          addParticle(
            x + rand(-spread * 0.5, spread * 0.5),
            y + rand(-spread * 0.5, spread * 0.5),
            rand(-speed, speed),
            rand(-speed - 1.0, -0.6),
            randInt(18, 28),
            color,
            randInt(1, 3),
            0.22,
            { floorY: y + rand(8, 18), bounce: rand(0.35, 0.5) }
          );
          break;

        default:
          addParticle(
            x,
            y,
            rand(-speed, speed),
            rand(-speed, speed),
            randInt(12, 20),
            [255, 255, 255],
            randInt(1, 3),
            0.06
          );
          break;
      }
    }
  }

  function update() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var particle = particles[i];

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.sway) {
        particle.swayPhase += particle.sway;
        particle.x += Math.sin(particle.swayPhase) * 0.25;
      }

      if (particle.gravity) {
        particle.vy += particle.gravity;
      }

      if (particle.bounce > 0 && particle.y >= particle.floorY) {
        particle.y = particle.floorY;
        particle.vy = -Math.abs(particle.vy) * particle.bounce;
        particle.bounce *= 0.75;
      }

      particle.life--;

      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function draw() {
    for (var i = 0; i < particles.length; i++) {
      var particle = particles[i];
      var alpha = clamp(particle.life / particle.maxLife, 0, 1);
      if (particle.flicker) {
        alpha *= 0.8 + Math.sin((particle.maxLife - particle.life) * particle.flicker * 12) * 0.2;
      }
      alpha = clamp(alpha, 0, 1);

      var color = 'rgba(' + particle.color[0] + ',' + particle.color[1] + ',' + particle.color[2] + ',' + alpha.toFixed(3) + ')';
      Game.Renderer.drawRectAbsolute(
        Math.round(particle.x),
        Math.round(particle.y),
        clamp(particle.size, 1, 3),
        clamp(particle.size, 1, 3),
        color
      );
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
