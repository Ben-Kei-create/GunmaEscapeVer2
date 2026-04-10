// Battle skill definitions and learn order
Game.Skills = (function() {
  var learnOrder = [
    'mikiashi',
    'kasanekan',
    'migamae',
    'ikitsugi',
    'hibashiri',
    'shirosenyomi',
    'tsumugibreathe',
    'kaminariyobi',
    'kaeriashi',
    'yukuguri',
    'tomuraiuta',
    'mayugomori',
    'nurebane',
    'mizukagami',
    'sasagebi',
    'hozureyubi',
    'tsuchinone',
    'namidagasa',
    'kazeokuri',
    'yomichigaeshi'
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
    },
    shimonita_packer: {
      skillId: 'hozureyubi',
      sourceText: '空っぽの荷箱を撫でるうち、絡まった無念をそっと解く指の動きを覚えた。'
    },
    tomioka_weaver: {
      skillId: 'mayugomori',
      sourceText: '止まらぬ機械の哀鳴を聞き、自らを白い糸で包み込んで外界から守る術を知った。'
    },
    yubatake_guardian: {
      skillId: 'namidagasa',
      sourceText: '沸き立つ孤独な湯に触れ、相手の熱をやわらげる「慈悲の傘」の差し方を学んだ。'
    },
    haruna_lake_beast: {
      skillId: 'mizukagami',
      sourceText: '霧深き湖畔の獣を鎮め、相手の悲哀を水面に映して静かに逸らす型を得た。'
    },
    oze_mud_wraith: {
      skillId: 'tsuchinone',
      sourceText: '泥に沈んだ記憶の重みを知り、大地の鼓動を次の一投へ添える祈りを身につけた。'
    },
    echo_guardian: {
      skillId: 'tomuraiuta',
      sourceText: '終わらない残響に耳を澄ませ、迷える影を慰める古い弔い唄を口ずさめるようになった。'
    }
  };

  var definitions = {
    mikiashi: {
      id: 'mikiashi',
      name: '見切り足',
      desc: '次のダイスがゆっくり回る。落ち着いて止めやすくなる。',
      shortDesc: '次のダイス速度を遅くする',
      stockGain: 3,
      stockCap: 9,
      color: '#8fe0ff'
    },
    kasanekan: {
      id: 'kasanekan',
      name: '重ね勘',
      desc: '次の出目へ勘を重ね、ダメージへ補正を足す。',
      shortDesc: '次のダイス補正+2',
      stockGain: 3,
      stockCap: 9,
      color: '#ffd66b'
    },
    migamae: {
      id: 'migamae',
      name: '身構え',
      desc: '肩を落として構え直し、しばらく受けを固める。',
      shortDesc: '2ターン防御アップ',
      stockGain: 3,
      stockCap: 8,
      color: '#8fdca0'
    },
    ikitsugi: {
      id: 'ikitsugi',
      name: '息継ぎ',
      desc: '一歩ぶんだけ呼吸を取り戻し、HPを12回復する。次の一投も少し見切りやすくなる。',
      shortDesc: 'HP12回復、次のダイス速度を少し緩める',
      stockGain: 3,
      stockCap: 7,
      color: '#9ff7d8'
    },
    hibashiri: {
      id: 'hibashiri',
      name: '火走り',
      desc: '次の一投に熱を帯びさせ、当たれば燃え移らせる。',
      shortDesc: '次の一投で火傷付与',
      stockGain: 2,
      stockCap: 6,
      color: '#ff9b6b'
    },
    shirosenyomi: {
      id: 'shirosenyomi',
      name: '白線読み',
      desc: '境界の綻びを見切り、相手の動き出しをひと拍子遅らせる。',
      shortDesc: '敵を1ターン足止め',
      stockGain: 2,
      stockCap: 6,
      color: '#c6d0ff'
    },
    tsumugibreathe: {
      id: 'tsumugibreathe',
      name: '紡ぎ息',
      desc: '乱れた呼吸を整え、鈍りや封印をほどく。',
      shortDesc: '鈍りと回復封印を解除',
      stockGain: 2,
      stockCap: 6,
      color: '#f1ece4'
    },
    kaminariyobi: {
      id: 'kaminariyobi',
      name: '雷呼び',
      desc: '上州の空気をまとい、しばらく攻め筋を鋭くする。',
      shortDesc: '攻撃上昇と賽補正',
      stockGain: 2,
      stockCap: 6,
      color: '#ffe066'
    },
    kaeriashi: {
      id: 'kaeriashi',
      name: '返り足',
      desc: '踏み込みを残して退き、次の被害をやわらげる。',
      shortDesc: '次の被ダメージを軽減',
      stockGain: 2,
      stockCap: 6,
      color: '#d8bfff'
    },
    yukuguri: {
      id: 'yukuguri',
      name: '湯くぐり',
      desc: '浅い湯気をくぐり、HPを18回復する。さらに2ターン、じわりと体力が戻る。',
      shortDesc: 'HP18回復、2ターン継続回復',
      stockGain: 2,
      stockCap: 5,
      color: '#9be4ff'
    },
    sokomiki: {
      id: 'sokomiki',
      name: '底見切り',
      desc: '低い目を拾い上げ、次の一投の最低値を引き上げる。返しの余白も少し残る。',
      shortDesc: '次のダメージ目を底上げし、軽い返しを得る',
      stockGain: 2,
      stockCap: 5,
      color: '#dfe6ff'
    },
    yunomatoi: {
      id: 'yunomatoi',
      name: '湯まとい',
      desc: '湯気をまとって鈍りをほどき、守りと再生を静かに残す。',
      shortDesc: '鈍り解除、防御アップ、継続回復',
      stockGain: 2,
      stockCap: 5,
      color: '#9be4ff'
    },
    hakokuzushi: {
      id: 'hakokuzushi',
      name: '荷崩し',
      desc: '相手の重心を崩し、次の一投で弱い綻びを拾いやすくする。',
      shortDesc: '相手を痺れさせ、次の賽補正+1',
      stockGain: 2,
      stockCap: 5,
      color: '#ffcb8f'
    },
    karakaze: {
      id: 'karakaze',
      name: '空っ風',
      desc: 'からっ風を背に受け、次の一投を見切りやすくしながら攻め筋を鋭くする。',
      shortDesc: '次の一投を見切りやすくし、攻撃上昇',
      stockGain: 2,
      stockCap: 5,
      color: '#c6f08f'
    },
    itoyurai: {
      id: 'itoyurai',
      name: '糸ゆらい',
      desc: '白糸の揺れを写し、相手の白い賽をしばらく鈍らせる。',
      shortDesc: '敵の白い賽を2ターン鈍らせる',
      stockGain: 2,
      stockCap: 5,
      color: '#f0f2ff'
    },
    tomuraiuta: {
      id: 'tomuraiuta',
      name: '弔い唄',
      desc: '寂しい土着の唄を口ずさみ、場を覆う敵意を静める。相手の攻めを削ぎ、自らの守りも整える。',
      shortDesc: '敵の攻撃低下、自身の防御上昇',
      stockGain: 1,
      stockCap: 4,
      color: '#b6a1b8'
    },
    mayugomori: {
      id: 'mayugomori',
      name: '繭ごもり',
      desc: '見えない糸で己を包み込み、悪い熱や封じをはじく。少しだけHPも立て直す。',
      shortDesc: '状態異常防御、HP8回復',
      stockGain: 1,
      stockCap: 3,
      color: '#faf6eb'
    },
    nurebane: {
      id: 'nurebane',
      name: '濡れ羽',
      desc: '涙で濡れた羽みたいに、次の高い目をしずかに寝かせる。手加減が要る儀式でも使いやすい。',
      shortDesc: '次の高いダメージ目を低く抑える',
      stockGain: 2,
      stockCap: 5,
      color: '#8193a8'
    },
    mizukagami: {
      id: 'mizukagami',
      name: '水鏡',
      desc: '水面の揺らぎに相手の悲哀を映し出し、次に来る痛みをそのまま受けずに逸らす。',
      shortDesc: '次の一撃を無効化',
      stockGain: 1,
      stockCap: 2,
      color: '#9baec4'
    },
    sasagebi: {
      id: 'sasagebi',
      name: '捧げ火',
      desc: '己の生命を少し灯りへ差し出し、次の一投を引き寄せ直す。HPを削る代わりに賽筋を大きく整える。',
      shortDesc: 'HP消費、次の一投を大きく強化',
      stockGain: 1,
      stockCap: 3,
      color: '#d96c4a'
    },
    hozureyubi: {
      id: 'hozureyubi',
      name: 'ほつれ指',
      desc: '絡まった無念を指先で優しくなぞる。儀式の張りつめたゲージをほどき、通常戦では敵の拍も鈍らせる。',
      shortDesc: '儀式ゲージ低下、通常戦では敵鈍化',
      stockGain: 1,
      stockCap: 4,
      color: '#e0ccba'
    },
    tsuchinone: {
      id: 'tsuchinone',
      name: '土の音',
      desc: '大地に耳を澄まし、土地の記憶を拾い上げる。次の一投に小さな回復と返しの余白を添える。',
      shortDesc: '次の一投に回復と返しを付与',
      stockGain: 2,
      stockCap: 4,
      color: '#73614e'
    },
    namidagasa: {
      id: 'namidagasa',
      name: '涙傘',
      desc: '悲しみの雨を凌ぐため、そっと傘を差し出す。ダメージを与えず、敵味方の痛みを少しだけやわらげる。',
      shortDesc: '敵味方のHPを少し回復',
      stockGain: 1,
      stockCap: 3,
      color: '#a4b1d6'
    },
    kazeokuri: {
      id: 'kazeokuri',
      name: '風送り',
      desc: '乾いた空っ風に乗せて、相手の勢いを空へ還す。敵の強まりを払い、その攻め手も鈍らせる。',
      shortDesc: '敵強化を解除し、攻撃低下',
      stockGain: 2,
      stockCap: 4,
      color: '#bccabf'
    },
    yomichigaeshi: {
      id: 'yomichigaeshi',
      name: '黄泉返し',
      desc: '境界の理を逆手に取り、倒れゆく体を一度だけ引き戻す。次に致命打を受けてもHP1で踏みとどまる。',
      shortDesc: '一度だけ致死ダメージをHP1で耐える',
      stockGain: 1,
      stockCap: 1,
      color: '#554261'
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

  function getStockGain(id) {
    var skill = get(id);
    return skill ? Math.max(1, skill.stockGain || 1) : 1;
  }

  function getStockCap(id) {
    var skill = get(id);
    return skill ? Math.max(getStockGain(id), skill.stockCap || getStockGain(id)) : 1;
  }

  return {
    get: get,
    getAll: getAll,
    getLearnableSkillForRank: getLearnableSkillForRank,
    getLearnOrder: getLearnOrder,
    getBattleVictoryOffers: getBattleVictoryOffers,
    getStockGain: getStockGain,
    getStockCap: getStockCap
  };
})();
