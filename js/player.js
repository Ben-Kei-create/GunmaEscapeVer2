// Player entity
Game.Player = (function() {
  var MAX_PARTY_MEMBERS = 3;
  var companionDefs = {
    akagi: {
      id: 'akagi',
      name: 'アカギ',
      role: '境界案内',
      attackBonus: 3,
      defenseBonus: 2,
      color: '#5db8ff'
    },
    yamakawa: {
      id: 'yamakawa',
      name: '山川',
      role: '地形解析',
      attackBonus: 2,
      defenseBonus: 3,
      color: '#8fe0a2'
    },
    furuya: {
      id: 'furuya',
      name: '古谷',
      role: '突破支援',
      attackBonus: 4,
      defenseBonus: 1,
      color: '#ffb36b'
    }
  };

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
    experience: 0,
    gold: 100,
    chapter: 1,                  // current chapter (1 or 2)
    diceSlots: 1,                // max dice slots (1-5)
    equippedDice: ['normalDice'], // array of dice item IDs
    armor: null,    // equipped armor item ID
    partyMembers: [],
    skillsKnown: [],
    inventory: [],
    moving: false,
    moveTimer: 0,
    moveSpeed: 8, // frames to move one tile
    moveFrame: 0,
    walkSfxTimer: 0
  };
  var lastCompletedStep = null;
  var pendingSkillChoices = [];

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
    lastCompletedStep = null;
  }

  function normalizePartyMembers(ids) {
    var result = [];
    for (var i = 0; i < (ids || []).length; i++) {
      var id = ids[i];
      if (!companionDefs[id]) continue;
      if (result.indexOf(id) >= 0) continue;
      result.push(id);
      if (result.length >= MAX_PARTY_MEMBERS) break;
    }
    return result;
  }

  function normalizeSkills(ids) {
    var result = [];
    for (var i = 0; i < (ids || []).length; i++) {
      var id = ids[i];
      if (!Game.Skills || !Game.Skills.get || !Game.Skills.get(id)) continue;
      if (result.indexOf(id) >= 0) continue;
      result.push(id);
      if (result.length >= 6) break;
    }
    return result;
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
        lastCompletedStep = {
          tileX: data.tileX,
          tileY: data.tileY,
          direction: data.direction
        };
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

  function registerCatalystIfNeeded(id) {
    var item = Game.Items && Game.Items.get ? Game.Items.get(id) : null;
    if (item && item.isCatalyst && Game.Story && Game.Story.registerCatalyst) {
      Game.Story.registerCatalyst(id);
    }
  }

  function addItem(id) {
    var item = Game.Items && Game.Items.get ? Game.Items.get(id) : null;
    var allowDuplicates = item && (item.type === 'heal' || item.type === 'battle');
    if (!allowDuplicates && hasItem(id)) return;
    data.inventory.push(id);
    registerCatalystIfNeeded(id);
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
    var total = data.attack;
    var partyMembers = getPartyMembers();
    for (var i = 0; i < partyMembers.length; i++) {
      total += partyMembers[i].attackBonus || 0;
    }
    return total;
  }

  function getDefense() {
    var base = data.defense;
    if (data.armor) {
      var a = Game.Items.get(data.armor);
      if (a && a.defenseBonus) base += a.defenseBonus;
    }
    var partyMembers = getPartyMembers();
    for (var i = 0; i < partyMembers.length; i++) {
      base += partyMembers[i].defenseBonus || 0;
    }
    return base;
  }

  function addPartyMember(id) {
    if (!companionDefs[id]) return false;
    data.partyMembers = normalizePartyMembers(data.partyMembers);
    if (data.partyMembers.indexOf(id) >= 0) return false;
    if (data.partyMembers.length >= MAX_PARTY_MEMBERS) return false;
    data.partyMembers.push(id);
    return true;
  }

  function removePartyMember(id) {
    if (!id || !data.partyMembers) return false;
    var idx = data.partyMembers.indexOf(id);
    if (idx < 0) return false;
    data.partyMembers.splice(idx, 1);
    return true;
  }

  function setPartyMembers(ids) {
    data.partyMembers = normalizePartyMembers(ids);
    return data.partyMembers.slice();
  }

  function getPartyMembers() {
    var ids = normalizePartyMembers(data.partyMembers);
    data.partyMembers = ids;
    var result = [];
    for (var i = 0; i < ids.length; i++) {
      result.push(companionDefs[ids[i]]);
    }
    return result;
  }

  function getPartyMemberIds() {
    data.partyMembers = normalizePartyMembers(data.partyMembers);
    return data.partyMembers.slice();
  }

  function hasPartyMember(id) {
    return getPartyMemberIds().indexOf(id) >= 0;
  }

  function getCompanionCatalog() {
    return Object.keys(companionDefs);
  }

  function getMaxPartyMembers() {
    return MAX_PARTY_MEMBERS;
  }

  function consumeCompletedStep() {
    var step = lastCompletedStep;
    lastCompletedStep = null;
    return step;
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

  function addGold(amount) {
    data.gold = Math.max(0, data.gold + amount);
  }

  function getLevelUpGains() {
    return { hp: 12, attack: 2, defense: 1 };
  }

  function queueSkillChoice(skillId) {
    if (!skillId || hasSkill(skillId)) return false;
    if (pendingSkillChoices.indexOf(skillId) >= 0) return false;
    pendingSkillChoices.push(skillId);
    return true;
  }

  function addExperience(amount) {
    var gained = Math.max(0, amount || 0);
    var previousRank = getJourneyRank();
    var levelUps = [];
    var skillChoices = [];

    data.experience = Math.max(0, (data.experience || 0) + gained);

    var nextRank = getJourneyRank();
    if (nextRank > previousRank) {
      var gains = getLevelUpGains();
      for (var rank = previousRank + 1; rank <= nextRank; rank++) {
        data.maxHp += gains.hp;
        data.hp = Math.min(data.maxHp, data.hp + gains.hp);
        data.attack += gains.attack;
        data.defense += gains.defense;
        levelUps.push({
          rank: rank,
          hpGain: gains.hp,
          attackGain: gains.attack,
          defenseGain: gains.defense
        });
        if (Game.Skills && Game.Skills.getLearnableSkillForRank) {
          var skillId = Game.Skills.getLearnableSkillForRank(rank);
          if (skillId && !hasSkill(skillId)) {
            queueSkillChoice(skillId);
            skillChoices.push(skillId);
          }
        }
      }
    }

    return {
      experience: data.experience,
      gained: gained,
      previousRank: previousRank,
      newRank: nextRank,
      levelUps: levelUps,
      skillChoices: skillChoices
    };
  }

  function getJourneyRank() {
    return 1 + Math.floor((data.experience || 0) / 80);
  }

  function syncCatalystsFromInventory() {
    for (var i = 0; i < data.inventory.length; i++) {
      registerCatalystIfNeeded(data.inventory[i]);
    }
  }

  function getSkills() {
    data.skillsKnown = normalizeSkills(data.skillsKnown);
    return data.skillsKnown.slice();
  }

  function hasSkill(id) {
    return getSkills().indexOf(id) >= 0;
  }

  function learnSkill(id, replaceId) {
    if (!Game.Skills || !Game.Skills.get || !Game.Skills.get(id)) return false;
    data.skillsKnown = normalizeSkills(data.skillsKnown);
    if (data.skillsKnown.indexOf(id) >= 0) return true;
    if (replaceId) {
      var replaceIndex = data.skillsKnown.indexOf(replaceId);
      if (replaceIndex >= 0) {
        data.skillsKnown.splice(replaceIndex, 1);
      }
    }
    if (data.skillsKnown.length >= 6) return false;
    data.skillsKnown.push(id);
    return true;
  }

  function forgetSkill(id) {
    data.skillsKnown = normalizeSkills(data.skillsKnown);
    var index = data.skillsKnown.indexOf(id);
    if (index < 0) return false;
    data.skillsKnown.splice(index, 1);
    return true;
  }

  function consumePendingSkillChoice() {
    return pendingSkillChoices.length ? pendingSkillChoices.shift() : null;
  }

  function clearPendingSkillChoices() {
    pendingSkillChoices = [];
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
    equipDice: equipDice,
    addDiceSlot: addDiceSlot,
    getEquippedDice: getEquippedDice,
    equipArmor: equipArmor,
    unequipArmor: unequipArmor,
    addGold: addGold,
    addExperience: addExperience,
    getJourneyRank: getJourneyRank,
    getSkills: getSkills,
    hasSkill: hasSkill,
    learnSkill: learnSkill,
    forgetSkill: forgetSkill,
    consumePendingSkillChoice: consumePendingSkillChoice,
    clearPendingSkillChoices: clearPendingSkillChoices,
    addPartyMember: addPartyMember,
    removePartyMember: removePartyMember,
    setPartyMembers: setPartyMembers,
    getPartyMembers: getPartyMembers,
    getPartyMemberIds: getPartyMemberIds,
    hasPartyMember: hasPartyMember,
    getCompanionCatalog: getCompanionCatalog,
    getMaxPartyMembers: getMaxPartyMembers,
    consumeCompletedStep: consumeCompletedStep,
    syncCatalystsFromInventory: syncCatalystsFromInventory,
    getData: getData
  };
})();
