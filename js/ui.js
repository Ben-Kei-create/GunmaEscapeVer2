// UI system - dialogs, menus, title screen, HUD
Game.UI = (function() {
  var dialogActive = false;
  var dialogText = '';
  var menuActive = false;
  var menuIndex = 0;
  var titlePhase = 0;
  var titleTimer = 0;
  var blinkTimer = 0;

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
    R.drawTextJP('道と異界の気配を読み、儀式を進めよ。', 105, 158, '#888', 12);
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

    // Blink "Press Z"
    blinkTimer++;
    if (blinkTimer % 60 < 40) {
      R.drawTextJP('Zキーでスタート', 175, 220, '#fff', 14);
    }

    // Minimal prompts
    R.drawTextJP('M: ミュート', 50, 293, '#666', 10);

    // Version
    R.drawText('v2.0', 430, 305, '#444', 10);
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

  function drawMenu(menuMessage) {
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

    if (menuMessage) {
      R.drawTextJP(menuMessage, 128, 256, '#44ddaa', 10);
    }
    R.drawTextJP('Z:回復  S:セーブ  L:ロード  X:閉じる', 118, 272, '#888', 10);
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

  return {
    drawTitleScreen: drawTitleScreen,
    drawHUD: drawHUD,
    drawDialog: drawDialog,
    drawMenu: drawMenu,
    drawGameOver: drawGameOver,
    drawEnding: drawEnding,
    drawTransition: drawTransition
  };
})();
