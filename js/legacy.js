// Legacy Card Collection System
Game.Legacy = (function() {
  var STORAGE_KEY = 'gunmaEscape_cards';
  var NOTIFICATION_DURATION = 120;
  var CARD_WIDTH = 70;
  var CARD_HEIGHT = 90;
  var CARDS_PER_ROW = 5;
  var categories = {
    characters: { label: '人物', color: '#cc5544' },
    locations: { label: '場所', color: '#4477cc' },
    legends: { label: '伝説', color: '#8b55cc' },
    culture: { label: '文化', color: '#44aa66' },
    items: { label: '品目', color: '#d4a63a' }
  };

  var cards = [
    { id: 'maebashi', number: 1, name: '前橋', category: 'locations', rarity: 1, description: '県都・前橋。旅の始まりと上州文化の入口。', unlocked: false, unlockType: 'map', unlockValue: 'maebashi' },
    { id: 'takasaki', number: 2, name: '高崎', category: 'locations', rarity: 1, description: 'だるまの街。願掛けと商人の活気に満ちる。', unlocked: false, unlockType: 'map', unlockValue: 'takasaki' },
    { id: 'kusatsu', number: 3, name: '草津', category: 'locations', rarity: 2, description: '天下の名湯。湯けむりと湯もみ歌が迎える温泉郷。', unlocked: false, unlockType: 'map', unlockValue: 'kusatsu' },
    { id: 'shimonita', number: 4, name: '下仁田', category: 'locations', rarity: 2, description: '山あいの宿場。こんにゃくと名産ねぎで知られる。', unlocked: false, unlockType: 'map', unlockValue: 'shimonita' },
    { id: 'tsumagoi', number: 5, name: '嬬恋', category: 'locations', rarity: 2, description: '高原に広がるキャベツ畑。風と大地の恵みの地。', unlocked: false, unlockType: 'map', unlockValue: 'tsumagoi' },
    { id: 'tamura', number: 6, name: 'タムラ村', category: 'locations', rarity: 2, description: '第二章の拠点。職人たちが息づく村。', unlocked: false, unlockType: 'map', unlockValue: 'tamura' },
    { id: 'forest', number: 7, name: '廃墟の森', category: 'locations', rarity: 3, description: '霧に沈む遺構の森。旅人を惑わす静寂が漂う。', unlocked: false, unlockType: 'map', unlockValue: 'forest' },
    { id: 'konuma', number: 8, name: '小沼', category: 'locations', rarity: 3, description: '闇商人が潜む静かな湖畔。赤城の影が揺れる。', unlocked: false, unlockType: 'map', unlockValue: 'konuma' },
    { id: 'onuma', number: 9, name: '大沼', category: 'locations', rarity: 3, description: 'ワカサギ釣りで知られる赤城山上の大きな湖。', unlocked: false, unlockType: 'map', unlockValue: 'onuma' },
    { id: 'akagi_ranch', number: 10, name: '赤城牧場', category: 'locations', rarity: 4, description: '伝説の鍛冶師が待つ高地の牧場。嵐雲が近い。', unlocked: false, unlockType: 'map', unlockValue: 'akagi_ranch' },
    { id: 'akagi_shrine', number: 11, name: '赤城神社', category: 'locations', rarity: 5, description: '赤城の信仰が集う聖域。闇と祈りの終着点。', unlocked: false, unlockType: 'map', unlockValue: 'akagi_shrine' },

    { id: 'onsen_monkey', number: 12, name: '温泉猿', category: 'characters', rarity: 2, description: '草津の湯を守るやんちゃな主。勝てば鍵を託す。', unlocked: false, unlockType: 'boss', unlockValue: 'onsenMonkey' },
    { id: 'daruma_master', number: 13, name: 'だるま師匠', category: 'characters', rarity: 2, description: '七転び八起きを教える高崎の達人。', unlocked: false, unlockType: 'boss', unlockValue: 'darumaMaster' },
    { id: 'konnyaku_king', number: 14, name: 'こんにゃく大王', category: 'characters', rarity: 3, description: '下仁田を治める謎多き王。クイズを好む。', unlocked: false, unlockType: 'boss', unlockValue: 'konnyakuKing' },
    { id: 'cabbage_guardian', number: 15, name: 'キャベツ番人', category: 'characters', rarity: 3, description: '嬬恋の畑を守る誇り高き番人。', unlocked: false, unlockType: 'boss', unlockValue: 'cabbageGuardian' },
    { id: 'angura_guard', number: 16, name: 'アングラの見張り', category: 'characters', rarity: 3, description: '山道を封鎖するアングラの先兵。', unlocked: false, unlockType: 'boss', unlockValue: 'angura_guard' },
    { id: 'chuji', number: 17, name: '国定忠治', category: 'characters', rarity: 5, description: '義侠に生きる上州の伝説。剣と仁義を背負う。', unlocked: false, unlockType: 'boss', unlockValue: 'kunisada_chuji' },
    { id: 'angura_boss', number: 18, name: 'ナンバー12-グンマ', category: 'characters', rarity: 5, description: '名を失った運び屋の長。赤城神社で待つ宿敵。', unlocked: false, unlockType: 'boss', unlockValue: 'angura_boss' },
    { id: 'shuuou', number: 19, name: '龝櫻', category: 'characters', rarity: 3, description: 'タムラ村を導く知恵者。第二章の旅路を照らす。', unlocked: false, unlockType: 'npc', unlockValue: 'shuuou' },
    { id: 'akagi', number: 20, name: 'アカギ', category: 'characters', rarity: 3, description: '赤城の名を継ぐ不思議な案内人。', unlocked: false, unlockType: 'npc', unlockValue: 'akagi_npc' },
    { id: 'hana', number: 21, name: '花', category: 'characters', rarity: 4, description: '赤城神社に囚われた村長の娘。', unlocked: false, unlockType: 'npc', unlockValue: 'hana' },

    { id: 'yakimanju', number: 22, name: '焼きまんじゅう', category: 'items', rarity: 2, description: '香ばしい味噌だれが魅力の上州名物。', unlocked: false, unlockType: 'item', unlockValue: 'yakimanju' },
    { id: 'konnyaku', number: 23, name: 'こんにゃく', category: 'items', rarity: 2, description: '群馬を代表する特産品。ぷるんとした歯ごたえ。', unlocked: false, unlockType: 'item', unlockValue: 'konnyaku' },
    { id: 'daruma', number: 24, name: 'だるま', category: 'items', rarity: 3, description: '願いを託す縁起物。高崎文化の象徴。', unlocked: false, unlockType: 'item', unlockValue: 'daruma' },
    { id: 'silk', number: 25, name: '絹', category: 'items', rarity: 3, description: '養蚕王国・群馬が育てた白く強い糸。', unlocked: false, unlockType: 'item', unlockValue: 'silk' },
    { id: 'karuta', number: 26, name: '上毛かるた', category: 'items', rarity: 3, description: '郷土の誇りを歌に刻む札遊び。', unlocked: false, unlockType: 'item', unlockValue: 'karuta' },

    { id: 'onsen_culture', number: 27, name: '湯もみ文化', category: 'culture', rarity: 2, description: '草津に伝わる湯もみ歌と湯治の知恵。', unlocked: false, unlockType: 'puzzle', unlockValue: 'quiz' },
    { id: 'yamato_takeru', number: 28, name: 'ヤマトタケル', category: 'legends', rarity: 4, description: '上毛の山野を越えたと伝わる英雄。', unlocked: false, unlockType: 'hidden', unlockValue: 'yamato_takeru' },
    { id: 'centipede_myth', number: 29, name: '大百足伝説', category: 'legends', rarity: 4, description: '山に棲む巨大百足を退治したという怪異譚。', unlocked: false, unlockType: 'hidden', unlockValue: 'centipede_myth' },
    { id: 'akagi_princess', number: 30, name: '赤城姫', category: 'legends', rarity: 5, description: '赤城山を見守る姫神。霧の彼方にその影を見る。', unlocked: false, unlockType: 'hidden', unlockValue: 'akagi_princess' }
  ];

  var cardById = {};
  var currentNotification = null;
  var notificationQueue = [];
  var viewMode = 'closed';
  var selectedIndex = 0;
  var scrollRow = 0;
  var lastUnlockedCount = 0;
  var runtime = {
    visitedMaps: {},
    defeatedBosses: {},
    completedPuzzles: {},
    hiddenFinds: {},
    collectedItems: {}
  };

  buildIndex();
  load();
  lastUnlockedCount = getUnlockedCount();

  function buildIndex() {
    for (var i = 0; i < cards.length; i++) {
      cardById[cards[i].id] = cards[i];
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cards: cards.map(function(card) {
          return {
            id: card.id,
            unlocked: !!card.unlocked,
            unlockedAt: card.unlockedAt || null
          };
        }),
        runtime: runtime,
        lastUnlockedCount: lastUnlockedCount
      }));
    } catch (err) {
      // Ignore storage errors.
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved.cards && saved.cards.length) {
        for (var i = 0; i < saved.cards.length; i++) {
          var savedCard = saved.cards[i];
          var card = cardById[savedCard.id];
          if (!card) continue;
          card.unlocked = !!savedCard.unlocked;
          card.unlockedAt = savedCard.unlockedAt || null;
        }
      }
      if (saved.runtime) {
        runtime.visitedMaps = saved.runtime.visitedMaps || {};
        runtime.defeatedBosses = saved.runtime.defeatedBosses || {};
        runtime.completedPuzzles = saved.runtime.completedPuzzles || {};
        runtime.hiddenFinds = saved.runtime.hiddenFinds || {};
        runtime.collectedItems = saved.runtime.collectedItems || {};
      }
      lastUnlockedCount = saved.lastUnlockedCount || getUnlockedCount();
    } catch (err) {
      // Ignore malformed values.
    }
  }

  function getCard(cardId) {
    return cardById[cardId] || null;
  }

  function getAllCards() {
    return clone(cards);
  }

  function getUnlockedCards() {
    var result = [];
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].unlocked) result.push(cards[i]);
    }
    return result;
  }

  function getUnlockedCount() {
    return getUnlockedCards().length;
  }

  function getTotalCount() {
    return cards.length;
  }

  function isUnlocked(cardId) {
    var card = getCard(cardId);
    return !!(card && card.unlocked);
  }

  function getCollectionTitle() {
    return getUnlockedCount() >= getTotalCount() ? '群馬マスター' : '';
  }

  function queueNotification(card) {
    notificationQueue.push({
      id: card.id,
      name: card.name,
      timer: NOTIFICATION_DURATION
    });
    if (!currentNotification) {
      currentNotification = notificationQueue.shift();
    }
  }

  function applyBonuses() {
    if (!Game.Player || !Game.Player.getData) return false;
    var unlocked = getUnlockedCount();
    var delta = unlocked - lastUnlockedCount;
    if (delta <= 0) return false;
    var player = Game.Player.getData();
    var beforeHpTier = Math.floor(lastUnlockedCount / 5);
    var afterHpTier = Math.floor(unlocked / 5);
    var beforeAtkTier = Math.floor(lastUnlockedCount / 10);
    var afterAtkTier = Math.floor(unlocked / 10);

    if (afterHpTier > beforeHpTier) {
      player.maxHp += (afterHpTier - beforeHpTier) * 5;
      player.hp += (afterHpTier - beforeHpTier) * 5;
    }
    if (afterAtkTier > beforeAtkTier) {
      player.attack += (afterAtkTier - beforeAtkTier) * 2;
    }
    lastUnlockedCount = unlocked;
    persist();
    return true;
  }

  function unlock(cardId) {
    var card = getCard(cardId);
    if (!card || card.unlocked) return false;
    card.unlocked = true;
    card.unlockedAt = Date.now();
    queueNotification(card);
    if (Game.Audio && Game.Audio.playSfx) {
      Game.Audio.playSfx('achievement');
    }
    applyBonuses();
    persist();
    return true;
  }

  function findByCondition(type, value) {
    var result = [];
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].unlockType === type && cards[i].unlockValue === value) {
        result.push(cards[i]);
      }
    }
    return result;
  }

  function unlockByCondition(type, value) {
    var matches = findByCondition(type, value);
    var changed = false;
    for (var i = 0; i < matches.length; i++) {
      changed = unlock(matches[i].id) || changed;
    }
    return changed;
  }

  function markMapVisited(mapId) {
    if (!mapId || runtime.visitedMaps[mapId]) return false;
    runtime.visitedMaps[mapId] = true;
    var changed = unlockByCondition('map', mapId);
    persist();
    return changed;
  }

  function markBossDefeated(bossId) {
    if (!bossId || runtime.defeatedBosses[bossId]) return false;
    runtime.defeatedBosses[bossId] = true;
    var changed = unlockByCondition('boss', bossId);
    persist();
    return changed;
  }

  function markPuzzleCompleted(puzzleId) {
    if (!puzzleId || runtime.completedPuzzles[puzzleId]) return false;
    runtime.completedPuzzles[puzzleId] = true;
    var changed = unlockByCondition('puzzle', puzzleId);
    persist();
    return changed;
  }

  function markHiddenItemFound(hiddenId) {
    if (!hiddenId || runtime.hiddenFinds[hiddenId]) return false;
    runtime.hiddenFinds[hiddenId] = true;
    var changed = unlockByCondition('hidden', hiddenId);
    persist();
    return changed;
  }

  function markItemCollected(itemId) {
    if (!itemId || runtime.collectedItems[itemId]) return false;
    runtime.collectedItems[itemId] = true;
    var changed = unlockByCondition('item', itemId);
    persist();
    return changed;
  }

  function normalizeSelection() {
    if (selectedIndex < 0) selectedIndex = 0;
    if (selectedIndex >= cards.length) selectedIndex = cards.length - 1;
    var row = Math.floor(selectedIndex / CARDS_PER_ROW);
    if (row < scrollRow) scrollRow = row;
    if (row >= scrollRow + 2) scrollRow = row - 1;
  }

  function openGallery() {
    viewMode = 'gallery';
    normalizeSelection();
  }

  function closeGallery() {
    viewMode = 'closed';
  }

  function toggleGallery() {
    viewMode = viewMode === 'closed' ? 'gallery' : 'closed';
    normalizeSelection();
    return viewMode !== 'closed';
  }

  function update(type, payload) {
    if (typeof type === 'string') {
      payload = payload || {};
      switch (type) {
        case 'map_visit': return markMapVisited(payload.mapId || payload.id);
        case 'boss_defeat': return markBossDefeated(payload.bossId || payload.id);
        case 'puzzle_complete': return markPuzzleCompleted(payload.puzzleId || payload.id);
        case 'hidden_found': return markHiddenItemFound(payload.hiddenId || payload.id);
        case 'item_collect': return markItemCollected(payload.itemId || payload.id);
        case 'npc_meet': return unlockByCondition('npc', payload.npcId || payload.id);
      }
      return false;
    }

    if (currentNotification) {
      currentNotification.timer--;
      if (currentNotification.timer <= 0) {
        currentNotification = notificationQueue.length ? notificationQueue.shift() : null;
      }
    }

    if (viewMode === 'closed' || !Game.Input) return false;

    if (viewMode === 'gallery') {
      if (Game.Input.isPressed('left')) selectedIndex--;
      if (Game.Input.isPressed('right')) selectedIndex++;
      if (Game.Input.isPressed('up')) selectedIndex -= CARDS_PER_ROW;
      if (Game.Input.isPressed('down')) selectedIndex += CARDS_PER_ROW;
      normalizeSelection();
      if (Game.Input.isPressed('confirm')) viewMode = 'detail';
      if (Game.Input.isPressed('cancel')) closeGallery();
    } else if (viewMode === 'detail') {
      if (Game.Input.isPressed('cancel')) viewMode = 'gallery';
    }

    return true;
  }

  function drawCardBack(x, y, card, selected) {
    var category = categories[card.category];
    var border = card.unlocked ? '#ffcc44' : '#777';
    if (selected) border = '#ffffff';
    Game.Renderer.drawRectAbsolute(x, y, CARD_WIDTH, CARD_HEIGHT, 'rgba(16,20,32,0.96)');
    Game.Renderer.drawRectAbsolute(x, y, CARD_WIDTH, 2, border);
    Game.Renderer.drawRectAbsolute(x, y + CARD_HEIGHT - 2, CARD_WIDTH, 2, border);
    Game.Renderer.drawRectAbsolute(x, y, 2, CARD_HEIGHT, border);
    Game.Renderer.drawRectAbsolute(x + CARD_WIDTH - 2, y, 2, CARD_HEIGHT, border);
    Game.Renderer.drawRectAbsolute(x + 2, y + 2, CARD_WIDTH - 4, 10, category.color);
    Game.Renderer.drawTextJP('#' + card.number, x + 4, y + 15, '#98a4c8', 8);
    Game.Renderer.drawTextJP(card.unlocked ? card.name : '???', x + CARD_WIDTH / 2, y + 36, card.unlocked ? '#fff' : '#666', 11, 'center');
    if (card.unlocked) {
      Game.Renderer.drawTextJP(category.label, x + CARD_WIDTH / 2, y + 58, '#cfd5ef', 9, 'center');
      Game.Renderer.drawTextJP(repeatStars(card.rarity), x + CARD_WIDTH / 2, y + 72, '#ffcc44', 8, 'center');
    }
  }

  function repeatStars(count) {
    var text = '';
    for (var i = 0; i < count; i++) text += '★';
    return text;
  }

  function drawGallery() {
    var R = Game.Renderer;
    var C = Game.Config;
    var startX = 18;
    var startY = 46;
    var rowSpacing = 102;
    var colSpacing = 90;
    var visibleRows = 2;
    var topRow = scrollRow;

    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, 'rgba(8,10,22,0.98)');
    R.drawTextJP('レガシーカード図鑑', 134, 10, '#ffcc44', 18);
    R.drawTextJP('コレクション: ' + getUnlockedCount() + '/' + getTotalCount() + ' 枚', 138, 30, '#dbe1f8', 11);

    for (var row = 0; row < visibleRows; row++) {
      for (var col = 0; col < CARDS_PER_ROW; col++) {
        var cardIndex = (topRow + row) * CARDS_PER_ROW + col;
        if (cardIndex >= cards.length) continue;
        drawCardBack(startX + col * colSpacing, startY + row * rowSpacing, cards[cardIndex], cardIndex === selectedIndex);
      }
    }

    R.drawTextJP('矢印: 移動  Z: 詳細  X: 閉じる', 110, 300, '#8c96bb', 10);
  }

  function wrapText(text, maxChars) {
    var lines = [];
    var remaining = text;
    while (remaining.length > maxChars) {
      lines.push(remaining.substring(0, maxChars));
      remaining = remaining.substring(maxChars);
    }
    lines.push(remaining);
    return lines;
  }

  function drawPattern(x, y, w, h, colorA, colorB) {
    for (var row = 0; row < h; row += 12) {
      for (var col = 0; col < w; col += 12) {
        var color = ((row + col) / 12) % 2 === 0 ? colorA : colorB;
        Game.Renderer.drawRectAbsolute(x + col, y + row, 10, 10, color);
      }
    }
  }

  function drawDetail() {
    var R = Game.Renderer;
    var card = cards[selectedIndex];
    var category = categories[card.category];
    var detailX = 140;
    var detailY = 18;

    R.drawRectAbsolute(0, 0, 480, 320, 'rgba(5,8,20,0.98)');
    R.drawRectAbsolute(detailX, detailY, 200, 280, 'rgba(18,24,40,0.98)');
    R.drawRectAbsolute(detailX, detailY, 200, 4, card.unlocked ? '#ffcc44' : '#777');
    R.drawRectAbsolute(detailX + 8, detailY + 12, 184, 18, category.color);
    R.drawTextJP(card.unlocked ? card.name : '???', 240, detailY + 38, card.unlocked ? '#ffffff' : '#777', 16, 'center');
    R.drawTextJP('レア度: ' + repeatStars(card.rarity), 168, detailY + 60, '#ffcc44', 10);

    drawPattern(detailX + 20, detailY + 82, 160, 96, category.color, 'rgba(255,255,255,0.08)');
    R.drawRectAbsolute(detailX + 20, detailY + 82, 160, 96, 'rgba(0,0,0,0.12)');
    R.drawTextJP(category.label, 240, detailY + 120, '#ffffff', 12, 'center');
    R.drawTextJP('#' + card.number, detailX + 152, detailY + 188, '#cfd5ef', 10);

    if (card.unlocked) {
      var lines = wrapText(card.description, 14);
      R.drawTextJP('カテゴリー: ' + category.label, detailX + 18, detailY + 194, '#dfe5f8', 10);
      for (var i = 0; i < lines.length && i < 4; i++) {
        R.drawTextJP(lines[i], detailX + 18, detailY + 214 + i * 16, '#d4daef', 10);
      }
      R.drawTextJP('発見日: ' + new Date(card.unlockedAt).toLocaleDateString('ja-JP'), detailX + 18, detailY + 266, '#9aa6ca', 9);
    } else {
      R.drawTextJP('まだ発見していないカードです。', detailX + 20, detailY + 218, '#777', 11);
    }

    R.drawTextJP('X: 戻る', 214, 302, '#8c96bb', 10);
  }

  function drawNotification() {
    if (!currentNotification) return false;
    var y = 18;
    Game.Renderer.drawRectAbsolute(110, y, 260, 42, 'rgba(30,18,0,0.92)');
    Game.Renderer.drawRectAbsolute(110, y, 260, 2, '#ffcc44');
    Game.Renderer.drawTextJP('カード発見！', 195, y + 6, '#ffcc44', 14);
    Game.Renderer.drawTextJP(currentNotification.name, 240, y + 22, '#fff', 11, 'center');
    return true;
  }

  function drawMasterTitle() {
    if (!getCollectionTitle()) return false;
    Game.Renderer.drawRectAbsolute(170, 5, 140, 16, 'rgba(20,20,20,0.7)');
    Game.Renderer.drawTextJP(getCollectionTitle(), 240, 8, '#ffcc44', 10, 'center');
    return true;
  }

  function draw() {
    if (viewMode === 'gallery') {
      drawGallery();
      return true;
    }
    if (viewMode === 'detail') {
      drawDetail();
      return true;
    }
    return drawNotification();
  }

  function reset() {
    for (var i = 0; i < cards.length; i++) {
      cards[i].unlocked = false;
      cards[i].unlockedAt = null;
    }
    currentNotification = null;
    notificationQueue = [];
    runtime.visitedMaps = {};
    runtime.defeatedBosses = {};
    runtime.completedPuzzles = {};
    runtime.hiddenFinds = {};
    runtime.collectedItems = {};
    lastUnlockedCount = 0;
    persist();
  }

  function getBonus() {
    var unlocked = getUnlockedCount();
    return {
      hp: Math.floor(unlocked / 5) * 5,
      attack: Math.floor(unlocked / 10) * 2
    };
  }

  return {
    unlock: unlock,
    unlockCard: unlock,
    isUnlocked: isUnlocked,
    getCard: function(cardId) {
      var card = getCard(cardId);
      return card ? clone(card) : null;
    },
    getUnlockedCards: function() {
      return clone(getUnlockedCards());
    },
    getUnlockedCount: getUnlockedCount,
    getTotalCount: getTotalCount,
    getAllCards: getAllCards,
    getCollection: getAllCards,
    getBonus: getBonus,
    drawCardView: draw,
    draw: function() { return drawGallery(); },
    drawDetail: drawDetail,
    drawNotification: drawNotification,
    drawMasterTitle: drawMasterTitle,
    update: update,
    openGallery: openGallery,
    closeGallery: closeGallery,
    toggleGallery: toggleGallery,
    isOpen: function() { return viewMode !== 'closed'; },
    markMapVisited: markMapVisited,
    markBossDefeated: markBossDefeated,
    markPuzzleCompleted: markPuzzleCompleted,
    markHiddenItemFound: markHiddenItemFound,
    markItemCollected: markItemCollected,
    applyBonuses: applyBonuses,
    getCollectionTitle: getCollectionTitle,
    save: function() { persist(); return true; },
    load: function() { load(); return true; },
    reset: reset
  };
})();
