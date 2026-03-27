// Simple chiptune audio system using Web Audio API
Game.Audio = (function() {
  var audioCtx = null;
  var masterGain = null;
  var currentBgm = null;
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
    kusatsu_bushi: [
      [392, 0.2], [440, 0.2], [392, 0.2], [349, 0.2],
      [294, 0.25], [262, 0.25], [294, 0.2], [349, 0.2],
      [392, 0.3], [392, 0.15], [440, 0.15], [392, 0.2],
      [349, 0.2], [294, 0.25], [262, 0.35], [0, 0.15]
    ]
  };

  var oneShotBgm = {
    victory_fanfare: true
  };

  function playBgm(name) {
    stopBgm();
    if (!audioCtx || muted) return;
    ensureContext();
    var melody = melodies[name];
    if (!melody) return;

    var loopLength = 0;
    melody.forEach(function(n) { loopLength += n[1]; });

    function scheduleSequence() {
      var time = audioCtx.currentTime + 0.1;
      melody.forEach(function(note) {
        if (note[0] > 0) {
          playNote(note[0], note[1] * 0.9, 'square', time, 0.1);
        }
        time += note[1];
      });
    }

    if (oneShotBgm[name]) {
      scheduleSequence();
      currentBgm = setTimeout(function() {
        currentBgm = null;
      }, loopLength * 1000 + 150);
      return;
    }

    function scheduleLoop() {
      scheduleSequence();
      currentBgm = setTimeout(scheduleLoop, loopLength * 1000);
    }
    scheduleLoop();
  }

  function stopBgm() {
    if (currentBgm) {
      clearTimeout(currentBgm);
      currentBgm = null;
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
      case 'damage':
        playNote(200, 0.08, 'square', now, 0.2);
        playNote(150, 0.08, 'square', now + 0.06, 0.15);
        playNote(100, 0.1, 'square', now + 0.12, 0.1);
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
      case 'critical':
        playSweep(700, 1400, 0.18, 'square', now, 0.14);
        playNote(1568, 0.08, 'triangle', now + 0.14, 0.1);
        break;
      case 'miss':
        playSweep(180, 70, 0.22, 'triangle', now, 0.14);
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

  return {
    init: init,
    playBgm: playBgm,
    stopBgm: stopBgm,
    playSfx: playSfx,
    toggleMute: toggleMute,
    isBgmPlaying: isBgmPlaying
  };
})();
