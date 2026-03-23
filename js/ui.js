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
    var menuOptions = ['はじめから', 'つづきから', '実績'];
    var hasSave = Game.Save && Game.Save.hasSave(0);
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

    R.drawDialogBox(100, 30, 280, 260);
    var chTitle = pd.chapter === 2 ? '第二章 赤城の闇編' : '第一章 群馬脱出編';
    R.drawTextJP(chTitle, 200, 38, C.COLORS.GOLD, 12, 'center');

    // Stats
    R.drawTextJP('HP: ' + pd.hp + '/' + pd.maxHp, 120, 60, '#fff', 13);
    R.drawTextJP('防御力: ' + Game.Player.getDefense(), 120, 78, '#fff', 13);
    R.drawTextJP('所持金: ' + pd.gold + 'G', 120, 96, '#ffdd44', 13);
    var aName = pd.armor ? Game.Items.get(pd.armor).name : 'なし';
    R.drawTextJP('防具: ' + aName, 260, 78, '#aaa', 11);

    // Dice loadout
    R.drawRectAbsolute(120, 114, 240, 1, '#446');
    R.drawTextJP('サイコロ装備:', 120, 119, C.COLORS.GOLD, 12);
    var equipped = Game.Player.getEquippedDice();
    var ctx = R.getContext();
    for (var d = 0; d < equipped.length; d++) {
      var di = Game.Items.get(equipped[d]);
      if (!di) continue;
      var dy = 136 + d * 16;
      // Color swatch
      R.drawRectAbsolute(130, dy + 1, 10, 10, di.color || '#fff');
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(130, dy + 1, 10, 10);
      R.drawTextJP(di.name, 145, dy, '#ccc', 10);
      // Show faces
      R.drawTextJP('[' + di.faces.join('-') + ']', 260, dy, '#888', 9);
    }

    // Line separator
    var invY = 136 + Math.max(equipped.length, 1) * 16 + 4;
    R.drawRectAbsolute(120, invY, 240, 1, '#446');

    // Inventory
    R.drawTextJP('持ち物:', 120, invY + 5, C.COLORS.GOLD, 12);
    if (pd.inventory.length === 0) {
      R.drawTextJP('（なし）', 140, invY + 22, '#888', 11);
    } else {
      for (var i = 0; i < pd.inventory.length; i++) {
        var item = Game.Items.get(pd.inventory[i]);
        var name = item ? item.name : pd.inventory[i];
        var iy = invY + 22 + i * 16;
        if (iy > 264) break;
        R.drawTextJP('・' + name, 130, iy, '#fff', 11);
      }
    }

    R.drawTextJP('Xキーで閉じる', 185, 272, '#888', 10);
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
      titleSelection = (titleSelection - 1 + 3) % 3;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down')) {
      titleSelection = (titleSelection + 1) % 3;
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
    toggleMinimap: toggleMinimap
  };
})();
