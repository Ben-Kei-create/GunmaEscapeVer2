// Item definitions
Game.Items = (function() {
  var definitions = {
    onsenKey: {
      id: 'onsenKey',
      name: '温泉の鍵',
      desc: '草津の温泉猿から手に入れた鍵',
      type: 'key',
      icon: [
        [0,0,1,1,1,0,0,0],
        [0,1,2,2,2,1,0,0],
        [0,1,2,0,2,1,0,0],
        [0,1,2,2,2,1,0,0],
        [0,0,1,1,1,0,0,0],
        [0,0,0,1,0,0,0,0],
        [0,0,0,1,0,0,0,0],
        [0,0,1,1,1,0,0,0]
      ],
      palette: { 1: '#ccaa00', 2: '#ffdd44' }
    },
    darumaEye: {
      id: 'darumaEye',
      name: 'だるまの目',
      desc: '高崎のだるま師匠の証',
      type: 'key',
      icon: [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,0,2,2,0,2,1],
        [1,2,2,3,2,3,2,1],
        [1,2,2,2,2,2,2,1],
        [0,1,2,2,2,2,1,0],
        [0,0,1,1,1,1,0,0],
        [0,0,0,0,0,0,0,0]
      ],
      palette: { 1: '#cc0000', 2: '#ff4444', 3: '#000000' }
    },
    konnyakuPass: {
      id: 'konnyakuPass',
      name: 'こんにゃくパス',
      desc: '下仁田の通行証',
      type: 'key',
      icon: [
        [0,1,1,1,1,1,1,0],
        [1,2,2,2,2,2,2,1],
        [1,2,3,2,3,2,3,1],
        [1,2,2,2,2,2,2,1],
        [1,2,3,2,3,2,3,1],
        [1,2,2,2,2,2,2,1],
        [0,1,1,1,1,1,1,0],
        [0,0,0,0,0,0,0,0]
      ],
      palette: { 1: '#666666', 2: '#aaaaaa', 3: '#888888' }
    },
    cabbageCrest: {
      id: 'cabbageCrest',
      name: 'キャベツの紋章',
      desc: '嬬恋の守護者から貰った紋章',
      type: 'key',
      icon: [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,3,2,2,3,2,1],
        [1,2,2,3,3,2,2,1],
        [1,2,2,3,3,2,2,1],
        [1,2,3,2,2,3,2,1],
        [0,1,2,2,2,2,1,0],
        [0,0,1,1,1,1,0,0]
      ],
      palette: { 1: '#2d8a2d', 2: '#44bb44', 3: '#66dd66' }
    },

    // Chapter 2 key
    akagiKey: {
      id: 'akagiKey',
      name: '赤城の鍵',
      desc: '赤城神社への鍵',
      type: 'key',
      icon: [
        [0,0,1,1,1,0,0,0],
        [0,1,2,2,2,1,0,0],
        [0,1,2,0,2,1,0,0],
        [0,1,2,2,2,1,0,0],
        [0,0,1,1,1,0,0,0],
        [0,0,0,1,0,0,0,0],
        [0,0,0,1,0,0,0,0],
        [0,0,1,1,1,0,0,0]
      ],
      palette: { 1: '#882222', 2: '#ff4444' }
    },

    // === Heal Items ===
    healHerb: {
      id: 'healHerb',
      name: '薬草',
      desc: 'HPを30回復する',
      type: 'heal',
      healAmount: 30,
      price: 15
    },
    yakimanju: {
      id: 'yakimanju',
      name: '焼きまんじゅう',
      desc: '群馬名物。HPを50回復する',
      type: 'heal',
      healAmount: 50,
      price: 30
    },
    superYakimanju: {
      id: 'superYakimanju',
      name: '特上焼きまんじゅう',
      desc: 'HPを100回復する最高級品',
      type: 'heal',
      healAmount: 100,
      price: 80
    },

    // === Armor ===
    leatherArmor: {
      id: 'leatherArmor',
      name: '皮の鎧',
      desc: '防御力+3',
      type: 'armor',
      defenseBonus: 3,
      price: 40
    },
    ironArmor: {
      id: 'ironArmor',
      name: '鉄の鎧',
      desc: '防御力+6',
      type: 'armor',
      defenseBonus: 6,
      price: 100
    },
    konnyakuArmor: {
      id: 'konnyakuArmor',
      name: 'こんにゃく鎧',
      desc: '防御力+9 弾力で攻撃を弾く',
      type: 'armor',
      defenseBonus: 9,
      price: 180
    },
    onsenArmor: {
      id: 'onsenArmor',
      name: '温泉の鎧',
      desc: '防御力+13 温泉パワー',
      type: 'armor',
      defenseBonus: 13,
      price: 300
    },

    // === DICE (Weapons!) ===
    // Normal dice: standard 1-6
    normalDice: {
      id: 'normalDice',
      name: 'ふつうのサイコロ',
      desc: '出目: 1-2-3-4-5-6',
      type: 'dice',
      faces: [1, 2, 3, 4, 5, 6],
      color: '#ffffff',
      dotColor: '#111111',
      price: 0
    },

    // Power dice: higher minimum
    powerDice: {
      id: 'powerDice',
      name: 'パワーサイコロ',
      desc: '出目: 2-3-4-5-6-7 最低2保証',
      type: 'dice',
      faces: [2, 3, 4, 5, 6, 7],
      color: '#ffdddd',
      dotColor: '#cc2222',
      price: 60
    },

    // Gambler dice: high risk high reward
    gamblerDice: {
      id: 'gamblerDice',
      name: 'ギャンブルサイコロ',
      desc: '出目: 1-1-1-8-8-12 一か八か！',
      type: 'dice',
      faces: [1, 1, 1, 8, 8, 12],
      color: '#ffffcc',
      dotColor: '#cc8800',
      price: 80
    },

    // Steady dice: consistent damage
    steadyDice: {
      id: 'steadyDice',
      name: '安定サイコロ',
      desc: '出目: 3-3-4-4-5-5 安定したダメージ',
      type: 'dice',
      faces: [3, 3, 4, 4, 5, 5],
      color: '#ddddff',
      dotColor: '#2222cc',
      price: 70
    },

    // Heal dice: some faces heal instead of damage
    healDice: {
      id: 'healDice',
      name: '回復サイコロ',
      desc: '出目: 0-0-0-H3-H5-H8 Hは回復',
      type: 'dice',
      faces: [0, 0, 0, 'H3', 'H5', 'H8'],
      color: '#ddffdd',
      dotColor: '#22aa22',
      effect: 'heal',
      price: 90
    },

    // Fire dice: damage + burn bonus
    fireDice: {
      id: 'fireDice',
      name: '炎のサイコロ',
      desc: '出目: 3-4-5-6-7-8 炎の追加ダメージ',
      type: 'dice',
      faces: [3, 4, 5, 6, 7, 8],
      color: '#ffccaa',
      dotColor: '#ff4400',
      price: 150
    },

    // Daruma dice: lucky, tends high
    darumaDice: {
      id: 'darumaDice',
      name: 'だるまサイコロ',
      desc: '出目: 3-5-5-7-7-7 七転び八起き',
      type: 'dice',
      faces: [3, 5, 5, 7, 7, 7],
      color: '#ffcccc',
      dotColor: '#882222',
      price: 120
    },

    // Onsen dice: heals a bit on each roll
    onsenDice: {
      id: 'onsenDice',
      name: '温泉サイコロ',
      desc: '出目: 2-3-4-5-6-H5 必ずHP少し回復',
      type: 'dice',
      faces: [2, 3, 4, 5, 6, 'H5'],
      color: '#cceeFF',
      dotColor: '#2266aa',
      effect: 'onsen',
      price: 130
    },

    // Konnyaku dice: bouncy, can reroll
    konnyakuDice: {
      id: 'konnyakuDice',
      name: 'こんにゃくサイコロ',
      desc: '出目: 1-4-4-6-6-10 弾力で跳ねる',
      type: 'dice',
      faces: [1, 4, 4, 6, 6, 10],
      color: '#ddddcc',
      dotColor: '#555544',
      price: 110
    },

    // Cabbage dice: massive but rare
    cabbageDice: {
      id: 'cabbageDice',
      name: 'キャベツサイコロ',
      desc: '出目: 0-0-5-5-10-15 大葉の一撃',
      type: 'dice',
      faces: [0, 0, 5, 5, 10, 15],
      color: '#ccffcc',
      dotColor: '#228822',
      price: 200
    },

    // Gunma ultimate dice
    gunmaDice: {
      id: 'gunmaDice',
      name: '上州カミナリサイコロ',
      desc: '出目: 5-6-7-8-9-10 群馬最強',
      type: 'dice',
      faces: [5, 6, 7, 8, 9, 10],
      color: '#ffeedd',
      dotColor: '#cc6600',
      price: 350
    },

    // Slot expander
    diceSlot: {
      id: 'diceSlot',
      name: 'サイコロポーチ',
      desc: 'サイコロ装備枠を1つ増やす（最大5）',
      type: 'diceSlot',
      price: 100
    },

    // === Legacy Cards (Passive Equipment) ===
    lc_001: { id: "lc_001", name: "赤城の霊風", type: "legacy_card", effect_type: "stat_up", target_stat: "speed", effect_value: 5, desc: "赤城おろしの力が宿る。素早さが5上昇する。", price: 1000 },
    lc_002: { id: "lc_002", name: "榛名の霧雨", type: "legacy_card", effect_type: "resist", target_stat: "blind", effect_value: 1.0, desc: "視界を奪う霧への完全耐性。暗闇状態を無効化。", price: 1200 },
    lc_003: { id: "lc_003", name: "妙義の奇岩", type: "legacy_card", effect_type: "stat_up", target_stat: "defense", effect_value: 8, desc: "切り立った岩山のごとき堅牢さ。防御力が8上昇。", price: 1500 },
    lc_004: { id: "lc_004", name: "達磨の左目", type: "legacy_card", effect_type: "auto_revive", target_stat: "hp", effect_value: 0.2, desc: "戦闘不能時、一度だけHP20%で復活する。", price: 3000 },
    lc_005: { id: "lc_005", name: "富岡の絹糸", type: "legacy_card", effect_type: "action_buff", target_stat: "chain_attack", effect_value: 2, desc: "通常攻撃が確率で2回連続になる。", price: 2500 },
    lc_006: { id: "lc_006", name: "からっ風の護符", type: "legacy_card", effect_type: "resist", target_stat: "wind", effect_value: 0.5, desc: "風属性のダメージを半減する。", price: 800 },
    lc_007: { id: "lc_007", name: "草津の湯の花", type: "legacy_card", effect_type: "auto_heal", target_stat: "hp", effect_value: 10, desc: "ターン終了時、HPが10ずつ自動回復する。", price: 2000 },
    lc_008: { id: "lc_008", name: "下仁田の土", type: "legacy_card", effect_type: "stat_up", target_stat: "max_hp", effect_value: 30, desc: "栄養満点の土の力。最大HPが30上昇する。", price: 900 },
    lc_009: { id: "lc_009", name: "水上の激流", type: "legacy_card", effect_type: "stat_up", target_stat: "attack", effect_value: 7, desc: "荒々しい川の流れの力。攻撃力が7上昇する。", price: 1100 },
    lc_010: { id: "lc_010", name: "尾瀬の木道", type: "legacy_card", effect_type: "resist", target_stat: "speed_down", effect_value: 1.0, desc: "足場を安定させる。素早さ低下ギミックを無効化。", price: 1500 },
    lc_011: { id: "lc_011", name: "焼きまんじゅうの串", type: "legacy_card", effect_type: "critical_rate", target_stat: "crit", effect_value: 0.15, desc: "クリティカル率が15%上昇する。", price: 1300 },
    lc_012: { id: "lc_012", name: "県庁の展望", type: "legacy_card", effect_type: "exp_up", target_stat: "exp", effect_value: 1.2, desc: "獲得経験値が1.2倍になる。", price: 5000 },
    lc_013: { id: "lc_013", name: "こんにゃくの盾", type: "legacy_card", effect_type: "damage_reflect", target_stat: "physical", effect_value: 0.1, desc: "受けた物理ダメージの10%を弾き返す。", price: 1800 },
    lc_014: { id: "lc_014", name: "分福の茶釜", type: "legacy_card", effect_type: "gold_up", target_stat: "gold", effect_value: 1.3, desc: "戦闘勝利時に得られるゴールドが1.3倍になる。", price: 4000 },
    lc_015: { id: "lc_015", name: "鬼の押出し岩", type: "legacy_card", effect_type: "counter", target_stat: "attack", effect_value: 0.5, desc: "敵の直接攻撃を受けた際、50%の威力で反撃する。", price: 2800 },
    lc_016: { id: "lc_016", name: "四万の碧色", type: "legacy_card", effect_type: "tp_regen", target_stat: "tp", effect_value: 5, desc: "ターン終了時、TPが5ずつ回復する。", price: 2200 },
    lc_017: { id: "lc_017", name: "八木節の太鼓", type: "legacy_card", effect_type: "initial_tp", target_stat: "tp", effect_value: 20, desc: "戦闘開始時、すでにTPが20溜まった状態になる。", price: 2600 },
    lc_018: { id: "lc_018", name: "白衣観音の慈悲", type: "legacy_card", effect_type: "heal_amp", target_stat: "hp", effect_value: 1.5, desc: "自分が使う回復アイテムやスキルの効果が1.5倍になる。", price: 1900 },
    lc_019: { id: "lc_019", name: "多胡碑の拓本", type: "legacy_card", effect_type: "skill_seal_resist", target_stat: "seal", effect_value: 1.0, desc: "記憶を刻み込む。コマンド封印を完全に防ぐ。", price: 1700 },
    lc_020: { id: "lc_020", name: "境界の切符", type: "legacy_card", effect_type: "escape_rate", target_stat: "escape", effect_value: 1.0, desc: "ボス戦以外の戦闘から確実に逃走できる。", price: 0 },

    // === Combo Skills ===
    combo_akagi_shield: { id: "combo_akagi_shield", name: "赤城の絶対防壁", type: "combo_skill", required_members: ["hero", "akagi"], tp_cost: 30, action_type: "buff", power: 0, effect: "party_invincible_1turn", desc: "1ターンの間、味方全体へのあらゆるダメージを無効化する。", unlock_flag: "flg_akagi_join" },
    combo_akagi_smash: { id: "combo_akagi_smash", name: "からっ風ストライク", type: "combo_skill", required_members: ["hero", "akagi"], tp_cost: 25, action_type: "attack", power: 150, effect: "defense_down", desc: "赤城おろしを纏った強烈な一撃。敵の防御力を下げる。", unlock_flag: "flg_akagi_join" },
    combo_yamakawa_heal: { id: "combo_yamakawa_heal", name: "草津の癒やし波", type: "combo_skill", required_members: ["hero", "yamakawa"], tp_cost: 20, action_type: "heal", power: 100, effect: "clear_status_ailment", desc: "味方全体のHPを大回復し、状態異常をすべて解除する。", unlock_flag: "flg_yamakawa_join" },
    combo_yamakawa_mist: { id: "combo_yamakawa_mist", name: "榛名の濃霧", type: "combo_skill", required_members: ["hero", "yamakawa"], tp_cost: 15, action_type: "debuff", power: 0, effect: "enemy_acc_down_large", desc: "敵全体を深い霧で包み、命中率を大幅に下げる。", unlock_flag: "flg_haruna_cleared" },
    combo_furuya_dice: { id: "combo_furuya_dice", name: "掟破りのダイス", type: "combo_skill", required_members: ["hero", "furuya"], tp_cost: 35, action_type: "special", power: 0, effect: "force_max_dice_roll", desc: "次ターンの味方のダイス出目をすべて「最大値」に固定する。", unlock_flag: "flg_furuya_join" },
    combo_furuya_snipe: { id: "combo_furuya_snipe", name: "上毛かるたスナイプ", type: "combo_skill", required_members: ["hero", "furuya"], tp_cost: 25, action_type: "attack", power: 200, effect: "critical_up", desc: "急所を撃ち抜く。クイズ正解直後に使うと威力が跳ね上がる。", unlock_flag: "flg_furuya_join" },
    combo_trio_gunma: { id: "combo_trio_gunma", name: "三山の誓い", type: "combo_skill", required_members: ["akagi", "yamakawa", "furuya"], tp_cost: 50, action_type: "buff", power: 0, effect: "all_stats_up_large", desc: "赤城・榛名・妙義の力を結集。味方全体の全能力が大幅上昇。", unlock_flag: "flg_three_mountains_gathered" },
    combo_hero_awaken: { id: "combo_hero_awaken", name: "境界線ブレイカー", type: "combo_skill", required_members: ["hero"], tp_cost: 100, action_type: "attack", power: 999, effect: "ignore_defense", desc: "現実と結界の境界を砕く究極の一撃。防御力を無視する。", unlock_flag: "flg_final_battle_phase2" },

    // === Consumables from items.json ===
    item_yakimanju: { id: "item_yakimanju", name: "焼きまんじゅう", type: "heal", healAmount: 50, desc: "甘じょっぱい味噌ダレが香ばしいソウルフード。HPを50回復。", price: 150 },
    item_yakimanju_pan: { id: "item_yakimanju_pan", name: "焼きまんじゅうパン", type: "heal", healAmount: 80, desc: "学食のおばちゃん特製。パンにまんじゅうが挟まっている。HP80回復。", price: 200 },
    item_konnyaku_jelly: { id: "item_konnyaku_jelly", name: "こんにゃくゼリー", type: "heal_tp", tpAmount: 30, desc: "弾力のあるゼリー。TPを30回復。", price: 300 },
    item_shimonita_negi: { id: "item_shimonita_negi", name: "下仁田ネギ", type: "buff", effect: "attack_up", duration: 3, value: 1.5, desc: "太くて甘い高級ネギ。3ターン攻撃力が1.5倍。", price: 500 },
    item_onsen_manju: { id: "item_onsen_manju", name: "湯けむり温泉まんじゅう", type: "heal", healAmount: 30, effect: "clear_status", desc: "全状態異常を回復。", price: 400 },
    item_daruma_bento: { id: "item_daruma_bento", name: "だるま弁当", type: "heal_all", healAmount: 100, desc: "味方全体のHPを100回復。", price: 1000 },
    item_blank_ticket: { id: "item_blank_ticket", name: "白紙の切符", type: "key", desc: "行き先の書かれていない古い切符。どこかへ帰れるかもしれない。", price: 0 }
  };

  function get(id) {
    return definitions[id] || null;
  }

  function getAll() {
    return definitions;
  }

  return {
    get: get,
    getAll: getAll
  };
})();
