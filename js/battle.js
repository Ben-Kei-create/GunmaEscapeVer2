// Battle system with special dice, status effects, combo, and boss phases
Game.Battle = (function() {
  var active = false;
  var enemy = null;
  var enemyParty = [];
  var currentTargetIndex = 0;
  var npcRef = null;
  var menuIndex = 0;
  var phase = 'menu';
  var message = '';
  var messageTimer = 0;
  var animTimer = 0;
  var shakeX = 0;
  var itemMenuIndex = 0;
  var itemMenuItems = [];
  var itemMenuMode = 'heal';
  var ritualMenuActionId = null;

  // Dice system
  var battleDice = [];     // array of dice definitions for this battle
  var diceValues = [];     // current displayed face index for each die
  var diceStopped = [];
  var diceResults = [];    // final face values (number or 'H3' etc)
  var diceTimer = 0;
  var diceSpeed = 3;
  var currentDice = 0;
  var diceFlashTimer = 0;
  var healTotal = 0;       // total healing from heal dice

  // Status effects system
  var playerEffects = [];  // { type, turnsLeft, value }
  var enemyEffects = [];
  var comboText = '';
  var comboTimer = 0;
  var comboMultiplier = 1;
  var bossEnraged = false;
  var enrageTimer = 0;

  // Boss gimmick runtime state
  var currentGimmick = null;   // reference to bossGimmicks[enemyId]
  var turnCount = 0;
  var phaseChanged = false;    // tracks if phase_change already fired
  var sealedCommand = -1;      // index of sealed menu item (-1 = none)
  var gimmickMessage = '';     // queued gimmick message to show
  var gimmickMessageTimer = 0;
  var ritualRuntime = null;
  var victoryGoldReward = 0;
  var rewardSummary = null;
  var introTimer = 0;
  var introMaxTimer = 0;
  var introLabel = '';
  var introSubLabel = '';
  var introAccent = '#8fb8ff';
  var introBgmStarted = false;
  var introBgmTriggerFrame = 0;
  var introBgmOptions = null;

  // Atmosphere foreground effects
  var atmosParticles = [];
  var atmosNoiseOffset = 0;

  // Boss dialogue system: queued multi-line dialogue for phase_change/special/victory
  var dialogueQueue = [];      // array of { speaker, text }
  var dialogueTimer = 0;       // frames until next line auto-advances
  var dialogueSpeaker = '';     // current displayed speaker
  var dialogueText = '';        // current displayed text
  var victoryDialogueQueued = false;

  var enemies = Game.BattleData.enemies;

  // ============================================================
  //  第1章〜第6章 ボス固有ギミック定義
  //  battle.js の update / executeAction から参照する
  // ============================================================

  var bossGimmicks = Game.BattleData.bossGimmicks;

  // 佐藤テスト戦の敵データ（ch1_boss_sato_test用）
  enemies.satoTest = {
    name: '佐藤（確認戦）',
    hp: 40, maxHp: 40,
    attack: 8, defense: 3, goldReward: 0,
    sprite: [
      [0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,2,1,0,0,0,0,0,0,0],
      [0,0,1,3,2,2,3,2,1,0,0,0,0,0,0,0],
      [0,0,1,2,2,4,2,2,1,0,0,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,5,5,5,5,1,0,0,0,0,0,0,0],
      [0,1,5,5,5,5,5,5,5,1,0,0,0,0,0,0],
      [0,1,5,5,5,5,5,5,5,1,0,0,0,0,0,0],
      [0,0,1,5,5,5,5,5,1,0,0,0,0,0,0,0],
      [0,0,1,6,6,0,6,6,1,0,0,0,0,0,0,0],
      [0,0,1,6,6,0,6,6,1,0,0,0,0,0,0,0],
      [0,0,0,7,7,0,7,7,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    palette: { 1:'#446', 2:'#aab', 3:'#22f', 4:'#c88', 5:'#369', 6:'#247', 7:'#335' }
  };

  enemies.darumaMaster = {
    name: '欠け目のだるま',
    hp: 40, maxHp: 40,
    attack: 9, defense: 4, goldReward: 0,
    ritualMode: 'repair_eye',
    ritualItemRequirement: 'darumaEye',
    ritualFailStyle: {
      text: 'だるまの虚無に押し返された。',
      returnEventId: 'ev_fail_ch2_rewind'
    },
    ritualParams: {
      eyeSlotCount: 1
    },
    sprite: [
      [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
      [0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,0],
      [0,0,1,2,2,2,2,2,2,2,2,1,0,0,0,0],
      [0,1,2,2,2,0,2,2,0,2,2,2,1,0,0,0],
      [0,1,2,2,2,2,2,2,2,2,2,2,1,0,0,0],
      [1,2,2,2,2,2,3,3,2,2,2,2,2,1,0,0],
      [1,2,2,2,3,2,2,2,2,3,2,2,2,1,0,0],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,1,0,0],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,1,0,0],
      [0,1,2,2,2,2,4,4,2,2,2,2,1,0,0,0],
      [0,0,1,2,2,2,2,2,2,2,2,1,0,0,0,0],
      [0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,0],
      [0,0,0,0,1,2,2,2,2,1,0,0,0,0,0,0],
      [0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0]
    ],
    palette: { 1:'#7a0f18', 2:'#d33942', 3:'#111111', 4:'#f4e2b3' }
  };

  enemies.konnyakuKing = {
    name: 'こんにゃく大王',
    hp: 72, maxHp: 72,
    attack: 14, defense: 6, goldReward: 90,
    sprite: enemies.ishidanGuard.sprite,
    palette: { 1:'#5a5a5a', 2:'#b0b0b0', 3:'#111111', 4:'#d8d8d8', 5:'#6d6d6d', 6:'#484848', 7:'#303030' }
  };

  enemies.cabbageGuardian = {
    name: 'キャベツ番人',
    hp: 90, maxHp: 90,
    attack: 17, defense: 6, goldReward: 110,
    sprite: enemies.cabbage.sprite,
    palette: enemies.cabbage.palette
  };

  enemies.threadMaiden = {
    name: '絡糸の機女',
    hp: 1, maxHp: 1,
    attack: 15, defense: 999, goldReward: 140,
    ritualMode: 'untangle',
    ritualFailStyle: {
      text: '強引に引いた糸が切れ、記憶が絡まり直していく。',
      returnEventId: 'ev_fail_tomioka_rewind'
    },
    ritualParams: {
      maxTangle: 12,
      lowDiceThreshold: 2,
      highDicePenaltyThreshold: 6
    },
    sprite: [
      [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
      [0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],
      [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
      [0,0,1,1,2,2,3,2,2,3,2,1,1,0,0,0],
      [0,0,1,2,2,2,2,4,4,2,2,2,1,0,0,0],
      [0,1,2,2,2,5,5,5,5,5,5,2,2,1,0,0],
      [0,1,2,2,5,5,5,5,5,5,5,5,2,1,0,0],
      [1,2,2,5,5,5,5,5,5,5,5,5,5,2,1,0],
      [1,2,2,5,5,5,5,5,5,5,5,5,5,2,1,0],
      [0,1,2,2,5,5,5,5,5,5,5,5,2,1,0,0],
      [0,1,2,2,2,5,5,5,5,5,5,2,2,1,0,0],
      [0,0,1,2,2,2,6,6,6,6,2,2,1,0,0,0],
      [0,0,0,1,2,6,0,0,0,0,6,2,1,0,0,0],
      [0,0,0,0,1,6,0,0,0,0,6,1,0,0,0,0],
      [0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    palette: { 1:'#2f2d3a', 2:'#d8d3c8', 3:'#1b1b22', 4:'#c96f7a', 5:'#f2f1ee', 6:'#8b7f6f' }
  };

  enemies.strayDaruma = {
    name: 'さまようだるま',
    hp: 28, maxHp: 28,
    attack: 9, defense: 2, goldReward: 24, expReward: 12, dropItem: 'yakimanju', dropRate: 0.18,
    sprite: enemies.darumaMaster.sprite,
    palette: { 1:'#5e1018', 2:'#c93039', 3:'#111111', 4:'#e7d2a6' }
  };

  enemies.roadsideBandit = {
    name: '境界の追いはぎ',
    hp: 36, maxHp: 36,
    attack: 11, defense: 4, goldReward: 32, expReward: 14, dropItem: 'healHerb', dropRate: 0.28,
    sprite: enemies.anguraGuard.sprite,
    palette: { 1:'#35363f', 3:'#ff6666', 4:'#2b2d36', 5:'#1f2028', 6:'#13141a' }
  };

  enemies.steamMonkey = {
    name: '湯煙ざる',
    hp: 34, maxHp: 34,
    attack: 10, defense: 3, goldReward: 28, expReward: 16, dropItem: 'yakimanju', dropRate: 0.22,
    sprite: enemies.onsenMonkey.sprite,
    palette: { 1:'#553322', 2:'#b17a49', 3:'#111111', 4:'#d8907a' }
  };

  enemies.konnyakuCrawler = {
    name: '蒟蒻うごめき',
    hp: 42, maxHp: 42,
    attack: 10, defense: 5, goldReward: 30, expReward: 15, dropItem: 'healHerb', dropRate: 0.2,
    sprite: enemies.konnyakuKing.sprite,
    palette: enemies.konnyakuKing.palette
  };

  enemies.silkShade = {
    name: '白糸の影',
    hp: 40, maxHp: 40,
    attack: 12, defense: 4, goldReward: 34, expReward: 17, dropItem: 'healHerb', dropRate: 0.2,
    sprite: enemies.threadMaiden.sprite,
    palette: { 1:'#312f3b', 2:'#d8d2c8', 3:'#1e1d24', 4:'#c48690', 5:'#e8e6e0', 6:'#857a6d' }
  };

  enemies.cabbageWisp = {
    name: '葉影のざわめき',
    hp: 38, maxHp: 38,
    attack: 11, defense: 4, goldReward: 30, expReward: 16, dropItem: 'healHerb', dropRate: 0.18,
    sprite: enemies.cabbageGuardian.sprite,
    palette: enemies.cabbageGuardian.palette
  };

  enemies.echoShard = {
    name: '返り声の欠片',
    hp: 44, maxHp: 44,
    attack: 13, defense: 5, goldReward: 38, expReward: 18,
    sprite: enemies.echo_guardian.sprite,
    palette: enemies.echo_guardian.palette
  };

  enemies.mistBeastling = {
    name: '霧獣の幼影',
    hp: 48, maxHp: 48,
    attack: 14, defense: 5, goldReward: 42, expReward: 20, dropItem: 'healHerb', dropRate: 0.15,
    sprite: enemies.haruna_lake_beast.sprite,
    palette: enemies.haruna_lake_beast.palette
  };

  enemies.mudWisp = {
    name: '泥の囁き',
    hp: 46, maxHp: 46,
    attack: 14, defense: 5, goldReward: 40, expReward: 22, dropItem: 'yakimanju', dropRate: 0.16,
    sprite: enemies.oze_mud_wraith.sprite,
    palette: enemies.oze_mud_wraith.palette
  };

  var menuItems = ['たたかう', 'アイテム', 'にげる'];

  function getRitualDefinition() {
    if (!ritualRuntime || !Game.RitualBattles || !Game.RitualBattles.getDefinition) return null;
    return Game.RitualBattles.getDefinition(ritualRuntime.ritualMode);
  }

  function getMenuEntries() {
    var entries = [
      { id: 'attack', label: menuItems[0] },
      { id: 'items', label: menuItems[1] },
      { id: 'flee', label: menuItems[2] }
    ];

    if (ritualRuntime && Game.RitualBattles && Game.RitualBattles.getExtraActions) {
      var extraActions = Game.RitualBattles.getExtraActions(ritualRuntime, enemy, Game.Player.getData()) || [];
      for (var i = 0; i < extraActions.length; i++) {
        entries.push({
          id: extraActions[i].id,
          label: extraActions[i].name || extraActions[i].id,
          ritual: true
        });
      }
    }
    return entries;
  }

  function getDiceResultValues() {
    var values = [];
    for (var i = 0; i < diceResults.length; i++) {
      values.push(parseFace(diceResults[i]).value);
    }
    return values;
  }

  function openHealItemMenu() {
    var inv = Game.Player.getData().inventory;
    itemMenuItems = [];
    itemMenuIndex = 0;
    itemMenuMode = 'heal';
    ritualMenuActionId = null;
    for (var i = 0; i < inv.length; i++) {
      var item = Game.Items.get(inv[i]);
      if (item && item.type === 'heal') {
        itemMenuItems.push({
          id: inv[i],
          item: item
        });
      }
    }
    if (itemMenuItems.length > 0) {
      phase = 'itemMenu';
      message = '使うアイテムを選べ';
      messageTimer = 0;
      Game.Audio.playSfx('confirm');
    } else {
      message = '使えるアイテムがない！';
      messageTimer = 30;
    }
  }

  function openRitualItemMenu(actionId) {
    var inv = Game.Player.getData().inventory;
    var requiredId = ritualRuntime && ritualRuntime.ritualItemRequirement ? ritualRuntime.ritualItemRequirement : null;
    var added = {};
    itemMenuItems = [];
    itemMenuIndex = 0;
    itemMenuMode = 'ritual';
    ritualMenuActionId = actionId;

    if (requiredId && Game.Player.hasItem(requiredId)) {
      var requiredItem = Game.Items.get(requiredId);
      if (requiredItem) {
        itemMenuItems.push({ id: requiredId, item: requiredItem });
        added[requiredId] = true;
      }
    }

    for (var i = 0; i < inv.length; i++) {
      var itemId = inv[i];
      if (added[itemId]) continue;
      var item = Game.Items.get(itemId);
      if (!item) continue;
      itemMenuItems.push({
        id: itemId,
        item: item
      });
      added[itemId] = true;
    }

    if (itemMenuItems.length > 0) {
      phase = 'itemMenu';
      message = '差し出す記憶を選べ';
      messageTimer = 0;
      Game.Audio.playSfx('confirm');
    } else {
      message = '差し出せるものがない…';
      messageTimer = 30;
    }
  }

  function evaluateRitualOutcome() {
    var ritualDefinition = getRitualDefinition();
    if (!ritualDefinition || !ritualRuntime) return null;

    var playerData = Game.Player.getData();
    if (ritualDefinition.checkVictory && ritualDefinition.checkVictory(ritualRuntime, enemy, playerData)) {
      enterVictoryPhase(enemy.name + 'を鎮めた。');
      if (Game.Particles) Game.Particles.emit('victory', 240, 100, { count: 20 });
      return 'victory';
    }

    if (ritualDefinition.checkFailure && ritualDefinition.checkFailure(ritualRuntime, enemy, playerData)) {
      phase = 'ritualFail';
      message = (ritualRuntime.ritualFailStyle && ritualRuntime.ritualFailStyle.text) || '理解が届かなかった…';
      messageTimer = 60;
      ritualRuntime.uiFlags.failureOverlay = true;
      return 'failure';
    }

    return null;
  }

  // Status effect helpers
  function addEffect(list, type, turnsLeft, value) {
    // Don't stack same type, refresh instead
    for (var i = 0; i < list.length; i++) {
      if (list[i].type === type) {
        list[i].turnsLeft = turnsLeft;
        list[i].value = value;
        return;
      }
    }
    list.push({ type: type, turnsLeft: turnsLeft, value: value });
  }

  function tickEffects(list) {
    for (var i = list.length - 1; i >= 0; i--) {
      list[i].turnsLeft--;
      if (list[i].turnsLeft <= 0) list.splice(i, 1);
    }
  }

  function hasEffect(list, type) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].type === type) return list[i];
    }
    return null;
  }

  function getEffectBonus(list, type) {
    var e = hasEffect(list, type);
    return e ? e.value : 0;
  }

  // Combo detection: count matching dice values
  function detectCombo(results) {
    var counts = {};
    for (var i = 0; i < results.length; i++) {
      var p = parseFace(results[i]);
      if (p.type === 'damage' && p.value > 0) {
        var k = p.value;
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    var maxCount = 0;
    for (var k in counts) {
      if (counts[k] > maxCount) maxCount = counts[k];
    }
    if (maxCount >= 4) return { mult: 2.0, text: '群馬フィーバー！×2.0' };
    if (maxCount >= 3) return { mult: 1.5, text: 'トリプル！×1.5' };
    if (maxCount >= 2) return { mult: 1.2, text: 'コンボ！×1.2' };
    return { mult: 1.0, text: '' };
  }

  function cloneEnemy(enemyId) {
    var baseEnemy = enemies[enemyId];
    if (!baseEnemy) return null;
    var cloned = JSON.parse(JSON.stringify(baseEnemy));
    cloned._enemyId = enemyId;
    cloned._effects = [];
    return cloned;
  }

  function isGroupBattle() {
    return enemyParty && enemyParty.length > 1;
  }

  function getLivingEnemies() {
    var living = [];
    for (var i = 0; i < enemyParty.length; i++) {
      if (enemyParty[i] && enemyParty[i].hp > 0) {
        living.push(enemyParty[i]);
      }
    }
    return living;
  }

  function getTotalEnemyGoldReward() {
    var total = 0;
    for (var i = 0; i < enemyParty.length; i++) {
      total += enemyParty[i] && enemyParty[i].goldReward ? enemyParty[i].goldReward : 0;
    }
    return total;
  }

  function getEnemyExperienceReward(foe) {
    if (!foe) return 0;
    if (typeof foe.expReward === 'number') return foe.expReward;
    return Math.max(6, Math.floor((foe.maxHp || 12) * 0.45 + (foe.attack || 0) * 1.2));
  }

  function collectEnemyDropRewards(foe, rewards) {
    if (!foe || !foe.dropItem) return;
    var dropId = typeof foe.dropItem === 'string' ? foe.dropItem : foe.dropItem.id;
    var dropRate = typeof foe.dropRate === 'number'
      ? foe.dropRate
      : (foe.dropItem && typeof foe.dropItem.rate === 'number' ? foe.dropItem.rate : 0);
    if (!dropId) return;
    if (dropRate >= 1 || Math.random() < dropRate) {
      rewards.push(dropId);
    }
  }

  function buildRewardSummary() {
    var items = [];
    var exp = 0;
    for (var i = 0; i < enemyParty.length; i++) {
      if (!enemyParty[i]) continue;
      exp += getEnemyExperienceReward(enemyParty[i]);
      collectEnemyDropRewards(enemyParty[i], items);
    }
    return {
      gold: getTotalEnemyGoldReward(),
      exp: exp,
      items: items,
      supportLogs: getPartySupportLogs(),
      afterglowText: getRitualAfterglowText()
    };
  }

  function getPartySupportLogs() {
    var partyMembers = Game.Player.getPartyMembers ? Game.Player.getPartyMembers() : [];
    var logs = [];
    for (var i = 0; i < partyMembers.length; i++) {
      var member = partyMembers[i];
      if (!member) continue;
      var text = member.name + ': ';
      if (member.id === 'akagi') {
        text += '境界を読み、攻め筋を整えた。';
      } else if (member.id === 'yamakawa') {
        text += '地形を見切り、守りを支えた。';
      } else if (member.id === 'furuya') {
        text += '突破口を示し、間合いを作った。';
      } else {
        text += (member.role || '同行支援') + 'で旅を支えた。';
      }
      logs.push({
        text: text,
        color: member.color || '#dce6ff'
      });
    }
    return logs;
  }

  function getRitualAfterglowText() {
    if (!ritualRuntime || !ritualRuntime.ritualMode || ritualRuntime.ritualMode === 'hp') return '';
    switch (ritualRuntime.ritualMode) {
      case 'repair_eye':
        return '虚ろな器は満ち、震えが静かに止まった。';
      case 'untangle':
        return '張りつめた糸がほどけ、止まった空気に風が戻る。';
      case 'temperature':
        return '荒ぶる湯は鎮まり、土地の息がゆっくり整っていく。';
      case 'offering':
        return '空っぽの祈りは満たされ、風だけがやさしく残った。';
      case 'resonance':
        return '痛みは共鳴へ変わり、深い水底に静けさが降りた。';
      case 'review_mix':
        return '積み重ねた作法が結ばれ、境界の呼吸が整っていく。';
      default:
        return '理解は届き、場のざわめきがゆっくりと鎮まった。';
    }
  }

  function clampEnemyPartyHp() {
    for (var i = 0; i < enemyParty.length; i++) {
      if (enemyParty[i] && enemyParty[i].hp < 0) {
        enemyParty[i].hp = 0;
      }
    }
    if (enemy && enemy.hp < 0) enemy.hp = 0;
  }

  function finalizeEnemyPartyVictoryState() {
    for (var i = 0; i < enemyParty.length; i++) {
      if (!enemyParty[i]) continue;
      enemyParty[i].hp = 0;
      enemyParty[i]._effects = [];
    }
    clampEnemyPartyHp();
    syncCurrentEnemy();
  }

  function enterVictoryPhase(victoryMessage) {
    finalizeEnemyPartyVictoryState();
    phase = 'victory';
    if (typeof victoryMessage === 'string') {
      message = victoryMessage;
      messageTimer = 60;
    }
  }

  function getRewardItemLabels(items) {
    var counts = {};
    var order = [];
    var labels = [];
    for (var i = 0; i < items.length; i++) {
      if (!counts[items[i]]) order.push(items[i]);
      counts[items[i]] = (counts[items[i]] || 0) + 1;
    }
    for (var j = 0; j < order.length; j++) {
      var itemId = order[j];
      var itemDef = Game.Items.get(itemId);
      var label = itemDef ? itemDef.name : itemId;
      if (counts[itemId] > 1) label += ' x' + counts[itemId];
      labels.push(label);
    }
    return labels;
  }

  function wrapBattleText(text, maxChars, maxLines) {
    var source = '' + (text || '');
    if (!source) return [''];
    var punctuation = '、。！？…）)] ';
    var lines = [];
    while (source.length > 0 && lines.length < maxLines) {
      if (source.length <= maxChars) {
        lines.push(source);
        source = '';
        break;
      }
      var slice = source.substring(0, maxChars);
      var splitAt = -1;
      for (var i = slice.length - 1; i >= Math.max(0, slice.length - 8); i--) {
        if (punctuation.indexOf(slice.charAt(i)) >= 0) {
          splitAt = i + 1;
          break;
        }
      }
      if (splitAt <= 0) splitAt = maxChars;
      lines.push(source.substring(0, splitAt));
      source = source.substring(splitAt);
    }
    if (source.length > 0 && lines.length) {
      lines[lines.length - 1] = lines[lines.length - 1].substring(0, Math.max(0, maxChars - 1)) + '…';
    }
    return lines;
  }

  function syncCurrentEnemy() {
    if (!enemyParty.length) {
      enemy = null;
      enemyEffects = [];
      return;
    }
    if (currentTargetIndex < 0) currentTargetIndex = 0;
    if (currentTargetIndex >= enemyParty.length) currentTargetIndex = enemyParty.length - 1;
    enemy = enemyParty[currentTargetIndex];
    if (!enemy._effects) enemy._effects = [];
    enemyEffects = enemy._effects;
  }

  function findNextLivingEnemyIndex(startIndex, dir) {
    if (!enemyParty.length) return -1;
    var step = dir || 1;
    for (var offset = 1; offset <= enemyParty.length; offset++) {
      var index = (startIndex + offset * step + enemyParty.length) % enemyParty.length;
      if (enemyParty[index] && enemyParty[index].hp > 0) return index;
    }
    return -1;
  }

  function selectTarget(index) {
    if (index < 0 || index >= enemyParty.length) return false;
    if (!enemyParty[index] || enemyParty[index].hp <= 0) return false;
    currentTargetIndex = index;
    syncCurrentEnemy();
    return true;
  }

  function cycleTarget(dir) {
    if (!isGroupBattle()) return false;
    var nextIndex = findNextLivingEnemyIndex(currentTargetIndex, dir || 1);
    if (nextIndex < 0 || nextIndex === currentTargetIndex) return false;
    currentTargetIndex = nextIndex;
    syncCurrentEnemy();
    message = '対象を ' + enemy.name + ' に切り替えた。';
    messageTimer = 20;
    Game.Audio.playSfx('confirm');
    return true;
  }

  function handleEnemyPartyDefeat() {
    if (getLivingEnemies().length > 0) {
      var nextIndex = findNextLivingEnemyIndex(currentTargetIndex, 1);
      if (nextIndex >= 0) {
        currentTargetIndex = nextIndex;
        syncCurrentEnemy();
      }
      return false;
    }
    return true;
  }

  function tickEnemyPartyEffects() {
    for (var i = 0; i < enemyParty.length; i++) {
      if (!enemyParty[i]) continue;
      if (!enemyParty[i]._effects) enemyParty[i]._effects = [];
      tickEffects(enemyParty[i]._effects);
    }
    syncCurrentEnemy();
  }

  function applyEnemyPartyAttack() {
    var playerData = Game.Player.getData();
    var defBonus = getEffectBonus(playerEffects, 'defense_up');
    var activeAttackers = [];
    var stunnedNames = [];
    var totalDamage = 0;

    for (var i = 0; i < enemyParty.length; i++) {
      var foe = enemyParty[i];
      if (!foe || foe.hp <= 0) continue;
      var foeEffects = foe._effects || [];
      if (hasEffect(foeEffects, 'stun')) {
        stunnedNames.push(foe.name);
        continue;
      }
      var damage = Math.max(1, foe.attack - (Game.Player.getDefense() + defBonus) + Math.floor(Math.random() * 5));
      totalDamage += damage;
      activeAttackers.push(foe.name);
    }

    if (!activeAttackers.length) {
      message = stunnedNames.length ? (stunnedNames.join(' / ') + 'は痺れて動けない！') : '敵の群れは様子をうかがっている。';
      messageTimer = 45;
      return false;
    }

    playerData.hp -= totalDamage;
    message = activeAttackers.join(' / ') + 'の攻撃！ ' + totalDamage + 'ダメージ！';
    if (stunnedNames.length) {
      message += ' ' + stunnedNames.join(' / ') + 'は動けない。';
    }
    messageTimer = 45;
    Game.Audio.playSfx(activeAttackers.length >= 2 || totalDamage >= 20 ? 'enemy_strike_heavy' : 'enemy_strike');
    shakeX = 5 + activeAttackers.length;
    if (Game.Particles) Game.Particles.emit('damage', 100, 220, { count: 6 + activeAttackers.length });

    if (playerData.hp <= 0) {
      playerData.hp = 0;
      phase = 'defeat';
      message = '力尽きた...';
      messageTimer = 90;
      Game.Audio.stopBgm();
      Game.Audio.playSfx('gameover');
      return true;
    }
    return false;
  }

  function getEncounterIntroText() {
    if (!enemyParty.length) return '敵が現れた！';
    if (enemyParty.length === 1) return enemyParty[0].name + 'が現れた！';
    var names = [];
    for (var i = 0; i < enemyParty.length && i < 3; i++) {
      names.push(enemyParty[i].name);
    }
    return names.join(' / ') + ' が現れた！';
  }

  function getBattleHeaderLabel() {
    if (isSpecialRitualBattle()) return '儀式開始';
    if (isGroupBattle()) return '群れ遭遇';
    if (currentGimmick) return '異形接触';
    return '敵影接近';
  }

  function getBattleAccentColor() {
    if (isSpecialRitualBattle()) return '#ffd66b';
    if (isGroupBattle()) return '#8fe0ff';
    if (enemy && enemy.palette && enemy.palette[1]) return enemy.palette[1];
    return '#8fb8ff';
  }

  function getBattleIntroSfxName() {
    if (isSpecialRitualBattle()) return 'battle_intro_ritual';
    if (isBossBattle()) return 'battle_intro_boss';
    if (isGroupBattle()) return 'battle_intro_group';
    return 'battle_intro_enemy';
  }

  function getRitualAudioSnapshot() {
    if (!ritualRuntime || !ritualRuntime.ritualState) return null;
    return {
      gauge: ritualRuntime.ritualGauge,
      hintState: ritualRuntime.ritualHintState,
      eyeRepaired: !!ritualRuntime.ritualState.eyeRepaired,
      hpZeroReached: !!ritualRuntime.ritualState.hpZeroReached
    };
  }

  function didRitualStateAdvance(beforeSnapshot) {
    if (!ritualRuntime || !ritualRuntime.ritualState || !beforeSnapshot) return false;
    return beforeSnapshot.gauge !== ritualRuntime.ritualGauge ||
      beforeSnapshot.hintState !== ritualRuntime.ritualHintState ||
      beforeSnapshot.eyeRepaired !== !!ritualRuntime.ritualState.eyeRepaired ||
      beforeSnapshot.hpZeroReached !== !!ritualRuntime.ritualState.hpZeroReached;
  }

  function playPlayerAttackSfx(dmg, rawDamageTotal, ritualAdvanced) {
    if (dmg > 0) {
      Game.Audio.playSfx('slash_hit');
      return;
    }
    if (ritualAdvanced) {
      Game.Audio.playSfx('ritual_chime');
      return;
    }
    if (rawDamageTotal > 0) {
      Game.Audio.playSfx('glancing_hit');
    }
  }

  function getBattleIntroProfile() {
    if (isSpecialRitualBattle()) {
      return { duration: 58, bgmTriggerFrame: 8, bgmOptions: { startDelay: 0.08 } };
    }
    if (isBossBattle()) {
      return { duration: 56, bgmTriggerFrame: 2, bgmOptions: { startDelay: 0 } };
    }
    if (isGroupBattle()) {
      return { duration: 52, bgmTriggerFrame: 16, bgmOptions: { startDelay: 0.03 } };
    }
    return { duration: 40, bgmTriggerFrame: 14, bgmOptions: { startDelay: 0.02 } };
  }

  function startBattleBgm() {
    var bossBgm = (currentGimmick && currentGimmick.bgm) ? currentGimmick.bgm : 'battle';
    Game.Audio.playBgm(bossBgm, introBgmOptions || undefined);
    introBgmStarted = true;
  }

  function start(enemyId, npc) {
    active = true;
    npcRef = npc;
    var enemyIds = Array.isArray(enemyId) ? enemyId.slice() : [enemyId];
    enemyParty = [];
    for (var ei = 0; ei < enemyIds.length; ei++) {
      var enemyClone = cloneEnemy(enemyIds[ei]);
      if (enemyClone) enemyParty.push(enemyClone);
    }
    if (!enemyParty.length) return;
    currentTargetIndex = 0;
    enemy = enemyParty[0];
    menuIndex = 0;
    itemMenuIndex = 0;
    itemMenuItems = [];
    itemMenuMode = 'heal';
    ritualMenuActionId = null;

    // Initialize foreground atmosphere effects
    initAtmosphere();

    phase = 'intro';
    message = getEncounterIntroText();
    messageTimer = 0;
    playerEffects = [];
    enemyEffects = enemy._effects || [];
    comboText = '';
    comboTimer = 0;
    comboMultiplier = 1;
    bossEnraged = false;
    enrageTimer = 0;
    // Initialize boss gimmick
    currentGimmick = isGroupBattle() ? null : (enemy && enemy.ritualMode ? null : (bossGimmicks[enemy._enemyId] || null));
    turnCount = 0;
    phaseChanged = false;
    sealedCommand = -1;
    gimmickMessage = '';
    gimmickMessageTimer = 0;
    // Boss dialogue queue for multi-line display
    dialogueQueue = [];
    dialogueTimer = 0;
    dialogueSpeaker = '';
    dialogueText = '';
    victoryDialogueQueued = false;
    victoryGoldReward = 0;
    rewardSummary = null;
    ritualRuntime = Game.RitualBattles && Game.RitualBattles.createRuntime
      ? (isGroupBattle() ? null : Game.RitualBattles.createRuntime(enemy._enemyId, enemy))
      : null;
    if (ritualRuntime) {
      var ritualDefinition = Game.RitualBattles.getDefinition(ritualRuntime.ritualMode);
      if (ritualDefinition && ritualDefinition.setup) {
        ritualDefinition.setup(ritualRuntime, enemy, Game.Player.getData());
      }
    }
    var introProfile = getBattleIntroProfile();
    introMaxTimer = introProfile.duration;
    introTimer = introMaxTimer;
    introLabel = getBattleHeaderLabel();
    introSubLabel = isGroupBattle() ? enemyParty.map(function(foe) { return foe.name; }).join(' / ') : enemy.name;
    introAccent = getBattleAccentColor();
    introBgmStarted = false;
    introBgmTriggerFrame = introProfile.bgmTriggerFrame;
    introBgmOptions = introProfile.bgmOptions || null;

    Game.Audio.stopBgm();
    Game.Audio.playSfx(getBattleIntroSfxName());
  }

  // ── Boss Dialogue Queue System ──
  function queueDialogue(lines) {
    if (!lines || lines.length === 0) return;
    dialogueQueue = lines.slice();
    advanceDialogue();
  }

  function advanceDialogue() {
    if (dialogueQueue.length === 0) {
      dialogueSpeaker = '';
      dialogueText = '';
      dialogueTimer = 0;
      return;
    }
    var line = dialogueQueue.shift();
    dialogueSpeaker = line.speaker || '';
    dialogueText = line.text || '';
    dialogueTimer = 70; // ~1.2 seconds per line
  }

  function updateDialogue() {
    if (dialogueTimer > 0) {
      dialogueTimer--;
      if (dialogueTimer <= 0) {
        advanceDialogue();
      }
    }
  }

  function isDialogueActive() {
    return dialogueTimer > 0 || dialogueQueue.length > 0;
  }

  // Play boss-specific SFX for a trigger type (phase_change / special_move)
  function playBossSfx(triggerType) {
    if (currentGimmick && currentGimmick.sfx && currentGimmick.sfx[triggerType]) {
      Game.Audio.playSfx(currentGimmick.sfx[triggerType]);
    }
  }

  // Parse a face value: number or 'H3' (heal 3)
  function parseFace(face) {
    if (typeof face === 'number') return { type: 'damage', value: face };
    if (typeof face === 'string' && face.charAt(0) === 'H') {
      return { type: 'heal', value: parseInt(face.substring(1)) || 0 };
    }
    return { type: 'damage', value: 0 };
  }

  // Get display text for a face value
  function faceText(face) {
    if (typeof face === 'number') return '' + face;
    if (typeof face === 'string' && face.charAt(0) === 'H') return 'H' + face.substring(1);
    return '0';
  }

  // Get display number for cycling animation
  function faceDisplayNum(face) {
    var p = parseFace(face);
    return p.value;
  }

  function startDiceRoll() {
    phase = 'diceRoll';
    var equipped = Game.Player.getEquippedDice();
    battleDice = [];
    diceValues = [];
    diceStopped = [];
    diceResults = [];
    currentDice = 0;
    diceTimer = 0;
    diceFlashTimer = 0;
    healTotal = 0;

    for (var i = 0; i < equipped.length; i++) {
      var diceItem = Game.Items.get(equipped[i]);
      if (!diceItem || !diceItem.faces) {
        diceItem = Game.Items.get('normalDice');
      }
      battleDice.push(diceItem);
      diceValues.push(0); // face index
      diceStopped.push(false);
      diceResults.push(null);
    }
    message = 'スペース/エンターで止めろ！ まだならX/Escで戻れる。';
  }

  function canCancelDiceRoll() {
    return phase === 'diceRoll' && currentDice === 0;
  }

  function update() {
    if (!active) return;

    // Advance boss dialogue queue
    updateDialogue();

    if (shakeX > 0.5) {
      shakeX *= 0.85;
    } else {
      shakeX = 0;
    }

    if (diceFlashTimer > 0) diceFlashTimer--;

    if (messageTimer > 0) {
      messageTimer--;
      if (phase !== 'diceRoll') return;
    }

    switch (phase) {
      case 'intro': handleIntroPhase(); break;
      case 'menu': handleMenuPhase(); break;
      case 'itemMenu': handleItemMenuPhase(); break;
      case 'diceRoll': handleDiceRollPhase(); break;
      case 'diceResult': handleDiceResultPhase(); break;
      case 'playerAttack': handlePlayerAttackPhase(); break;
      case 'enemyAttack': handleEnemyAttackPhase(); break;
      case 'victory': handleVictoryPhase(); break;
      case 'reward': handleRewardPhase(); break;
      case 'defeat': handleDefeatPhase(); break;
      case 'ritualFail': handleRitualFailPhase(); break;
      case 'useItem': handleUseItemPhase(); break;
      case 'flee': handleFleePhase(); break;
    }
    return null;
  }

  // --- Phase Handlers ---
  function handleIntroPhase() {
        introTimer--;
        if (!introBgmStarted && introTimer <= introBgmTriggerFrame) {
          startBattleBgm();
        }
        if (introTimer <= 0) {
          phase = 'menu';
          introTimer = 0;
          if (!introBgmStarted) startBattleBgm();
        }

  }

  function handleMenuPhase() {
        var menuEntries = getMenuEntries();
        if (menuIndex >= menuEntries.length) {
          menuIndex = Math.max(0, menuEntries.length - 1);
        }
        if (isGroupBattle() && Game.Input.isPressed('left')) {
          cycleTarget(-1);
          break;
        }
        if (isGroupBattle() && Game.Input.isPressed('right')) {
          cycleTarget(1);
          break;
        }
        if (Game.Input.isPressed('up')) {
          menuIndex = (menuIndex - 1 + menuEntries.length) % menuEntries.length;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('down')) {
          menuIndex = (menuIndex + 1) % menuEntries.length;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('confirm')) {
          executeAction(menuIndex, menuEntries[menuIndex]);
        }

  }

  function handleItemMenuPhase() {
        if (Game.Input.isPressed('up')) {
          itemMenuIndex = (itemMenuIndex - 1 + itemMenuItems.length) % itemMenuItems.length;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('down')) {
          itemMenuIndex = (itemMenuIndex + 1) % itemMenuItems.length;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('cancel')) {
          phase = 'menu';
          message = '';
          itemMenuMode = 'heal';
          ritualMenuActionId = null;
          Game.Audio.playSfx('cancel');
        }
        if (Game.Input.isPressed('confirm')) {
          useSelectedItem();
        }

  }

  function handleDiceRollPhase() {
        if (canCancelDiceRoll() && Game.Input.isPressed('cancel')) {
          phase = 'menu';
          message = '構えを解いた。';
          messageTimer = 18;
          Game.Audio.playSfx('cancel');
          break;
        }

        diceTimer++;
        if (diceTimer >= diceSpeed) {
          diceTimer = 0;
          for (var i = 0; i < battleDice.length; i++) {
            if (!diceStopped[i]) {
              diceValues[i] = (diceValues[i] + 1) % 6;
            }
          }
        }

        if (Game.Input.isPressed('confirm') && currentDice < battleDice.length) {
          var die = battleDice[currentDice];
          var faceIdx = diceValues[currentDice];
          var face = die.faces[faceIdx];
          diceStopped[currentDice] = true;
          diceResults[currentDice] = face;
          diceFlashTimer = 8;
          Game.Audio.playSfx('dice_stop');
          currentDice++;
          if (currentDice === 1 && battleDice.length > 1) {
            message = '振り始めた。もう戻れない。';
          }

          if (currentDice >= battleDice.length) {
            resolveDiceResults();
          }
        }

  }

  function handleDiceResultPhase() {
        animTimer--;
        if (animTimer <= 0) {
          var ritualDefAfterRoll = getRitualDefinition();
          var ritualVictoryAfterRoll = ritualDefAfterRoll && ritualDefAfterRoll.checkVictory &&
            ritualDefAfterRoll.checkVictory(ritualRuntime, enemy, Game.Player.getData());
          if (ritualRuntime && ritualRuntime.ritualMode === 'repair_eye' &&
              ritualRuntime.ritualState.hpZeroReached && !ritualVictoryAfterRoll) {
            phase = 'menu';
            message = '暴力では、まだ満たせない。';
            messageTimer = 45;
          } else if (enemy.hp <= 0 && getLivingEnemies().length <= 0) {
            enterVictoryPhase(message);
          } else {
            phase = 'playerAttack';
            animTimer = 5;
          }
        }

  }

  function handlePlayerAttackPhase() {
        animTimer--;
        if (animTimer <= 0) {
          // Check if enemy is stunned
          var stunned = hasEffect(enemyEffects, 'stun');
          if (stunned) {
            phase = 'enemyAttack';
            message = enemy.name + 'は痺れて動けない！';
            messageTimer = 45;
          } else {
            phase = 'enemyAttack';
            if (!applyEnemyPartyAttack()) {
              syncCurrentEnemy();
            }
          }
        }

  }

  function handleEnemyAttackPhase() {
        // Tick status effects at end of round
        tickEffects(playerEffects);
        tickEnemyPartyEffects();
        turnCount++;

        // ── Boss gimmick: passive effect at turn end ──
        if (currentGimmick && currentGimmick.passive && currentGimmick.passive.apply) {
          var passiveResult = currentGimmick.passive.apply(enemy, turnCount, playerEffects, enemyEffects);
          if (passiveResult && typeof passiveResult === 'string') {
            gimmickMessage = passiveResult;
            gimmickMessageTimer = 50;
          }
        }

        // ── Boss gimmick: special move trigger ──
        if (currentGimmick && currentGimmick.special_move && enemy.hp > 0) {
          var sm = currentGimmick.special_move;
          if (sm.trigger && sm.trigger(turnCount, enemy)) {
            var spDmg = sm.damage ? sm.damage(enemy) : 0;
            if (spDmg > 0) {
              var playerData3 = Game.Player.getData();
              var defBonus3 = getEffectBonus(playerEffects, 'defense_up');
              var finalSpDmg = Math.max(1, spDmg - (Game.Player.getDefense() + defBonus3));
              playerData3.hp -= finalSpDmg;
              Game.Audio.playSfx('damage');
              shakeX = 8;
              if (Game.Particles) Game.Particles.emit('damage', 100, 220, { count: 10 });
              gimmickMessage = (sm.name || '必殺技') + '！ ' + finalSpDmg + 'ダメージ！';
              gimmickMessageTimer = 55;
              if (playerData3.hp <= 0) {
                playerData3.hp = 0;
                phase = 'defeat';
                message = '力尽きた...';
                messageTimer = 90;
                Game.Audio.stopBgm();
                Game.Audio.playSfx('gameover');
                break;
              }
            }
            // Self stun after special
            if (sm.self_stun) {
              addEffect(enemyEffects, 'stun', sm.self_stun, 0);
            }
            // Seal a command for next turn
            if (sm.id === 'forgotten_route' || sm.id === 'lone_hack') {
              sealedCommand = 1; // seal 'アイテム'
            }
            // Play special_move SFX and queue dialogue
            playBossSfx('special_move');
            if (currentGimmick.dialogue && currentGimmick.dialogue.special_move) {
              queueDialogue(currentGimmick.dialogue.special_move);
            }
          }
        } else {
          // No special fired this turn: clear any previous seal
          if (sealedCommand >= 0) {
            sealedCommand = -1;
          }
        }

        phase = 'menu';

  }

  function handleVictoryPhase() {
        // Queue victory dialogue if present
        if (currentGimmick && currentGimmick.dialogue && currentGimmick.dialogue.victory) {
          if (!victoryDialogueQueued) {
            victoryDialogueQueued = true;
            queueDialogue(currentGimmick.dialogue.victory);
          }
          // Wait for dialogue to finish before ending battle
          if (isDialogueActive()) {
            updateDialogue();
            break;
          }
        }
        if (!rewardSummary) {
          clampEnemyPartyHp();
          rewardSummary = buildRewardSummary();
          victoryGoldReward = rewardSummary.gold;
          messageTimer = 0;
          phase = 'reward';
          Game.Audio.stopBgm();
          var victoryBgm = (currentGimmick && currentGimmick.victory_bgm) ? currentGimmick.victory_bgm : null;
          if (victoryBgm) {
            Game.Audio.playBgm(victoryBgm);
          } else {
            Game.Audio.playSfx('victory');
          }
        }

  }

  function handleRewardPhase() {
        if (Game.Input.isPressed('confirm') || Game.Input.isPressed('cancel')) {
          active = false;
          Game.Audio.stopBgm();
          ritualRuntime = null;
          enemyParty = [];
          Game.Audio.playSfx('confirm');
          var victoryPayload = {
            result: 'victory',
            npc: npcRef,
            goldReward: rewardSummary ? rewardSummary.gold : victoryGoldReward,
            expReward: rewardSummary ? rewardSummary.exp : 0,
            itemRewards: rewardSummary ? rewardSummary.items.slice() : []
          };
          rewardSummary = null;
          return victoryPayload;
        }

  }

  function handleDefeatPhase() {
        active = false;
        Game.Audio.stopBgm();
        ritualRuntime = null;
        enemyParty = [];
        rewardSummary = null;
        return { result: 'defeat' };

  }

  function handleRitualFailPhase() {
        active = false;
        Game.Audio.stopBgm();
        var failStyle = ritualRuntime ? ritualRuntime.ritualFailStyle : null;
        ritualRuntime = null;
        enemyParty = [];
        rewardSummary = null;
        return {
          result: 'ritual_fail',
          returnEventId: failStyle ? failStyle.returnEventId : null,
          failText: failStyle ? failStyle.text : message
        };

  }

  function handleUseItemPhase() {
        phase = 'enemyAttack';
        applyEnemyPartyAttack();

  }

  function handleFleePhase() {
        active = false;
        Game.Audio.stopBgm();
        Game.Audio.playBgm('field');
        ritualRuntime = null;
        enemyParty = [];
        rewardSummary = null;
        return { result: 'flee' };
  }


  function executeAction(index, menuEntry) {
    // ── Boss gimmick: sealed command ──
    if (sealedCommand >= 0 && index === sealedCommand) {
      message = 'その行動は封じられている！';
      messageTimer = 45;
      Game.Audio.playSfx('cancel');
      return;
    }

    var entry = menuEntry || getMenuEntries()[index] || { id: 'attack' };
    switch (entry.id) {
      case 'attack':
        startDiceRoll();
        break;
      case 'items':
        openHealItemMenu();
        break;
      case 'flee':
        if (Math.random() < 0.5) {
          message = '逃げ出した！';
          messageTimer = 30;
          phase = 'flee';
        } else {
          message = '逃げられなかった！';
          messageTimer = 30;
          phase = 'playerAttack';
          animTimer = 5;
        }
        break;
      case 'drop_item_to_eye_slot':
        openRitualItemMenu(entry.id);
        break;
    }
  }

  function useSelectedItem() {
    if (!itemMenuItems.length) {
      phase = 'menu';
      return;
    }
    var selected = itemMenuItems[itemMenuIndex];
    if (!selected || !selected.item) {
      phase = 'menu';
      return;
    }

    if (itemMenuMode === 'ritual') {
      var ritualDefinition = getRitualDefinition();
      if (ritualDefinition && ritualDefinition.onActionResolved) {
        ritualDefinition.onActionResolved(
          ritualRuntime,
          enemy,
          Game.Player.getData(),
          { id: ritualMenuActionId || 'drop_item_to_eye_slot', itemId: selected.id },
          { damage: 0, heal: 0 }
        );
      }

      var ritualItemOutcome = evaluateRitualOutcome();
      if (!ritualItemOutcome) {
        message = ritualRuntime && ritualRuntime.ritualState.eyeRepaired
          ? selected.item.name + 'をそっと重ねた。'
          : 'その記憶は、まだ噛み合わない。';
        messageTimer = 45;
        phase = 'menu';
      }
      itemMenuItems = [];
      itemMenuIndex = 0;
      itemMenuMode = 'heal';
      ritualMenuActionId = null;
      Game.Audio.playSfx(ritualRuntime && ritualRuntime.ritualState && ritualRuntime.ritualState.eyeRepaired ? 'ritual_chime' : 'confirm');
      return;
    }

    Game.Player.removeItem(selected.id);
    Game.Player.heal(selected.item.healAmount);
    message = selected.item.name + 'を使った！ HPが' + selected.item.healAmount + '回復！';
    messageTimer = 45;
    Game.Audio.playSfx('item');
    itemMenuItems = [];
    itemMenuIndex = 0;
    itemMenuMode = 'heal';
    ritualMenuActionId = null;
    phase = 'useItem';
  }

  // Draw a single die with custom color and face value
  function drawDie(R, ctx, x, y, diceItem, faceIdx, size, stopped, flash) {
    var s = size || 48;
    var face = diceItem.faces[faceIdx % diceItem.faces.length];
    var parsed = parseFace(face);
    var dieColor = diceItem.color || '#ffffff';
    var dotCol = diceItem.dotColor || '#111111';

    // Shadow
    R.drawRectAbsolute(x + 2, y + 2, s, s, '#222233');

    // Die face color
    var faceColor = flash ? '#ffffee' : dieColor;
    if (stopped && !flash) {
      // Slightly darken when stopped
      faceColor = dieColor;
    }
    R.drawRectAbsolute(x, y, s, s, faceColor);

    // Border
    ctx.strokeStyle = stopped ? '#886622' : '#444466';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, s, s);

    // Corners
    var cc = '#888888';
    R.drawRectAbsolute(x, y, 2, 2, cc);
    R.drawRectAbsolute(x + s - 2, y, 2, 2, cc);
    R.drawRectAbsolute(x, y + s - 2, 2, 2, cc);
    R.drawRectAbsolute(x + s - 2, y + s - 2, 2, 2, cc);

    // Draw the value as a number in the center (for custom faces)
    var displayVal = parsed.value;
    var displayStr = '' + displayVal;
    var textColor = dotCol;

    if (parsed.type === 'heal') {
      // Heal faces: show green with + sign
      textColor = '#22aa22';
      displayStr = '+' + displayVal;
    }

    // For values 1-6, draw traditional dot pattern too
    if (parsed.type === 'damage' && displayVal >= 1 && displayVal <= 6) {
      var dotPositions = {
        1: [[3,3]],
        2: [[1,1],[5,5]],
        3: [[1,1],[3,3],[5,5]],
        4: [[1,1],[1,5],[5,1],[5,5]],
        5: [[1,1],[1,5],[3,3],[5,1],[5,5]],
        6: [[1,1],[1,3],[1,5],[5,1],[5,3],[5,5]]
      };
      var dots = dotPositions[displayVal];
      var dotSize = Math.floor(s / 7);
      for (var i = 0; i < dots.length; i++) {
        var dx = x + Math.floor(dots[i][0] * s / 7) + Math.floor(dotSize / 4);
        var dy = y + Math.floor(dots[i][1] * s / 7) + Math.floor(dotSize / 4);
        R.drawRectAbsolute(dx, dy, dotSize, dotSize, dotCol);
      }
    } else {
      // For large numbers or heal, draw the number text
      var fontSize = s > 34 ? 18 : 14;
      R.drawTextJP(displayStr, x + Math.floor(s / 2) - (displayStr.length * fontSize / 4),
        y + Math.floor(s / 2) - Math.floor(fontSize / 2), textColor, fontSize);
    }

    // Die name label (tiny, below die)
    if (stopped && diceItem.id !== 'normalDice') {
      var shortName = diceItem.name.substring(0, 4);
      R.drawTextJP(shortName, x, y + s + 1, '#888', 7);
    }
  }

  function drawTensionGauge(R, runtime) {
    var gaugeMax = enemy && enemy.ritualParams ? (enemy.ritualParams.maxTangle || 12) : 12;
    var ratio = gaugeMax > 0 ? Math.max(0, Math.min(1, runtime.ritualGauge / gaugeMax)) : 0;
    var green = Math.floor(180 * (1 - ratio) + 40);
    var red = Math.floor(180 * ratio + 40);
    var color = 'rgb(' + red + ',' + green + ',90)';
    R.drawRectAbsolute(160, 120, 160, 12, '#333');
    R.drawRectAbsolute(161, 121, 158 * ratio, 10, color);
    R.drawTextJP('絡まり ' + runtime.ritualGauge + '/' + gaugeMax, 160, 135, '#fff', 12);
  }

  function drawTemperatureGauge(R, runtime) {
    var gaugeValue = Math.max(0, runtime.ritualGauge || 0);
    var maxTemp = enemy && enemy.ritualParams ? Math.max(120, enemy.ritualParams.startTemperature || 110) : 120;
    var ratio = Math.max(0, Math.min(1, gaugeValue / maxTemp));
    var gaugeX = 340;
    var gaugeY = 22;
    var gaugeH = 96;
    var fillH = Math.floor(gaugeH * ratio);
    R.drawRectAbsolute(gaugeX, gaugeY, 20, gaugeH, '#2a2a33');
    R.drawRectAbsolute(gaugeX + 2, gaugeY + gaugeH - fillH - 2, 16, fillH, '#f0a020');
    if (runtime.ritualState.targetZoneRevealed && runtime.ritualTargetZone) {
      var zoneTop = gaugeY + gaugeH - Math.floor(gaugeH * (runtime.ritualTargetZone.max / maxTemp));
      var zoneHeight = Math.max(4, Math.floor(gaugeH * ((runtime.ritualTargetZone.max - runtime.ritualTargetZone.min) / maxTemp)));
      R.drawRectAbsolute(gaugeX - 2, zoneTop, 24, zoneHeight, 'rgba(120,220,255,0.45)');
    }
    R.drawTextJP('温度', gaugeX - 2, gaugeY - 12, '#d8f4ff', 10);
    R.drawTextJP('' + gaugeValue, gaugeX - 2, gaugeY + gaugeH + 6, '#fff', 10);
  }

  function drawRitualEyeSlot(R, runtime, enemyX) {
    if (!runtime || !runtime.ritualSlots || !runtime.ritualSlots.length) return;
    var slot = runtime.ritualSlots[0];
    if (!slot || !slot.visible) return;
    var slotX = enemyX + 54;
    var slotY = 58;
    R.drawRectAbsolute(slotX, slotY, 18, 18, 'rgba(255,255,255,0.12)');
    R.drawRectAbsolute(slotX + 1, slotY + 1, 16, 16, slot.filled ? '#f2e2b0' : '#1b1b25');
    R.drawTextJP(slot.filled ? '目' : '空', slotX + 3, slotY + 4, slot.filled ? '#7a0f18' : '#c8ccd8', 10);
    R.drawTextJP('目を入れる', enemyX + 36, 82, '#d8c68a', 10);
  }

  function drawEnemyPartyGroup(R, ctx, C) {
    var visibleEnemies = [];
    for (var vi = 0; vi < enemyParty.length; vi++) {
      if (enemyParty[vi] && enemyParty[vi].hp > 0) {
        visibleEnemies.push({ foe: enemyParty[vi], partyIndex: vi });
      }
    }
    if (!visibleEnemies.length) return;

    var count = visibleEnemies.length;
    var scale = count >= 3 ? 3 : 4;
    var spriteW = 16 * scale;
    var spriteH = 16 * scale;
    var gap = count >= 3 ? 18 : 28;
    var totalWidth = count * spriteW + (count - 1) * gap;
    var startX = Math.floor((C.CANVAS_WIDTH - totalWidth) / 2);
    var baseY = count >= 3 ? 42 : 48;

    for (var i = 0; i < count; i++) {
      var entry = visibleEnemies[i];
      var foe = entry.foe;
      var ex = startX + i * (spriteW + gap);
      R.drawSpriteAbsolute(foe.sprite, ex, baseY, foe.palette, scale);
      if (entry.partyIndex === currentTargetIndex) {
        R.drawTextJP('▼', ex + Math.floor(spriteW / 2) - 4, baseY - 12, '#ffd66b', 10);
      }

      R.drawRectAbsolute(ex, baseY + spriteH + 8, spriteW, 8, '#333');
      var foeDisplayHp = Math.max(0, foe.hp);
      var hpRatio = foe.maxHp > 0 ? Math.max(0, foeDisplayHp / foe.maxHp) : 0;
      R.drawRectAbsolute(ex + 1, baseY + spriteH + 9, Math.max(0, Math.floor((spriteW - 2) * hpRatio)), 6,
        hpRatio > 0.3 ? C.COLORS.HP_GREEN : C.COLORS.HP_RED);
      R.drawTextJP(foe.name, ex, baseY + spriteH + 18, foe.hp > 0 ? '#ffffff' : '#777777', 9);
      R.drawText(foeDisplayHp + '/' + foe.maxHp, ex + spriteW, baseY + spriteH + 18, '#b8c4e0', 8, 'right');
    }

    if (count > 1) {
      R.drawTextJP('←→: 対象切替', 318, 136, '#8b96b6', 9);
    }
  }

  function drawBattlePanelAccent(R, x, y, w, h, accent) {
    var ctx = R.getContext();
    var color = accent || '#8fb8ff';
    R.drawRectAbsolute(x + 6, y + 5, Math.max(12, w - 12), 1, color);
    R.drawRectAbsolute(x + 5, y + 6, 2, Math.max(8, h - 12), color);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(x + 6, y + 8, Math.max(8, w - 12), 4);
  }

  function isBackdropMap(mapId, list) {
    return list.indexOf(mapId) !== -1;
  }

  function getBattleMapId() {
    return Game.Map && Game.Map.getCurrentMapId ? Game.Map.getCurrentMapId() : '';
  }

  function getBattleJourneyIndex(mapId) {
    if (!Game.Chapters || !Game.Chapters.getJourneyIndex || !Game.Player || !Game.Player.getData) return 0;
    return Game.Chapters.getJourneyIndex(Game.Player.getData().chapter, mapId || getBattleMapId()) || 0;
  }

  function isBossBattle() {
    return isSpecialRitualBattle() || !!currentGimmick || (!!npcRef && !isGroupBattle());
  }

  function isSpecialRitualBattle() {
    return !!(ritualRuntime && ritualRuntime.ritualMode && ritualRuntime.ritualMode !== 'hp');
  }

  function getBattleBackdropId() {
    var mapId = getBattleMapId();
    if (isSpecialRitualBattle()) return 'boss_ritual';
    if (isBossBattle()) return 'boss_omen';
    if (isBackdropMap(mapId, ['maebashi', 'takasaki', 'shimonita', 'tomioka', 'tsumagoi', 'kusatsu'])) {
      return 'field_roadside';
    }
    if (isBackdropMap(mapId, ['forest', 'tamura', 'konuma', 'onuma', 'akagi_ranch', 'akagi_shrine', 'shirane_trail'])) {
      return 'field_woodland';
    }
    if (isBackdropMap(mapId, ['kusatsu_deep', 'jomo_gakuen', 'tanigawa_tunnel', 'haruna_lake', 'oze_marsh', 'minakami_valley', 'border_tunnel'])) {
      return 'field_wetland';
    }
    return getBattleJourneyIndex(mapId) >= 5 ? 'field_wetland' : 'field_roadside';
  }

  function drawRoadsideBackdrop(R, ctx, C) {
    ctx.fillStyle = '#110d1f';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    ctx.fillStyle = '#302048';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, 84);
    ctx.fillStyle = '#6a3356';
    ctx.fillRect(0, 84, C.CANVAS_WIDTH, 30);
    ctx.fillStyle = '#d47b4e';
    ctx.fillRect(0, 114, C.CANVAS_WIDTH, 12);

    ctx.fillStyle = '#1a1731';
    ctx.beginPath();
    ctx.moveTo(0, 134);
    ctx.lineTo(48, 110);
    ctx.lineTo(120, 120);
    ctx.lineTo(196, 94);
    ctx.lineTo(276, 124);
    ctx.lineTo(340, 102);
    ctx.lineTo(420, 118);
    ctx.lineTo(480, 112);
    ctx.lineTo(480, 320);
    ctx.lineTo(0, 320);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#21263a';
    ctx.fillRect(0, 176, C.CANVAS_WIDTH, 144);
    ctx.fillStyle = '#1a1d2b';
    ctx.beginPath();
    ctx.moveTo(92, 320);
    ctx.lineTo(186, 182);
    ctx.lineTo(294, 182);
    ctx.lineTo(388, 320);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e7c87a';
    for (var mark = 0; mark < 5; mark++) {
      var markY = 258 - mark * 26 + (turnCount % 2);
      var markW = 6 + mark * 5;
      ctx.fillRect(240 - Math.floor(markW / 2), markY, markW, 8);
    }

    ctx.fillStyle = '#12182b';
    for (var b = 0; b < 7; b++) {
      var bx = 20 + b * 64;
      var bh = 18 + ((b * 11) % 34);
      ctx.fillRect(bx, 132 - bh, 22, bh);
      ctx.fillStyle = '#ffcf82';
      ctx.fillRect(bx + 4, 136 - bh, 4, 4);
      ctx.fillRect(bx + 12, 141 - bh, 4, 4);
      ctx.fillStyle = '#12182b';
    }

    ctx.fillStyle = '#0e1220';
    for (var pole = 0; pole < 4; pole++) {
      var px = 48 + pole * 118;
      ctx.fillRect(px, 126, 4, 58);
      ctx.fillRect(px - 6, 132, 18, 3);
      ctx.fillRect(px + 9, 136, 1, 18);
    }

    ctx.fillStyle = 'rgba(255,214,157,0.10)';
    for (var s = 0; s < 12; s++) {
      ctx.fillRect((s * 41 + turnCount * 2) % C.CANVAS_WIDTH, 20 + (s * 9 % 46), 2, 2);
    }
  }

  function drawWoodlandBackdrop(R, ctx, C) {
    ctx.fillStyle = '#081516';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    ctx.fillStyle = '#133232';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, 96);
    ctx.fillStyle = '#2c5d4b';
    ctx.fillRect(0, 96, C.CANVAS_WIDTH, 20);

    ctx.fillStyle = '#0b201f';
    ctx.beginPath();
    ctx.moveTo(0, 126);
    ctx.lineTo(62, 106);
    ctx.lineTo(118, 112);
    ctx.lineTo(184, 94);
    ctx.lineTo(258, 118);
    ctx.lineTo(318, 100);
    ctx.lineTo(400, 120);
    ctx.lineTo(480, 108);
    ctx.lineTo(480, 320);
    ctx.lineTo(0, 320);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#112625';
    ctx.fillRect(0, 170, C.CANVAS_WIDTH, 150);
    ctx.fillStyle = '#173533';
    for (var trunk = 0; trunk < 10; trunk++) {
      var tx = 14 + trunk * 48 + ((trunk % 2) * 10);
      var th = 60 + (trunk * 7 % 24);
      ctx.fillRect(tx, 122, 7, th);
      ctx.fillRect(tx - 9, 128, 24, 12);
      ctx.fillRect(tx - 14, 140, 34, 16);
    }

    ctx.fillStyle = 'rgba(205,255,240,0.07)';
    for (var mist = 0; mist < 6; mist++) {
      var mx = ((mist * 78) + turnCount * (mist % 2 === 0 ? 1 : -1)) % (C.CANVAS_WIDTH + 70);
      if (mx < -70) mx += C.CANVAS_WIDTH + 70;
      ctx.fillRect(mx - 35, 152 + mist * 16, 110, 8);
    }

    ctx.fillStyle = '#93d9b3';
    for (var mote = 0; mote < 16; mote++) {
      ctx.fillRect((mote * 29 + turnCount * 2) % C.CANVAS_WIDTH, 26 + (mote * 17 % 74), 2, 2);
    }

    ctx.fillStyle = '#5c7d65';
    for (var grass = 0; grass < 20; grass++) {
      var gx = grass * 24;
      var gh = 8 + (grass * 5 % 10);
      ctx.fillRect(gx, 188 - gh, 2, gh);
      ctx.fillRect(gx + 3, 188 - Math.max(4, gh - 2), 2, Math.max(4, gh - 2));
    }
  }

  function drawWetlandBackdrop(R, ctx, C) {
    ctx.fillStyle = '#081425';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    ctx.fillStyle = '#16314f';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, 88);
    ctx.fillStyle = '#335f73';
    ctx.fillRect(0, 88, C.CANVAS_WIDTH, 22);

    ctx.fillStyle = '#0d2034';
    ctx.beginPath();
    ctx.moveTo(0, 132);
    ctx.lineTo(54, 110);
    ctx.lineTo(120, 124);
    ctx.lineTo(174, 102);
    ctx.lineTo(250, 118);
    ctx.lineTo(322, 96);
    ctx.lineTo(390, 120);
    ctx.lineTo(480, 108);
    ctx.lineTo(480, 320);
    ctx.lineTo(0, 320);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#132e40';
    ctx.fillRect(0, 168, C.CANVAS_WIDTH, 152);
    ctx.fillStyle = 'rgba(130,202,230,0.12)';
    for (var ripple = 0; ripple < 5; ripple++) {
      ctx.fillRect(0, 182 + ripple * 20 + (turnCount % 3), C.CANVAS_WIDTH, 3);
    }

    ctx.fillStyle = '#415c5f';
    for (var reed = 0; reed < 22; reed++) {
      var rx = 6 + reed * 21;
      var rh = 16 + (reed * 9 % 22);
      ctx.fillRect(rx, 188 - rh, 2, rh);
      ctx.fillRect(rx + 4, 190 - Math.max(8, rh - 6), 2, Math.max(8, rh - 6));
    }

    ctx.fillStyle = '#96b8c9';
    for (var glow = 0; glow < 14; glow++) {
      ctx.fillRect((glow * 37 + turnCount) % C.CANVAS_WIDTH, 36 + (glow * 19 % 64), 2, 2);
    }

    ctx.fillStyle = 'rgba(240,250,255,0.06)';
    for (var fog = 0; fog < 7; fog++) {
      var fx = ((fog * 66) - turnCount * 2) % (C.CANVAS_WIDTH + 90);
      if (fx < -90) fx += C.CANVAS_WIDTH + 90;
      ctx.fillRect(fx - 28, 140 + fog * 13, 90, 7);
    }
  }

  function drawBossRitualBackdrop(R, ctx, C) {
    ctx.fillStyle = '#100f1e';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    ctx.fillStyle = '#211838';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, 90);
    ctx.fillStyle = '#7f5a2f';
    ctx.fillRect(0, 90, C.CANVAS_WIDTH, 12);

    ctx.fillStyle = '#0c1224';
    ctx.fillRect(0, 160, C.CANVAS_WIDTH, 160);
    ctx.strokeStyle = 'rgba(255,214,107,0.26)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(240, 130, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(240, 130, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(196, 86, 88, 88);
    ctx.strokeRect(212, 102, 56, 56);

    ctx.fillStyle = '#1a1328';
    ctx.fillRect(70, 84, 10, 98);
    ctx.fillRect(400, 84, 10, 98);
    ctx.fillRect(52, 98, 46, 6);
    ctx.fillRect(382, 98, 46, 6);

    ctx.fillStyle = 'rgba(255,214,107,0.08)';
    for (var line = 0; line < 6; line++) {
      ctx.fillRect(0, 154 + line * 18, C.CANVAS_WIDTH, 1);
    }

    ctx.fillStyle = '#ffd66b';
    for (var mote = 0; mote < 18; mote++) {
      var mx = (mote * 26 + turnCount * 2) % C.CANVAS_WIDTH;
      var my = 30 + (mote * 17 % 108);
      ctx.fillRect(mx, my, 2, 2);
    }
  }

  function drawBossOmenBackdrop(R, ctx, C) {
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    ctx.fillStyle = '#10172b';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, 86);
    ctx.fillStyle = '#3c1222';
    ctx.fillRect(0, 86, C.CANVAS_WIDTH, 10);

    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 158, C.CANVAS_WIDTH, 162);
    ctx.fillStyle = '#12192d';
    for (var block = 0; block < 9; block++) {
      var bx = 14 + block * 50;
      var bh = 18 + ((block * 13) % 52);
      ctx.fillRect(bx, 150 - bh, 28, bh);
    }

    ctx.fillStyle = '#ad3148';
    ctx.fillRect(236, 34, 8, 174);
    ctx.fillStyle = 'rgba(173,49,72,0.18)';
    ctx.fillRect(224, 34, 32, 174);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (var glitch = 0; glitch < 12; glitch++) {
      var gy = 48 + glitch * 18;
      var gw = 24 + (glitch * 11 % 64);
      ctx.fillRect((glitch * 39 + turnCount * 5) % C.CANVAS_WIDTH, gy, gw, 2);
    }

    ctx.fillStyle = '#5e7186';
    for (var shard = 0; shard < 16; shard++) {
      var sx = (shard * 31 + turnCount * 3) % C.CANVAS_WIDTH;
      var sy = 18 + (shard * 13 % 92);
      ctx.fillRect(sx, sy, 2, 6);
      ctx.fillRect(sx - 2, sy + 6, 6, 2);
    }
  }

  function drawBattleBackdrop(R, ctx, C) {
    var backdropId = getBattleBackdropId();
    if (backdropId === 'field_woodland') {
      drawWoodlandBackdrop(R, ctx, C);
    } else if (backdropId === 'field_wetland') {
      drawWetlandBackdrop(R, ctx, C);
    } else if (backdropId === 'boss_ritual') {
      drawBossRitualBackdrop(R, ctx, C);
    } else if (backdropId === 'boss_omen') {
      drawBossOmenBackdrop(R, ctx, C);
    } else {
      drawRoadsideBackdrop(R, ctx, C);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (var gy = 60; gy < C.CANVAS_HEIGHT; gy += 32) {
      ctx.fillRect(0, gy, C.CANVAS_WIDTH, 1);
    }
    for (var gx = 0; gx < C.CANVAS_WIDTH; gx += 32) {
      ctx.fillRect(gx, 60, 1, C.CANVAS_HEIGHT - 60);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, 176, C.CANVAS_WIDTH, 16);
  }

  function initAtmosphere() {
    var bg = getBattleBackdropId();
    atmosParticles = [];
    if (bg === 'field_roadside') {
      for(var i=0; i<40; i++) {
        atmosParticles.push({
          x: Math.random() * Game.Config.CANVAS_WIDTH,
          y: Math.random() * Game.Config.CANVAS_HEIGHT,
          vx: -(6 + Math.random() * 8),
          vy: Math.random() * 0.5 - 0.25,
          life: Math.random() * 100
        });
      }
    } else if (bg === 'field_woodland') {
      for(var i=0; i<60; i++) {
        atmosParticles.push({
          x: Math.random() * Game.Config.CANVAS_WIDTH,
          y: Math.random() * Game.Config.CANVAS_HEIGHT,
          vx: -1,
          vy: 8 + Math.random() * 6,
          length: 6 + Math.random() * 6
        });
      }
    } else if (bg === 'field_wetland') {
      for(var i=0; i<35; i++) {
        atmosParticles.push({
          x: Math.random() * Game.Config.CANVAS_WIDTH,
          y: Game.Config.CANVAS_HEIGHT + Math.random() * 100,
          vx: Math.random() * 0.6 - 0.3,
          vy: -(0.5 + Math.random() * 1.5),
          size: 2 + Math.random() * 4,
          life: 100 + Math.random() * 120
        });
      }
    }
  }

  function drawForegroundAtmosphere(R, ctx, C) {
    if (phase === 'none' || !active) return;
    var bg = getBattleBackdropId();
    if (bg === 'field_roadside') {
      ctx.fillStyle = 'rgba(210,190,150,0.15)';
      for(var i=0; i<atmosParticles.length; i++) {
        var p = atmosParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.x < -20 || p.life <= 0) {
          p.x = C.CANVAS_WIDTH + 20;
          p.y = Math.random() * C.CANVAS_HEIGHT;
          p.life = 50 + Math.random() * 50;
        }
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 8 + Math.random() * 12, 1);
      }
    } else if (bg === 'field_woodland') {
      ctx.fillStyle = 'rgba(150, 180, 220, 0.15)';
      ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
      ctx.fillStyle = 'rgba(200, 220, 255, 0.5)';
      for(var i=0; i<atmosParticles.length; i++) {
        var p = atmosParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > C.CANVAS_HEIGHT) {
          p.y = -p.length;
          p.x = Math.random() * C.CANVAS_WIDTH;
        }
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, p.length);
      }
    } else if (bg === 'field_wetland') {
      ctx.fillStyle = 'rgba(100, 130, 150, 0.1)';
      ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
      for(var i=0; i<atmosParticles.length; i++) {
        var p = atmosParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.y < 0 || p.life <= 0) {
          p.x = Math.random() * C.CANVAS_WIDTH;
          p.y = C.CANVAS_HEIGHT + 20;
          p.life = 100 + Math.random() * 120;
        }
        var alpha = Math.max(0, p.life / 220) * 0.3;
        ctx.fillStyle = 'rgba(220, 240, 255, ' + alpha + ')';
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      }
    } else if (bg === 'boss_ritual' || bg === 'boss_omen') {
      // Assuming atmosNoiseOffset is defined elsewhere or needs to be defined.
      // For now, let's assume it's a global variable.
      // atmosNoiseOffset++;
      ctx.fillStyle = 'rgba(15, 5, 20, 0.3)';
      ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for(var i=0; i<40; i++) {
        var nx = Math.random() * C.CANVAS_WIDTH;
        var ny = Math.random() * C.CANVAS_HEIGHT;
        var nw = 10 + Math.random() * 80;
        var nh = 1 + Math.random() * 2;
        ctx.fillRect(Math.floor(nx), Math.floor(ny), nw, nh);
      }
      ctx.fillStyle = 'rgba(255, 0, 0, 0.02)';
      if (Math.random() > 0.7) {
        ctx.fillRect(0, Math.random() * C.CANVAS_HEIGHT, C.CANVAS_WIDTH, 10 + Math.random() * 30);
      }
    }
  }

  function drawBattleIntroOverlay(R, ctx, C) {
    if (phase !== 'intro' || introMaxTimer <= 0) return;
    var progress = 1 - (introTimer / introMaxTimer);
    var eased = progress < 0.5 ? progress * 2 : 1 - (progress - 0.5) * 0.55;
    var bandWidth = Math.floor(180 + eased * 180);
    var leftX = -bandWidth + Math.floor(progress * (120 + bandWidth));
    var rightX = C.CANVAS_WIDTH - Math.floor(progress * (120 + bandWidth));

    ctx.fillStyle = 'rgba(5,8,20,0.62)';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    ctx.fillStyle = '#060a17';
    ctx.fillRect(leftX, 86, bandWidth, 30);
    ctx.fillRect(rightX, 140, bandWidth, 30);
    ctx.fillStyle = introAccent;
    ctx.fillRect(leftX + 10, 91, Math.max(40, bandWidth - 20), 2);
    ctx.fillRect(rightX + 10, 145, Math.max(40, bandWidth - 20), 2);

    var flashAlpha = Math.max(0, 0.4 - progress * 0.35);
    if (flashAlpha > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + flashAlpha.toFixed(3) + ')';
      ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    }

    R.drawTextJP(introLabel, 240, 96, introAccent, 15, 'center');
    R.drawTextJP(introSubLabel, 240, 146, '#ffffff', isGroupBattle() ? 12 : 15, 'center');
    R.drawTextJP('境界がきしむ', 240, 120, '#a9b5d9', 9, 'center');
  }

  function getStateSnapshot() {
    if (!active || !enemy) return null;
    return {
      phase: phase,
      backdropId: getBattleBackdropId(),
      message: message,
      targetIndex: currentTargetIndex,
      enemy: {
        name: enemy.name,
        hp: Math.max(0, enemy.hp),
        maxHp: enemy.maxHp
      },
      enemies: enemyParty.map(function(foe, index) {
        return {
          index: index,
          name: foe.name,
          hp: Math.max(0, foe.hp),
          maxHp: foe.maxHp,
          active: index === currentTargetIndex
        };
      }),
      menuEntries: getMenuEntries().map(function(entry) { return entry.label; }),
      ritual: ritualRuntime ? {
        mode: ritualRuntime.ritualMode,
        gauge: ritualRuntime.ritualGauge,
        targetZone: ritualRuntime.ritualTargetZone,
        hintState: ritualRuntime.ritualHintState,
        slots: ritualRuntime.ritualSlots,
        state: ritualRuntime.ritualState
      } : null,
      rewardSummary: rewardSummary
    };
  }

  function draw() {
    if (!active) return;

    var R = Game.Renderer;
    var C = Game.Config;
    var ctx = R.getContext();

    drawBattleBackdrop(R, ctx, C);

    R.drawDialogBox(10, 8, 112, 18);
    drawBattlePanelAccent(R, 10, 8, 112, 18, isSpecialRitualBattle() ? '#ffd66b' : '#8fb8ff');
    if (isSpecialRitualBattle()) {
      R.drawTextJP('儀式戦', 20, 12, '#ffd66b', 10);
    } else if (isGroupBattle()) {
      R.drawTextJP('群れ遭遇 ' + getLivingEnemies().length + '体', 20, 12, '#8fe0ff', 10);
    } else {
      R.drawTextJP('通常戦闘', 20, 12, '#8fe0ff', 10);
    }

    // Enemy
    if (enemy) {
      if (isGroupBattle()) {
        drawEnemyPartyGroup(R, ctx, C);
      } else {
      var ex = 200 + (shakeX > 0 ? (Math.random() - 0.5) * shakeX : 0);
      // Boss enrage: tint palette red
      var pal = enemy.palette;
      if (bossEnraged) {
        pal = {};
        for (var pk in enemy.palette) {
          pal[pk] = enemy.palette[pk];
        }
        // Shift color 1 to reddish when enraged
        pal[1] = '#882222';
      }
      R.drawSpriteAbsolute(enemy.sprite, ex, 30, pal, 5);

      // Enrage text
      if (enrageTimer > 0) {
        enrageTimer--;
        R.drawTextJP('怒り状態！', 220, 20, '#ff4444', 14);
      }

      if (ritualRuntime && ritualRuntime.ritualMode === 'untangle') {
        drawTensionGauge(R, ritualRuntime);
      } else {
        R.drawRectAbsolute(160, 120, 160, 12, '#333');
        var enemyDisplayHp = Math.max(0, enemy.hp);
        var hpRatio = enemyDisplayHp / enemy.maxHp;
        if (ritualRuntime && ritualRuntime.ritualMode === 'repair_eye' && ritualRuntime.ritualState.hpZeroReached) {
          hpRatio = 0;
        }
        R.drawRectAbsolute(161, 121, 158 * hpRatio, 10,
          hpRatio > 0.3 ? C.COLORS.HP_GREEN : C.COLORS.HP_RED);
        R.drawTextJP(enemy.name + ' HP:' + enemyDisplayHp + '/' + enemy.maxHp, 160, 135, '#fff', 12);
      }
      if (ritualRuntime && ritualRuntime.ritualMode === 'temperature') {
        drawTemperatureGauge(R, ritualRuntime);
      }
      if (ritualRuntime && ritualRuntime.ritualMode === 'repair_eye') {
        drawRitualEyeSlot(R, ritualRuntime, ex);
      }

      // Enemy status effect icons
      var esx = 160;
      for (var ei = 0; ei < enemyEffects.length; ei++) {
        var eLabel = '';
        var eCol = '#fff';
        switch (enemyEffects[ei].type) {
          case 'burn': eLabel = '炎'; eCol = '#ff4422'; break;
          case 'stun': eLabel = '痺'; eCol = '#ffdd22'; break;
        }
        if (eLabel) {
          R.drawRectAbsolute(esx, 148, 16, 14, 'rgba(0,0,0,0.6)');
          R.drawTextJP(eLabel, esx + 1, 149, eCol, 10);
          esx += 18;
        }
      }
      }
    }

    // Combo text display
    if (comboTimer > 0) {
      comboTimer--;
      var comboCol = comboMultiplier >= 2.0 ? '#ff44ff' : '#ffdd44';
      R.drawTextJP(comboText, 180, 155, comboCol, 16);
    }

    drawForegroundAtmosphere(R, ctx, C);

    // Player stats
    var pd = Game.Player.getData();
    R.drawDialogBox(10, 200, 200, 60);
    drawBattlePanelAccent(R, 10, 200, 200, 60, '#8fe0ff');
    R.drawTextJP('旅人', 22, 204, '#8fe0ff', 10);
    R.drawTextJP('HP: ' + pd.hp + '/' + pd.maxHp, 25, 210, '#fff', 14);

    R.drawRectAbsolute(25, 230, 170, 10, '#333');
    var playerHpRatio = pd.hp / pd.maxHp;
    R.drawRectAbsolute(26, 231, 168 * playerHpRatio, 8,
      playerHpRatio > 0.3 ? C.COLORS.HP_GREEN : C.COLORS.HP_RED);

    // Player status effect icons
    var psx = 25;
    for (var pi = 0; pi < playerEffects.length; pi++) {
      var pLabel = '';
      var pCol = '#fff';
      switch (playerEffects[pi].type) {
        case 'attack_up': pLabel = '攻↑'; pCol = '#ff6644'; break;
        case 'defense_up': pLabel = '防↑'; pCol = '#4488ff'; break;
        case 'onsen_heal': pLabel = '湯'; pCol = '#44dd44'; break;
        case 'heal_seal': pLabel = '封'; pCol = '#aa44aa'; break;
        case 'slow': pLabel = '遅'; pCol = '#8888aa'; break;
        case 'dice_bonus': pLabel = '賽'; pCol = '#44aaff'; break;
      }
      if (pLabel) {
        R.drawRectAbsolute(psx, 242, 20, 14, 'rgba(0,0,0,0.6)');
        R.drawTextJP(pLabel, psx + 1, 243, pCol, 9);
        psx += 22;
      }
    }

    var partyMembers = Game.Player.getPartyMembers ? Game.Player.getPartyMembers() : [];
    if (partyMembers.length > 0) {
      R.drawDialogBox(10, 150, 138, 44);
      drawBattlePanelAccent(R, 10, 150, 138, 44, '#8fe0ff');
      R.drawTextJP('同行支援', 20, 158, '#8fe0ff', 10);
      for (var pmi = 0; pmi < Math.min(3, partyMembers.length); pmi++) {
        var member = partyMembers[pmi];
        R.drawRectAbsolute(20 + pmi * 42, 172, 4, 4, member.color || '#dce6ff');
        R.drawTextJP(member.name, 20 + pmi * 42, 172, member.color || '#dce6ff', 9);
      }
    }

    // Dice display
    if (phase === 'diceRoll' || phase === 'diceResult') {
      var diceCount = battleDice.length;
      R.drawDialogBox(220, 150, 250, 80);
      drawBattlePanelAccent(R, 220, 150, 250, 80, '#d0b46c');
      R.drawTextJP('サイコロ', 232, 154, '#d0b46c', 10);

      var dieSize = 44;
      if (diceCount > 2) dieSize = 38;
      if (diceCount > 3) dieSize = 34;
      if (diceCount > 4) dieSize = 28;

      var totalWidth = diceCount * dieSize + (diceCount - 1) * 6;
      var startX = 220 + Math.floor((250 - totalWidth) / 2);
      var dieY = 150 + Math.floor((80 - dieSize) / 2) - 3;

      for (var i = 0; i < diceCount; i++) {
        var dx = startX + i * (dieSize + 6);
        var isFlashing = (diceFlashTimer > 0 && i === currentDice - 1);
        drawDie(R, ctx, dx, dieY, battleDice[i], diceValues[i], dieSize, diceStopped[i], isFlashing);

        // Active indicator
        if (!diceStopped[i] && i === currentDice && phase === 'diceRoll') {
          R.drawTextJP('▲', dx + Math.floor(dieSize / 2) - 5, dieY + dieSize + 8, C.COLORS.GOLD, 10);
        }
      }
      if (phase === 'diceRoll') {
        if (canCancelDiceRoll()) {
          R.drawTextJP('X / Escで戻る', 332, 216, '#8b96b6', 10);
        } else if (battleDice.length > 1) {
          R.drawTextJP('1個でも止めると戻れない', 292, 216, '#886d6d', 10);
        }
      }
    }

    // Boss gimmick description (shown briefly)
    if (gimmickMessageTimer > 0) {
      gimmickMessageTimer--;
      R.drawRectAbsolute(40, 165, 400, 20, 'rgba(80,20,20,0.85)');
      R.drawTextJP(gimmickMessage, 50, 168, '#ff8866', 12);
    }

    // Boss dialogue overlay (phase change / special move / victory lines)
    if (dialogueTimer > 0 && dialogueText) {
      R.drawRectAbsolute(20, 125, 440, 36, 'rgba(10,10,30,0.92)');
      if (dialogueSpeaker) {
        R.drawTextJP(dialogueSpeaker, 30, 128, '#ffcc44', 11);
      }
      R.drawTextJP(dialogueText, 30, 143, '#ffffff', 13);
    }

    // Menu
    if (phase === 'menu' && messageTimer <= 0) {
      var currentMenuEntries = getMenuEntries();
      var menuHeight = Math.max(80, 18 + currentMenuEntries.length * 22);
      R.drawDialogBox(300, 200, 160, menuHeight);
      drawBattlePanelAccent(R, 300, 200, 160, menuHeight, '#ffd66b');
      R.drawTextJP('行動', 314, 204, '#ffd66b', 10);
      for (var i = 0; i < currentMenuEntries.length; i++) {
        var sealed = (sealedCommand >= 0 && i === sealedCommand);
        var color = sealed ? '#555' : (i === menuIndex) ? C.COLORS.GOLD : '#fff';
        var prefix = (i === menuIndex) ? '▶ ' : '  ';
        var baseLabel = currentMenuEntries[i].label;
        var label = sealed ? baseLabel + '×' : baseLabel;
        if (i === menuIndex) {
          R.drawRectAbsolute(312, 214 + i * 22, 134, 16, 'rgba(255,204,0,0.12)');
        }
        R.drawTextJP(prefix + label, 315, 212 + i * 22, color, 14);
      }
    }

    if (phase === 'itemMenu' && messageTimer <= 0) {
      R.drawDialogBox(280, 184, 180, 96);
      drawBattlePanelAccent(R, 280, 184, 180, 96, '#8fe0ff');
      R.drawTextJP('もちもの', 292, 188, '#8fe0ff', 10);
      for (var ii = 0; ii < itemMenuItems.length; ii++) {
        var selected = (ii === itemMenuIndex);
        var itemName = itemMenuItems[ii].item.name;
        var prefix2 = selected ? '▶ ' : '  ';
        var col2 = selected ? C.COLORS.GOLD : '#fff';
        if (selected) {
          R.drawRectAbsolute(290, 196 + ii * 18, 148, 14, 'rgba(143,224,255,0.1)');
        }
        R.drawTextJP(prefix2 + itemName, 292, 194 + ii * 18, col2, 12);
      }
      if (itemMenuItems[itemMenuIndex]) {
        R.drawTextJP('HP+' + itemMenuItems[itemMenuIndex].item.healAmount, 292, 252, '#88dd88', 11);
        R.drawTextJP('Xで戻る', 392, 252, '#888', 10);
      }
    }

    if (phase === 'reward' && rewardSummary) {
      var currentExp = Game.Player.getData().experience || 0;
      var nextExp = currentExp + (rewardSummary.exp || 0);
      var currentRank = Game.Player.getJourneyRank ? Game.Player.getJourneyRank() : 1;
      var nextRank = 1 + Math.floor(nextExp / 80);
      var rewardItems = getRewardItemLabels(rewardSummary.items || []);
      var supportLogs = rewardSummary.supportLogs || [];
      var afterglowLines = rewardSummary.afterglowText ? wrapBattleText(rewardSummary.afterglowText, 24, 2) : [];
      var rewardItemLines = wrapBattleText(rewardItems.length ? rewardItems.join(' / ') : 'なし', 22, 2);
      var panelH = 140 + (afterglowLines.length ? 28 + afterglowLines.length * 12 : 0) + (supportLogs.length ? 18 + supportLogs.length * 12 : 0);

      R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, 'rgba(8, 10, 18, 0.56)');
      R.drawDialogBox(92, 74, 296, panelH);
      drawBattlePanelAccent(R, 92, 74, 296, panelH, '#ffd66b');
      R.drawTextJP('戦果', 106, 90, '#ffd66b', 12);
      R.drawTextJP('獲得金', 106, 110, '#8fe0ff', 11);
      R.drawTextJP('+' + (rewardSummary.gold || 0) + 'G', 196, 110, '#ffffff', 12);
      R.drawTextJP('旅の経験', 106, 128, '#8fe0ff', 11);
      R.drawTextJP('+' + (rewardSummary.exp || 0), 196, 128, '#ffffff', 12);
      R.drawTextJP('累計経験', 106, 146, '#8fe0ff', 11);
      R.drawTextJP(currentExp + ' → ' + nextExp, 196, 146, '#ffffff', 12);
      if (nextRank > currentRank) {
        R.drawTextJP('旅路ランク ' + currentRank + ' → ' + nextRank, 106, 164, '#ffd66b', 11);
      } else {
        R.drawTextJP('旅路ランク ' + currentRank, 106, 164, '#d8dce8', 11);
      }
      R.drawTextJP('戦利品', 106, 182, '#8fe0ff', 11);
      for (var ri = 0; ri < rewardItemLines.length; ri++) {
        R.drawTextJP(rewardItemLines[ri], 170, 182 + ri * 12, '#ffffff', 11);
      }

      var rewardY = 182 + rewardItemLines.length * 12 + 8;
      if (afterglowLines.length) {
        R.drawTextJP('余韻', 106, rewardY, '#ffd66b', 11);
        for (var ai = 0; ai < afterglowLines.length; ai++) {
          R.drawTextJP(afterglowLines[ai], 142, rewardY + ai * 12, '#f4eed7', 10);
        }
        rewardY += afterglowLines.length * 12 + 18;
      }

      if (supportLogs.length) {
        R.drawTextJP('同行支援', 106, rewardY, '#8fe0ff', 11);
        for (var si = 0; si < Math.min(3, supportLogs.length); si++) {
          R.drawTextJP(supportLogs[si].text, 106, rewardY + 12 + si * 12, supportLogs[si].color || '#dce6ff', 10);
        }
        rewardY += 18 + Math.min(3, supportLogs.length) * 12;
      }

      R.drawTextJP('Z / Enter で進む', 244, 74 + panelH - 18, '#b7bfd8', 10);
    }

    // Dice loadout indicator
    var equipped = Game.Player.getEquippedDice();
    if (equipped.length > 0) {
      for (var i = 0; i < equipped.length; i++) {
        var di = Game.Items.get(equipped[i]);
        if (di) {
          var boxX = 10 + i * 14;
          R.drawRectAbsolute(boxX, 268, 12, 12, di.color || '#fff');
          ctx.strokeStyle = '#555';
          ctx.lineWidth = 1;
          ctx.strokeRect(boxX, 268, 12, 12);
        }
      }
    }

    // Message
    if (message) {
      R.drawDialogBox(10, 278, 460, 39);
      drawBattlePanelAccent(R, 10, 278, 460, 39, isSpecialRitualBattle() ? '#ffd66b' : '#8fb8ff');
      R.drawTextJP(isSpecialRitualBattle() ? '儀式の声' : '戦況', 20, 286, isSpecialRitualBattle() ? '#ffd66b' : '#8fb8ff', 10);
      R.drawTextJP(message, 20, 295, '#fff', 13);
    }

    if (ritualRuntime && ritualRuntime.uiFlags && ritualRuntime.uiFlags.failureOverlay) {
      R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, 'rgba(20, 10, 18, 0.38)');
      R.drawTextJP(
        (ritualRuntime.ritualFailStyle && ritualRuntime.ritualFailStyle.text) || '理解が届かなかった…',
        120, 92, '#f2d8d8', 14
      );
    }

    drawBattleIntroOverlay(R, ctx, C);
  }

  function isActive() { return active; }


  function resolveDiceResults() {
            // All dice stopped — calculate results
            var damageTotal = 0;
            healTotal = 0;
            for (var j = 0; j < diceResults.length; j++) {
              var parsed = parseFace(diceResults[j]);
              if (parsed.type === 'damage') {
                damageTotal += parsed.value;
              } else if (parsed.type === 'heal') {
                healTotal += parsed.value;
              }
            }

            // Combo detection
            var combo = detectCombo(diceResults);
            comboMultiplier = combo.mult;
            comboText = combo.text;
            comboTimer = combo.text ? 60 : 0;

            var ritualDefinition = getRitualDefinition();
            var ritualDiceValues = getDiceResultValues();
            var ritualAudioBefore = getRitualAudioSnapshot();

            // Apply status effect bonuses
            var atkBonus = getEffectBonus(playerEffects, 'attack_up');
            var enemyDefReduction = hasEffect(enemyEffects, 'stun') ? Math.floor(enemy.defense / 2) : 0;

            phase = 'diceResult';
            animTimer = 30;

            // Apply damage with combo multiplier
            var baseDmg = damageTotal + Game.Player.getAttack() + atkBonus - (enemy.defense - enemyDefReduction);
            var dmg = Math.max(0, Math.floor(baseDmg * comboMultiplier));
            if (damageTotal > 0 && dmg < 1) dmg = 1;
            var actionResult = {
              damage: dmg,
              heal: healTotal,
              projectedEnemyHp: Math.max(0, enemy.hp - dmg)
            };

            if (ritualDefinition && ritualDefinition.onDiceResolved) {
              ritualDefinition.onDiceResolved(ritualRuntime, enemy, Game.Player.getData(), ritualDiceValues);
            }
            if (ritualDefinition && ritualDefinition.onActionResolved) {
              ritualDefinition.onActionResolved(ritualRuntime, enemy, Game.Player.getData(), { id: 'attack' }, actionResult);
            }

            dmg = Math.max(0, Math.floor(actionResult.damage || 0));
            if (dmg > 0) {
              enemy.hp -= dmg;
              shakeX = 4 + battleDice.length;
              if (Game.Particles) Game.Particles.emit('damage', 280, 60, { count: 8 });
            }
            playPlayerAttackSfx(dmg, damageTotal, didRitualStateAdvance(ritualAudioBefore));

            // Apply healing (including onsen_heal effect)
            // ── Boss gimmick: heal inversion (kumako_steam) ──
            var healInverted = false;
            if (currentGimmick && currentGimmick.passive && currentGimmick.passive.id === 'heal_inversion') {
              healInverted = true;
            }
            if (hasEffect(playerEffects, 'heal_seal')) {
              healInverted = true;
            }

            var onsenHeal = getEffectBonus(playerEffects, 'onsen_heal');
            if (healTotal > 0 || onsenHeal > 0) {
              if (healInverted) {
                // Healing becomes self-damage
                var invertDmg = healTotal + onsenHeal;
                var playerDataHI = Game.Player.getData();
                playerDataHI.hp -= invertDmg;
                message += ' 回復反転！' + invertDmg + 'ダメージ！';
                Game.Audio.playSfx('damage');
                if (Game.Particles) Game.Particles.emit('damage', 100, 220, { count: 6 });
                if (playerDataHI.hp <= 0) {
                  playerDataHI.hp = 0;
                  phase = 'defeat';
                  message = '力尽きた...';
                  messageTimer = 90;
                  Game.Audio.stopBgm();
                  Game.Audio.playSfx('gameover');
                }
              } else {
                Game.Player.heal(healTotal + onsenHeal);
                if (Game.Particles) Game.Particles.emit('heal', 100, 210, { count: 5 });
              }
            }

            // Trigger status effects from dice types
            for (var d = 0; d < battleDice.length; d++) {
              if (!diceResults[d]) continue;
              var dp = parseFace(diceResults[d]);
              var diceId = battleDice[d].id || '';
              if (diceId === 'fireDice' && dp.type === 'damage' && dp.value >= 7) {
                addEffect(enemyEffects, 'burn', 3, 5);
              }
              if (diceId === 'onsenDice' && dp.type === 'heal') {
                addEffect(playerEffects, 'onsen_heal', 2, 3);
              }
              if (diceId === 'konnyakuDice' && dp.type === 'damage' && dp.value >= 10) {
                addEffect(enemyEffects, 'stun', 1, 0);
              }
              if (diceId === 'gunmaDice' && dp.type === 'damage' && dp.value >= 10) {
                addEffect(playerEffects, 'attack_up', 2, 5);
                if (Game.Particles) Game.Particles.emit('thunder', 240, 100, { count: 12 });
              }
              if (diceId === 'cabbageDice' && dp.type === 'damage' && dp.value >= 15) {
                addEffect(playerEffects, 'defense_up', 2, 5);
              }
            }

            // Apply burn damage to enemy
            var burnEff = hasEffect(enemyEffects, 'burn');
            if (burnEff) {
              enemy.hp -= burnEff.value;
              dmg += burnEff.value;
            }

            // Build message
            var msgParts = [];
            if (damageTotal > 0) {
              msgParts.push(dmg + 'ダメージ');
            }
            if (healTotal > 0) {
              msgParts.push('HP' + healTotal + '回復');
            }
            if (comboText) {
              msgParts.push(comboText);
            }
            if (msgParts.length === 0) {
              message = 'ミス！何も起きなかった...';
            } else {
              message = msgParts.join('！ ') + '！';
            }

            if (ritualRuntime && ritualRuntime.ritualMode === 'repair_eye' && ritualRuntime.ritualState.hpZeroReached && !ritualRuntime.ritualState.eyeRepaired) {
              message = '空っぽの目が、こちらを見ている。';
            } else if (ritualRuntime && ritualRuntime.ritualMode === 'untangle') {
              message += ' 絡まり:' + ritualRuntime.ritualGauge;
            } else if (ritualRuntime && ritualRuntime.ritualMode === 'temperature') {
              message += ' 温度:' + ritualRuntime.ritualGauge;
            }

            var ritualOutcome = evaluateRitualOutcome();
            if (ritualOutcome) {
              break;
            }

            // Boss enrage check (HP > 100 and below 50%)
            if (!bossEnraged && enemy.maxHp > 100 && enemy.hp > 0 && enemy.hp <= enemy.maxHp / 2) {
              bossEnraged = true;
              enrageTimer = 60;
              enemy.attack = Math.floor(enemy.attack * 1.2);
              message += ' 怒り状態！';
            }

            // ── Boss gimmick: phase change ──
            if (currentGimmick && currentGimmick.phase_change && !phaseChanged && enemy.hp > 0) {
              if (currentGimmick.phase_change.condition(enemy)) {
                phaseChanged = true;
                var pcMsg = currentGimmick.phase_change.action(enemy);
                if (pcMsg) {
                  message += ' ' + pcMsg;
                }
                // Play phase_change SFX and queue dialogue
                playBossSfx('phase_change');
                if (currentGimmick.dialogue && currentGimmick.dialogue.phase_change) {
                  queueDialogue(currentGimmick.dialogue.phase_change);
                }
                shakeX = 10;
                if (Game.Particles) Game.Particles.emit('damage', 280, 60, { count: 15 });
              }
            }

            // ── Boss gimmick: satoTest mercy (HP won't drop below 1) ──
            if (currentGimmick && currentGimmick.passive && currentGimmick.passive.id === 'mentor_mercy') {
              if (enemy.hp <= 0) {
                enemy.hp = 1;
              }
            }

            var ritualVictory = ritualDefinition && ritualDefinition.checkVictory &&
              ritualDefinition.checkVictory(ritualRuntime, enemy, Game.Player.getData());
            if (enemy.hp <= 0 && (!ritualRuntime || ritualVictory)) {
              enemy.hp = 0;
              enemy._effects = [];
              enemyEffects = enemy._effects;
              var defeatedName = enemy.name;
              if (handleEnemyPartyDefeat()) {
                enterVictoryPhase(message + ' ' + defeatedName + 'を倒した！ ' + getTotalEnemyGoldReward() + 'G獲得！');
                if (Game.Particles) Game.Particles.emit('victory', 240, 100, { count: 30 });
              } else {
                message = message + ' ' + defeatedName + 'を倒した！ 次は' + enemy.name + 'だ。';
              }
            }
          } else {
            message = battleDice.length > 1
              ? '次のサイコロ！ もう戻れない。'
              : '次のサイコロ！ 止めろ！';
  }
  return {
    start: start,
    update: update,
    draw: draw,
    isActive: isActive,
    getAllEnemies: function() { return enemies; },
    getMenuEntries: getMenuEntries,
    getStateSnapshot: getStateSnapshot,
    getRitualRuntime: function() { return ritualRuntime; },
    getRitualDefinition: function(mode) {
      return Game.RitualBattles && Game.RitualBattles.getDefinition ? Game.RitualBattles.getDefinition(mode) : null;
    },
    getBossGimmick: function(bossId) { return bossGimmicks[bossId] || null; },
    getAllBossGimmicks: function() { return bossGimmicks; }
  };
})();
