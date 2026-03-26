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
  var areaBanner = {
    active: false,
    timer: 0,
    maxTimer: 0,
    chapterNumber: 1,
    chapterTitle: '',
    mapLabel: '',
    mapSubtitle: '',
    accent: '#ffcc00'
  };
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
  var titleDescriptions = [
    'ミニムービーから異界群馬への旅を始める。',
    '同じ端末に残した記録から旅を再開する。',
    'あいことばを入力して旅の続きへ戻る。',
    '旅の到達点と解放状況を確認する。'
  ];
  var minimapColors = {
    0: '#2a5a1f', 1: '#8a7a4a', 2: '#2244aa', 3: '#444',
    4: '#1a3a0e', 5: '#6699aa', 6: '#4a7a3a', 7: '#882222',
    8: '#6a4a0a', 9: '#6a5a4a'
  };

  function getChapterInfo() {
    var pd = Game.Player && Game.Player.getData ? Game.Player.getData() : null;
    var chapterNumber = pd && pd.chapter ? pd.chapter : 1;
    var mapId = Game.Map && Game.Map.getCurrentMapId ? Game.Map.getCurrentMapId() : '';
    if (Game.Chapters && Game.Chapters.getChapter) {
      return Game.Chapters.getChapter(chapterNumber, mapId);
    }
    return {
      number: chapterNumber,
      displayLabel: '第一章',
      act: 'ACT',
      title: '群馬の旅',
      subtitle: '',
      objective: '',
      hint: '',
      accent: Game.Config.COLORS.GOLD,
      journeyIndex: chapterNumber,
      journeyCount: 7
    };
  }

  function getMapInfo() {
    var mapId = Game.Map && Game.Map.getCurrentMapId ? Game.Map.getCurrentMapId() : '';
    if (Game.Chapters && Game.Chapters.getMap) {
      return Game.Chapters.getMap(mapId);
    }
    return null;
  }

  function getCurrentObjective() {
    var pd = Game.Player && Game.Player.getData ? Game.Player.getData() : null;
    var chapterNumber = pd && pd.chapter ? pd.chapter : 1;
    var mapId = Game.Map && Game.Map.getCurrentMapId ? Game.Map.getCurrentMapId() : '';
    if (Game.Chapters && Game.Chapters.getObjective) {
      return Game.Chapters.getObjective(chapterNumber, mapId);
    }
    return '';
  }

  function getJourneyState() {
    if (Game.Story && Game.Story.getJourneyState) {
      return Game.Story.getJourneyState();
    }
    return { respectGauge: 0, catalysts: [] };
  }

  function getPartyMembers() {
    if (Game.Player && Game.Player.getPartyMembers) {
      return Game.Player.getPartyMembers();
    }
    return [];
  }

  function clampText(text, maxChars) {
    if (!text || text.length <= maxChars) return text || '';
    return text.substring(0, Math.max(0, maxChars - 1)) + '…';
  }

  function drawMountainLayer(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, Game.Config.CANVAS_HEIGHT);
    for (var i = 0; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.lineTo(Game.Config.CANVAS_WIDTH, Game.Config.CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  function drawPanelAccent(x, y, w, h, accent) {
    var R = Game.Renderer;
    var ctx = R.getContext();
    var color = accent || Game.Config.COLORS.GOLD;
    R.drawRectAbsolute(x + 6, y + 5, Math.max(12, w - 12), 1, color);
    R.drawRectAbsolute(x + 5, y + 6, 2, Math.max(8, h - 12), color);
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fillRect(x + 6, y + 8, Math.max(8, w - 12), 4);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(x + 6, y + h - 10, Math.max(8, w - 12), 2);
  }

  function wrapTextSmart(text, maxChars, maxLines) {
    var lines = [];
    var remaining = text || '';
    var punctuation = '、。！？…）)] ';
    while (remaining.length > 0 && lines.length < maxLines) {
      if (remaining.length <= maxChars) {
        lines.push(remaining);
        break;
      }
      var slice = remaining.substring(0, maxChars);
      var splitAt = -1;
      for (var i = slice.length - 1; i >= Math.max(0, slice.length - 8); i--) {
        if (punctuation.indexOf(slice.charAt(i)) >= 0) {
          splitAt = i + 1;
          break;
        }
      }
      if (splitAt <= 0) splitAt = maxChars;
      lines.push(remaining.substring(0, splitAt));
      remaining = remaining.substring(splitAt);
    }
    if (remaining.length > 0 && lines.length) {
      lines[lines.length - 1] = clampText(lines[lines.length - 1] + remaining, maxChars);
    }
    return lines;
  }

  function drawJourneyTracker(x, y, chapterInfo) {
    var R = Game.Renderer;
    var current = chapterInfo.journeyIndex || chapterInfo.number || 1;
    var total = chapterInfo.journeyCount || (Game.Chapters && Game.Chapters.getJourneyCount ? Game.Chapters.getJourneyCount() : 7);
    R.drawDialogBox(x, y, 180, 18);
    drawPanelAccent(x, y, 180, 18, chapterInfo.accent || Game.Config.COLORS.GOLD);
    R.drawTextJP('旅路', x + 8, y + 4, '#aac6ff', 9);
    var spacing = total <= 7 ? 18 : 13;
    for (var i = 0; i < total; i++) {
      var px = x + 36 + i * spacing;
      var color = '#273349';
      if (i + 1 < current) color = 'rgba(255,255,255,0.35)';
      if (i + 1 === current) color = chapterInfo.accent || Game.Config.COLORS.GOLD;
      R.drawRectAbsolute(px, y + 5, 12, 7, color);
    }
    R.drawTextJP(current + '/' + total, x + 150, y + 4, '#fff', 9);
  }

  function drawTitleScreen() {
    var R = Game.Renderer;
    var C = Game.Config;
    var ctx = R.getContext();
    var journeyStops = Game.Chapters && Game.Chapters.getJourneyStops ? Game.Chapters.getJourneyStops() : [];

    R.clear('#060813');
    titleTimer++;

    ctx.fillStyle = '#0b1226';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    ctx.fillStyle = 'rgba(255, 196, 92, 0.035)';
    ctx.fillRect(62, 0, 36, 150);
    ctx.fillRect(388, 0, 24, 130);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (var s = 0; s < 24; s++) {
      var sx = (s * 37 + titleTimer * 0.2) % C.CANVAS_WIDTH;
      var sy = 18 + (s * 29 % 110);
      ctx.fillRect(sx, sy, 2, 2);
    }

    drawMountainLayer(ctx, [[0, 178], [46, 152], [102, 168], [165, 132], [236, 171], [314, 126], [392, 162], [480, 146]], '#0d1730');
    drawMountainLayer(ctx, [[0, 214], [54, 184], [120, 202], [196, 168], [256, 212], [332, 174], [420, 198], [480, 180]], '#132146');
    drawMountainLayer(ctx, [[0, 250], [74, 228], [138, 240], [224, 214], [302, 250], [366, 222], [430, 236], [480, 224]], '#18284f');

    ctx.strokeStyle = 'rgba(129,145,201,0.18)';
    ctx.lineWidth = 1;
    for (var gy = 18; gy < 250; gy += 42) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(C.CANVAS_WIDTH, gy);
      ctx.stroke();
    }

    var yOff = Math.sin(titleTimer / 30) * 3;

    R.drawRectAbsolute(34, 34, 140, 1, 'rgba(255,204,51,0.38)');
    R.drawRectAbsolute(306, 34, 140, 1, 'rgba(255,204,51,0.38)');
    R.drawTextJP('異界ロードムービーRPG', 160, 28, '#8fb8ff', 10);
    R.drawTextJP('群馬県からの脱出', 87, 48 + yOff, C.COLORS.GOLD, 28);
    R.drawTextJP('Escape from Gunma', 154, 82 + yOff, '#c6d0ff', 13);

    R.drawTextJP('群馬の深部へ進み、仲間と記憶を取り戻せ。', 85, 110, '#eef2ff', 11);
    R.drawTextJP('シュールなご当地異界と、土地に残る誇りと悲哀を辿る濃密な6章+終章。', 34, 126, '#9aa6c8', 9);

    R.drawDialogBox(42, 146, 396, 34);
    drawPanelAccent(42, 146, 396, 34, '#8fb8ff');
    R.drawTextJP('旅の節目', 56, 151, '#8fb8ff', 10);
    for (var ci = 0; ci < journeyStops.length; ci++) {
      var cx = 116 + ci * 42;
      var pulse = (titleTimer + ci * 5) % 80;
      var fill = pulse < 42 ? 'rgba(255,204,51,0.18)' : 'rgba(255,255,255,0.05)';
      R.drawRectAbsolute(cx, 150, 28, 10, fill);
      R.drawTextJP(journeyStops[ci].shortLabel, cx + 3, 164, ci < 4 ? '#ffe18b' : '#d1d8ff', 8);
    }

    // Menu selection
    blinkTimer++;
    var menuOptions = ['はじめから', 'つづきから', 'あいことば', '実績'];
    var hasSave = Game.Save && Game.Save.hasAnySave && Game.Save.hasAnySave();
    R.drawDialogBox(148, 188, 184, 92);
    drawPanelAccent(148, 188, 184, 92, Game.Config.COLORS.GOLD);
    for (var mi = 0; mi < menuOptions.length; mi++) {
      var myy = 203 + mi * 18;
      var selected = (mi === titleSelection);
      var col = '#fff';
      if (mi === 1 && !hasSave) col = '#555';
      if (selected) col = Game.Config.COLORS.GOLD;
      if (selected) {
        R.drawRectAbsolute(172, myy - 1, 132, 15, 'rgba(255,204,0,0.12)');
      }
      var pre = selected ? '▶ ' : '  ';
      R.drawTextJP(pre + menuOptions[mi], 184, myy, col, 13);
    }

    R.drawDialogBox(96, 286, 288, 22);
    drawPanelAccent(96, 286, 288, 22, '#6e7ea7');
    R.drawTextJP(titleDescriptions[titleSelection] || '', 108, 291, '#dbe5ff', 9);
    R.drawTextJP('矢印/WASD: 移動  Z/Enter: 決定  X/Esc: メニュー  M: ミュート', 56, 312, '#616c8a', 9);

    R.drawText('v2.1', 430, 318, '#444', 10);
  }

  function drawHUD() {
    var R = Game.Renderer;
    var pd = Game.Player.getData();
    var map = Game.Map.getCurrentMap();
    var chapterInfo = getChapterInfo();
    var mapInfo = getMapInfo();
    var journeyState = getJourneyState();
    var accent = chapterInfo.accent || Game.Config.COLORS.GOLD;
    var objective = clampText(getCurrentObjective(), 30);
    var hint = mapInfo && mapInfo.hint ? clampText(mapInfo.hint, 34) : clampText(chapterInfo.hint, 34);

    if (map) {
      R.drawDialogBox(5, 5, 176, 34);
      drawPanelAccent(5, 5, 176, 34, accent);
      R.drawTextJP(chapterInfo.act + ' / ' + chapterInfo.displayLabel, 12, 8, accent, 9);
      R.drawTextJP((mapInfo && mapInfo.label) || map.name, 12, 18, '#fff', 11);
      if ((mapInfo && mapInfo.subtitle) || chapterInfo.subtitle) {
        R.drawTextJP(clampText((mapInfo && mapInfo.subtitle) || chapterInfo.subtitle, 16), 12, 28, '#91a2c8', 8);
      }
    }

    drawJourneyTracker(184, 5, chapterInfo);

    R.drawDialogBox(Game.Config.CANVAS_WIDTH - 110, 5, 105, 38);
    drawPanelAccent(Game.Config.CANVAS_WIDTH - 110, 5, 105, 38, '#8fb8ff');
    R.drawTextJP('HP', Game.Config.CANVAS_WIDTH - 101, 9, '#fff', 9);
    var hpRatio = pd.hp / pd.maxHp;
    R.drawRectAbsolute(Game.Config.CANVAS_WIDTH - 76, 10, 60, 8, '#243147');
    R.drawRectAbsolute(Game.Config.CANVAS_WIDTH - 76, 10, 60 * hpRatio, 8,
      hpRatio > 0.3 ? Game.Config.COLORS.HP_GREEN : Game.Config.COLORS.HP_RED);
    R.drawText(pd.hp + '/' + pd.maxHp, Game.Config.CANVAS_WIDTH - 79, 18, '#d9e6ff', 8);
    R.drawText(pd.gold + 'G', Game.Config.CANVAS_WIDTH - 32, 9, '#ffdd44', 8, 'right');
    var respectGauge = journeyState && typeof journeyState.respectGauge === 'number' ? journeyState.respectGauge : 0;
    var respectRatio = Math.max(0, Math.min(1, respectGauge / 100));
    R.drawTextJP('敬意', Game.Config.CANVAS_WIDTH - 101, 22, '#ffe08f', 9);
    R.drawRectAbsolute(Game.Config.CANVAS_WIDTH - 76, 23, 60, 6, '#243147');
    R.drawRectAbsolute(Game.Config.CANVAS_WIDTH - 76, 23, 60 * respectRatio, 6, '#ffd66b');
    R.drawText(Math.min(respectGauge, 999), Game.Config.CANVAS_WIDTH - 17, 30, '#ffe08f', 8, 'right');

    R.drawDialogBox(5, Game.Config.CANVAS_HEIGHT - 41, 296, 36);
    drawPanelAccent(5, Game.Config.CANVAS_HEIGHT - 41, 296, 36, accent);
    R.drawTextJP('目的', 12, Game.Config.CANVAS_HEIGHT - 36, accent, 10);
    R.drawTextJP(objective, 44, Game.Config.CANVAS_HEIGHT - 36, '#fff', 10);
    R.drawTextJP(hint, 12, Game.Config.CANVAS_HEIGHT - 22, '#9fb0d6', 9);

    var partyMembers = getPartyMembers();
    var maxPartyMembers = Game.Player && Game.Player.getMaxPartyMembers ? Game.Player.getMaxPartyMembers() : 3;
    R.drawDialogBox(307, Game.Config.CANVAS_HEIGHT - 41, 168, 36);
    drawPanelAccent(307, Game.Config.CANVAS_HEIGHT - 41, 168, 36, '#8fe0ff');
    var catalystCount = (journeyState.catalysts && journeyState.catalysts.length) || 0;
    R.drawTextJP('同行 ' + partyMembers.length + '/' + maxPartyMembers, 314, Game.Config.CANVAS_HEIGHT - 36, '#8fe0ff', 10);
    R.drawTextJP('触媒 ' + catalystCount, 420, Game.Config.CANVAS_HEIGHT - 36, '#9ed7ff', 8, 'right');
    if (!partyMembers.length) {
      R.drawTextJP('ひとり旅', 314, Game.Config.CANVAS_HEIGHT - 22, '#7f8aa8', 9);
    } else {
      for (var pi = 0; pi < Math.min(3, partyMembers.length); pi++) {
        var member = partyMembers[pi];
        R.drawRectAbsolute(314 + pi * 52, Game.Config.CANVAS_HEIGHT - 19, 4, 4, member.color || '#d7e6ff');
        R.drawTextJP(member.name, 314 + pi * 52, Game.Config.CANVAS_HEIGHT - 22, member.color || '#d7e6ff', 9);
      }
    }
  }

  function drawDialog(text) {
    var R = Game.Renderer;
    var npc = Game.NPC.getCurrentNpc();
    var speakerName = npc ? npc.name : '';
    var chapterInfo = getChapterInfo();
    var accent = chapterInfo.accent || Game.Config.COLORS.GOLD;
    text = typeof text === 'string' ? text : '';

    R.drawDialogBox(10, Game.Config.CANVAS_HEIGHT - 86, Game.Config.CANVAS_WIDTH - 20, 76);
    drawPanelAccent(10, Game.Config.CANVAS_HEIGHT - 86, Game.Config.CANVAS_WIDTH - 20, 76, accent);

    if (speakerName) {
      R.drawDialogBox(10, Game.Config.CANVAS_HEIGHT - 104, 114, 20);
      drawPanelAccent(10, Game.Config.CANVAS_HEIGHT - 104, 114, 20, accent);
      R.drawTextJP(speakerName, 20, Game.Config.CANVAS_HEIGHT - 100, accent, 12);
    }

    var lines = wrapTextSmart(text, 29, 3);

    for (var i = 0; i < lines.length && i < 3; i++) {
      R.drawTextJP(lines[i], 24, Game.Config.CANVAS_HEIGHT - 75 + i * 19, '#fff', 14);
    }

    // Advance indicator
    if (blinkTimer % 40 < 25) {
      R.drawTextJP('▼', Game.Config.CANVAS_WIDTH - 36, Game.Config.CANVAS_HEIGHT - 24, '#fff', 12);
    }
    R.drawTextJP('Z / Enter', Game.Config.CANVAS_WIDTH - 94, Game.Config.CANVAS_HEIGHT - 24, '#8092ba', 8);
    blinkTimer++;
  }

  function drawMenu() {
    var R = Game.Renderer;
    var C = Game.Config;
    var pd = Game.Player.getData();
    var equipped = Game.Player.getEquippedDice();
    var chapterInfo = getChapterInfo();
    var mapInfo = getMapInfo();
    var map = Game.Map.getCurrentMap();
    var journeyState = getJourneyState();

    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, 'rgba(4, 6, 18, 0.5)');
    R.drawDialogBox(100, 30, 280, 260);
    drawPanelAccent(100, 30, 280, 260, chapterInfo.accent || C.COLORS.GOLD);
    R.drawTextJP(chapterInfo.act + ' / ' + chapterInfo.displayLabel + ' ' + chapterInfo.title, 240, 38, chapterInfo.accent || C.COLORS.GOLD, 12, 'center');
    R.drawTextJP(chapterInfo.subtitle, 240, 52, '#cfd7f2', 9, 'center');

    // Stats
    R.drawTextJP('HP: ' + pd.hp + '/' + pd.maxHp, 120, 68, '#fff', 13);
    R.drawRectAbsolute(120, 78, 108, 8, '#273349');
    R.drawRectAbsolute(121, 79, Math.max(0, Math.floor(106 * (pd.hp / pd.maxHp))), 6, pd.hp / pd.maxHp > 0.3 ? C.COLORS.HP_GREEN : C.COLORS.HP_RED);
    R.drawTextJP('防御力: ' + Game.Player.getDefense(), 120, 90, '#fff', 13);
    R.drawTextJP('所持金: ' + pd.gold + 'G', 120, 106, '#ffdd44', 13);
    var aName = pd.armor ? Game.Items.get(pd.armor).name : 'なし';
    R.drawTextJP('防具: ' + aName, 258, 90, '#aaa', 11);
    R.drawTextJP('敬意: ' + (journeyState.respectGauge || 0), 258, 106, '#ffe08f', 11);
    R.drawTextJP('触媒: ' + ((journeyState.catalysts && journeyState.catalysts.length) || 0), 258, 120, '#9ed7ff', 11);
    R.drawRectAbsolute(258, 136, 92, 6, '#273349');
    R.drawRectAbsolute(259, 137, Math.max(0, Math.floor(90 * Math.min(1, (journeyState.respectGauge || 0) / 100))), 4, '#ffd66b');
    R.drawTextJP('現在地: ' + ((mapInfo && mapInfo.label) || (map && map.name) || '不明'), 120, 124, '#8fb8ff', 10);
    var partyMembers = getPartyMembers();
    var partyText = partyMembers.length ? partyMembers.map(function(member) { return member.name; }).join(' / ') : 'なし';
    R.drawTextJP('同行: ' + clampText(partyText, 18), 120, 138, '#8fe0ff', 10);
    R.drawTextJP('目標: ' + clampText(getCurrentObjective(), 22), 120, 152, '#dce6ff', 10);
    R.drawRectAbsolute(120, 166, 240, 1, '#374767');

    // Tabs
    var tabs = ['もちもの', 'サイコロ', 'ぼうぐ'];
    var tabX = 120;
    for (var t = 0; t < tabs.length; t++) {
      var tx = tabX + t * 76;
      var activeTab = (fieldMenuState.section === t);
      R.drawRectAbsolute(tx, 172, 68, 18, activeTab ? 'rgba(255,204,0,0.16)' : 'rgba(255,255,255,0.06)');
      if (activeTab) {
        R.drawRectAbsolute(tx + 4, 174, 60, 1, chapterInfo.accent || C.COLORS.GOLD);
      }
      R.drawTextJP(tabs[t], tx + 8, 176, activeTab ? C.COLORS.GOLD : '#aaa', 11);
    }
    R.drawRectAbsolute(120, 194, 240, 1, '#446');

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
      R.drawDialogBox(120, 252, 240, 18);
      drawPanelAccent(120, 252, 240, 18, '#8fb8ff');
      R.drawTextJP(fieldMenuState.message, 126, 255, '#fff', 10);
    }

    var sectionHints = ['使う・捨てるで持ち物を整理', '旅路に合わせてサイコロを組み替える', '防具で守りを整える'];
    R.drawTextJP(sectionHints[fieldMenuState.section], 120, 272, '#9aa7c9', 9);
    R.drawTextJP('←→: 切替  Z/Space: 決定  X: 戻る', 258, 272, '#888', 10, 'center');
  }

  function drawItemMenuSection(R, C, pd) {
    var visibleItems = 6;
    var areaY = 200;
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
      R.drawDialogBox(272, 204, 88, commands.length * 18 + 12);
      for (var ci = 0; ci < commands.length; ci++) {
        var cSelected = (ci === fieldMenuState.commandIndex);
        var cPrefix = cSelected ? '▶ ' : '  ';
        R.drawTextJP(cPrefix + commands[ci], 282, 212 + ci * 18, cSelected ? C.COLORS.GOLD : '#fff', 11);
      }
    }
  }

  function drawDiceMenuSection(R, C, pd, equipped) {
    var ctx = R.getContext();
    var ownedDice = getOwnedDiceOptions();
    var visibleDice = 5;
    R.drawTextJP('装備スロット:', 120, 200, C.COLORS.GOLD, 12);

    for (var s = 0; s < pd.diceSlots; s++) {
      var slotY = 218 + s * 18;
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
      R.drawRectAbsolute(120, 246, 240, 1, '#446');
      R.drawTextJP('出目: ' + selectedDie.faces.join(' - '), 122, 252, '#fff', 11);
      R.drawTextJP(selectedDie.desc || '説明なし', 122, 268, '#aaa', 10);
    }

    if (!fieldMenuState.diceEquipActive) {
      R.drawTextJP('決定で入れ替え', 238, 238, '#888', 10);
      return;
    }

    R.drawDialogBox(250, 210, 110, 84);
    var maxOffset = Math.max(0, ownedDice.length - visibleDice);
    var scrollOffset = Math.min(maxOffset, Math.max(0, fieldMenuState.diceEquipIndex - visibleDice + 1));
    for (var i = scrollOffset; i < ownedDice.length && i < scrollOffset + visibleDice; i++) {
      var option = ownedDice[i];
      var selected = (i === fieldMenuState.diceEquipIndex);
      var prefix2 = selected ? '▶ ' : '  ';
      var label = option.item ? option.item.name : option.name;
      R.drawTextJP(prefix2 + label, 258, 220 + (i - scrollOffset) * 14, selected ? C.COLORS.GOLD : '#fff', 10);
    }
    if (ownedDice[fieldMenuState.diceEquipIndex] && ownedDice[fieldMenuState.diceEquipIndex].item) {
      R.drawTextJP(ownedDice[fieldMenuState.diceEquipIndex].item.faces.join('-'), 258, 270, '#88dd88', 9);
    }
  }

  function drawArmorMenuSection(R, C, pd) {
    var armorOptions = getOwnedArmorOptions();
    var visibleArmor = 3;
    var currentArmor = pd.armor ? Game.Items.get(pd.armor) : null;
    R.drawTextJP('現在の防具:', 120, 200, C.COLORS.GOLD, 12);
    R.drawTextJP(currentArmor ? currentArmor.name : 'なし', 200, 200, '#fff', 12);
    R.drawTextJP(currentArmor ? currentArmor.desc : '装備していない', 120, 218, '#aaa', 10);

    R.drawRectAbsolute(120, 236, 240, 1, '#446');
    R.drawTextJP('装備候補:', 120, 242, C.COLORS.GOLD, 12);

    var maxOffset = Math.max(0, armorOptions.length - visibleArmor);
    var scrollOffset = Math.min(maxOffset, Math.max(0, fieldMenuState.armorIndex - visibleArmor + 1));
    for (var i = scrollOffset; i < armorOptions.length && i < scrollOffset + visibleArmor; i++) {
      var option = armorOptions[i];
      var selected = (i === fieldMenuState.armorIndex);
      var prefix = selected ? '▶ ' : '  ';
      var label = option.item ? option.item.name : 'はずす';
      R.drawTextJP(prefix + label, 130, 252 + (i - scrollOffset) * 14, selected ? C.COLORS.GOLD : '#fff', 11);
    }

    var selectedArmor = armorOptions[fieldMenuState.armorIndex];
    if (selectedArmor) {
      var desc = selectedArmor.item ? selectedArmor.item.desc : '現在の防具を外す';
      R.drawRectAbsolute(120, 286, 240, 1, '#446');
      R.drawTextJP(clampText(desc, 24), 122, 290, '#aaa', 10);
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
    var chapterInfo = getChapterInfo();
    R.clear('#05070d');

    titleTimer++;
    var yOff = Math.sin(titleTimer / 40) * 2;

    if (pd.chapter >= 10) {
      R.drawTextJP('群馬の深部、その先へ', 112, 34 + yOff, Game.Config.COLORS.GOLD, 24);
      R.drawTextJP('十章にわたる異界の旅路を、ついに走り抜けた。', 74, 78, '#f2f5ff', 12);
      R.drawTextJP('土地の誇りも、敵の悲哀も、仲間との記憶も、', 72, 114, '#bfc8df', 11);
      R.drawTextJP('すべてを抱えたまま境界を越える。', 110, 132, '#bfc8df', 11);
      R.drawTextJP('リスペクトを賭けたダイスは、最後まで旅そのものだった。', 46, 176, '#d7a85d', 11);
      R.drawTextJP('〜 Journey Complete 〜', 138, 226, Game.Config.COLORS.GOLD, 15);
      R.drawTextJP('第十章「' + chapterInfo.title + '」完', 146, 258, '#fff', 12);
    } else {
      R.drawTextJP('旅はまだ終わらない', 126, 40 + yOff, Game.Config.COLORS.GOLD, 24);
      R.drawTextJP('ここは一区切りにすぎない。', 152, 92, '#fff', 13);
      R.drawTextJP('県境の向こうにも、さらに濃い群馬が待っている。', 72, 128, '#b8c0d8', 12);
      R.drawTextJP('次の章で、旅路はもっと深く歪んでいく。', 96, 146, '#b8c0d8', 12);
      R.drawTextJP('〜 Continue The Journey 〜', 122, 234, Game.Config.COLORS.GOLD, 14);
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

  function showAreaBanner(mapId) {
    var chapterInfo = getChapterInfo();
    var mapInfo = Game.Chapters && Game.Chapters.getMap ? Game.Chapters.getMap(mapId) : null;
    var map = Game.Map && Game.Map.getCurrentMap ? Game.Map.getCurrentMap() : null;
    areaBanner.active = true;
    areaBanner.timer = 150;
    areaBanner.maxTimer = 150;
    areaBanner.chapterNumber = chapterInfo.journeyIndex || chapterInfo.number || 1;
    areaBanner.chapterTitle = chapterInfo.displayLabel + ' ' + (chapterInfo.title || '');
    areaBanner.mapLabel = mapInfo && mapInfo.label ? mapInfo.label : (map && map.name ? map.name : '');
    areaBanner.mapSubtitle = mapInfo && mapInfo.subtitle ? mapInfo.subtitle : '';
    areaBanner.accent = chapterInfo.accent || Game.Config.COLORS.GOLD;
  }

  function updateAreaBanner() {
    if (!areaBanner.active) return;
    areaBanner.timer--;
    if (areaBanner.timer <= 0) {
      areaBanner.active = false;
    }
  }

  function drawAreaBanner() {
    if (!areaBanner.active) return;
    var R = Game.Renderer;
    var ctx = R.getContext();
    var progress = areaBanner.timer / areaBanner.maxTimer;
    var fade = Math.min(1, progress * 2.2);
    var slide = progress > 0.5 ? (1 - progress) * 26 : 0;

    ctx.globalAlpha = fade;
    R.drawDialogBox(96, 52 + slide, 288, 46);
    drawPanelAccent(96, 52 + slide, 288, 46, areaBanner.accent);
    R.drawTextJP(areaBanner.chapterTitle, 116, 61 + slide, areaBanner.accent, 12);
    R.drawTextJP(areaBanner.mapLabel, 116, 77 + slide, '#ffffff', 14);
    R.drawTextJP(areaBanner.mapSubtitle, 116, 92 + slide, '#9fb0d6', 9);
    ctx.globalAlpha = 1;
  }

  // Minimap
  function drawMinimap() {
    if (!minimapVisible) return;
    var map = Game.Map.getCurrentMap();
    if (!map || !map.tiles) return;
    var R = Game.Renderer;
    var mx = 385, my = 34, pw = 3, ph = 3;

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
    showAreaBanner: showAreaBanner,
    updateAreaBanner: updateAreaBanner,
    drawAreaBanner: drawAreaBanner,
    getTitleSelection: getTitleSelection,
    updateTitleMenu: updateTitleMenu,
    toggleMinimap: toggleMinimap,
    openFieldMenu: openFieldMenu,
    updateFieldMenu: updateFieldMenu
  };
})();
