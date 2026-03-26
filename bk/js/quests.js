// Side quest tracking system
Game.Quests = (function() {
  var STORAGE_KEY = 'gunmaEscape_quests';
  var TITLE = '冒険の記録';
  var questOrder = [
    {
      id: 'onsen_tour',
      name: '温泉巡り',
      description: '群馬の名湯を3箇所巡ろう',
      status: 'active',
      progress: 0,
      target: 3,
      reward: { type: 'gold', value: 200 },
      chapter: 1,
      rewardClaimed: false
    },
    {
      id: 'konnyaku_delivery',
      name: 'こんにゃく配達',
      description: '下仁田のこんにゃくを前橋のおばあちゃんに届けよう',
      status: 'active',
      progress: 0,
      target: 2,
      reward: { type: 'item', value: 'superYakimanju' },
      chapter: 1,
      rewardClaimed: false
    },
    {
      id: 'joumo_karuta_collection',
      name: '上毛かるた収集',
      description: '各地に散らばる上毛かるたの札を5枚集めよう',
      status: 'active',
      progress: 0,
      target: 5,
      reward: { type: 'gold', value: 500 },
      chapter: 1,
      rewardClaimed: false
    },
    {
      id: 'daruma_perseverance',
      name: 'だるま七転び八起き',
      description: 'だるま積みを3回クリアしよう',
      status: 'active',
      progress: 0,
      target: 3,
      reward: { type: 'item', value: 'darumaDice' },
      chapter: 1,
      rewardClaimed: false
    },
    {
      id: 'gunma_dialect_master',
      name: '群馬弁マスター',
      description: '5人のNPCと会話して群馬弁を学ぼう',
      status: 'active',
      progress: 0,
      target: 5,
      reward: { type: 'gold', value: 300 },
      chapter: 1,
      rewardClaimed: false
    },
    {
      id: 'legendary_blacksmith',
      name: '伝説の刀鍛冶',
      description: '赤城山の鍛冶師に最高の素材を届けよう',
      status: 'locked',
      progress: 0,
      target: 4,
      reward: { type: 'item', value: 'gunmaDice' },
      chapter: 2,
      rewardClaimed: false
    },
    {
      id: 'search_for_hana',
      name: '花の捜索',
      description: '攫われた村長の娘を探し出そう',
      status: 'locked',
      progress: 0,
      target: 1,
      reward: { type: 'item', value: 'storyProgress' },
      chapter: 2,
      rewardClaimed: false
    },
    {
      id: 'fishing_master',
      name: '釣り名人',
      description: '大沼でワカサギを3匹釣ろう',
      status: 'locked',
      progress: 0,
      target: 3,
      reward: { type: 'gold', value: 150 },
      chapter: 2,
      rewardClaimed: false
    },
    {
      id: 'angura_secret',
      name: 'アングラの秘密',
      description: 'アングラの正体を全て明かそう',
      status: 'locked',
      progress: 0,
      target: 3,
      reward: { type: 'item', value: 'akagiKey' },
      chapter: 2,
      rewardClaimed: false
    },
    {
      id: 'way_of_the_dice',
      name: 'サイコロ道',
      description: '全種類のサイコロを手に入れよう',
      status: 'locked',
      progress: 0,
      target: 10,
      reward: { type: 'gold', value: 1000 },
      chapter: 2,
      rewardClaimed: false
    }
  ];

  var questById = {};
  var runtime = {
    visitedMaps: {},
    onsenMaps: {},
    deliveryFlags: {},
    karutaCards: {},
    talkedNpcs: {},
    blacksmithMaterials: {},
    fishingSpots: {},
    anguraTalks: {},
    ownedDice: {},
    logOpen: false,
    selectedIndex: 0,
    scrollOffset: 0
  };

  var karutaLocations = [
    { mapId: 'maebashi', x: 10, y: 13, key: 'maebashi_card' },
    { mapId: 'takasaki', x: 25, y: 14, key: 'takasaki_card' },
    { mapId: 'kusatsu', x: 22, y: 3, key: 'kusatsu_card' },
    { mapId: 'shimonita', x: 2, y: 14, key: 'shimonita_card' },
    { mapId: 'tsumagoi', x: 4, y: 8, key: 'tsumagoi_card' }
  ];

  var fishingLocations = [
    { x: 10, y: 4, key: 'lake_a' },
    { x: 14, y: 6, key: 'lake_b' },
    { x: 18, y: 8, key: 'lake_c' }
  ];

  var legendaryMaterials = {
    healHerb: 'forest_herb',
    superYakimanju: 'kusatsu_sweet',
    yakimanju: 'onuma_snack'
  };

  var diceItemIds = {
    powerDice: true,
    gamblerDice: true,
    steadyDice: true,
    healDice: true,
    fireDice: true,
    darumaDice: true,
    onsenDice: true,
    konnyakuDice: true,
    cabbageDice: true,
    gunmaDice: true
  };

  buildIndex();
  load();
  activateChapter(1);

  function buildIndex() {
    for (var i = 0; i < questOrder.length; i++) {
      questById[questOrder[i].id] = questOrder[i];
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        quests: questOrder.map(function(quest) {
          return {
            id: quest.id,
            status: quest.status,
            progress: quest.progress,
            rewardClaimed: !!quest.rewardClaimed
          };
        }),
        runtime: {
          visitedMaps: runtime.visitedMaps,
          onsenMaps: runtime.onsenMaps,
          deliveryFlags: runtime.deliveryFlags,
          karutaCards: runtime.karutaCards,
          talkedNpcs: runtime.talkedNpcs,
          blacksmithMaterials: runtime.blacksmithMaterials,
          fishingSpots: runtime.fishingSpots,
          anguraTalks: runtime.anguraTalks,
          ownedDice: runtime.ownedDice
        }
      }));
    } catch (err) {
      // Ignore storage errors.
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved.quests && saved.quests.length) {
        for (var i = 0; i < saved.quests.length; i++) {
          var savedQuest = saved.quests[i];
          var quest = questById[savedQuest.id];
          if (!quest) continue;
          quest.status = savedQuest.status || quest.status;
          quest.progress = typeof savedQuest.progress === 'number' ? savedQuest.progress : quest.progress;
          quest.rewardClaimed = !!savedQuest.rewardClaimed;
        }
      }
      if (saved.runtime) {
        runtime.visitedMaps = saved.runtime.visitedMaps || {};
        runtime.onsenMaps = saved.runtime.onsenMaps || {};
        runtime.deliveryFlags = saved.runtime.deliveryFlags || {};
        runtime.karutaCards = saved.runtime.karutaCards || {};
        runtime.talkedNpcs = saved.runtime.talkedNpcs || {};
        runtime.blacksmithMaterials = saved.runtime.blacksmithMaterials || {};
        runtime.fishingSpots = saved.runtime.fishingSpots || {};
        runtime.anguraTalks = saved.runtime.anguraTalks || {};
        runtime.ownedDice = saved.runtime.ownedDice || {};
      }
    } catch (err) {
      // Ignore malformed values.
    }
  }

  function countKeys(object) {
    var total = 0;
    for (var key in object) {
      if (object.hasOwnProperty(key) && object[key]) total++;
    }
    return total;
  }

  function getQuestInternal(id) {
    return questById[id] || null;
  }

  function normalizeIndex() {
    var maxIndex = Math.max(questOrder.length - 1, 0);
    runtime.selectedIndex = Math.max(0, Math.min(runtime.selectedIndex, maxIndex));
    var visibleRows = 4;
    var selectedRow = runtime.selectedIndex;
    if (selectedRow < runtime.scrollOffset) {
      runtime.scrollOffset = selectedRow;
    }
    if (selectedRow >= runtime.scrollOffset + visibleRows) {
      runtime.scrollOffset = selectedRow - visibleRows + 1;
    }
  }

  function ensureActive(quest) {
    return !!(quest && quest.status !== 'locked');
  }

  function activate(questId) {
    var quest = getQuestInternal(questId);
    if (!quest || quest.status !== 'locked') return false;
    quest.status = 'active';
    persist();
    return true;
  }

  function activateChapter(chapter) {
    var changed = false;
    for (var i = 0; i < questOrder.length; i++) {
      if (questOrder[i].chapter <= chapter && questOrder[i].status === 'locked') {
        questOrder[i].status = 'active';
        changed = true;
      }
    }
    if (changed) persist();
    return changed;
  }

  function updateProgress(questId, amount) {
    var quest = getQuestInternal(questId);
    if (!ensureActive(quest)) return false;
    var next = Math.max(0, Math.min(quest.progress + (amount || 0), quest.target));
    if (next === quest.progress) return false;
    quest.progress = next;
    if (quest.progress >= quest.target) {
      quest.status = 'completed';
      quest.progress = quest.target;
    }
    persist();
    return true;
  }

  function complete(questId) {
    var quest = getQuestInternal(questId);
    if (!quest || quest.status === 'completed') return false;
    quest.status = 'completed';
    quest.progress = quest.target;
    persist();
    return true;
  }

  function getQuest(questId) {
    var quest = getQuestInternal(questId);
    return quest ? clone(quest) : null;
  }

  function getActive() {
    var result = [];
    for (var i = 0; i < questOrder.length; i++) {
      if (questOrder[i].status === 'active') result.push(clone(questOrder[i]));
    }
    return result;
  }

  function getAll() {
    return clone(questOrder);
  }

  function isCompleted(questId) {
    var quest = getQuestInternal(questId);
    return !!(quest && quest.status === 'completed');
  }

  function claimReward(questId) {
    var quest = getQuestInternal(questId);
    if (!quest || quest.status !== 'completed' || quest.rewardClaimed) return false;

    if (quest.reward.type === 'gold') {
      if (Game.Player && Game.Player.addGold) {
        Game.Player.addGold(quest.reward.value);
      }
      quest.rewardClaimed = true;
      persist();
      return true;
    }

    if (quest.reward.type === 'item') {
      if (quest.reward.value === 'storyProgress') {
        quest.rewardClaimed = true;
        persist();
        return true;
      }
      if (Game.Player && Game.Player.addItem) {
        Game.Player.addItem(quest.reward.value);
        quest.rewardClaimed = true;
        persist();
        return true;
      }
    }

    return false;
  }

  function visitMap(mapId) {
    if (!mapId) return false;
    runtime.visitedMaps[mapId] = true;

    if (mapId === 'kusatsu' && !runtime.onsenMaps.kusatsu) {
      runtime.onsenMaps.kusatsu = true;
      syncProgress('onsen_tour', countKeys(runtime.onsenMaps));
    }

    if (mapId === 'akagi_shrine') {
      complete('search_for_hana');
    }

    persist();
    return true;
  }

  function syncProgress(questId, value) {
    var quest = getQuestInternal(questId);
    if (!ensureActive(quest)) return false;
    var next = Math.max(0, Math.min(value, quest.target));
    if (next === quest.progress) return false;
    quest.progress = next;
    if (quest.progress >= quest.target) {
      quest.status = 'completed';
      quest.progress = quest.target;
    }
    persist();
    return true;
  }

  function visitTile(mapId, x, y, tileType, options) {
    options = options || {};
    var i;
    var changed = false;
    var isOnsenTile = !!options.isOnsen;

    if (!isOnsenTile && Game.Config && Game.Config.TILE) {
      isOnsenTile = tileType === Game.Config.TILE.ONSEN;
    }
    if (runtime.onsenMaps.kusatsu && mapId && mapId !== 'kusatsu' && isOnsenTile && !runtime.onsenMaps[mapId]) {
      runtime.onsenMaps[mapId] = true;
      changed = syncProgress('onsen_tour', countKeys(runtime.onsenMaps)) || changed;
    }

    for (i = 0; i < karutaLocations.length; i++) {
      if (karutaLocations[i].mapId === mapId && karutaLocations[i].x === x && karutaLocations[i].y === y && !runtime.karutaCards[karutaLocations[i].key]) {
        runtime.karutaCards[karutaLocations[i].key] = true;
        changed = syncProgress('joumo_karuta_collection', countKeys(runtime.karutaCards)) || changed;
        break;
      }
    }

    if (mapId === 'onuma') {
      for (i = 0; i < fishingLocations.length; i++) {
        if (fishingLocations[i].x === x && fishingLocations[i].y === y && !runtime.fishingSpots[fishingLocations[i].key]) {
          runtime.fishingSpots[fishingLocations[i].key] = true;
          changed = syncProgress('fishing_master', countKeys(runtime.fishingSpots)) || changed;
          break;
        }
      }
    }

    if (changed) persist();
    return changed;
  }

  function talkToNpc(npcId, mapId) {
    if (!npcId) return false;
    var changed = false;

    if (npcId === 'shimonitaShop' && !runtime.deliveryFlags.pickedUp) {
      runtime.deliveryFlags.pickedUp = true;
      changed = syncProgress('konnyaku_delivery', 1) || changed;
    } else if (npcId === 'grandma' && runtime.deliveryFlags.pickedUp) {
      runtime.deliveryFlags.delivered = true;
      changed = complete('konnyaku_delivery') || changed;
    }

    if (!runtime.talkedNpcs[npcId]) {
      runtime.talkedNpcs[npcId] = mapId || true;
      changed = syncProgress('gunma_dialect_master', countKeys(runtime.talkedNpcs)) || changed;
    }

    if (npcId === 'ranchShop' && countKeys(runtime.blacksmithMaterials) >= 3) {
      changed = complete('legendary_blacksmith') || changed;
    }

    if ((npcId === 'angura_guard' || npcId === 'angura_boss' || npcId === 'kunisada_chuji') && !runtime.anguraTalks[npcId]) {
      runtime.anguraTalks[npcId] = true;
      changed = syncProgress('angura_secret', countKeys(runtime.anguraTalks)) || changed;
    }

    if (changed) persist();
    return changed;
  }

  function completePuzzle(puzzleId, success) {
    if (!success || puzzleId !== 'daruma') return false;
    return updateProgress('daruma_perseverance', 1);
  }

  function obtainItem(itemId) {
    var changed = false;
    if (!itemId) return false;

    if (legendaryMaterials[itemId] && !runtime.blacksmithMaterials[legendaryMaterials[itemId]]) {
      runtime.blacksmithMaterials[legendaryMaterials[itemId]] = true;
      changed = syncProgress('legendary_blacksmith', countKeys(runtime.blacksmithMaterials)) || changed;
    }

    if (diceItemIds[itemId]) {
      runtime.ownedDice[itemId] = true;
      changed = syncProgress('way_of_the_dice', countKeys(runtime.ownedDice)) || changed;
    }

    if (changed) persist();
    return changed;
  }

  function syncInventory(inventory, equippedDice) {
    inventory = inventory || [];
    equippedDice = equippedDice || [];
    var i;
    var changed = false;

    for (i = 0; i < inventory.length; i++) {
      if (diceItemIds[inventory[i]]) {
        runtime.ownedDice[inventory[i]] = true;
      }
    }
    for (i = 0; i < equippedDice.length; i++) {
      if (diceItemIds[equippedDice[i]]) {
        runtime.ownedDice[equippedDice[i]] = true;
      }
    }

    changed = syncProgress('way_of_the_dice', countKeys(runtime.ownedDice)) || changed;
    if (changed) persist();
    return changed;
  }

  function eventUpdate(type, payload) {
    payload = payload || {};
    switch (type) {
      case 'chapter_change':
      case 'chapter':
        return activateChapter(payload.chapter || payload.value || 1);
      case 'visit_map':
      case 'map_visit':
        return visitMap(payload.mapId || payload.id || payload.mapName);
      case 'visit_tile':
      case 'tile_visit':
        return visitTile(payload.mapId, payload.x, payload.y, payload.tileType, payload);
      case 'npc_talk':
      case 'talk':
        return talkToNpc(payload.npcId || payload.id, payload.mapId);
      case 'puzzle_complete':
      case 'puzzle':
        return completePuzzle(payload.puzzleId || payload.id, payload.success !== false);
      case 'item_obtain':
      case 'obtain_item':
        return obtainItem(payload.itemId || payload.id);
      case 'sync_inventory':
      case 'inventory':
        return syncInventory(payload.inventory, payload.equippedDice);
    }
    return false;
  }

  function open() {
    runtime.logOpen = true;
    normalizeIndex();
  }

  function close() {
    runtime.logOpen = false;
  }

  function toggle() {
    runtime.logOpen = !runtime.logOpen;
    normalizeIndex();
    return runtime.logOpen;
  }

  function update(type, payload) {
    if (typeof type === 'string') {
      return eventUpdate(type, payload);
    }

    if (!runtime.logOpen || !Game.Input) return false;

    if (Game.Input.isPressed('up')) {
      runtime.selectedIndex--;
      normalizeIndex();
      return true;
    }
    if (Game.Input.isPressed('down')) {
      runtime.selectedIndex++;
      normalizeIndex();
      return true;
    }
    if (Game.Input.isPressed('cancel')) {
      close();
      return true;
    }
    return false;
  }

  function getQuestColor(status) {
    if (status === 'completed') return '#ffcc44';
    if (status === 'active') return '#ffffff';
    return '#777777';
  }

  function getRewardText(quest) {
    if (!quest.reward) return 'なし';
    if (quest.reward.type === 'gold') return quest.reward.value + 'G';
    if (Game.Items && Game.Items.get) {
      var item = Game.Items.get(quest.reward.value);
      if (item && item.name) return item.name;
    }
    return quest.reward.value;
  }

  function drawProgressBar(x, y, width, height, quest) {
    var ratio = quest.target > 0 ? quest.progress / quest.target : 0;
    Game.Renderer.drawRectAbsolute(x, y, width, height, '#222');
    Game.Renderer.drawRectAbsolute(x + 1, y + 1, Math.max(0, Math.floor((width - 2) * ratio)), height - 2, '#44aa88');
    Game.Renderer.drawRectAbsolute(x, y + height, width, 1, '#445566');
  }

  function draw() {
    if (!runtime.logOpen) return false;

    var R = Game.Renderer;
    var C = Game.Config;
    var listTop = 52;
    var rowHeight = 60;
    var visibleRows = 4;
    var i;

    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, 'rgba(6,10,22,0.98)');
    R.drawTextJP(TITLE, 170, 10, '#ffcc44', 20);
    R.drawTextJP('↑↓ スクロール  X 閉じる', 150, 32, '#99a3c8', 10);

    for (i = 0; i < visibleRows; i++) {
      var questIndex = runtime.scrollOffset + i;
      if (questIndex >= questOrder.length) break;
      var quest = questOrder[questIndex];
      var y = listTop + i * rowHeight;
      var selected = questIndex === runtime.selectedIndex;
      var color = getQuestColor(quest.status);
      R.drawRectAbsolute(16, y, 448, 52, selected ? 'rgba(50,62,96,0.95)' : 'rgba(20,24,38,0.92)');
      R.drawRectAbsolute(16, y, 448, 1, selected ? '#88aaff' : '#2b324f');
      R.drawRectAbsolute(16, y + 52, 448, 1, '#1c2238');
      R.drawTextJP((questIndex + 1) + '.', 24, y + 8, '#9ca6cb', 11);
      R.drawTextJP(quest.name, 44, y + 6, color, 14);
      R.drawTextJP(quest.description, 44, y + 24, quest.status === 'locked' ? '#666' : '#bcc3da', 10);
      R.drawTextJP('報酬: ' + getRewardText(quest), 300, y + 6, '#d8bc63', 10);
      if (quest.status === 'active') {
        drawProgressBar(300, y + 26, 140, 8, quest);
        R.drawTextJP(quest.progress + '/' + quest.target, 392, y + 37, '#d9f7ee', 9);
      } else if (quest.status === 'completed') {
        R.drawTextJP('達成済み', 364, y + 26, '#ffcc44', 11);
      } else {
        R.drawTextJP('未解放', 368, y + 26, '#777', 11);
      }
    }

    R.drawTextJP('全' + questOrder.length + '件', 24, 296, '#888', 10);
    return true;
  }

  function drawTracker() {
    var active = getActive();
    if (!active.length) return false;

    var quest = active[0];
    var R = Game.Renderer;
    R.drawRectAbsolute(8, 286, 220, 28, 'rgba(0,0,0,0.72)');
    R.drawTextJP(quest.name, 14, 291, '#ffcc44', 10);
    drawProgressBar(120, 295, 90, 6, quest);
    R.drawTextJP(quest.progress + '/' + quest.target, 182, 289, '#ffffff', 9);
    return true;
  }

  function reset() {
    for (var i = 0; i < questOrder.length; i++) {
      questOrder[i].status = questOrder[i].chapter === 1 ? 'active' : 'locked';
      questOrder[i].progress = 0;
      questOrder[i].rewardClaimed = false;
    }
    runtime.visitedMaps = {};
    runtime.onsenMaps = {};
    runtime.deliveryFlags = {};
    runtime.karutaCards = {};
    runtime.talkedNpcs = {};
    runtime.blacksmithMaterials = {};
    runtime.fishingSpots = {};
    runtime.anguraTalks = {};
    runtime.ownedDice = {};
    runtime.selectedIndex = 0;
    runtime.scrollOffset = 0;
    runtime.logOpen = false;
    persist();
  }

  function syncFromGame() {
    if (Game.Map && Game.Map.getCurrentMapId) {
      visitMap(Game.Map.getCurrentMapId());
    }
    if (Game.Player && Game.Player.getData) {
      var playerData = Game.Player.getData();
      syncInventory(playerData.inventory || [], playerData.equippedDice || []);
    }
  }

  return {
    activate: activate,
    updateProgress: updateProgress,
    complete: complete,
    getQuest: getQuest,
    getActive: getActive,
    getAll: getAll,
    isCompleted: isCompleted,
    update: update,
    draw: draw,
    drawTracker: drawTracker,
    activateChapter: activateChapter,
    claimReward: claimReward,
    visitMap: visitMap,
    visitTile: visitTile,
    talkToNpc: talkToNpc,
    completePuzzle: completePuzzle,
    obtainItem: obtainItem,
    syncInventory: syncInventory,
    syncFromGame: syncFromGame,
    open: open,
    close: close,
    toggle: toggle,
    isOpen: function() { return runtime.logOpen; },
    reset: reset
  };
})();
