// Simple chiptune audio system using Web Audio API
Game.Audio = (function() {
  var audioCtx = null;
  var masterGain = null;
  var currentBgm = null;
  var currentBgmNodes = [];
  var currentBgmRequestedName = null;
  var currentBgmResolvedName = null;
  var muted = false;

  function init() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.3;
      masterGain.connect(audioCtx.destination);
    } catch (e) {
      // Audio not supported
    }
  }

  function ensureContext() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playNote(freq, duration, type, startTime, gain) {
    if (!audioCtx || muted || freq <= 0) return;
    ensureContext();
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    g.gain.value = gain || 0.15;
    g.gain.setValueAtTime(gain || 0.15, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.01);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function playSweep(startFreq, endFreq, duration, type, startTime, gain) {
    if (!audioCtx || muted) return;
    ensureContext();
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), startTime + duration);
    g.gain.setValueAtTime(gain || 0.15, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function playThunderNoise(startTime, duration, gain) {
    if (!audioCtx || muted) return;
    ensureContext();
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, startTime);
    for (var i = 1; i <= 12; i++) {
      osc.frequency.setValueAtTime(60 + Math.random() * 180, startTime + duration * (i / 12));
    }
    g.gain.setValueAtTime(gain || 0.18, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function trackBgmNode(osc, gainNode) {
    var handle = { osc: osc, gain: gainNode };
    currentBgmNodes.push(handle);
    osc.onended = function() {
      var idx = currentBgmNodes.indexOf(handle);
      if (idx >= 0) currentBgmNodes.splice(idx, 1);
      try { gainNode.disconnect(); } catch (e) {}
    };
  }

  function playBgmNote(freq, duration, type, startTime, gain) {
    if (!audioCtx || muted || freq <= 0) return;
    ensureContext();
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    g.gain.value = gain || 0.15;
    g.gain.setValueAtTime(gain || 0.15, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.01);
    osc.connect(g);
    g.connect(masterGain);
    trackBgmNode(osc, g);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Simple melodies defined as [freq, duration] arrays
  var melodies = {
    title: [
      [262, 0.2], [330, 0.2], [392, 0.2], [523, 0.4],
      [392, 0.2], [330, 0.2], [262, 0.4],
      [294, 0.2], [349, 0.2], [440, 0.2], [523, 0.4],
      [440, 0.2], [349, 0.2], [294, 0.4]
    ],
    battle: [
      [196, 0.15], [233, 0.15], [262, 0.15], [196, 0.15],
      [233, 0.15], [262, 0.15], [294, 0.15], [262, 0.15],
      [220, 0.15], [262, 0.15], [294, 0.15], [220, 0.15],
      [262, 0.15], [294, 0.15], [330, 0.15], [294, 0.15]
    ],
    field: [
      [330, 0.3], [294, 0.3], [262, 0.3], [294, 0.3],
      [330, 0.3], [330, 0.3], [330, 0.6],
      [294, 0.3], [294, 0.3], [294, 0.6],
      [330, 0.3], [392, 0.3], [392, 0.6]
    ],
    field_maebashi: [
      [330, 0.25], [349, 0.25], [392, 0.35], [330, 0.25],
      [294, 0.25], [262, 0.35], [294, 0.3], [330, 0.45],
      [392, 0.25], [440, 0.25], [392, 0.35], [349, 0.25],
      [330, 0.25], [294, 0.35], [262, 0.55]
    ],
    field_takasaki: [
      [349, 0.22], [392, 0.22], [440, 0.3], [392, 0.22],
      [349, 0.22], [330, 0.3], [349, 0.24], [392, 0.36],
      [440, 0.22], [494, 0.22], [440, 0.3], [392, 0.22],
      [349, 0.22], [330, 0.3], [294, 0.5]
    ],
    field_westroad: [
      [294, 0.28], [330, 0.24], [349, 0.28], [392, 0.4],
      [349, 0.24], [330, 0.24], [294, 0.3], [262, 0.4],
      [294, 0.24], [330, 0.24], [349, 0.28], [392, 0.28],
      [440, 0.3], [392, 0.28], [349, 0.5]
    ],
    field_tomioka: [
      [262, 0.25], [330, 0.25], [392, 0.3], [440, 0.3],
      [392, 0.25], [330, 0.25], [294, 0.3], [330, 0.35],
      [349, 0.25], [392, 0.25], [440, 0.3], [392, 0.25],
      [349, 0.25], [330, 0.3], [262, 0.55]
    ],
    field_highland: [
      [392, 0.22], [440, 0.22], [494, 0.28], [523, 0.36],
      [494, 0.22], [440, 0.22], [392, 0.28], [349, 0.32],
      [392, 0.22], [440, 0.22], [494, 0.28], [587, 0.32],
      [523, 0.24], [494, 0.24], [440, 0.48]
    ],
    field_kusatsu: [
      [392, 0.2], [440, 0.2], [392, 0.2], [349, 0.2],
      [294, 0.25], [262, 0.25], [294, 0.2], [349, 0.2],
      [392, 0.28], [440, 0.18], [494, 0.18], [523, 0.3],
      [494, 0.18], [440, 0.18], [392, 0.45]
    ],
    field_forest: [
      [220, 0.35], [247, 0.22], [262, 0.28], [247, 0.35],
      [220, 0.28], [196, 0.35], [220, 0.25], [247, 0.42],
      [262, 0.25], [294, 0.25], [262, 0.28], [247, 0.3],
      [220, 0.3], [196, 0.35], [174, 0.55]
    ],
    field_akagi: [
      [247, 0.3], [262, 0.24], [294, 0.28], [330, 0.36],
      [294, 0.22], [262, 0.24], [247, 0.28], [220, 0.38],
      [247, 0.24], [262, 0.24], [294, 0.28], [349, 0.32],
      [330, 0.24], [294, 0.26], [247, 0.55]
    ],
    field_haruna: [
      [262, 0.4], [0, 0.16], [247, 0.28], [220, 0.4],
      [0, 0.16], [196, 0.36], [220, 0.24], [247, 0.36],
      [262, 0.3], [294, 0.24], [262, 0.3], [247, 0.3],
      [220, 0.4], [196, 0.55]
    ],
    shop: [
      [392, 0.2], [440, 0.2], [494, 0.2], [523, 0.2],
      [494, 0.2], [440, 0.2], [392, 0.4],
      [349, 0.2], [392, 0.2], [440, 0.2], [392, 0.4],
      [330, 0.2], [349, 0.2], [392, 0.2], [349, 0.4]
    ],
    event: [
      [262, 0.5], [294, 0.5], [330, 0.5], [262, 0.5],
      [294, 0.5], [330, 0.5], [349, 0.5], [330, 0.5]
    ],
    boss: [
      [220, 0.12], [196, 0.12], [174, 0.12], [196, 0.12],
      [247, 0.12], [220, 0.12], [196, 0.12], [174, 0.12],
      [262, 0.12], [247, 0.12], [220, 0.12], [196, 0.12],
      [294, 0.12], [262, 0.12], [247, 0.12], [220, 0.12],
      [330, 0.18], [294, 0.12], [262, 0.12], [247, 0.18]
    ],
    dungeon: [
      [196, 0.45], [0, 0.18], [233, 0.38], [0, 0.18],
      [185, 0.5], [0, 0.22], [174, 0.38], [0, 0.18],
      [196, 0.45], [0, 0.18], [262, 0.3], [247, 0.3],
      [196, 0.5], [0, 0.2], [165, 0.6], [0, 0.3]
    ],
    victory_fanfare: [
      [262, 0.12], [330, 0.12], [392, 0.12], [523, 0.2],
      [392, 0.12], [523, 0.12], [659, 0.18], [523, 0.15],
      [784, 0.35]
    ],
    sad: [
      [392, 0.55], [349, 0.55], [330, 0.55], [294, 0.55],
      [262, 0.7], [247, 0.55], [220, 0.8], [196, 0.9]
    ],
    melancholy_battle: [ // 霧の牧場に残った義賊の哀愁
      [220, 0.36], [0, 0.12], [262, 0.24], [294, 0.42],
      [330, 0.28], [294, 0.18], [262, 0.24], [220, 0.52],
      [196, 0.34], [0, 0.12], [220, 0.24], [262, 0.38],
      [294, 0.26], [262, 0.18], [220, 0.3], [196, 0.58]
    ],
    melancholy_victory: [ // 勝っても胸の奥に重さだけ残る後奏
      [262, 0.22], [294, 0.22], [330, 0.3], [294, 0.18],
      [262, 0.18], [220, 0.34], [196, 0.5], [220, 0.52]
    ],
    kusatsu_bushi: [
      [392, 0.2], [440, 0.2], [392, 0.2], [349, 0.2],
      [294, 0.25], [262, 0.25], [294, 0.2], [349, 0.2],
      [392, 0.3], [392, 0.15], [440, 0.15], [392, 0.2],
      [349, 0.2], [294, 0.25], [262, 0.35], [0, 0.15]
    ],

    // ── 章別フィールドBGM ──
    ch4_shirane: [ // 硫黄の匂いと煮えたぎる不穏な環境音
      [147, 0.6], [0, 0.2], [156, 0.5], [0, 0.3],
      [131, 0.7], [0, 0.2], [147, 0.4], [139, 0.5],
      [0, 0.4], [131, 0.6], [0, 0.2], [147, 0.8]
    ],
    ch5_gakuen: [ // 歪んだチャイムと郷愁を誘うピアノ
      [523, 0.25], [440, 0.25], [494, 0.25], [392, 0.5],
      [0, 0.3], [440, 0.3], [392, 0.3], [349, 0.5],
      [0, 0.3], [330, 0.4], [294, 0.3], [262, 0.6]
    ],
    ch6_tunnel: [ // 凍える風と地下の反響音
      [110, 0.8], [0, 0.4], [117, 0.6], [0, 0.3],
      [104, 0.7], [0, 0.5], [98, 0.9], [0, 0.3],
      [110, 0.5], [0, 0.2], [123, 0.6], [110, 0.8]
    ],
    ch7_haruna: [ // 濃霧と静かな湖面の波紋
      [262, 0.5], [0, 0.3], [247, 0.4], [0, 0.2],
      [220, 0.6], [0, 0.3], [196, 0.5], [0, 0.4],
      [220, 0.4], [247, 0.3], [262, 0.7], [0, 0.3]
    ],
    ch8_oze: [ // 泥の泡立つ音と沈みゆく重低音
      [82, 0.5], [0, 0.2], [87, 0.4], [0, 0.3],
      [73, 0.6], [0, 0.3], [82, 0.5], [87, 0.3],
      [0, 0.4], [73, 0.7], [0, 0.2], [82, 0.8]
    ],
    ch9_minakami: [ // 冷たい川のせせらぎと張り詰めた空気
      [330, 0.3], [349, 0.2], [330, 0.3], [294, 0.4],
      [0, 0.2], [262, 0.3], [294, 0.3], [330, 0.5],
      [0, 0.3], [294, 0.4], [262, 0.3], [247, 0.6]
    ],
    ch10_border: [ // 現実のノイズが混じる終末のアンビエント
      [196, 0.4], [185, 0.3], [196, 0.3], [0, 0.2],
      [174, 0.5], [0, 0.3], [165, 0.6], [0, 0.2],
      [196, 0.3], [208, 0.3], [196, 0.5], [0, 0.4]
    ],

    // ── 章別ボス戦BGM ──
    ch4_kumako_battle: [ // 蒸気と温泉の妖しいワルツ
      [220, 0.18], [262, 0.18], [330, 0.18], [262, 0.18],
      [220, 0.18], [196, 0.18], [220, 0.18], [262, 0.36],
      [330, 0.18], [392, 0.18], [330, 0.18], [262, 0.18],
      [294, 0.18], [262, 0.18], [220, 0.36]
    ],
    ch5_juke_battle: [ // 運動会の行進曲を狂わせたような曲
      [262, 0.12], [262, 0.12], [330, 0.12], [262, 0.12],
      [392, 0.24], [349, 0.24],
      [262, 0.12], [262, 0.12], [330, 0.12], [262, 0.12],
      [440, 0.24], [392, 0.24],
      [494, 0.12], [440, 0.12], [392, 0.12], [330, 0.24]
    ],
    ch6_sato_battle: [ // 悲壮な決意を感じる静かなストリングス
      [262, 0.5], [247, 0.5], [220, 0.5], [196, 0.5],
      [220, 0.5], [262, 0.5], [247, 0.75], [0, 0.25],
      [220, 0.5], [247, 0.5], [262, 0.5], [294, 0.75]
    ],
    ch7_beast_battle: [ // 底知れぬ恐怖と野生の咆哮
      [147, 0.15], [174, 0.15], [196, 0.15], [174, 0.15],
      [147, 0.15], [131, 0.15], [147, 0.3],
      [196, 0.15], [220, 0.15], [247, 0.15], [220, 0.15],
      [196, 0.15], [174, 0.15], [147, 0.3],
      [262, 0.2], [247, 0.15], [196, 0.15], [174, 0.3]
    ],
    ch8_mud_battle: [ // 足を取られるような泥臭いビート
      [110, 0.2], [0, 0.1], [131, 0.2], [0, 0.1],
      [110, 0.2], [147, 0.2], [131, 0.2], [0, 0.1],
      [110, 0.3], [0, 0.1], [98, 0.2], [110, 0.2],
      [131, 0.3], [110, 0.2], [98, 0.3]
    ],
    ch9_juke_battle: [ // 運命に抗うようなテンポの速いロック
      [330, 0.1], [392, 0.1], [440, 0.1], [392, 0.1],
      [330, 0.1], [294, 0.1], [330, 0.2],
      [440, 0.1], [494, 0.1], [523, 0.1], [494, 0.1],
      [440, 0.1], [392, 0.1], [440, 0.2],
      [523, 0.15], [494, 0.1], [440, 0.1], [392, 0.15]
    ],
    ch10_final_battle: [ // 全てを巻き込む壮大で哀しいオーケストラ
      [196, 0.2], [220, 0.2], [262, 0.2], [294, 0.2],
      [330, 0.3], [294, 0.15], [262, 0.15], [220, 0.3],
      [262, 0.2], [294, 0.2], [330, 0.2], [392, 0.2],
      [440, 0.3], [392, 0.15], [330, 0.15], [294, 0.3],
      [262, 0.2], [330, 0.2], [392, 0.4]
    ],

    // ── 章別勝利BGM ──
    ch4_victory: [ // 悲壮感の漂う浄化
      [262, 0.2], [294, 0.2], [330, 0.3], [294, 0.15],
      [262, 0.15], [247, 0.4], [262, 0.5]
    ],
    ch5_victory: [ // 放課後の夕暮れのような達成感
      [392, 0.15], [440, 0.15], [494, 0.15], [523, 0.3],
      [494, 0.15], [440, 0.15], [392, 0.3], [440, 0.5]
    ],
    ch6_victory: [ // 復活のカタルシスと希望
      [330, 0.15], [392, 0.15], [440, 0.15], [523, 0.25],
      [440, 0.1], [523, 0.15], [659, 0.2], [784, 0.4]
    ],
    ch7_victory: [ // 霧が晴れていくような静寂
      [330, 0.3], [349, 0.3], [392, 0.3], [440, 0.5],
      [392, 0.3], [349, 0.5]
    ],
    ch8_victory: [ // 辛くも生き延びた安堵
      [262, 0.25], [294, 0.25], [330, 0.25], [349, 0.35],
      [330, 0.2], [294, 0.2], [262, 0.5]
    ],
    ch9_victory: [ // 痛みを伴う真実の開示
      [392, 0.3], [349, 0.3], [330, 0.4], [294, 0.3],
      [330, 0.3], [392, 0.5]
    ],
    ch10_ending: [ // 静かな鐘の音と朝焼け
      [262, 0.4], [330, 0.4], [392, 0.4], [523, 0.6],
      [0, 0.3], [392, 0.3], [523, 0.3], [659, 0.5],
      [784, 0.8]
    ]
  };

  var oneShotBgm = {
    victory_fanfare: true,
    melancholy_victory: true,
    ch4_victory: true,
    ch5_victory: true,
    ch6_victory: true,
    ch7_victory: true,
    ch8_victory: true,
    ch9_victory: true,
    ch10_ending: true
  };

  var bgmVariants = {
    field_maebashi: [
      melodies.field_maebashi,
      [
        [330, 0.22], [392, 0.22], [440, 0.3], [392, 0.22],
        [349, 0.22], [330, 0.3], [294, 0.22], [330, 0.34],
        [349, 0.22], [392, 0.22], [349, 0.28], [330, 0.22],
        [294, 0.22], [262, 0.48]
      ]
    ],
    field_takasaki: [
      melodies.field_takasaki,
      [
        [392, 0.2], [440, 0.2], [494, 0.26], [440, 0.2],
        [392, 0.2], [349, 0.26], [330, 0.2], [349, 0.3],
        [392, 0.2], [440, 0.2], [392, 0.26], [349, 0.2],
        [330, 0.2], [294, 0.46]
      ]
    ],
    field_westroad: [
      melodies.field_westroad,
      [
        [294, 0.24], [349, 0.24], [392, 0.3], [349, 0.24],
        [330, 0.22], [294, 0.28], [262, 0.24], [294, 0.38],
        [330, 0.24], [349, 0.24], [392, 0.32], [440, 0.28],
        [392, 0.24], [349, 0.5]
      ]
    ],
    field_tomioka: [
      melodies.field_tomioka,
      [
        [262, 0.24], [294, 0.24], [330, 0.3], [392, 0.34],
        [330, 0.22], [294, 0.24], [262, 0.3], [330, 0.36],
        [392, 0.24], [440, 0.24], [392, 0.3], [349, 0.22],
        [330, 0.24], [262, 0.52]
      ]
    ],
    field_highland: [
      melodies.field_highland,
      [
        [440, 0.22], [494, 0.22], [523, 0.28], [587, 0.34],
        [523, 0.22], [494, 0.22], [440, 0.28], [392, 0.34],
        [440, 0.22], [494, 0.22], [523, 0.3], [494, 0.22],
        [440, 0.22], [392, 0.48]
      ]
    ],
    field_kusatsu: [
      melodies.field_kusatsu,
      [
        [349, 0.18], [392, 0.18], [440, 0.2], [392, 0.18],
        [349, 0.18], [294, 0.22], [262, 0.24], [294, 0.2],
        [349, 0.18], [392, 0.24], [440, 0.18], [494, 0.18],
        [440, 0.18], [392, 0.4]
      ]
    ],
    field_forest: [
      melodies.field_forest,
      [
        [196, 0.32], [220, 0.22], [247, 0.26], [262, 0.32],
        [247, 0.22], [220, 0.3], [196, 0.24], [220, 0.34],
        [247, 0.22], [262, 0.22], [247, 0.28], [220, 0.24],
        [196, 0.3], [174, 0.5]
      ]
    ],
    field_akagi: [
      melodies.field_akagi,
      [
        [262, 0.26], [294, 0.22], [330, 0.28], [349, 0.34],
        [330, 0.22], [294, 0.24], [262, 0.28], [247, 0.38],
        [262, 0.22], [294, 0.22], [330, 0.28], [392, 0.32],
        [349, 0.24], [294, 0.5]
      ]
    ],
    field_haruna: [
      melodies.field_haruna,
      [
        [247, 0.36], [0, 0.14], [220, 0.28], [196, 0.38],
        [0, 0.14], [220, 0.32], [247, 0.24], [262, 0.34],
        [294, 0.24], [262, 0.28], [247, 0.28], [220, 0.42],
        [196, 0.5]
      ]
    ],
    ch4_shirane: [
      melodies.ch4_shirane,
      [
        [139, 0.55], [0, 0.2], [147, 0.42], [0, 0.28],
        [131, 0.6], [0, 0.22], [156, 0.35], [147, 0.42],
        [0, 0.36], [139, 0.5], [0, 0.2], [131, 0.72]
      ]
    ],
    ch5_gakuen: [
      melodies.ch5_gakuen,
      [
        [494, 0.22], [440, 0.22], [392, 0.26], [440, 0.4],
        [0, 0.24], [392, 0.28], [349, 0.28], [330, 0.42],
        [0, 0.26], [294, 0.34], [262, 0.3], [330, 0.52]
      ]
    ],
    ch6_tunnel: [
      melodies.ch6_tunnel,
      [
        [98, 0.7], [0, 0.36], [110, 0.55], [0, 0.26],
        [104, 0.65], [0, 0.42], [117, 0.5], [0, 0.25],
        [98, 0.85], [0, 0.28], [123, 0.72]
      ]
    ],
    ch8_oze: [
      melodies.ch8_oze,
      [
        [73, 0.42], [0, 0.18], [82, 0.34], [0, 0.24],
        [87, 0.46], [0, 0.24], [73, 0.38], [82, 0.24],
        [0, 0.32], [87, 0.54], [0, 0.18], [73, 0.7]
      ]
    ],
    ch9_minakami: [
      melodies.ch9_minakami,
      [
        [349, 0.24], [330, 0.2], [294, 0.3], [262, 0.38],
        [0, 0.18], [294, 0.24], [330, 0.24], [349, 0.42],
        [0, 0.24], [330, 0.34], [294, 0.28], [262, 0.56]
      ]
    ],
    ch10_border: [
      melodies.ch10_border,
      [
        [185, 0.32], [196, 0.26], [185, 0.28], [0, 0.18],
        [174, 0.42], [0, 0.26], [165, 0.52], [0, 0.18],
        [196, 0.26], [208, 0.22], [196, 0.44], [0, 0.32]
      ]
    ],
    melancholy_battle: [
      melodies.melancholy_battle,
      [
        [196, 0.34], [0, 0.14], [220, 0.24], [262, 0.36],
        [294, 0.24], [262, 0.2], [220, 0.26], [196, 0.54],
        [175, 0.32], [0, 0.12], [196, 0.22], [220, 0.34],
        [262, 0.22], [220, 0.18], [196, 0.28], [175, 0.6]
      ]
    ]
  };

  var bgmStyles = {
    field: { wave: 'triangle', gain: 0.09 },
    field_maebashi: { wave: 'triangle', gain: 0.09 },
    field_takasaki: { wave: 'square', gain: 0.09 },
    field_westroad: { wave: 'triangle', gain: 0.085 },
    field_tomioka: { wave: 'square', gain: 0.082 },
    field_highland: { wave: 'triangle', gain: 0.082 },
    field_kusatsu: { wave: 'square', gain: 0.086 },
    field_forest: { wave: 'triangle', gain: 0.08 },
    field_akagi: { wave: 'sawtooth', gain: 0.07 },
    field_haruna: { wave: 'triangle', gain: 0.078 },
    ch4_shirane: { wave: 'sawtooth', gain: 0.072 },
    ch5_gakuen: { wave: 'square', gain: 0.076 },
    ch6_tunnel: { wave: 'triangle', gain: 0.068 },
    ch7_haruna: { wave: 'triangle', gain: 0.078 },
    ch8_oze: { wave: 'sawtooth', gain: 0.068 },
    ch9_minakami: { wave: 'triangle', gain: 0.076 },
    ch10_border: { wave: 'square', gain: 0.07 },
    melancholy_battle: { wave: 'triangle', gain: 0.082 },
    melancholy_victory: { wave: 'triangle', gain: 0.078 }
  };

  var fieldBgmByMap = {
    maebashi: 'field_maebashi',
    takasaki: 'field_takasaki',
    shimonita: 'field_westroad',
    tomioka: 'field_tomioka',
    tsumagoi: 'field_highland',
    kusatsu: 'field_kusatsu',
    tamura: 'field_forest',
    forest: 'field_forest',
    konuma: 'field_forest',
    onuma: 'field_forest',
    akagi_ranch: 'field_akagi',
    akagi_shrine: 'field_akagi',
    shirane_trail: 'ch4_shirane',
    kusatsu_deep: 'ch4_shirane',
    jomo_gakuen: 'ch5_gakuen',
    tanigawa_tunnel: 'ch6_tunnel',
    haruna_lake: 'field_haruna',
    oze_marsh: 'ch8_oze',
    minakami_valley: 'ch9_minakami',
    border_tunnel: 'ch10_border'
  };

  function getCurrentMapId() {
    return Game.Map && Game.Map.getCurrentMapId ? Game.Map.getCurrentMapId() : '';
  }

  function resolveFieldBgmName() {
    var mapId = getCurrentMapId();
    if (mapId && fieldBgmByMap[mapId]) return fieldBgmByMap[mapId];
    return 'field';
  }

  function resolveBgmName(name) {
    if (name === 'field') return resolveFieldBgmName();
    return name;
  }

  function getBgmVariants(name) {
    if (bgmVariants[name]) return bgmVariants[name];
    return melodies[name] ? [melodies[name]] : null;
  }

  function getBgmStyle(name) {
    return bgmStyles[name] || { wave: 'square', gain: 0.1 };
  }

  function getMelodyLength(melody) {
    var length = 0;
    for (var i = 0; i < melody.length; i++) length += melody[i][1];
    return length;
  }

  function playBgm(name, options) {
    stopBgm();
    if (!audioCtx || muted) return;
    ensureContext();
    options = options || {};
    currentBgmRequestedName = name;
    var resolvedName = resolveBgmName(name);
    currentBgmResolvedName = resolvedName;
    var variants = getBgmVariants(resolvedName);
    if (!variants || !variants.length) return;
    var style = getBgmStyle(resolvedName);
    var variantIndex = 0;
    var initialDelay = Math.max(0, Number(options.startDelay) || 0);

    function scheduleSequence(melody, delay) {
      var time = audioCtx.currentTime + 0.1 + Math.max(0, delay || 0);
      melody.forEach(function(note) {
        if (note[0] > 0) {
          playBgmNote(note[0], note[1] * 0.92, style.wave, time, style.gain);
        }
        time += note[1];
      });
    }

    if (oneShotBgm[resolvedName]) {
      var oneShotMelody = variants[0];
      scheduleSequence(oneShotMelody, initialDelay);
      currentBgm = setTimeout(function() {
        currentBgm = null;
        currentBgmRequestedName = null;
        currentBgmResolvedName = null;
      }, getMelodyLength(oneShotMelody) * 1000 + initialDelay * 1000 + 150);
      return;
    }

    function scheduleLoop() {
      var melody = variants[variantIndex % variants.length];
      variantIndex++;
      var delay = variantIndex === 1 ? initialDelay : 0;
      scheduleSequence(melody, delay);
      currentBgm = setTimeout(scheduleLoop, getMelodyLength(melody) * 1000 + delay * 1000);
    }
    scheduleLoop();
  }

  function stopBgm() {
    if (currentBgm) {
      clearTimeout(currentBgm);
      currentBgm = null;
    }
    currentBgmRequestedName = null;
    currentBgmResolvedName = null;
    while (currentBgmNodes.length) {
      var node = currentBgmNodes.pop();
      try {
        if (node.gain && audioCtx) {
          node.gain.gain.cancelScheduledValues(audioCtx.currentTime);
          node.gain.gain.setValueAtTime(Math.max(0.0001, node.gain.gain.value || 0.0001), audioCtx.currentTime);
          node.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        }
      } catch (e) {}
      try { node.osc.stop(audioCtx ? audioCtx.currentTime + 0.05 : undefined); } catch (e2) {}
      try { node.gain.disconnect(); } catch (e3) {}
    }
  }

  function playSfx(name) {
    if (!audioCtx || muted) return;
    ensureContext();
    var now = audioCtx.currentTime;
    switch (name) {
      case 'confirm':
        playNote(523, 0.08, 'square', now, 0.15);
        playNote(659, 0.08, 'square', now + 0.08, 0.15);
        break;
      case 'cancel':
        playNote(330, 0.08, 'square', now, 0.12);
        playNote(262, 0.1, 'square', now + 0.08, 0.12);
        break;
      case 'hit':
        playNote(150, 0.1, 'sawtooth', now, 0.2);
        playNote(100, 0.15, 'sawtooth', now + 0.05, 0.15);
        break;
      case 'slash_hit':
        playNote(220, 0.045, 'square', now, 0.1);
        playSweep(540, 180, 0.12, 'sawtooth', now + 0.01, 0.15);
        playNote(120, 0.08, 'triangle', now + 0.04, 0.08);
        break;
      case 'glancing_hit':
        playNote(880, 0.04, 'triangle', now, 0.06);
        playNote(622, 0.05, 'square', now + 0.025, 0.05);
        break;
      case 'damage':
        playNote(200, 0.08, 'square', now, 0.2);
        playNote(150, 0.08, 'square', now + 0.06, 0.15);
        playNote(100, 0.1, 'square', now + 0.12, 0.1);
        break;
      case 'enemy_strike':
        playNote(132, 0.05, 'square', now, 0.11);
        playSweep(180, 72, 0.12, 'sawtooth', now + 0.01, 0.14);
        playNote(84, 0.08, 'triangle', now + 0.05, 0.08);
        break;
      case 'enemy_strike_heavy':
        playNote(110, 0.06, 'square', now, 0.12);
        playSweep(160, 55, 0.18, 'sawtooth', now + 0.015, 0.16);
        playNote(73, 0.12, 'triangle', now + 0.06, 0.09);
        playNote(49, 0.16, 'triangle', now + 0.08, 0.06);
        break;
      case 'item':
        playNote(523, 0.1, 'square', now, 0.15);
        playNote(659, 0.1, 'square', now + 0.1, 0.15);
        playNote(784, 0.15, 'square', now + 0.2, 0.15);
        break;
      case 'victory':
        playNote(523, 0.15, 'square', now, 0.15);
        playNote(659, 0.15, 'square', now + 0.15, 0.15);
        playNote(784, 0.15, 'square', now + 0.3, 0.15);
        playNote(1047, 0.4, 'square', now + 0.45, 0.15);
        break;
      case 'walk':
        playNote(100, 0.05, 'triangle', now, 0.05);
        break;
      case 'gameover':
        playNote(262, 0.3, 'square', now, 0.15);
        playNote(247, 0.3, 'square', now + 0.3, 0.15);
        playNote(220, 0.3, 'square', now + 0.6, 0.15);
        playNote(196, 0.6, 'square', now + 0.9, 0.15);
        break;
      case 'battle_intro':
      case 'battle_intro_enemy':
        playSweep(180, 420, 0.12, 'square', now, 0.12);
        playNote(196, 0.06, 'square', now + 0.05, 0.1);
        playNote(262, 0.08, 'sawtooth', now + 0.11, 0.12);
        playSweep(520, 220, 0.18, 'triangle', now + 0.16, 0.09);
        break;
      case 'battle_intro_group':
        playSweep(110, 260, 0.14, 'sawtooth', now, 0.11);
        playNote(147, 0.05, 'square', now + 0.04, 0.09);
        playNote(98, 0.06, 'square', now + 0.08, 0.08);
        playSweep(360, 120, 0.2, 'triangle', now + 0.12, 0.09);
        break;
      case 'battle_intro_boss':
        playSweep(90, 520, 0.18, 'sawtooth', now, 0.14);
        playNote(110, 0.07, 'square', now + 0.05, 0.1);
        playNote(196, 0.08, 'square', now + 0.11, 0.11);
        playSweep(640, 150, 0.24, 'triangle', now + 0.14, 0.1);
        break;
      case 'battle_intro_ritual':
        playNote(392, 0.07, 'triangle', now, 0.07);
        playNote(523, 0.07, 'triangle', now + 0.06, 0.07);
        playSweep(720, 240, 0.24, 'sawtooth', now + 0.11, 0.07);
        playNote(294, 0.11, 'square', now + 0.18, 0.05);
        break;
      case 'dice_stop':
        playNote(980, 0.025, 'square', now, 0.05);
        playNote(740, 0.03, 'triangle', now + 0.02, 0.04);
        break;
      case 'ritual_chime':
        playNote(494, 0.07, 'triangle', now, 0.06);
        playNote(659, 0.08, 'triangle', now + 0.05, 0.06);
        playNote(784, 0.1, 'triangle', now + 0.1, 0.05);
        break;
      case 'critical':
        playSweep(700, 1400, 0.18, 'square', now, 0.14);
        playNote(1568, 0.08, 'triangle', now + 0.14, 0.1);
        break;
      case 'miss':
        playSweep(180, 70, 0.22, 'triangle', now, 0.14);
        break;
      case 'shop_buy':
        playNote(880, 0.06, 'square', now, 0.12);
        playNote(1175, 0.06, 'square', now + 0.05, 0.12);
        playNote(1568, 0.1, 'square', now + 0.1, 0.1);
        break;
      case 'door':
        playSweep(260, 140, 0.28, 'sawtooth', now, 0.1);
        playSweep(180, 90, 0.35, 'triangle', now + 0.04, 0.08);
        break;
      case 'achievement':
        playNote(523, 0.1, 'square', now, 0.14);
        playNote(659, 0.1, 'square', now + 0.1, 0.14);
        playNote(784, 0.16, 'square', now + 0.2, 0.14);
        break;
      case 'save':
        playNote(523, 0.12, 'triangle', now, 0.08);
        playNote(659, 0.16, 'triangle', now + 0.12, 0.08);
        break;
      case 'thunder':
        playThunderNoise(now, 0.24, 0.16);
        playThunderNoise(now + 0.05, 0.18, 0.1);
        playSweep(220, 80, 0.22, 'sawtooth', now, 0.05);
        break;

      // ── 章別ボス戦 新規SE ──
      case 'steam_hiss': // 蒸気シュー（熊子の回復反転）
        playSweep(2000, 800, 0.3, 'sawtooth', now, 0.06);
        playSweep(1500, 600, 0.25, 'sawtooth', now + 0.05, 0.04);
        break;
      case 'dice_roll_heavy': // 重い石ダイスが転がる音
        playNote(80, 0.08, 'sawtooth', now, 0.12);
        playNote(90, 0.08, 'sawtooth', now + 0.08, 0.1);
        playNote(75, 0.08, 'sawtooth', now + 0.16, 0.12);
        playNote(95, 0.1, 'sawtooth', now + 0.24, 0.08);
        break;
      case 'train_echo': // 遠くで響く電車の通過音
        playSweep(120, 200, 0.4, 'triangle', now, 0.06);
        playSweep(200, 120, 0.5, 'triangle', now + 0.3, 0.04);
        break;
      case 'stone_crack': // 石がピキッと割れる音
        playNote(1200, 0.04, 'square', now, 0.18);
        playNote(800, 0.06, 'square', now + 0.04, 0.12);
        playNote(400, 0.08, 'sawtooth', now + 0.08, 0.08);
        break;
      case 'water_splash': // 巨大な水柱
        playSweep(100, 400, 0.2, 'sawtooth', now, 0.1);
        playThunderNoise(now + 0.1, 0.3, 0.08);
        playSweep(300, 80, 0.3, 'triangle', now + 0.15, 0.06);
        break;
      case 'mud_sink': // 泥にズブズブ沈み込む音
        playSweep(200, 60, 0.4, 'sawtooth', now, 0.08);
        playSweep(150, 50, 0.3, 'sawtooth', now + 0.15, 0.06);
        playSweep(100, 40, 0.35, 'triangle', now + 0.3, 0.05);
        break;
      case 'dice_shatter': // ダイスが粉々に砕け散る音
        playNote(1500, 0.05, 'square', now, 0.16);
        playNote(1000, 0.06, 'sawtooth', now + 0.03, 0.14);
        playNote(600, 0.08, 'square', now + 0.07, 0.1);
        playNote(300, 0.1, 'sawtooth', now + 0.12, 0.08);
        break;
      case 'reality_glitch': // 電子ノイズと空間の割れる音
        playSweep(100, 2000, 0.15, 'sawtooth', now, 0.12);
        playSweep(2000, 100, 0.15, 'sawtooth', now + 0.1, 0.1);
        playNote(60, 0.1, 'square', now + 0.2, 0.14);
        playSweep(500, 3000, 0.1, 'square', now + 0.25, 0.08);
        break;
    }
  }

  function toggleMute() {
    muted = !muted;
    if (muted) stopBgm();
    return muted;
  }

  function isBgmPlaying() {
    return currentBgm !== null;
  }

  function refreshFieldBgm() {
    if (currentBgmRequestedName !== 'field') return;
    var resolvedName = resolveFieldBgmName();
    if (resolvedName !== currentBgmResolvedName) {
      playBgm('field');
    }
  }

  return {
    init: init,
    playBgm: playBgm,
    stopBgm: stopBgm,
    playSfx: playSfx,
    toggleMute: toggleMute,
    isBgmPlaying: isBgmPlaying,
    refreshFieldBgm: refreshFieldBgm,
    getCurrentBgmName: function() { return currentBgmResolvedName; },
    getRequestedBgmName: function() { return currentBgmRequestedName; }
  };
})();
