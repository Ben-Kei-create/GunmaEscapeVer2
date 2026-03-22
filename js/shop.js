// Shop system
Game.Shop = (function() {
  var active = false;
  var shopItems = [];   // array of item IDs for sale
  var shopName = '';
  var menuIndex = 0;
  var scrollOffset = 0;
  var maxVisible = 5;
  var message = '';
  var messageTimer = 0;
  var confirmBuy = false;

  function start(name, items) {
    active = true;
    shopName = name || 'ショップ';
    shopItems = items || [];
    menuIndex = 0;
    scrollOffset = 0;
    message = '';
    messageTimer = 0;
    confirmBuy = false;
    Game.Audio.stopBgm();
    Game.Audio.playBgm('shop');
  }

  function update() {
    if (!active) return null;

    if (messageTimer > 0) {
      messageTimer--;
      if (messageTimer <= 0) {
        message = '';
        confirmBuy = false;
      }
      return null;
    }

    // Cancel / exit shop
    if (Game.Input.isPressed('cancel')) {
      if (confirmBuy) {
        confirmBuy = false;
        message = '';
        Game.Audio.playSfx('cancel');
      } else {
        active = false;
        Game.Audio.stopBgm();
        Game.Audio.playSfx('cancel');
        return { result: 'exit' };
      }
      return null;
    }

    if (Game.Input.isPressed('up')) {
      menuIndex = Math.max(0, menuIndex - 1);
      if (menuIndex < scrollOffset) scrollOffset = menuIndex;
      confirmBuy = false;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down')) {
      menuIndex = Math.min(shopItems.length, menuIndex + 1); // +1 for "exit" option
      if (menuIndex >= scrollOffset + maxVisible) scrollOffset = menuIndex - maxVisible + 1;
      confirmBuy = false;
      Game.Audio.playSfx('confirm');
    }

    if (Game.Input.isPressed('confirm')) {
      // Exit option (last item)
      if (menuIndex >= shopItems.length) {
        active = false;
        Game.Audio.stopBgm();
        Game.Audio.playSfx('cancel');
        return { result: 'exit' };
      }

      var itemId = shopItems[menuIndex];
      var item = Game.Items.get(itemId);
      if (!item) return null;

      var pd = Game.Player.getData();

      if (!confirmBuy) {
        // First press: show confirmation
        confirmBuy = true;
        message = item.name + '（' + item.price + 'G）を買う？ Z:はい X:いいえ';
        Game.Audio.playSfx('confirm');
        return null;
      }

      // Second press: buy
      if (pd.gold < item.price) {
        message = 'お金が足りない！';
        messageTimer = 40;
        confirmBuy = false;
        Game.Audio.playSfx('cancel');
        return null;
      }

      // Handle dice upgrade specially
      if (item.type === 'dice') {
        var currentDice = Game.Battle.getDiceCount();
        if (currentDice >= 5) {
          message = 'サイコロはもう最大数だ！';
          messageTimer = 40;
          confirmBuy = false;
          Game.Audio.playSfx('cancel');
          return null;
        }
        Game.Player.addGold(-item.price);
        Game.Battle.setDiceCount(currentDice + 1);
        message = 'サイコロが' + (currentDice + 1) + '個になった！';
        messageTimer = 50;
        confirmBuy = false;
        Game.Audio.playSfx('item');
        return null;
      }

      // Handle weapon/armor: equip immediately
      if (item.type === 'weapon' || item.type === 'armor') {
        Game.Player.addGold(-item.price);
        Game.Player.addItem(itemId);
        Game.Player.equip(itemId);
        if (item.type === 'weapon') {
          message = item.name + 'を装備した！ 攻撃力UP！';
        } else {
          message = item.name + 'を装備した！ 防御力UP！';
        }
        messageTimer = 50;
        confirmBuy = false;
        Game.Audio.playSfx('item');
        return null;
      }

      // Regular item
      Game.Player.addGold(-item.price);
      Game.Player.addItem(itemId);
      message = item.name + 'を買った！';
      messageTimer = 40;
      confirmBuy = false;
      Game.Audio.playSfx('item');
    }

    return null;
  }

  function draw() {
    if (!active) return;

    var R = Game.Renderer;
    var C = Game.Config;
    var ctx = R.getContext();
    var pd = Game.Player.getData();

    // Background
    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a0a22');

    // Shelf pattern
    ctx.strokeStyle = '#1a1a3a';
    ctx.lineWidth = 1;
    for (var i = 0; i < C.CANVAS_WIDTH; i += 24) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, C.CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Shop title
    R.drawDialogBox(10, 8, 200, 28);
    R.drawTextJP(shopName, 25, 14, C.COLORS.GOLD, 16);

    // Gold display
    R.drawDialogBox(C.CANVAS_WIDTH - 130, 8, 120, 28);
    R.drawTextJP('所持金: ' + pd.gold + 'G', C.CANVAS_WIDTH - 120, 14, '#ffdd44', 13);

    // Player stats
    R.drawDialogBox(C.CANVAS_WIDTH - 130, 42, 120, 60);
    R.drawTextJP('攻撃: ' + Game.Player.getAttack(), C.CANVAS_WIDTH - 120, 48, '#fff', 11);
    R.drawTextJP('防御: ' + Game.Player.getDefense(), C.CANVAS_WIDTH - 120, 63, '#fff', 11);
    R.drawTextJP('HP: ' + pd.hp + '/' + pd.maxHp, C.CANVAS_WIDTH - 120, 78, '#fff', 11);

    // Item list
    R.drawDialogBox(10, 42, C.CANVAS_WIDTH - 150, 200);

    var listX = 25;
    var listY = 50;
    var lineH = 36;

    for (var i = scrollOffset; i < Math.min(shopItems.length, scrollOffset + maxVisible); i++) {
      var item = Game.Items.get(shopItems[i]);
      if (!item) continue;

      var y = listY + (i - scrollOffset) * lineH;
      var selected = (i === menuIndex);
      var color = selected ? C.COLORS.GOLD : '#ccc';
      var prefix = selected ? '▶ ' : '  ';

      R.drawTextJP(prefix + item.name, listX, y, color, 13);
      R.drawTextJP(item.price + 'G', listX + 200, y, pd.gold >= item.price ? '#aaffaa' : '#ff6666', 12);
      R.drawTextJP(item.desc, listX + 18, y + 16, '#888', 10);
    }

    // Exit option
    var exitIdx = shopItems.length;
    if (exitIdx >= scrollOffset && exitIdx < scrollOffset + maxVisible) {
      var ey = listY + (exitIdx - scrollOffset) * lineH;
      var eSelected = (menuIndex === exitIdx);
      R.drawTextJP(eSelected ? '▶ やめる' : '  やめる', listX, ey, eSelected ? C.COLORS.GOLD : '#888', 13);
    }

    // Scroll indicators
    if (scrollOffset > 0) {
      R.drawTextJP('▲', C.CANVAS_WIDTH / 2 - 70, 42, '#888', 10);
    }
    if (scrollOffset + maxVisible < shopItems.length + 1) {
      R.drawTextJP('▼', C.CANVAS_WIDTH / 2 - 70, 238, '#888', 10);
    }

    // Equipped info
    R.drawDialogBox(10, 248, C.CANVAS_WIDTH - 20, 32);
    var weaponName = pd.weapon ? Game.Items.get(pd.weapon).name : 'なし';
    var armorName = pd.armor ? Game.Items.get(pd.armor).name : 'なし';
    R.drawTextJP('武器: ' + weaponName + '  防具: ' + armorName, 25, 254, '#aaa', 11);

    // Message
    if (message) {
      R.drawDialogBox(10, 284, C.CANVAS_WIDTH - 20, 30);
      R.drawTextJP(message, 20, 290, '#fff', 13);
    } else {
      R.drawDialogBox(10, 284, C.CANVAS_WIDTH - 20, 30);
      R.drawTextJP('Zキー: 購入  Xキー: 戻る', 20, 290, '#888', 11);
    }
  }

  function isActive() { return active; }

  return {
    start: start,
    update: update,
    draw: draw,
    isActive: isActive
  };
})();
