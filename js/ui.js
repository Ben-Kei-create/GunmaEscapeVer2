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
  var titleSelectionVisual = 0;
  var titleHighlightFlash = 0;
  var UI_SETTINGS_KEY = 'gunmaEscape_ui_settings_v1';
  var uiSettings = loadUiSettings();
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
    settingIndex: 0,
    message: '',
    messageTimer: 0
  };

  // Damage number popups
  var damagePopups = [];
  var titleDescriptions = [
    '県境の向こうへ、最初の一歩を踏み出す。',
    '残した記録から旅を再開する。',
    'あいことばで旅の続きへ戻る。',
    '実績と解放状況を確認する。'
  ];
  var minimapColors = {
    0: '#2a5a1f', 1: '#8a7a4a', 2: '#2244aa', 3: '#444',
    4: '#1a3a0e', 5: '#6699aa', 6: '#4a7a3a', 7: '#882222',
    8: '#6a4a0a', 9: '#6a5a4a'
  };

  function getDefaultUiSettings() {
    return {
      showJourneyBadge: true
    };
  }

  function loadUiSettings() {
    var defaults = getDefaultUiSettings();
    try {
      var raw = localStorage.getItem(UI_SETTINGS_KEY);
      if (!raw) return defaults;
      var parsed = JSON.parse(raw);
      return {
        showJourneyBadge: parsed.showJourneyBadge !== false
      };
    } catch (err) {
      return defaults;
    }
  }

  function saveUiSettings() {
    try {
      localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(uiSettings));
    } catch (err) {
      // Ignore storage errors and keep runtime state.
    }
  }

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

  function getItemTypeLabel(type) {
    if (type === 'heal') return '回復';
    if (type === 'dice') return 'サイコロ';
    if (type === 'armor') return '防具';
    if (type === 'key') return 'だいじなもの';
    return '持ち物';
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

  function drawInsetPanel(x, y, w, h, title, accent, titleColor) {
    var R = Game.Renderer;
    var color = accent || '#7d8fb8';
    R.drawRectAbsolute(x, y, w, h, 'rgba(255,255,255,0.035)');
    R.drawRectAbsolute(x, y, w, 1, color);
    R.drawRectAbsolute(x, y + h - 1, w, 1, 'rgba(255,255,255,0.08)');
    R.drawRectAbsolute(x, y, 1, h, 'rgba(255,255,255,0.05)');
    if (title) {
      Game.Renderer.drawTextJP(title, x + 8, y + 5, titleColor || color, 10);
    }
  }

  function drawWrappedLines(lines, x, y, lineHeight, color, size) {
    var R = Game.Renderer;
    for (var i = 0; i < lines.length; i++) {
      R.drawTextJP(lines[i], x, y + i * lineHeight, color, size);
    }
  }

  function drawWrappedTextBlock(text, x, y, maxChars, maxLines, lineHeight, color, size) {
    drawWrappedLines(wrapTextSmart(text || '', maxChars, maxLines), x, y, lineHeight, color, size);
  }

  function splitWrappedLines(text, maxChars) {
    var source = '' + (text || '');
    var segments = source.split('\n');
    var lines = [];
    var punctuation = '、。！？…）)] ';

    for (var s = 0; s < segments.length; s++) {
      var remaining = segments[s];
      if (!remaining.length) {
        lines.push('');
        continue;
      }
      while (remaining.length > 0) {
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
    }

    return lines.length ? lines : [''];
  }

  function wrapTextSmart(text, maxChars, maxLines) {
    var allLines = splitWrappedLines(text, maxChars);
    if (allLines.length <= maxLines) return allLines;

    var lines = allLines.slice(0, maxLines);
    var remaining = allLines.slice(maxLines).join('');
    if (lines.length) {
      lines[lines.length - 1] = clampText(lines[lines.length - 1] + remaining, maxChars);
    }
    return lines;
  }

  function paginateDialogText(text, maxChars, maxLines) {
    var allLines = splitWrappedLines(text, maxChars);
    var pages = [];
    for (var i = 0; i < allLines.length; i += maxLines) {
      pages.push(allLines.slice(i, i + maxLines).join('\n'));
    }
    return pages.length ? pages : [''];
  }

  function drawJourneyTracker(x, y, chapterInfo) {
    var R = Game.Renderer;
    var current = chapterInfo.journeyIndex || chapterInfo.number || 1;
    var total = chapterInfo.journeyCount || (Game.Chapters && Game.Chapters.getJourneyCount ? Game.Chapters.getJourneyCount() : 7);
    var width = 104;
    var height = 16;
    R.drawRectAbsolute(x, y, width, height, 'rgba(7, 11, 24, 0.82)');
    R.drawRectAbsolute(x, y, width, 1, 'rgba(255,255,255,0.08)');
    R.drawRectAbsolute(x, y + height - 1, width, 1, 'rgba(255,255,255,0.06)');
    R.drawTextJP('進行', x + 6, y + 4, '#9eb7ea', 8);
    var spacing = total <= 7 ? 8 : 6;
    var startX = x + 26;
    for (var i = 0; i < total; i++) {
      var px = startX + i * spacing;
      var color = '#273349';
      if (i + 1 < current) color = 'rgba(255,255,255,0.35)';
      if (i + 1 === current) color = chapterInfo.accent || Game.Config.COLORS.GOLD;
      R.drawRectAbsolute(px, y + 6, 5, 4, color);
    }
    R.drawTextJP(current + '/' + total, x + width - 7, y + 4, '#fff', 8, 'right');
  }

  function drawTitleScreen() {
    var R = Game.Renderer;
    var C = Game.Config;
    var ctx = R.getContext();

    R.clear('#060813');
    titleTimer++;
    titleSelectionVisual += (titleSelection - titleSelectionVisual) * 0.24;
    if (Math.abs(titleSelectionVisual - titleSelection) < 0.01) {
      titleSelectionVisual = titleSelection;
    }
    if (titleHighlightFlash > 0) titleHighlightFlash--;

    ctx.fillStyle = '#09101f';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    ctx.fillStyle = '#101a33';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, 116);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (var s = 0; s < 26; s++) {
      var sx = (s * 31 + titleTimer * 0.22) % C.CANVAS_WIDTH;
      var sy = 14 + (s * 23 % 96);
      ctx.fillRect(sx, sy, 2, 2);
    }

    drawMountainLayer(ctx, [[0, 176], [46, 150], [102, 166], [165, 130], [236, 170], [314, 126], [392, 160], [480, 144]], '#0d1730');
    drawMountainLayer(ctx, [[0, 206], [54, 180], [120, 198], [196, 164], [256, 208], [332, 172], [420, 194], [480, 178]], '#132146');
    drawMountainLayer(ctx, [[0, 234], [74, 216], [138, 232], [224, 206], [302, 234], [366, 216], [430, 228], [480, 218]], '#18284f');

    ctx.strokeStyle = 'rgba(129,145,201,0.18)';
    ctx.lineWidth = 1;
    for (var gy = 18; gy < 224; gy += 42) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(C.CANVAS_WIDTH, gy);
      ctx.stroke();
    }

    // Perspective road toward the border gate
    ctx.fillStyle = '#111726';
    ctx.beginPath();
    ctx.moveTo(166, 320);
    ctx.lineTo(314, 320);
    ctx.lineTo(266, 166);
    ctx.lineTo(214, 166);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1a2338';
    ctx.fillRect(0, 236, C.CANVAS_WIDTH, 84);

    ctx.fillStyle = '#f1c76d';
    for (var mark = 0; mark < 6; mark++) {
      var markY = 282 - mark * 24 + (titleTimer % 2);
      var markW = 10 + mark * 5;
      ctx.fillRect(240 - Math.floor(markW / 2), markY, markW, 6);
    }

    // Border gate silhouette
    ctx.fillStyle = '#0a1020';
    ctx.fillRect(190, 140, 10, 42);
    ctx.fillRect(280, 140, 10, 42);
    ctx.fillRect(176, 138, 128, 8);
    ctx.fillRect(202, 150, 76, 20);
    ctx.fillStyle = '#4f1224';
    ctx.fillRect(204, 152, 72, 16);
    ctx.fillStyle = '#f04d64';
    var gateBlink = (titleTimer % 50) < 24 ? '#ff6c7e' : '#8b263b';
    ctx.fillStyle = gateBlink;
    ctx.fillRect(214, 156, 8, 8);
    ctx.fillRect(258, 156, 8, 8);
    ctx.fillStyle = '#dcdfe9';
    ctx.fillRect(190, 176, 100, 3);
    ctx.fillStyle = '#b4364d';
    ctx.fillRect(194, 176, 12, 3);
    ctx.fillRect(214, 176, 12, 3);
    ctx.fillRect(234, 176, 12, 3);
    ctx.fillRect(254, 176, 12, 3);

    // Small traveler silhouette
    ctx.fillStyle = '#d5ddf0';
    ctx.fillRect(237, 252, 6, 8);
    ctx.fillRect(235, 260, 10, 8);
    ctx.fillStyle = '#7f8fb6';
    ctx.fillRect(236, 268, 3, 9);
    ctx.fillRect(241, 268, 3, 9);

    var yOff = Math.sin(titleTimer / 30) * 2;
    R.drawRectAbsolute(74, 28, 96, 1, 'rgba(255,204,51,0.28)');
    R.drawRectAbsolute(310, 28, 96, 1, 'rgba(255,204,51,0.28)');
    R.drawTextJP('異界ロードムービーRPG', 240, 22, '#8fb8ff', 10, 'center');
    R.drawTextJP('群馬県からの脱出', 240, 42 + yOff, C.COLORS.GOLD, 28, 'center');
    R.drawTextJP('Escape from Gunma', 240, 78 + yOff, '#c6d0ff', 12, 'center');
    R.drawTextJP('境界を越え、異界群馬から抜け出せ。', 240, 108, '#eef2ff', 11, 'center');

    // Menu selection
    blinkTimer++;
    var menuOptions = ['はじめから', 'つづきから', 'あいことば', '実績'];
    var hasSave = Game.Save && Game.Save.hasAnySave && Game.Save.hasAnySave();
    var menuX = 148;
    var menuY = 176;
    R.drawDialogBox(menuX, menuY, 184, 92);
    drawPanelAccent(menuX, menuY, 184, 92, Game.Config.COLORS.GOLD);
    var highlightY = menuY + 14 + titleSelectionVisual * 18;
    var pulse = (Math.sin(titleTimer / 7) + 1) * 0.5;
    var flash = titleHighlightFlash / 8;
    var arrowOffset = Math.sin(titleTimer / 5) * 2;
    ctx.fillStyle = 'rgba(255, 204, 0, ' + (0.1 + pulse * 0.07 + flash * 0.12).toFixed(3) + ')';
    ctx.fillRect(menuX + 22, highlightY - 2, 136, 16);
    ctx.fillStyle = 'rgba(255, 247, 200, ' + (0.08 + pulse * 0.06 + flash * 0.1).toFixed(3) + ')';
    ctx.fillRect(menuX + 22 + ((titleTimer * 3) % 124), highlightY - 2, 12, 16);
    R.drawRectAbsolute(menuX + 22, highlightY - 2, 136, 1, 'rgba(255,220,120,0.55)');
    R.drawRectAbsolute(menuX + 22, highlightY + 13, 136, 1, 'rgba(255,255,255,0.1)');
    R.drawRectAbsolute(menuX + 20, highlightY + 4, 6, 6, Game.Config.COLORS.GOLD);
    R.drawRectAbsolute(menuX + 18 + Math.round(arrowOffset), highlightY + 6, 2, 2, '#fff4c6');
    for (var mi = 0; mi < menuOptions.length; mi++) {
      var myy = menuY + 15 + mi * 18;
      var selected = (mi === titleSelection);
      var col = '#fff';
      if (mi === 1 && !hasSave) col = '#555';
      if (selected) col = Game.Config.COLORS.GOLD;
      if (selected) {
        R.drawTextJP(menuOptions[mi], 240, myy + 1, 'rgba(12,18,36,0.9)', 13, 'center');
      }
      R.drawTextJP(menuOptions[mi], 240, myy, col, selected ? 14 : 13, 'center');
    }

    R.drawDialogBox(108, 278, 264, 18);
    drawPanelAccent(108, 278, 264, 18, '#6e7ea7');
    R.drawTextJP(titleDescriptions[titleSelection] || '', 240, 282, '#dbe5ff', 8, 'center');
    R.drawTextJP('矢印/WASD: 移動  Z/Enter: 決定  X/Esc: メニュー', 240, 306, '#616c8a', 8, 'center');

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

    if (map) {
      R.drawDialogBox(5, 5, 176, 34);
      drawPanelAccent(5, 5, 176, 34, accent);
      R.drawTextJP(chapterInfo.act + ' / ' + chapterInfo.displayLabel, 12, 8, accent, 9);
      R.drawTextJP((mapInfo && mapInfo.label) || map.name, 12, 18, '#fff', 11);
      if ((mapInfo && mapInfo.subtitle) || chapterInfo.subtitle) {
        R.drawTextJP(clampText((mapInfo && mapInfo.subtitle) || chapterInfo.subtitle, 16), 12, 28, '#91a2c8', 8);
      }
    }

    if (uiSettings.showJourneyBadge) {
      drawJourneyTracker(194, 7, chapterInfo);
    }

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
    var accent = chapterInfo.accent || C.COLORS.GOLD;
    var boxX = 50;
    var boxY = 12;
    var boxW = 380;
    var boxH = 296;
    var leftCardX = 70;
    var rightCardX = 250;
    var cardY = 60;
    var cardW = 160;
    var cardH = 70;
    var infoX = 70;
    var infoY = 138;
    var infoW = 340;
    var infoH = 56;
    var tabX = 70;
    var tabY = 194;
    var tabW = 85;
    var contentY = 222;
    var listX = 70;
    var listW = 142;
    var detailX = 222;
    var detailW = 186;
    var contentH = 62;
    var partyMembers = getPartyMembers();
    var partyText = partyMembers.length ? partyMembers.map(function(member) { return member.name; }).join(' / ') : 'ひとり旅';
    var currentMapLabel = (mapInfo && mapInfo.label) || (map && map.name) || '不明';
    var aName = pd.armor ? Game.Items.get(pd.armor).name : 'なし';
    var respectValue = journeyState.respectGauge || 0;
    var respectRatio = Math.max(0, Math.min(1, respectValue / 100));
    var currentJourney = chapterInfo.journeyIndex || chapterInfo.number || 1;
    var totalJourney = chapterInfo.journeyCount || (Game.Chapters && Game.Chapters.getJourneyCount ? Game.Chapters.getJourneyCount() : 7);

    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, 'rgba(4, 6, 18, 0.5)');
    R.drawDialogBox(boxX, boxY, boxW, boxH);
    drawPanelAccent(boxX, boxY, boxW, boxH, accent);
    R.drawTextJP(chapterInfo.act + ' / ' + chapterInfo.displayLabel + ' ' + chapterInfo.title, 240, 20, accent, 13, 'center');
    R.drawTextJP(clampText(chapterInfo.subtitle || ((mapInfo && mapInfo.subtitle) || ''), 24), 240, 38, '#cfd7f2', 9, 'center');
    R.drawRectAbsolute(68, 54, 344, 1, '#33415f');

    drawInsetPanel(leftCardX, cardY, cardW, cardH, '旅人の状態', accent, accent);
    R.drawTextJP('HP', leftCardX + 10, cardY + 20, '#dfe8ff', 10);
    R.drawTextJP(pd.hp + '/' + pd.maxHp, leftCardX + 42, cardY + 18, '#ffffff', 13);
    R.drawRectAbsolute(leftCardX + 10, cardY + 36, 118, 8, '#273349');
    R.drawRectAbsolute(leftCardX + 11, cardY + 37, Math.max(0, Math.floor(116 * (pd.hp / pd.maxHp))), 6, pd.hp / pd.maxHp > 0.3 ? C.COLORS.HP_GREEN : C.COLORS.HP_RED);
    R.drawTextJP('防御', leftCardX + 10, cardY + 50, '#8fb8ff', 10);
    R.drawTextJP('' + Game.Player.getDefense(), leftCardX + 46, cardY + 48, '#ffffff', 11);
    R.drawTextJP('所持金', leftCardX + 88, cardY + 50, '#ffdd44', 10);
    R.drawTextJP(pd.gold + 'G', leftCardX + 126, cardY + 48, '#ffdd44', 11, 'right');

    drawInsetPanel(rightCardX, cardY, cardW, cardH, '補助情報', '#8fe0ff', '#8fe0ff');
    R.drawTextJP('進行 ' + currentJourney + '/' + totalJourney, rightCardX + 148, cardY + 6, '#9ed7ff', 8, 'right');
    R.drawTextJP('防具', rightCardX + 10, cardY + 20, '#9ed7ff', 10);
    R.drawTextJP(clampText(aName, 10), rightCardX + 46, cardY + 18, '#ffffff', 11);
    R.drawTextJP('触媒', rightCardX + 102, cardY + 20, '#9ed7ff', 10);
    R.drawTextJP('' + (((journeyState.catalysts && journeyState.catalysts.length) || 0)), rightCardX + 144, cardY + 18, '#ffffff', 11, 'right');
    R.drawTextJP('同行', rightCardX + 10, cardY + 36, '#8fe0ff', 10);
    R.drawTextJP(clampText(partyText, 16), rightCardX + 46, cardY + 34, '#d7e6ff', 9);
    R.drawTextJP('敬意', rightCardX + 10, cardY + 50, '#ffe08f', 10);
    R.drawTextJP('' + respectValue, rightCardX + 144, cardY + 48, '#ffe08f', 11, 'right');

    drawInsetPanel(infoX, infoY, infoW, infoH, '現在地 / 目標', '#7d8fb8', '#8fb8ff');
    R.drawTextJP('現在地', infoX + 10, infoY + 17, '#8fb8ff', 10);
    R.drawTextJP(clampText(currentMapLabel, 18), infoX + 52, infoY + 17, '#ffffff', 10);
    R.drawTextJP('目標', infoX + 10, infoY + 29, '#8fb8ff', 10);
    drawWrappedTextBlock(getCurrentObjective(), infoX + 52, infoY + 29, 18, 3, 9, '#dce6ff', 9);

    // Tabs
    var tabs = ['もちもの', 'サイコロ', 'ぼうぐ', 'せってい'];
    for (var t = 0; t < tabs.length; t++) {
      var activeTab = (fieldMenuState.section === t);
      var tx = tabX + t * tabW;
      R.drawRectAbsolute(tx, tabY, tabW - 8, 20, activeTab ? 'rgba(255,204,0,0.16)' : 'rgba(255,255,255,0.06)');
      if (activeTab) {
        R.drawRectAbsolute(tx + 6, tabY + 3, tabW - 20, 1, accent);
      }
      R.drawTextJP(tabs[t], tx + 12, tabY + 5, activeTab ? C.COLORS.GOLD : '#b5bfd8', 11);
    }
    R.drawRectAbsolute(70, 218, 338, 1, '#446');

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
      case 3:
        drawSettingsSection(R, C);
        break;
    }

    var sectionHints = ['使う・捨てるで持ち物を整理', '役目に応じてサイコロを組み替える', '防具で守りを整える', '表示の見え方を切り替える'];
    var footerText = fieldMenuState.messageTimer > 0 && fieldMenuState.message
      ? clampText(fieldMenuState.message, 40)
      : sectionHints[fieldMenuState.section];
    R.drawTextJP(footerText, 72, 286, fieldMenuState.messageTimer > 0 ? '#ffffff' : '#9aa7c9', 9);
    R.drawTextJP('←→ 切替  ↑↓ 選択  Z/Space 決定  X 戻る', 240, 296, '#6f7c9d', 8, 'center');
  }

  function drawItemMenuSection(R, C, pd) {
    var listX = 70;
    var detailX = 222;
    var panelY = 222;
    var listW = 142;
    var detailW = 186;
    var panelH = 62;
    var visibleItems = 4;

    drawInsetPanel(listX, panelY, listW, panelH, '持ち物 ' + pd.inventory.length, C.COLORS.GOLD, C.COLORS.GOLD);
    drawInsetPanel(detailX, panelY, detailW, panelH, fieldMenuState.commandActive ? '操作' : '詳細', '#8fb8ff', '#8fb8ff');

    if (pd.inventory.length === 0) {
      R.drawTextJP('（なし）', listX + 44, panelY + 26, '#888', 11);
      R.drawTextJP('拾った品はここで整理する。', detailX + 10, panelY + 20, '#9aa7c9', 10);
      return;
    }

    var maxOffset = Math.max(0, pd.inventory.length - visibleItems);
    var scrollOffset = Math.min(maxOffset, Math.max(0, fieldMenuState.itemIndex - visibleItems + 1));
    for (var i = scrollOffset; i < pd.inventory.length && i < scrollOffset + visibleItems; i++) {
      var item = Game.Items.get(pd.inventory[i]);
      var name = item ? item.name : pd.inventory[i];
      var iy = panelY + 18 + (i - scrollOffset) * 11;
      var selected = (i === fieldMenuState.itemIndex);
      if (selected) {
        R.drawRectAbsolute(listX + 6, iy - 1, listW - 12, 11, 'rgba(255,204,0,0.12)');
      }
      R.drawTextJP((selected ? '▶ ' : '  ') + clampText(name, 9), listX + 10, iy, selected ? C.COLORS.GOLD : '#fff', 10);
    }

    var selectedId = pd.inventory[fieldMenuState.itemIndex];
    var selectedItem = selectedId ? Game.Items.get(selectedId) : null;
    if (!selectedItem) return;

    if (fieldMenuState.commandActive) {
      var commands = getFieldMenuCommands(selectedItem);
      for (var ci = 0; ci < commands.length; ci++) {
        var cy = panelY + 18 + ci * 12;
        var cSelected = (ci === fieldMenuState.commandIndex);
        if (cSelected) {
          R.drawRectAbsolute(detailX + 8, cy - 1, detailW - 16, 11, 'rgba(143,224,255,0.1)');
        }
        R.drawTextJP((cSelected ? '▶ ' : '  ') + commands[ci], detailX + 12, cy, cSelected ? C.COLORS.GOLD : '#fff', 10);
      }
      return;
    }

    R.drawTextJP(selectedItem.name, detailX + 10, panelY + 18, '#ffffff', 11);
    R.drawTextJP('分類 ' + getItemTypeLabel(selectedItem.type), detailX + 10, panelY + 30, '#8fb8ff', 9);
    drawWrappedTextBlock(selectedItem.desc || '説明なし', detailX + 10, panelY + 42, 19, 2, 10, '#b7c3e3', 9);
  }

  function drawDiceMenuSection(R, C, pd, equipped) {
    var ownedDice = getOwnedDiceOptions();
    var visibleDice = 4;
    var listX = 70;
    var detailX = 222;
    var panelY = 222;
    var listW = 142;
    var detailW = 186;
    var panelH = 62;

    drawInsetPanel(listX, panelY, listW, panelH, '装備スロット', C.COLORS.GOLD, C.COLORS.GOLD);
    drawInsetPanel(detailX, panelY, detailW, panelH, fieldMenuState.diceEquipActive ? '候補' : 'サイコロ詳細', '#8fb8ff', '#8fb8ff');

    for (var s = 0; s < pd.diceSlots; s++) {
      var slotY = panelY + 18 + s * 12;
      var selectedSlot = (s === fieldMenuState.diceSlotIndex);
      var di = Game.Items.get(equipped[s] || 'normalDice');
      if (selectedSlot) {
        R.drawRectAbsolute(listX + 6, slotY - 1, listW - 12, 11, 'rgba(255,204,0,0.12)');
      }
      R.drawTextJP((selectedSlot ? '▶ ' : '  ') + '枠' + (s + 1), listX + 10, slotY, selectedSlot ? C.COLORS.GOLD : '#fff', 10);
      if (di) {
        R.drawRectAbsolute(listX + 62, slotY + 1, 8, 8, di.color || '#fff');
        R.drawTextJP(clampText(di.name, 7), listX + 76, slotY, '#d4dcf6', 9);
      }
    }

    var selectedDie = Game.Items.get(equipped[fieldMenuState.diceSlotIndex] || 'normalDice');
    if (!fieldMenuState.diceEquipActive) {
      if (selectedDie) {
        R.drawTextJP(selectedDie.name, detailX + 10, panelY + 18, '#ffffff', 11);
        R.drawTextJP('出目 ' + selectedDie.faces.join(' / '), detailX + 10, panelY + 30, '#88dd88', 9);
        drawWrappedTextBlock(selectedDie.desc || '説明なし', detailX + 10, panelY + 42, 19, 2, 10, '#b7c3e3', 9);
      }
      return;
    }

    var maxOffset = Math.max(0, ownedDice.length - visibleDice);
    var scrollOffset = Math.min(maxOffset, Math.max(0, fieldMenuState.diceEquipIndex - visibleDice + 1));
    for (var i = scrollOffset; i < ownedDice.length && i < scrollOffset + visibleDice; i++) {
      var option = ownedDice[i];
      var selected = (i === fieldMenuState.diceEquipIndex);
      var label = option.item ? option.item.name : option.name;
      var lineY = panelY + 18 + (i - scrollOffset) * 11;
      if (selected) {
        R.drawRectAbsolute(detailX + 8, lineY - 1, detailW - 16, 11, 'rgba(143,224,255,0.1)');
      }
      R.drawTextJP((selected ? '▶ ' : '  ') + clampText(label, 12), detailX + 10, lineY, selected ? C.COLORS.GOLD : '#fff', 10);
    }
    if (ownedDice[fieldMenuState.diceEquipIndex] && ownedDice[fieldMenuState.diceEquipIndex].item) {
      R.drawTextJP('出目 ' + ownedDice[fieldMenuState.diceEquipIndex].item.faces.join('-'), detailX + 10, panelY + 52, '#88dd88', 9);
    }
  }

  function drawArmorMenuSection(R, C, pd) {
    var armorOptions = getOwnedArmorOptions();
    var visibleArmor = 4;
    var currentArmor = pd.armor ? Game.Items.get(pd.armor) : null;
    var listX = 70;
    var detailX = 222;
    var panelY = 222;
    var listW = 142;
    var detailW = 186;
    var panelH = 62;

    drawInsetPanel(listX, panelY, listW, panelH, '装備候補', C.COLORS.GOLD, C.COLORS.GOLD);
    drawInsetPanel(detailX, panelY, detailW, panelH, '防具詳細', '#8fb8ff', '#8fb8ff');

    var maxOffset = Math.max(0, armorOptions.length - visibleArmor);
    var scrollOffset = Math.min(maxOffset, Math.max(0, fieldMenuState.armorIndex - visibleArmor + 1));
    for (var i = scrollOffset; i < armorOptions.length && i < scrollOffset + visibleArmor; i++) {
      var option = armorOptions[i];
      var selected = (i === fieldMenuState.armorIndex);
      var label = option.item ? option.item.name : 'はずす';
      var lineY = panelY + 18 + (i - scrollOffset) * 11;
      if (selected) {
        R.drawRectAbsolute(listX + 6, lineY - 1, listW - 12, 11, 'rgba(255,204,0,0.12)');
      }
      R.drawTextJP((selected ? '▶ ' : '  ') + clampText(label, 9), listX + 10, lineY, selected ? C.COLORS.GOLD : '#fff', 10);
    }

    var selectedArmor = armorOptions[fieldMenuState.armorIndex];
    R.drawTextJP('現在 ' + clampText(currentArmor ? currentArmor.name : 'なし', 11), detailX + 10, panelY + 18, '#ffffff', 10);
    if (selectedArmor) {
      var desc = selectedArmor.item ? selectedArmor.item.desc : '現在の防具を外す';
      R.drawTextJP('選択 ' + clampText(selectedArmor.item ? selectedArmor.item.name : 'はずす', 11), detailX + 10, panelY + 30, '#8fb8ff', 9);
      drawWrappedTextBlock(desc, detailX + 10, panelY + 42, 19, 2, 10, '#b7c3e3', 9);
    }
  }

  function drawSettingsSection(R, C) {
    var listX = 70;
    var detailX = 222;
    var panelY = 222;
    var listW = 142;
    var detailW = 186;
    var panelH = 62;
    var settingsOptions = getSettingsOptions();

    drawInsetPanel(listX, panelY, listW, panelH, '表示設定', C.COLORS.GOLD, C.COLORS.GOLD);
    drawInsetPanel(detailX, panelY, detailW, panelH, '項目詳細', '#8fb8ff', '#8fb8ff');

    for (var i = 0; i < settingsOptions.length; i++) {
      var option = settingsOptions[i];
      var selected = (i === fieldMenuState.settingIndex);
      var lineY = panelY + 18 + i * 12;
      if (selected) {
        R.drawRectAbsolute(listX + 6, lineY - 1, listW - 12, 11, 'rgba(255,204,0,0.12)');
      }
      R.drawTextJP((selected ? '▶ ' : '  ') + clampText(option.label, 8), listX + 10, lineY, selected ? C.COLORS.GOLD : '#fff', 10);
      R.drawTextJP(option.valueLabel, listX + listW - 10, lineY, option.valueColor, 9, 'right');
    }

    var current = settingsOptions[fieldMenuState.settingIndex];
    if (!current) return;
    R.drawTextJP(current.label, detailX + 10, panelY + 18, '#ffffff', 11);
    R.drawTextJP(current.valueLabel, detailX + detailW - 10, panelY + 18, current.valueColor, 10, 'right');
    drawWrappedTextBlock(current.description, detailX + 10, panelY + 32, 19, 2, 10, '#b7c3e3', 9);
  }

  function clampFieldMenuSelection() {
    var pd = Game.Player.getData();
    var inventory = pd.inventory;
    var armorOptions = getOwnedArmorOptions();
    var settingsOptions = getSettingsOptions();
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
    if (fieldMenuState.settingIndex >= settingsOptions.length) fieldMenuState.settingIndex = settingsOptions.length - 1;
    if (fieldMenuState.settingIndex < 0) fieldMenuState.settingIndex = 0;
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

  function getSettingsOptions() {
    return [
      {
        id: 'showJourneyBadge',
        label: '進行バッジ',
        value: !!uiSettings.showJourneyBadge,
        valueLabel: uiSettings.showJourneyBadge ? 'ON' : 'OFF',
        valueColor: uiSettings.showJourneyBadge ? '#8fe08f' : '#ff9b7d',
        description: '探索HUDの上部にある進行バッジの表示を切り替える。'
      }
    ];
  }

  function changeFieldMenuSection(dir) {
    fieldMenuState.section = (fieldMenuState.section + dir + 4) % 4;
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
    fieldMenuState.settingIndex = 0;
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
    if (fieldMenuState.section === 3) {
      return updateSettingsMenu();
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

  function updateSettingsMenu() {
    var settingsOptions = getSettingsOptions();
    if (Game.Input.isPressed('up')) {
      fieldMenuState.settingIndex = (fieldMenuState.settingIndex - 1 + settingsOptions.length) % settingsOptions.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down')) {
      fieldMenuState.settingIndex = (fieldMenuState.settingIndex + 1) % settingsOptions.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('cancel')) {
      return { close: true };
    }

    var current = settingsOptions[fieldMenuState.settingIndex];
    if (!current) return null;
    var shouldToggle = Game.Input.isPressed('confirm') || Game.Input.isPressed('left') || Game.Input.isPressed('right');
    if (!shouldToggle) return null;

    if (current.id === 'showJourneyBadge') {
      uiSettings.showJourneyBadge = !uiSettings.showJourneyBadge;
      saveUiSettings();
      setFieldMenuMessage('進行バッジを' + (uiSettings.showJourneyBadge ? '表示' : '非表示') + 'にした。', 45);
      Game.Audio.playSfx('confirm');
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
      titleHighlightFlash = 8;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down')) {
      titleSelection = (titleSelection + 1) % 4;
      titleHighlightFlash = 8;
      Game.Audio.playSfx('confirm');
    }
  }

  function toggleMinimap() {
    minimapVisible = !minimapVisible;
  }

  function isJourneyBadgeEnabled() {
    return !!uiSettings.showJourneyBadge;
  }

  function setJourneyBadgeEnabled(enabled) {
    uiSettings.showJourneyBadge = enabled !== false;
    saveUiSettings();
  }

  function getFieldMenuDebugState() {
    return {
      section: fieldMenuState.section,
      settingIndex: fieldMenuState.settingIndex
    };
  }

  function setFieldMenuSectionForDebug(section) {
    fieldMenuState.section = Math.max(0, Math.min(3, section | 0));
    clampFieldMenuSelection();
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
    updateFieldMenu: updateFieldMenu,
    paginateDialogText: paginateDialogText,
    isJourneyBadgeEnabled: isJourneyBadgeEnabled,
    setJourneyBadgeEnabled: setJourneyBadgeEnabled,
    getFieldMenuDebugState: getFieldMenuDebugState,
    setFieldMenuSectionForDebug: setFieldMenuSectionForDebug
  };
})();
