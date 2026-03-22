// Legacy Card Collection System
Game.Legacy = (function() {
  var cards = {
    kunisada_chuji: {
      id: 'kunisada_chuji',
      name: '国定忠治',
      category: '人物',
      description: '江戸時代末期に活躍した博徒・侠客。「ドカベン」との異名を持ち、貧しい者には情けを施したという。死後、その遺体は医学研究のために盗まれたという伝説がある。',
      unlocked: false
    },
    konnyaku: {
      id: 'konnyaku',
      name: 'こんにゃく',
      category: '特産品',
      description: '群馬県の特産品。蒟蒻芋から作られる食品で、低カロリーで健康食として知られる。伝説によると、山中に住むこんにゃく精は夜な夜な村に下りてきて、人に憑依するという。',
      unlocked: false
    },
    akagi_mountain: {
      id: 'akagi_mountain',
      name: '赤城山',
      category: '場所',
      description: '群馬県の北部に位置する活火山。古くから信仰の対象とされ、山頂には大沼、小沼という二つの火口湖がある。霧が発生しやすく、「赤城おろし」と呼ばれる強風が吹くことでも知られる。',
      unlocked: false
    },
    akagi_hime: {
      id: 'akagi_hime',
      name: '赤城姫',
      category: '伝説',
      description: '赤城山の女神。美しい姿で現れ、時に人を助け、時に試練を与えるという。噴火の前には姿を現すとも言われ、山の守護神として崇められている。',
      unlocked: false
    },
    onsen: {
      id: 'onsen',
      name: '温泉',
      category: '文化',
      description: '群馬県は「草津」「伊香保」「四万」など名湯が多く、古くから湯治場として栄えた。特に「草津の湯」は殺菌力が強いとされる。',
      unlocked: false
    },
    kaiko: {
      id: 'kaiko',
      name: '蚕（かいこ）',
      category: '文化',
      description: '群馬県は養蚕業が盛んで、日本の絹産業の中心地だった。富岡製糸場は日本初の官営模範製糸場として知られる。伝説によると、蚕は天女が残していった宝物だという。',
      unlocked: false
    },
    yuuma: {
      id: 'yuuma',
      name: 'ゆうま',
      category: '伝説',
      description: '上州の伝説的な妖怪。人の姿をしているが、その正体は大蛇とも言われる。人々を惑わし、時に連れ去ると伝えられている。「上州のゆうまさん」との言い伝えがある。',
      unlocked: false
    },
    angura: {
      id: 'angura',
      name: '暗鞍（アングラ）',
      category: '勢力',
      description: 'かつてはトラック運転手たちの自治組織だったが、高速道路の封鎖と物流網の崩壊により仕事を失い、山奥の隘路に潜む野盗へと変貌。自分の名前すら忘れ、ナンバープレートで呼び合っている。',
      unlocked: false
    },
    kitamo_snake: {
      id: 'kitamo_snake',
      name: '北毛の蛇',
      category: '伝説',
      description: '群馬県北部（北毛地方）に生息するとされる巨大な蛇。赤城山、榛名山、妙義山の三山を巡り、時に人を襲うとも言われる。',
      unlocked: false
    },
    shimonita_negi: {
      id: 'shimonita_negi',
      name: '下仁田ねぎ',
      category: '特産品',
      description: '群馬県下仁田町の特産品。太くて柔らかく、甘みが強いのが特徴。伝説によると、下仁田ねぎの畑で眠ると、夢の中で未来が見えるという。ただし、目覚めると記憶は失われる。',
      unlocked: false
    }
  };

  var totalCards = Object.keys(cards).length;

  function unlock(cardId) {
    if (cards[cardId]) {
      cards[cardId].unlocked = true;
    }
  }

  function isUnlocked(cardId) {
    return cards[cardId] && cards[cardId].unlocked;
  }

  function getCard(cardId) {
    return cards[cardId] || null;
  }

  function getUnlockedCards() {
    var result = [];
    for (var id in cards) {
      if (cards[id].unlocked) result.push(cards[id]);
    }
    return result;
  }

  function getUnlockedCount() {
    var count = 0;
    for (var id in cards) {
      if (cards[id].unlocked) count++;
    }
    return count;
  }

  function getTotalCount() {
    return totalCards;
  }

  function drawCardView(R, C) {
    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a0a2a');

    R.drawTextJP('レガシーカード', 160, 10, C.COLORS.GOLD, 18);
    R.drawTextJP('収集: ' + getUnlockedCount() + '/' + getTotalCount(), 180, 35, '#aaa', 12);

    var unlocked = getUnlockedCards();
    var startY = 55;
    var cardH = 50;

    if (unlocked.length === 0) {
      R.drawTextJP('カードはまだありません', 140, 150, '#888', 14);
    } else {
      for (var i = 0; i < unlocked.length && i < 5; i++) {
        var card = unlocked[i];
        var y = startY + i * (cardH + 5);
        // Card background
        R.drawDialogBox(20, y, C.CANVAS_WIDTH - 40, cardH);
        // Category badge
        var catColor = '#88aaff';
        if (card.category === '特産品') catColor = '#88cc44';
        if (card.category === '伝説') catColor = '#cc88ff';
        if (card.category === '人物') catColor = '#ffaa44';
        if (card.category === '勢力') catColor = '#ff4444';
        if (card.category === '文化') catColor = '#44cccc';
        R.drawRectAbsolute(30, y + 5, 40, 14, catColor);
        R.drawTextJP(card.category, 33, y + 6, '#000', 9);
        // Name
        R.drawTextJP(card.name, 80, y + 5, C.COLORS.GOLD, 13);
        // Description (truncated)
        var desc = card.description;
        if (desc.length > 30) desc = desc.substring(0, 30) + '...';
        R.drawTextJP(desc, 35, y + 25, '#ccc', 10);
      }
    }

    R.drawTextJP('Xキーで閉じる', 185, C.CANVAS_HEIGHT - 20, '#888', 10);
  }

  function reset() {
    for (var id in cards) {
      cards[id].unlocked = false;
    }
  }

  return {
    unlock: unlock,
    isUnlocked: isUnlocked,
    getCard: getCard,
    getUnlockedCards: getUnlockedCards,
    getUnlockedCount: getUnlockedCount,
    getTotalCount: getTotalCount,
    drawCardView: drawCardView,
    reset: reset
  };
})();
