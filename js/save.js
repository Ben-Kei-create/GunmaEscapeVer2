// Save system using localStorage
Game.Save = (function() {
  var MAX_SLOTS = 3;
  var VERSION = 1;
  var runtime = window.__gunmaSaveRuntime || {
    accumulatedPlayTime: 0,
    sessionStartedAt: Date.now()
  };
  window.__gunmaSaveRuntime = runtime;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isValidSlot(slot) {
    return slot >= 1 && slot <= MAX_SLOTS;
  }

  function getCurrentPlayTime() {
    return runtime.accumulatedPlayTime + (Date.now() - runtime.sessionStartedAt);
  }

  function setPlayTime(playTime) {
    runtime.accumulatedPlayTime = Math.max(0, playTime || 0);
    runtime.sessionStartedAt = Date.now();
  }

  function getPlayerSnapshot() {
    var playerData = Game.Player.getData();
    var snapshot = {
      hp: playerData.hp,
      maxHp: playerData.maxHp,
      attack: playerData.attack,
      defense: playerData.defense,
      gold: playerData.gold,
      x: playerData.x,
      y: playerData.y,
      tileX: playerData.tileX,
      tileY: playerData.tileY,
      direction: playerData.direction,
      equippedDice: clone(playerData.equippedDice || []),
      inventory: clone(playerData.inventory || []),
      keyItems: clone(playerData.keyItems || getKeyItemsFromInventory(playerData.inventory || [])),
      armor: playerData.armor,
      diceSlots: playerData.diceSlots,
      chapter: playerData.chapter
    };

    return snapshot;
  }

  function getKeyItemsFromInventory(inventory) {
    var result = [];
    for (var i = 0; i < inventory.length; i++) {
      var itemDef = Game.Items.get(inventory[i]);
      if (itemDef && itemDef.type === 'key') {
        result.push(inventory[i]);
      }
    }
    return result;
  }

  function getNpcStates() {
    var states = {};
    for (var mapId in Game.Maps) {
      if (!Game.Maps.hasOwnProperty(mapId)) continue;
      var map = Game.Maps[mapId];
      states[mapId] = {};
      if (!map.npcs) continue;
      for (var i = 0; i < map.npcs.length; i++) {
        states[mapId][map.npcs[i].id] = !!map.npcs[i].defeated;
      }
    }
    return states;
  }

  function getItemStates() {
    var states = {};
    for (var mapId in Game.Maps) {
      if (!Game.Maps.hasOwnProperty(mapId)) continue;
      var map = Game.Maps[mapId];
      states[mapId] = [];
      if (!map.items) continue;
      for (var i = 0; i < map.items.length; i++) {
        states[mapId].push({
          id: map.items[i].id,
          taken: !!map.items[i].taken
        });
      }
    }
    return states;
  }

  function buildSaveData() {
    var playerSnapshot = getPlayerSnapshot();
    var currentMapId = Game.Map.getCurrentMapId();
    var currentMap = Game.Map.getCurrentMap();

    return {
      version: VERSION,
      savedAt: Date.now(),
      playTime: getCurrentPlayTime(),
      chapter: playerSnapshot.chapter,
      mapName: currentMapId,
      mapLabel: currentMap ? currentMap.name : currentMapId,
      player: playerSnapshot,
      npcStates: getNpcStates(),
      itemStates: getItemStates()
    };
  }

  function readSave(slot) {
    if (!isValidSlot(slot)) return null;
    var raw = localStorage.getItem('gunmaEscape_slot_' + slot);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function writeSave(slot, data) {
    if (!isValidSlot(slot)) return false;
    try {
      localStorage.setItem('gunmaEscape_slot_' + slot, JSON.stringify(data));
      return true;
    } catch (err) {
      return false;
    }
  }

  function applyNpcStates(npcStates) {
    for (var mapId in Game.Maps) {
      if (!Game.Maps.hasOwnProperty(mapId)) continue;
      var map = Game.Maps[mapId];
      var mapNpcStates = npcStates && npcStates[mapId] ? npcStates[mapId] : {};
      if (!map.npcs) continue;
      for (var i = 0; i < map.npcs.length; i++) {
        map.npcs[i].defeated = !!mapNpcStates[map.npcs[i].id];
      }
    }
  }

  function findItemState(savedItems, itemId, fallbackIndex) {
    if (!savedItems) return null;
    if (savedItems[fallbackIndex] && savedItems[fallbackIndex].id === itemId) {
      return savedItems[fallbackIndex];
    }
    for (var i = 0; i < savedItems.length; i++) {
      if (savedItems[i].id === itemId) {
        return savedItems[i];
      }
    }
    return null;
  }

  function applyItemStates(itemStates) {
    for (var mapId in Game.Maps) {
      if (!Game.Maps.hasOwnProperty(mapId)) continue;
      var map = Game.Maps[mapId];
      var savedItems = itemStates && itemStates[mapId] ? itemStates[mapId] : [];
      if (!map.items) continue;
      for (var i = 0; i < map.items.length; i++) {
        var state = findItemState(savedItems, map.items[i].id, i);
        map.items[i].taken = state ? !!state.taken : false;
      }
    }
  }

  function applyPlayerData(savedPlayer) {
    if (!savedPlayer) return;

    var playerData = Game.Player.getData();
    playerData.hp = savedPlayer.hp;
    playerData.maxHp = savedPlayer.maxHp;
    playerData.attack = savedPlayer.attack;
    playerData.defense = savedPlayer.defense;
    playerData.gold = savedPlayer.gold;
    playerData.tileX = savedPlayer.tileX;
    playerData.tileY = savedPlayer.tileY;
    playerData.x = typeof savedPlayer.x === 'number' ? savedPlayer.x : savedPlayer.tileX * Game.Config.TILE_SIZE;
    playerData.y = typeof savedPlayer.y === 'number' ? savedPlayer.y : savedPlayer.tileY * Game.Config.TILE_SIZE;
    playerData.direction = savedPlayer.direction || 'down';
    playerData.equippedDice = clone(savedPlayer.equippedDice || ['normalDice']);
    playerData.inventory = clone(savedPlayer.inventory || []);
    playerData.keyItems = clone(savedPlayer.keyItems || getKeyItemsFromInventory(playerData.inventory));
    playerData.armor = savedPlayer.armor || null;
    playerData.diceSlots = savedPlayer.diceSlots || 1;
    playerData.chapter = savedPlayer.chapter || 1;
    playerData.moving = false;
    playerData.moveFrame = 0;
    playerData.moveTimer = 0;

    while (playerData.equippedDice.length < playerData.diceSlots) {
      playerData.equippedDice.push('normalDice');
    }
  }

  function save(slot) {
    var data = buildSaveData();
    return writeSave(slot, data);
  }

  function load(slot) {
    var data = readSave(slot);
    if (!data || !data.player || !data.mapName || !Game.Maps[data.mapName]) {
      return false;
    }

    applyNpcStates(data.npcStates);
    applyItemStates(data.itemStates);
    Game.Map.load(data.mapName, data.player.tileX, data.player.tileY);
    applyPlayerData(data.player);
    setPlayTime(data.playTime || 0);
    return true;
  }

  function hasSave(slot) {
    return !!readSave(slot);
  }

  function getSlotInfo(slot) {
    var data = readSave(slot);
    if (!data) return null;

    return {
      slot: slot,
      chapter: data.chapter || (data.player ? data.player.chapter : 1),
      mapName: data.mapName || '',
      mapLabel: data.mapLabel || (Game.Maps[data.mapName] ? Game.Maps[data.mapName].name : data.mapName || ''),
      playTime: data.playTime || 0,
      hp: data.player ? data.player.hp : 0,
      maxHp: data.player ? data.player.maxHp : 0,
      gold: data.player ? data.player.gold : 0,
      savedAt: data.savedAt || 0
    };
  }

  function autoSave() {
    return save(1);
  }

  function deleteSave(slot) {
    if (!isValidSlot(slot)) return false;
    localStorage.removeItem('gunmaEscape_slot_' + slot);
    return true;
  }

  return {
    save: save,
    load: load,
    hasSave: hasSave,
    getSlotInfo: getSlotInfo,
    autoSave: autoSave,
    deleteSave: deleteSave
  };
})();
