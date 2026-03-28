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

  var victoryOffers = {
    ruined_checkpoint: {
      skillId: 'mikiashi',
      sourceText: '崩れた関所の綻びを読むうち、足だけが先に白線を見切った。'
    },
    darumaMaster: {
      skillId: 'sokomiki',
      sourceText: '欠け目のだるまを見つめ返すうち、低い目を拾い上げる呼吸を会得した。'
    },
    onsenMonkey: {
      skillId: 'yunomatoi',
      sourceText: '湯煙ざるの熱を受け流し、湯気をまとって守る型を掴んだ。'
    },
    konnyakuKing: {
      skillId: 'hakokuzushi',
      sourceText: '山あいの運びの癖を見て、構えを崩す間合いを覚えた。'
    },
    cabbageGuardian: {
      skillId: 'karakaze',
      sourceText: '高原の空っ風に背を押され、一投を鋭く立ち上げる型が身についた。'
    },
    threadMaiden: {
      skillId: 'itoyurai',
      sourceText: '絡んだ白糸の震えを追ううち、相手の賽を鈍らせる揺らぎを掴んだ。'
    }
  };

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
    },
    sokomiki: {
      id: 'sokomiki',
      name: '底見切り',
      desc: '低い目を拾い上げ、次の一投の最低値を引き上げる。返しの余白も少し残る。',
      shortDesc: '次のダメージ目を底上げし、軽い返しを得る',
      usesPerBattle: 1,
      color: '#dfe6ff'
    },
    yunomatoi: {
      id: 'yunomatoi',
      name: '湯まとい',
      desc: '湯気をまとって鈍りをほどき、守りと再生を静かに残す。',
      shortDesc: '鈍り解除、防御アップ、継続回復',
      usesPerBattle: 1,
      color: '#9be4ff'
    },
    hakokuzushi: {
      id: 'hakokuzushi',
      name: '荷崩し',
      desc: '相手の重心を崩し、次の一投で弱い綻びを拾いやすくする。',
      shortDesc: '相手を痺れさせ、次の賽補正+1',
      usesPerBattle: 1,
      color: '#ffcb8f'
    },
    karakaze: {
      id: 'karakaze',
      name: '空っ風',
      desc: 'からっ風を背に受け、次の一投を見切りやすくしながら攻め筋を鋭くする。',
      shortDesc: '次の一投を見切りやすくし、攻撃上昇',
      usesPerBattle: 1,
      color: '#c6f08f'
    },
    itoyurai: {
      id: 'itoyurai',
      name: '糸ゆらい',
      desc: '白糸の揺れを写し、相手の白い賽をしばらく鈍らせる。',
      shortDesc: '敵の白い賽を2ターン鈍らせる',
      usesPerBattle: 1,
      color: '#f0f2ff'
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

  function getBattleVictoryOffers(result) {
    var offers = [];
    var enemyIds = [];
    var seen = {};
    if (!result) return offers;
    if (Array.isArray(result.enemyIds)) {
      enemyIds = result.enemyIds.slice();
    } else if (result.enemyId) {
      enemyIds = [result.enemyId];
    }
    for (var i = 0; i < enemyIds.length; i++) {
      var offer = victoryOffers[enemyIds[i]];
      if (!offer || seen[offer.skillId]) continue;
      offers.push({
        skillId: offer.skillId,
        sourceText: offer.sourceText,
        enemyId: enemyIds[i]
      });
      seen[offer.skillId] = true;
    }
    return offers;
  }

  return {
    get: get,
    getAll: getAll,
    getLearnableSkillForRank: getLearnableSkillForRank,
    getLearnOrder: getLearnOrder,
    getBattleVictoryOffers: getBattleVictoryOffers
  };
})();
