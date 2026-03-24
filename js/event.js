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
          '……暗い。',
          '揺れるワゴン車のエンジン音と、',
          '下北沢から群馬へ向かう道の記憶だけが、',
          '途切れた意識の底で鳴っていた。',
          'サトウ、フルヤ、ヤマカワ――',
          '三人の声を思い出した瞬間、',
          '朽ちた森の地面でひとり目を覚ました。'
        ]
      },
      {
        bg: '#0a1a0a',
        speaker: 'おばあちゃん',
        speakerColor: '#ffaa88',
        lines: [
          'おや、目が覚めたかい。',
          'ここは群馬県の前橋じゃよ。',
          '見上げな、空に鶴みたいな裂け目があるだろう。',
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
          '結界を破るには四つの証がいる。',
          '温泉の鍵、だるまの目、',
          'こんにゃくパス、キャベツの紋章...',
          'この4つじゃ。',
          '四つそろわなけりゃ、何度でもこの県に飲まれるよ。'
        ]
      },
      {
        bg: '#0a0a22',
        speaker: null,
        lines: [
          '群馬県からの脱出が、今はじまる……。'
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
        bg: '#1a2844',
        speaker: null,
        lines: [
          '赤城を覆っていた闇が薄れ、',
          'タムラ村には久しぶりの静かな風が戻ってくる。',
          '村人たちは空を見上げ、失われかけた平穏の気配を確かめている。'
        ],
        sfx: 'victory',
        effect: 'fade'
      },
      {
        bg: '#1a2844',
        speaker: null,
        lines: [
          'だが旅はまだ終わらない。',
          '名も、仲間も、県の奥に沈んだ真実も、',
          'これから取り戻さなければならない。'
        ]
      }
    ],

    // === Chapter 1 Ending → Chapter 2 Transition ===
    ch1_ending: [
      {
        bg: '#1a1028',
        speaker: null,
        lines: [
          '県境に張りついていた光の壁が、',
          '耳をつんざく音とともに砕け散った。',
          '出口だ――そう思った瞬間、足元の地面まで震えた。'
        ],
        sfx: 'victory'
      },
      {
        bg: '#1a2030',
        speaker: null,
        lines: [
          '振り返ると、湯けむりの町、無言で並ぶだるま、',
          'ぬめるこんにゃく、風に揺れる嬬恋キャベツが脳裏をよぎる。',
          '短いはずの旅は、もう思い出の形をしていた。'
        ]
      },
      {
        bg: '#08110c',
        speaker: null,
        lines: [
          'だが県境の向こうに広がっていたのは自由ではなかった。',
          'そこには、さらに深く、さらに濃い',
          '"群馬の森"が待っていた。'
        ],
        effect: 'shake'
      },
      {
        bg: '#0a1a0a',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          'おい……生きてるか？',
          '立てるなら来い。',
          'ここで倒れてたら、本当に群馬に喰われるぞ。'
        ]
      },
      {
        bg: '#0a0a22',
        speaker: null,
        lines: [
          '第一章 群馬脱出編 ―― END'
        ],
        effect: 'fade'
      }
    ],

    // === Chapter 2 Opening ===
    ch2_opening: [
      {
        bg: '#101020',
        speaker: null,
        lines: [
          '第二章 赤城の闇編'
        ]
      },
      {
        bg: '#0a1a0a',
        speaker: null,
        lines: [
          '冷たい土の匂いで目を覚ます。',
          'たしかに県境は越えたはずだった。',
          'なのに視界を埋めるのは、またしても群馬の暗い森だった。'
        ]
      },
      {
        bg: '#0f1820',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          '俺はアカギ。タムラ村の人間だ。',
          'この辺りを荒らしてる"暗鞍"は、',
          '昔は荷を運んでいたトラック運転手たちだ。',
          '高速が閉じて仕事を失ってから、',
          '連中は名まで忘れて、ナンバープレートで呼び合う賊になった。'
        ]
      },
      {
        bg: '#1a1430',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          '村には村長の龝櫻（シュウオウ）がいる。',
          'ここじゃ敬意がなければ勝負も始まらない。',
          '生き残る方法は博打だけ――',
          'シュウオウにもらう特別なサイコロを使いこなせ。'
        ]
      },
      {
        bg: '#0a0a22',
        speaker: null,
        lines: [
          '新たな冒険が始まる……',
          '特別なダイスの力を使いこなせ！'
        ],
        effect: 'fade'
      }
    ],

    // Pre-Chuji boss event
    preChuji: [
      {
        bg: '#1a1a2a',
        speaker: null,
        lines: [
          '霧に沈んだ廃牧場。',
          '崩れた柵の向こうに、',
          '人とも影ともつかぬ威圧的な姿が立っていた。'
        ]
      },
      {
        bg: '#1a1a2a',
        speaker: '国定忠治',
        speakerColor: '#ffcc44',
        lines: [
          '賭けの奥へ踏み込むのは危ねぇぞ。',
          'おめぇさんはもう、一歩そっち側へ足を入れちまってる。',
          '俺は盗人だった。死体まで盗まれた男の忠告だ。'
        ]
      },
      {
        bg: '#141428',
        speaker: null,
        lines: [
          '敬意がなければ勝負は始まらない。',
          'それでも、お前は戦うのか？'
        ],
        effect: 'shake'
      }
    ],

    // Pre-Angura Boss event
    preAnguraBoss: [
      {
        bg: '#0a1a2a',
        speaker: null,
        lines: [
          '赤城神社の闇に、巨大な影がうごめく。',
          '軋む車輪の音とともに、',
          'それは山ほどの荷車を引いて現れた。'
        ]
      },
      {
        bg: '#101020',
        speaker: 'ナンバー12-グンマ',
        speakerColor: '#ff4444',
        lines: [
          '俺たちはただの運び屋だった……。',
          '名前なんて忘れた、残ったのはナンバープレートだけだ。',
          '届ける場所を失って、俺たちは荷物より先に自分をなくした。'
        ]
      },
      {
        bg: '#180808',
        speaker: null,
        lines: [
          'ここは配達人たちの墓場だ！！'
        ],
        effect: 'shake'
      }
    ],

    // Ch2 Ending
    ch2_ending: [
      {
        bg: '#1a140a',
        speaker: null,
        lines: [
          'ナンバー12-グンマが膝をつく。',
          '荷車は横倒しになり、こんにゃく、下仁田ねぎ、',
          '木彫り細工が石畳へと雪崩れ落ちた。'
        ]
      },
      {
        bg: '#1a1830',
        speaker: '花（はな）',
        speakerColor: '#ff88aa',
        lines: [
          '助けてくれて、ありがとうございます。',
          'お父さまも村のみんなも、',
          'ずっとあなたが来るって信じていました。'
        ]
      },
      {
        bg: '#201030',
        speaker: '龝櫻（シュウオウ）',
        speakerColor: '#cc88ff',
        lines: [
          'お前の敬意……しかと見届けた。',
          '群馬で生きることにも、たしかに意味はある。',
          'その意味を背負える者だけが、次の賭けへ進めるのだ。'
        ]
      },
      {
        bg: '#0a0a1a',
        speaker: null,
        lines: [
          '大沼で見つかったワゴン車から、一枚のメモが出てきた。',
          'サトウの字だ――',
          '「ユウマさんに連れて行かれた。助けに来るな」',
          'ユウマ……それは誰なんだ？'
        ]
      },
      {
        bg: '#0a0a22',
        speaker: null,
        lines: [
          '赤城の闇は晴れた。',
          'だが物語は終わらない……',
          '仲間たちはまだ、その先にいる。'
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

    // Check if the event has flag conditions
    if (eventData.condition && !checkFlag(eventData.condition)) {
      if (callback) callback();
      return;
    }

    active = true;
    scenes = eventData.scenes || [];
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

        // --- System Action Handling ---
        var curScene = scenes[sceneIndex];
        if (curScene && curScene.type === 'system') {
            if (curScene.action === 'show_title') {
                currentEndingTitle = curScene.value;
            }
        }

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

  function registerEndingEvents(endingData) {
    for (var i = 0; i < endingData.length; i++) {
        var event = endingData[i];
        var eventScenes = [];
        for (var j = 0; j < event.scenes.length; j++) {
            var s = event.scenes[j];
            if (s.type === 'narration') {
                eventScenes.push({ bg: '#000018', speaker: null, lines: [s.text] });
            } else if (s.type === 'dialog') {
                var col = Game.Config.COLORS.GOLD;
                if (s.speaker === 'アカギ') col = '#44aaff';
                if (s.speaker === 'ヤマカワ') col = '#ff88aa';
                if (s.speaker === 'フルヤ') col = '#aaff88';
                if (s.speaker === 'ジューク') col = '#ff4444';
                eventScenes.push({ bg: '#0a1020', speaker: s.speaker, speakerColor: col, lines: [s.text] });
            } else if (s.type === 'system') {
                eventScenes.push({ bg: '#000', type: 'system', action: s.action, value: s.value, lines: [' '] });
            }
        }
        events[event.event_id] = eventScenes;
    }
  }

  function hasEvent(id) {
    return !!events[id];
  }

  var currentEndingTitle = '';
  function getEndingTitle() { return currentEndingTitle; }

  return {
    start: start,
    update: update,
    draw: draw,
    isActive: isActive,
    addEvent: addEvent,
    hasEvent: hasEvent,
    registerEndingEvents: registerEndingEvents,
    getEndingTitle: getEndingTitle
  };
})();
