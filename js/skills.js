// Battle skill definitions and learn order
Game.Skills = (function() {
  var learnOrder = [
    'mikiashi',
    'kasanekan',
    'migamae',
    'hibashiri',
    'shirosenyomi',
    'tsumugibreathe',
    'kaminariyobi',
    'kaeriashi'
  ];

  var definitions = {
    mikiashi: {
      id: 'mikiashi',
      name: '見切り足',
      desc: '次のダイスがゆっくり回る。落ち着いて止めやすくなる。',
      shortDesc: '次のダイス速度を遅くする',
      usesPerBattle: 2,
      color: '#8fe0ff'
    },
    kasanekan: {
      id: 'kasanekan',
      name: '重ね勘',
      desc: '次の出目へ勘を重ね、ダメージへ補正を足す。',
      shortDesc: '次のダイス補正+2',
      usesPerBattle: 2,
      color: '#ffd66b'
    },
    migamae: {
      id: 'migamae',
      name: '身構え',
      desc: '肩を落として構え直し、しばらく受けを固める。',
      shortDesc: '2ターン防御アップ',
      usesPerBattle: 2,
      color: '#8fdca0'
    },
    hibashiri: {
      id: 'hibashiri',
      name: '火走り',
      desc: '次の一投に熱を帯びさせ、当たれば燃え移らせる。',
      shortDesc: '次の一投で火傷付与',
      usesPerBattle: 1,
      color: '#ff9b6b'
    },
    shirosenyomi: {
      id: 'shirosenyomi',
      name: '白線読み',
      desc: '境界の綻びを見切り、相手の動き出しをひと拍子遅らせる。',
      shortDesc: '敵を1ターン足止め',
      usesPerBattle: 1,
      color: '#c6d0ff'
    },
    tsumugibreathe: {
      id: 'tsumugibreathe',
      name: '紡ぎ息',
      desc: '乱れた呼吸を整え、鈍りや封印をほどく。',
      shortDesc: '鈍りと回復封印を解除',
      usesPerBattle: 1,
      color: '#f1ece4'
    },
    kaminariyobi: {
      id: 'kaminariyobi',
      name: '雷呼び',
      desc: '上州の空気をまとい、しばらく攻め筋を鋭くする。',
      shortDesc: '攻撃上昇と賽補正',
      usesPerBattle: 1,
      color: '#ffe066'
    },
    kaeriashi: {
      id: 'kaeriashi',
      name: '返り足',
      desc: '踏み込みを残して退き、次の被害をやわらげる。',
      shortDesc: '次の被ダメージを軽減',
      usesPerBattle: 1,
      color: '#d8bfff'
    }
  };

  function get(id) {
    return definitions[id] || null;
  }

  function getAll() {
    return definitions;
  }

  function getLearnableSkillForRank(rank) {
    var index = Math.max(0, (rank | 0) - 2);
    return learnOrder[index] || null;
  }

  function getLearnOrder() {
    return learnOrder.slice();
  }

  return {
    get: get,
    getAll: getAll,
    getLearnableSkillForRank: getLearnableSkillForRank,
    getLearnOrder: getLearnOrder
  };
})();
