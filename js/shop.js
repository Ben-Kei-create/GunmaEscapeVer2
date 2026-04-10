// Shop system
Game.Shop = (function() {
  var runtime = window.__gunmaShopRuntime || {
    purchases: {}
  };
  window.__gunmaShopRuntime = runtime;
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

  function getUiControlHint(id, fallback) {
    if (Game.UI && Game.UI.getControlHint) {
      return Game.UI.getControlHint(id) || fallback || '';
    }
    return fallback || '';
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clampText(text, maxChars) {
    text = text || '';
    if (text.length <= maxChars) return text;
    return text.substring(0, Math.max(0, maxChars - 1)) + '…';
  }

  function wrapText(text, maxChars, maxLines) {
    var lines = [];
    var source = text || '';
    var index = 0;
    while (index < source.length && (!maxLines || lines.length < maxLines)) {
      lines.push(source.substring(index, index + maxChars));
      index += maxChars;
    }
    return lines;
  }

  function sanitizeCount(value) {
    return Math.max(0, Math.floor(value || 0));
  }

  function normalizeRuntimeState(state) {
    var normalized = { purchases: {} };
    var purchases = state && state.purchases ? state.purchases : state;
    if (!purchases || typeof purchases !== 'object') return normalized;

    for (var shopKey in purchases) {
      if (!purchases.hasOwnProperty(shopKey)) continue;
      var sourceShop = purchases[shopKey];
      if (!sourceShop || typeof sourceShop !== 'object') continue;
      var targetShop = {};
      for (var itemId in sourceShop) {
        if (!sourceShop.hasOwnProperty(itemId)) continue;
        var count = sanitizeCount(sourceShop[itemId]);
        if (count > 0) targetShop[itemId] = count;
      }
      if (Object.keys(targetShop).length > 0) {
        normalized.purchases[shopKey] = targetShop;
      }
    }
    return normalized;
  }

  function getSoldOutFlag(itemId, targetShopName) {
    return 'shop_sold_' + (targetShopName || shopName) + '_' + itemId;
  }

  function getBaseStock(itemId) {
    var item = Game.Items.get(itemId);
    if (!item) return 0;
    if (typeof item.shopStock === 'number' && isFinite(item.shopStock)) {
      return Math.max(1, Math.floor(item.shopStock));
    }
    if (item.uniqueStock || item.type === 'diceSlot' || item.type === 'dice' || item.type === 'armor') {
      return 1;
    }
    if (item.type === 'battle') return 2;
    if (item.type === 'heal') {
      if (item.price <= 25) return 3;
      if (item.price <= 50) return 2;
      return 1;
    }
    return 1;
  }

  function getShopPurchases(targetShopName) {
    var key = targetShopName || shopName || '';
    if (!runtime.purchases[key]) runtime.purchases[key] = {};
    return runtime.purchases[key];
  }

  function getPurchasedCount(itemId, targetShopName) {
    var baseStock = getBaseStock(itemId);
    if (baseStock <= 0) return 0;

    var sourceShop = runtime.purchases[targetShopName || shopName] || {};
    var purchased = sanitizeCount(sourceShop[itemId]);
    if (!purchased) {
      var item = Game.Items.get(itemId);
      if (item && item.uniqueStock && Game.Story && Game.Story.hasFlag && Game.Story.hasFlag(getSoldOutFlag(itemId, targetShopName))) {
        purchased = baseStock;
      }
    }
    return Math.min(baseStock, purchased);
  }

  function getRemainingStock(itemId, targetShopName) {
    var baseStock = getBaseStock(itemId);
    if (baseStock <= 0) return 0;
    return Math.max(0, baseStock - getPurchasedCount(itemId, targetShopName));
  }

  function isItemSoldOut(itemId) {
    return getRemainingStock(itemId) <= 0;
  }

  function recordPurchase(itemId) {
    var baseStock = getBaseStock(itemId);
    if (baseStock <= 0) return 0;

    var item = Game.Items.get(itemId);
    var purchases = getShopPurchases();
    var purchased = getPurchasedCount(itemId);
    if (purchased >= baseStock) return 0;

    purchases[itemId] = purchased + 1;
    if (item && item.uniqueStock && Game.Story && Game.Story.setFlag) {
      Game.Story.setFlag(getSoldOutFlag(itemId));
      if (Game.Story.saveFlags) Game.Story.saveFlags();
    }
    return Math.max(0, baseStock - purchases[itemId]);
  }

  function isAlreadyOwned(itemId, item, pd) {
    if (!item || !pd) return false;
    if (item.type === 'heal' || item.type === 'battle' || item.type === 'diceSlot') return false;
    if (item.type === 'dice') {
      if (pd.equippedDice && pd.equippedDice.indexOf(itemId) >= 0) return true;
    }
    if (item.type === 'armor' && pd.armor === itemId) return true;
    return Game.Player && Game.Player.hasItem ? Game.Player.hasItem(itemId) : false;
  }

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
      var soldOut = isItemSoldOut(itemId);

      if (!confirmBuy) {
        if (soldOut) {
          message = item.name + 'はもう売り切れだ。';
          messageTimer = 40;
          Game.Audio.playSfx('cancel');
          return null;
        }
        if (isAlreadyOwned(itemId, item, pd)) {
          message = item.name + 'はもう旅の荷に入っている。';
          messageTimer = 40;
          Game.Audio.playSfx('cancel');
          return null;
        }
        confirmBuy = true;
        message = item.name + '（' + item.price + 'G）を買う？ 決定で買う / 戻る';
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
        var slotRemaining = recordPurchase(itemId);
        message = 'サイコロ枠が' + pd.diceSlots + '個になった！';
        if (slotRemaining <= 0) {
          message += ' この店の分は売り切れだ。';
        }
        messageTimer = 50;
        confirmBuy = false;
        Game.Audio.playSfx('item');
        return null;
      }

      // Dice purchase → then choose slot
      if (item.type === 'dice') {
        Game.Player.addGold(-item.price);
        Game.Player.addItem(itemId);
        recordPurchase(itemId);
        confirmBuy = false;
        // Enter slot selection
        pendingDiceId = itemId;
        selectingSlot = true;
        slotIndex = 0;
        message = 'どのスロットに装備する？ ←→で選ぶ / ' + getUiControlHint('equipLegend', '決定で装備');
        Game.Audio.playSfx('item');
        return null;
      }

      // Armor
      if (item.type === 'armor') {
        Game.Player.addGold(-item.price);
        Game.Player.addItem(itemId);
        Game.Player.equipArmor(itemId);
        var armorRemaining = recordPurchase(itemId);
        message = item.name + 'を装備した！ 防御力UP！';
        if (armorRemaining <= 0) {
          message += ' 棚は空になった。';
        }
        messageTimer = 50;
        confirmBuy = false;
        Game.Audio.playSfx('item');
        return null;
      }

      // Regular item (heal etc)
      Game.Player.addGold(-item.price);
      Game.Player.addItem(itemId);
      var remainingStock = recordPurchase(itemId);
      message = item.name + 'を買った！';
      if (remainingStock <= 0) {
        message += ' これで売り切れ。';
      } else {
        message += ' 残り' + remainingStock + '。';
      }
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
    R.drawDialogBox(10, 8, 196, 28);
    R.drawTextJP(clampText(shopName, 12), 25, 14, C.COLORS.GOLD, 15);

    // Gold
    R.drawDialogBox(C.CANVAS_WIDTH - 130, 8, 120, 28);
    R.drawTextJP('所持金: ' + pd.gold + 'G', C.CANVAS_WIDTH - 120, 14, '#ffdd44', 12);

    // Player stats
    R.drawDialogBox(C.CANVAS_WIDTH - 130, 42, 120, 60);
    R.drawTextJP('防御: ' + Game.Player.getDefense(), C.CANVAS_WIDTH - 120, 48, '#fff', 10);
    R.drawTextJP('HP: ' + pd.hp + '/' + pd.maxHp, C.CANVAS_WIDTH - 120, 63, '#fff', 10);
    var armorName = pd.armor ? Game.Items.get(pd.armor).name : 'なし';
    R.drawTextJP(clampText('防具: ' + armorName, 13), C.CANVAS_WIDTH - 120, 78, '#aaa', 9);

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
      var soldOut = isItemSoldOut(shopItems[i]);
      var remaining = getRemainingStock(shopItems[i]);
      var color = soldOut ? '#666' : (selected ? C.COLORS.GOLD : '#ccc');
      var prefix = selected ? '▶ ' : '  ';

      // Die color swatch for dice items
      if (item.type === 'dice') {
        R.drawRectAbsolute(listX - 3, y + 2, 10, 10, item.color || '#fff');
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX - 3, y + 2, 10, 10);
      }

      R.drawTextJP(prefix + clampText(item.name, 11), listX + 10, y, color, 12);
      if (soldOut) {
        R.drawTextJP('売切', listX + 218, y, '#aa7777', 11);
      } else {
        R.drawTextJP(item.price + 'G', listX + 180, y, pd.gold >= item.price ? '#aaffaa' : '#ff6666', 11);
        R.drawTextJP('残' + remaining, listX + 226, y, '#8fcf9b', 10);
      }
      R.drawTextJP(clampText(soldOut ? 'この店ではもう手に入らない。' : item.desc, 28), listX + 28, y + 16, soldOut ? '#665555' : '#888', 8);
    }

    // Exit option
    var exitIdx = shopItems.length;
    if (exitIdx >= scrollOffset && exitIdx < scrollOffset + maxVisible) {
      var ey = listY + (exitIdx - scrollOffset) * lineH;
      var eSelected = (menuIndex === exitIdx);
      R.drawTextJP(eSelected ? '▶ やめる' : '  やめる', listX + 10, ey, eSelected ? C.COLORS.GOLD : '#888', 12);
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
    R.drawTextJP('サイコロ装備:', 20, 248, C.COLORS.GOLD, 10);
    var equipped = Game.Player.getDiceLoadout ? Game.Player.getDiceLoadout() : Game.Player.getEquippedDice();
    for (var s = 0; s < pd.diceSlots; s++) {
      var slotX = 115 + s * 60;
      var di = equipped[s] ? Game.Items.get(equipped[s]) : null;
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
        R.drawTextJP(shortName, slotX + 16, 249, '#ccc', 7);
        // Faces preview
        var facePrev = di.faces.join('-');
        if (facePrev.length > 12) facePrev = facePrev.substring(0, 12) + '..';
        R.drawTextJP(facePrev, slotX + 2, 262, '#777', 6);
      } else {
        R.drawTextJP('空き', slotX + 17, 253, '#555', 8);
      }
    }

    // Message
    var messageLines = wrapText(message, 40, 2);
    if (message) {
      R.drawDialogBox(10, 274, C.CANVAS_WIDTH - 20, 40);
      for (var mi = 0; mi < messageLines.length; mi++) {
        R.drawTextJP(messageLines[mi], 20, 282 + mi * 12, '#fff', 10);
      }
    } else {
      R.drawDialogBox(10, 274, C.CANVAS_WIDTH - 20, 40);
      R.drawTextJP(getUiControlHint('buyLegend', '決定 購入  戻る'), 20, 286, '#888', 10);
    }
  }

  function isActive() { return active; }

  function exportState() {
    return clone(runtime.purchases || {});
  }

  function importState(state) {
    var normalized = normalizeRuntimeState(state);
    runtime.purchases = normalized.purchases;
    window.__gunmaShopRuntime = runtime;
  }

  function resetState() {
    runtime.purchases = {};
    window.__gunmaShopRuntime = runtime;
  }

  function getDebugState() {
    if (!active) return null;
    return {
      active: active,
      shopName: shopName,
      menuIndex: menuIndex,
      confirmBuy: confirmBuy,
      selectingSlot: selectingSlot,
      message: message,
      items: shopItems.map(function(itemId) {
        var item = Game.Items.get(itemId);
        return {
          id: itemId,
          name: item ? item.name : itemId,
          price: item ? item.price : 0,
          stock: getBaseStock(itemId),
          remaining: getRemainingStock(itemId),
          soldOut: isItemSoldOut(itemId)
        };
      })
    };
  }

  return {
    start: start,
    update: update,
    draw: draw,
    isActive: isActive,
    exportState: exportState,
    importState: importState,
    resetState: resetState,
    getDebugState: getDebugState
  };
})();
