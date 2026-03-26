// Step-based field encounters for route and dungeon maps
Game.Encounters = (function() {
  var state = {
    mapId: '',
    eligibleSteps: 0,
    cooldown: 0,
    cycleIndex: 0
  };

  var tables = {
    maebashi: { stepInterval: 10, cooldown: 4, tiles: [0, 6], enemies: ['strayDaruma', 'roadsideBandit'] },
    takasaki: { stepInterval: 10, cooldown: 4, tiles: [0], enemies: ['strayDaruma', 'roadsideBandit'] },
    kusatsu: { stepInterval: 10, cooldown: 4, tiles: [0, 5], enemies: ['steamMonkey', 'strayDaruma'] },
    shimonita: { stepInterval: 10, cooldown: 4, tiles: [0, 6], enemies: ['konnyakuCrawler', 'roadsideBandit'] },
    tomioka: { stepInterval: 9, cooldown: 4, tiles: [0, 1], enemies: ['silkShade', 'roadsideBandit'] },
    tsumagoi: { stepInterval: 9, cooldown: 4, tiles: [0, 6], enemies: ['cabbageWisp', 'roadsideBandit'] },
    forest: { stepInterval: 7, cooldown: 3, tiles: [0, 1], enemies: ['roadsideBandit', 'strayDaruma'] },
    konuma: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], enemies: ['roadsideBandit', 'mistBeastling'] },
    onuma: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], enemies: ['roadsideBandit', 'mistBeastling'] },
    akagi_ranch: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], enemies: ['roadsideBandit', 'strayDaruma'] },
    shirane_trail: { stepInterval: 6, cooldown: 3, tiles: [1, 5], enemies: ['steamMonkey', 'silkShade'] },
    kusatsu_deep: { stepInterval: 6, cooldown: 3, tiles: [0, 1, 5], enemies: ['steamMonkey', 'silkShade'] },
    tanigawa_tunnel: { stepInterval: 6, cooldown: 3, tiles: [1, 9], enemies: ['echoShard', 'roadsideBandit'] },
    haruna_lake: { stepInterval: 6, cooldown: 3, tiles: [0, 1], enemies: ['mistBeastling', 'echoShard'] },
    oze_marsh: { stepInterval: 6, cooldown: 3, tiles: [0, 1, 6], enemies: ['mudWisp', 'echoShard'] },
    minakami_valley: { stepInterval: 6, cooldown: 3, tiles: [0, 1], enemies: ['mudWisp', 'mistBeastling'] }
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
    if (!table || !table.enemies || !table.enemies.length) return null;
    var enemyId = table.enemies[state.cycleIndex % table.enemies.length];
    state.cycleIndex++;
    return enemyId;
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
