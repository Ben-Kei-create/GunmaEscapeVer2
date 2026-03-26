// Player entity
Game.Player = (function() {
  var data = {
    tileX: 14,
    tileY: 10,
    x: 0,
    y: 0,
    direction: 'down',
    hp: 100,
    maxHp: 100,
    attack: 12,
    defense: 5,
    speed: 10,
    gold: 100,
    level: 1,
    exp: 0,
    maxExp: 50,
    chapter: 1,                  // current chapter (1 or 2)
    diceSlots: 1,                // max dice slots (1-5)
    equippedDice: ['normalDice'], // array of dice item IDs
    worldX: 25,                  // Default world map x coordinate
    worldY: 26,                  // Default world map y coordinate
    armor: null,    // equipped armor item ID
    inventory: [],
    moveFrame: 0,
    moveSpeed: 8,
    walkSfxTimer: 0,
    // --- Legacy Card & TP System ---
    legacySlots: 3,
    equippedCards: [null, null, null], // card IDs
    tp: 0,
    maxTp: 100
  };

  var sprites = {
    down: [
      [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,3,2,3,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,0,1,4,4,1,0,0,0,0,0,0,0,0,0],
      [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,5,5,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,6,0,0,6,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    up: [
      [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,0,1,4,4,1,0,0,0,0,0,0,0,0,0],
      [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,5,5,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,6,0,0,6,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    left: [
      [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,3,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,0,1,4,4,1,0,0,0,0,0,0,0,0,0],
      [0,1,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [1,7,1,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [1,7,1,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,1,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,5,5,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,6,0,0,6,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
  };
  sprites.right = sprites.left; // flip when drawing

  var palette = {
    1: '#222222',  // outline
    2: '#ffcc88',  // skin
    3: '#332211',  // eyes
    4: '#4466cc',  // shirt
    5: '#554433',  // pants
    6: '#664422',  // shoes
    7: '#cc8844'   // backpack
  };

  function init(startX, startY) {
    data.tileX = startX || 14;
    data.tileY = startY || 10;
    data.x = data.tileX * Game.Config.TILE_SIZE;
    data.y = data.tileY * Game.Config.TILE_SIZE;
    data.moving = false;
  }

  function update() {
    if (data.moving) {
      data.moveFrame++;
      var ts = Game.Config.TILE_SIZE;
      var progress = data.moveFrame / data.moveSpeed;

      if (progress >= 1) {
        data.x = data.tileX * ts;
        data.y = data.tileY * ts;
        data.moving = false;
        data.moveFrame = 0;

        // Random Encounter Logic
        data.stepsTaken = (data.stepsTaken || 0) + 1;
        var currentMap = Game.Map.getCurrentMap();
        var isSafe = !currentMap || currentMap.mapType === 'town';
        if (!isSafe && Math.random() < 0.05 && Game.Main && Game.Main.triggerRandomEncounter) {
            Game.Main.triggerRandomEncounter();
        }
      } else {
        var targetX = data.tileX * ts;
        var targetY = data.tileY * ts;
        var startX = data.x;
        var startY = data.y;

        switch (data.direction) {
          case 'up':    startY = (data.tileY + 1) * ts; break;
          case 'down':  startY = (data.tileY - 1) * ts; break;
          case 'left':  startX = (data.tileX + 1) * ts; break;
          case 'right': startX = (data.tileX - 1) * ts; break;
        }
        data.x = startX + (targetX - startX) * progress;
        data.y = startY + (targetY - startY) * progress;
      }
      return;
    }

    // Check movement input
    var dx = 0, dy = 0;
    if (Game.Input.isDown('up'))    { dy = -1; data.direction = 'up'; }
    else if (Game.Input.isDown('down'))  { dy = 1;  data.direction = 'down'; }
    else if (Game.Input.isDown('left'))  { dx = -1; data.direction = 'left'; }
    else if (Game.Input.isDown('right')) { dx = 1;  data.direction = 'right'; }

    if (dx !== 0 || dy !== 0) {
      var newX = data.tileX + dx;
      var newY = data.tileY + dy;

      if (Game.Map.isPassable(newX, newY)) {
        data.tileX = newX;
        data.tileY = newY;
        data.moving = true;
        data.moveFrame = 0;

        data.walkSfxTimer++;
        if (data.walkSfxTimer >= 3) {
          Game.Audio.playSfx('walk');
          data.walkSfxTimer = 0;
        }
      }
    }
  }

  function draw() {
    var sprite = sprites[data.direction] || sprites.down;
    var flipped = (data.direction === 'right');
    Game.Renderer.drawSprite(sprite, data.x, data.y, palette, flipped);
  }

  function getFacingTile() {
    var dx = 0, dy = 0;
    switch (data.direction) {
      case 'up':    dy = -1; break;
      case 'down':  dy = 1;  break;
      case 'left':  dx = -1; break;
      case 'right': dx = 1;  break;
    }
    return { x: data.tileX + dx, y: data.tileY + dy };
  }

  function hasItem(id) {
    return data.inventory.indexOf(id) >= 0;
  }

  function addItem(id) {
    if (!hasItem(id)) {
      data.inventory.push(id);
    }
  }

  function removeItem(id) {
    var idx = data.inventory.indexOf(id);
    if (idx >= 0) data.inventory.splice(idx, 1);
  }

  function heal(amount) {
    data.hp = Math.min(data.hp + amount, data.maxHp);
  }

  function hasAllKeys() {
    return hasItem('onsenKey') && hasItem('darumaEye') &&
           hasItem('konnyakuPass') && hasItem('cabbageCrest');
  }

  function getAttack() {
    var base = data.attack;
    // Add Legacy Card stat_up effects
    for (var i = 0; i < data.equippedCards.length; i++) {
      var cardId = data.equippedCards[i];
      if (!cardId) continue;
      var card = Game.Items.get(cardId);
      if (card && card.effect_type === 'stat_up' && card.target_stat === 'attack') {
        base += card.effect_value;
      }
    }
    return base;
  }

  function getDefense() {
    var base = data.defense;
    if (data.armor) {
      var a = Game.Items.get(data.armor);
      if (a && a.defenseBonus) base += a.defenseBonus;
    }
    // Add Legacy Card stat_up effects
    for (var i = 0; i < data.equippedCards.length; i++) {
      var cardId = data.equippedCards[i];
      if (!cardId) continue;
      var card = Game.Items.get(cardId);
      if (card && card.effect_type === 'stat_up' && card.target_stat === 'defense') {
        base += card.effect_value;
      }
      if (card && card.effect_type === 'stat_up' && card.target_stat === 'max_hp') {
        // Note: MaxHP usually just increases current and max simultaneously if handled here
        // but for robustness we separate it or apply it in a dedicated stat fetcher.
      }
    }
    return base;
  }

  function getSpeed() {
    var base = data.speed;
    // Potentially add stat_up effects for speed
    for (var i = 0; i < data.equippedCards.length; i++) {
      var cardId = data.equippedCards[i];
      if (!cardId) continue;
      var card = Game.Items.get(cardId);
      if (card && card.effect_type === 'stat_up' && card.target_stat === 'speed') {
        base += card.effect_value;
      }
    }
    return base;
  }

  function equipDice(diceId, slot) {
    var item = Game.Items.get(diceId);
    if (!item || item.type !== 'dice') return false;
    if (slot < 0 || slot >= data.diceSlots) return false;
    // Put old die back to inventory (if not normalDice)
    if (data.equippedDice[slot] && data.equippedDice[slot] !== 'normalDice') {
      addItem(data.equippedDice[slot]);
    }
    data.equippedDice[slot] = diceId;
    removeItem(diceId);
    return true;
  }

  function addDiceSlot() {
    if (data.diceSlots >= 5) return false;
    data.diceSlots++;
    data.equippedDice.push('normalDice');
    return true;
  }

  function getEquippedDice() {
    return data.equippedDice.slice(0, data.diceSlots);
  }

  function equipArmor(itemId) {
    var item = Game.Items.get(itemId);
    if (!item || item.type !== 'armor') return false;
    if (data.armor) addItem(data.armor);
    data.armor = itemId;
    removeItem(itemId);
    return true;
  }

  function unequipArmor() {
    if (!data.armor) return false;
    addItem(data.armor);
    data.armor = null;
    return true;
  }

  // --- Legacy Card Methods ---
  function equipLegacyCard(cardId, slot) {
    if (slot < 0 || slot >= data.legacySlots) return false;
    var card = Game.Items.get(cardId);
    if (!card || card.type !== 'legacy_card') return false;

    // Unequip existing card in slot if any
    if (data.equippedCards[slot]) {
      addItem(data.equippedCards[slot]);
    }

    data.equippedCards[slot] = cardId;
    removeItem(cardId);

    // Apply immediate max_hp bonus if it's that type
    if (card.effect_type === 'stat_up' && card.target_stat === 'max_hp') {
      data.maxHp += card.effect_value;
      data.hp += card.effect_value;
    }

    return true;
  }

  function unequipLegacyCard(slot) {
    if (slot < 0 || slot >= data.legacySlots) return false;
    var cardId = data.equippedCards[slot];
    if (!cardId) return false;

    var card = Game.Items.get(cardId);
    if (card && card.effect_type === 'stat_up' && card.target_stat === 'max_hp') {
      data.maxHp = Math.max(1, data.maxHp - card.effect_value);
      data.hp = Math.min(data.hp, data.maxHp);
    }

    addItem(cardId);
    data.equippedCards[slot] = null;
    return true;
  }

  function getEquippedCards() {
    return data.equippedCards.filter(function(id) { return id !== null; });
  }

  function addTp(amount) {
    data.tp = Math.max(0, Math.min(data.tp + amount, data.maxTp));
  }

  function addGold(amount) {
    data.gold = Math.max(0, data.gold + amount);
  }

  function addExp(amount) {
    if (amount <= 0) return { leveledUp: false };
    data.exp += amount;
    var leveledUp = false;
    var oldStats = { hp: data.maxHp, atk: data.attack, def: data.defense, spd: data.speed };

    while (data.exp >= data.maxExp && data.level < 99) {
        data.level++;
        data.maxExp = Math.floor(50 * Math.pow(data.level, 1.5));
        
        // Stat increases (Wangdo RPG style)
        data.maxHp += Math.floor(Math.random() * 6) + 10; // +10~15
        data.attack += Math.floor(Math.random() * 2) + 2; // +2~3
        data.defense += Math.floor(Math.random() * 2) + 2; // +2~3
        data.speed += Math.floor(Math.random() * 2) + 1; // +1~2
        
        data.hp = data.maxHp;
        leveledUp = true;
    }
    
    if (data.level >= 99) {
        data.exp = data.maxExp;
    }
    
    return {
        leveledUp: leveledUp,
        level: data.level,
        hpGained: data.maxHp - oldStats.hp,
        atkGained: data.attack - oldStats.atk,
        defGained: data.defense - oldStats.def,
        spdGained: data.speed - oldStats.spd
    };
  }

  function reset() {
      data = {
          x: 0, y: 0, tileX: 0, tileY: 0,
          direction: 'down',
          hp: 100, maxHp: 100,
          attack: 12, defense: 5, speed: 10,
          level: 1, exp: 0, maxExp: 50,
          diceSlots: 1,
          equippedDice: ['normalDice'],
          armor: null,
          gold: 100,
          inventory: [],
          chapter: 1,
          moveFrame: 0,
          moveSpeed: 8,
          tp: 0,
          legacySlots: 3,
          equippedCards: [null, null, null],
          stepsTaken: 0,
          worldX: 25, worldY: 26
      };
  }

  function getData() { return data; }

  return {
    init: init,
    update: update,
    draw: draw,
    getFacingTile: getFacingTile,
    hasItem: hasItem,
    addItem: addItem,
    removeItem: removeItem,
    heal: heal,
    hasAllKeys: hasAllKeys,
    getAttack: getAttack,
    getDefense: getDefense,
    getSpeed: getSpeed,
    equipDice: equipDice,
    addDiceSlot: addDiceSlot,
    getEquippedDice: getEquippedDice,
    equipArmor: equipArmor,
    unequipArmor: unequipArmor,
    equipLegacyCard: equipLegacyCard,
    unequipLegacyCard: unequipLegacyCard,
    getEquippedCards: getEquippedCards,
    addTp: addTp,
    addGold: addGold,
    addExp: addExp,
    getLevel: function() { return data.level; },
    getExp: function() { return data.exp; },
    getMaxExp: function() { return data.maxExp; },
    reset: reset,
    getData: getData
  };
})();
