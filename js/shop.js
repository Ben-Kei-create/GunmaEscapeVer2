// Shop system
Game.Shop = (function() {
  var active = false;
  var shopItems = [];
  var shopName = '';
  var menuIndex = 0;
  var scrollOffset = 0;
  var maxVisible = 5;
  var message = '';
  var messageTimer = 0;
  var confirmBuy = false;
  // Dice slot selection
  var selectingSlot = false;
  var slotIndex = 0;
  var pendingDiceId = null;

  function start(name, items) {
    active = true;
    shopName = name || 'ショップ';
    shopItems = items || [];
    menuIndex = 0;
    scrollOffset = 0;
    message = '';
    messageTimer = 0;
    confirmBuy = false;
    selectingSlot = false;
    pendingDiceId = null;
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
        selectingSlot = false;
        pendingDiceId = null;
      }
      return null;
    }

    // Dice slot selection mode
    if (selectingSlot) {
      var pd = Game.Player.getData();
      if (Game.Input.isPressed('left')) {
        slotIndex = Math.max(0, slotIndex - 1);
        Game.Audio.playSfx('confirm');
      }
      if (Game.Input.isPressed('right')) {
        slotIndex = Math.min(pd.diceSlots - 1, slotIndex + 1);
        Game.Audio.playSfx('confirm');
      }
      if (Game.Input.isPressed('cancel')) {
        selectingSlot = false;
        pendingDiceId = null;
        message = '';
        Game.Audio.playSfx('cancel');
        return null;
      }
      if (Game.Input.isPressed('confirm')) {
        // Equip the dice to the selected slot
        Game.Player.equipDice(pendingDiceId, slotIndex);
        var diceItem = Game.Items.get(pendingDiceId);
        message = diceItem.name + 'をスロット' + (slotIndex + 1) + 'に装備！';
        messageTimer = 50;
        selectingSlot = false;
        pendingDiceId = null;
        Game.Audio.playSfx('item');
        return null;
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
      menuIndex = Math.min(shopItems.length, menuIndex + 1);
      if (menuIndex >= scrollOffset + maxVisible) scrollOffset = menuIndex - maxVisible + 1;
      confirmBuy = false;
      Game.Audio.playSfx('confirm');
    }

    if (Game.Input.isPressed('confirm')) {
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
        confirmBuy = true;
        message = item.name + '（' + item.price + 'G）を買う？ Z:はい X:いいえ';
        Game.Audio.playSfx('confirm');
        return null;
      }

      if (pd.gold < item.price) {
        message = 'お金が足りない！';
        messageTimer = 40;
        confirmBuy = false;
        Game.Audio.playSfx('cancel');
        return null;
      }

      // Dice slot expander
      if (item.type === 'diceSlot') {
        if (pd.diceSlots >= 5) {
          message = 'サイコロ枠はもう最大だ！';
          messageTimer = 40;
          confirmBuy = false;
          Game.Audio.playSfx('cancel');
          return null;
        }
        Game.Player.addGold(-item.price);
        Game.Player.addDiceSlot();
        message = 'サイコロ枠が' + pd.diceSlots + '個になった！';
        messageTimer = 50;
        confirmBuy = false;
        Game.Audio.playSfx('item');
        return null;
      }

      // Dice purchase → then choose slot
      if (item.type === 'dice') {
        Game.Player.addGold(-item.price);
        Game.Player.addItem(itemId);
        confirmBuy = false;
        // Enter slot selection
        pendingDiceId = itemId;
        selectingSlot = true;
        slotIndex = 0;
        message = 'どのスロットに装備する？ ←→で選択 Zで決定';
        Game.Audio.playSfx('item');
        return null;
      }

      // Armor
      if (item.type === 'armor') {
        Game.Player.addGold(-item.price);
        Game.Player.addItem(itemId);
        Game.Player.equipArmor(itemId);
        message = item.name + 'を装備した！ 防御力UP！';
        messageTimer = 50;
        confirmBuy = false;
        Game.Audio.playSfx('item');
        return null;
      }

      // Regular item (heal etc)
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

    ctx.strokeStyle = '#1a1a3a';
    ctx.lineWidth = 1;
    for (var i = 0; i < C.CANVAS_WIDTH; i += 24) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, C.CANVAS_HEIGHT); ctx.stroke();
    }

    // Shop title
    R.drawDialogBox(10, 8, 200, 28);
    R.drawTextJP(shopName, 25, 14, C.COLORS.GOLD, 16);

    // Gold
    R.drawDialogBox(C.CANVAS_WIDTH - 130, 8, 120, 28);
    R.drawTextJP('所持金: ' + pd.gold + 'G', C.CANVAS_WIDTH - 120, 14, '#ffdd44', 13);

    // Player stats
    R.drawDialogBox(C.CANVAS_WIDTH - 130, 42, 120, 60);
    R.drawTextJP('防御: ' + Game.Player.getDefense(), C.CANVAS_WIDTH - 120, 48, '#fff', 11);
    R.drawTextJP('HP: ' + pd.hp + '/' + pd.maxHp, C.CANVAS_WIDTH - 120, 63, '#fff', 11);
    var armorName = pd.armor ? Game.Items.get(pd.armor).name : 'なし';
    R.drawTextJP('防具: ' + armorName, C.CANVAS_WIDTH - 120, 78, '#aaa', 10);

    // Item list
    R.drawDialogBox(10, 42, C.CANVAS_WIDTH - 150, 195);

    var listX = 25;
    var listY = 50;
    var lineH = 35;

    for (var i = scrollOffset; i < Math.min(shopItems.length, scrollOffset + maxVisible); i++) {
      var item = Game.Items.get(shopItems[i]);
      if (!item) continue;

      var y = listY + (i - scrollOffset) * lineH;
      var selected = (i === menuIndex);
      var color = selected ? C.COLORS.GOLD : '#ccc';
      var prefix = selected ? '▶ ' : '  ';

      // Die color swatch for dice items
      if (item.type === 'dice') {
        R.drawRectAbsolute(listX - 3, y + 2, 10, 10, item.color || '#fff');
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX - 3, y + 2, 10, 10);
      }

      R.drawTextJP(prefix + item.name, listX + 10, y, color, 13);
      R.drawTextJP(item.price + 'G', listX + 210, y, pd.gold >= item.price ? '#aaffaa' : '#ff6666', 12);
      R.drawTextJP(item.desc, listX + 28, y + 16, '#888', 9);
    }

    // Exit option
    var exitIdx = shopItems.length;
    if (exitIdx >= scrollOffset && exitIdx < scrollOffset + maxVisible) {
      var ey = listY + (exitIdx - scrollOffset) * lineH;
      var eSelected = (menuIndex === exitIdx);
      R.drawTextJP(eSelected ? '▶ やめる' : '  やめる', listX + 10, ey, eSelected ? C.COLORS.GOLD : '#888', 13);
    }

    // Scroll
    if (scrollOffset > 0) {
      R.drawTextJP('▲', C.CANVAS_WIDTH / 2 - 70, 42, '#888', 10);
    }
    if (scrollOffset + maxVisible < shopItems.length + 1) {
      R.drawTextJP('▼', C.CANVAS_WIDTH / 2 - 70, 233, '#888', 10);
    }

    // Dice loadout display
    R.drawDialogBox(10, 242, C.CANVAS_WIDTH - 20, 36);
    R.drawTextJP('サイコロ装備:', 20, 248, C.COLORS.GOLD, 11);
    var equipped = Game.Player.getEquippedDice();
    for (var s = 0; s < pd.diceSlots; s++) {
      var slotX = 115 + s * 60;
      var di = s < equipped.length ? Game.Items.get(equipped[s]) : null;
      var isSlotSelected = selectingSlot && s === slotIndex;

      // Slot box
      var boxColor = isSlotSelected ? '#ffcc00' : '#555';
      R.drawRectAbsolute(slotX, 246, 50, 28, isSlotSelected ? 'rgba(255,204,0,0.15)' : 'rgba(0,0,0,0.3)');
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = isSlotSelected ? 2 : 1;
      ctx.strokeRect(slotX, 246, 50, 28);

      if (di) {
        // Die color indicator
        R.drawRectAbsolute(slotX + 2, 248, 12, 12, di.color || '#fff');
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(slotX + 2, 248, 12, 12);
        // Name (abbreviated)
        var shortName = di.name.length > 5 ? di.name.substring(0, 5) : di.name;
        R.drawTextJP(shortName, slotX + 16, 249, '#ccc', 8);
        // Faces preview
        var facePrev = di.faces.join('-');
        if (facePrev.length > 12) facePrev = facePrev.substring(0, 12) + '..';
        R.drawTextJP(facePrev, slotX + 2, 262, '#777', 7);
      } else {
        R.drawTextJP('空', slotX + 20, 253, '#555', 10);
      }
    }

    // Message
    if (message) {
      R.drawDialogBox(10, 282, C.CANVAS_WIDTH - 20, 32);
      R.drawTextJP(message, 20, 289, '#fff', 12);
    } else {
      R.drawDialogBox(10, 282, C.CANVAS_WIDTH - 20, 32);
      R.drawTextJP('Zキー: 購入  Xキー: 戻る', 20, 289, '#888', 11);
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
