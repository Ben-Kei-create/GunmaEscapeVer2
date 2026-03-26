// Step-based field encounters for route and dungeon maps
Game.Encounters = (function() {
  var state = {
    mapId: '',
    eligibleSteps: 0,
    cooldown: 0,
    cycleIndex: 0
  };

  var tables = {
    maebashi: { stepInterval: 10, cooldown: 4, tiles: [0, 6], formations: ['strayDaruma', ['strayDaruma', 'roadsideBandit'], 'roadsideBandit'] },
    takasaki: { stepInterval: 10, cooldown: 4, tiles: [0], formations: ['strayDaruma', ['roadsideBandit', 'strayDaruma'], 'roadsideBandit'] },
    kusatsu: { stepInterval: 10, cooldown: 4, tiles: [0, 5], formations: ['steamMonkey', ['steamMonkey', 'strayDaruma'], 'strayDaruma'] },
    shimonita: { stepInterval: 10, cooldown: 4, tiles: [0, 6], formations: ['konnyakuCrawler', ['konnyakuCrawler', 'roadsideBandit'], 'roadsideBandit'] },
    tomioka: { stepInterval: 9, cooldown: 4, tiles: [0, 1], formations: ['silkShade', ['silkShade', 'roadsideBandit'], ['silkShade', 'silkShade']] },
    tsumagoi: { stepInterval: 9, cooldown: 4, tiles: [0, 6], formations: ['cabbageWisp', ['cabbageWisp', 'roadsideBandit'], ['cabbageWisp', 'cabbageWisp']] },
    forest: { stepInterval: 7, cooldown: 3, tiles: [0, 1], formations: ['roadsideBandit', ['roadsideBandit', 'strayDaruma'], 'strayDaruma'] },
    konuma: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], formations: ['mistBeastling', ['roadsideBandit', 'mistBeastling'], ['mistBeastling', 'mistBeastling']] },
    onuma: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], formations: ['mistBeastling', ['roadsideBandit', 'mistBeastling'], ['roadsideBandit', 'mistBeastling', 'strayDaruma']] },
    akagi_ranch: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], formations: ['roadsideBandit', ['roadsideBandit', 'strayDaruma'], ['roadsideBandit', 'roadsideBandit']] },
    shirane_trail: { stepInterval: 6, cooldown: 3, tiles: [1, 5], formations: ['steamMonkey', ['steamMonkey', 'silkShade'], ['steamMonkey', 'steamMonkey']] },
    kusatsu_deep: { stepInterval: 6, cooldown: 3, tiles: [0, 1, 5], formations: ['steamMonkey', ['steamMonkey', 'silkShade'], ['steamMonkey', 'silkShade', 'silkShade']] },
    tanigawa_tunnel: { stepInterval: 6, cooldown: 3, tiles: [1, 9], formations: ['echoShard', ['echoShard', 'roadsideBandit'], ['echoShard', 'echoShard', 'roadsideBandit']] },
    haruna_lake: { stepInterval: 6, cooldown: 3, tiles: [0, 1], formations: ['mistBeastling', ['mistBeastling', 'echoShard'], ['mistBeastling', 'echoShard', 'echoShard']] },
    oze_marsh: { stepInterval: 6, cooldown: 3, tiles: [0, 1, 6], formations: ['mudWisp', ['mudWisp', 'echoShard'], ['mudWisp', 'mudWisp', 'echoShard']] },
    minakami_valley: { stepInterval: 6, cooldown: 3, tiles: [0, 1], formations: ['mudWisp', ['mudWisp', 'mistBeastling'], ['mudWisp', 'mistBeastling', 'mistBeastling']] }
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
