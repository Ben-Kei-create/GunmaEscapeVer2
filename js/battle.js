// Battle system
Game.Battle = (function() {
  var active = false;
  var enemy = null;
  var npcRef = null;
  var menuIndex = 0;
  var phase = 'menu'; // menu, diceRoll, diceResult, playerAttack, enemyAttack, victory, defeat
  var message = '';
  var messageTimer = 0;
  var animTimer = 0;
  var shakeX = 0;

  // Dice system
  var diceCount = 1;       // Number of dice to roll (max 5)
  var diceValues = [];     // Current displayed value for each die
  var diceStopped = [];    // Whether each die has been stopped
  var diceResults = [];    // Final results for each die
  var diceTimer = 0;       // Timer for cycling animation
  var diceSpeed = 3;       // Frames between value changes (lower = faster)
  var currentDice = 0;     // Which die is currently being stopped next
  var diceFlashTimer = 0;  // Flash effect when stopping

  // Dice face patterns (7x7 grid, positions of dots)
  var diceDots = {
    1: [[3,3]],
    2: [[1,1],[5,5]],
    3: [[1,1],[3,3],[5,5]],
    4: [[1,1],[1,5],[5,1],[5,5]],
    5: [[1,1],[1,5],[3,3],[5,1],[5,5]],
    6: [[1,1],[1,3],[1,5],[5,1],[5,3],[5,5]]
  };

  var enemies = {
    onsenMonkey: {
      name: '温泉猿',
      hp: 50, maxHp: 50,
      attack: 12, defense: 3,
      sprite: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,1,1,2,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,0,1,2,3,2,2,3,2,2,1,0,0,0,0],
        [0,0,0,1,2,2,2,4,2,2,2,1,0,0,0,0],
        [0,0,0,0,1,2,4,4,4,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,0,1,2,0,0,2,1,0,0,0,0,0,0],
        [0,0,0,0,1,2,0,0,2,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#553322', 2:'#aa7744', 3:'#111', 4:'#cc6666' }
    },
    cabbage: {
      name: '巨大キャベツ',
      hp: 60, maxHp: 60,
      attack: 15, defense: 4,
      sprite: [
        [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,1,2,3,2,1,0,0,0,0,0,0],
        [0,0,0,0,1,2,3,2,3,2,1,0,0,0,0,0],
        [0,0,0,1,2,3,2,3,2,3,2,1,0,0,0,0],
        [0,0,1,2,3,2,3,2,3,2,3,2,1,0,0,0],
        [0,1,2,3,2,3,2,3,2,3,2,3,2,1,0,0],
        [1,2,3,2,3,2,3,2,3,2,3,2,3,2,1,0],
        [1,2,3,2,3,2,3,2,3,2,3,2,3,2,1,0],
        [0,1,2,3,2,3,2,3,2,3,2,3,2,1,0,0],
        [0,0,1,2,3,2,3,2,3,2,3,2,1,0,0,0],
        [0,0,0,1,2,3,2,3,2,3,2,1,0,0,0,0],
        [0,0,0,0,1,2,3,2,3,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,2,3,2,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#2d6e1e', 2:'#44bb44', 3:'#66dd66' }
    }
  };

  var menuItems = ['たたかう', 'アイテム', 'にげる'];

  function start(enemyId, npc) {
    active = true;
    npcRef = npc;
    enemy = JSON.parse(JSON.stringify(enemies[enemyId]));
    menuIndex = 0;
    phase = 'menu';
    message = enemy.name + 'が現れた！';
    messageTimer = 60;
    diceCount = 1;
    Game.Audio.stopBgm();
    Game.Audio.playBgm('battle');
  }

  function startDiceRoll() {
    phase = 'diceRoll';
    diceValues = [];
    diceStopped = [];
    diceResults = [];
    currentDice = 0;
    diceTimer = 0;
    diceFlashTimer = 0;
    for (var i = 0; i < diceCount; i++) {
      diceValues.push(Math.floor(Math.random() * 6) + 1);
      diceStopped.push(false);
      diceResults.push(0);
    }
    message = 'スペース/エンターで止めろ！';
  }

  function update() {
    if (!active) return;

    if (shakeX > 0.5) {
      shakeX *= 0.85;
    } else {
      shakeX = 0;
    }

    if (diceFlashTimer > 0) diceFlashTimer--;

    if (messageTimer > 0) {
      messageTimer--;
      if (phase !== 'diceRoll') return;
    }

    switch (phase) {
      case 'menu':
        if (Game.Input.isPressed('up')) {
          menuIndex = (menuIndex - 1 + menuItems.length) % menuItems.length;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('down')) {
          menuIndex = (menuIndex + 1) % menuItems.length;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('confirm')) {
          executeAction(menuIndex);
        }
        break;

      case 'diceRoll':
        // Cycle dice values for unstopped dice
        diceTimer++;
        if (diceTimer >= diceSpeed) {
          diceTimer = 0;
          for (var i = 0; i < diceCount; i++) {
            if (!diceStopped[i]) {
              diceValues[i] = (diceValues[i] % 6) + 1;
            }
          }
        }

        // Stop current die on confirm
        if (Game.Input.isPressed('confirm') && currentDice < diceCount) {
          diceStopped[currentDice] = true;
          diceResults[currentDice] = diceValues[currentDice];
          diceFlashTimer = 8;
          Game.Audio.playSfx('confirm');
          currentDice++;

          // All dice stopped?
          if (currentDice >= diceCount) {
            // Calculate total damage
            var total = 0;
            for (var j = 0; j < diceResults.length; j++) {
              total += diceResults[j];
            }
            phase = 'diceResult';
            animTimer = 30;

            // Apply damage
            var playerData = Game.Player.getData();
            var dmg = Math.max(1, total + playerData.attack - enemy.defense);
            enemy.hp -= dmg;
            shakeX = 4 + diceCount;
            Game.Audio.playSfx('hit');

            if (diceCount > 1) {
              message = 'サイコロ合計 ' + total + '！ ' + dmg + 'ダメージ！';
            } else {
              message = 'サイコロ ' + total + '！ ' + dmg + 'ダメージ！';
            }

            if (enemy.hp <= 0) {
              enemy.hp = 0;
              phase = 'victory';
              message = dmg + 'ダメージ！ ' + enemy.name + 'を倒した！';
              messageTimer = 60;
            }
          } else {
            message = '次のサイコロ！ 止めろ！';
          }
        }
        break;

      case 'diceResult':
        animTimer--;
        if (animTimer <= 0) {
          if (enemy.hp <= 0) {
            phase = 'victory';
          } else {
            phase = 'playerAttack';
            animTimer = 5;
          }
        }
        break;

      case 'playerAttack':
        animTimer--;
        if (animTimer <= 0) {
          phase = 'enemyAttack';
          var playerData = Game.Player.getData();
          var dmg = Math.max(1, enemy.attack - playerData.defense + Math.floor(Math.random() * 5));
          playerData.hp -= dmg;
          message = enemy.name + 'の攻撃！ ' + dmg + 'ダメージ！';
          messageTimer = 45;
          Game.Audio.playSfx('damage');
          shakeX = 5;

          if (playerData.hp <= 0) {
            playerData.hp = 0;
            phase = 'defeat';
            message = '力尽きた...';
            messageTimer = 90;
            Game.Audio.stopBgm();
            Game.Audio.playSfx('gameover');
          }
        }
        break;

      case 'enemyAttack':
        phase = 'menu';
        break;

      case 'victory':
        active = false;
        Game.Audio.stopBgm();
        Game.Audio.playSfx('victory');
        return { result: 'victory', npc: npcRef };

      case 'defeat':
        active = false;
        Game.Audio.stopBgm();
        return { result: 'defeat' };

      case 'useItem':
        phase = 'enemyAttack';
        var playerData2 = Game.Player.getData();
        var dmg2 = Math.max(1, enemy.attack - playerData2.defense + Math.floor(Math.random() * 5));
        playerData2.hp -= dmg2;
        message = enemy.name + 'の攻撃！ ' + dmg2 + 'ダメージ！';
        messageTimer = 45;
        Game.Audio.playSfx('damage');
        if (playerData2.hp <= 0) {
          playerData2.hp = 0;
          phase = 'defeat';
          message = '力尽きた...';
          messageTimer = 90;
          Game.Audio.stopBgm();
          Game.Audio.playSfx('gameover');
        }
        break;

      case 'flee':
        active = false;
        Game.Audio.stopBgm();
        Game.Audio.playBgm('field');
        return { result: 'flee' };
    }
    return null;
  }

  function executeAction(index) {
    var playerData = Game.Player.getData();
    switch (index) {
      case 0: // Attack - start dice roll
        startDiceRoll();
        break;

      case 1: // Item
        var inv = playerData.inventory;
        var healItem = null;
        for (var i = 0; i < inv.length; i++) {
          var item = Game.Items.get(inv[i]);
          if (item && item.type === 'heal') {
            healItem = item;
            Game.Player.removeItem(inv[i]);
            break;
          }
        }
        if (healItem) {
          Game.Player.heal(healItem.healAmount);
          message = healItem.name + 'を使った！ HPが' + healItem.healAmount + '回復！';
          messageTimer = 45;
          Game.Audio.playSfx('item');
          phase = 'useItem';
        } else {
          message = '使えるアイテムがない！';
          messageTimer = 30;
        }
        break;

      case 2: // Flee
        if (Math.random() < 0.5) {
          message = '逃げ出した！';
          messageTimer = 30;
          phase = 'flee';
        } else {
          message = '逃げられなかった！';
          messageTimer = 30;
          phase = 'playerAttack';
          animTimer = 5;
        }
        break;
    }
  }

  // Draw a single die at position (x, y) with given value and size
  function drawDie(R, ctx, x, y, value, size, stopped, flash) {
    var s = size || 48;

    // Die background with slight 3D effect
    if (flash) {
      // Flash white when just stopped
      ctx.fillStyle = '#ffffcc';
    } else if (stopped) {
      ctx.fillStyle = '#f5f0e0';
    } else {
      ctx.fillStyle = '#ffffff';
    }

    // Shadow
    ctx.fillStyle === '#ffffff' || stopped;
    R.drawRectAbsolute(x + 2, y + 2, s, s, '#222233');

    // Die face
    var faceColor = flash ? '#ffffcc' : (stopped ? '#f5f0e0' : '#ffffff');
    R.drawRectAbsolute(x, y, s, s, faceColor);

    // Border
    ctx.strokeStyle = stopped ? '#886622' : '#444466';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, s, s);

    // Rounded corner effect (small dark pixels in corners)
    var cc = '#888888';
    R.drawRectAbsolute(x, y, 2, 2, cc);
    R.drawRectAbsolute(x + s - 2, y, 2, 2, cc);
    R.drawRectAbsolute(x, y + s - 2, 2, 2, cc);
    R.drawRectAbsolute(x + s - 2, y + s - 2, 2, 2, cc);

    // Draw dots
    var dots = diceDots[value];
    if (!dots) return;
    var dotSize = Math.floor(s / 7);
    var dotColor = stopped ? '#882200' : '#111111';

    for (var i = 0; i < dots.length; i++) {
      var dx = x + Math.floor(dots[i][0] * s / 7) + Math.floor(dotSize / 4);
      var dy = y + Math.floor(dots[i][1] * s / 7) + Math.floor(dotSize / 4);
      R.drawRectAbsolute(dx, dy, dotSize, dotSize, dotColor);
    }
  }

  function draw() {
    if (!active) return;

    var R = Game.Renderer;
    var C = Game.Config;
    var ctx = R.getContext();

    // Background
    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#111122');

    // Draw grid lines for atmosphere
    ctx.strokeStyle = '#222244';
    ctx.lineWidth = 1;
    for (var i = 0; i < C.CANVAS_WIDTH; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, C.CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (var i = 0; i < C.CANVAS_HEIGHT; i += 32) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(C.CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Enemy sprite (scaled up)
    if (enemy) {
      var ex = 200 + (shakeX > 0 ? (Math.random() - 0.5) * shakeX : 0);
      R.drawSpriteAbsolute(enemy.sprite || enemies.onsenMonkey.sprite,
        ex, 30, enemy.palette || enemies.onsenMonkey.palette, 5);

      // Enemy HP bar
      R.drawRectAbsolute(160, 120, 160, 12, '#333');
      var hpRatio = enemy.hp / enemy.maxHp;
      R.drawRectAbsolute(161, 121, 158 * hpRatio, 10,
        hpRatio > 0.3 ? C.COLORS.HP_GREEN : C.COLORS.HP_RED);
      R.drawTextJP(enemy.name + ' HP:' + enemy.hp + '/' + enemy.maxHp, 160, 135, '#fff', 12);
    }

    // Player stats
    var pd = Game.Player.getData();
    R.drawDialogBox(10, 200, 200, 60);
    R.drawTextJP('HP: ' + pd.hp + '/' + pd.maxHp, 25, 210, '#fff', 14);

    // HP bar
    R.drawRectAbsolute(25, 230, 170, 10, '#333');
    var playerHpRatio = pd.hp / pd.maxHp;
    R.drawRectAbsolute(26, 231, 168 * playerHpRatio, 8,
      playerHpRatio > 0.3 ? C.COLORS.HP_GREEN : C.COLORS.HP_RED);

    // Dice display during diceRoll or diceResult phase
    if (phase === 'diceRoll' || phase === 'diceResult') {
      // Dice area background
      R.drawDialogBox(220, 155, 250, 70);

      var dieSize = 40;
      if (diceCount > 3) dieSize = 34;
      if (diceCount > 4) dieSize = 30;

      var totalWidth = diceCount * dieSize + (diceCount - 1) * 6;
      var startX = 220 + Math.floor((250 - totalWidth) / 2);
      var dieY = 155 + Math.floor((70 - dieSize) / 2);

      for (var i = 0; i < diceCount; i++) {
        var dx = startX + i * (dieSize + 6);
        var isFlashing = (diceFlashTimer > 0 && i === currentDice - 1);
        drawDie(R, ctx, dx, dieY, diceValues[i], dieSize, diceStopped[i], isFlashing);

        // Highlight arrow under the active die
        if (!diceStopped[i] && i === currentDice && phase === 'diceRoll') {
          R.drawTextJP('▲', dx + Math.floor(dieSize / 2) - 5, dieY + dieSize + 2, C.COLORS.GOLD, 10);
        }
      }

      // Show total if all dice stopped and more than 1 die
      if (phase === 'diceResult' && diceCount > 1) {
        var total = 0;
        for (var j = 0; j < diceResults.length; j++) total += diceResults[j];
        R.drawTextJP('合計: ' + total, 220 + 100, 155 + 58, C.COLORS.GOLD, 12, 'center');
      }
    }

    // Menu
    if (phase === 'menu' && messageTimer <= 0) {
      R.drawDialogBox(300, 200, 160, 80);
      for (var i = 0; i < menuItems.length; i++) {
        var color = (i === menuIndex) ? C.COLORS.GOLD : '#fff';
        var prefix = (i === menuIndex) ? '▶ ' : '  ';
        R.drawTextJP(prefix + menuItems[i], 315, 212 + i * 22, color, 14);
      }
    }

    // Dice count indicator (show how many dice the player has)
    if (diceCount > 1) {
      R.drawTextJP('🎲×' + diceCount, 420, 200, C.COLORS.GOLD, 11);
    }

    // Message
    if (message) {
      R.drawDialogBox(10, 280, 460, 35);
      R.drawTextJP(message, 20, 288, '#fff', 14);
    }
  }

  function isActive() { return active; }

  // Public method to set dice count (for future upgrades)
  function setDiceCount(count) {
    diceCount = Math.max(1, Math.min(5, count));
  }

  function getDiceCount() {
    return diceCount;
  }

  return {
    start: start,
    update: update,
    draw: draw,
    isActive: isActive,
    setDiceCount: setDiceCount,
    getDiceCount: getDiceCount
  };
})();
