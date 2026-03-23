// Player entity
Game.Player = (function() {
  var data = {
    tileX: 14,
    tileY: 10,
    x: 0,
    y: 0,
    direction: 'down',
    hp: 100,
    maxHp: 100,
    attack: 12,
    defense: 5,
    gold: 100,
    diceSlots: 1,                // max dice slots (1-5)
    equippedDice: ['normalDice'], // array of dice item IDs
    armor: null,    // equipped armor item ID
    inventory: [],
    moving: false,
    moveTimer: 0,
    moveSpeed: 8, // frames to move one tile
    moveFrame: 0,
    walkSfxTimer: 0
  };

  var sprites = {
    down: [
      [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,3,2,3,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,0,1,4,4,1,0,0,0,0,0,0,0,0,0],
      [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,5,5,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,6,0,0,6,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    up: [
      [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,0,1,4,4,1,0,0,0,0,0,0,0,0,0],
      [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,5,5,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,6,0,0,6,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    left: [
      [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,3,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
      [0,0,0,1,4,4,1,0,0,0,0,0,0,0,0,0],
      [0,1,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [1,7,1,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [1,7,1,4,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,1,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,5,5,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
      [0,0,1,6,0,0,6,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
  };
  sprites.right = sprites.left; // flip when drawing

  var palette = {
    1: '#222222',  // outline
    2: '#ffcc88',  // skin
    3: '#332211',  // eyes
    4: '#4466cc',  // shirt
    5: '#554433',  // pants
    6: '#664422',  // shoes
    7: '#cc8844'   // backpack
  };

  function init(startX, startY) {
    data.tileX = startX || 14;
    data.tileY = startY || 10;
    data.x = data.tileX * Game.Config.TILE_SIZE;
    data.y = data.tileY * Game.Config.TILE_SIZE;
    data.moving = false;
  }

  function update() {
    if (data.moving) {
      data.moveFrame++;
      var ts = Game.Config.TILE_SIZE;
      var progress = data.moveFrame / data.moveSpeed;

      if (progress >= 1) {
        data.x = data.tileX * ts;
        data.y = data.tileY * ts;
        data.moving = false;
        data.moveFrame = 0;
      } else {
        var targetX = data.tileX * ts;
        var targetY = data.tileY * ts;
        var startX = data.x;
        var startY = data.y;

        switch (data.direction) {
          case 'up':    startY = (data.tileY + 1) * ts; break;
          case 'down':  startY = (data.tileY - 1) * ts; break;
          case 'left':  startX = (data.tileX + 1) * ts; break;
          case 'right': startX = (data.tileX - 1) * ts; break;
        }
        data.x = startX + (targetX - startX) * progress;
        data.y = startY + (targetY - startY) * progress;
      }
      return;
    }

    // Check movement input
    var dx = 0, dy = 0;
    if (Game.Input.isDown('up'))    { dy = -1; data.direction = 'up'; }
    else if (Game.Input.isDown('down'))  { dy = 1;  data.direction = 'down'; }
    else if (Game.Input.isDown('left'))  { dx = -1; data.direction = 'left'; }
    else if (Game.Input.isDown('right')) { dx = 1;  data.direction = 'right'; }

    if (dx !== 0 || dy !== 0) {
      var newX = data.tileX + dx;
      var newY = data.tileY + dy;

      if (Game.Map.isPassable(newX, newY)) {
        data.tileX = newX;
        data.tileY = newY;
        data.moving = true;
        data.moveFrame = 0;

        data.walkSfxTimer++;
        if (data.walkSfxTimer >= 3) {
          Game.Audio.playSfx('walk');
          data.walkSfxTimer = 0;
        }
      }
    }
  }

  function draw() {
    var sprite = sprites[data.direction] || sprites.down;
    var flipped = (data.direction === 'right');
    Game.Renderer.drawSprite(sprite, data.x, data.y, palette, flipped);
  }

  function getFacingTile() {
    var dx = 0, dy = 0;
    switch (data.direction) {
      case 'up':    dy = -1; break;
      case 'down':  dy = 1;  break;
      case 'left':  dx = -1; break;
      case 'right': dx = 1;  break;
    }
    return { x: data.tileX + dx, y: data.tileY + dy };
  }

  function hasItem(id) {
    return data.inventory.indexOf(id) >= 0;
  }

  function addItem(id) {
    if (!hasItem(id)) {
      data.inventory.push(id);
    }
  }

  function removeItem(id) {
    var idx = data.inventory.indexOf(id);
    if (idx >= 0) data.inventory.splice(idx, 1);
  }

  function heal(amount) {
    data.hp = Math.min(data.hp + amount, data.maxHp);
  }

  function hasAllKeys() {
    return hasItem('onsenKey') && hasItem('darumaEye') &&
           hasItem('konnyakuPass') && hasItem('cabbageCrest');
  }

  function getAttack() {
    return data.attack;
  }

  function getDefense() {
    var base = data.defense;
    if (data.armor) {
      var a = Game.Items.get(data.armor);
      if (a && a.defenseBonus) base += a.defenseBonus;
    }
    return base;
  }

  function equipDice(diceId, slot) {
    var item = Game.Items.get(diceId);
    if (!item || item.type !== 'dice') return false;
    if (slot < 0 || slot >= data.diceSlots) return false;
    // Put old die back to inventory (if not normalDice)
    if (data.equippedDice[slot] && data.equippedDice[slot] !== 'normalDice') {
      addItem(data.equippedDice[slot]);
    }
    data.equippedDice[slot] = diceId;
    removeItem(diceId);
    return true;
  }

  function addDiceSlot() {
    if (data.diceSlots >= 5) return false;
    data.diceSlots++;
    data.equippedDice.push('normalDice');
    return true;
  }

  function getEquippedDice() {
    return data.equippedDice.slice(0, data.diceSlots);
  }

  function equipArmor(itemId) {
    var item = Game.Items.get(itemId);
    if (!item || item.type !== 'armor') return false;
    if (data.armor) addItem(data.armor);
    data.armor = itemId;
    removeItem(itemId);
    return true;
  }

  function addGold(amount) {
    data.gold = Math.max(0, data.gold + amount);
  }

  function getData() { return data; }

  return {
    init: init,
    update: update,
    draw: draw,
    getFacingTile: getFacingTile,
    hasItem: hasItem,
    addItem: addItem,
    removeItem: removeItem,
    heal: heal,
    hasAllKeys: hasAllKeys,
    getAttack: getAttack,
    getDefense: getDefense,
    equipDice: equipDice,
    addDiceSlot: addDiceSlot,
    getEquippedDice: getEquippedDice,
    equipArmor: equipArmor,
    addGold: addGold,
    getData: getData
  };
})();
