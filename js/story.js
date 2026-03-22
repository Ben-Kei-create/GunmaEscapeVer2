// Story Event Engine - Manages scripted story sequences
Game.Story = (function() {
  var currentEvent = null;
  var stepIndex = 0;
  var waitingForInput = false;
  var currentSpeaker = '';
  var currentText = '';
  var storyFlags = {};
  var chapter = 1;
  var phase = ''; // current story phase tracking
  var eventQueue = [];
  var onEventEnd = null;
  var choiceIndex = 0;
  var choices = null;
  var bgImage = null; // background scene type
  var bgColor = '#000';
  var characters = []; // characters shown on screen during event
  var fadeAlpha = 0;
  var fadeDir = 0; // 0=none, 1=fading in, -1=fading out
  var fadeCallback = null;
  var shakeTimer = 0;
  var typewriterText = '';
  var typewriterIndex = 0;
  var typewriterSpeed = 2; // frames per character
  var typewriterTimer = 0;
  var pauseTimer = 0;
  var bgmOverride = null;

  // Story progress flags
  function setFlag(flag) { storyFlags[flag] = true; }
  function hasFlag(flag) { return !!storyFlags[flag]; }
  function clearFlag(flag) { delete storyFlags[flag]; }
  function getPhase() { return phase; }
  function setPhase(p) { phase = p; }
  function getChapter() { return chapter; }

  // Start a story event (array of steps)
  function startEvent(event, callback) {
    currentEvent = event;
    stepIndex = 0;
    waitingForInput = false;
    onEventEnd = callback || null;
    processStep();
  }

  // Queue an event to play after current
  function queueEvent(event, callback) {
    eventQueue.push({ event: event, callback: callback });
  }

  function processStep() {
    if (!currentEvent || stepIndex >= currentEvent.length) {
      endEvent();
      return;
    }

    var step = currentEvent[stepIndex];

    switch (step.type) {
      case 'dialog':
        currentSpeaker = step.speaker || '';
        currentText = '';
        typewriterText = step.text || '';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        break;

      case 'narration':
        currentSpeaker = '';
        currentText = '';
        typewriterText = step.text || '';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        break;

      case 'system':
        currentSpeaker = 'システム';
        currentText = '';
        typewriterText = step.text || '';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        break;

      case 'choice':
        choices = step.choices;
        choiceIndex = 0;
        currentSpeaker = step.speaker || '';
        currentText = step.text || '選んでください';
        typewriterText = '';
        typewriterIndex = 0;
        waitingForInput = true;
        break;

      case 'fade_out':
        fadeAlpha = 0;
        fadeDir = 1;
        bgColor = step.color || '#000';
        fadeCallback = function() {
          stepIndex++;
          processStep();
        };
        break;

      case 'fade_in':
        fadeAlpha = 1;
        fadeDir = -1;
        fadeCallback = function() {
          stepIndex++;
          processStep();
        };
        break;

      case 'set_bg':
        bgImage = step.bg || null;
        bgColor = step.color || '#000';
        stepIndex++;
        processStep();
        break;

      case 'show_character':
        characters.push({
          name: step.name,
          position: step.position || 'center', // left, center, right
          sprite: step.sprite || null,
          palette: step.palette || null
        });
        stepIndex++;
        processStep();
        break;

      case 'hide_character':
        characters = characters.filter(function(c) { return c.name !== step.name; });
        stepIndex++;
        processStep();
        break;

      case 'clear_characters':
        characters = [];
        stepIndex++;
        processStep();
        break;

      case 'shake':
        shakeTimer = step.duration || 30;
        stepIndex++;
        processStep();
        break;

      case 'pause':
        pauseTimer = step.duration || 60;
        break;

      case 'set_flag':
        setFlag(step.flag);
        stepIndex++;
        processStep();
        break;

      case 'check_flag':
        if (hasFlag(step.flag)) {
          stepIndex = step.gotoTrue || stepIndex + 1;
        } else {
          stepIndex = step.gotoFalse || stepIndex + 1;
        }
        processStep();
        break;

      case 'give_item':
        Game.Player.addItem(step.item);
        currentSpeaker = 'システム';
        var itemDef = Game.Items.get(step.item);
        var itemName = itemDef ? itemDef.name : step.item;
        typewriterText = '「' + itemName + '」を手に入れた！';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        Game.Audio.playSfx('item');
        break;

      case 'heal':
        Game.Player.heal(step.amount || 9999);
        stepIndex++;
        processStep();
        break;

      case 'play_bgm':
        bgmOverride = step.bgm;
        Game.Audio.stopBgm();
        Game.Audio.playBgm(step.bgm);
        stepIndex++;
        processStep();
        break;

      case 'stop_bgm':
        Game.Audio.stopBgm();
        bgmOverride = null;
        stepIndex++;
        processStep();
        break;

      case 'play_sfx':
        Game.Audio.playSfx(step.sfx);
        stepIndex++;
        processStep();
        break;

      case 'battle':
        // Trigger a battle, return to story after
        stepIndex++;
        if (step.onVictory) {
          onEventEnd = function() {
            startEvent(step.onVictory);
          };
        }
        endEvent();
        Game.Main.setState(Game.Config.STATE.BATTLE);
        Game.Battle.start(step.enemy, step.npcRef || null);
        return;

      case 'start_battle':
        // Start battle and continue story after victory
        var battleEnemy = step.enemy;
        var afterBattle = currentEvent.slice(stepIndex + 1);
        var afterCallback = onEventEnd;
        currentEvent = null;
        Game.Main.startStoryBattle(battleEnemy, afterBattle, afterCallback);
        return;

      case 'load_map':
        Game.Map.load(step.map, step.x, step.y);
        stepIndex++;
        processStep();
        break;

      case 'set_phase':
        phase = step.phase;
        stepIndex++;
        processStep();
        break;

      case 'end_chapter':
        chapter = step.next || chapter + 1;
        stepIndex++;
        processStep();
        break;

      case 'callback':
        if (step.fn) step.fn();
        stepIndex++;
        processStep();
        break;

      case 'legacy_card':
        // Show legacy card obtained
        currentSpeaker = 'レガシーカード';
        typewriterText = '【' + step.name + '】\n' + step.description;
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        if (Game.Legacy) Game.Legacy.unlock(step.cardId);
        Game.Audio.playSfx('item');
        break;

      case 'party_join':
        currentSpeaker = 'システム';
        typewriterText = step.name + 'が仲間に加わった！';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        setFlag('party_' + step.id);
        Game.Audio.playSfx('victory');
        break;

      case 'dice_tutorial':
        // Special dice rolling demo
        currentSpeaker = 'システム';
        typewriterText = step.text || 'ダイスを振ってみよう！（Zキーで振る）';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        break;

      default:
        stepIndex++;
        processStep();
        break;
    }
  }

  function update() {
    // Handle fade
    if (fadeDir !== 0) {
      fadeAlpha += fadeDir * 0.03;
      if (fadeDir > 0 && fadeAlpha >= 1) {
        fadeAlpha = 1;
        fadeDir = 0;
        if (fadeCallback) { fadeCallback(); fadeCallback = null; }
      } else if (fadeDir < 0 && fadeAlpha <= 0) {
        fadeAlpha = 0;
        fadeDir = 0;
        if (fadeCallback) { fadeCallback(); fadeCallback = null; }
      }
      return; // Don't process input during fade
    }

    // Handle pause
    if (pauseTimer > 0) {
      pauseTimer--;
      if (pauseTimer <= 0) {
        stepIndex++;
        processStep();
      }
      return;
    }

    // Handle shake
    if (shakeTimer > 0) shakeTimer--;

    // Handle typewriter effect
    if (typewriterText && typewriterIndex < typewriterText.length) {
      typewriterTimer++;
      if (typewriterTimer >= typewriterSpeed) {
        typewriterTimer = 0;
        typewriterIndex++;
        currentText = typewriterText.substring(0, typewriterIndex);
      }

      // Skip typewriter with confirm
      if (Game.Input.isPressed('confirm')) {
        typewriterIndex = typewriterText.length;
        currentText = typewriterText;
      }
      return;
    }

    // Text fully displayed
    if (typewriterText && typewriterIndex >= typewriterText.length && !waitingForInput) {
      waitingForInput = true;
    }

    if (!currentEvent) return;

    var step = currentEvent[stepIndex];
    if (!step) { endEvent(); return; }

    // Handle choices
    if (step.type === 'choice' && choices) {
      if (Game.Input.isPressed('up')) {
        choiceIndex = (choiceIndex - 1 + choices.length) % choices.length;
        Game.Audio.playSfx('confirm');
      }
      if (Game.Input.isPressed('down')) {
        choiceIndex = (choiceIndex + 1) % choices.length;
        Game.Audio.playSfx('confirm');
      }
      if (Game.Input.isPressed('confirm')) {
        Game.Audio.playSfx('confirm');
        var chosen = choices[choiceIndex];
        choices = null;
        if (chosen.goto !== undefined) {
          stepIndex = chosen.goto;
        } else {
          stepIndex++;
        }
        processStep();
        return;
      }
      return;
    }

    // Advance on confirm
    if (waitingForInput && Game.Input.isPressed('confirm')) {
      Game.Audio.playSfx('confirm');
      waitingForInput = false;
      typewriterText = '';
      typewriterIndex = 0;
      currentText = '';
      stepIndex++;
      processStep();
    }
  }

  function endEvent() {
    currentEvent = null;
    stepIndex = 0;
    waitingForInput = false;
    currentSpeaker = '';
    currentText = '';
    typewriterText = '';
    choices = null;
    characters = [];

    var cb = onEventEnd;
    onEventEnd = null;

    if (cb) {
      cb();
    } else if (eventQueue.length > 0) {
      var next = eventQueue.shift();
      startEvent(next.event, next.callback);
    } else {
      Game.Main.setState(Game.Config.STATE.EXPLORING);
    }
  }

  function draw() {
    var R = Game.Renderer;
    var C = Game.Config;
    var ctx = R.getContext();
    var shakeOff = shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;

    // Draw background scene
    ctx.save();
    if (shakeTimer > 0) ctx.translate(shakeOff, shakeOff * 0.5);

    if (bgImage) {
      drawSceneBg(R, C, bgImage);
    }

    // Draw characters on scene
    for (var i = 0; i < characters.length; i++) {
      drawCharacterOnScene(R, C, characters[i]);
    }

    ctx.restore();

    // Draw dialog box if we have text
    if (currentText || (choices && choices.length > 0)) {
      drawStoryDialog(R, C);
    }

    // Draw fade overlay
    if (fadeAlpha > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + fadeAlpha + ')';
      ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    }
  }

  function drawSceneBg(R, C, scene) {
    var ctx = R.getContext();
    switch (scene) {
      case 'forest':
        // Dark misty forest
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a1a0a');
        // Ground
        R.drawRectAbsolute(0, 200, C.CANVAS_WIDTH, 120, '#1a2e1a');
        // Trees
        for (var i = 0; i < 8; i++) {
          var tx = i * 65 + 10;
          ctx.fillStyle = '#0d2a0d';
          ctx.fillRect(tx + 15, 80, 20, 120);
          ctx.fillStyle = '#1a3a1a';
          ctx.beginPath();
          ctx.moveTo(tx, 140);
          ctx.lineTo(tx + 25, 40);
          ctx.lineTo(tx + 50, 140);
          ctx.fill();
          ctx.fillStyle = '#153015';
          ctx.beginPath();
          ctx.moveTo(tx + 5, 110);
          ctx.lineTo(tx + 25, 20);
          ctx.lineTo(tx + 45, 110);
          ctx.fill();
        }
        // Fog
        ctx.fillStyle = 'rgba(180,200,180,0.15)';
        var fogT = Date.now() / 2000;
        for (var f = 0; f < 5; f++) {
          var fx = Math.sin(fogT + f * 1.5) * 60 + f * 100;
          ctx.fillRect(fx, 130 + f * 15, 150, 30);
        }
        break;

      case 'village':
        // Tamura Village
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#1a2844');
        // Sky gradient
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, 120, '#2a3854');
        // Ground
        R.drawRectAbsolute(0, 180, C.CANVAS_WIDTH, 140, '#3a5a2a');
        // Path
        R.drawRectAbsolute(200, 180, 80, 140, '#8a7a5a');
        // Houses
        drawHouse(ctx, 30, 120, '#5a4a3a');
        drawHouse(ctx, 140, 130, '#4a3a2a');
        drawHouse(ctx, 320, 125, '#5a4a3a');
        drawHouse(ctx, 400, 135, '#4a3a2a');
        break;

      case 'village_interior':
        // Inside a building
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#2a1a0a');
        // Floor
        R.drawRectAbsolute(0, 200, C.CANVAS_WIDTH, 120, '#5a4a3a');
        // Walls
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, 200, '#3a2a1a');
        // Wall line
        R.drawRectAbsolute(0, 195, C.CANVAS_WIDTH, 5, '#4a3a2a');
        // Scroll on wall (掛け軸)
        R.drawRectAbsolute(220, 30, 40, 100, '#f0e8d0');
        R.drawRectAbsolute(225, 35, 30, 90, '#e8d8c0');
        R.drawTextJP('国定', 228, 50, '#333', 12);
        R.drawTextJP('忠治', 228, 70, '#333', 12);
        break;

      case 'konuma':
        // Small lake area with fog
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a1a2a');
        // Water
        R.drawRectAbsolute(0, 160, C.CANVAS_WIDTH, 160, '#1a3a5a');
        // Shore
        R.drawRectAbsolute(0, 150, C.CANVAS_WIDTH, 20, '#3a4a2a');
        // Fog
        ctx.fillStyle = 'rgba(150,170,190,0.2)';
        for (var f = 0; f < 4; f++) {
          ctx.fillRect(f * 130, 100 + f * 20, 200, 40);
        }
        break;

      case 'onuma':
        // Large lake, more ominous
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a0a1a');
        R.drawRectAbsolute(0, 140, C.CANVAS_WIDTH, 180, '#1a2a4a');
        R.drawRectAbsolute(0, 130, C.CANVAS_WIDTH, 20, '#2a3a2a');
        // Wagon silhouette
        R.drawRectAbsolute(180, 100, 60, 35, '#2a2a2a');
        R.drawRectAbsolute(175, 120, 70, 15, '#1a1a1a');
        // Wheels
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(190, 138, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(230, 138, 8, 0, Math.PI * 2); ctx.fill();
        break;

      case 'akagi_ranch':
        // Misty ruins
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#1a1a2a');
        R.drawRectAbsolute(0, 180, C.CANVAS_WIDTH, 140, '#2a2a1a');
        // Ruined buildings
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(100, 100, 80, 80);
        ctx.fillRect(300, 110, 60, 70);
        // Broken roof
        ctx.fillStyle = '#3a2a2a';
        ctx.beginPath();
        ctx.moveTo(90, 100); ctx.lineTo(140, 60); ctx.lineTo(190, 100);
        ctx.fill();
        // Heavy fog
        ctx.fillStyle = 'rgba(150,150,170,0.25)';
        for (var f = 0; f < 6; f++) {
          var fx2 = Math.sin(Date.now() / 3000 + f) * 40 + f * 80;
          ctx.fillRect(fx2, 80 + f * 20, 180, 35);
        }
        break;

      case 'akagi_shrine':
        // Shrine at lake
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a1a2a');
        R.drawRectAbsolute(0, 180, C.CANVAS_WIDTH, 140, '#1a3a5a');
        R.drawRectAbsolute(0, 170, C.CANVAS_WIDTH, 15, '#3a5a3a');
        // Torii gate
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(200, 60, 8, 110);
        ctx.fillRect(272, 60, 8, 110);
        ctx.fillRect(195, 55, 90, 8);
        ctx.fillRect(198, 75, 84, 6);
        // Shrine building
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(210, 90, 60, 80);
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath();
        ctx.moveTo(200, 90); ctx.lineTo(240, 50); ctx.lineTo(280, 90);
        ctx.fill();
        break;

      case 'battle_field':
        // Generic battle area
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#111122');
        // Grid
        ctx.strokeStyle = '#222244';
        ctx.lineWidth = 1;
        for (var gi = 0; gi < C.CANVAS_WIDTH; gi += 32) {
          ctx.beginPath(); ctx.moveTo(gi, 0); ctx.lineTo(gi, C.CANVAS_HEIGHT); ctx.stroke();
        }
        for (var gj = 0; gj < C.CANVAS_HEIGHT; gj += 32) {
          ctx.beginPath(); ctx.moveTo(0, gj); ctx.lineTo(C.CANVAS_WIDTH, gj); ctx.stroke();
        }
        break;

      case 'black':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#000');
        break;

      case 'chapter_end':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a0a1a');
        break;

      default:
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, bgColor || '#000');
        break;
    }
  }

  function drawHouse(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 60, 50);
    // Roof
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 30, y - 30);
    ctx.lineTo(x + 65, y);
    ctx.fill();
    // Door
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(x + 22, y + 25, 16, 25);
    // Window
    ctx.fillStyle = '#8a8a2a';
    ctx.fillRect(x + 8, y + 12, 12, 10);
    ctx.fillRect(x + 40, y + 12, 12, 10);
  }

  function drawCharacterOnScene(R, C, char) {
    var x;
    switch (char.position) {
      case 'left': x = 80; break;
      case 'right': x = 320; break;
      default: x = 200; break;
    }
    if (char.sprite && char.palette) {
      R.drawSpriteAbsolute(char.sprite, x, 80, char.palette, 5);
    }
  }

  function drawStoryDialog(R, C) {
    // Full-width dialog box at bottom
    var boxH = 90;
    var boxY = C.CANVAS_HEIGHT - boxH - 5;
    R.drawDialogBox(10, boxY, C.CANVAS_WIDTH - 20, boxH);

    // Speaker name box
    if (currentSpeaker) {
      var nameWidth = Math.max(80, currentSpeaker.length * 14 + 20);
      R.drawDialogBox(10, boxY - 22, nameWidth, 24);
      var nameColor = C.COLORS.GOLD;
      if (currentSpeaker === 'システム') nameColor = '#88aaff';
      R.drawTextJP(currentSpeaker, 20, boxY - 18, nameColor, 13);
    }

    // Dialog text with word wrap
    if (currentText) {
      var maxChars = 26;
      var lines = [];
      var textParts = currentText.split('\n');
      for (var p = 0; p < textParts.length; p++) {
        var remaining = textParts[p];
        while (remaining.length > 0) {
          if (remaining.length <= maxChars) {
            lines.push(remaining);
            break;
          }
          lines.push(remaining.substring(0, maxChars));
          remaining = remaining.substring(maxChars);
        }
      }
      for (var i = 0; i < lines.length && i < 4; i++) {
        R.drawTextJP(lines[i], 25, boxY + 10 + i * 18, '#fff', 13);
      }
    }

    // Choices
    if (choices && choices.length > 0) {
      var choiceBoxW = 200;
      var choiceBoxH = choices.length * 28 + 10;
      var choiceBoxX = C.CANVAS_WIDTH - choiceBoxW - 20;
      var choiceBoxY = boxY - choiceBoxH - 5;
      R.drawDialogBox(choiceBoxX, choiceBoxY, choiceBoxW, choiceBoxH);
      for (var c = 0; c < choices.length; c++) {
        var color = (c === choiceIndex) ? C.COLORS.GOLD : '#fff';
        var prefix = (c === choiceIndex) ? '▶ ' : '  ';
        R.drawTextJP(prefix + choices[c].text, choiceBoxX + 15, choiceBoxY + 8 + c * 28, color, 13);
      }
    }

    // Advance indicator (blinking triangle)
    if (waitingForInput && !choices) {
      var blink = Math.floor(Date.now() / 400) % 2;
      if (blink === 0) {
        R.drawTextJP('▼', C.CANVAS_WIDTH - 35, C.CANVAS_HEIGHT - 20, '#fff', 12);
      }
    }
  }

  function isActive() {
    return currentEvent !== null;
  }

  function getBgImage() {
    return bgImage;
  }

  function reset() {
    currentEvent = null;
    stepIndex = 0;
    waitingForInput = false;
    currentSpeaker = '';
    currentText = '';
    storyFlags = {};
    chapter = 1;
    phase = '';
    eventQueue = [];
    onEventEnd = null;
    choices = null;
    bgImage = null;
    characters = [];
    fadeAlpha = 0;
    fadeDir = 0;
    shakeTimer = 0;
    typewriterText = '';
    typewriterIndex = 0;
    pauseTimer = 0;
  }

  return {
    startEvent: startEvent,
    queueEvent: queueEvent,
    update: update,
    draw: draw,
    isActive: isActive,
    setFlag: setFlag,
    hasFlag: hasFlag,
    clearFlag: clearFlag,
    getPhase: getPhase,
    setPhase: setPhase,
    getChapter: getChapter,
    getBgImage: getBgImage,
    reset: reset
  };
})();
