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

    // 白井熊子・湯煙形態（優先実装）
    kumako_steam: {
      boss_id: 'kumako_steam',
      passive: {
        id: 'heal_inversion',
        description: '回復反転結界。回復ダイス(H系)のHP回復がダメージに変わる',
        apply: function(healAmount) {
          return -healAmount; // 回復がダメージに
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
      victory_flag: 'kumako_steam_defeated'
    },

    // ── 第5章 ──────────────────────────────

    // ジューク（妙義団トップ）
    juke_gakuen: {
      boss_id: 'juke_gakuen',
      passive: {
        id: 'rule_overwrite',
        description: '掟の書き換え。ランダムでダイス1個の出目を強制変更',
        apply: function(diceResults) {
          var idx = Math.floor(Math.random() * diceResults.length);
          var original = diceResults[idx];
          diceResults[idx] = 1;
          return { index: idx, before: original, after: 1 };
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.35; },
        action: function(enemy) {
          enemy.attack += 6;
          return 'ジューク「お前が踏み越えていく掟の痛み…知れ」';
        }
      },
      special_move: {
        id: 'forgotten_route',
        name: '忘れられた経路',
        description: 'プレイヤーのコマンドを1つランダムで封印（1ターン）',
        trigger: function(turnCount) { return turnCount === 2 || turnCount === 6; },
        effect: function(menuItems) {
          var idx = Math.floor(Math.random() * menuItems.length);
          return { sealed: idx, sealedName: menuItems[idx] };
        },
        message: 'ジューク「その選択肢、俺が預かっておく」'
      },
      victory_flag: 'juke_gakuen_defeated'
    },

    // ── 第6章 ──────────────────────────────

    // 佐藤＆熊子・車窓形態（優先実装）
    sato_kumako_tunnel: {
      boss_id: 'sato_kumako_tunnel',
      passive: {
        id: 'dual_phase',
        description: '二重戦闘。佐藤と熊子が交互に行動する',
        apply: function(turnCount) {
          return turnCount % 2 === 0 ? 'sato' : 'kumako';
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.3; },
        action: function(enemy) {
          return '佐藤「もうやめろ…！俺を殴り続けて何になる！」\n' +
                 '熊子の姿が薄れ、佐藤だけが残った。';
        }
      },
      special_move: {
        id: 'memory_weight',
        name: '記憶の重し',
        description: '佐藤が自らのHPを削り、プレイヤーに2ターン行動遅延',
        trigger: function(turnCount, enemy) {
          return turnCount === 4 && enemy.hp > enemy.maxHp * 0.3;
        },
        self_damage: function(enemy) { return Math.floor(enemy.maxHp * 0.1); },
        debuff: { type: 'slow', turns: 2 },
        message: '佐藤「お前らの現実は、俺が絶対に守る…！」'
      },
      victory_flag: 'sato_kumako_tunnel_cleared'
    },

    // 返声の番（6章中ボス）
    echo_guardian: {
      boss_id: 'echo_guardian',
      passive: {
        id: 'echo_copy',
        description: '反響コピー。プレイヤーの前ターンの攻撃を模倣して返す',
        lastPlayerDamage: 0,
        apply: function(gimmick) {
          return Math.floor(gimmick.lastPlayerDamage * 0.6);
        }
      },
      phase_change: null,
      special_move: {
        id: 'name_steal',
        name: '名前の略奪',
        description: 'パーティメンバー1人の名前を奪い、1ターン操作不能にする',
        trigger: function(turnCount) { return turnCount % 5 === 0; },
        message: '返声の番「お前の名前、しばらく借りるぞ…」'
      },
      victory_flag: 'echo_guardian_defeated'
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

  var menuItems = ['たたかう', 'アイテム', 'にげる'];

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
    Game.Audio.stopBgm();
    Game.Audio.playBgm('battle');
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
        if (Game.Input.isPressed('up')) {
          menuIndex = (menuIndex - 1 + menuItems.length) % menuItems.length;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('down')) {
          menuIndex = (menuIndex + 1) % menuItems.length;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('confirm')) {
          executeAction(menuIndex);
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

            // Apply status effect bonuses
            var atkBonus = getEffectBonus(playerEffects, 'attack_up');
            var enemyDefReduction = hasEffect(enemyEffects, 'stun') ? Math.floor(enemy.defense / 2) : 0;

            phase = 'diceResult';
            animTimer = 30;

            // Apply damage with combo multiplier
            var baseDmg = damageTotal + Game.Player.getAttack() + atkBonus - (enemy.defense - enemyDefReduction);
            var dmg = Math.max(0, Math.floor(baseDmg * comboMultiplier));
            if (damageTotal > 0 && dmg < 1) dmg = 1;
            if (dmg > 0) {
              enemy.hp -= dmg;
              shakeX = 4 + battleDice.length;
              Game.Audio.playSfx('hit');
              if (Game.Particles) Game.Particles.emit('damage', 280, 60, { count: 8 });
            }

            // Apply healing (including onsen_heal effect)
            var onsenHeal = getEffectBonus(playerEffects, 'onsen_heal');
            if (healTotal > 0 || onsenHeal > 0) {
              Game.Player.heal(healTotal + onsenHeal);
              if (Game.Particles) Game.Particles.emit('heal', 100, 210, { count: 5 });
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

            // Boss enrage check (HP > 100 and below 50%)
            if (!bossEnraged && enemy.maxHp > 100 && enemy.hp > 0 && enemy.hp <= enemy.maxHp / 2) {
              bossEnraged = true;
              enrageTimer = 60;
              enemy.attack = Math.floor(enemy.attack * 1.2);
              message += ' 怒り状態！';
            }

            if (enemy.hp <= 0) {
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
          if (enemy.hp <= 0) {
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
        phase = 'menu';
        break;

      case 'victory':
        active = false;
        Game.Audio.stopBgm();
        Game.Audio.playSfx('victory');
        return { result: 'victory', npc: npcRef, goldReward: enemy.goldReward || 50 };

      case 'defeat':
        active = false;
        Game.Audio.stopBgm();
        return { result: 'defeat' };

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
        return { result: 'flee' };
    }
    return null;
  }

  function executeAction(index) {
    var playerData = Game.Player.getData();
    switch (index) {
      case 0:
        startDiceRoll();
        break;
      case 1:
        var inv = playerData.inventory;
        itemMenuItems = [];
        itemMenuIndex = 0;
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
        break;
      case 2:
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

    Game.Player.removeItem(selected.id);
    Game.Player.heal(selected.item.healAmount);
    message = selected.item.name + 'を使った！ HPが' + selected.item.healAmount + '回復！';
    messageTimer = 45;
    Game.Audio.playSfx('item');
    itemMenuItems = [];
    itemMenuIndex = 0;
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

    // Menu
    if (phase === 'menu' && messageTimer <= 0) {
      R.drawDialogBox(300, 200, 160, 80);
      for (var i = 0; i < menuItems.length; i++) {
        var color = (i === menuIndex) ? C.COLORS.GOLD : '#fff';
        var prefix = (i === menuIndex) ? '▶ ' : '  ';
        R.drawTextJP(prefix + menuItems[i], 315, 212 + i * 22, color, 14);
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
    getBossGimmick: function(bossId) { return bossGimmicks[bossId] || null; },
    getAllBossGimmicks: function() { return bossGimmicks; }
  };
})();
