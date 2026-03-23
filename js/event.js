// Event scene system - full-screen story/cutscene display
Game.Event = (function() {
  var active = false;
  var scenes = [];       // array of scene objects
  var sceneIndex = 0;
  var lineIndex = 0;
  var charIndex = 0;     // for typewriter effect
  var charTimer = 0;
  var charSpeed = 2;     // frames per character
  var fadeAlpha = 0;
  var fadeDir = 0;       // 1 = fading in, -1 = fading out, 0 = none
  var waitTimer = 0;
  var onComplete = null;
  var textComplete = false;

  // Scene format:
  // {
  //   bg: '#color' or 'pattern_name',
  //   speaker: 'Name' or null,
  //   speakerColor: '#color',
  //   lines: ['line1', 'line2', ...],
  //   effect: 'fade' | 'shake' | null,
  //   bgm: 'bgm_name' or null,
  //   sfx: 'sfx_name' or null
  // }

  // Predefined event scripts
  var events = {
    // Opening event when game starts
    opening: [
      {
        bg: '#000011',
        speaker: null,
        lines: [
          'ある日、あなたは目を覚ました。',
          '見知らぬ場所...ここは一体...？'
        ]
      },
      {
        bg: '#0a1a0a',
        speaker: 'おばあちゃん',
        speakerColor: '#ffaa88',
        lines: [
          'おや、目が覚めたかい。',
          'ここは群馬県の前橋じゃよ。',
          '群馬県は一度入ったら出られない...',
          'そういう言い伝えがあるんじゃ。'
        ]
      },
      {
        bg: '#0a1a0a',
        speaker: 'おばあちゃん',
        speakerColor: '#ffaa88',
        lines: [
          'でも方法がないわけじゃないよ。',
          '群馬県の四方にある「証」を集めれば',
          '県境の結界を破れるという...',
          '温泉の鍵、だるまの目、',
          'こんにゃくパス、キャベツの紋章...',
          'この4つじゃ。'
        ]
      },
      {
        bg: '#0a0a22',
        speaker: null,
        lines: [
          'こうして、群馬県からの脱出が始まった...'
        ],
        effect: 'fade'
      }
    ],

    // First key obtained
    firstKey: [
      {
        bg: '#111122',
        speaker: null,
        lines: [
          '最初の証を手に入れた！',
          'あと3つ...群馬の力を感じる...'
        ]
      }
    ],

    // Pre-boss event at Tsumagoi
    preBoss: [
      {
        bg: '#0a1a0a',
        speaker: null,
        lines: [
          '嬬恋の空気が変わった...',
          '強大な気配を感じる。'
        ]
      },
      {
        bg: '#1a0a0a',
        speaker: 'キャベツ番人',
        speakerColor: '#66dd66',
        lines: [
          'よくぞここまで来た、旅の者よ。',
          '3つの証を持っているようだな。',
          'しかし、最後の紋章はそう簡単には渡せぬ。',
          'この群馬を出るにふさわしい者か...',
          '我が見極めてやろう！'
        ]
      }
    ],

    // All keys collected
    allKeys: [
      {
        bg: '#112244',
        speaker: null,
        lines: [
          '4つの証が揃った！',
          '温泉の鍵が光っている...',
          'だるまの目が見開いた...',
          'こんにゃくパスが震えている...',
          'キャベツの紋章が輝いている...'
        ],
        effect: 'shake'
      },
      {
        bg: '#223355',
        speaker: null,
        lines: [
          '県境の結界が弱まっていく...',
          '今なら脱出できるかもしれない！',
          '嬬恋の南にある県境を目指そう！'
        ]
      }
    ],

    // Pre-ending (Ch2 only)
    preEnding: [
      {
        bg: '#001122',
        speaker: null,
        lines: [
          '赤城の闇が...晴れていく...'
        ],
        sfx: 'victory'
      },
      {
        bg: '#112244',
        speaker: null,
        lines: [
          '暗鞍の支配が終わった。',
          'タムラ村に平和が戻る...'
        ],
        effect: 'fade'
      }
    ],

    // === Chapter 1 Ending → Chapter 2 Transition ===
    ch1_ending: [
      {
        bg: '#001122',
        speaker: null,
        lines: [
          '県境に近づくと、結界が砕け散った！'
        ],
        sfx: 'victory'
      },
      {
        bg: '#112244',
        speaker: null,
        lines: [
          'ついに...ついに脱出できる...！',
          '振り返ると群馬県が見えた。',
          '温泉、だるま、こんにゃく、キャベツ...',
          '不思議な県だったが、少し名残惜しい。'
        ]
      },
      {
        bg: '#0a0a0a',
        speaker: null,
        lines: [
          '...しかし',
          '一歩踏み出した先に広がっていたのは...',
          '更に深い...群馬の森だった。'
        ],
        effect: 'shake'
      },
      {
        bg: '#0a1a0a',
        speaker: null,
        lines: [
          '「第一章  群馬脱出編  ー 完 ー」'
        ],
        effect: 'fade'
      }
    ],

    // === Chapter 2 Opening ===
    ch2_opening: [
      {
        bg: '#050510',
        speaker: null,
        lines: [
          '「第二章  赤城の闇編」'
        ]
      },
      {
        bg: '#0a0a0a',
        speaker: null,
        lines: [
          '気がつくと、暗い森の中に立っていた。',
          '県境を越えたはずなのに...',
          'ここはまだ群馬県の奥地のようだ。'
        ]
      },
      {
        bg: '#0a1a0a',
        speaker: '謎の声',
        speakerColor: '#cc4444',
        lines: [
          'おい、お前...生きてるな？',
          'こっちだ。村まで案内してやる。',
          'ここは赤城山の麓...タムラ村の近くだ。',
          '最近この辺りは「暗鞍（アングラ）」って',
          '連中が暴れまわってるんだ。',
          'サイコロの力...お前なら使えるかもな。'
        ]
      },
      {
        bg: '#0a1a0a',
        speaker: null,
        lines: [
          '新たな冒険が始まる...',
          '特殊なサイコロの力を手に入れろ！'
        ],
        effect: 'fade'
      }
    ],

    // Pre-Chuji boss event
    preChuji: [
      {
        bg: '#1a1a0a',
        speaker: null,
        lines: [
          '牧場の廃墟に、威圧的な男が立っていた。'
        ]
      },
      {
        bg: '#1a1a0a',
        speaker: '国定忠治',
        speakerColor: '#ffcc44',
        lines: [
          'よう、若いの。',
          '博打の道に足を踏み入れたようだな。',
          'お前のサイコロ...見せてもらおうか。',
          '真の博打とはなにか、教えてやろう！'
        ]
      }
    ],

    // Pre-Angura Boss event
    preAnguraBoss: [
      {
        bg: '#1a0a0a',
        speaker: null,
        lines: [
          '赤城神社の前に、巨大な影が立ちはだかった。'
        ]
      },
      {
        bg: '#220a0a',
        speaker: 'ナンバー12-グンマ',
        speakerColor: '#ff4444',
        lines: [
          '止まれ...これ以上、',
          '俺たちの道を踏み荒らすな...ッ',
          'ここは...俺たち"運び屋の墓場"なんだよォ！！'
        ],
        effect: 'shake'
      }
    ],

    // Ch2 Ending
    ch2_ending: [
      {
        bg: '#112244',
        speaker: null,
        lines: [
          '暗鞍のボスを倒した。',
          'タムラ村に平和が戻り始めた。'
        ]
      },
      {
        bg: '#223355',
        speaker: '花（はな）',
        speakerColor: '#ff88aa',
        lines: [
          'ありがとう...あなたのおかげで...',
          '村は救われました。',
          'あなたのサイコロの力...本当にすごかった。'
        ]
      },
      {
        bg: '#0a1a3a',
        speaker: '龝櫻（シュウオウ）',
        speakerColor: '#cc88ff',
        lines: [
          'お前のリスペクト...確かに見せてもらったぞ。',
          '群馬から出る方法は...ないのかもしれん。',
          'じゃが、ここで生きることに',
          '意味がないわけではなかろう。',
          '...これからも、よろしく頼むぞ。'
        ]
      },
      {
        bg: '#001122',
        speaker: null,
        lines: [
          'こうして、赤城の闇は晴れた。',
          'だが、群馬の物語はまだ続く...'
        ],
        effect: 'fade'
      }
    ]
  };

  function start(eventId, callback) {
    var eventData = events[eventId];
    if (!eventData) {
      if (callback) callback();
      return;
    }
    active = true;
    scenes = eventData;
    sceneIndex = 0;
    lineIndex = 0;
    charIndex = 0;
    charTimer = 0;
    fadeAlpha = 1;
    fadeDir = -1; // fade in
    waitTimer = 0;
    textComplete = false;
    onComplete = callback || null;

    var firstScene = scenes[0];
    if (firstScene.bgm) Game.Audio.playBgm(firstScene.bgm);
    if (firstScene.sfx) Game.Audio.playSfx(firstScene.sfx);
  }

  function update() {
    if (!active) return null;

    // Handle fade
    if (fadeDir !== 0) {
      fadeAlpha += fadeDir * 0.03;
      if (fadeAlpha <= 0) {
        fadeAlpha = 0;
        fadeDir = 0;
      }
      if (fadeAlpha >= 1) {
        fadeAlpha = 1;
        fadeDir = 0;
        // If fading out (between scenes), advance
        if (sceneIndex >= scenes.length) {
          active = false;
          if (onComplete) onComplete();
          return { result: 'done' };
        }
      }
      return null;
    }

    if (waitTimer > 0) {
      waitTimer--;
      return null;
    }

    var scene = scenes[sceneIndex];
    if (!scene) {
      active = false;
      if (onComplete) onComplete();
      return { result: 'done' };
    }

    // Typewriter effect
    if (!textComplete) {
      charTimer++;
      if (charTimer >= charSpeed) {
        charTimer = 0;
        charIndex++;
        var currentLine = scene.lines[lineIndex] || '';
        if (charIndex >= currentLine.length) {
          textComplete = true;
        }
      }
    }

    // Advance on confirm
    if (Game.Input.isPressed('confirm')) {
      if (!textComplete) {
        // Skip typewriter, show full line
        var currentLine = scene.lines[lineIndex] || '';
        charIndex = currentLine.length;
        textComplete = true;
        return null;
      }

      // Next line
      lineIndex++;
      if (lineIndex >= scene.lines.length) {
        // Next scene
        sceneIndex++;
        lineIndex = 0;
        charIndex = 0;
        charTimer = 0;
        textComplete = false;

        if (sceneIndex >= scenes.length) {
          // End of event
          if (scene.effect === 'fade') {
            fadeDir = 1; // fade out
          } else {
            active = false;
            if (onComplete) onComplete();
            return { result: 'done' };
          }
        } else {
          // Transition between scenes
          var nextScene = scenes[sceneIndex];
          if (nextScene.bgm) {
            Game.Audio.stopBgm();
            Game.Audio.playBgm(nextScene.bgm);
          }
          if (nextScene.sfx) Game.Audio.playSfx(nextScene.sfx);

          if (scene.effect === 'fade') {
            fadeDir = 1; // fade out then in
            waitTimer = 5;
          }
        }
      } else {
        charIndex = 0;
        charTimer = 0;
        textComplete = false;
        Game.Audio.playSfx('confirm');
      }
    }

    return null;
  }

  function draw() {
    if (!active) return;

    var R = Game.Renderer;
    var C = Game.Config;
    var ctx = R.getContext();

    var scene = scenes[sceneIndex];
    if (!scene) return;

    // Background
    var bg = scene.bg || '#000011';
    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, bg);

    // Atmospheric particles
    var t = Date.now() / 1000;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (var i = 0; i < 15; i++) {
      var px = (Math.sin(t * 0.3 + i * 2.1) * 0.5 + 0.5) * C.CANVAS_WIDTH;
      var py = (Math.cos(t * 0.2 + i * 1.7) * 0.5 + 0.5) * C.CANVAS_HEIGHT;
      ctx.fillRect(px, py, 2, 2);
    }

    // Shake effect
    var shakeOffsetX = 0, shakeOffsetY = 0;
    if (scene.effect === 'shake') {
      shakeOffsetX = (Math.random() - 0.5) * 3;
      shakeOffsetY = (Math.random() - 0.5) * 3;
    }

    // Top decorative line
    R.drawRectAbsolute(20, 60, C.CANVAS_WIDTH - 40, 1, '#334');

    // Speaker name
    if (scene.speaker) {
      var speakerColor = scene.speakerColor || C.COLORS.GOLD;
      R.drawTextJP(scene.speaker, 40 + shakeOffsetX, 42 + shakeOffsetY, speakerColor, 16);
    }

    // Text area - show all previous lines + current line with typewriter
    var textStartY = 80;
    var lineHeight = 28;
    var maxDisplayLines = 6;
    var startLine = Math.max(0, lineIndex - maxDisplayLines + 1);

    for (var i = startLine; i <= lineIndex && i < scene.lines.length; i++) {
      var y = textStartY + (i - startLine) * lineHeight + shakeOffsetY;
      var x = 50 + shakeOffsetX;

      if (i < lineIndex) {
        // Previous lines: full text, slightly dimmed
        R.drawTextJP(scene.lines[i], x, y, '#aaaacc', 15);
      } else {
        // Current line: typewriter effect
        var displayText = scene.lines[i].substring(0, charIndex);
        R.drawTextJP(displayText, x, y, '#ffffff', 15);
      }
    }

    // Bottom decorative line
    R.drawRectAbsolute(20, C.CANVAS_HEIGHT - 60, C.CANVAS_WIDTH - 40, 1, '#334');

    // Advance prompt
    if (textComplete) {
      var blinkT = Date.now() / 400;
      if (Math.sin(blinkT) > 0) {
        R.drawTextJP('▼', C.CANVAS_WIDTH - 45, C.CANVAS_HEIGHT - 50, '#aaa', 14);
      }
    }

    // Scene counter (small)
    R.drawTextJP((sceneIndex + 1) + '/' + scenes.length, 20, C.CANVAS_HEIGHT - 18, '#333', 10);

    // Fade overlay
    if (fadeAlpha > 0) {
      R.fadeOverlay(fadeAlpha);
    }
  }

  function isActive() { return active; }

  // Allow adding custom events at runtime
  function addEvent(id, sceneData) {
    events[id] = sceneData;
  }

  function hasEvent(id) {
    return !!events[id];
  }

  return {
    start: start,
    update: update,
    draw: draw,
    isActive: isActive,
    addEvent: addEvent,
    hasEvent: hasEvent
  };
})();
