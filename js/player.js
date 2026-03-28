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
  var MAX_LEVEL = 100;
  var EXP_PER_LEVEL = 80;
  var LEVEL_MILESTONES = {
    1: { maxHp: 96, attack: 12, defense: 6 },
    10: { maxHp: 168, attack: 18, defense: 10 },
    20: { maxHp: 260, attack: 24, defense: 14 },
    30: { maxHp: 360, attack: 31, defense: 19 },
    40: { maxHp: 470, attack: 39, defense: 24 },
    50: { maxHp: 580, attack: 47, defense: 29 },
    60: { maxHp: 680, attack: 55, defense: 34 },
    70: { maxHp: 780, attack: 63, defense: 38 },
    80: { maxHp: 870, attack: 71, defense: 42 },
    90: { maxHp: 940, attack: 79, defense: 47 },
    100: { maxHp: 999, attack: 87, defense: 52 }
  };

  var data = {
    tileX: 14,
    tileY: 10,
    x: 0,
    y: 0,
    direction: 'down',
    hp: 96,
    maxHp: 96,
    attack: 12,
    defense: 6,
    experience: 0,
    gold: 100,
    chapter: 1,                  // current chapter (1 or 2)
    diceSlots: 1,                // max dice slots (1-5)
    equippedDice: ['normalDice'], // array of dice item IDs
    armor: null,    // equipped armor item ID
    partyMembers: [],
    skillsKnown: [],
    skillCharges: {},
    inventory: [],
    moving: false,
    moveTimer: 0,
    moveSpeed: 8, // frames to move one tile
    moveFrame: 0,
    walkSfxTimer: 0
  };
  var lastCompletedStep = null;
  var lastBlockedMove = null;
  var blockedDirectionLatch = '';
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
    lastBlockedMove = null;
    blockedDirectionLatch = '';
  }

  function getAttemptDirection(dx, dy) {
    if (dx < 0) return 'left';
    if (dx > 0) return 'right';
    if (dy < 0) return 'up';
    if (dy > 0) return 'down';
    return '';
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

  function getMilestoneLevels() {
    return Object.keys(LEVEL_MILESTONES).map(function(key) {
      return parseInt(key, 10);
    }).sort(function(a, b) {
      return a - b;
    });
  }

  function clampLevel(level) {
    return Math.max(1, Math.min(MAX_LEVEL, level | 0));
  }

  function getJourneyRankFromExperience(experience) {
    return clampLevel(1 + Math.floor(Math.max(0, experience || 0) / EXP_PER_LEVEL));
  }

  function getLevelStats(level) {
    var safeLevel = clampLevel(level);
    var milestones = getMilestoneLevels();
    var lowerLevel = milestones[0];
    var upperLevel = milestones[milestones.length - 1];

    for (var i = 0; i < milestones.length; i++) {
      if (milestones[i] <= safeLevel) lowerLevel = milestones[i];
      if (milestones[i] >= safeLevel) {
        upperLevel = milestones[i];
        break;
      }
    }

    if (lowerLevel === upperLevel) {
      return {
        maxHp: LEVEL_MILESTONES[lowerLevel].maxHp,
        attack: LEVEL_MILESTONES[lowerLevel].attack,
        defense: LEVEL_MILESTONES[lowerLevel].defense
      };
    }

    var lowerStats = LEVEL_MILESTONES[lowerLevel];
    var upperStats = LEVEL_MILESTONES[upperLevel];
    var progress = (safeLevel - lowerLevel) / Math.max(1, upperLevel - lowerLevel);
    return {
      maxHp: Math.min(999, Math.round(lowerStats.maxHp + (upperStats.maxHp - lowerStats.maxHp) * progress)),
      attack: Math.round(lowerStats.attack + (upperStats.attack - lowerStats.attack) * progress),
      defense: Math.round(lowerStats.defense + (upperStats.defense - lowerStats.defense) * progress)
    };
  }

  function getSkillStockGain(skillId) {
    if (!Game.Skills || !Game.Skills.getStockGain) return 1;
    return Math.max(1, Game.Skills.getStockGain(skillId));
  }

  function getSkillStockCap(skillId) {
    if (!Game.Skills || !Game.Skills.getStockCap) return getSkillStockGain(skillId);
    return Math.max(getSkillStockGain(skillId), Game.Skills.getStockCap(skillId));
  }

  function normalizeSkillCharges(charges, skills, fillMissing) {
    var knownSkills = normalizeSkills(skills || []);
    var source = charges || {};
    var result = {};
    for (var i = 0; i < knownSkills.length; i++) {
      var skillId = knownSkills[i];
      var value = typeof source[skillId] === 'number' ? source[skillId] : NaN;
      if (isNaN(value)) {
        value = fillMissing ? getSkillStockGain(skillId) : 0;
      }
      result[skillId] = Math.max(0, Math.min(getSkillStockCap(skillId), Math.floor(value)));
    }
    return result;
  }

  function syncSkillState(fillMissingCharges) {
    data.skillsKnown = normalizeSkills(data.skillsKnown);
    data.skillCharges = normalizeSkillCharges(data.skillCharges, data.skillsKnown, !!fillMissingCharges);
  }

  function syncGrowthStats(mode) {
    var stats = getLevelStats(getJourneyRank());
    var previousMaxHp = Math.max(1, data.maxHp || stats.maxHp);
    var hpRatio = Math.max(0, Math.min(1, (data.hp || previousMaxHp) / previousMaxHp));
    data.maxHp = stats.maxHp;
    data.attack = stats.attack;
    data.defense = stats.defense;
    if (mode === 'full') {
      data.hp = data.maxHp;
    } else {
      data.hp = Math.max(1, Math.min(data.maxHp, Math.round(data.maxHp * hpRatio)));
    }
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

    if (dx === 0 && dy === 0) {
      blockedDirectionLatch = '';
      return;
    }

    if (dx !== 0 || dy !== 0) {
      var newX = data.tileX + dx;
      var newY = data.tileY + dy;
      var attemptDirection = getAttemptDirection(dx, dy);
      var blockedMessage = Game.Map.getBlockedPassage ? Game.Map.getBlockedPassage(data.tileX, data.tileY, dx, dy) : null;

      if (blockedMessage && blockedDirectionLatch !== attemptDirection) {
        lastBlockedMove = blockedMessage;
        blockedDirectionLatch = attemptDirection;
        return;
      }

      if (Game.Map.isPassable(newX, newY)) {
        blockedDirectionLatch = '';
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
    if (Game.Quests && Game.Quests.obtainItem) {
      Game.Quests.obtainItem(id);
    }
  }

  function removeItem(id) {
    var idx = data.inventory.indexOf(id);
    if (idx >= 0) data.inventory.splice(idx, 1);
  }

  function heal(amount) {
    data.hp = Math.min(data.hp + amount, data.maxHp);
  }

  function fullHeal() {
    data.hp = data.maxHp;
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

  function consumeBlockedMove() {
    var blockedMove = lastBlockedMove;
    lastBlockedMove = null;
    return blockedMove;
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

  function getLevelUpGains(rank) {
    var currentRank = clampLevel(rank || 1);
    var previousStats = getLevelStats(Math.max(1, currentRank - 1));
    var currentStats = getLevelStats(currentRank);
    return {
      hp: Math.max(0, currentStats.maxHp - previousStats.maxHp),
      attack: Math.max(0, currentStats.attack - previousStats.attack),
      defense: Math.max(0, currentStats.defense - previousStats.defense)
    };
  }

  function queueSkillChoice(skillId, sourceText) {
    if (!skillId || !Game.Skills || !Game.Skills.get || !Game.Skills.get(skillId)) return false;
    if (hasSkill(skillId) && getSkillCharges(skillId) >= getSkillStockCap(skillId)) return false;
    pendingSkillChoices.push({
      skillId: skillId,
      sourceText: sourceText || '',
      stockGain: getSkillStockGain(skillId)
    });
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
      for (var rank = previousRank + 1; rank <= nextRank; rank++) {
        var gains = getLevelUpGains(rank);
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
            queueSkillChoice(skillId, '旅路ランク' + rank + 'の戦いで、新しい型の気配を掴んだ。');
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

  function previewExperienceGain(amount) {
    var gained = Math.max(0, amount || 0);
    var previousRank = getJourneyRank();
    var projectedExp = Math.max(0, (data.experience || 0) + gained);
    var nextRank = getJourneyRankFromExperience(projectedExp);
    var levelUps = [];
    var totalGains = { hp: 0, attack: 0, defense: 0 };

    if (nextRank > previousRank) {
      for (var rank = previousRank + 1; rank <= nextRank; rank++) {
        var gains = getLevelUpGains(rank);
        totalGains.hp += gains.hp;
        totalGains.attack += gains.attack;
        totalGains.defense += gains.defense;
        levelUps.push({
          rank: rank,
          hpGain: gains.hp,
          attackGain: gains.attack,
          defenseGain: gains.defense
        });
      }
    }

    return {
      experience: projectedExp,
      gained: gained,
      previousRank: previousRank,
      newRank: nextRank,
      nextRankExperience: nextRank >= MAX_LEVEL ? projectedExp : nextRank * EXP_PER_LEVEL,
      remainingToNextRank: nextRank >= MAX_LEVEL ? 0 : Math.max(0, nextRank * EXP_PER_LEVEL - projectedExp),
      levelUps: levelUps,
      totalGains: totalGains
    };
  }

  function getJourneyRank() {
    return getJourneyRankFromExperience(data.experience || 0);
  }

  function syncCatalystsFromInventory() {
    for (var i = 0; i < data.inventory.length; i++) {
      registerCatalystIfNeeded(data.inventory[i]);
    }
  }

  function getSkills() {
    syncSkillState(false);
    return data.skillsKnown.slice();
  }

  function hasSkill(id) {
    return getSkills().indexOf(id) >= 0;
  }

  function getSkillCharges(skillId) {
    syncSkillState(false);
    return Math.max(0, data.skillCharges[skillId] || 0);
  }

  function getAllSkillCharges() {
    syncSkillState(false);
    return JSON.parse(JSON.stringify(data.skillCharges || {}));
  }

  function addSkillCharges(skillId, amount) {
    if (!skillId || amount <= 0) return 0;
    syncSkillState(false);
    if (data.skillsKnown.indexOf(skillId) < 0) return 0;
    var current = data.skillCharges[skillId] || 0;
    var next = Math.min(getSkillStockCap(skillId), current + Math.max(0, amount | 0));
    data.skillCharges[skillId] = next;
    return next - current;
  }

  function restoreAllSkillCharges(amount) {
    syncSkillState(false);
    var total = 0;
    var skills = data.skillsKnown.slice();
    for (var i = 0; i < skills.length; i++) {
      total += addSkillCharges(skills[i], amount);
    }
    return total;
  }

  function consumeSkillCharge(skillId, amount) {
    if (!skillId) return false;
    syncSkillState(false);
    var spend = Math.max(1, amount | 0);
    if ((data.skillCharges[skillId] || 0) < spend) return false;
    data.skillCharges[skillId] -= spend;
    return true;
  }

  function learnSkill(id, replaceId) {
    if (!Game.Skills || !Game.Skills.get || !Game.Skills.get(id)) return false;
    syncSkillState(false);
    if (data.skillsKnown.indexOf(id) >= 0) {
      addSkillCharges(id, getSkillStockGain(id));
      return true;
    }
    if (replaceId && data.skillsKnown.length >= 6) {
      var replaceIndex = data.skillsKnown.indexOf(replaceId);
      if (replaceIndex >= 0) {
        data.skillsKnown.splice(replaceIndex, 1);
        delete data.skillCharges[replaceId];
      }
    }
    if (data.skillsKnown.length >= 6) return false;
    data.skillsKnown.push(id);
    syncSkillState(false);
    data.skillCharges[id] = 0;
    addSkillCharges(id, getSkillStockGain(id));
    return true;
  }

  function forgetSkill(id) {
    syncSkillState(false);
    var index = data.skillsKnown.indexOf(id);
    if (index < 0) return false;
    data.skillsKnown.splice(index, 1);
    delete data.skillCharges[id];
    return true;
  }

  function consumePendingSkillChoice() {
    if (!pendingSkillChoices.length) return null;
    var next = pendingSkillChoices.shift();
    if (typeof next === 'string') {
      return {
        skillId: next,
        sourceText: ''
      };
    }
    return next;
  }

  function clearPendingSkillChoices() {
    pendingSkillChoices = [];
  }

  function offerSkillChoice(skillId, sourceText) {
    return queueSkillChoice(skillId, sourceText);
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
    fullHeal: fullHeal,
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
    previewExperienceGain: previewExperienceGain,
    getJourneyRank: getJourneyRank,
    getLevelStats: getLevelStats,
    syncGrowthStats: syncGrowthStats,
    getSkills: getSkills,
    hasSkill: hasSkill,
    getSkillCharges: getSkillCharges,
    getAllSkillCharges: getAllSkillCharges,
    addSkillCharges: addSkillCharges,
    restoreAllSkillCharges: restoreAllSkillCharges,
    consumeSkillCharge: consumeSkillCharge,
    syncSkillState: syncSkillState,
    learnSkill: learnSkill,
    forgetSkill: forgetSkill,
    offerSkillChoice: offerSkillChoice,
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
    consumeBlockedMove: consumeBlockedMove,
    syncCatalystsFromInventory: syncCatalystsFromInventory,
    getData: getData
  };
})();
