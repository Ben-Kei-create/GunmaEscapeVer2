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
  var skillMenuIndex = 0;
  var skillMenuEntries = [];
  var skillUses = {};

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
  var bossActionOverlay = null;
  var enemyRollAnimation = null;
  var pendingEnemyAttack = null;
  var battleEnemyIds = [];
  var ENEMY_ROLL_WINDUP_FRAMES = 18;
  var ENEMY_ROLL_ACTIVE_FRAMES = 48;
  var ENEMY_ROLL_SETTLE_FRAMES = 18;
  var ENEMY_ROLL_SLOW_BONUS_FRAMES = 18;
  var PLAYER_DICE_RESULT_FRAMES = 38;
  var PLAYER_ACTION_RECOVERY_FRAMES = 14;

  // Atmosphere foreground effects
  var atmosParticles = [];
  var atmosNoiseOffset = 0;

  // Boss dialogue system: queued multi-line dialogue for phase_change/special/victory
  var dialogueQueue = [];      // array of { speaker, text }
  var dialogueTimer = 0;       // frames until next line auto-advances
  var dialogueSpeaker = '';     // current displayed speaker
  var dialogueText = '';        // current displayed text
  var dialogueInputCooldown = 0;
  var dialogueWaitingConfirm = false;
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
    hp: 68, maxHp: 68,
    attack: 14, defense: 6, goldReward: 0, expReward: 24,
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
    hp: 84, maxHp: 84,
    attack: 16, defense: 6, goldReward: 0, expReward: 36,
    ritualMode: 'repair_eye',
    ritualItemRequirement: 'darumaEye',
    ritualFailStyle: {
      text: 'だるまの虚無に押し返された。',
      returnEventId: 'ev_fail_ch1_pushback'
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
    hp: 124, maxHp: 124,
    attack: 22, defense: 10, goldReward: 70, expReward: 58,
    sprite: enemies.ishidanGuard.sprite,
    palette: { 1:'#5a5a5a', 2:'#b0b0b0', 3:'#111111', 4:'#d8d8d8', 5:'#6d6d6d', 6:'#484848', 7:'#303030' }
  };

  enemies.cabbageGuardian = {
    name: 'キャベツ番人',
    hp: 146, maxHp: 146,
    attack: 24, defense: 12, goldReward: 80, expReward: 64,
    sprite: enemies.cabbage.sprite,
    palette: enemies.cabbage.palette
  };

  enemies.threadMaiden = {
    name: '絡糸の機女',
    hp: 1, maxHp: 1,
    attack: 18, defense: 999, goldReward: 90, expReward: 74,
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
    hp: 52, maxHp: 52,
    attack: 14, defense: 4, goldReward: 18, expReward: 18, dropItem: 'yakimanju', dropRate: 0.18,
    sprite: enemies.darumaMaster.sprite,
    palette: { 1:'#5e1018', 2:'#c93039', 3:'#111111', 4:'#e7d2a6' }
  };

  enemies.roadsideBandit = {
    name: '境界の追いはぎ',
    hp: 66, maxHp: 66,
    attack: 16, defense: 6, goldReward: 22, expReward: 20, dropItem: 'tempoCharm', dropRate: 0.2,
    sprite: enemies.anguraGuard.sprite,
    palette: { 1:'#35363f', 3:'#ff6666', 4:'#2b2d36', 5:'#1f2028', 6:'#13141a' }
  };

  enemies.steamMonkey = {
    name: '湯煙ざる',
    hp: 60, maxHp: 60,
    attack: 15, defense: 5, goldReward: 20, expReward: 22, dropItem: 'emberIncense', dropRate: 0.18,
    sprite: enemies.onsenMonkey.sprite,
    palette: { 1:'#553322', 2:'#b17a49', 3:'#111111', 4:'#d8907a' }
  };

  enemies.konnyakuCrawler = {
    name: '蒟蒻うごめき',
    hp: 74, maxHp: 74,
    attack: 17, defense: 7, goldReward: 22, expReward: 24, dropItem: 'guardChalk', dropRate: 0.18,
    sprite: enemies.konnyakuKing.sprite,
    palette: enemies.konnyakuKing.palette
  };

  enemies.silkShade = {
    name: '白糸の影',
    hp: 82, maxHp: 82,
    attack: 19, defense: 8, goldReward: 24, expReward: 28, dropItem: 'silkWeight', dropRate: 0.17,
    sprite: enemies.threadMaiden.sprite,
    palette: { 1:'#312f3b', 2:'#d8d2c8', 3:'#1e1d24', 4:'#c48690', 5:'#e8e6e0', 6:'#857a6d' }
  };

  enemies.cabbageWisp = {
    name: '葉影のざわめき',
    hp: 76, maxHp: 76,
    attack: 18, defense: 8, goldReward: 22, expReward: 26, dropItem: 'measureLens', dropRate: 0.16,
    sprite: enemies.cabbageGuardian.sprite,
    palette: enemies.cabbageGuardian.palette
  };

  enemies.echoShard = {
    name: '返り声の欠片',
    hp: 94, maxHp: 94,
    attack: 22, defense: 10, goldReward: 26, expReward: 34, dropItem: 'loadedSand', dropRate: 0.16,
    sprite: enemies.echo_guardian.sprite,
    palette: enemies.echo_guardian.palette
  };

  enemies.mistBeastling = {
    name: '霧獣の幼影',
    hp: 108, maxHp: 108,
    attack: 24, defense: 12, goldReward: 28, expReward: 38, dropItem: 'kaeshiOmamori', dropRate: 0.14,
    sprite: enemies.haruna_lake_beast.sprite,
    palette: enemies.haruna_lake_beast.palette
  };

  enemies.mudWisp = {
    name: '泥の囁き',
    hp: 118, maxHp: 118,
    attack: 26, defense: 14, goldReward: 30, expReward: 42, dropItem: 'yakimanju', dropRate: 0.16,
    sprite: enemies.oze_mud_wraith.sprite,
    palette: enemies.oze_mud_wraith.palette
  };

  enemies.wishShelfShade = {
    name: '願棚のこぼれ火',
    mapTags: ['takasaki'],
    pride: '願いを最後まで棚の上で見届けること',
    sorrow: '願い主が戻らぬまま夜を越えたこと',
    echoText: '棚の上で冷えた願いの熱だけが、赤い粉の匂いと一緒に残っていた。',
    hp: 58, maxHp: 58,
    attack: 15, defense: 5, goldReward: 19, expReward: 21, dropItem: 'darumaSuzu', dropRate: 0.08,
    sprite: enemies.darumaMaster.sprite,
    palette: { 1:'#5c181d', 2:'#b74a42', 3:'#171212', 4:'#d8c68f' }
  };

  enemies.bathhouseRemnant = {
    name: '湯治帰りの残り火',
    mapTags: ['kusatsu', 'shirane_trail', 'kusatsu_deep'],
    pride: '湯で人の痛みを軽くして送り出すこと',
    sorrow: '自分だけは湯から上がれなかったこと',
    echoText: '人を癒やして見送った手つきだけが、硫黄の風のなかにまだ残っていた。',
    hp: 72, maxHp: 72,
    attack: 18, defense: 8, goldReward: 23, expReward: 27, dropItem: 'emberIncense', dropRate: 0.16,
    sprite: enemies.ishidanGuard.sprite,
    palette: { 1:'#694a37', 2:'#d6b189', 3:'#241713', 4:'#f0d29f', 5:'#8d6c57', 6:'#634937', 7:'#453125' }
  };

  enemies.lanternKeeper = {
    name: '灯籠の見回り',
    mapTags: ['forest', 'onuma', 'akagi_ranch', 'haruna_lake'],
    pride: '夜道の灯りを絶やさないこと',
    sorrow: '迎える客がもう来ないこと',
    echoText: '帰り道を照らしたかった灯りが、霧の向こうでようやく静かに伏せた。',
    hp: 102, maxHp: 102,
    attack: 23, defense: 11, goldReward: 27, expReward: 36, dropItem: 'measureLens', dropRate: 0.15,
    sprite: enemies.anguraGuard.sprite,
    palette: { 1:'#3f4556', 3:'#ffd36b', 4:'#334052', 5:'#202733', 6:'#121722' }
  };

  enemies.ferryBellEcho = {
    name: '渡しの呼び声',
    mapTags: ['tanigawa_tunnel', 'minakami_valley', 'border_tunnel'],
    pride: '境を越える者へ合図を送り続けること',
    sorrow: 'もう誰もその合図を待っていないこと',
    echoText: '誰かを無事に通すための呼び声が、トンネルの壁でやさしく消えていった。',
    hp: 110, maxHp: 110,
    attack: 25, defense: 13, goldReward: 29, expReward: 40, dropItem: 'loadedSand', dropRate: 0.15,
    sprite: enemies.echo_guardian.sprite,
    palette: { 1:'#3a4050', 2:'#7b8ca8', 3:'#0c1018', 4:'#d8e3ff', 5:'#4e5d79' }
  };

  enemies.marshPathShade = {
    name: '木道の置き傘',
    mapTags: ['oze_marsh'],
    pride: '濡れた道で人を転ばせないこと',
    sorrow: '置き主を待つだけで朽ちていくこと',
    echoText: '濡れた木道を案じる気配だけが、湿原の風にほどけていった。',
    hp: 116, maxHp: 116,
    attack: 26, defense: 14, goldReward: 30, expReward: 42, dropItem: 'guardChalk', dropRate: 0.15,
    sprite: enemies.oze_mud_wraith.sprite,
    palette: { 1:'#5c6c52', 2:'#a9b38f', 3:'#2b2b24', 4:'#5c4f3f' }
  };

  var menuItems = ['たたかう', 'アイテム', 'とくぎ', 'にげる'];

  function getRitualDefinition() {
    if (!ritualRuntime || !Game.RitualBattles || !Game.RitualBattles.getDefinition) return null;
    return Game.RitualBattles.getDefinition(ritualRuntime.ritualMode);
  }

  function getMenuEntries() {
    var entries = [
      { id: 'attack', label: menuItems[0] },
      { id: 'items', label: menuItems[1] },
      { id: 'skills', label: menuItems[2] },
      { id: 'flee', label: menuItems[3] }
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

  function openBattleItemMenu() {
    var inv = Game.Player.getData().inventory;
    var battleEntries = [];
    var healEntries = [];
    itemMenuItems = [];
    itemMenuIndex = 0;
    itemMenuMode = 'battle';
    ritualMenuActionId = null;
    for (var i = 0; i < inv.length; i++) {
      var item = Game.Items.get(inv[i]);
      if (item && item.type === 'battle') {
        battleEntries.push({
          id: inv[i],
          item: item
        });
      } else if (item && item.type === 'heal') {
        healEntries.push({
          id: inv[i],
          item: item
        });
      }
    }
    itemMenuItems = battleEntries.concat(healEntries);
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

  function buildSkillEntries() {
    var knownSkills = Game.Player && Game.Player.getSkills ? Game.Player.getSkills() : [];
    var entries = [];
    for (var i = 0; i < knownSkills.length; i++) {
      var skill = Game.Skills && Game.Skills.get ? Game.Skills.get(knownSkills[i]) : null;
      if (!skill) continue;
      var remaining = Game.Player && Game.Player.getSkillCharges ? Game.Player.getSkillCharges(skill.id) : 0;
      entries.push({
        id: skill.id,
        skill: skill,
        remaining: remaining,
        disabled: remaining <= 0
      });
    }
    return entries;
  }

  function openSkillMenu() {
    skillMenuEntries = buildSkillEntries();
    skillMenuIndex = 0;
    if (!skillMenuEntries.length) {
      message = 'まだ身についたとくぎがない。';
      messageTimer = 40;
      Game.Audio.playSfx('cancel');
      return;
    }
    phase = 'skillMenu';
    message = '使うとくぎを選べ';
    messageTimer = 0;
    Game.Audio.playSfx('confirm');
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

  function resolveRepairEyeAction() {
    var ritualDefinition = getRitualDefinition();
    var ritualItemId = ritualRuntime && ritualRuntime.ritualItemRequirement ? ritualRuntime.ritualItemRequirement : null;
    if (!ritualDefinition || !ritualRuntime || ritualRuntime.ritualMode !== 'repair_eye') return false;
    if (!ritualRuntime.ritualState.hpZeroReached) {
      message = '欠け目が、まだこちらを見返してこない。';
      messageTimer = 35;
      Game.Audio.playSfx('cancel');
      return false;
    }

    if (ritualDefinition.onActionResolved) {
      ritualDefinition.onActionResolved(
        ritualRuntime,
        enemy,
        Game.Player.getData(),
        { id: 'drop_item_to_eye_slot', itemId: ritualItemId },
        { damage: 0, heal: 0 }
      );
    }

    var ritualOutcome = evaluateRitualOutcome();
    if (!ritualOutcome) {
      message = '欠けた目へ、そっと願いを戻した。';
      messageTimer = 45;
      phase = 'menu';
    }
    Game.Audio.playSfx(ritualRuntime && ritualRuntime.ritualState && ritualRuntime.ritualState.eyeRepaired ? 'ritual_chime' : 'confirm');
    return ritualOutcome || true;
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

  function removeEffect(list, type) {
    var removed = false;
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].type === type) {
        list.splice(i, 1);
        removed = true;
      }
    }
    return removed;
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
    if (total <= 0) return 0;
    return Math.max(1, Math.floor(total * 0.55));
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
      afterglowText: getRitualAfterglowText(),
      enemyEchoText: getEnemyEchoText()
    };
  }

  function getPartySupportLogs() {
    var partyMembers = Game.Player.getPartyMembers ? Game.Player.getPartyMembers() : [];
    var logs = [];
    var mapId = getBattleMapId();
    for (var i = 0; i < partyMembers.length; i++) {
      var member = partyMembers[i];
      if (!member) continue;
      var text = member.name + ': ';
      if (member.id === 'akagi') {
        if (mapId === 'maebashi') {
          text += '関所の脈を読み、崩れた境界の綻びを見抜いた。';
        } else if (mapId === 'takasaki') {
          text += '願いの空白を見抜き、乱れた呼吸を落ち着かせた。';
        } else if (mapId === 'shimonita' || mapId === 'tomioka') {
          text += '土地の癖を先に読み、強引に引かない間合いを作った。';
        } else {
          text += '境界を読み、攻め筋を整えた。';
        }
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

  function getDirectEnemyEchoText(foe) {
    if (!foe) return '';
    if (foe.echoText) return foe.echoText;
    if (foe.sorrow && foe.pride) {
      return foe.sorrow + '。それでも「' + foe.pride + '」だけは手放せなかった。';
    }
    if (foe.sorrow) return foe.sorrow + '。';
    return '';
  }

  function getEnemyEchoText() {
    var ids = [];
    var uniqueFoes = [];
    var seen = {};
    for (var i = 0; i < enemyParty.length; i++) {
      var foe = enemyParty[i];
      if (!foe || !foe._enemyId || seen[foe._enemyId]) continue;
      seen[foe._enemyId] = true;
      ids.push(foe._enemyId);
      uniqueFoes.push(foe);
    }
    if (!ids.length) return '';

    var singleEcho = {
      ruined_checkpoint: '崩れた関所は、通せなかった旅人の足音だけをまだ覚えていた。',
      roadsideBandit: '奪うしかなくなった運び屋の手つきが、風の中で静かにほどけた。',
      strayDaruma: '願いを待つだけの赤い殻が、道ばたで小さく転がって止まった。',
      darumaMaster: '空っぽの願いは拒絶ではなく、見つめ返されるのを待っていたのかもしれない。',
      onsenMonkey: '湯煙にまぎれていた猿の影は、熱だけを残して薄くほどけた。',
      konnyakuCrawler: 'ぶるぶるした黒い影は、畑の土へ溶けるように沈んでいった。',
      konnyakuKing: '山あいに残ったのは、届け先を失っても土地を誇っていた声だけだった。',
      anguraGuard: '荷を失った男たちの荒い息が、荷車の軋みみたいに遠ざかった。',
      chuji: '豪胆な亡霊の笑いだけが、霧の牧柵のあいだにしばらく残った。',
      anguraBoss: '運び屋の誇りは折れても消えず、沈んだ荷台の奥でまだ温かかった。',
      threadMaiden: '止まれなかった糸の誇りが、ようやく風の速さで息をつきはじめた。',
      yubatake_guardian: '荒ぶっていた湯の息がやわらぎ、土地の熱だけが静かに残った。',
      ishidanGuard: '積み上げられた石段の気配は、試すような重みだけを置いて退いた。',
      cabbage: '千切れた葉音だけが畑を渡り、守りたかった季節の名残を揺らしていた。',
      kumako_steam: '湯気の奥の爪痕が消え、怖れより先に疲れだけが残った。',
      haruna_lake_beast: '湖面を荒らしていた影は沈み、霧だけが何事もなかった顔で漂った。',
      oze_mud_wraith: '湿地の底に沈んでいた嘆きが、泥の泡といっしょにひとつ静まった。',
      juke_minakami: '渓谷にひびいていた執着が薄れ、冷たい水音だけが輪郭を取り戻した。',
      juke_final: '境界へ縫い留められていた執念がほどけ、夜明け前の空気だけが残った。'
    };
    if (uniqueFoes.length === 1) {
      var directEcho = getDirectEnemyEchoText(uniqueFoes[0]);
      if (directEcho) return directEcho;
      if (singleEcho[ids[0]]) return singleEcho[ids[0]];
    }

    var mapId = getBattleMapId();
    if (mapId === 'maebashi') return 'この入口にも、通れなかった旅と置いていかれた息づかいが積もっていた。';
    if (mapId === 'takasaki') return '願いの町に転がる抜け殻にも、それぞれ見届けたかった明日があった。';
    if (mapId === 'shimonita') return '山あいの荷の気配がほどけ、運び損ねた誇りだけが道ばたに残った。';
    if (mapId === 'tomioka') return '止まることを許されなかった仕事の名残が、ようやく静かな音に戻っていく。';
    if (isGroupBattle()) return '歪んだ群れ声の奥にも、この土地で果たせなかった役目があった気がした。';
    if (npcRef && npcRef.name) return npcRef.name + 'の気配だけが薄く残り、場の空気は少しだけ軽くなった。';
    return '歪んだ誇りにも、ここで果たせなかった役目があった気がした。';
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

  function clampBattleText(text, maxChars) {
    var source = '' + (text || '');
    if (source.length <= maxChars) return source;
    return source.substring(0, Math.max(0, maxChars - 1)) + '…';
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

  function addEffectToLivingEnemies(type, turnsLeft, value) {
    for (var i = 0; i < enemyParty.length; i++) {
      var foe = enemyParty[i];
      if (!foe || foe.hp <= 0) continue;
      if (!foe._effects) foe._effects = [];
      addEffect(foe._effects, type, turnsLeft, value);
    }
    syncCurrentEnemy();
  }

  function previewEnemyPartyAttack() {
    var defBonus = getEffectBonus(playerEffects, 'defense_up');
    var activeAttackers = [];
    var stunnedNames = [];
    var slowedNames = [];
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
      var slowRoll = hasEffect(foeEffects, 'enemy_roll_slow');
      if (slowRoll) {
        damage = Math.max(0, damage - (slowRoll.value || 4));
        slowedNames.push(foe.name);
      }
      totalDamage += damage;
      activeAttackers.push(foe.name);
    }

    return {
      activeAttackers: activeAttackers,
      stunnedNames: stunnedNames,
      slowedNames: slowedNames,
      totalDamage: totalDamage
    };
  }

  function createEnemyRollDie(index, total, slowFactor) {
    var factor = typeof slowFactor === 'number' ? slowFactor : 1;
    var size = 8 + Math.floor(Math.random() * 6);
    var laneRatio = total > 1 ? index / (total - 1) : 0.5;
    var startX = 292 + Math.random() * 92;
    var startY = 88 + laneRatio * 56 + (Math.random() * 16 - 8);
    return {
      x: startX,
      y: startY,
      homeX: startX,
      homeY: startY,
      vx: -(2.4 + Math.random() * 1.7) * factor,
      vy: -(0.9 + Math.random() * 1.1) * factor,
      gravity: (0.08 + Math.random() * 0.04) * (0.8 + factor * 0.2),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() * 0.22 + 0.08) * factor * (Math.random() > 0.5 ? 1 : -1),
      floorY: 164 + Math.random() * 24,
      size: size,
      face: 1 + Math.floor(Math.random() * 6),
      delay: Math.floor(Math.random() * 4),
      settled: false,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleRange: 0.6 + Math.random() * 0.8
    };
  }

  function getEnemyRollStage(animation) {
    if (!animation) return 'idle';
    var elapsed = animation.maxTimer - animation.timer;
    if (elapsed < animation.windupFrames) return 'windup';
    if (animation.timer <= animation.settleFrames) return 'settle';
    return 'roll';
  }

  function startEnemyRollAnimation(attackPreview) {
    var attackerCount = attackPreview && attackPreview.activeAttackers ? attackPreview.activeAttackers.length : 1;
    var diceCount = Math.max(2, Math.min(7, attackerCount * 2 + Math.floor(Math.random() * 2)));
    var slowed = !!(attackPreview && attackPreview.slowedNames && attackPreview.slowedNames.length);
    var speedFactor = slowed ? 0.58 : 1;
    var windupFrames = slowed ? ENEMY_ROLL_WINDUP_FRAMES + 6 : ENEMY_ROLL_WINDUP_FRAMES;
    var activeFrames = ENEMY_ROLL_ACTIVE_FRAMES + Math.min(10, attackerCount * 3) + (slowed ? ENEMY_ROLL_SLOW_BONUS_FRAMES : 0);
    var settleFrames = slowed ? ENEMY_ROLL_SETTLE_FRAMES + 4 : ENEMY_ROLL_SETTLE_FRAMES;
    var timer = windupFrames + activeFrames + settleFrames;
    var dice = [];
    for (var i = 0; i < diceCount; i++) {
      dice.push(createEnemyRollDie(i, diceCount, speedFactor));
    }
    enemyRollAnimation = {
      timer: timer,
      maxTimer: timer,
      attackers: attackPreview.activeAttackers.slice(),
      slowed: slowed,
      dice: dice,
      windupFrames: windupFrames,
      settleFrames: settleFrames,
      rollSfxPlayed: false
    };
    message = attackPreview.activeAttackers.join(' / ') + (slowed ? 'が重い賽を鳴らす…' : 'が白い賽を鳴らす…');
    messageTimer = 0;
  }

  function updateEnemyRollAnimation() {
    if (!enemyRollAnimation || enemyRollAnimation.timer <= 0) return false;
    var elapsed = enemyRollAnimation.maxTimer - enemyRollAnimation.timer;
    var stage = getEnemyRollStage(enemyRollAnimation);
    if (Game.Input && elapsed >= enemyRollAnimation.windupFrames + 16 &&
        (Game.Input.isPressed('confirm') || Game.Input.isPressed('cancel'))) {
      enemyRollAnimation.timer = Math.min(enemyRollAnimation.timer, enemyRollAnimation.settleFrames + 10);
    }

    for (var i = 0; i < enemyRollAnimation.dice.length; i++) {
      var die = enemyRollAnimation.dice[i];
      if (stage === 'windup') {
        var charge = enemyRollAnimation.windupFrames > 0 ? Math.min(1, elapsed / enemyRollAnimation.windupFrames) : 1;
        die.face = 1 + ((Math.floor(elapsed / 2) + i) % 6);
        die.x = die.homeX + Math.sin(elapsed * 0.28 + die.wobblePhase) * die.wobbleRange * charge;
        die.y = die.homeY + Math.cos(elapsed * 0.32 + die.wobblePhase) * die.wobbleRange * 0.6 * charge;
        die.rotation += die.rotSpeed * (0.16 + charge * 0.2);
        continue;
      }
      if (!enemyRollAnimation.rollSfxPlayed) {
        Game.Audio.playSfx(enemyRollAnimation.slowed ? 'dice_roll_heavy' : 'dice_stop');
        enemyRollAnimation.rollSfxPlayed = true;
      }
      if (die.delay > 0) {
        die.delay--;
        continue;
      }
      if ((enemyRollAnimation.timer + i) % 4 === 0) {
        die.face = 1 + Math.floor(Math.random() * 6);
      }
      if (!die.settled) {
        die.x += die.vx;
        die.y += die.vy;
        die.vy += die.gravity;
        die.rotation += die.rotSpeed;
        if (die.y >= die.floorY) {
          die.y = die.floorY;
          die.vy *= -0.42;
          die.vx *= 0.94;
          if (Math.abs(die.vy) < 0.18) {
            die.vy = 0;
            die.rotSpeed *= 0.6;
            die.settled = true;
          }
        }
      } else {
        die.rotation += die.rotSpeed;
        die.rotSpeed *= 0.92;
      }
      if (stage === 'settle') {
        die.vx *= 0.9;
        die.rotSpeed *= 0.88;
      }
    }

    enemyRollAnimation.timer--;
    if (enemyRollAnimation.timer <= 0) {
      enemyRollAnimation = null;
      return false;
    }
    return true;
  }

  function applyEnemyPartyAttack(attackPreview) {
    var playerData = Game.Player.getData();
    var preview = attackPreview || previewEnemyPartyAttack();
    var activeAttackers = preview.activeAttackers;
    var stunnedNames = preview.stunnedNames;
    var slowedNames = preview.slowedNames || [];
    var totalDamage = preview.totalDamage;
    var wardBonus = getEffectBonus(playerEffects, 'ward');

    if (!activeAttackers.length) {
      message = stunnedNames.length ? (stunnedNames.join(' / ') + 'は痺れて動けない！') : '敵の群れは様子をうかがっている。';
      messageTimer = 48;
      return false;
    }

    if (wardBonus > 0) {
      totalDamage = Math.max(0, totalDamage - wardBonus);
      removeEffect(playerEffects, 'ward');
    }

    if (totalDamage <= 0) {
      message = activeAttackers.join(' / ') + 'の攻撃！ だが勢いが出ない。';
      if (slowedNames.length) {
        message += ' ' + slowedNames.join(' / ') + 'の賽は重く鈍っている。';
      }
      if (stunnedNames.length) {
        message += ' ' + stunnedNames.join(' / ') + 'は動けない。';
      }
      messageTimer = 54;
      Game.Audio.playSfx('enemy_strike');
      return false;
    }

    playerData.hp -= totalDamage;
    message = activeAttackers.join(' / ') + 'の攻撃！ ' + totalDamage + 'ダメージ！';
    if (slowedNames.length) {
      message += ' ' + slowedNames.join(' / ') + 'の賽は重く鈍っている。';
    }
    if (stunnedNames.length) {
      message += ' ' + stunnedNames.join(' / ') + 'は動けない。';
    }
    messageTimer = 54;
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
    if (enemyParty.length === 1 && enemyParty[0]._enemyId === 'ruined_checkpoint') {
      return '止められた旅人の気配が、瓦礫を門の形に立たせている。';
    }
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
    if (enemy && enemy.battleLabel) return enemy.battleLabel;
    if (currentGimmick) return '異形接触';
    return '敵影接近';
  }

  function getBattleAccentColor() {
    if (isSpecialRitualBattle()) return '#ffd66b';
    if (isGroupBattle()) return '#8fe0ff';
    if (enemy && enemy.battleAccent) return enemy.battleAccent;
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
    if (enemy && enemy.battleTheme === 'melancholy_battle') {
      return { duration: 72, bgmTriggerFrame: 10, bgmOptions: { startDelay: 0.1 } };
    }
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
    var bgmName = 'battle';
    if (enemy && enemy.battleTheme) {
      bgmName = enemy.battleTheme;
    } else if (currentGimmick && currentGimmick.bgm) {
      bgmName = currentGimmick.bgm;
    } else if (npcRef && npcRef.battleTheme) {
      bgmName = npcRef.battleTheme;
    }
    Game.Audio.playBgm(bgmName, introBgmOptions || undefined);
    introBgmStarted = true;
  }

  function start(enemyId, npc) {
    active = true;
    npcRef = npc;
    var enemyIds = Array.isArray(enemyId) ? enemyId.slice() : [enemyId];
    battleEnemyIds = enemyIds.slice();
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
    skillMenuIndex = 0;
    skillMenuEntries = [];
    skillUses = {};

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
    bossActionOverlay = null;
    enemyRollAnimation = null;
    pendingEnemyAttack = null;
    // Initialize boss gimmick
    currentGimmick = isGroupBattle() ? null : (bossGimmicks[enemy._enemyId] || null);
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
    dialogueInputCooldown = 0;
    dialogueWaitingConfirm = false;
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

    if (enemy && enemy._enemyId === 'ruined_checkpoint' && Game.Story && Game.Story.hasFlag) {
      var checkpointIntroLines = [];
      if (!Game.Story.hasFlag('checkpoint_nature_explained')) {
        checkpointIntroLines.push(
          { speaker: '主人公', text: 'ただの廃材じゃない。止められた旅人の気配が、門の形で残ってる。' },
          { speaker: 'アカギ', text: '壊すな。越えるための数を、あいつに重ねろ。' }
        );
        if (Game.Story.setFlag) Game.Story.setFlag('checkpoint_nature_explained');
      }
      if (!Game.Story.hasFlag('dice_battle_explained')) {
        checkpointIntroLines.push(
          { speaker: '主人公', text: 'ダイスが浮いた……。出したい目で止め、その数を関所へ重ねる。' },
          { speaker: '主人公', text: '慌てるな。回る目を見て、SpaceかEnterで止める。' }
        );
        if (Game.Story.setFlag) Game.Story.setFlag('dice_battle_explained');
      }
      if (checkpointIntroLines.length) {
        queueDialogue(checkpointIntroLines);
        if (Game.Story.saveFlags) Game.Story.saveFlags();
      }
    }

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
      dialogueWaitingConfirm = false;
      dialogueInputCooldown = Math.max(dialogueInputCooldown, 8);
      return;
    }
    var line = dialogueQueue.shift();
    dialogueSpeaker = line.speaker || '';
    dialogueText = line.text || '';
    dialogueTimer = 0;
    dialogueWaitingConfirm = true;
    dialogueInputCooldown = Math.max(dialogueInputCooldown, 8);
  }

  function updateDialogue() {
    if (bossActionOverlay && bossActionOverlay.timer > 0) return;
    if (dialogueWaitingConfirm && dialogueText) {
      if (dialogueInputCooldown <= 0 && Game.Input &&
          (Game.Input.isPressed('confirm') || Game.Input.isPressed('cancel'))) {
        advanceDialogue();
      }
    }
  }

  function isDialogueActive() {
    return dialogueWaitingConfirm || dialogueTimer > 0 || dialogueQueue.length > 0;
  }

  function getBossActionTheme(bossId) {
    var themes = {
      ruined_checkpoint: {
        accent: '#9db8d8',
        shadow: 'rgba(18,30,46,0.94)',
        veil: 'rgba(8,12,20,0.58)',
        trail: 'rgba(157,184,216,0.22)',
        label: '境界残響'
      },
      darumaMaster: {
        accent: '#ffd66b',
        shadow: 'rgba(84,16,24,0.94)',
        veil: 'rgba(20,6,10,0.60)',
        trail: 'rgba(255,214,107,0.20)',
        label: '願掛け異変'
      },
      threadMaiden: {
        accent: '#f2e8dc',
        shadow: 'rgba(55,40,52,0.94)',
        veil: 'rgba(12,10,18,0.60)',
        trail: 'rgba(242,232,220,0.18)',
        label: '糸場反応'
      },
      chuji: {
        accent: '#d7c29a',
        shadow: 'rgba(28,22,30,0.95)',
        veil: 'rgba(8,8,14,0.62)',
        trail: 'rgba(215,194,154,0.16)',
        label: '残侠追憶'
      }
    };
    if (themes[bossId]) return themes[bossId];
    if (isSpecialRitualBattle()) {
      return {
        accent: '#ffd66b',
        shadow: 'rgba(32,20,36,0.94)',
        veil: 'rgba(10,8,18,0.60)',
        trail: 'rgba(255,214,107,0.18)',
        label: '儀式作動'
      };
    }
    return {
      accent: getBattleAccentColor(),
      shadow: 'rgba(12,16,30,0.94)',
      veil: 'rgba(6,8,16,0.56)',
      trail: 'rgba(143,184,255,0.18)',
      label: '異変接触'
    };
  }

  function getBossActionOnomatopoeia(kind, bossId) {
    var cues = {
      ruined_checkpoint: { phase_change: 'ギ…ギギ…', special_move: 'ゴォン…' },
      darumaMaster: { phase_change: 'ギロ…', special_move: 'ゾワッ' },
      threadMaiden: { phase_change: 'キ…', special_move: 'シュルル…' },
      chuji: { phase_change: 'ス…', special_move: 'ヒュン' },
      yubatake_guardian: { phase_change: 'ボコ…', special_move: 'ボワァッ' },
      kumako_steam: { phase_change: 'とろ…', special_move: 'じゅわっ' },
      juke_gakuen: { phase_change: 'キィン', special_move: 'ザラッ' },
      sato_kumako_tunnel: { phase_change: 'ゴゴ…', special_move: 'ガタンゴトン' },
      echo_guardian: { phase_change: 'びぃん…', special_move: 'ワン…' },
      haruna_lake_beast: { phase_change: 'グオ…', special_move: 'ザバァッ' },
      oze_mud_wraith: { phase_change: 'ズブ…', special_move: 'ボコッ' },
      juke_minakami: { phase_change: 'ヒュ…', special_move: 'ギュン' },
      anguraBoss: { phase_change: 'ガタン', special_move: 'ドドド…' },
      juke_final: { phase_change: 'ザザッ', special_move: 'ギィン' }
    };
    if (cues[bossId] && cues[bossId][kind]) return cues[bossId][kind];
    return kind === 'special_move' ? 'ゴウッ' : 'ゾク…';
  }

  function buildBossActionSummary(kind, actionDef, detailParts) {
    var summary = '';
    if (kind === 'phase_change') {
      summary = '気配が変わった…';
    } else {
      summary = (actionDef && actionDef.name) || '大技';
    }
    if (detailParts && detailParts.length) {
      summary += ' ' + detailParts.join(' / ');
    }
    return summary;
  }

  function queueBossActionDialogue(kind, actionDef, fallbackText) {
    var lines = currentGimmick && currentGimmick.dialogue ? currentGimmick.dialogue[kind] : null;
    if (lines && lines.length) {
      queueDialogue(lines);
      return;
    }
    var explanation = '';
    if (typeof fallbackText === 'string' && fallbackText) {
      explanation = fallbackText;
    } else if (actionDef && actionDef.message) {
      explanation = actionDef.message;
    } else if (actionDef && actionDef.description) {
      explanation = actionDef.description;
    }
    if (!explanation) return;
    queueDialogue([{ speaker: '', text: explanation }]);
  }

  function startBossActionOverlay(kind, actionDef, fallbackText) {
    if (!enemy) return;
    var theme = getBossActionTheme(enemy._enemyId);
    var bodyText = (actionDef && actionDef.onomatopoeia) ||
      getBossActionOnomatopoeia(kind, enemy._enemyId);
    var overlayDuration = kind === 'special_move' ? 42 : 34;
    bossActionOverlay = {
      kind: kind,
      title: '',
      subtitle: '',
      lines: wrapBattleText(bodyText, 22, 2),
      accent: theme.accent,
      shadow: theme.shadow,
      veil: theme.veil,
      trail: theme.trail,
      timer: overlayDuration,
      maxTimer: overlayDuration
    };
  }

  function updateBossActionOverlay() {
    if (!bossActionOverlay || bossActionOverlay.timer <= 0) return false;
    if (Game.Input && (Game.Input.isPressed('confirm') || Game.Input.isPressed('cancel'))) {
      bossActionOverlay.timer = Math.min(bossActionOverlay.timer, 6);
    }
    bossActionOverlay.timer--;
    if (bossActionOverlay.timer <= 0) {
      bossActionOverlay = null;
      return false;
    }
    return true;
  }

  function isBossActionOverlayVisible() {
    return !!(bossActionOverlay && bossActionOverlay.timer > 0);
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
    var focusEffect = hasEffect(playerEffects, 'slow_roll');
    var jamEffect = hasEffect(playerEffects, 'slow');
    diceSpeed = focusEffect ? 5 : (jamEffect ? 2 : 3);

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
    if (!active) return null;

    var bossActionActive = updateBossActionOverlay();
    if (bossActionActive) {
      if (shakeX > 0.5) {
        shakeX *= 0.85;
      } else {
        shakeX = 0;
      }
      if (diceFlashTimer > 0) diceFlashTimer--;
      return null;
    }

    // Advance boss dialogue queue
    updateDialogue();
    if (dialogueInputCooldown > 0) dialogueInputCooldown--;

    if (shakeX > 0.5) {
      shakeX *= 0.85;
    } else {
      shakeX = 0;
    }

    if (diceFlashTimer > 0) diceFlashTimer--;

    if (messageTimer > 0) {
      messageTimer--;
      if (phase !== 'diceRoll') return null;
    }

    var phaseResult = null;
    switch (phase) {
      case 'intro': phaseResult = handleIntroPhase(); break;
      case 'menu': phaseResult = handleMenuPhase(); break;
      case 'itemMenu': phaseResult = handleItemMenuPhase(); break;
      case 'skillMenu': phaseResult = handleSkillMenuPhase(); break;
      case 'diceRoll': phaseResult = handleDiceRollPhase(); break;
      case 'diceResult': phaseResult = handleDiceResultPhase(); break;
      case 'playerAttack': phaseResult = handlePlayerAttackPhase(); break;
      case 'enemyAttack': phaseResult = handleEnemyAttackPhase(); break;
      case 'victory': phaseResult = handleVictoryPhase(); break;
      case 'reward': phaseResult = handleRewardPhase(); break;
      case 'defeat': phaseResult = handleDefeatPhase(); break;
      case 'ritualFail': phaseResult = handleRitualFailPhase(); break;
      case 'useItem': phaseResult = handleUseItemPhase(); break;
      case 'flee': phaseResult = handleFleePhase(); break;
    }
    return phaseResult || null;
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
        if (isDialogueActive() || dialogueInputCooldown > 0) {
          return;
        }
        var menuEntries = getMenuEntries();
        if (menuIndex >= menuEntries.length) {
          menuIndex = Math.max(0, menuEntries.length - 1);
        }
        if (isGroupBattle() && Game.Input.isPressed('left')) {
          cycleTarget(-1);
          return;
        }
        if (isGroupBattle() && Game.Input.isPressed('right')) {
          cycleTarget(1);
          return;
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

  function handleSkillMenuPhase() {
        if (Game.Input.isPressed('up')) {
          skillMenuIndex = (skillMenuIndex - 1 + skillMenuEntries.length) % skillMenuEntries.length;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('down')) {
          skillMenuIndex = (skillMenuIndex + 1) % skillMenuEntries.length;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('cancel')) {
          phase = 'menu';
          message = '';
          Game.Audio.playSfx('cancel');
        }
        if (Game.Input.isPressed('confirm')) {
          useSelectedSkill();
        }

  }

  function handleDiceRollPhase() {
        if (canCancelDiceRoll() && Game.Input.isPressed('cancel')) {
          phase = 'menu';
          message = '構えを解いた。';
          messageTimer = 18;
          Game.Audio.playSfx('cancel');
          return;
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
            animTimer = PLAYER_ACTION_RECOVERY_FRAMES;
          }
        }

  }

  function handlePlayerAttackPhase() {
        animTimer--;
        if (animTimer <= 0) {
          var attackPreview = previewEnemyPartyAttack();
          phase = 'enemyAttack';
          if (attackPreview.activeAttackers.length > 0) {
            pendingEnemyAttack = attackPreview;
            startEnemyRollAnimation(attackPreview);
          } else {
            pendingEnemyAttack = null;
            applyEnemyPartyAttack(attackPreview);
            syncCurrentEnemy();
          }
        }

  }

  function handleEnemyAttackPhase() {
        if (enemyRollAnimation) {
          if (updateEnemyRollAnimation()) {
            return;
          }
        }
        if (pendingEnemyAttack) {
          var enemyAttackDefeated = applyEnemyPartyAttack(pendingEnemyAttack);
          pendingEnemyAttack = null;
          enemyRollAnimation = null;
          if (!enemyAttackDefeated) {
            syncCurrentEnemy();
          }
          return;
        }
        // Tick status effects at end of round
        tickEffects(playerEffects);
        tickEnemyPartyEffects();
        turnCount++;

        // ── Boss gimmick: passive effect at turn end ──
        if (currentGimmick && currentGimmick.passive && currentGimmick.passive.apply) {
          var passiveResult = currentGimmick.passive.apply(enemy, turnCount, playerEffects, enemyEffects, ritualRuntime);
          if (passiveResult && typeof passiveResult === 'string') {
            gimmickMessage = passiveResult;
            gimmickMessageTimer = 50;
          }
        }

        // ── Boss gimmick: special move trigger ──
        var specialTriggered = false;
        if (currentGimmick && currentGimmick.special_move && enemy.hp > 0) {
          var sm = currentGimmick.special_move;
          if (sm.trigger && sm.trigger(turnCount, enemy)) {
            specialTriggered = true;
            var spDmg = sm.damage ? sm.damage(enemy) : 0;
            var specialParts = [];
            if (spDmg > 0) {
              var playerData3 = Game.Player.getData();
              var defBonus3 = getEffectBonus(playerEffects, 'defense_up');
              var finalSpDmg = Math.max(1, spDmg - (Game.Player.getDefense() + defBonus3));
              playerData3.hp -= finalSpDmg;
              Game.Audio.playSfx('damage');
              shakeX = 8;
              if (Game.Particles) Game.Particles.emit('damage', 100, 220, { count: 10 });
              specialParts.push(finalSpDmg + 'ダメージ');
              if (playerData3.hp <= 0) {
                playerData3.hp = 0;
                phase = 'defeat';
                message = '力尽きた...';
                messageTimer = 90;
              }
            }
            if (sm.effect) {
              sm.effect(playerEffects, addEffect, enemyEffects, ritualRuntime, enemy, turnCount);
            }
            if (sm.debuff && sm.debuff.type) {
              addEffect(playerEffects, sm.debuff.type, sm.debuff.turns || 1, sm.debuff.value || 0);
              specialParts.push(sm.debuff.type === 'heal_seal' ? '回復封印' : '状態異常');
            }
            // Self stun after special
            if (sm.self_stun) {
              addEffect(enemyEffects, 'stun', sm.self_stun, 0);
            }
            // Seal a command for next turn
            if (sm.id === 'forgotten_route' || sm.id === 'lone_hack') {
              sealedCommand = 1; // seal 'アイテム'
              specialParts.push('アイテム封印');
            }
            gimmickMessage = buildBossActionSummary('special_move', sm, specialParts);
            gimmickMessageTimer = 44;
            startBossActionOverlay('special_move', sm, sm.message || sm.description);
            playBossSfx('special_move');
            queueBossActionDialogue('special_move', sm, sm.message || sm.description);
            if (Game.Player.getData().hp <= 0) {
              Game.Audio.stopBgm();
              Game.Audio.playSfx('gameover');
              return;
            }
          }
          if (!specialTriggered && sealedCommand >= 0) {
            sealedCommand = -1;
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
            return;
          }
        }
        if (!rewardSummary) {
          clampEnemyPartyHp();
          rewardSummary = buildRewardSummary();
          victoryGoldReward = rewardSummary.gold;
          messageTimer = 0;
          phase = 'reward';
          Game.Audio.stopBgm();
          var victoryBgm = null;
          if (enemy && enemy.victoryTheme) {
            victoryBgm = enemy.victoryTheme;
          } else if (npcRef && npcRef.victoryTheme) {
            victoryBgm = npcRef.victoryTheme;
          } else if (currentGimmick && currentGimmick.victory_bgm) {
            victoryBgm = currentGimmick.victory_bgm;
          }
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
          enemyRollAnimation = null;
          pendingEnemyAttack = null;
          enemyParty = [];
          Game.Audio.playSfx('confirm');
          var victoryPayload = {
            result: 'victory',
            npc: npcRef,
            enemyId: battleEnemyIds.length ? battleEnemyIds[0] : null,
            enemyIds: battleEnemyIds.slice(),
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
        enemyRollAnimation = null;
        pendingEnemyAttack = null;
        enemyParty = [];
        rewardSummary = null;
        return { result: 'defeat' };

  }

  function handleRitualFailPhase() {
        active = false;
        Game.Audio.stopBgm();
        var failStyle = ritualRuntime ? ritualRuntime.ritualFailStyle : null;
        ritualRuntime = null;
        enemyRollAnimation = null;
        pendingEnemyAttack = null;
        enemyParty = [];
        rewardSummary = null;
        return {
          result: 'ritual_fail',
          enemyId: enemy && enemy._enemyId ? enemy._enemyId : null,
          returnEventId: failStyle ? failStyle.returnEventId : null,
          failText: failStyle ? failStyle.text : message
        };

  }

  function handleUseItemPhase() {
        var attackPreview = previewEnemyPartyAttack();
        phase = 'enemyAttack';
        if (attackPreview.activeAttackers.length > 0) {
          pendingEnemyAttack = attackPreview;
          startEnemyRollAnimation(attackPreview);
        } else {
          pendingEnemyAttack = null;
          applyEnemyPartyAttack(attackPreview);
        }

  }

  function handleFleePhase() {
        active = false;
        Game.Audio.stopBgm();
        Game.Audio.playBgm('field');
        ritualRuntime = null;
        enemyRollAnimation = null;
        pendingEnemyAttack = null;
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
        openBattleItemMenu();
        break;
      case 'skills':
        openSkillMenu();
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
          animTimer = PLAYER_ACTION_RECOVERY_FRAMES;
        }
        break;
      case 'drop_item_to_eye_slot':
        if (ritualRuntime && ritualRuntime.ritualMode === 'repair_eye') {
          resolveRepairEyeAction();
        } else {
          openRitualItemMenu(entry.id);
        }
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

    if (selected.item.type === 'battle') {
      Game.Player.removeItem(selected.id);
      if (selected.item.effect === 'slow_roll') {
        addEffect(playerEffects, 'slow_roll', 1, 1);
        message = selected.item.name + 'を使った！ 手元の景色がゆっくり見える。';
      } else if (selected.item.effect === 'focus_bundle') {
        addEffect(playerEffects, 'slow_roll', 1, 1);
        addEffect(playerEffects, 'steady_floor', 1, selected.item.value || 4);
        message = selected.item.name + 'を鳴らした。次の一投へ心拍が揃う。';
      } else if (selected.item.effect === 'steady_floor') {
        addEffect(playerEffects, 'steady_floor', 1, selected.item.value || 3);
        message = selected.item.name + 'を使った！ 低い目を見切る備えが整った。';
      } else if (selected.item.effect === 'dice_bonus') {
        addEffect(playerEffects, 'dice_bonus', 1, selected.item.value || 2);
        message = selected.item.name + 'を使った！ 次の出目に勘が乗る。';
      } else if (selected.item.effect === 'silk_focus') {
        addEffect(playerEffects, 'slow_roll', 1, 1);
        addEffect(playerEffects, 'dice_bonus', 1, selected.item.value || 2);
        message = selected.item.name + 'をしおり代わりにかざした。白糸が目を導く。';
      } else if (selected.item.effect === 'enemy_roll_slow') {
        addEffectToLivingEnemies('enemy_roll_slow', 1, selected.item.value || 6);
        message = selected.item.name + 'を使った！ 敵の白い賽が重く鈍る。';
      } else if (selected.item.effect === 'defense_up') {
        addEffect(playerEffects, 'defense_up', selected.item.turns || 2, selected.item.value || 4);
        message = selected.item.name + 'を使った！ 守りの間合いが整った。';
      } else if (selected.item.effect === 'attack_up') {
        addEffect(playerEffects, 'attack_up', selected.item.turns || 2, selected.item.value || 5);
        message = selected.item.name + 'を使った！ 攻めの気配が研ぎ澄まされた。';
      } else if (selected.item.effect === 'steam_reset') {
        var soothed = removeEffect(playerEffects, 'slow');
        soothed = removeEffect(playerEffects, 'heal_seal') || soothed;
        addEffect(playerEffects, 'onsen_heal', selected.item.turns || 2, selected.item.value || 4);
        var restoredCharges = Game.Player && Game.Player.restoreAllSkillCharges ? Game.Player.restoreAllSkillCharges(1) : 0;
        if (soothed && restoredCharges > 0) {
          message = selected.item.name + 'を開いた。鈍りがほどけ、型の記憶も少し戻った。';
        } else if (soothed) {
          message = selected.item.name + 'を開いた。鈍りと封じが湯気にほどけた。';
        } else if (restoredCharges > 0) {
          message = selected.item.name + 'を開いた。湯気がまとわり、型の息遣いを思い出す。';
        } else {
          message = selected.item.name + 'を開いた。湯気がまとわり、息が整う。';
        }
      } else if (selected.item.effect === 'ward') {
        addEffect(playerEffects, 'ward', 1, selected.item.value || 8);
        message = selected.item.name + 'を使った！ 返しの余白が足元に宿る。';
      } else if (selected.item.effect === 'ignite_next') {
        addEffect(playerEffects, 'ignite_next', 1, 5);
        message = selected.item.name + 'を使った！ 次の一投が熱を帯びる。';
      } else {
        message = selected.item.name + 'を使った。';
      }
      messageTimer = 45;
      Game.Audio.playSfx('item');
      itemMenuItems = [];
      itemMenuIndex = 0;
      itemMenuMode = 'heal';
      ritualMenuActionId = null;
      phase = 'playerAttack';
      animTimer = PLAYER_ACTION_RECOVERY_FRAMES;
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

  function useSelectedSkill() {
    if (!skillMenuEntries.length) {
      phase = 'menu';
      return;
    }
    var selected = skillMenuEntries[skillMenuIndex];
    if (!selected || !selected.skill) {
      phase = 'menu';
      return;
    }
    if (selected.disabled) {
      message = selected.skill.name + 'はもう使い切った。';
      messageTimer = 40;
      Game.Audio.playSfx('cancel');
      phase = 'menu';
      return;
    }

    var skill = selected.skill;
    if (!Game.Player || !Game.Player.consumeSkillCharge || !Game.Player.consumeSkillCharge(skill.id, 1)) {
      message = skill.name + 'はもう使い切った。';
      messageTimer = 40;
      Game.Audio.playSfx('cancel');
      phase = 'menu';
      return;
    }
    if (skill.id === 'mikiashi') {
      addEffect(playerEffects, 'slow_roll', 1, 1);
      message = '見切り足。白い目の動きがゆるむ。';
    } else if (skill.id === 'kasanekan') {
      addEffect(playerEffects, 'dice_bonus', 1, 2);
      message = '重ね勘。次の目に手応えが乗る。';
    } else if (skill.id === 'migamae') {
      addEffect(playerEffects, 'defense_up', 2, 4);
      message = '身構え。肩の力を抜いて守りを作る。';
    } else if (skill.id === 'hibashiri') {
      addEffect(playerEffects, 'ignite_next', 1, 5);
      message = '火走り。賽の縁がほの赤く灯る。';
    } else if (skill.id === 'shirosenyomi') {
      addEffect(enemyEffects, 'stun', 1, 0);
      message = '白線読み。相手の踏み出しが半歩遅れた。';
    } else if (skill.id === 'tsumugibreathe') {
      var cleared = removeEffect(playerEffects, 'slow');
      cleared = removeEffect(playerEffects, 'heal_seal') || cleared;
      addEffect(playerEffects, 'onsen_heal', 2, 4);
      message = cleared ? '紡ぎ息。鈍りと封じがほどけた。' : '紡ぎ息。呼吸が整い、体が軽い。';
    } else if (skill.id === 'kaminariyobi') {
      addEffect(playerEffects, 'attack_up', 2, 6);
      addEffect(playerEffects, 'dice_bonus', 1, 1);
      message = '雷呼び。空気がぴりりと尖る。';
    } else if (skill.id === 'kaeriashi') {
      addEffect(playerEffects, 'ward', 1, 8);
      message = '返り足。受け流す余白を足元に残した。';
    } else if (skill.id === 'sokomiki') {
      addEffect(playerEffects, 'steady_floor', 1, 4);
      addEffect(playerEffects, 'ward', 1, 6);
      message = '底見切り。低い目でも崩れない芯を作った。';
    } else if (skill.id === 'yunomatoi') {
      var soothed = removeEffect(playerEffects, 'slow');
      soothed = removeEffect(playerEffects, 'heal_seal') || soothed;
      addEffect(playerEffects, 'defense_up', 2, 3);
      addEffect(playerEffects, 'onsen_heal', 2, 3);
      message = soothed ? '湯まとい。鈍りがほどけ、守りに湯気が残る。' : '湯まとい。薄い湯気が体を包み、守りが整う。';
    } else if (skill.id === 'hakokuzushi') {
      addEffect(enemyEffects, 'stun', 1, 0);
      addEffect(playerEffects, 'dice_bonus', 1, 1);
      message = '荷崩し。相手の重心がわずかに浮いた。';
    } else if (skill.id === 'karakaze') {
      addEffect(playerEffects, 'slow_roll', 1, 1);
      addEffect(playerEffects, 'attack_up', 2, 4);
      message = '空っ風。呼吸が研がれ、踏み込みが軽くなる。';
    } else if (skill.id === 'itoyurai') {
      addEffectToLivingEnemies('enemy_roll_slow', 2, 6);
      addEffect(playerEffects, 'dice_bonus', 1, 1);
      message = '糸ゆらい。敵の白い賽が細く揺れて鈍る。';
    } else {
      message = skill.name + 'を放った。';
    }

    messageTimer = 45;
    phase = 'playerAttack';
    animTimer = PLAYER_ACTION_RECOVERY_FRAMES;
    Game.Audio.playSfx('confirm');
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

  function drawMiniEnemyDie(ctx, die) {
    var dotPositions = {
      1: [[0, 0]],
      2: [[-1, -1], [1, 1]],
      3: [[-1, -1], [0, 0], [1, 1]],
      4: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
      5: [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]],
      6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]]
    };
    var half = die.size / 2;
    var pipRadius = Math.max(1.4, die.size * 0.08);
    var pipGap = die.size * 0.2;
    var dots = dotPositions[die.face] || dotPositions[1];
    var scale = die.scale || 1;

    ctx.save();
    ctx.translate(die.x, die.y);
    ctx.rotate(die.rotation);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(20, 24, 34, 0.28)';
    ctx.fillRect(-half + 2, -half + 2, die.size, die.size);
    ctx.fillStyle = '#f8fbff';
    ctx.fillRect(-half, -half, die.size, die.size);
    ctx.strokeStyle = '#cfd8ea';
    ctx.lineWidth = 1;
    ctx.strokeRect(-half, -half, die.size, die.size);
    ctx.fillStyle = '#3a4357';
    for (var i = 0; i < dots.length; i++) {
      ctx.beginPath();
      ctx.arc(dots[i][0] * pipGap, dots[i][1] * pipGap, pipRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemyRollAnimation(R, ctx, C) {
    if (!enemyRollAnimation || !enemyRollAnimation.dice || !enemyRollAnimation.dice.length) return;
    var stage = getEnemyRollStage(enemyRollAnimation);
    var elapsed = enemyRollAnimation.maxTimer - enemyRollAnimation.timer;
    var charge = enemyRollAnimation.windupFrames > 0 ? Math.min(1, elapsed / enemyRollAnimation.windupFrames) : 1;
    var panelAlpha = stage === 'windup' ? (0.08 + charge * 0.08) : 0.16;
    ctx.fillStyle = 'rgba(244, 248, 255, ' + panelAlpha.toFixed(3) + ')';
    ctx.fillRect(104, 100, 292, 100);
    ctx.strokeStyle = 'rgba(220, 232, 255, 0.15)';
    ctx.strokeRect(104.5, 100.5, 291, 99);
    ctx.fillStyle = 'rgba(255, 232, 182, 0.10)';
    ctx.fillRect(116, 190, 268 * (stage === 'windup' ? charge : 1), 2);
    for (var i = 0; i < enemyRollAnimation.dice.length; i++) {
      var die = enemyRollAnimation.dice[i];
      if (die.delay > 0) continue;
      if (stage !== 'windup') {
        ctx.strokeStyle = 'rgba(226, 236, 255, 0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(die.x - die.vx * 2.2, die.y - die.vy * 0.6);
        ctx.lineTo(die.x, die.y);
        ctx.stroke();
      } else {
        die.scale = 0.88 + charge * 0.18;
      }
      if (stage !== 'windup') die.scale = 1;
      drawMiniEnemyDie(ctx, die);
    }
    if (enemyRollAnimation.attackers && enemyRollAnimation.attackers.length) {
      var attackerLabel = clampBattleText(enemyRollAnimation.attackers.join(' / '), 18);
      var cue = stage === 'windup'
        ? (enemyRollAnimation.slowed ? '…ゴト' : '…コト')
        : (stage === 'settle'
          ? (enemyRollAnimation.slowed ? 'ゴロン…' : 'コロン…')
          : (enemyRollAnimation.slowed ? 'ゴロゴロ…' : 'コロコロ…'));
      R.drawTextJP(attackerLabel, 116, 106, '#aebcd8', 8);
      R.drawTextJP(cue, 346, 104, '#dfe7f7', 9);
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

  function isBattleMessageVisible() {
    return !!(message && phase !== 'reward' && !isBossActionOverlayVisible());
  }

  function isDialogueOverlayVisible() {
    return !!(dialogueText && (dialogueWaitingConfirm || dialogueTimer > 0) && !isBossActionOverlayVisible());
  }

  function getActionPanelY(preferredY, panelHeight) {
    var safeBottom = isBattleMessageVisible() ? 272 : 308;
    var y = Math.min(preferredY, safeBottom - panelHeight);
    return Math.max(146, y);
  }

  function getItemMenuFooter(selectedEntry) {
    if (!selectedEntry || !selectedEntry.item) {
      return { leftText: '', leftColor: '#88dd88', rightText: 'Xで戻る' };
    }

    if (itemMenuMode === 'ritual') {
      var requiredId = ritualRuntime && ritualRuntime.ritualItemRequirement ? ritualRuntime.ritualItemRequirement : null;
      var matches = !requiredId || selectedEntry.id === requiredId;
      return {
        leftText: matches ? '欠け目に応える' : 'まだ噛み合わない',
        leftColor: matches ? '#ffd66b' : '#d59b9b',
        rightText: 'Xで戻る'
      };
    }

    if (selectedEntry.item.type === 'battle') {
      return {
        leftText: selectedEntry.item.desc,
        leftColor: '#8fe0ff',
        rightText: 'Xで戻る'
      };
    }

    return {
      leftText: 'HP+' + selectedEntry.item.healAmount,
      leftColor: '#88dd88',
      rightText: 'Xで戻る'
    };
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
    if (enemy && enemy.battleBackdrop) return enemy.battleBackdrop;
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

  function drawRequiemBackdrop(R, ctx, C) {
    ctx.fillStyle = '#08070d';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    ctx.fillStyle = '#16131f';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, 88);
    ctx.fillStyle = '#4b3342';
    ctx.fillRect(0, 88, C.CANVAS_WIDTH, 14);

    ctx.fillStyle = '#0d0e17';
    ctx.beginPath();
    ctx.moveTo(0, 136);
    ctx.lineTo(72, 114);
    ctx.lineTo(140, 122);
    ctx.lineTo(214, 102);
    ctx.lineTo(300, 128);
    ctx.lineTo(370, 108);
    ctx.lineTo(480, 120);
    ctx.lineTo(480, 320);
    ctx.lineTo(0, 320);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#15141d';
    ctx.fillRect(0, 172, C.CANVAS_WIDTH, 148);
    ctx.fillStyle = '#0e1018';
    for (var fence = 0; fence < 7; fence++) {
      var fx = 32 + fence * 62;
      ctx.fillRect(fx, 154, 5, 54);
      ctx.fillRect(fx - 12, 166, 30, 4);
      ctx.fillRect(fx - 8, 188, 22, 3);
    }

    ctx.fillStyle = 'rgba(216,198,156,0.08)';
    for (var rail = 0; rail < 6; rail++) {
      ctx.fillRect(0, 148 + rail * 18, C.CANVAS_WIDTH, 1);
    }

    ctx.fillStyle = 'rgba(214, 198, 154, 0.16)';
    ctx.beginPath();
    ctx.moveTo(118, 320);
    ctx.lineTo(186, 186);
    ctx.lineTo(292, 186);
    ctx.lineTo(362, 320);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#d9c39a';
    for (var mote = 0; mote < 18; mote++) {
      var mx = (mote * 31 + turnCount * 1.5) % C.CANVAS_WIDTH;
      var my = 24 + (mote * 13 % 92);
      ctx.fillRect(mx, my, 2, 2);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (var drift = 0; drift < 8; drift++) {
      var dx = ((drift * 70) - turnCount * 2) % (C.CANVAS_WIDTH + 120);
      if (dx < -120) dx += C.CANVAS_WIDTH + 120;
      ctx.fillRect(dx - 40, 106 + drift * 14, 110, 6);
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
    } else if (backdropId === 'field_requiem') {
      drawRequiemBackdrop(R, ctx, C);
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
    } else if (bg === 'field_requiem') {
      for (var j = 0; j < 34; j++) {
        atmosParticles.push({
          x: Math.random() * Game.Config.CANVAS_WIDTH,
          y: Math.random() * Game.Config.CANVAS_HEIGHT,
          vx: -(1.2 + Math.random() * 1.4),
          vy: 0.15 + Math.random() * 0.35,
          size: 1 + Math.random() * 2,
          life: 80 + Math.random() * 120
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
    } else if (bg === 'field_requiem') {
      ctx.fillStyle = 'rgba(255, 244, 220, 0.04)';
      ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
      for (var j = 0; j < atmosParticles.length; j++) {
        var mote = atmosParticles[j];
        mote.x += mote.vx;
        mote.y += mote.vy;
        mote.life--;
        if (mote.x < -12 || mote.y > C.CANVAS_HEIGHT + 8 || mote.life <= 0) {
          mote.x = C.CANVAS_WIDTH + Math.random() * 40;
          mote.y = Math.random() * 120;
          mote.life = 80 + Math.random() * 120;
        }
        var glowAlpha = Math.max(0, mote.life / 200) * 0.24;
        ctx.fillStyle = 'rgba(223, 206, 171, ' + glowAlpha.toFixed(3) + ')';
        ctx.fillRect(Math.floor(mote.x), Math.floor(mote.y), mote.size + 1, 1);
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

  function drawBossActionOverlay(R, ctx, C) {
    if (!isBossActionOverlayVisible()) return;
    var overlay = bossActionOverlay;
    var elapsed = overlay.maxTimer - overlay.timer;
    var fadeIn = Math.min(1, elapsed / 8);
    var fadeOut = overlay.timer < 8 ? overlay.timer / 8 : 1;
    var alpha = Math.max(0.25, Math.min(fadeIn, fadeOut));
    var pulse = Math.sin(elapsed * 0.32) * 0.5 + 0.5;
    var panelW = 320;
    var panelH = overlay.kind === 'special_move' ? 74 : 68;
    var panelX = Math.floor((C.CANVAS_WIDTH - panelW) / 2);
    var panelY = overlay.kind === 'special_move' ? 84 : 92;

    ctx.fillStyle = 'rgba(8, 10, 20, ' + (0.30 + alpha * 0.28).toFixed(2) + ')';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    for (var streak = 0; streak < 7; streak++) {
      var sway = (elapsed * (4 + streak) + streak * 32) % (C.CANVAS_WIDTH + 120) - 60;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.03 + pulse * 0.04).toFixed(2) + ')';
      ctx.fillRect(Math.floor(sway), 56 + streak * 28, 104 + streak * 18, 2);
    }

    ctx.fillStyle = overlay.shadow;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.fillStyle = overlay.veil;
    ctx.fillRect(panelX + 8, panelY + 8, panelW - 16, panelH - 16);
    ctx.fillStyle = overlay.accent;
    ctx.fillRect(panelX + 14, panelY + 14, panelW - 28, 3);
    ctx.fillRect(panelX + 14, panelY + panelH - 16, panelW - 28, 2);
    ctx.fillRect(panelX + 8, panelY + 12, 4, panelH - 24);
    ctx.fillRect(panelX + panelW - 12, panelY + 12, 4, panelH - 24);

    for (var li = 0; li < overlay.lines.length; li++) {
      R.drawTextJP(overlay.lines[li], 240, panelY + 28 + li * 18, li === 0 ? overlay.accent : '#ffffff', 18, 'center');
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
      bossAction: isBossActionOverlayVisible() ? {
        kind: bossActionOverlay.kind,
        title: bossActionOverlay.title,
        subtitle: bossActionOverlay.subtitle,
        timer: bossActionOverlay.timer,
        lines: bossActionOverlay.lines.slice()
      } : null,
      enemyRoll: enemyRollAnimation ? {
        timer: enemyRollAnimation.timer,
        attackers: enemyRollAnimation.attackers ? enemyRollAnimation.attackers.slice() : [],
        diceCount: enemyRollAnimation.dice ? enemyRollAnimation.dice.length : 0
      } : null,
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
      itemMenu: phase === 'itemMenu' ? itemMenuItems.map(function(entry, index) {
        return {
          id: entry.id,
          name: entry.item.name,
          type: entry.item.type,
          selected: index === itemMenuIndex
        };
      }) : null,
      skillMenu: phase === 'skillMenu' ? skillMenuEntries.map(function(entry, index) {
        return {
          id: entry.id,
          name: entry.skill.name,
          shortDesc: entry.skill.shortDesc || entry.skill.desc,
          remaining: entry.remaining,
          selected: index === skillMenuIndex,
          disabled: entry.disabled
        };
      }) : null,
      playerEffects: playerEffects.map(function(effect) {
        return {
          type: effect.type,
          turnsLeft: effect.turnsLeft,
          value: effect.value
        };
      }),
      enemyEffects: enemyEffects.map(function(effect) {
        return {
          type: effect.type,
          turnsLeft: effect.turnsLeft,
          value: effect.value
        };
      }),
      ritual: ritualRuntime ? {
        mode: ritualRuntime.ritualMode,
        gauge: ritualRuntime.ritualGauge,
        targetZone: ritualRuntime.ritualTargetZone,
        hintState: ritualRuntime.ritualHintState,
        slots: ritualRuntime.ritualSlots,
        state: ritualRuntime.ritualState
      } : null,
      dialogue: dialogueText ? {
        speaker: dialogueSpeaker,
        text: dialogueText,
        timer: dialogueTimer,
        waitingConfirm: dialogueWaitingConfirm,
        queued: dialogueQueue.length
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
      if (isBossActionOverlayVisible()) {
        ex += Math.sin((bossActionOverlay.maxTimer - bossActionOverlay.timer) * 0.5) * 3;
      }
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
          case 'enemy_roll_slow': eLabel = '鈍'; eCol = '#a6e7ff'; break;
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
    drawEnemyRollAnimation(R, ctx, C);

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
        case 'slow_roll': pLabel = '緩'; pCol = '#8fe0ff'; break;
        case 'steady_floor': pLabel = '底'; pCol = '#cdd7ff'; break;
        case 'ignite_next': pLabel = '火'; pCol = '#ff8855'; break;
        case 'ward': pLabel = '返'; pCol = '#d9b7ff'; break;
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
    if (gimmickMessageTimer > 0 && !isBossActionOverlayVisible()) {
      gimmickMessageTimer--;
      R.drawRectAbsolute(40, 165, 400, 20, 'rgba(80,20,20,0.85)');
      R.drawTextJP(gimmickMessage, 50, 168, '#ff8866', 12);
    }

    // Boss dialogue overlay (phase change / special move / victory lines)
    if (dialogueText && (dialogueWaitingConfirm || dialogueTimer > 0) && !isBossActionOverlayVisible()) {
      R.drawRectAbsolute(20, 125, 440, 36, 'rgba(10,10,30,0.92)');
      if (dialogueSpeaker) {
        R.drawTextJP(dialogueSpeaker, 30, 128, '#ffcc44', 11);
      }
      R.drawTextJP(dialogueText, 30, 143, '#ffffff', 13);
      R.drawTextJP('Space / Z / Enter', 376, 144, '#c8d0e8', 9);
    }

    // Menu
    if (phase === 'menu' && messageTimer <= 0 && !isDialogueOverlayVisible() && !isBossActionOverlayVisible()) {
      var currentMenuEntries = getMenuEntries();
      var menuHeight = Math.max(80, 18 + currentMenuEntries.length * 22);
      var menuY = getActionPanelY(200, menuHeight);
      R.drawDialogBox(300, menuY, 160, menuHeight);
      drawBattlePanelAccent(R, 300, menuY, 160, menuHeight, '#ffd66b');
      R.drawTextJP('行動', 314, menuY + 4, '#ffd66b', 10);
      for (var i = 0; i < currentMenuEntries.length; i++) {
        var sealed = (sealedCommand >= 0 && i === sealedCommand);
        var color = sealed ? '#555' : (i === menuIndex) ? C.COLORS.GOLD : '#fff';
        var prefix = (i === menuIndex) ? '▶ ' : '  ';
        var baseLabel = currentMenuEntries[i].label;
        var label = sealed ? baseLabel + '×' : baseLabel;
        if (i === menuIndex) {
          R.drawRectAbsolute(312, menuY + 14 + i * 22, 134, 16, 'rgba(255,204,0,0.12)');
        }
        R.drawTextJP(prefix + label, 315, menuY + 12 + i * 22, color, 14);
      }
    }

    if (phase === 'itemMenu' && messageTimer <= 0 && !isDialogueOverlayVisible() && !isBossActionOverlayVisible()) {
      var itemMenuY = getActionPanelY(184, 96);
      R.drawDialogBox(280, itemMenuY, 180, 96);
      drawBattlePanelAccent(R, 280, itemMenuY, 180, 96, '#8fe0ff');
      R.drawTextJP('もちもの', 292, itemMenuY + 4, '#8fe0ff', 10);
      for (var ii = 0; ii < itemMenuItems.length; ii++) {
        var selected = (ii === itemMenuIndex);
        var itemName = itemMenuItems[ii].item.name;
        var prefix2 = selected ? '▶ ' : '  ';
        var col2 = selected ? C.COLORS.GOLD : '#fff';
        if (selected) {
          R.drawRectAbsolute(290, itemMenuY + 12 + ii * 18, 148, 14, 'rgba(143,224,255,0.1)');
        }
        R.drawTextJP(prefix2 + itemName, 292, itemMenuY + 10 + ii * 18, col2, 12);
      }
      if (itemMenuItems[itemMenuIndex]) {
        var footer = getItemMenuFooter(itemMenuItems[itemMenuIndex]);
        R.drawTextJP(footer.leftText, 292, itemMenuY + 68, footer.leftColor, 11);
        R.drawTextJP(footer.rightText, 392, itemMenuY + 68, '#888', 10);
      }
    }

    if (phase === 'skillMenu' && messageTimer <= 0 && !isDialogueOverlayVisible() && !isBossActionOverlayVisible()) {
      var skillMenuY = getActionPanelY(178, 104);
      R.drawDialogBox(262, skillMenuY, 198, 104);
      drawBattlePanelAccent(R, 262, skillMenuY, 198, 104, '#cdb7ff');
      R.drawTextJP('とくぎ', 274, skillMenuY + 4, '#cdb7ff', 10);
      for (var sk = 0; sk < skillMenuEntries.length; sk++) {
        var skillEntry = skillMenuEntries[sk];
        var activeSkill = (sk === skillMenuIndex);
        var skillColor = skillEntry.disabled ? '#66708a' : (activeSkill ? C.COLORS.GOLD : '#ffffff');
        if (activeSkill) {
          R.drawRectAbsolute(272, skillMenuY + 12 + sk * 14, 170, 12, 'rgba(205,183,255,0.10)');
        }
        R.drawTextJP((activeSkill ? '▶ ' : '  ') + skillEntry.skill.name, 274, skillMenuY + 10 + sk * 14, skillColor, 10);
        R.drawTextJP(String(skillEntry.remaining), 438, skillMenuY + 10 + sk * 14, skillEntry.disabled ? '#66708a' : '#cfd7f2', 9, 'right');
      }
      if (skillMenuEntries[skillMenuIndex]) {
        var selectedSkill = skillMenuEntries[skillMenuIndex].skill;
        R.drawTextJP(clampBattleText(selectedSkill.shortDesc || selectedSkill.desc, 21), 274, skillMenuY + 84, '#dbe3ff', 9);
      }
    }

    if (phase === 'reward' && rewardSummary) {
      var currentExp = Game.Player.getData().experience || 0;
      var previewExp = Game.Player.previewExperienceGain
        ? Game.Player.previewExperienceGain(rewardSummary.exp || 0)
        : null;
      var nextExp = previewExp ? previewExp.experience : (currentExp + (rewardSummary.exp || 0));
      var currentRank = previewExp ? previewExp.previousRank : (Game.Player.getJourneyRank ? Game.Player.getJourneyRank() : 1);
      var nextRank = previewExp ? previewExp.newRank : (1 + Math.floor(nextExp / 80));
      var rewardItems = getRewardItemLabels(rewardSummary.items || []);
      var supportLogs = rewardSummary.supportLogs || [];
      var afterglowLines = rewardSummary.afterglowText ? wrapBattleText(rewardSummary.afterglowText, 24, 2) : [];
      var enemyEchoLines = rewardSummary.enemyEchoText ? wrapBattleText(rewardSummary.enemyEchoText, 24, 3) : [];
      var rewardItemLines = wrapBattleText(rewardItems.length ? rewardItems.join(' / ') : 'なし', 22, 2);
      var growthLines = [];
      if (previewExp && previewExp.levelUps && previewExp.levelUps.length) {
        growthLines.push('最大HP +' + previewExp.totalGains.hp);
        growthLines.push('攻撃 +' + previewExp.totalGains.attack + ' / 防御 +' + previewExp.totalGains.defense);
      } else if (previewExp) {
        growthLines.push('次のランクまで あと' + previewExp.remainingToNextRank);
      }
      var panelH = 140 +
        (growthLines.length ? 18 + growthLines.length * 12 : 0) +
        (afterglowLines.length ? 28 + afterglowLines.length * 12 : 0) +
        (enemyEchoLines.length ? 18 + enemyEchoLines.length * 12 : 0) +
        (supportLogs.length ? 18 + supportLogs.length * 12 : 0);
      var panelY = Math.max(18, C.CANVAS_HEIGHT - panelH - 12);

      R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, 'rgba(8, 10, 18, 0.56)');
      R.drawDialogBox(92, panelY, 296, panelH);
      drawBattlePanelAccent(R, 92, panelY, 296, panelH, '#ffd66b');
      R.drawTextJP('戦果', 106, panelY + 16, '#ffd66b', 12);
      R.drawTextJP('獲得金', 106, panelY + 36, '#8fe0ff', 11);
      R.drawTextJP('+' + (rewardSummary.gold || 0) + 'G', 196, panelY + 36, '#ffffff', 12);
      R.drawTextJP('旅の経験', 106, panelY + 54, '#8fe0ff', 11);
      R.drawTextJP('+' + (rewardSummary.exp || 0), 196, panelY + 54, '#ffffff', 12);
      R.drawTextJP('累計経験', 106, panelY + 72, '#8fe0ff', 11);
      R.drawTextJP(currentExp + ' → ' + nextExp, 196, panelY + 72, '#ffffff', 12);
      if (nextRank > currentRank) {
        R.drawTextJP('旅路ランク ' + currentRank + ' → ' + nextRank, 106, panelY + 90, '#ffd66b', 11);
      } else {
        R.drawTextJP('旅路ランク ' + currentRank, 106, panelY + 90, '#d8dce8', 11);
      }
      R.drawTextJP('戦利品', 106, panelY + 108, '#8fe0ff', 11);
      for (var ri = 0; ri < rewardItemLines.length; ri++) {
        R.drawTextJP(rewardItemLines[ri], 170, panelY + 108 + ri * 12, '#ffffff', 11);
      }

      var rewardY = panelY + 108 + rewardItemLines.length * 12 + 8;
      if (growthLines.length) {
        R.drawTextJP(nextRank > currentRank ? '成長' : 'つぎの目安', 106, rewardY, '#ffd66b', 11);
        for (var gi = 0; gi < growthLines.length; gi++) {
          R.drawTextJP(growthLines[gi], 146, rewardY + gi * 12, nextRank > currentRank ? '#fff4c6' : '#d9deeb', 10);
        }
        rewardY += 18 + growthLines.length * 12;
      }
      if (afterglowLines.length) {
        R.drawTextJP('余韻', 106, rewardY, '#ffd66b', 11);
        for (var ai = 0; ai < afterglowLines.length; ai++) {
          R.drawTextJP(afterglowLines[ai], 142, rewardY + ai * 12, '#f4eed7', 10);
        }
        rewardY += afterglowLines.length * 12 + 18;
      }

      if (enemyEchoLines.length) {
        R.drawTextJP('残響', 106, rewardY, '#ffb36b', 11);
        for (var ei = 0; ei < enemyEchoLines.length; ei++) {
          R.drawTextJP(enemyEchoLines[ei], 142, rewardY + ei * 12, '#f3e3d9', 10);
        }
        rewardY += enemyEchoLines.length * 12 + 18;
      }

      if (supportLogs.length) {
        R.drawTextJP('同行支援', 106, rewardY, '#8fe0ff', 11);
        for (var si = 0; si < Math.min(3, supportLogs.length); si++) {
          R.drawTextJP(supportLogs[si].text, 106, rewardY + 12 + si * 12, supportLogs[si].color || '#dce6ff', 10);
        }
        rewardY += 18 + Math.min(3, supportLogs.length) * 12;
      }

      R.drawTextJP('Space / Z / Enter で進む', 236, panelY + panelH - 18, '#b7bfd8', 10);
    }

    drawBossActionOverlay(R, ctx, C);

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
    if (message && phase !== 'reward' && !isBossActionOverlayVisible()) {
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
            var steadyFloor = getEffectBonus(playerEffects, 'steady_floor');
            var steadyFloorBoosted = 0;
            for (var j = 0; j < diceResults.length; j++) {
              var parsed = parseFace(diceResults[j]);
              if (parsed.type === 'damage' && parsed.value > 0 && steadyFloor > 0 && parsed.value < steadyFloor) {
                parsed.value = steadyFloor;
                steadyFloorBoosted++;
              }
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
            var diceBonus = getEffectBonus(playerEffects, 'dice_bonus');
            var enemyDefReduction = hasEffect(enemyEffects, 'stun') ? Math.floor(enemy.defense / 2) : 0;

            phase = 'diceResult';
            animTimer = PLAYER_DICE_RESULT_FRAMES;

            // Apply damage with combo multiplier
            var baseDmg = damageTotal + diceBonus + Game.Player.getAttack() + atkBonus - (enemy.defense - enemyDefReduction);
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

            var igniteNext = hasEffect(playerEffects, 'ignite_next');
            if (igniteNext && dmg > 0) {
              addEffect(enemyEffects, 'burn', 3, Math.max(4, igniteNext.value || 5));
              removeEffect(playerEffects, 'ignite_next');
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
            if (steadyFloorBoosted > 0) {
              msgParts.push('低い目を整えた');
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

            if (Game.Achievements && Game.Achievements.check) {
              var sameRoll = true;
              var firstValue = null;
              for (var rv = 0; rv < diceResults.length; rv++) {
                var resultFace = parseFace(diceResults[rv]);
                if (resultFace.type !== 'damage') continue;
                if (firstValue === null) {
                  firstValue = resultFace.value;
                } else if (firstValue !== resultFace.value) {
                  sameRoll = false;
                }
                if (battleDice[rv] && battleDice[rv].id === 'gamblerDice' && resultFace.value === 12) {
                  Game.Achievements.check('gambler_12');
                }
              }
              if (sameRoll && firstValue !== null && diceResults.length >= 2) {
                Game.Achievements.check('all_same_roll');
              }
              if (dmg >= 50) {
                Game.Achievements.check('thunder_50');
              }
              if (healTotal + onsenHeal > 0) {
                Game.Achievements.check({ type: 'heal', amount: healTotal + onsenHeal });
              }
            }

            var ritualOutcome = evaluateRitualOutcome();
            if (ritualOutcome) {
              return;
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
                gimmickMessage = buildBossActionSummary('phase_change', currentGimmick.phase_change, []);
                gimmickMessageTimer = 40;
                startBossActionOverlay('phase_change', currentGimmick.phase_change, pcMsg);
                playBossSfx('phase_change');
                queueBossActionDialogue('phase_change', currentGimmick.phase_change, pcMsg);
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
    getAllBossGimmicks: function() { return bossGimmicks; },
    debugForceBossCue: function(kind) {
      if (!active || !enemy || !currentGimmick) return false;
      if (kind === 'phase_change' && currentGimmick.phase_change) {
        var phaseText = currentGimmick.phase_change.action ? currentGimmick.phase_change.action(enemy) : '';
        gimmickMessage = buildBossActionSummary('phase_change', currentGimmick.phase_change, []);
        gimmickMessageTimer = 40;
        startBossActionOverlay('phase_change', currentGimmick.phase_change, phaseText);
        queueBossActionDialogue('phase_change', currentGimmick.phase_change, phaseText);
        return true;
      }
      if (kind === 'special_move' && currentGimmick.special_move) {
        gimmickMessage = buildBossActionSummary('special_move', currentGimmick.special_move, []);
        gimmickMessageTimer = 44;
        startBossActionOverlay('special_move', currentGimmick.special_move, currentGimmick.special_move.message || currentGimmick.special_move.description);
        queueBossActionDialogue('special_move', currentGimmick.special_move, currentGimmick.special_move.message || currentGimmick.special_move.description);
        return true;
      }
      return false;
    }
  };
})();
