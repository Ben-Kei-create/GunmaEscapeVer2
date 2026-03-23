// UI system - dialogs, menus, title screen, HUD, minimap, damage popups
Game.UI = (function() {
  var dialogActive = false;
  var dialogText = '';
  var menuActive = false;
  var menuIndex = 0;
  var titlePhase = 0;
  var titleTimer = 0;
  var blinkTimer = 0;
  var minimapVisible = true;
  var titleSelection = 0;
  var fieldMenuState = {
    section: 0,
    itemIndex: 0,
    commandIndex: 0,
    commandActive: false,
    diceSlotIndex: 0,
    diceEquipIndex: 0,
    diceEquipActive: false,
    armorIndex: 0,
    message: '',
    messageTimer: 0
  };

  // Damage number popups
  var damagePopups = [];
  var minimapColors = {
    0: '#2a5a1f', 1: '#8a7a4a', 2: '#2244aa', 3: '#444',
    4: '#1a3a0e', 5: '#6699aa', 6: '#4a7a3a', 7: '#882222',
    8: '#6a4a0a', 9: '#6a5a4a'
  };

  function drawTitleScreen() {
    var R = Game.Renderer;
    var C = Game.Config;

    R.clear('#0a0a1a');

    // Decorative border
    var ctx = R.getContext();
    ctx.strokeStyle = '#334';
    ctx.lineWidth = 1;
    for (var i = 20; i < C.CANVAS_WIDTH; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, C.CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (var i = 20; i < C.CANVAS_HEIGHT; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(C.CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Title
    titleTimer++;
    var yOff = Math.sin(titleTimer / 30) * 3;

    R.drawTextJP('群馬県からの脱出', 100, 60 + yOff, C.COLORS.GOLD, 28);
    R.drawTextJP('〜 Escape from Gunma 〜', 130, 100 + yOff, '#aaaacc', 14);

    // Subtitle
    R.drawTextJP('群馬県は一度入ったら出られない...', 115, 140, '#888', 12);
    R.drawTextJP('4つの証を集めて県境の結界を破れ！', 110, 158, '#888', 12);
    R.drawTextJP('第一章「群馬脱出編」 第二章「赤城の闇編」', 85, 178, '#555', 10);

    // Decorative daruma
    var darumaPalette = { 1:'#882222', 2:'#cc3333', 3:'#000' };
    var darumaSprite = [
      [0,0,1,1,1,1,0,0],
      [0,1,2,2,2,2,1,0],
      [1,2,3,2,2,3,2,1],
      [1,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,1],
      [0,1,2,2,2,2,1,0],
      [0,0,1,1,1,1,0,0],
      [0,0,0,0,0,0,0,0]
    ];
    R.drawSpriteAbsolute(darumaSprite, 50, 60, darumaPalette, 3);
    R.drawSpriteAbsolute(darumaSprite, 400, 60, darumaPalette, 3);

    // Subtitle
    R.drawTextJP('〜サイコロ博打RPG〜', 168, 118, '#cc8844', 11);

    // Menu selection
    blinkTimer++;
    var menuOptions = ['はじめから', 'つづきから', 'あいことば', '実績'];
    var hasSave = Game.Save && Game.Save.hasAnySave && Game.Save.hasAnySave();
    for (var mi = 0; mi < menuOptions.length; mi++) {
      var myy = 210 + mi * 24;
      var selected = (mi === titleSelection);
      var col = '#fff';
      if (mi === 1 && !hasSave) col = '#555'; // grey out continue if no save
      if (selected) col = Game.Config.COLORS.GOLD;
      var pre = selected ? '▶ ' : '  ';
      R.drawTextJP(pre + menuOptions[mi], 190, myy, col, 14);
    }

    // Controls
    R.drawTextJP('操作方法:', 50, 272, '#888', 11);
    R.drawTextJP('矢印/WASD: 移動  Z: 決定  X: メニュー  M: ミュート', 50, 288, '#666', 9);

    // Version
    R.drawText('v2.1', 430, 305, '#444', 10);
  }

  function drawHUD() {
    var R = Game.Renderer;
    var pd = Game.Player.getData();
    var map = Game.Map.getCurrentMap();

    // Area name with chapter
    if (map) {
      var chLabel = pd.chapter === 2 ? '二章' : '一章';
      R.drawDialogBox(5, 5, 100, 22);
      R.drawTextJP(chLabel + ' ' + map.name, 12, 9, '#fff', 11);
    }

    // HP bar (mini)
    R.drawRectAbsolute(Game.Config.CANVAS_WIDTH - 105, 5, 100, 18, 'rgba(0,0,0,0.7)');
    R.drawRectAbsolute(Game.Config.CANVAS_WIDTH - 104, 6, 98, 16, '#333');
    var hpRatio = pd.hp / pd.maxHp;
    R.drawRectAbsolute(Game.Config.CANVAS_WIDTH - 103, 7, 96 * hpRatio, 14,
      hpRatio > 0.3 ? Game.Config.COLORS.HP_GREEN : Game.Config.COLORS.HP_RED);
    R.drawText('HP ' + pd.hp, Game.Config.CANVAS_WIDTH - 98, 8, '#fff', 10);

    // Gold display
    R.drawText(pd.gold + 'G', Game.Config.CANVAS_WIDTH - 45, 8, '#ffdd44', 10);

    // Key items indicator
    var keyItems = ['onsenKey', 'darumaEye', 'konnyakuPass', 'cabbageCrest'];
    var keyColors = ['#88ccee', '#cc2222', '#888888', '#44bb44'];
    for (var i = 0; i < keyItems.length; i++) {
      var hasKey = pd.inventory.indexOf(keyItems[i]) >= 0;
      R.drawRectAbsolute(Game.Config.CANVAS_WIDTH - 105 + i * 25, 26, 20, 8,
        hasKey ? keyColors[i] : '#333');
    }
  }

  function drawDialog(text) {
    var R = Game.Renderer;
    var npc = Game.NPC.getCurrentNpc();
    var speakerName = npc ? npc.name : '';

    R.drawDialogBox(10, Game.Config.CANVAS_HEIGHT - 80, Game.Config.CANVAS_WIDTH - 20, 70);

    if (speakerName) {
      R.drawDialogBox(10, Game.Config.CANVAS_HEIGHT - 98, 100, 20);
      R.drawTextJP(speakerName, 20, Game.Config.CANVAS_HEIGHT - 94, Game.Config.COLORS.GOLD, 12);
    }

    // Word wrap
    var maxChars = 28;
    var lines = [];
    var remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxChars) {
        lines.push(remaining);
        break;
      }
      lines.push(remaining.substring(0, maxChars));
      remaining = remaining.substring(maxChars);
    }

    for (var i = 0; i < lines.length && i < 3; i++) {
      R.drawTextJP(lines[i], 25, Game.Config.CANVAS_HEIGHT - 70 + i * 20, '#fff', 14);
    }

    // Advance indicator
    if (blinkTimer % 40 < 25) {
      R.drawTextJP('▼', Game.Config.CANVAS_WIDTH - 35, Game.Config.CANVAS_HEIGHT - 20, '#fff', 12);
    }
    blinkTimer++;
  }

  function drawMenu() {
    var R = Game.Renderer;
    var C = Game.Config;
    var pd = Game.Player.getData();
    var equipped = Game.Player.getEquippedDice();

    R.drawDialogBox(100, 30, 280, 260);
    var chTitle = pd.chapter === 2 ? '第二章 赤城の闇編' : '第一章 群馬脱出編';
    R.drawTextJP(chTitle, 200, 38, C.COLORS.GOLD, 12, 'center');

    // Stats
    R.drawTextJP('HP: ' + pd.hp + '/' + pd.maxHp, 120, 60, '#fff', 13);
    R.drawTextJP('防御力: ' + Game.Player.getDefense(), 120, 78, '#fff', 13);
    R.drawTextJP('所持金: ' + pd.gold + 'G', 120, 96, '#ffdd44', 13);
    var aName = pd.armor ? Game.Items.get(pd.armor).name : 'なし';
    R.drawTextJP('防具: ' + aName, 260, 78, '#aaa', 11);

    // Tabs
    var tabs = ['もちもの', 'サイコロ', 'ぼうぐ'];
    var tabX = 120;
    for (var t = 0; t < tabs.length; t++) {
      var tx = tabX + t * 76;
      var activeTab = (fieldMenuState.section === t);
      R.drawRectAbsolute(tx, 112, 68, 18, activeTab ? 'rgba(255,204,0,0.16)' : 'rgba(255,255,255,0.06)');
      R.drawTextJP(tabs[t], tx + 8, 116, activeTab ? C.COLORS.GOLD : '#aaa', 11);
    }
    R.drawRectAbsolute(120, 134, 240, 1, '#446');

    switch (fieldMenuState.section) {
      case 0:
        drawItemMenuSection(R, C, pd);
        break;
      case 1:
        drawDiceMenuSection(R, C, pd, equipped);
        break;
      case 2:
        drawArmorMenuSection(R, C, pd);
        break;
    }

    if (fieldMenuState.messageTimer > 0 && fieldMenuState.message) {
      R.drawDialogBox(120, 266, 240, 18);
      R.drawTextJP(fieldMenuState.message, 126, 269, '#fff', 10);
    }

    R.drawTextJP('←→: 切替  Z/Space: 決定  X: 戻る', 126, 288, '#888', 10);
  }

  function drawItemMenuSection(R, C, pd) {
    var visibleItems = 6;
    var areaY = 140;
    R.drawTextJP('持ち物:', 120, areaY, C.COLORS.GOLD, 12);

    if (pd.inventory.length === 0) {
      R.drawTextJP('（なし）', 140, areaY + 18, '#888', 11);
      return;
    }

    var maxOffset = Math.max(0, pd.inventory.length - visibleItems);
    var scrollOffset = Math.min(maxOffset, Math.max(0, fieldMenuState.itemIndex - visibleItems + 1));
    for (var i = scrollOffset; i < pd.inventory.length && i < scrollOffset + visibleItems; i++) {
      var item = Game.Items.get(pd.inventory[i]);
      var name = item ? item.name : pd.inventory[i];
      var iy = areaY + 18 + (i - scrollOffset) * 16;
      var selected = (i === fieldMenuState.itemIndex);
      var prefix = selected ? '▶ ' : '・';
      R.drawTextJP(prefix + name, 130, iy, selected ? C.COLORS.GOLD : '#fff', 11);
    }

    var selectedId = pd.inventory[fieldMenuState.itemIndex];
    var selectedItem = selectedId ? Game.Items.get(selectedId) : null;
    if (selectedItem) {
      R.drawRectAbsolute(120, 244, 240, 1, '#446');
      R.drawTextJP(selectedItem.desc || '説明なし', 122, 248, '#aaa', 10);
    }

    if (fieldMenuState.commandActive && selectedItem) {
      var commands = getFieldMenuCommands(selectedItem);
      R.drawDialogBox(272, 176, 88, commands.length * 18 + 12);
      for (var ci = 0; ci < commands.length; ci++) {
        var cSelected = (ci === fieldMenuState.commandIndex);
        var cPrefix = cSelected ? '▶ ' : '  ';
        R.drawTextJP(cPrefix + commands[ci], 282, 184 + ci * 18, cSelected ? C.COLORS.GOLD : '#fff', 11);
      }
    }
  }

  function drawDiceMenuSection(R, C, pd, equipped) {
    var ctx = R.getContext();
    var ownedDice = getOwnedDiceOptions();
    var visibleDice = 5;
    R.drawTextJP('装備スロット:', 120, 140, C.COLORS.GOLD, 12);

    for (var s = 0; s < pd.diceSlots; s++) {
      var slotY = 158 + s * 18;
      var selectedSlot = (s === fieldMenuState.diceSlotIndex);
      var di = Game.Items.get(equipped[s] || 'normalDice');
      var prefix = selectedSlot ? '▶ ' : '  ';
      R.drawTextJP(prefix + 'スロット' + (s + 1), 124, slotY, selectedSlot ? C.COLORS.GOLD : '#fff', 11);
      if (di) {
        R.drawRectAbsolute(210, slotY + 2, 10, 10, di.color || '#fff');
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(210, slotY + 2, 10, 10);
        R.drawTextJP(di.name, 226, slotY, '#ccc', 10);
      }
    }

    var selectedDie = Game.Items.get(equipped[fieldMenuState.diceSlotIndex] || 'normalDice');
    if (selectedDie) {
      R.drawRectAbsolute(120, 214, 240, 1, '#446');
      R.drawTextJP('出目: ' + selectedDie.faces.join(' - '), 122, 220, '#fff', 11);
      R.drawTextJP(selectedDie.desc || '説明なし', 122, 236, '#aaa', 10);
    }

    if (!fieldMenuState.diceEquipActive) {
      R.drawTextJP('決定で入れ替え', 238, 196, '#888', 10);
      return;
    }

    R.drawDialogBox(250, 150, 110, 100);
    var maxOffset = Math.max(0, ownedDice.length - visibleDice);
    var scrollOffset = Math.min(maxOffset, Math.max(0, fieldMenuState.diceEquipIndex - visibleDice + 1));
    for (var i = scrollOffset; i < ownedDice.length && i < scrollOffset + visibleDice; i++) {
      var option = ownedDice[i];
      var selected = (i === fieldMenuState.diceEquipIndex);
      var prefix2 = selected ? '▶ ' : '  ';
      var label = option.item ? option.item.name : option.name;
      R.drawTextJP(prefix2 + label, 258, 160 + (i - scrollOffset) * 16, selected ? C.COLORS.GOLD : '#fff', 10);
    }
    if (ownedDice[fieldMenuState.diceEquipIndex] && ownedDice[fieldMenuState.diceEquipIndex].item) {
      R.drawTextJP(ownedDice[fieldMenuState.diceEquipIndex].item.faces.join('-'), 258, 236, '#88dd88', 9);
    }
  }

  function drawArmorMenuSection(R, C, pd) {
    var armorOptions = getOwnedArmorOptions();
    var visibleArmor = 4;
    var currentArmor = pd.armor ? Game.Items.get(pd.armor) : null;
    R.drawTextJP('現在の防具:', 120, 140, C.COLORS.GOLD, 12);
    R.drawTextJP(currentArmor ? currentArmor.name : 'なし', 200, 140, '#fff', 12);
    R.drawTextJP(currentArmor ? currentArmor.desc : '装備していない', 120, 158, '#aaa', 10);

    R.drawRectAbsolute(120, 176, 240, 1, '#446');
    R.drawTextJP('装備候補:', 120, 182, C.COLORS.GOLD, 12);

    var maxOffset = Math.max(0, armorOptions.length - visibleArmor);
    var scrollOffset = Math.min(maxOffset, Math.max(0, fieldMenuState.armorIndex - visibleArmor + 1));
    for (var i = scrollOffset; i < armorOptions.length && i < scrollOffset + visibleArmor; i++) {
      var option = armorOptions[i];
      var selected = (i === fieldMenuState.armorIndex);
      var prefix = selected ? '▶ ' : '  ';
      var label = option.item ? option.item.name : 'はずす';
      R.drawTextJP(prefix + label, 130, 200 + (i - scrollOffset) * 16, selected ? C.COLORS.GOLD : '#fff', 11);
    }

    var selectedArmor = armorOptions[fieldMenuState.armorIndex];
    if (selectedArmor) {
      R.drawRectAbsolute(120, 244, 240, 1, '#446');
      var desc = selectedArmor.item ? selectedArmor.item.desc : '現在の防具を外す';
      R.drawTextJP(desc, 122, 248, '#aaa', 10);
    }
  }

  function clampFieldMenuSelection() {
    var pd = Game.Player.getData();
    var inventory = pd.inventory;
    var armorOptions = getOwnedArmorOptions();
    if (inventory.length <= 0) {
      fieldMenuState.itemIndex = 0;
      fieldMenuState.commandIndex = 0;
      fieldMenuState.commandActive = false;
    } else {
      if (fieldMenuState.itemIndex >= inventory.length) fieldMenuState.itemIndex = inventory.length - 1;
      if (fieldMenuState.itemIndex < 0) fieldMenuState.itemIndex = 0;
    }
    if (fieldMenuState.diceSlotIndex >= pd.diceSlots) fieldMenuState.diceSlotIndex = pd.diceSlots - 1;
    if (fieldMenuState.diceSlotIndex < 0) fieldMenuState.diceSlotIndex = 0;
    if (fieldMenuState.armorIndex >= armorOptions.length) fieldMenuState.armorIndex = armorOptions.length - 1;
    if (fieldMenuState.armorIndex < 0) fieldMenuState.armorIndex = 0;
  }

  function getFieldMenuCommands(item) {
    if (!item) return ['やめる'];
    if (item.type === 'heal') return ['つかう', 'すてる', 'やめる'];
    if (item.type === 'key') return ['やめる'];
    return ['すてる', 'やめる'];
  }

  function setFieldMenuMessage(text, timer) {
    fieldMenuState.message = text;
    fieldMenuState.messageTimer = timer || 45;
  }

  function getOwnedDiceOptions() {
    var inventory = Game.Player.getData().inventory;
    var options = [{ id: 'normalDice', item: Game.Items.get('normalDice'), name: 'ふつうのサイコロ' }];
    for (var i = 0; i < inventory.length; i++) {
      var item = Game.Items.get(inventory[i]);
      if (item && item.type === 'dice') {
        options.push({ id: inventory[i], item: item, name: item.name });
      }
    }
    return options;
  }

  function getOwnedArmorOptions() {
    var inventory = Game.Player.getData().inventory;
    var options = [{ id: null, item: null }];
    for (var i = 0; i < inventory.length; i++) {
      var item = Game.Items.get(inventory[i]);
      if (item && item.type === 'armor') {
        options.push({ id: inventory[i], item: item });
      }
    }
    return options;
  }

  function changeFieldMenuSection(dir) {
    fieldMenuState.section = (fieldMenuState.section + dir + 3) % 3;
    fieldMenuState.commandActive = false;
    fieldMenuState.commandIndex = 0;
    fieldMenuState.diceEquipActive = false;
    fieldMenuState.diceEquipIndex = 0;
    clampFieldMenuSelection();
    Game.Audio.playSfx('confirm');
  }

  function openFieldMenu() {
    fieldMenuState.section = 0;
    fieldMenuState.commandActive = false;
    fieldMenuState.commandIndex = 0;
    fieldMenuState.diceEquipActive = false;
    fieldMenuState.diceEquipIndex = 0;
    fieldMenuState.message = '';
    fieldMenuState.messageTimer = 0;
    clampFieldMenuSelection();
  }

  function updateFieldMenu() {
    var pd = Game.Player.getData();
    var inventory = pd.inventory;
    clampFieldMenuSelection();

    if (fieldMenuState.messageTimer > 0) {
      fieldMenuState.messageTimer--;
      if (Game.Input.isPressed('confirm') || Game.Input.isPressed('cancel')) {
        fieldMenuState.messageTimer = 0;
      }
      return null;
    }

    if (!fieldMenuState.commandActive && !fieldMenuState.diceEquipActive) {
      if (Game.Input.isPressed('left')) {
        changeFieldMenuSection(-1);
        return null;
      }
      if (Game.Input.isPressed('right')) {
        changeFieldMenuSection(1);
        return null;
      }
    }

    if (fieldMenuState.section === 1) {
      return updateDiceMenu(pd);
    }
    if (fieldMenuState.section === 2) {
      return updateArmorMenu();
    }

    if (!fieldMenuState.commandActive) {
      if (Game.Input.isPressed('up') && inventory.length > 0) {
        fieldMenuState.itemIndex = (fieldMenuState.itemIndex - 1 + inventory.length) % inventory.length;
        Game.Audio.playSfx('confirm');
      }
      if (Game.Input.isPressed('down') && inventory.length > 0) {
        fieldMenuState.itemIndex = (fieldMenuState.itemIndex + 1) % inventory.length;
        Game.Audio.playSfx('confirm');
      }
      if (Game.Input.isPressed('confirm')) {
        if (inventory.length > 0) {
          fieldMenuState.commandActive = true;
          fieldMenuState.commandIndex = 0;
          Game.Audio.playSfx('confirm');
        }
      }
      if (Game.Input.isPressed('cancel')) {
        return { close: true };
      }
      return null;
    }

    var selectedId = inventory[fieldMenuState.itemIndex];
    var selectedItem = selectedId ? Game.Items.get(selectedId) : null;
    var commands = getFieldMenuCommands(selectedItem);

    if (Game.Input.isPressed('up')) {
      fieldMenuState.commandIndex = (fieldMenuState.commandIndex - 1 + commands.length) % commands.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down')) {
      fieldMenuState.commandIndex = (fieldMenuState.commandIndex + 1) % commands.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('cancel')) {
      fieldMenuState.commandActive = false;
      fieldMenuState.commandIndex = 0;
      Game.Audio.playSfx('cancel');
      return null;
    }
    if (!Game.Input.isPressed('confirm')) return null;

    var command = commands[fieldMenuState.commandIndex];
    if (command === 'やめる') {
      fieldMenuState.commandActive = false;
      fieldMenuState.commandIndex = 0;
      Game.Audio.playSfx('cancel');
      return null;
    }

    if (command === 'つかう' && selectedItem && selectedItem.type === 'heal') {
      Game.Player.heal(selectedItem.healAmount);
      Game.Player.removeItem(selectedId);
      fieldMenuState.commandActive = false;
      fieldMenuState.commandIndex = 0;
      clampFieldMenuSelection();
      setFieldMenuMessage(selectedItem.name + 'を使った！ HPが' + selectedItem.healAmount + '回復！', 60);
      Game.Audio.playSfx('item');
      return null;
    }

    if (command === 'すてる') {
      if (selectedItem && selectedItem.type === 'key') {
        fieldMenuState.commandActive = false;
        fieldMenuState.commandIndex = 0;
        setFieldMenuMessage('だいじなものは すてられない！', 45);
        Game.Audio.playSfx('cancel');
        return null;
      }
      Game.Player.removeItem(selectedId);
      fieldMenuState.commandActive = false;
      fieldMenuState.commandIndex = 0;
      clampFieldMenuSelection();
      setFieldMenuMessage((selectedItem ? selectedItem.name : selectedId) + 'をすてた。', 45);
      Game.Audio.playSfx('cancel');
      return null;
    }

    return null;
  }

  function updateDiceMenu(pd) {
    var ownedDice = getOwnedDiceOptions();
    if (!fieldMenuState.diceEquipActive) {
      if (Game.Input.isPressed('up')) {
        fieldMenuState.diceSlotIndex = (fieldMenuState.diceSlotIndex - 1 + pd.diceSlots) % pd.diceSlots;
        Game.Audio.playSfx('confirm');
      }
      if (Game.Input.isPressed('down')) {
        fieldMenuState.diceSlotIndex = (fieldMenuState.diceSlotIndex + 1) % pd.diceSlots;
        Game.Audio.playSfx('confirm');
      }
      if (Game.Input.isPressed('confirm')) {
        fieldMenuState.diceEquipActive = true;
        fieldMenuState.diceEquipIndex = 0;
        Game.Audio.playSfx('confirm');
      }
      if (Game.Input.isPressed('cancel')) {
        return { close: true };
      }
      return null;
    }

    if (Game.Input.isPressed('up')) {
      fieldMenuState.diceEquipIndex = (fieldMenuState.diceEquipIndex - 1 + ownedDice.length) % ownedDice.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down')) {
      fieldMenuState.diceEquipIndex = (fieldMenuState.diceEquipIndex + 1) % ownedDice.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('cancel')) {
      fieldMenuState.diceEquipActive = false;
      fieldMenuState.diceEquipIndex = 0;
      Game.Audio.playSfx('cancel');
      return null;
    }
    if (!Game.Input.isPressed('confirm')) return null;

    var selected = ownedDice[fieldMenuState.diceEquipIndex];
    if (selected && Game.Player.equipDice(selected.id, fieldMenuState.diceSlotIndex)) {
      fieldMenuState.diceEquipActive = false;
      fieldMenuState.diceEquipIndex = 0;
      setFieldMenuMessage(selected.item.name + 'をスロット' + (fieldMenuState.diceSlotIndex + 1) + 'に装備！', 55);
      Game.Audio.playSfx('item');
    }
    return null;
  }

  function updateArmorMenu() {
    var armorOptions = getOwnedArmorOptions();
    if (Game.Input.isPressed('up')) {
      fieldMenuState.armorIndex = (fieldMenuState.armorIndex - 1 + armorOptions.length) % armorOptions.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down')) {
      fieldMenuState.armorIndex = (fieldMenuState.armorIndex + 1) % armorOptions.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('cancel')) {
      return { close: true };
    }
    if (!Game.Input.isPressed('confirm')) return null;

    var selected = armorOptions[fieldMenuState.armorIndex];
    if (!selected || !selected.item) {
      if (Game.Player.unequipArmor && Game.Player.unequipArmor()) {
        setFieldMenuMessage('防具を外した。', 45);
        Game.Audio.playSfx('item');
      } else {
        setFieldMenuMessage('外せる防具がない。', 40);
        Game.Audio.playSfx('cancel');
      }
      return null;
    }

    if (Game.Player.equipArmor(selected.id)) {
      setFieldMenuMessage(selected.item.name + 'を装備した！', 50);
      Game.Audio.playSfx('item');
    }
    return null;
  }

  function drawGameOver() {
    var R = Game.Renderer;
    R.clear('#0a0000');
    R.drawTextJP('GAME OVER', 155, 120, '#cc0000', 28);
    R.drawTextJP('群馬県に飲み込まれた...', 140, 170, '#888', 14);

    blinkTimer++;
    if (blinkTimer % 60 < 40) {
      R.drawTextJP('Zキーでタイトルに戻る', 150, 230, '#fff', 14);
    }
  }

  function drawEnding() {
    var R = Game.Renderer;
    var pd = Game.Player.getData();
    R.clear('#001122');

    titleTimer++;
    var yOff = Math.sin(titleTimer / 40) * 2;

    if (pd.chapter >= 2) {
      // Chapter 2 ending
      R.drawTextJP('赤城の闇、晴れる', 130, 35 + yOff, Game.Config.COLORS.GOLD, 24);
      R.drawTextJP('暗鞍を倒し、タムラ村に平和が戻った。', 85, 80, '#fff', 13);

      R.drawTextJP('群馬から脱出はできなかった。', 120, 115, '#aaa', 12);
      R.drawTextJP('だが、ここで生きる意味を見つけた。', 110, 135, '#aaa', 12);

      R.drawTextJP('サイコロに宿る力...', 160, 170, '#cc8844', 12);
      R.drawTextJP('それは「リスペクト」の証だった。', 120, 190, '#cc8844', 12);

      R.drawTextJP('〜 Complete 〜', 185, 230, Game.Config.COLORS.GOLD, 16);
      R.drawTextJP('全二章クリア おめでとう！', 145, 260, '#fff', 12);
    } else {
      R.drawTextJP('脱出成功！', 170, 40 + yOff, Game.Config.COLORS.GOLD, 28);
      R.drawTextJP('群馬県からの脱出に成功した！', 115, 90, '#fff', 14);

      R.drawTextJP('...しかし、本当に', 165, 130, '#aaa', 12);
      R.drawTextJP('脱出できたのだろうか？', 150, 150, '#aaa', 12);

      R.drawTextJP('周りを見渡すと...', 170, 185, '#888', 12);
      R.drawTextJP('そこにはまた群馬県が広がっていた。', 100, 210, '#cc8844', 13);

      R.drawTextJP('〜 Fin 〜', 210, 250, Game.Config.COLORS.GOLD, 14);
    }

    R.drawText('Credits:', 200, 280, '#555', 10);
    R.drawTextJP('制作：群馬県観光局（非公式）', 145, 293, '#444', 10);

    blinkTimer++;
    if (blinkTimer % 60 < 40) {
      R.drawTextJP('Zキーでタイトルに戻る', 150, 308, '#fff', 10);
    }
  }

  function drawTransition(alpha) {
    Game.Renderer.fadeOverlay(alpha);
  }

  // Minimap
  function drawMinimap() {
    if (!minimapVisible) return;
    var map = Game.Map.getCurrentMap();
    if (!map || !map.tiles) return;
    var R = Game.Renderer;
    var mx = 385, my = 5, pw = 3, ph = 3;

    // Background
    R.drawRectAbsolute(mx - 2, my - 2, 94, 64, 'rgba(0,0,0,0.7)');

    // Draw tiles
    for (var row = 0; row < map.tiles.length && row < 20; row++) {
      for (var col = 0; col < map.tiles[row].length && col < 30; col++) {
        var tileType = map.tiles[row][col];
        var color = minimapColors[tileType] || '#000';
        R.drawRectAbsolute(mx + col * pw, my + row * ph, pw, ph, color);
      }
    }

    // NPC positions
    if (map.npcs) {
      for (var n = 0; n < map.npcs.length; n++) {
        if (!map.npcs[n].defeated) {
          R.drawRectAbsolute(mx + map.npcs[n].x * pw, my + map.npcs[n].y * ph, 2, 2, '#ffdd00');
        }
      }
    }

    // Exit positions
    if (map.exits) {
      for (var e = 0; e < map.exits.length; e++) {
        R.drawRectAbsolute(mx + map.exits[e].x * pw, my + map.exits[e].y * ph, 2, 2, '#44ff44');
      }
    }

    // Player position (blinking)
    var pd = Game.Player.getData();
    if (blinkTimer % 20 < 14) {
      R.drawRectAbsolute(mx + pd.tileX * pw, my + pd.tileY * ph, pw, ph, '#ffffff');
    }
  }

  // Damage popups
  function addDamagePopup(text, x, y, color) {
    damagePopups.push({
      text: '' + text,
      x: x, y: y,
      color: color || '#ff4444',
      timer: 45,
      maxTimer: 45
    });
    if (damagePopups.length > 20) damagePopups.shift();
  }

  function updatePopups() {
    for (var i = damagePopups.length - 1; i >= 0; i--) {
      damagePopups[i].timer--;
      damagePopups[i].y -= 0.8;
      if (damagePopups[i].timer <= 0) {
        damagePopups.splice(i, 1);
      }
    }
  }

  function drawPopups() {
    var R = Game.Renderer;
    for (var i = 0; i < damagePopups.length; i++) {
      var p = damagePopups[i];
      var alpha = p.timer / p.maxTimer;
      var ctx = R.getContext();
      ctx.globalAlpha = alpha;
      // Shadow
      R.drawTextJP(p.text, p.x + 1, p.y + 1, '#000', 16);
      // Text
      R.drawTextJP(p.text, p.x, p.y, p.color, 16);
      ctx.globalAlpha = 1;
    }
  }

  // Title menu input
  function getTitleSelection() { return titleSelection; }
  function updateTitleMenu() {
    if (Game.Input.isPressed('up')) {
      titleSelection = (titleSelection - 1 + 4) % 4;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down')) {
      titleSelection = (titleSelection + 1) % 4;
      Game.Audio.playSfx('confirm');
    }
  }

  function toggleMinimap() {
    minimapVisible = !minimapVisible;
  }

  return {
    drawTitleScreen: drawTitleScreen,
    drawHUD: drawHUD,
    drawDialog: drawDialog,
    drawMenu: drawMenu,
    drawGameOver: drawGameOver,
    drawEnding: drawEnding,
    drawTransition: drawTransition,
    drawMinimap: drawMinimap,
    addDamagePopup: addDamagePopup,
    updatePopups: updatePopups,
    drawPopups: drawPopups,
    getTitleSelection: getTitleSelection,
    updateTitleMenu: updateTitleMenu,
    toggleMinimap: toggleMinimap,
    openFieldMenu: openFieldMenu,
    updateFieldMenu: updateFieldMenu
  };
})();
