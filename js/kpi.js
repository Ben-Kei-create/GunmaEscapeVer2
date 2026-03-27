// Lightweight KPI tracker for playtest observation
Game.KPI = (function() {
  var STORAGE_KEY = 'gunmaEscape_kpi';
  var data = load();

  function now() {
    return Date.now();
  }

  function createDefault() {
    return {
      sessionStartedAt: 0,
      firstGateStartedAt: 0,
      firstGateSolvedAt: 0,
      firstGateSolved: false,
      firstGateAttempts: 0,
      firstGateDurationMs: 0,
      idleFrames: 0,
      backtrackCount: 0,
      firstBossClearedAt: 0,
      firstBossAdvanceAt: 0,
      firstBossAdvanceMs: 0,
      totalMoves: 0
    };
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {}
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefault();
      var parsed = JSON.parse(raw);
      var base = createDefault();
      for (var key in base) {
        if (!base.hasOwnProperty(key)) continue;
        if (parsed && typeof parsed[key] !== 'undefined') {
          base[key] = parsed[key];
        }
      }
      return base;
    } catch (err) {
      return createDefault();
    }
  }

  function startSession() {
    data = createDefault();
    data.sessionStartedAt = now();
    save();
  }

  function startFirstGate() {
    if (data.firstGateStartedAt) return;
    data.firstGateStartedAt = now();
    data.firstGateAttempts = 1;
    save();
  }

  function endFirstGate(success) {
    if (!data.firstGateStartedAt || data.firstGateSolvedAt) return;
    if (!success) {
      data.firstGateAttempts++;
      save();
      return;
    }
    data.firstGateSolved = true;
    data.firstGateSolvedAt = now();
    data.firstGateDurationMs = Math.max(0, data.firstGateSolvedAt - data.firstGateStartedAt);
    save();
  }

  function recordMove(dir, prevDir) {
    data.totalMoves++;
    if (prevDir === 'up' && dir === 'down') data.backtrackCount++;
    if (prevDir === 'down' && dir === 'up') data.backtrackCount++;
    if (prevDir === 'left' && dir === 'right') data.backtrackCount++;
    if (prevDir === 'right' && dir === 'left') data.backtrackCount++;
    save();
  }

  function recordIdleFrame() {
    data.idleFrames++;
    if (data.idleFrames % 60 === 0) save();
  }

  function markFirstBossClear() {
    if (data.firstBossClearedAt) return;
    data.firstBossClearedAt = now();
    save();
  }

  function onMapTransition() {
    if (!data.firstBossClearedAt || data.firstBossAdvanceAt) return;
    data.firstBossAdvanceAt = now();
    data.firstBossAdvanceMs = Math.max(0, data.firstBossAdvanceAt - data.firstBossClearedAt);
    save();
  }

  function getSnapshot() {
    return clone(data);
  }

  return {
    startSession: startSession,
    startFirstGate: startFirstGate,
    endFirstGate: endFirstGate,
    recordMove: recordMove,
    recordIdleFrame: recordIdleFrame,
    markFirstBossClear: markFirstBossClear,
    onMapTransition: onMapTransition,
    getSnapshot: getSnapshot
  };
})();
