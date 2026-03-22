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
    if (!audioCtx || muted) return;
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
    ]
  };

  function playBgm(name) {
    stopBgm();
    if (!audioCtx || muted) return;
    ensureContext();
    var melody = melodies[name];
    if (!melody) return;

    var loopLength = 0;
    melody.forEach(function(n) { loopLength += n[1]; });

    function scheduleLoop() {
      var time = audioCtx.currentTime + 0.1;
      melody.forEach(function(note) {
        playNote(note[0], note[1] * 0.9, 'square', time, 0.1);
        time += note[1];
      });
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
