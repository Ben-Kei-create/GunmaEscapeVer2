// Battle system with special dice, status effects, combo, and boss phases
Game.Battle = (function() {
  var active = false;
  var enemy = null;
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

  // Boss dialogue system: queued multi-line dialogue for phase_change/special/victory
  var dialogueQueue = [];      // array of { speaker, text }
  var dialogueTimer = 0;       // frames until next line auto-advances
  var dialogueSpeaker = '';     // current displayed speaker
  var dialogueText = '';        // current displayed text

  var enemies = {
    onsenMonkey: {
      name: '温泉猿',
      hp: 50, maxHp: 50,
      attack: 12, defense: 3, goldReward: 60,
      sprite: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,1,1,2,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,0,1,2,3,2,2,3,2,2,1,0,0,0,0],
        [0,0,0,1,2,2,2,4,2,2,2,1,0,0,0,0],
        [0,0,0,0,1,2,4,4,4,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,0,1,2,0,0,2,1,0,0,0,0,0,0],
        [0,0,0,0,1,2,0,0,2,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#553322', 2:'#aa7744', 3:'#111', 4:'#cc6666' }
    },
    ishidanGuard: {
      name: '石段番人',
      hp: 55, maxHp: 55,
      attack: 14, defense: 5, goldReward: 80,
      sprite: [
        [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,1,3,2,2,2,3,2,1,0,0,0,0,0],
        [0,0,0,1,2,2,4,4,2,2,1,0,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,1,5,5,5,5,5,5,1,0,0,0,0,0],
        [0,0,1,5,5,5,5,5,5,5,5,1,0,0,0,0],
        [0,0,1,5,5,5,5,5,5,5,5,1,0,0,0,0],
        [0,0,0,1,5,5,5,5,5,5,1,0,0,0,0,0],
        [0,0,0,1,5,5,5,5,5,5,1,0,0,0,0,0],
        [0,0,0,1,6,6,0,0,6,6,1,0,0,0,0,0],
        [0,0,0,1,6,6,0,0,6,6,1,0,0,0,0,0],
        [0,0,0,0,7,7,0,0,7,7,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#554433', 2:'#aa8866', 3:'#111', 4:'#cc9966', 5:'#665544', 6:'#443322', 7:'#332211' }
    },
    cabbage: {
      name: '巨大キャベツ',
      hp: 60, maxHp: 60,
      attack: 15, defense: 4, goldReward: 100,
      sprite: [
        [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,1,2,3,2,1,0,0,0,0,0,0],
        [0,0,0,0,1,2,3,2,3,2,1,0,0,0,0,0],
        [0,0,0,1,2,3,2,3,2,3,2,1,0,0,0,0],
        [0,0,1,2,3,2,3,2,3,2,3,2,1,0,0,0],
        [0,1,2,3,2,3,2,3,2,3,2,3,2,1,0,0],
        [1,2,3,2,3,2,3,2,3,2,3,2,3,2,1,0],
        [1,2,3,2,3,2,3,2,3,2,3,2,3,2,1,0],
        [0,1,2,3,2,3,2,3,2,3,2,3,2,1,0,0],
        [0,0,1,2,3,2,3,2,3,2,3,2,1,0,0,0],
        [0,0,0,1,2,3,2,3,2,3,2,1,0,0,0,0],
        [0,0,0,0,1,2,3,2,3,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,2,3,2,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#2d6e1e', 2:'#44bb44', 3:'#66dd66' }
    },
    // Chapter 2 enemies
    anguraGuard: {
      name: 'アングラの見張り',
      hp: 80, maxHp: 80,
      attack: 18, defense: 6, goldReward: 120,
      sprite: [
        [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,0,1,3,1,3,1,1,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,0,0,1,4,4,1,0,0,0,0,0,0,0,0,0],
        [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
        [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
        [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
        [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
        [0,0,1,5,5,5,5,1,0,0,0,0,0,0,0,0],
        [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
        [0,0,1,6,0,0,6,1,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#444', 3:'#ff0000', 4:'#333', 5:'#222', 6:'#111' }
    },
    chuji: {
      name: '国定忠治',
      hp: 120, maxHp: 120,
      attack: 22, defense: 8, goldReward: 200,
      sprite: [
        [0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [0,0,1,2,2,2,2,2,1,0,0,0,0,0,0,0],
        [0,0,1,3,2,2,3,2,1,0,0,0,0,0,0,0],
        [0,0,1,2,2,4,2,2,1,0,0,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,1,5,5,5,5,5,5,5,1,0,0,0,0,0,0],
        [1,5,5,5,5,5,5,5,5,5,1,0,0,0,0,0],
        [1,5,5,5,5,5,5,5,5,5,1,0,0,0,0,0],
        [0,1,5,5,5,5,5,5,5,1,0,0,0,0,0,0],
        [0,0,1,5,5,5,5,5,1,0,0,0,0,0,0,0],
        [0,0,1,6,6,0,6,6,1,0,0,0,0,0,0,0],
        [0,0,1,6,6,0,6,6,1,0,0,0,0,0,0,0],
        [0,0,0,7,7,0,7,7,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#444', 2:'#aaa', 3:'#ff0', 4:'#c88', 5:'#226', 6:'#335', 7:'#443' }
    },
    anguraBoss: {
      name: 'ナンバー12-グンマ',
      hp: 180, maxHp: 180,
      attack: 28, defense: 10, goldReward: 500,
      sprite: [
        [0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [0,1,2,2,2,2,2,2,2,1,0,0,0,0,0,0],
        [0,1,3,2,2,2,2,3,2,1,0,0,0,0,0,0],
        [0,1,2,2,2,4,2,2,2,1,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [0,1,5,5,5,5,5,5,5,1,0,0,0,0,0,0],
        [1,5,5,5,5,5,5,5,5,5,1,0,0,0,0,0],
        [1,5,5,5,5,5,5,5,5,5,1,0,0,0,0,0],
        [0,1,5,5,5,5,5,5,5,1,0,0,0,0,0,0],
        [0,0,1,6,6,0,6,6,1,0,0,0,0,0,0,0],
        [0,0,1,6,6,0,6,6,1,0,0,0,0,0,0,0],
        [0,0,0,7,7,0,7,7,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#333', 2:'#888', 3:'#f00', 4:'#c88', 5:'#2a2a3a', 6:'#333', 7:'#222' }
    },

    // ── ch3 boss ──
    kumako_steam: {
      name: '熊子・湯煙形態',
      hp: 110, maxHp: 110,
      attack: 18, defense: 8, goldReward: 150,
      sprite: [
        [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,1,1,2,2,1,1,0,0,0,0,0,0],
        [0,0,0,1,1,2,1,1,2,1,1,0,0,0,0,0],
        [0,0,1,1,2,1,1,1,1,2,1,1,0,0,0,0],
        [0,1,1,2,1,1,3,3,1,1,2,1,1,0,0,0],
        [0,1,1,2,1,1,1,1,1,1,2,1,1,0,0,0],
        [0,1,2,2,3,3,3,3,3,3,2,2,1,0,0,0],
        [0,1,2,3,3,2,2,2,2,3,3,2,1,1,0,0],
        [1,1,2,3,2,2,2,2,2,2,3,2,1,1,1,0],
        [1,2,2,3,2,2,1,1,2,2,3,2,2,1,1,0],
        [1,2,2,3,2,1,1,1,1,2,3,2,2,2,1,0],
        [1,2,2,3,3,1,1,1,1,3,3,2,2,2,1,0],
        [1,2,2,2,3,3,3,3,3,3,2,2,2,2,1,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,1,1,0],
        [0,1,1,1,2,2,2,2,2,2,2,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0]
      ],
      palette: { 1:'#ffffff', 2:'#aaddff', 3:'#ccccff' }
    },

    // ── ch4 boss ──
    yubatake_guardian: {
      name: '湯畑の守護者',
      hp: 140, maxHp: 140,
      attack: 22, defense: 12, goldReward: 200,
      sprite: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,2,0,0,0,1,1,0,0,0,2,1,0,0],
        [0,2,2,3,0,0,1,2,2,1,0,0,3,2,2,0],
        [0,2,3,3,0,1,2,3,3,2,1,0,3,3,2,0],
        [0,3,3,2,1,2,3,4,4,3,2,1,2,3,3,0],
        [0,0,3,2,1,2,3,3,3,3,2,1,2,3,0,0],
        [0,0,2,2,2,3,3,3,3,3,3,2,2,2,0,0],
        [0,0,1,2,3,3,3,3,3,3,3,3,2,1,0,0],
        [0,0,1,3,3,4,4,3,3,4,4,3,3,1,0,0],
        [0,0,2,3,3,4,4,3,3,4,4,3,3,2,0,0],
        [0,0,2,3,3,3,3,3,3,3,3,3,3,2,0,0],
        [0,0,3,3,3,2,2,3,3,2,2,3,3,3,0,0],
        [0,3,3,3,2,2,2,2,2,2,2,2,3,3,3,0],
        [3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3],
        [3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3]
      ],
      palette: { 1:'#ffffff', 2:'#aaddff', 3:'#228866', 4:'#88ccaa' }
    },

    // ── ch5 boss ──
    juke_gakuen: {
      name: 'ジューク（学園）',
      hp: 160, maxHp: 160,
      attack: 25, defense: 14, goldReward: 250,
      sprite: [
        [0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0],
        [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
        [0,0,0,0,0,2,1,1,1,1,2,0,0,0,0,0],
        [0,0,0,0,0,1,4,1,1,4,1,0,0,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,2,2,3,3,3,3,2,2,0,0,0,0],
        [0,0,0,2,2,2,3,3,3,3,2,2,2,0,0,0],
        [0,0,0,2,1,2,2,2,2,2,2,1,2,0,0,0],
        [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
        [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
        [0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],
        [0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],
        [0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],
        [0,0,0,0,2,2,2,0,0,2,2,2,0,0,0,0]
      ],
      palette: { 1:'#ffddcc', 2:'#111111', 3:'#ffffff', 4:'#ff0000' }
    },

    // ── ch6 mid-boss ──
    echo_guardian: {
      name: '返声の番',
      hp: 130, maxHp: 130,
      attack: 20, defense: 10, goldReward: 180,
      sprite: [
        [0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],
        [0,0,0,0,0,2,1,1,1,1,2,0,0,0,0,0],
        [0,0,0,0,2,1,1,1,1,1,1,2,0,0,0,0],
        [0,0,0,2,1,1,1,1,1,1,1,1,2,0,0,0],
        [0,0,2,1,1,3,3,1,1,3,3,1,1,2,0,0],
        [0,0,2,1,1,3,3,1,1,3,3,1,1,2,0,0],
        [0,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0],
        [0,2,1,1,1,1,3,3,3,3,1,1,1,1,2,0],
        [0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0],
        [0,0,0,2,2,1,1,1,1,1,1,2,2,0,0,0],
        [0,0,0,0,2,2,1,1,1,1,2,2,0,0,0,0],
        [0,0,0,2,1,1,2,2,2,2,1,1,2,0,0,0],
        [0,0,2,1,1,2,0,0,0,0,2,1,1,2,0,0],
        [0,2,1,1,2,0,0,0,0,0,0,2,1,1,2,0],
        [0,0,2,2,0,0,0,0,0,0,0,0,2,2,0,0]
      ],
      palette: { 1:'#ffffff', 2:'#cccccc', 3:'#ddaaff' }
    },

    // ── ch6 boss ──
    sato_kumako_tunnel: {
      name: '佐藤＆熊子',
      hp: 200, maxHp: 200,
      attack: 28, defense: 15, goldReward: 300,
      sprite: [
        [0,0,0,0,4,4,4,0,0,4,4,4,0,0,0,0],
        [0,0,0,4,4,4,4,4,4,4,4,4,4,0,0,0],
        [0,0,0,4,1,1,1,4,4,1,1,1,4,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,1,1,1,0,0,1,1,1,0,0,0,0],
        [0,0,0,2,2,2,2,0,0,3,3,3,3,0,0,0],
        [0,0,2,2,2,2,2,0,0,3,3,3,3,3,0,0],
        [0,2,2,1,2,2,2,0,0,3,3,3,1,3,3,0],
        [0,1,1,1,2,2,2,0,0,3,3,3,1,1,1,0],
        [0,0,0,2,2,2,2,0,0,3,3,3,3,0,0,0],
        [0,0,0,2,2,2,2,0,0,3,3,3,3,0,0,0],
        [0,0,0,2,2,2,2,0,0,3,3,3,3,0,0,0],
        [0,0,0,4,4,4,4,0,0,4,4,4,4,0,0,0],
        [0,0,0,4,4,0,0,0,0,0,0,4,4,0,0,0],
        [0,0,0,4,4,0,0,0,0,0,0,4,4,0,0,0],
        [0,0,4,4,4,0,0,0,0,0,0,4,4,4,0,0]
      ],
      palette: { 1:'#ffccaa', 2:'#2244cc', 3:'#22aa44', 4:'#111111' }
    },

    // ── ch7 boss ──
    haruna_lake_beast: {
      name: '榛名の湖獣',
      hp: 120, maxHp: 120,
      attack: 18, defense: 10, goldReward: 150,
      sprite: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,1,2,1,1,1,1,2,1,0,0,0,0],
        [0,0,0,1,2,2,1,1,1,1,2,2,1,0,0,0],
        [0,0,1,1,1,1,1,3,3,1,1,1,1,1,0,0],
        [0,1,1,1,4,1,1,3,3,1,1,4,1,1,0,0],
        [0,1,1,1,5,1,1,1,1,1,1,5,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,1,1,1,1,2,2,2,2,1,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0],
        [0,2,1,1,1,1,0,0,0,0,1,1,1,1,2,0],
        [0,2,1,1,0,0,0,0,0,0,0,0,1,1,2,0],
        [0,0,2,2,0,0,0,0,0,0,0,0,2,2,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#1E90FF', 2:'#00008B', 3:'#00FFFF', 4:'#FFFFFF', 5:'#FF0000' }
    },

    // ── ch8 boss ──
    oze_mud_wraith: {
      name: '尾瀬の泥異形',
      hp: 150, maxHp: 150,
      attack: 22, defense: 15, goldReward: 200,
      sprite: [
        [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,2,3,2,2,3,2,2,1,0,0,0],
        [0,0,1,2,2,2,3,2,2,3,2,2,2,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [1,2,2,2,3,3,3,3,3,3,3,3,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#654321', 2:'#8B4513', 3:'#000000' }
    },

    // ── ch9 boss ──
    juke_minakami: {
      name: 'ジューク（水上）',
      hp: 180, maxHp: 180,
      attack: 28, defense: 18, goldReward: 300,
      sprite: [
        [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,3,2,2,3,2,2,1,0,0,0,0],
        [0,0,0,1,2,4,2,2,4,2,2,1,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,5,5,5,5,2,2,1,0,0,0,0],
        [0,0,1,1,2,2,2,2,2,2,1,1,0,0,0,0],
        [0,1,2,1,2,2,2,2,2,2,1,2,1,0,0,0],
        [0,1,2,2,1,2,2,2,2,1,2,2,1,0,0,0],
        [0,0,1,2,2,1,1,1,1,2,2,1,0,0,0,0],
        [0,0,0,1,1,0,2,2,2,2,0,1,1,0,0,0],
        [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#4B0082', 2:'#8A2BE2', 3:'#FFFFFF', 4:'#FF0000', 5:'#000000' }
    },

    // ── ch10 final boss ──
    juke_final: {
      name: '真・ジューク',
      hp: 280, maxHp: 280,
      attack: 38, defense: 22, goldReward: 0,
      sprite: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,3,3,2,2,3,3,2,1,0,0,0],
        [0,0,1,2,2,3,3,2,2,3,3,2,2,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,3,3,3,2,2,2,2,2,2,1],
        [1,2,2,2,2,3,3,3,3,3,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#000000', 2:'#111111', 3:'#FF0000' },
      // Phase 2 sprite (white/gold) — swapped in by phase_change gimmick
      spritePhase2: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,3,3,2,2,3,3,2,1,0,0,0],
        [0,0,1,2,2,3,3,2,2,3,3,2,2,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,3,3,3,2,2,2,2,2,2,1],
        [1,2,2,2,2,3,3,3,3,3,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palettePhase2: { 1:'#FFFFFF', 2:'#F5F5F5', 3:'#FFD700' }
    }
  };

  // ============================================================
  //  第1章〜第6章 ボス固有ギミック定義
  //  battle.js の update / executeAction から参照する
  // ============================================================

  var bossGimmicks = {

    // ── 第1章 ──────────────────────────────

    // 佐藤テスト戦（チュートリアル）― 優先実装
    satoTest: {
      boss_id: 'satoTest',
      passive: {
        id: 'mentor_mercy',
        description: 'HPが0になっても1残る（負けイベントではない確認戦）',
        apply: function(enemy, dmg) {
          if (enemy.hp - dmg <= 0) { enemy.hp = 1; return true; }
          return false;
        }
      },
      phase_change: null,  // フェーズ変化なし
      special_move: {
        id: 'sato_lecture',
        name: '佐藤の説教',
        description: '3ターン目に強制発動。ダメージではなく次のダイス出目+2',
        trigger: function(turnCount) { return turnCount === 3; },
        effect: function(playerEffects, addEffectFn) {
          addEffectFn(playerEffects, 'dice_bonus', 1, 2);
        },
        message: '佐藤「ダイスの目をよく見ろ。数字の裏を読め」'
      },
      victory_flag: 'sato_test_cleared'
    },

    // 暗鞍ナンバー12（章ボス）
    anguraBoss: {
      boss_id: 'anguraBoss',
      passive: {
        id: 'heavy_cargo',
        description: '荷車の重み。毎ターン自身の素早さ-1、だが攻撃力+2',
        apply: function(enemy, turnCount) {
          enemy.attack += 2;
          // 行動遅延は外部処理
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.4; },
        action: function(enemy) {
          enemy.defense = Math.max(0, enemy.defense - 5);
          enemy.attack += 8;
          return '荷車が崩壊した！ナンバー12は身軽になり攻撃力が上がった！';
        }
      },
      special_move: {
        id: 'cargo_rush',
        name: '荷車突進',
        description: '大ダメージ突進。使用後1ターン行動不能',
        trigger: function(turnCount, enemy) { return turnCount % 4 === 0 && enemy.hp > 0; },
        damage: function(enemy) { return Math.floor(enemy.attack * 1.8); },
        self_stun: 1,
        message: 'ナンバー12は荷車ごと突っ込んできた！'
      },
      victory_flag: 'angura_boss_defeated'
    },

    // ── 第2章 ──────────────────────────────

    // ゴボウ牙主（爆根の長）
    gobouFang: {
      boss_id: 'gobouFang',
      passive: {
        id: 'underground_faith',
        description: '地中潜伏。2ターンに1回地面に潜り、攻撃が当たらない',
        apply: function(enemy, turnCount) {
          return turnCount % 2 === 0; // trueなら潜伏中
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.3; },
        action: function(enemy) {
          enemy.attack += 10;
          return '牙主は地表に飛び出した！「光が…痛ェ！だがもう逃げねェ！」';
        }
      },
      special_move: {
        id: 'root_eruption',
        name: '根の噴出',
        description: '地面から根が噴き出し、3ターン後に大ダメージ',
        trigger: function(turnCount) { return turnCount === 5 || turnCount === 10; },
        setup_turns: 3,
        damage: function(enemy) { return Math.floor(enemy.attack * 2.5); },
        message: '地面がひび割れ始めた…！（3ターン後に噴出！）'
      },
      victory_flag: 'gobou_fang_defeated'
    },

    // ── 第3章 ──────────────────────────────

    // 古谷（人間同士のリスペクト戦闘）
    furuyaBattle: {
      boss_id: 'furuyaBattle',
      passive: {
        id: 'mutual_respect',
        description: 'リスペクト戦闘。互いのダイス出目差で勝敗が決まる',
        apply: function(enemy, playerDiceTotal) {
          // 古谷も内部でダイスを振る
          var furuyaRoll = Math.floor(Math.random() * 6) + 1 +
                           Math.floor(Math.random() * 6) + 1;
          return { playerRoll: playerDiceTotal, furuyaRoll: furuyaRoll };
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.25; },
        action: function(enemy) {
          return '古谷「…ダイスには逆らえないか。お前の勝ちだ」';
        }
      },
      special_move: {
        id: 'lone_hack',
        name: '孤独のハック',
        description: 'プレイヤーのダイス1個の出目を強制的に1にする',
        trigger: function(turnCount) { return turnCount % 3 === 0; },
        effect: function(diceResults) {
          if (diceResults.length > 0) diceResults[0] = 1;
        },
        message: '古谷「俺は一人でやる。お前のダイスなんか要らない」'
      },
      victory_flag: 'furuya_battle_cleared'
    },

    // ── 第4章 ──────────────────────────────

    // 湯畑の守護者
    yubatake_guardian: {
      boss_id: 'yubatake_guardian',
      passive: {
        id: 'burning_spring',
        description: '毎ターン終了時、プレイヤーにやけどを付与する。やけど状態のプレイヤーは次ターン開始時に5ダメージを受ける。',
        apply: function(enemy, player) {
          if (!player) return;
          player.statusEffects = player.statusEffects || {};
          player.statusEffects.burn = {
            damage: 5,
            duration: 1
          };
        }
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.5 && !enemy._boilingForm;
        },
        action: function(enemy) {
          enemy._boilingForm = true;
          enemy.attack += 8;
          if (enemy.gimmick && enemy.gimmick.special_move) {
            enemy.gimmick.special_move.id = 'boiling_spray';
            enemy.gimmick.special_move.name = '熱湯噴射';
            enemy.gimmick.special_move.description = '沸騰形態の熱湯を噴き出し、大ダメージを与える';
            enemy.gimmick.special_move.message = '湯畑の守護者は沸騰した熱湯を噴き上げた！';
          }
          return '湯畑の守護者は沸騰形態へ変化した！ 攻撃力が大きく上がった！';
        }
      },
      special_move: {
        id: 'yunohana_burst',
        name: '湯の花爆発',
        description: '4ターンごとに湯の花を爆発させ、強烈なダメージを与える',
        trigger: function(turnCount, enemy) {
          return turnCount % 4 === 0;
        },
        damage: function(enemy) {
          return Math.floor(enemy.attack * 2);
        },
        message: '湯畑の守護者の湯の花爆発！ 灼熱の飛沫が襲いかかる！'
      },
      victory_flag: 'yubatake_defeated',
      bgm: 'ch4_kumako_battle',
      victory_bgm: 'ch4_victory',
      sfx: { phase_change: 'steam_hiss' },
      dialogue: {
        phase_change: [
          { speaker: '守護者', text: '湯畑の怒り…思い知れ…！' },
          { speaker: '主人公', text: '温度が急上昇してる…気をつけろ！' }
        ],
        special_move: [
          { speaker: '守護者', text: '全てを沸騰させよ…！' },
          { speaker: 'アカギ', text: '結界に同化させられるぞ！' }
        ],
        victory: [
          { speaker: '守護者', text: '…源泉が…静まる…' },
          { speaker: '主人公', text: '浄化の石…これでアカギを。' }
        ]
      }
    },

    // 熊子・湯煙形態（回復反転ギミック）
    kumako_steam: {
      boss_id: 'kumako_steam',
      passive: {
        id: 'heal_inversion',
        description: '回復反転結界。回復ダイス(H系)のHP回復がダメージに変わる',
        apply: function(healAmount) {
          return -healAmount;
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.5; },
        action: function(enemy) {
          enemy.defense += 5;
          return '熊子の輪郭が揺らぎ、液状に変わった！「痛い？ ならもっと溶けなさい」';
        }
      },
      special_move: {
        id: 'dissolving_embrace',
        name: '溶解の抱擁',
        description: '味方全体に中ダメージ＋回復封印2ターン',
        trigger: function(turnCount) { return turnCount % 3 === 0; },
        damage: function(enemy) { return Math.floor(enemy.attack * 1.2); },
        debuff: { type: 'heal_seal', turns: 2 },
        message: '熊子「温めてあげるわ♪ 全部、溶かしてあげる」'
      },
      victory_flag: 'kumako_steam_defeated',
      bgm: 'ch4_kumako_battle',
      victory_bgm: 'ch4_victory',
      sfx: { phase_change: 'steam_hiss' },
      dialogue: {
        phase_change: [
          { speaker: '熊子', text: 'まだまだ…もっと温めてあげる。' },
          { speaker: '主人公', text: '回復が毒になる…気をつけろ！' }
        ],
        special_move: [
          { speaker: '熊子', text: 'ぜーんぶ、ドロドロに溶けなさい♪' },
          { speaker: 'アカギ', text: '結界に同化させられるぞ！' }
        ],
        victory: [
          { speaker: '熊子', text: '…冷めちゃったわね。' },
          { speaker: '主人公', text: '浄化の石…これでアカギを。' }
        ]
      }
    },

    // ── 第5章 ──────────────────────────────

    // ジューク（学園）― ダイス封印＋減点ギミック
    juke_gakuen: {
      boss_id: 'juke_gakuen',
      passive: {
        id: 'rule_rewrite',
        description: '3ターンごとにプレイヤーの使えるダイスを1つ封印する。ただし最低1つは残る。',
        apply: function(enemy, player, turnCount) {
          if (!player || !turnCount || turnCount % 3 !== 0) return;
          player.sealedDice = player.sealedDice || [];
          var totalDice = player.diceCount || player.maxDice || 3;
          var usableDice = totalDice - player.sealedDice.length;
          if (usableDice <= 1) return;
          var candidates = [];
          for (var i = 0; i < totalDice; i++) {
            if (player.sealedDice.indexOf(i) === -1) {
              candidates.push(i);
            }
          }
          if (candidates.length === 0) return;
          var target = candidates[Math.floor(Math.random() * candidates.length)];
          player.sealedDice.push(target);
        }
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.4 && !enemy._finalRule;
        },
        action: function(enemy) {
          enemy._finalRule = true;
          enemy.defense = (enemy.defense || 0) + 10;
          if (typeof Game !== 'undefined' && Game.Battle && Game.Battle.player) {
            Game.Battle.player.sealedDice = [];
          }
          return 'ジューク学園は「最終ルール」を発動した！ すべての封印は解かれたが、防御力が上昇した！';
        }
      },
      special_move: {
        id: 'deduction_time',
        name: '減点タイム',
        description: '次のターン、プレイヤーのダイス出目がすべて半減する',
        trigger: function(turnCount, enemy) {
          return turnCount % 5 === 0;
        },
        damage: function(enemy) { return 0; },
        message: 'ジューク学園の減点タイム！ 次のターン、あらゆる出目が鈍る！'
      },
      victory_flag: 'juke_gakuen_defeated',
      bgm: 'ch5_juke_battle',
      victory_bgm: 'ch5_victory',
      sfx: { special_move: 'dice_roll_heavy' },
      dialogue: {
        phase_change: [
          { speaker: 'ジューク', text: '遊びは終わりだ、よそ者。' },
          { speaker: 'ジューク', text: '土地の掟、刻み込んでやるよ。' }
        ],
        special_move: [
          { speaker: 'ジューク', text: '出目なんて飾りだ。俺がルールだ！' },
          { speaker: '山川', text: 'ダイスの目が固定された！？' }
        ],
        victory: [
          { speaker: 'ジューク', text: 'チッ…今日はこの辺にしとくぜ。' },
          { speaker: '古谷', text: '逃げ足だけは速いヤツだ。' }
        ]
      }
    },

    // ── 第6章 ──────────────────────────────

    // 佐藤＆熊子・洗脳形態（二人羽織＋覚醒ギミック）
    sato_kumako_tunnel: {
      boss_id: 'sato_kumako_tunnel',
      passive: {
        id: 'two_person_act',
        description: 'HPが高いうちは二人で攻撃し攻撃力が1.5倍になる。弱ると佐藤が正気を取り戻し、攻撃力が元に戻る。',
        apply: function(enemy) {
          if (enemy.hp > enemy.maxHp * 0.6) {
            if (!enemy._duetBoostApplied) {
              enemy._baseAttack = enemy._baseAttack || enemy.attack;
              enemy.attack = Math.floor(enemy._baseAttack * 1.5);
              enemy._duetBoostApplied = true;
              enemy._returnedToNormal = false;
            }
          } else if (!enemy._returnedToNormal) {
            enemy._baseAttack = enemy._baseAttack || enemy.attack;
            enemy.attack = enemy._baseAttack;
            enemy._returnedToNormal = true;
          }
        }
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.35 && !enemy._satoAwakened;
        },
        action: function(enemy) {
          enemy._satoAwakened = true;
          enemy.defense = (enemy.defense || 0) + 15;
          enemy.selfDamagePerTurn = 5;
          return '佐藤が完全覚醒した！ 熊子をかばい、防御力が上昇した！ しかし毎ターン自滅していく！';
        }
      },
      special_move: {
        id: 'duet_of_despair',
        name: '絶望のデュエット',
        description: '5ターンごとに2回連続攻撃を行う。1回目は通常、2回目はattack×0.8。',
        trigger: function(turnCount, enemy) {
          return turnCount % 5 === 0;
        },
        damage: function(enemy) { return Math.floor(enemy.attack); },
        message: '佐藤＆熊子の絶望のデュエット！ 連続攻撃が襲いかかる！'
      },
      victory_flag: 'sato_kumako_defeated',
      bgm: 'ch6_sato_battle',
      victory_bgm: 'ch6_victory',
      sfx: { phase_change: 'train_echo' },
      dialogue: {
        phase_change: [
          { speaker: '佐藤', text: '俺のHPを削りきってくれ！' },
          { speaker: '熊子', text: 'お邪魔虫！記憶の核はもらうわ！' }
        ],
        special_move: [
          { speaker: '熊子', text: '次は終点〜！現実行きでーす♪' },
          { speaker: '主人公', text: '車窓の景色が…反転する！' }
        ],
        victory: [
          { speaker: '熊子', text: 'あーあ、路線が閉じちゃった。' },
          { speaker: '主人公', text: '佐藤！しっかりしろ！' },
          { speaker: '佐藤', text: '…俺はまだ、やれるさ。' }
        ]
      }
    },

    // 返声の番（6章中ボス）― 反響＋名前喰いギミック
    echo_guardian: {
      boss_id: 'echo_guardian',
      passive: {
        id: 'echo_reflect',
        description: 'プレイヤーが与えたダメージの20%を記録し、次ターンに跳ね返す。',
        apply: function(enemy, player, damageDealt) {
          if (typeof damageDealt !== 'number' || damageDealt <= 0) return;
          enemy._echoStoredDamage = Math.floor(damageDealt * 0.2);
        }
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.5 && !enemy._silentForm;
        },
        action: function(enemy) {
          enemy._silentForm = true;
          enemy._suppressMessages = true;
          return '返声の番は無言形態へ移行した……音が消えた。';
        }
      },
      special_move: {
        id: 'name_eater',
        name: '名前喰い',
        description: 'プレイヤーのダイス1つをランダムに選び、次ターンの出目を0にする',
        trigger: function(turnCount, enemy) {
          return turnCount % 3 === 0;
        },
        damage: function(enemy) { return 0; },
        message: '返声の番の名前喰い！ ひとつのダイスが沈黙した！'
      },
      victory_flag: 'echo_guardian_defeated',
      bgm: 'ch6_sato_battle',
      sfx: {},
      dialogue: {
        phase_change: [
          { speaker: '返声の番', text: '同ジ名前デ、二度越エルナ…' },
          { speaker: 'アカギ', text: '同じ奴が動くと反響するぞ！' }
        ],
        special_move: [
          { speaker: '返声の番', text: '過去ノ残響ニ、呑マレロ！' },
          { speaker: '主人公', text: '音が…記憶を揺さぶってくる！' }
        ],
        victory: [
          { speaker: '返声の番', text: '下ガル場所ナド…モウ…' },
          { speaker: '主人公', text: '進むしかないんだ。奥へ！' }
        ]
      }
    },

    // ── 第7章 ──────────────────────────────

    // 榛名の湖獣 ― 霧の加護＋湖底の咆哮ギミック
    haruna_lake_beast: {
      boss_id: 'haruna_lake_beast',
      passive: {
        id: 'mist_guard',
        description: '霧の加護により、ターン開始時5%の確率でプレイヤーの攻撃がミスになる。',
        apply: function(enemy, player) {
          if (enemy._mistDispersed) return;
          if (!player) return;
          player.statusEffects = player.statusEffects || {};
          player.statusEffects.mistBlind = {
            chance: 0.05,
            duration: 1
          };
        }
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.45 && !enemy._mistDispersed;
        },
        action: function(enemy) {
          enemy._mistDispersed = true;
          enemy._waterForm = true;
          enemy.attackElement = 'water';
          enemy._applyWetEachTurn = true;
          return '榛名の湖獣の霧が晴れた！ 霧の加護は消えたが、水の力がむき出しになった！';
        }
      },
      special_move: {
        id: 'lakebed_howl',
        name: '湖底の咆哮',
        description: '次のターン、プレイヤーのダイスがすべて再度スピンし、出目が変わる',
        trigger: function(turnCount, enemy) {
          return turnCount % 4 === 0;
        },
        damage: function(enemy) { return 0; },
        message: '榛名の湖獣の湖底の咆哮！ ダイスの運命が揺らぎ始める！'
      },
      victory_flag: 'haruna_beast_defeated',
      bgm: 'ch7_beast_battle',
      victory_bgm: 'ch7_victory',
      sfx: { special_move: 'water_splash' },
      dialogue: {
        phase_change: [
          { speaker: '山川', text: '霧が晴れた…でも水圧が！' },
          { speaker: '湖獣', text: 'グルルォォォォ！' }
        ],
        special_move: [
          { speaker: '湖獣', text: '（湖面が大きく波立つ！）' },
          { speaker: 'アカギ', text: '来るぞ、踏ん張れ！' }
        ],
        victory: [
          { speaker: '湖獣', text: 'グルゥ……。' },
          { speaker: '山川', text: '霧が晴れていくわね。' }
        ]
      }
    },

    // ── 第8章 ──────────────────────────────

    // 尾瀬の泥異形 ― 毎ターン素早さ低下（slow蓄積）
    oze_mud_wraith: {
      boss_id: 'oze_mud_wraith',
      passive: {
        id: 'mud_sink',
        description: '毎ターン泥が足を引き、slowを付与',
        apply: function(enemy, turnCount, playerEffects) {
          addEffect(playerEffects, 'slow', 2, 2);
          if (turnCount % 2 === 0) {
            return '泥が足に絡みつく...動きが鈍る！';
          }
          return null;
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.3; },
        action: function(enemy) {
          enemy.attack += 8;
          return '泥異形が地中から巨体を引きずり出した！';
        }
      },
      special_move: {
        id: 'bottomless_mud',
        name: '底なしの泥',
        description: '大ダメージ＋1ターンスタン',
        trigger: function(turnCount) { return turnCount === 4 || turnCount === 8; },
        damage: function(enemy) { return Math.floor(enemy.attack * 1.4); },
        message: '泥の底に引きずり込まれる！'
      },
      bgm: 'ch8_mud_battle',
      victory_bgm: 'ch8_victory',
      sfx: { phase_change: 'mud_sink', special_move: 'mud_sink' },
      dialogue: {
        phase_change: [
          { speaker: '泥異形', text: '沈メ…記憶モロトモ…' },
          { speaker: '古谷', text: '足場が泥に！動きづらいぞ！' }
        ],
        special_move: [
          { speaker: '泥異形', text: '底無シノ泥ニ、抱カレヨ！' },
          { speaker: '主人公', text: '体が…泥に引きずり込まれる！' }
        ],
        victory: [
          { speaker: '泥異形', text: 'ポコッ…ブクブク…' },
          { speaker: '主人公', text: 'なんとか沈まずに済んだな。' }
        ]
      }
    },

    // ── 第9章 ──────────────────────────────

    // ジューク（水上） ― ダイス出目操作
    juke_minakami: {
      boss_id: 'juke_minakami',
      passive: {
        id: 'dice_rewrite',
        description: '偶数ターンにプレイヤーのダイスボーナスを封印',
        apply: function(enemy, turnCount, playerEffects) {
          if (turnCount > 0 && turnCount % 2 === 0) {
            // Remove any dice_bonus effects
            for (var i = playerEffects.length - 1; i >= 0; i--) {
              if (playerEffects[i].type === 'dice_bonus') {
                playerEffects.splice(i, 1);
              }
            }
            return 'ジュークが掟のダイスを振った！出目ボーナス封印！';
          }
          return null;
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.35; },
        action: function(enemy) {
          enemy.attack += 6;
          enemy.defense += 4;
          return 'ジューク「本気を出す…掟の力、見せてやる！」';
        }
      },
      special_move: {
        id: 'rule_dice',
        name: '掟のダイス',
        description: '固定ダメージ＋ダイスロック',
        trigger: function(turnCount) { return turnCount === 3 || turnCount === 7; },
        damage: function(enemy) { return 35; },
        self_stun: 0,
        message: 'ジュークの掟のダイスが炸裂した！'
      },
      bgm: 'ch9_juke_battle',
      victory_bgm: 'ch9_victory',
      sfx: { special_move: 'dice_shatter' },
      dialogue: {
        phase_change: [
          { speaker: 'ジューク', text: 'お前らの運命、書き換えてやる。' },
          { speaker: '古谷', text: '出目が偶数に固定されてる！？' }
        ],
        special_move: [
          { speaker: 'ジューク', text: '掟のダイス！全部書き換われ！' },
          { speaker: 'アカギ', text: '俺たちの意志まで奪う気か！' }
        ],
        victory: [
          { speaker: 'ジューク', text: 'また俺は…忘れられるのか。' },
          { speaker: '主人公', text: 'ジューク…お前は一体…' }
        ]
      }
    },

    // ── 第10章 ──────────────────────────────

    // 真・ジューク ― 2フェーズ最終ボス
    juke_final: {
      boss_id: 'juke_final',
      passive: {
        id: 'border_erosion',
        description: '毎ターン侵食ダメージ（2〜5）をプレイヤーに与える',
        apply: function(enemy, turnCount, playerEffects) {
          var erosionDmg = 2 + Math.floor(Math.random() * 4);
          var pd = Game.Player.getData();
          pd.hp -= erosionDmg;
          if (pd.hp < 1) pd.hp = 1;
          return '結界の侵食が体を蝕む！ ' + erosionDmg + 'ダメージ！';
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.5; },
        action: function(enemy) {
          // Swap to phase 2 sprite
          var e = enemies.juke_final;
          if (e.spritePhase2) {
            enemy.sprite = e.spritePhase2;
            enemy.palette = e.palettePhase2;
          }
          enemy.attack += 10;
          enemy.defense -= 5;
          enemy.name = '真・ジューク（覚醒）';
          return '境界線が反転した！真・ジュークが真の姿を現す！';
        }
      },
      special_move: {
        id: 'border_inversion',
        name: '侵食の境界線',
        description: '超大ダメージ＋回復封印',
        trigger: function(turnCount) { return turnCount === 5 || turnCount === 10 || turnCount === 15; },
        damage: function(enemy) { return Math.floor(enemy.attack * 1.5); },
        self_stun: 2,
        message: '真・ジューク「これが最後の掟だ…！」'
      },
      bgm: 'ch10_final_battle',
      victory_bgm: 'ch10_ending',
      sfx: { phase_change: 'reality_glitch', special_move: 'dice_shatter' },
      dialogue: {
        phase_change: [
          { speaker: 'ジューク', text: '俺の残響…全部乗せてやる！' },
          { speaker: '主人公', text: '結界が…現実と混ざっていく！' },
          { speaker: 'ジューク', text: '境界線ごと消え去れ、プレイヤー！' }
        ],
        special_move: [
          { speaker: 'ジューク', text: '侵食の境界線！全てを反転しろ！' },
          { speaker: '山川', text: '全ステータスがマイナスに！？' }
        ],
        victory: [
          { speaker: 'ジューク', text: '…終わったな。クソゲーが。' },
          { speaker: '主人公', text: 'お前のこと、忘れないよ。' },
          { speaker: 'ジューク', text: 'フッ…せいぜい生きろよ。' }
        ]
      }
    }
  };

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
      phase = 'victory';
      message = enemy.name + 'を鎮めた。';
      messageTimer = 60;
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

  function start(enemyId, npc) {
    active = true;
    npcRef = npc;
    enemy = JSON.parse(JSON.stringify(enemies[enemyId]));
    menuIndex = 0;
    itemMenuIndex = 0;
    itemMenuItems = [];
    itemMenuMode = 'heal';
    ritualMenuActionId = null;
    phase = 'menu';
    message = enemy.name + 'が現れた！';
    messageTimer = 60;
    playerEffects = [];
    enemyEffects = [];
    comboText = '';
    comboTimer = 0;
    comboMultiplier = 1;
    bossEnraged = false;
    enrageTimer = 0;
    // Initialize boss gimmick
    currentGimmick = bossGimmicks[enemyId] || null;
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
    ritualRuntime = Game.RitualBattles && Game.RitualBattles.createRuntime
      ? Game.RitualBattles.createRuntime(enemyId, enemy)
      : null;
    if (ritualRuntime) {
      var ritualDefinition = Game.RitualBattles.getDefinition(ritualRuntime.ritualMode);
      if (ritualDefinition && ritualDefinition.setup) {
        ritualDefinition.setup(ritualRuntime, enemy, Game.Player.getData());
      }
    }

    Game.Audio.stopBgm();
    // Use boss-specific BGM if defined, otherwise generic 'battle'
    var bossBgm = (currentGimmick && currentGimmick.bgm) ? currentGimmick.bgm : 'battle';
    Game.Audio.playBgm(bossBgm);
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
    message = 'スペース/エンターで止めろ！';
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
      case 'menu':
        var menuEntries = getMenuEntries();
        if (menuIndex >= menuEntries.length) {
          menuIndex = Math.max(0, menuEntries.length - 1);
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
        break;

      case 'itemMenu':
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
          Game.Audio.playSfx('cancel');
        }
        if (Game.Input.isPressed('confirm')) {
          useSelectedItem();
        }
        break;

      case 'diceRoll':
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
          Game.Audio.playSfx('confirm');
          currentDice++;

          if (currentDice >= battleDice.length) {
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
              Game.Audio.playSfx('hit');
              if (Game.Particles) Game.Particles.emit('damage', 280, 60, { count: 8 });
            }

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
              phase = 'victory';
              message = message + ' ' + enemy.name + 'を倒した！ ' + (enemy.goldReward || 50) + 'G獲得！';
              messageTimer = 60;
              if (Game.Particles) Game.Particles.emit('victory', 240, 100, { count: 30 });
            }
          } else {
            message = '次のサイコロ！ 止めろ！';
          }
        }
        break;

      case 'diceResult':
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
          } else if (enemy.hp <= 0) {
            phase = 'victory';
          } else {
            phase = 'playerAttack';
            animTimer = 5;
          }
        }
        break;

      case 'playerAttack':
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
            var playerData = Game.Player.getData();
            var defBonus = getEffectBonus(playerEffects, 'defense_up');
            var dmg = Math.max(1, enemy.attack - (Game.Player.getDefense() + defBonus) + Math.floor(Math.random() * 5));
            playerData.hp -= dmg;
            message = enemy.name + 'の攻撃！ ' + dmg + 'ダメージ！';
            messageTimer = 45;
            Game.Audio.playSfx('damage');
            shakeX = 5;
            if (Game.Particles) Game.Particles.emit('damage', 100, 220, { count: 6 });

            if (playerData.hp <= 0) {
              playerData.hp = 0;
              phase = 'defeat';
              message = '力尽きた...';
              messageTimer = 90;
              Game.Audio.stopBgm();
              Game.Audio.playSfx('gameover');
            }
          }
        }
        break;

      case 'enemyAttack':
        // Tick status effects at end of round
        tickEffects(playerEffects);
        tickEffects(enemyEffects);
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
        break;

      case 'victory':
        // Queue victory dialogue if present
        if (currentGimmick && currentGimmick.dialogue && currentGimmick.dialogue.victory) {
          if (!isDialogueActive() && dialogueSpeaker === '') {
            queueDialogue(currentGimmick.dialogue.victory);
          }
          // Wait for dialogue to finish before ending battle
          if (isDialogueActive()) {
            updateDialogue();
            break;
          }
        }
        active = false;
        Game.Audio.stopBgm();
        ritualRuntime = null;
        // Use boss-specific victory BGM if defined
        var victoryBgm = (currentGimmick && currentGimmick.victory_bgm) ? currentGimmick.victory_bgm : null;
        if (victoryBgm) {
          Game.Audio.playBgm(victoryBgm);
        } else {
          Game.Audio.playSfx('victory');
        }
        return { result: 'victory', npc: npcRef, goldReward: enemy.goldReward || 50 };

      case 'defeat':
        active = false;
        Game.Audio.stopBgm();
        ritualRuntime = null;
        return { result: 'defeat' };

      case 'ritualFail':
        active = false;
        Game.Audio.stopBgm();
        var failStyle = ritualRuntime ? ritualRuntime.ritualFailStyle : null;
        ritualRuntime = null;
        return {
          result: 'ritual_fail',
          returnEventId: failStyle ? failStyle.returnEventId : null,
          failText: failStyle ? failStyle.text : message
        };

      case 'useItem':
        phase = 'enemyAttack';
        var playerData2 = Game.Player.getData();
        var dmg2 = Math.max(1, enemy.attack - Game.Player.getDefense() + Math.floor(Math.random() * 5));
        playerData2.hp -= dmg2;
        message = enemy.name + 'の攻撃！ ' + dmg2 + 'ダメージ！';
        messageTimer = 45;
        Game.Audio.playSfx('damage');
        if (playerData2.hp <= 0) {
          playerData2.hp = 0;
          phase = 'defeat';
          message = '力尽きた...';
          messageTimer = 90;
          Game.Audio.stopBgm();
          Game.Audio.playSfx('gameover');
        }
        break;

      case 'flee':
        active = false;
        Game.Audio.stopBgm();
        Game.Audio.playBgm('field');
        ritualRuntime = null;
        return { result: 'flee' };
    }
    return null;
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

      if (evaluateRitualOutcome() !== 'victory') {
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
      Game.Audio.playSfx('confirm');
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

  function draw() {
    if (!active) return;

    var R = Game.Renderer;
    var C = Game.Config;
    var ctx = R.getContext();

    // Background
    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#111122');

    // Grid
    ctx.strokeStyle = '#222244';
    ctx.lineWidth = 1;
    for (var i = 0; i < C.CANVAS_WIDTH; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, C.CANVAS_HEIGHT); ctx.stroke();
    }
    for (var i = 0; i < C.CANVAS_HEIGHT; i += 32) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(C.CANVAS_WIDTH, i); ctx.stroke();
    }

    // Enemy
    if (enemy) {
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

      R.drawRectAbsolute(160, 120, 160, 12, '#333');
      var hpRatio = enemy.hp / enemy.maxHp;
      R.drawRectAbsolute(161, 121, 158 * hpRatio, 10,
        hpRatio > 0.3 ? C.COLORS.HP_GREEN : C.COLORS.HP_RED);
      R.drawTextJP(enemy.name + ' HP:' + enemy.hp + '/' + enemy.maxHp, 160, 135, '#fff', 12);

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

    // Combo text display
    if (comboTimer > 0) {
      comboTimer--;
      var comboCol = comboMultiplier >= 2.0 ? '#ff44ff' : '#ffdd44';
      R.drawTextJP(comboText, 180, 155, comboCol, 16);
    }

    // Player stats
    var pd = Game.Player.getData();
    R.drawDialogBox(10, 200, 200, 60);
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

    // Dice display
    if (phase === 'diceRoll' || phase === 'diceResult') {
      var diceCount = battleDice.length;
      R.drawDialogBox(220, 150, 250, 80);

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
      R.drawDialogBox(300, 200, 160, 80);
      for (var i = 0; i < menuItems.length; i++) {
        var sealed = (sealedCommand >= 0 && i === sealedCommand);
        var color = sealed ? '#555' : (i === menuIndex) ? C.COLORS.GOLD : '#fff';
        var prefix = (i === menuIndex) ? '▶ ' : '  ';
        var label = sealed ? menuItems[i] + '×' : menuItems[i];
        R.drawTextJP(prefix + label, 315, 212 + i * 22, color, 14);
      }
    }

    if (phase === 'itemMenu' && messageTimer <= 0) {
      R.drawDialogBox(280, 184, 180, 96);
      for (var ii = 0; ii < itemMenuItems.length; ii++) {
        var selected = (ii === itemMenuIndex);
        var itemName = itemMenuItems[ii].item.name;
        var prefix2 = selected ? '▶ ' : '  ';
        var col2 = selected ? C.COLORS.GOLD : '#fff';
        R.drawTextJP(prefix2 + itemName, 292, 194 + ii * 18, col2, 12);
      }
      if (itemMenuItems[itemMenuIndex]) {
        R.drawTextJP('HP+' + itemMenuItems[itemMenuIndex].item.healAmount, 292, 252, '#88dd88', 11);
        R.drawTextJP('Xで戻る', 392, 252, '#888', 10);
      }
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
      R.drawDialogBox(10, 282, 460, 35);
      R.drawTextJP(message, 20, 290, '#fff', 14);
    }
  }

  function isActive() { return active; }

  return {
    start: start,
    update: update,
    draw: draw,
    isActive: isActive,
    getRitualRuntime: function() { return ritualRuntime; },
    getRitualDefinition: function(mode) {
      return Game.RitualBattles && Game.RitualBattles.getDefinition ? Game.RitualBattles.getDefinition(mode) : null;
    },
    getBossGimmick: function(bossId) { return bossGimmicks[bossId] || null; },
    getAllBossGimmicks: function() { return bossGimmicks; }
  };
})();
