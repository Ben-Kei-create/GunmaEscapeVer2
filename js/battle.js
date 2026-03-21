// Battle system
Game.Battle = (function() {
  var active = false;
  var enemy = null;
  var npcRef = null;
  var menuIndex = 0;
  var phase = 'menu'; // menu, playerAttack, enemyAttack, victory, defeat
  var message = '';
  var messageTimer = 0;
  var animTimer = 0;
  var shakeX = 0;

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
    Game.Audio.stopBgm();
    Game.Audio.playBgm('battle');
  }

  function update() {
    if (!active) return;

    if (messageTimer > 0) {
      messageTimer--;
      return;
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
        shakeX *= 0.8;
        if (Math.abs(shakeX) < 0.5) shakeX = 0;
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
      case 0: // Attack
        var dmg = Math.max(1, playerData.attack - enemy.defense + Math.floor(Math.random() * 6));
        enemy.hp -= dmg;
        message = 'プレイヤーの攻撃！ ' + dmg + 'ダメージ！';
        messageTimer = 45;
        Game.Audio.playSfx('hit');
        shakeX = 3;

        if (enemy.hp <= 0) {
          enemy.hp = 0;
          phase = 'victory';
          message = enemy.name + 'を倒した！';
          messageTimer = 60;
        } else {
          phase = 'playerAttack';
          animTimer = 5;
        }
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

  function draw() {
    if (!active) return;

    var R = Game.Renderer;
    var C = Game.Config;

    // Background
    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#111122');

    // Draw grid lines for atmosphere
    var ctx = R.getContext();
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

    // Menu
    if (phase === 'menu' && messageTimer <= 0) {
      R.drawDialogBox(300, 200, 160, 80);
      for (var i = 0; i < menuItems.length; i++) {
        var color = (i === menuIndex) ? C.COLORS.GOLD : '#fff';
        var prefix = (i === menuIndex) ? '▶ ' : '  ';
        R.drawTextJP(prefix + menuItems[i], 315, 212 + i * 22, color, 14);
      }
    }

    // Message
    if (message) {
      R.drawDialogBox(10, 280, 460, 35);
      R.drawTextJP(message, 20, 288, '#fff', 14);
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
