// Step-based field encounters for route and dungeon maps
Game.Encounters = (function() {
  var state = {
    mapId: '',
    eligibleSteps: 0,
    cooldown: 0,
    cycleIndex: 0
  };

  var tables = {
    takasaki: { stepInterval: 16, cooldown: 6, tiles: [0], formations: ['strayDaruma', 'wishShelfShade', ['roadsideBandit', 'wishShelfShade'], ['roadsideBandit', 'strayDaruma']] },
    kusatsu: { stepInterval: 10, cooldown: 4, tiles: [0, 5], formations: ['steamMonkey', 'bathhouseRemnant', ['steamMonkey', 'bathhouseRemnant'], ['steamMonkey', 'strayDaruma']] },
    shimonita: { stepInterval: 15, cooldown: 6, tiles: [0, 6], formations: ['konnyakuCrawler', 'shimonita_packer', 'shimonita_neglected_daruma', ['konnyakuCrawler', 'tomioka_tangled'], ['shimonita_packer', 'roadsideBandit']] },
    tomioka: { stepInterval: 13, cooldown: 5, tiles: [0, 1], formations: ['silkShade', 'tomioka_weaver', 'tomioka_inspector', ['tomioka_tangled', 'silkShade'], ['tomioka_dyer_sludge', 'tomioka_weaver']] },
    tsumagoi: { stepInterval: 9, cooldown: 4, tiles: [0, 6], formations: ['cabbageWisp', ['cabbageWisp', 'roadsideBandit'], ['cabbageWisp', 'cabbageWisp']] },
    forest: { stepInterval: 7, cooldown: 3, tiles: [0, 1], formations: ['roadsideBandit', 'lanternKeeper', ['roadsideBandit', 'lanternKeeper'], 'strayDaruma'] },
    konuma: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], formations: ['mistBeastling', 'lanternKeeper', ['roadsideBandit', 'mistBeastling'], ['mistBeastling', 'lanternKeeper']] },
    onuma: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], formations: ['mistBeastling', 'lanternKeeper', ['roadsideBandit', 'mistBeastling'], ['roadsideBandit', 'lanternKeeper', 'strayDaruma']] },
    akagi_ranch: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], formations: ['roadsideBandit', 'lanternKeeper', ['roadsideBandit', 'strayDaruma'], ['lanternKeeper', 'roadsideBandit']] },
    shirane_trail: { stepInterval: 6, cooldown: 3, tiles: [1, 5], formations: ['steamMonkey', 'bathhouseRemnant', ['steamMonkey', 'silkShade'], ['bathhouseRemnant', 'steamMonkey']] },
    kusatsu_deep: { stepInterval: 6, cooldown: 3, tiles: [0, 1, 5], formations: ['steamMonkey', 'bathhouseRemnant', ['steamMonkey', 'silkShade'], ['bathhouseRemnant', 'silkShade', 'silkShade']] },
    tanigawa_tunnel: { stepInterval: 6, cooldown: 3, tiles: [1, 9], formations: ['echoShard', 'ferryBellEcho', ['echoShard', 'roadsideBandit'], ['ferryBellEcho', 'echoShard', 'roadsideBandit']] },
    haruna_lake: { stepInterval: 6, cooldown: 3, tiles: [0, 1], formations: ['mistBeastling', 'lanternKeeper', ['mistBeastling', 'echoShard'], ['lanternKeeper', 'echoShard', 'echoShard']] },
    oze_marsh: { stepInterval: 6, cooldown: 3, tiles: [0, 1, 6], formations: ['mudWisp', 'marshPathShade', ['mudWisp', 'echoShard'], ['marshPathShade', 'mudWisp', 'echoShard']] },
    minakami_valley: { stepInterval: 6, cooldown: 3, tiles: [0, 1], formations: ['mudWisp', 'ferryBellEcho', ['mudWisp', 'mistBeastling'], ['ferryBellEcho', 'mistBeastling', 'mistBeastling']] }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function onMapLoaded(mapId) {
    state.mapId = mapId || '';
    state.eligibleSteps = 0;
    state.cooldown = 3;
    state.cycleIndex = 0;
  }

  function getTable(mapId) {
    return tables[mapId] || null;
  }

  function isEncounterTile(table, tileType) {
    return !!table && table.tiles.indexOf(tileType) >= 0;
  }

  function takeNextEnemy(table) {
    var pool = (table && table.formations && table.formations.length) ? table.formations : (table ? table.enemies : null);
    if (!pool || !pool.length) return null;
    var enemyId = pool[state.cycleIndex % pool.length];
    state.cycleIndex++;
    return clone(enemyId);
  }

  function consumeStep(mapId, tileType) {
    var table = getTable(mapId);
    if (!table || !isEncounterTile(table, tileType)) return null;

    if (state.mapId !== mapId) {
      onMapLoaded(mapId);
    }

    if (state.cooldown > 0) {
      state.cooldown--;
      return null;
    }

    state.eligibleSteps++;
    if (state.eligibleSteps < (table.stepInterval || 8)) return null;

    state.eligibleSteps = 0;
    state.cooldown = table.cooldown || 3;
    return takeNextEnemy(table);
  }

  function getState() {
    return clone(state);
  }

  return {
    onMapLoaded: onMapLoaded,
    consumeStep: consumeStep,
    getState: getState
  };
})();
