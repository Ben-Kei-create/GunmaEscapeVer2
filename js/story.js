// Story Event Engine - Manages scripted story sequences
Game.Story = (function() {
  var STORAGE_KEY = 'gunma_story_flags_v1';
  var currentEvent = null;
  var currentSceneId = '';
  var stepIndex = 0;
  var waitingForInput = false;
  var currentSpeaker = '';
  var currentText = '';
  var currentTextRaw = '';
  var currentTextColor = '#fff';
  var storyFlags = {};
  var chapter = 1;
  var phase = '';
  var eventQueue = [];
  var onEventEnd = null;
  var choiceIndex = 0;
  var choices = null;
  var bgImage = null;
  var bgColor = '#000';
  var characters = [];
  var fadeAlpha = 0;
  var fadeDir = 0;
  var fadeCallback = null;
  var shakeTimer = 0;
  var typewriterText = '';
  var typewriterTokens = [];
  var visibleCharCount = 0;
  var totalVisibleChars = 0;
  var typewriterIndex = 0;
  var typewriterSpeed = 3;
  var typewriterTimer = 0;
  var pauseTimer = 0;
  var punctuationPause = 0;
  var bgmOverride = null;
  var sceneRegistry = {};

  var colorMap = {
    white: '#ffffff',
    red: '#ff6666',
    blue: '#88bbff',
    green: '#88dd88',
    gold: '#ffcc55',
    purple: '#d8a0ff',
    pink: '#ffb6d9',
    gray: '#cccccc',
    grey: '#cccccc',
    yellow: '#fff088'
  };

  var portraits = {
    '主人公': {
      palette: { 0: 'rgba(0,0,0,0)', 1: '#4f5258', 2: '#727781', 3: '#a1a7b3', 4: '#d8dde7' },
      pixels: [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,1],
        [0,1,2,2,2,2,1,0],
        [0,1,1,1,1,1,1,0],
        [0,0,0,3,4,0,0,0]
      ],
      label: '?'
    },
    'アカギ': {
      palette: { 0: 'rgba(0,0,0,0)', 1: '#3a1d16', 2: '#7f3c2d', 3: '#b4674f', 4: '#ddb396', 5: '#5c2e24' },
      pixels: [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,4,4,4,4,2,1],
        [1,2,4,3,3,4,2,1],
        [1,2,4,4,4,4,2,1],
        [0,1,5,2,2,5,1,0],
        [0,5,5,5,5,5,5,0],
        [0,5,0,5,5,0,5,0]
      ]
    },
    '龝櫻': {
      palette: { 0: 'rgba(0,0,0,0)', 1: '#1a1a1f', 2: '#3a3a44', 3: '#6b6b78', 4: '#d7c6a7', 5: '#5e5148' },
      pixels: [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,4,4,4,4,2,1],
        [1,2,4,3,3,4,2,1],
        [1,2,4,4,4,4,2,1],
        [0,1,5,5,5,5,1,0],
        [0,5,2,2,2,2,5,0],
        [0,5,0,5,5,0,5,0]
      ]
    },
    '国定忠治': {
      palette: { 0: 'rgba(0,0,0,0)', 1: '#251913', 2: '#7e1f1f', 3: '#b24242', 4: '#efc39f', 5: '#3d5b8c' },
      pixels: [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,4,4,4,4,2,1],
        [1,2,4,5,5,4,2,1],
        [1,2,4,4,4,4,2,1],
        [0,1,3,3,3,3,1,0],
        [0,3,3,2,2,3,3,0],
        [0,3,0,3,3,0,3,0]
      ]
    },
    'ナンバー12': {
      palette: { 0: 'rgba(0,0,0,0)', 1: '#09090c', 2: '#20202b', 3: '#45455a', 4: '#b69674', 5: '#6e3d19' },
      pixels: [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,4,4,4,4,2,1],
        [1,2,4,3,3,4,2,1],
        [1,2,4,4,4,4,2,1],
        [0,1,2,2,2,2,1,0],
        [0,5,5,5,5,5,5,0],
        [0,5,0,5,5,0,5,0]
      ]
    },
    '花': {
      palette: { 0: 'rgba(0,0,0,0)', 1: '#7d4168', 2: '#d584b5', 3: '#efb8d2', 4: '#f7dbc9', 5: '#f2a7bf' },
      pixels: [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,4,4,4,4,2,1],
        [1,2,4,3,3,4,2,1],
        [1,2,4,4,4,4,2,1],
        [0,1,5,5,5,5,1,0],
        [0,5,5,2,2,5,5,0],
        [0,5,0,5,5,0,5,0]
      ]
    },
    '佐藤': {
      palette: { 0: 'rgba(0,0,0,0)', 1: '#21456b', 2: '#497dab', 3: '#7fb0db', 4: '#eed1af', 5: '#355a82' },
      pixels: [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,4,4,4,4,2,1],
        [1,2,4,3,3,4,2,1],
        [1,2,4,4,4,4,2,1],
        [0,1,5,5,5,5,1,0],
        [0,5,5,2,2,5,5,0],
        [0,5,0,5,5,0,5,0]
      ]
    }
  };

  function setFlag(flag, value) {
    if (!flag) return;
    storyFlags[flag] = (value === undefined) ? true : value;
    saveFlags();
  }

  function getFlag(flag) {
    return storyFlags[flag];
  }

  function hasFlag(flag) {
    return !!storyFlags[flag];
  }

  function clearFlag(flag) {
    delete storyFlags[flag];
    saveFlags();
  }

  function getPhase() { return phase; }
  function setPhase(p) { phase = p; }
  function getChapter() { return chapter; }

  function saveFlags() {
    if (!window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storyFlags));
  }

  function loadFlags() {
    if (!window.localStorage) return storyFlags;
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return storyFlags;
    var parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      storyFlags = parsed;
    }
    return storyFlags;
  }

  function addScene(id, scenes) {
    if (!id || !scenes) return;
    sceneRegistry[id] = scenes;
  }

  function getScene(sceneId) {
    return sceneRegistry[sceneId] || null;
  }

  function stepConditionMet(step) {
    if (!step || step.condition === undefined || step.condition === null) return true;
    if (typeof step.condition === 'function') return !!step.condition(storyFlags);
    if (typeof step.condition === 'string') return hasFlag(step.condition);
    if (typeof step.condition === 'object') {
      if (step.condition.flag) {
        if (step.condition.not) return !hasFlag(step.condition.flag);
        return hasFlag(step.condition.flag);
      }
    }
    return true;
  }

  function stripFormatting(text) {
    if (!text) return '';
    return text.replace(/\{\/?[a-z]+\}/g, '').replace(/\*/g, '');
  }

  function tokenizeText(text) {
    var tokens = [];
    var color = null;
    var dramatic = false;
    var i = 0;
    while (i < text.length) {
      if (text.charAt(i) === '{') {
        var close = text.indexOf('}', i);
        if (close !== -1) {
          var tag = text.substring(i + 1, close);
          if (tag.charAt(0) === '/') {
            color = null;
          } else if (colorMap[tag]) {
            color = colorMap[tag];
          }
          i = close + 1;
          continue;
        }
      }
      if (text.charAt(i) === '*') {
        dramatic = !dramatic;
        i++;
        continue;
      }
      tokens.push({ char: text.charAt(i), color: color, dramatic: dramatic });
      i++;
    }
    return tokens;
  }

  function getVisibleTokenCount(tokens) {
    return tokens.length;
  }

  function getVisibleText(tokens, count) {
    var out = '';
    for (var i = 0; i < tokens.length && i < count; i++) {
      out += tokens[i].char;
    }
    return out;
  }

  function beginTextStep(step, speaker, text, defaultColor) {
    currentSpeaker = speaker || '';
    currentText = '';
    currentTextRaw = text || '';
    currentTextColor = defaultColor || '#fff';
    typewriterText = text || '';
    typewriterTokens = tokenizeText(typewriterText);
    visibleCharCount = 0;
    totalVisibleChars = getVisibleTokenCount(typewriterTokens);
    typewriterIndex = 0;
    typewriterTimer = 0;
    punctuationPause = 0;
    typewriterSpeed = step && step.speed ? step.speed : 3;
    waitingForInput = false;
  }

  function startEvent(event, callback) {
    currentSceneId = '';
    currentEvent = event;
    stepIndex = 0;
    waitingForInput = false;
    onEventEnd = callback || null;
    processStep();
  }

  function startScene(sceneId, callback) {
    var scene = getScene(sceneId);
    if (!scene) return false;
    currentSceneId = sceneId;
    startEvent(scene, callback);
    return true;
  }

  function queueEvent(event, callback) {
    eventQueue.push({ event: event, callback: callback });
  }

  function branchTo(nextTarget) {
    if (!nextTarget) {
      stepIndex++;
      processStep();
      return;
    }

    if (typeof nextTarget === 'number') {
      stepIndex = nextTarget;
      processStep();
      return;
    }

    if (typeof nextTarget === 'string' && sceneRegistry[nextTarget]) {
      startScene(nextTarget, onEventEnd);
      return;
    }

    stepIndex++;
    processStep();
  }

  function processStep() {
    while (currentEvent && stepIndex < currentEvent.length && !stepConditionMet(currentEvent[stepIndex])) {
      stepIndex++;
    }

    if (!currentEvent || stepIndex >= currentEvent.length) {
      endEvent();
      return;
    }

    var step = currentEvent[stepIndex];

    switch (step.type) {
      case 'dialog':
        beginTextStep(step, step.speaker || '', step.text || '', step.textColor || '#fff');
        break;

      case 'narration':
        beginTextStep(step, '', step.text || '', step.textColor || '#fff');
        break;

      case 'system':
        beginTextStep(step, 'システム', step.text || '', step.textColor || '#88aaff');
        break;

      case 'choice':
        choices = step.choices || [];
        choiceIndex = 0;
        beginTextStep(step, step.speaker || '', step.prompt || step.text || '選んでください', '#fff');
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
          position: step.position || 'center',
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
        setFlag(step.flag, step.value);
        stepIndex++;
        processStep();
        break;

      case 'check_flag':
        if (hasFlag(step.flag)) {
          stepIndex = (step.gotoTrue !== undefined) ? step.gotoTrue : stepIndex + 1;
        } else {
          stepIndex = (step.gotoFalse !== undefined) ? step.gotoFalse : stepIndex + 1;
        }
        processStep();
        break;

      case 'route_ending':
        // Determine ending based on accumulated flags
        var endingId = resolveEnding();
        var endingEvent = chapterEvents[endingId];
        if (endingEvent) {
          currentEvent = endingEvent;
          stepIndex = 0;
          processStep();
        } else {
          stepIndex++;
          processStep();
        }
        return;

      case 'start_quiz':
        // Trigger quiz puzzle from story event
        // Usage: { type: 'start_quiz', difficulty: 2, count: 3 }
        var quizDiff = step.difficulty || 1;
        var quizCount = step.count || 3;
        var afterQuiz = currentEvent.slice(stepIndex + 1);
        var afterQuizCallback = onEventEnd;
        endEvent();
        Game.Main.setState(Game.Config.STATE.PUZZLE);
        Game.Puzzle.start('quiz', null, { difficulty: quizDiff, count: quizCount });
        // Resume story after quiz ends (handled by main.js puzzle completion)
        onEventEnd = function() {
          if (afterQuiz.length > 0) {
            startEvent(afterQuiz, afterQuizCallback);
          } else if (afterQuizCallback) {
            afterQuizCallback();
          }
        };
        return;

      case 'give_item':
        Game.Player.addItem(step.item);
        var itemDef = Game.Items.get(step.item);
        var itemName = itemDef ? itemDef.name : step.item;
        beginTextStep(step, 'システム', '「' + itemName + '」を手に入れた！', '#88aaff');
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
        stepIndex++;
        if (step.onVictory) {
          onEventEnd = function() {
            if (typeof step.onVictory === 'string') startScene(step.onVictory);
            else startEvent(step.onVictory);
          };
        }
        endEvent();
        Game.Main.setState(Game.Config.STATE.BATTLE);
        Game.Battle.start(step.enemy, step.npcRef || null);
        return;

      case 'start_battle':
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
        // Play chapter-specific field BGM if available
        var chFieldBgm = chapterFieldBgm[chapter];
        if (chFieldBgm) {
          Game.Audio.stopBgm();
          Game.Audio.playBgm(chFieldBgm);
        }
        stepIndex++;
        processStep();
        break;

      case 'callback':
        if (step.fn) step.fn();
        stepIndex++;
        processStep();
        break;

      case 'legacy_card':
        beginTextStep(step, 'レガシーカード', '【' + step.name + '】\n' + step.description, '#ffcc55');
        if (Game.Legacy) Game.Legacy.unlock(step.cardId);
        Game.Audio.playSfx('item');
        break;

      case 'party_join':
        beginTextStep(step, 'システム', step.name + 'が仲間に加わった！', '#88aaff');
        setFlag('party_' + step.id, true);
        Game.Audio.playSfx('victory');
        break;

      case 'dice_tutorial':
        beginTextStep(step, 'システム', step.text || 'ダイスを振ってみよう！（Zキーで振る）', '#88aaff');
        break;

      default:
        stepIndex++;
        processStep();
        break;
    }
  }

  function updateTypewriter() {
    if (!typewriterTokens.length || visibleCharCount >= totalVisibleChars) return false;

    if (punctuationPause > 0) {
      punctuationPause--;
      return true;
    }

    typewriterTimer++;
    var nextToken = typewriterTokens[visibleCharCount];
    var speed = nextToken && nextToken.dramatic ? 6 : typewriterSpeed;
    if (typewriterTimer < speed) return true;

    typewriterTimer = 0;
    visibleCharCount++;
    typewriterIndex = visibleCharCount;
    currentText = getVisibleText(typewriterTokens, visibleCharCount);

    if (currentText.slice(-3) === '...') {
      punctuationPause = 15;
    } else if (nextToken && nextToken.char === '。') {
      punctuationPause = 15;
    }
    return true;
  }

  function update() {
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
      return;
    }

    if (pauseTimer > 0) {
      pauseTimer--;
      if (pauseTimer <= 0) {
        stepIndex++;
        processStep();
      }
      return;
    }

    if (shakeTimer > 0) shakeTimer--;

    if (updateTypewriter()) {
      if (Game.Input.isPressed('confirm')) {
        visibleCharCount = totalVisibleChars;
        typewriterIndex = totalVisibleChars;
        currentText = stripFormatting(typewriterText);
        punctuationPause = 0;
      }
      return;
    }

    if (typewriterTokens.length && visibleCharCount >= totalVisibleChars && !waitingForInput) {
      waitingForInput = true;
    }

    if (!currentEvent) return;

    var step = currentEvent[stepIndex];
    if (!step) {
      endEvent();
      return;
    }

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
        var chosen = choices[choiceIndex];
        Game.Audio.playSfx('confirm');
        if (chosen.flag) setFlag(chosen.flag, true);
        choices = null;
        waitingForInput = false;
        typewriterText = '';
        typewriterTokens = [];
        currentText = '';
        currentTextRaw = '';
        branchTo(chosen.next !== undefined ? chosen.next : chosen.goto);
        return;
      }
      return;
    }

    if (waitingForInput && Game.Input.isPressed('confirm')) {
      Game.Audio.playSfx('confirm');
      waitingForInput = false;
      typewriterText = '';
      typewriterTokens = [];
      visibleCharCount = 0;
      totalVisibleChars = 0;
      typewriterIndex = 0;
      currentText = '';
      currentTextRaw = '';
      stepIndex++;
      processStep();
    }
  }

  function endEvent() {
    currentEvent = null;
    currentSceneId = '';
    stepIndex = 0;
    waitingForInput = false;
    currentSpeaker = '';
    currentText = '';
    currentTextRaw = '';
    typewriterText = '';
    typewriterTokens = [];
    visibleCharCount = 0;
    totalVisibleChars = 0;
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

  function getPortraitForSpeaker(speaker) {
    if (!speaker) return null;
    if (portraits[speaker]) return portraits[speaker];
    if (speaker.indexOf('主人公') >= 0) return portraits['主人公'];
    return null;
  }

  function drawPortrait(R, C) {
    var portrait = getPortraitForSpeaker(currentSpeaker);
    if (!portrait) return;

    var px = 10;
    var py = 60;
    var scale = 10;
    R.drawDialogBox(px - 4, py - 4, 88, 88);
    var ctx = R.getContext();
    for (var y = 0; y < portrait.pixels.length; y++) {
      for (var x = 0; x < portrait.pixels[y].length; x++) {
        var colorId = portrait.pixels[y][x];
        if (!colorId) continue;
        ctx.fillStyle = portrait.palette[colorId];
        ctx.fillRect(px + x * scale, py + y * scale, scale, scale);
      }
    }
    if (portrait.label) {
      R.drawTextJP(portrait.label, px + 32, py + 30, '#ffffff', 20);
    }
  }

  function buildVisibleSegments(text, maxCharsPerLine) {
    var tokens = tokenizeText(text || '');
    var lines = [];
    var currentLine = [];
    var count = 0;
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i].char === '\n') {
        lines.push(currentLine);
        currentLine = [];
        count = 0;
        continue;
      }
      if (count >= maxCharsPerLine) {
        lines.push(currentLine);
        currentLine = [];
        count = 0;
      }
      currentLine.push(tokens[i]);
      count++;
    }
    if (currentLine.length) lines.push(currentLine);
    return lines;
  }

  function drawColoredLine(ctx, x, y, tokens, defaultColor) {
    var cursor = x;
    var fontSize = 13;
    ctx.font = fontSize + 'px "Hiragino Kaku Gothic ProN", "Meiryo", "MS Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (var i = 0; i < tokens.length; i++) {
      ctx.fillStyle = tokens[i].color || defaultColor || '#fff';
      ctx.fillText(tokens[i].char, cursor, y);
      cursor += fontSize;
    }
  }

  function draw() {
    var R = Game.Renderer;
    var C = Game.Config;
    var ctx = R.getContext();
    var shakeOff = shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;

    ctx.save();
    if (shakeTimer > 0) ctx.translate(shakeOff, shakeOff * 0.5);

    if (bgImage) {
      drawSceneBg(R, C, bgImage);
    } else {
      R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, bgColor || '#000');
    }

    for (var i = 0; i < characters.length; i++) {
      drawCharacterOnScene(R, C, characters[i]);
    }

    ctx.restore();

    drawPortrait(R, C);

    if (currentText || (choices && choices.length > 0)) {
      drawStoryDialog(R, C);
    }

    if (fadeAlpha > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + fadeAlpha + ')';
      ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    }
  }

  function drawPortrait(R, C, speaker) {
    var p = portraits[speaker];
    if (!p) return;
    var px = 12, py = C.CANVAS_HEIGHT - 100 - 70;
    // Portrait frame
    R.drawRectAbsolute(px - 2, py - 2, 68, 68, '#888');
    R.drawRectAbsolute(px, py, 64, 64, p.color);
    // Accent rectangle (face area)
    R.drawRectAbsolute(px + 16, py + 12, 32, 24, p.accent);
    // Label
    R.drawTextJP(p.label, px + 20, py + 40, '#fff', 16);
    // Name below portrait
    R.drawTextJP(speaker, px, py + 66, '#ccc', 9);
  }

  function drawSceneBg(R, C, scene) {
    var ctx = R.getContext();
    switch (scene) {
      case 'forest':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a1a0a');
        R.drawRectAbsolute(0, 200, C.CANVAS_WIDTH, 120, '#1a2e1a');
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
        ctx.fillStyle = 'rgba(180,200,180,0.15)';
        var fogT = Date.now() / 2000;
        for (var f = 0; f < 5; f++) {
          var fx = Math.sin(fogT + f * 1.5) * 60 + f * 100;
          ctx.fillRect(fx, 130 + f * 15, 150, 30);
        }
        break;

      case 'village':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#1a2844');
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, 120, '#2a3854');
        R.drawRectAbsolute(0, 180, C.CANVAS_WIDTH, 140, '#3a5a2a');
        R.drawRectAbsolute(200, 180, 80, 140, '#8a7a5a');
        drawHouse(ctx, 30, 120, '#5a4a3a');
        drawHouse(ctx, 140, 130, '#4a3a2a');
        drawHouse(ctx, 320, 125, '#5a4a3a');
        drawHouse(ctx, 400, 135, '#4a3a2a');
        break;

      case 'village_interior':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#2a1a0a');
        R.drawRectAbsolute(0, 200, C.CANVAS_WIDTH, 120, '#5a4a3a');
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, 200, '#3a2a1a');
        R.drawRectAbsolute(0, 195, C.CANVAS_WIDTH, 5, '#4a3a2a');
        R.drawRectAbsolute(220, 30, 40, 100, '#f0e8d0');
        R.drawRectAbsolute(225, 35, 30, 90, '#e8d8c0');
        R.drawTextJP('国定', 228, 50, '#333', 12);
        R.drawTextJP('忠治', 228, 70, '#333', 12);
        break;

      case 'konuma':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a1a2a');
        R.drawRectAbsolute(0, 160, C.CANVAS_WIDTH, 160, '#1a3a5a');
        R.drawRectAbsolute(0, 150, C.CANVAS_WIDTH, 20, '#3a4a2a');
        ctx.fillStyle = 'rgba(150,170,190,0.2)';
        for (var f2 = 0; f2 < 4; f2++) {
          ctx.fillRect(f2 * 130, 100 + f2 * 20, 200, 40);
        }
        break;

      case 'onuma':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a0a1a');
        R.drawRectAbsolute(0, 140, C.CANVAS_WIDTH, 180, '#1a2a4a');
        R.drawRectAbsolute(0, 130, C.CANVAS_WIDTH, 20, '#2a3a2a');
        R.drawRectAbsolute(180, 100, 60, 35, '#2a2a2a');
        R.drawRectAbsolute(175, 120, 70, 15, '#1a1a1a');
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(190, 138, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(230, 138, 8, 0, Math.PI * 2); ctx.fill();
        break;

      case 'akagi_ranch':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#1a1a2a');
        R.drawRectAbsolute(0, 180, C.CANVAS_WIDTH, 140, '#2a2a1a');
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(100, 100, 80, 80);
        ctx.fillRect(300, 110, 60, 70);
        ctx.fillStyle = '#3a2a2a';
        ctx.beginPath();
        ctx.moveTo(90, 100); ctx.lineTo(140, 60); ctx.lineTo(190, 100);
        ctx.fill();
        ctx.fillStyle = 'rgba(150,150,170,0.25)';
        for (var f3 = 0; f3 < 6; f3++) {
          var fx2 = Math.sin(Date.now() / 3000 + f3) * 40 + f3 * 80;
          ctx.fillRect(fx2, 80 + f3 * 20, 180, 35);
        }
        break;

      case 'akagi_shrine':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a1a2a');
        R.drawRectAbsolute(0, 180, C.CANVAS_WIDTH, 140, '#1a3a5a');
        R.drawRectAbsolute(0, 170, C.CANVAS_WIDTH, 15, '#3a5a3a');
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(200, 60, 8, 110);
        ctx.fillRect(272, 60, 8, 110);
        ctx.fillRect(195, 55, 90, 8);
        ctx.fillRect(198, 75, 84, 6);
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(210, 90, 60, 80);
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath();
        ctx.moveTo(200, 90); ctx.lineTo(240, 50); ctx.lineTo(280, 90);
        ctx.fill();
        break;

      case 'battle_field':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#111122');
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

      case 'gakuen':
        // School interior (ch5)
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#2a2a3a');
        R.drawRectAbsolute(0, 200, C.CANVAS_WIDTH, 120, '#4a4a3a');
        // Desks
        for (var d = 0; d < 4; d++) {
          ctx.fillStyle = '#5a4a3a';
          ctx.fillRect(60 + d * 100, 140, 60, 30);
          ctx.fillStyle = '#4a3a2a';
          ctx.fillRect(70 + d * 100, 170, 10, 30);
          ctx.fillRect(110 + d * 100, 170, 10, 30);
        }
        // Blackboard
        R.drawRectAbsolute(100, 20, 280, 100, '#2a4a2a');
        R.drawRectAbsolute(105, 25, 270, 90, '#1a3a1a');
        R.drawTextJP('上毛学園', 190, 60, '#aaccaa', 14);
        break;

      case 'tunnel':
        // Dark tunnel (ch6)
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#050508');
        // Tunnel walls
        ctx.fillStyle = '#1a1a22';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(120, 80); ctx.lineTo(120, 240); ctx.lineTo(0, 320);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(480, 0); ctx.lineTo(360, 80); ctx.lineTo(360, 240); ctx.lineTo(480, 320);
        ctx.fill();
        // Rails
        R.drawRectAbsolute(140, 260, 200, 3, '#333');
        R.drawRectAbsolute(140, 275, 200, 3, '#333');
        // Faint light at end
        ctx.fillStyle = 'rgba(180,200,220,0.08)';
        ctx.beginPath();
        ctx.arc(240, 160, 40, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'shirane':
        // Mt Shirane volcanic area (ch4)
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#1a1a0a');
        R.drawRectAbsolute(0, 180, C.CANVAS_WIDTH, 140, '#3a3a1a');
        // Sulfur vents
        for (var v = 0; v < 5; v++) {
          var vx = 40 + v * 95;
          ctx.fillStyle = '#4a4a1a';
          ctx.fillRect(vx, 165, 20, 15);
          ctx.fillStyle = 'rgba(220,220,100,0.15)';
          var st = Date.now() / 1500 + v;
          ctx.fillRect(vx - 10, 100 + Math.sin(st) * 20, 40, 60);
        }
        break;

      default:
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, bgColor || '#000');
        break;
    }
  }

  function drawHouse(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 60, 50);
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 30, y - 30);
    ctx.lineTo(x + 65, y);
    ctx.fill();
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(x + 22, y + 25, 16, 25);
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
    var boxH = 90;
    var boxY = C.CANVAS_HEIGHT - boxH - 5;
    R.drawDialogBox(10, boxY, C.CANVAS_WIDTH - 20, boxH);

    if (currentSpeaker) {
      var nameWidth = Math.max(80, currentSpeaker.length * 14 + 20);
      R.drawDialogBox(10, boxY - 22, nameWidth, 24);
      var nameColor = C.COLORS.GOLD;
      if (currentSpeaker === 'システム') nameColor = '#88aaff';
      R.drawTextJP(currentSpeaker, 20, boxY - 18, nameColor, 13);
    }

    if (currentText) {
      var ctx = R.getContext();
      var lines = buildVisibleSegments(currentTextRaw ? currentTextRaw.substring(0, currentTextRaw.length) : currentText, 26);
      var visible = buildVisibleSegments(currentText, 26);
      for (var i = 0; i < visible.length && i < 4; i++) {
        drawColoredLine(ctx, 25, boxY + 10 + i * 18, visible[i], currentTextColor);
      }
    }

    if (choices && choices.length > 0 && waitingForInput) {
      var choiceBoxW = 220;
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
    currentSceneId = '';
    stepIndex = 0;
    waitingForInput = false;
    currentSpeaker = '';
    currentText = '';
    currentTextRaw = '';
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
    typewriterTokens = [];
    visibleCharCount = 0;
    totalVisibleChars = 0;
    typewriterIndex = 0;
    typewriterTimer = 0;
    pauseTimer = 0;
    punctuationPause = 0;
    bgmOverride = null;
  }

  function registerBuiltInScenes() {
    addScene('ch3_foreshadow', [
      { type: 'set_bg', bg: 'chapter_end' },
      { type: 'dialog', speaker: '主人公', text: 'ユウマさんに連れていかれた...？' },
      { type: 'dialog', speaker: '主人公', text: '佐藤の置き手紙にあった名前だ。' },
      { type: 'dialog', speaker: 'アカギ', text: 'アカギによると、ユウマは群馬の奥地に消えた人物らしい。', condition: function() { return true; } },
      { type: 'dialog', speaker: 'アカギ', text: '谷川岳の向こう...新潟との県境に何かがある。' },
      {
        type: 'choice',
        speaker: 'アカギ',
        prompt: 'どうする？',
        choices: [
          { text: '調べに行く', next: 'ch3_foreshadow_investigate', flag: 'chose_search' },
          { text: '仲間を待つ', next: 'ch3_foreshadow_wait', flag: 'chose_info' }
        ]
      }
    ]);

    addScene('ch3_foreshadow_investigate', [
      { type: 'dialog', speaker: '主人公', text: '行こう。谷川岳の向こうに、答えがある気がする。', condition: 'chose_search' },
      { type: 'dialog', speaker: 'アカギ', text: '*第三章へ続く...*', condition: 'chose_search' }
    ]);

    addScene('ch3_foreshadow_wait', [
      { type: 'dialog', speaker: '主人公', text: 'いや、まずは仲間を待とう。皆で向き合うべきだ。', condition: 'chose_info' },
      { type: 'dialog', speaker: 'アカギ', text: '*第三章へ続く...*', condition: 'chose_info' }
    ]);

    addScene('yuuma_clue_1', [
      { type: 'set_bg', bg: 'village' },
      { type: 'dialog', speaker: 'システム', text: '怪しげな商人が、ふと昔話を始めた。', condition: function() { return true; } },
      { type: 'dialog', speaker: '主人公', text: 'ユウマ？...ああ、あの男か。' },
      { type: 'dialog', speaker: '主人公', text: '三国峠を越えていったよ。もう何年も前の話だがね。' },
      { type: 'dialog', speaker: '主人公', text: '群馬と新潟の境...あそこには不思議な力が渦巻いている。', textColor: '#ff6666' }
    ]);

    addScene('friend_flashback', [
      { type: 'set_bg', bg: 'black' },
      { type: 'dialog', speaker: '主人公', text: '下北沢を出たあの日...4人で笑っていた。' },
      { type: 'dialog', speaker: '佐藤', text: '佐藤は運転しながら歌っていた。フルヤはずっとスマホをいじっていた。' },
      { type: 'dialog', speaker: '主人公', text: '山川は助手席で地図を広げて...「群馬って何があるんだ？」' },
      { type: 'dialog', speaker: '主人公', text: '*...全部、思い出せる。なのに自分の名前だけが...*' }
    ]);
  }

  loadFlags();
  registerBuiltInScenes();

  return {
    startEvent: startEvent,
    startScene: startScene,
    queueEvent: queueEvent,
    update: update,
    draw: draw,
    isActive: isActive,
    setFlag: setFlag,
    getFlag: getFlag,
    hasFlag: hasFlag,
    clearFlag: clearFlag,
    getPhase: getPhase,
    setPhase: setPhase,
    getChapter: getChapter,
    getBgImage: getBgImage,
    addScene: addScene,
    saveFlags: saveFlags,
    loadFlags: loadFlags,
    reset: reset
  };
})();
