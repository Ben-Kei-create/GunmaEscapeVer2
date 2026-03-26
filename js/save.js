// Save system using localStorage + passphrase export
Game.Save = (function() {
  var MAX_SLOTS = 3;
  var VERSION = 5;
  var PASSPHRASE_PREFIX = 'GM2';
  var BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
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

  function getStorageKey(slot) {
    return 'gunmaEscape_slot_' + slot;
  }

  function getCurrentPlayTime() {
    return runtime.accumulatedPlayTime + (Date.now() - runtime.sessionStartedAt);
  }

  function setPlayTime(playTime) {
    runtime.accumulatedPlayTime = Math.max(0, playTime || 0);
    runtime.sessionStartedAt = Date.now();
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

  function getPlayerSnapshot() {
    var playerData = Game.Player.getData();
    return {
      hp: playerData.hp,
      maxHp: playerData.maxHp,
      attack: playerData.attack,
      defense: playerData.defense,
      experience: playerData.experience || 0,
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
      chapter: playerData.chapter,
      partyMembers: clone(playerData.partyMembers || [])
    };
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

  function getStoryFlags() {
    if (Game.Story && Game.Story.exportFlags) {
      return Game.Story.exportFlags();
    }
    return {};
  }

  function getJourneyState() {
    if (Game.Story && Game.Story.exportJourneyState) {
      return Game.Story.exportJourneyState();
    }
    return { respectGauge: 0, catalysts: [] };
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
      itemStates: getItemStates(),
      storyFlags: getStoryFlags(),
      journeyState: getJourneyState()
    };
  }

  function readSave(slot) {
    if (!isValidSlot(slot)) return null;
    var raw = localStorage.getItem(getStorageKey(slot));
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
      localStorage.setItem(getStorageKey(slot), JSON.stringify(data));
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

  function applyStoryFlags(storyFlags) {
    if (Game.Story && Game.Story.importFlags) {
      Game.Story.importFlags(storyFlags || {});
      return;
    }
    if (Game.Story && Game.Story.saveFlags) {
      Game.Story.saveFlags();
    }
  }

  function applyJourneyState(journeyState) {
    if (Game.Story && Game.Story.importJourneyState) {
      Game.Story.importJourneyState(journeyState || { respectGauge: 0, catalysts: [] });
    }
  }

  function applyPlayerData(savedPlayer) {
    if (!savedPlayer) return;

    var playerData = Game.Player.getData();
    playerData.hp = savedPlayer.hp;
    playerData.maxHp = savedPlayer.maxHp;
    playerData.attack = savedPlayer.attack;
    playerData.defense = savedPlayer.defense;
    playerData.experience = savedPlayer.experience || 0;
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
    playerData.partyMembers = clone(savedPlayer.partyMembers || []);
    playerData.moving = false;
    playerData.moveFrame = 0;
    playerData.moveTimer = 0;

    while (playerData.equippedDice.length < playerData.diceSlots) {
      playerData.equippedDice.push('normalDice');
    }
  }

  function applySaveData(data) {
    if (!data || !data.player || !data.mapName || !Game.Maps[data.mapName]) {
      return false;
    }

    applyNpcStates(data.npcStates || {});
    applyItemStates(data.itemStates || {});
    Game.Map.load(data.mapName, data.player.tileX, data.player.tileY);
    applyPlayerData(data.player);
    applyStoryFlags(data.storyFlags || {});
    applyJourneyState(data.journeyState || null);
    if (Game.Player && Game.Player.syncCatalystsFromInventory) {
      Game.Player.syncCatalystsFromInventory();
    }
    setPlayTime(data.playTime || 0);
    return true;
  }

  function getMapCatalog() {
    return Object.keys(Game.Maps || {}).sort();
  }

  function getItemCatalog() {
    return Object.keys(Game.Items.getAll ? Game.Items.getAll() : {}).sort();
  }

  function getPartyCatalog() {
    if (Game.Player && Game.Player.getCompanionCatalog) {
      return Game.Player.getCompanionCatalog().sort();
    }
    return [];
  }

  function getDirectionCatalog() {
    return ['up', 'down', 'left', 'right'];
  }

  function extractCatalystsFromInventory(inventory) {
    var catalysts = [];
    for (var i = 0; i < inventory.length; i++) {
      var item = Game.Items.get(inventory[i]);
      if (item && item.isCatalyst && catalysts.indexOf(inventory[i]) < 0) {
        catalysts.push(inventory[i]);
      }
    }
    return catalysts;
  }

  function indexOfOr(list, value, fallback) {
    var index = list.indexOf(value);
    return index >= 0 ? index : fallback;
  }

  function encodeIdList(ids, catalog) {
    var encoded = [];
    for (var i = 0; i < ids.length; i++) {
      var index = catalog.indexOf(ids[i]);
      if (index >= 0) encoded.push(index);
    }
    return encoded;
  }

  function decodeIdList(indexes, catalog) {
    var result = [];
    for (var i = 0; i < indexes.length; i++) {
      if (catalog[indexes[i]]) result.push(catalog[indexes[i]]);
    }
    return result;
  }

  function packBooleanArray(flags) {
    if (!flags.length) return '';
    var bytes = [];
    var current = 0;
    var bitCount = 0;

    for (var i = 0; i < flags.length; i++) {
      current = (current << 1) | (flags[i] ? 1 : 0);
      bitCount++;
      if (bitCount === 8) {
        bytes.push(current);
        current = 0;
        bitCount = 0;
      }
    }

    if (bitCount > 0) {
      current = current << (8 - bitCount);
      bytes.push(current);
    }

    var hex = '';
    for (var j = 0; j < bytes.length; j++) {
      var part = bytes[j].toString(16).toUpperCase();
      hex += (part.length < 2 ? '0' + part : part);
    }
    return hex;
  }

  function unpackBooleanArray(hex, totalBits) {
    var flags = [];
    if (!hex) {
      for (var i = 0; i < totalBits; i++) flags.push(false);
      return flags;
    }

    for (var i = 0; i < hex.length; i += 2) {
      var value = parseInt(hex.substring(i, i + 2), 16);
      if (isNaN(value)) value = 0;
      for (var bit = 7; bit >= 0 && flags.length < totalBits; bit--) {
        flags.push(((value >> bit) & 1) === 1);
      }
    }

    while (flags.length < totalBits) flags.push(false);
    return flags;
  }

  function encodeNpcStatesCompact(npcStates) {
    var mapCatalog = getMapCatalog();
    var flags = [];
    for (var i = 0; i < mapCatalog.length; i++) {
      var map = Game.Maps[mapCatalog[i]];
      if (!map || !map.npcs) continue;
      for (var n = 0; n < map.npcs.length; n++) {
        flags.push(!!(npcStates && npcStates[mapCatalog[i]] && npcStates[mapCatalog[i]][map.npcs[n].id]));
      }
    }
    return packBooleanArray(flags);
  }

  function decodeNpcStatesCompact(hex) {
    var mapCatalog = getMapCatalog();
    var totalBits = 0;
    for (var i = 0; i < mapCatalog.length; i++) {
      var map = Game.Maps[mapCatalog[i]];
      totalBits += map && map.npcs ? map.npcs.length : 0;
    }

    var flags = unpackBooleanArray(hex, totalBits);
    var states = {};
    var bitIndex = 0;

    for (var m = 0; m < mapCatalog.length; m++) {
      var mapId = mapCatalog[m];
      var map = Game.Maps[mapId];
      states[mapId] = {};
      if (!map || !map.npcs) continue;
      for (var n = 0; n < map.npcs.length; n++) {
        states[mapId][map.npcs[n].id] = !!flags[bitIndex++];
      }
    }

    return states;
  }

  function encodeItemStatesCompact(itemStates) {
    var mapCatalog = getMapCatalog();
    var flags = [];
    for (var i = 0; i < mapCatalog.length; i++) {
      var map = Game.Maps[mapCatalog[i]];
      var savedItems = itemStates && itemStates[mapCatalog[i]] ? itemStates[mapCatalog[i]] : [];
      if (!map || !map.items) continue;
      for (var itemIndex = 0; itemIndex < map.items.length; itemIndex++) {
        var itemState = findItemState(savedItems, map.items[itemIndex].id, itemIndex);
        flags.push(!!(itemState && itemState.taken));
      }
    }
    return packBooleanArray(flags);
  }

  function decodeItemStatesCompact(hex) {
    var mapCatalog = getMapCatalog();
    var totalBits = 0;
    for (var i = 0; i < mapCatalog.length; i++) {
      var map = Game.Maps[mapCatalog[i]];
      totalBits += map && map.items ? map.items.length : 0;
    }

    var flags = unpackBooleanArray(hex, totalBits);
    var states = {};
    var bitIndex = 0;

    for (var m = 0; m < mapCatalog.length; m++) {
      var mapId = mapCatalog[m];
      var map = Game.Maps[mapId];
      states[mapId] = [];
      if (!map || !map.items) continue;
      for (var itemIndex = 0; itemIndex < map.items.length; itemIndex++) {
        states[mapId].push({
          id: map.items[itemIndex].id,
          taken: !!flags[bitIndex++]
        });
      }
    }

    return states;
  }

  function minifySaveData(data) {
    var mapCatalog = getMapCatalog();
    var itemCatalog = getItemCatalog();
    var partyCatalog = getPartyCatalog();
    var directions = getDirectionCatalog();
    var player = data.player || {};
    var activeStoryFlags = [];
    var flagSource = data.storyFlags || {};
    var journeyState = data.journeyState || {};

    for (var flag in flagSource) {
      if (flagSource.hasOwnProperty(flag) && flagSource[flag]) {
        activeStoryFlags.push(flag);
      }
    }
    activeStoryFlags.sort();

    return {
      v: VERSION,
      t: data.playTime || 0,
      m: indexOfOr(mapCatalog, data.mapName, 0),
      p: [
        player.hp || 0,
        player.maxHp || 0,
        player.attack || 0,
        player.defense || 0,
        player.experience || 0,
        player.gold || 0,
        player.tileX || 0,
        player.tileY || 0,
        indexOfOr(directions, player.direction || 'down', 1),
        player.diceSlots || 1,
        player.chapter || 1,
        indexOfOr(itemCatalog, player.armor, -1),
        encodeIdList(player.equippedDice || [], itemCatalog),
        encodeIdList(player.inventory || [], itemCatalog),
        encodeIdList(player.partyMembers || [], partyCatalog)
      ],
      n: encodeNpcStatesCompact(data.npcStates || {}),
      i: encodeItemStatesCompact(data.itemStates || {}),
      s: activeStoryFlags,
      j: [
        journeyState.respectGauge || 0,
        encodeIdList(journeyState.catalysts || [], itemCatalog)
      ]
    };
  }

  function expandPortableData(compact) {
    if (!compact || !compact.p || typeof compact.m !== 'number') return null;

    var mapCatalog = getMapCatalog();
    var itemCatalog = getItemCatalog();
    var partyCatalog = getPartyCatalog();
    var directions = getDirectionCatalog();
    var mapName = mapCatalog[compact.m];
    if (!mapName) return null;

    var playerData = compact.p;
    var legacyLayout = !compact.v || compact.v < 5;
    var equippedDice = decodeIdList(playerData[legacyLayout ? 11 : 12] || [], itemCatalog);
    if (!equippedDice.length) equippedDice = ['normalDice'];
    var inventory = decodeIdList(playerData[legacyLayout ? 12 : 13] || [], itemCatalog);
    var partyMembers = decodeIdList(playerData[legacyLayout ? 13 : 14] || [], partyCatalog);
    var journeyData = compact.j || [];
    var storyFlags = {};
    for (var i = 0; i < (compact.s || []).length; i++) {
      storyFlags[compact.s[i]] = true;
    }
    var catalysts = decodeIdList(journeyData[1] || [], itemCatalog);
    if (!catalysts.length) catalysts = extractCatalystsFromInventory(inventory);

    return {
      version: compact.v || VERSION,
      savedAt: Date.now(),
      playTime: compact.t || 0,
      chapter: legacyLayout ? (playerData[9] || 1) : (playerData[10] || 1),
      mapName: mapName,
      mapLabel: Game.Maps[mapName] ? Game.Maps[mapName].name : mapName,
      player: {
        hp: playerData[0] || 1,
        maxHp: playerData[1] || 100,
        attack: playerData[2] || 12,
        defense: playerData[3] || 5,
        experience: legacyLayout ? 0 : (playerData[4] || 0),
        gold: playerData[legacyLayout ? 4 : 5] || 0,
        tileX: playerData[legacyLayout ? 5 : 6] || 0,
        tileY: playerData[legacyLayout ? 6 : 7] || 0,
        x: (playerData[legacyLayout ? 5 : 6] || 0) * Game.Config.TILE_SIZE,
        y: (playerData[legacyLayout ? 6 : 7] || 0) * Game.Config.TILE_SIZE,
        direction: directions[playerData[legacyLayout ? 7 : 8]] || 'down',
        diceSlots: playerData[legacyLayout ? 8 : 9] || 1,
        chapter: playerData[legacyLayout ? 9 : 10] || 1,
        armor: playerData[legacyLayout ? 10 : 11] >= 0 ? itemCatalog[playerData[legacyLayout ? 10 : 11]] : null,
        equippedDice: equippedDice,
        inventory: inventory,
        keyItems: getKeyItemsFromInventory(inventory),
        partyMembers: partyMembers
      },
      npcStates: decodeNpcStatesCompact(compact.n || ''),
      itemStates: decodeItemStatesCompact(compact.i || ''),
      storyFlags: storyFlags,
      journeyState: {
        respectGauge: journeyData[0] || 0,
        catalysts: catalysts
      }
    };
  }

  function encodeBase32(text) {
    var bytes = new TextEncoder().encode(text);
    var output = '';
    var value = 0;
    var bits = 0;

    for (var i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;
      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }

    return output;
  }

  function decodeBase32(text) {
    var clean = (text || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
    var bytes = [];
    var value = 0;
    var bits = 0;

    for (var i = 0; i < clean.length; i++) {
      var charValue = BASE32_ALPHABET.indexOf(clean.charAt(i));
      if (charValue < 0) continue;
      value = (value << 5) | charValue;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  function checksumText(text) {
    var sum = 0;
    for (var i = 0; i < text.length; i++) {
      sum = ((sum * 33) + text.charCodeAt(i)) & 1048575;
    }
    return sum;
  }

  function encodeBase32Number(number, digits) {
    var output = '';
    var value = number >>> 0;
    for (var i = 0; i < digits; i++) {
      output = BASE32_ALPHABET.charAt(value & 31) + output;
      value = value >>> 5;
    }
    return output;
  }

  function formatPassphrase(raw) {
    var groups = [];
    groups.push(raw.substring(0, PASSPHRASE_PREFIX.length));
    for (var i = PASSPHRASE_PREFIX.length; i < raw.length; i += 4) {
      groups.push(raw.substring(i, i + 4));
    }
    return groups.join(' ');
  }

  function parsePassphrase(text) {
    var clean = (text || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
    if (clean.indexOf(PASSPHRASE_PREFIX) !== 0) {
      return { success: false, error: 'あいことばの形式がちがう。' };
    }

    var checksum = clean.substring(PASSPHRASE_PREFIX.length, PASSPHRASE_PREFIX.length + 4);
    var body = clean.substring(PASSPHRASE_PREFIX.length + 4);
    if (!checksum || !body) {
      return { success: false, error: 'あいことばが短すぎる。' };
    }

    try {
      var raw = decodeBase32(body);
      if (encodeBase32Number(checksumText(raw), 4) !== checksum) {
        return { success: false, error: 'あいことばがこわれている。' };
      }
      var compact = JSON.parse(raw);
      var expanded = expandPortableData(compact);
      if (!expanded) {
        return { success: false, error: 'このあいことばは使えない。' };
      }
      return { success: true, data: expanded };
    } catch (err) {
      return { success: false, error: 'あいことばを読み取れない。' };
    }
  }

  function save(slot) {
    var data = buildSaveData();
    if (Game.Story && Game.Story.saveFlags) Game.Story.saveFlags();
    return writeSave(slot, data);
  }

  function load(slot) {
    return applySaveData(readSave(slot));
  }

  function loadPassphrase(text) {
    var parsed = parsePassphrase(text);
    if (!parsed.success) return parsed;
    if (!applySaveData(parsed.data)) {
      return { success: false, error: 'あいことばの内容が古い。' };
    }
    return { success: true, data: parsed.data };
  }

  function createPassphrase() {
    var compact = minifySaveData(buildSaveData());
    var raw = JSON.stringify(compact);
    var checksum = encodeBase32Number(checksumText(raw), 4);
    return formatPassphrase(PASSPHRASE_PREFIX + checksum + encodeBase32(raw));
  }

  function hasSave(slot) {
    return !!readSave(slot);
  }

  function hasAnySave() {
    for (var slot = 1; slot <= MAX_SLOTS; slot++) {
      if (hasSave(slot)) return true;
    }
    return false;
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
    localStorage.removeItem(getStorageKey(slot));
    return true;
  }

  return {
    save: save,
    load: load,
    loadPassphrase: loadPassphrase,
    createPassphrase: createPassphrase,
    hasSave: hasSave,
    hasAnySave: hasAnySave,
    getSlotInfo: getSlotInfo,
    autoSave: autoSave,
    deleteSave: deleteSave
  };
})();
