// Item definitions
Game.Items = (function() {
  var definitions = {
    onsenKey: {
      id: 'onsenKey',
      name: '温泉の鍵',
      desc: '草津の温泉猿から手に入れた鍵',
      type: 'key',
      isCatalyst: true,
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
      isCatalyst: true,
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
      isCatalyst: true,
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
      isCatalyst: true,
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
      isCatalyst: true,
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

    silkBundle: {
      id: 'silkBundle',
      name: '生糸の束',
      desc: '切れずに残った白い糸束。終章の供物になる。',
      type: 'key',
      isCatalyst: true,
      icon: [
        [0,0,0,1,1,1,1,0],
        [0,0,1,2,2,2,2,1],
        [0,1,2,2,1,1,2,2],
        [1,2,2,1,2,2,1,2],
        [1,2,1,2,2,1,2,2],
        [0,1,2,2,1,2,2,1],
        [0,0,1,2,2,2,1,0],
        [0,0,0,1,1,1,0,0]
      ],
      palette: { 1: '#8a7d6c', 2: '#f1ece4' }
    },

    gururinPass: {
      id: 'gururinPass',
      name: 'ぐるりん定期',
      desc: '町と町を結ぶ循環便に乗れる、不思議な定期券',
      type: 'key',
      icon: [
        [0,1,1,1,1,1,1,0],
        [1,2,2,2,2,2,2,1],
        [1,2,3,3,2,3,3,1],
        [1,2,2,2,2,2,2,1],
        [1,2,4,2,2,2,4,1],
        [1,2,2,2,2,2,2,1],
        [0,1,1,1,1,1,1,0],
        [0,0,0,0,0,0,0,0]
      ],
      palette: { 1: '#2d5e41', 2: '#7fd39f', 3: '#0e1520', 4: '#f3e9b8' }
    },

    konnyakuParcel: {
      id: 'konnyakuParcel',
      name: 'こんにゃく包み',
      desc: '下仁田から前橋へ託された、ひんやり重い荷包み',
      type: 'key'
    },

    silkBraid: {
      id: 'silkBraid',
      name: '結い糸の束',
      desc: '富岡から高崎へ運ぶ、だるま紐用の白い結い糸',
      type: 'key'
    },

    yumomiLetter: {
      id: 'yumomiLetter',
      name: '湯もみ口上の文',
      desc: '草津の節回しが書き留められた、伊香保宛ての手紙',
      type: 'key'
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
    torimeshiBento: {
      id: 'torimeshiBento',
      name: '鶏めし弁当',
      desc: '前橋の名残が香る弁当。HPを70回復する',
      type: 'heal',
      healAmount: 70,
      price: 46
    },
    ishidanSenbei: {
      id: 'ishidanSenbei',
      name: '石段せんべい',
      desc: '伊香保みやげの堅焼き。HPを45回復する',
      type: 'heal',
      healAmount: 45,
      price: 28
    },
    mizusawaUdon: {
      id: 'mizusawaUdon',
      name: '水沢うどん包み',
      desc: 'つるりと喉に落ちる名物。HPを85回復する',
      type: 'heal',
      healAmount: 85,
      price: 68
    },
    akagiMilkCandy: {
      id: 'akagiMilkCandy',
      name: '赤城ミルク飴',
      desc: '高原の甘みがほどける。HPを35回復する',
      type: 'heal',
      healAmount: 35,
      price: 22
    },

    tempoCharm: {
      id: 'tempoCharm',
      name: 'ゆるみ札',
      desc: '戦闘用。次のダイスがゆっくり回る',
      type: 'battle',
      effect: 'slow_roll',
      price: 35
    },
    loadedSand: {
      id: 'loadedSand',
      name: '目盛り砂',
      desc: '戦闘用。次のダイス補正を+2する',
      type: 'battle',
      effect: 'dice_bonus',
      value: 2,
      price: 40
    },
    guardChalk: {
      id: 'guardChalk',
      name: '守り白墨',
      desc: '戦闘用。2ターン防御力を上げる',
      type: 'battle',
      effect: 'defense_up',
      turns: 2,
      value: 4,
      price: 42
    },
    emberIncense: {
      id: 'emberIncense',
      name: '火走り香',
      desc: '戦闘用。次の一投に火傷を乗せる',
      type: 'battle',
      effect: 'ignite_next',
      price: 48
    },
    measureLens: {
      id: 'measureLens',
      name: '見切り鏡',
      desc: '戦闘用。次のダイスの低い目を3まで見切る',
      type: 'battle',
      effect: 'steady_floor',
      value: 3,
      price: 44
    },
    silkWeight: {
      id: 'silkWeight',
      name: '白糸おもり',
      desc: '戦闘用。次の敵の白い賽を重くし、攻撃を6鈍らせる',
      type: 'battle',
      effect: 'enemy_roll_slow',
      value: 6,
      price: 52
    },
    kiseiFuda: {
      id: 'kiseiFuda',
      name: '気勢札',
      desc: '戦闘用。2ターン攻撃力を上げる',
      type: 'battle',
      effect: 'attack_up',
      turns: 2,
      value: 5,
      price: 46
    },
    kaeshiOmamori: {
      id: 'kaeshiOmamori',
      name: '返し守',
      desc: '戦闘用。次の被ダメージを8軽減する',
      type: 'battle',
      effect: 'ward',
      value: 8,
      price: 50
    },
    darumaSuzu: {
      id: 'darumaSuzu',
      name: 'だるま鈴守',
      desc: '戦闘用。鈴の余韻で次のダイスを見切りやすくする',
      type: 'battle',
      effect: 'focus_bundle',
      value: 4,
      price: 60
    },
    negiMisoJar: {
      id: 'negiMisoJar',
      name: '下仁田ねぎ味噌',
      desc: '戦闘用。2ターン攻撃力を上げる山の香り',
      type: 'battle',
      effect: 'attack_up',
      turns: 2,
      value: 4,
      price: 52
    },
    yunohanaVial: {
      id: 'yunohanaVial',
      name: '湯の花小瓶',
      desc: '戦闘用。鈍りや封じをほどき、覚えたとくぎの回数も少し戻す',
      type: 'battle',
      effect: 'steam_reset',
      turns: 2,
      value: 4,
      price: 58
    },
    silkBookmark: {
      id: 'silkBookmark',
      name: '富岡シルク栞',
      desc: '戦闘用。白糸の目印で次の一投を導く',
      type: 'battle',
      effect: 'silk_focus',
      value: 2,
      price: 56
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
      price: 500
    },

    // Gambler dice: high risk high reward
    gamblerDice: {
      id: 'gamblerDice',
      name: 'ギャンブルサイコロ',
      desc: '出目: 0-0-0-8-8-8 一か八か！',
      type: 'dice',
      faces: [1, 1, 1, 8, 8, 8],
      color: '#ffffcc',
      dotColor: '#cc8800',
      price: 777
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
      price: 555
    },

    breatherDice: {
      id: 'breatherDice',
      name: '息継ぎサイコロ',
      desc: '出目: 1-2-2-3-H2-H3 小さく立て直す',
      type: 'dice',
      faces: [1, 2, 2, 3, 'H2', 'H3'],
      color: '#dfffea',
      dotColor: '#2b8d63',
      price: 1500
    },

    // Heal dice: some faces heal instead of damage
    healDice: {
      id: 'healDice',
      name: '回復サイコロ',
      desc: '出目: 7-0-0-H3-H5-H8 Hは回復',
      type: 'dice',
      faces: [7, 0, 0, 'H3', 'H5', 'H8'],
      color: '#ddffdd',
      dotColor: '#22aa22',
      effect: 'heal',
      price: 2500
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
      price: 2500
    },

    // Daruma dice: lucky, tends high
    darumaDice: {
      id: 'darumaDice',
      name: 'だるまサイコロ',
      desc: '出目: 7-7-7-8-8-8 七転び八起き',
      type: 'dice',
      faces: [7, 7, 7, 8, 8, 8],
      color: '#ffcccc',
      dotColor: '#882222',
      price: 7788
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
      price: 2626
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
      price: 5290
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
      price: 8310
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
      price: 35000
    },

    // ── 哀愁・慈悲のサイコロ（低い出目・回復・寄り添い） ──
    silkDice: {
      id: 'silkDice',
      name: '絹糸のサイコロ',
      desc: '出目: 1-1-1-2-2-3 傷つけるより、絡まりを静かにほどくための賽',
      type: 'dice',
      faces: [1, 1, 1, 2, 2, 3],
      color: '#f8f9fa',
      dotColor: '#8b92a5',
      price: 2200
    },
    tearDice: {
      id: 'tearDice',
      name: '涙雨のサイコロ',
      desc: '出目: 0-1-1-H1-H2-2 痛みに寄り添い、少しだけ立て直す賽',
      type: 'dice',
      faces: [0, 1, 1, 'H1', 'H2', 2],
      color: '#d4e4f7',
      dotColor: '#4a6b8c',
      price: 2600
    },
    cocoonDice: {
      id: 'cocoonDice',
      name: '繭のサイコロ',
      desc: '出目: 0-0-1-1-2-2 柔らかい殻で悲しみを包み、攻めを急がない賽',
      type: 'dice',
      faces: [0, 0, 1, 1, 2, 2],
      color: '#fffdf9',
      dotColor: '#d1c7b8',
      price: 2400
    },
    offeringDice: {
      id: 'offeringDice',
      name: '供物のサイコロ',
      desc: '出目: 0-0-0-H2-H4-H6 攻めを捨て、祈りそのものを差し出す器',
      type: 'dice',
      faces: [0, 0, 0, 'H2', 'H4', 'H6'],
      color: '#2a2826',
      dotColor: '#d8b97d',
      price: 5600
    },

    // ── 民族要素・フォークロア（祭具・儀式用） ──
    kaguraBellDice: {
      id: 'kaguraBellDice',
      name: '神楽鈴のサイコロ',
      desc: '出目: 1-1-3-3-5-5 澄んだ拍で場を整える、祓いの賽',
      type: 'dice',
      faces: [1, 1, 3, 3, 5, 5],
      color: '#c23a41',
      dotColor: '#e0c38c',
      price: 4200
    },
    foxMaskDice: {
      id: 'foxMaskDice',
      name: '狐面のサイコロ',
      desc: '出目: 0-1-5-5-9-0 祭りの夜みたいに、極端な顔を見せる化かしの賽',
      type: 'dice',
      faces: [0, 1, 5, 5, 9, 0],
      color: '#fafafa',
      dotColor: '#d62d2d',
      price: 5200
    },
    mukaebiDice: {
      id: 'mukaebiDice',
      name: '迎え火のサイコロ',
      desc: '出目: 1-2-H1-H2-3-4 迷う影を照らし、少しずつ連れ戻す賽',
      type: 'dice',
      faces: [1, 2, 'H1', 'H2', 3, 4],
      color: '#402a24',
      dotColor: '#e66a35',
      price: 3600
    },
    higanbanaDice: {
      id: 'higanbanaDice',
      name: '彼岸花のサイコロ',
      desc: '出目: 4-4-4-4-4-0 境界に咲く赤。安定しながら、ときどき虚無に落ちる',
      type: 'dice',
      faces: [4, 4, 4, 4, 4, 0],
      color: '#8f1a1a',
      dotColor: '#120b0b',
      price: 4300
    },
    kokeshiDice: {
      id: 'kokeshiDice',
      name: '木地玩具のサイコロ',
      desc: '出目: 2-2-3-3-4-4 郷土の子らの記憶を刻んだ、丸みのある賽',
      type: 'dice',
      faces: [2, 2, 3, 3, 4, 4],
      color: '#d4ad7b',
      dotColor: '#5c3116',
      price: 2400
    },

    // ── 土地の記憶・環境（風景を模した出目） ──
    stoneStepDice: {
      id: 'stoneStepDice',
      name: '石段のサイコロ',
      desc: '出目: 3-4-4-4-4-5 伊香保の重みみたいに、じわりと圧をかける賽',
      type: 'dice',
      faces: [3, 4, 4, 4, 4, 5],
      color: '#6e7378',
      dotColor: '#2b2d30',
      price: 3900
    },
    karakkazeDice: {
      id: 'karakkazeDice',
      name: '空っ風のサイコロ',
      desc: '出目: 0-0-1-6-7-0 乾いた風のように空振りが多く、ときどき強く吹く',
      type: 'dice',
      faces: [0, 0, 1, 6, 7, 0],
      color: '#c9d1d6',
      dotColor: '#627b8a',
      price: 3100
    },
    peatMudDice: {
      id: 'peatMudDice',
      name: '泥炭のサイコロ',
      desc: '出目: 1-1-2-2-H1-H1 尾瀬の底みたいに熱を吸って、静かに鎮める賽',
      type: 'dice',
      faces: [1, 1, 2, 2, 'H1', 'H1'],
      color: '#38322c',
      dotColor: '#1a1815',
      price: 3300
    },
    powderSnowDice: {
      id: 'powderSnowDice',
      name: '粉雪のサイコロ',
      desc: '出目: 0-1-1-2-3-0 手に落ちては消える雪みたいに、静かで軽い賽',
      type: 'dice',
      faces: [0, 1, 1, 2, 3, 0],
      color: '#eef5f7',
      dotColor: '#88a9c2',
      price: 2900
    },
    abandonedRailDice: {
      id: 'abandonedRailDice',
      name: '廃線のサイコロ',
      desc: '出目: 2-2-3-3-4-4 もう走らない路線の拍で、一定の哀愁を刻む',
      type: 'dice',
      faces: [2, 2, 3, 3, 4, 4],
      color: '#52433d',
      dotColor: '#a15b3c',
      price: 2800
    },
    sunsetDice: {
      id: 'sunsetDice',
      name: '茜空のサイコロ',
      desc: '出目: 2-3-3-4-4-H3 帰る景色を思い出させる、やわらかな夕暮れの賽',
      type: 'dice',
      faces: [2, 3, 3, 4, 4, 'H3'],
      color: '#cc5c43',
      dotColor: '#ffe5a3',
      price: 4700
    },

    // Slot expander
    diceSlot: {
      id: 'diceSlot',
      name: 'サイコロポーチ',
      desc: '装備枠を1つ増やす希少なポーチ（最大5）',
      type: 'diceSlot',
      uniqueStock: true,
     price: 1000
    }
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
