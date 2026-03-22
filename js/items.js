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

    // Weapons
    woodenSword: {
      id: 'woodenSword',
      name: '木の剣',
      desc: '攻撃力+3',
      type: 'weapon',
      attackBonus: 3,
      price: 50
    },
    ironSword: {
      id: 'ironSword',
      name: '鉄の剣',
      desc: '攻撃力+7',
      type: 'weapon',
      attackBonus: 7,
      price: 120
    },
    darumaBat: {
      id: 'darumaBat',
      name: 'だるまバット',
      desc: '攻撃力+10 だるまの力が宿る',
      type: 'weapon',
      attackBonus: 10,
      price: 200
    },
    gunmaSword: {
      id: 'gunmaSword',
      name: '上州の剣',
      desc: '攻撃力+15 群馬最強の剣',
      type: 'weapon',
      attackBonus: 15,
      price: 350
    },

    // Armor
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

    // Dice upgrade item
    extraDice: {
      id: 'extraDice',
      name: 'サイコロ追加',
      desc: '戦闘で振れるサイコロが1個増える',
      type: 'dice',
      price: 150
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
