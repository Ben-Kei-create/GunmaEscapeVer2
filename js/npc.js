// NPC interaction system
Game.NPC = (function() {
  var currentNpc = null;
  var dialogIndex = 0;
  var dialogLines = [];
  var onDialogEnd = null;
  var npcMovement = {};
  var AUTO_DIALOG_KEY = '__gunmaNpcAutoDialogText';

  function getMovementState(npc) {
    if (!npc || !npc.id) return null;
    if (!npcMovement[npc.id]) {
      npcMovement[npc.id] = {
        timer: 0,
        waypoint: 0,
        baseX: npc.x,
        baseY: npc.y,
        moveX: 1,
        moveY: 0,
        facing: npc.facing || 'down',
        fromX: npc.x,
        fromY: npc.y,
        targetX: npc.x,
        targetY: npc.y,
        moveProgress: 1,
        moving: false,
        waitTimer: randInt(90, 150),
        chasing: false,
        touchCooldown: 0
      };
    }
    return npcMovement[npc.id];
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getPlayerData() {
    return Game.Player && Game.Player.getData ? Game.Player.getData() : null;
  }

  function faceNpcTowardPlayer(npc) {
    var state = getMovementState(npc);
    var pd = getPlayerData();
    if (!state || !pd) return;
    var dx = pd.tileX - npc.x;
    var dy = pd.tileY - npc.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      state.facing = dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      state.facing = dy > 0 ? 'down' : 'up';
    }
    npc.facing = state.facing;
  }

  function interact(npc) {
    if (!npc) return;
    faceNpcTowardPlayer(npc);
    currentNpc = npc;
    dialogIndex = 0;

    if (npc.defeated) {
      // Shop NPCs always reopen
      if (npc.afterDialog && npc.afterDialog.indexOf('shop_') === 0) {
        dialogLines = npc.dialog;
        onDialogEnd = npc.afterDialog;
        return dialogLines[0];
      }
      if (npc.defeatedDialog) {
        dialogLines = npc.defeatedDialog;
      } else {
        dialogLines = ['...'];
      }
      if (npc.id === 'cabbageGuardian' && Game.Player.hasAllKeys()) {
        dialogLines = ['結界は既に解かれておる。県境を越えよ！'];
      }
      onDialogEnd = null;
    } else if (npc.id === 'cabbageGuardian' && npc.allKeysDialog &&
               Game.Player.hasItem('onsenKey') && Game.Player.hasItem('darumaEye') &&
               Game.Player.hasItem('konnyakuPass')) {
      dialogLines = npc.allKeysDialog;
      onDialogEnd = npc.afterDialog;
    } else if (npc.id === 'cabbageGuardian') {
      dialogLines = npc.dialog;
      onDialogEnd = null;
    } else {
      dialogLines = npc.dialog;
      onDialogEnd = npc.afterDialog || null;
    }

    return dialogLines[0];
  }

  function advance() {
    dialogIndex++;
    window[AUTO_DIALOG_KEY] = null;
    if (dialogIndex >= dialogLines.length) {
      var action = onDialogEnd;
      var npc = currentNpc;
      currentNpc = null;
      dialogIndex = 0;
      dialogLines = [];
      onDialogEnd = null;
      return { done: true, action: action, npc: npc };
    }
    return { done: false, text: dialogLines[dialogIndex] };
  }

  function showDefeatedDialog(npc) {
    if (!npc || !npc.defeatedDialog) return;
    currentNpc = npc;
    dialogIndex = 0;
    dialogLines = npc.defeatedDialog;
    onDialogEnd = npc.afterDefeat || null;
    npc.defeated = true;
    if (npc.giveItem) {
      Game.Player.addItem(npc.giveItem);
    }
  }

  function getCurrentDialog() {
    if (dialogIndex < dialogLines.length) {
      return dialogLines[dialogIndex];
    }
    return null;
  }

  function getCurrentNpc() {
    return currentNpc;
  }

  function canOccupyTile(npc, npcs, x, y) {
    if (!Game.Map || !Game.Map.isPassable || !Game.Map.isPassable(x, y)) {
      return false;
    }

    for (var i = 0; i < npcs.length; i++) {
      var other = npcs[i];
      if (!other || other === npc) continue;
      var otherState = getMovementState(other);
      if (other.x === x && other.y === y) return false;
      if (otherState && otherState.moving && otherState.targetX === x && otherState.targetY === y) {
        return false;
      }
    }
    return true;
  }

  function startMove(npc, state, targetX, targetY) {
    state.fromX = npc.x;
    state.fromY = npc.y;
    state.targetX = targetX;
    state.targetY = targetY;
    state.moveProgress = 0;
    state.moving = true;

    if (targetX > npc.x) state.facing = 'right';
    else if (targetX < npc.x) state.facing = 'left';
    else if (targetY > npc.y) state.facing = 'down';
    else if (targetY < npc.y) state.facing = 'up';
    npc.facing = state.facing;
  }

  function finishMove(npc, state) {
    npc.x = state.targetX;
    npc.y = state.targetY;
    state.fromX = npc.x;
    state.fromY = npc.y;
    state.moveProgress = 1;
    state.moving = false;
  }

  function updateMovingNpc(npc, state) {
    if (!state.moving) return false;
    state.moveProgress += 1 / 30;
    if (state.moveProgress >= 1) {
      finishMove(npc, state);
    }
    return true;
  }

  function updatePace(npc, state, npcs) {
    state.timer++;
    if (state.timer % 120 === 0) {
      state.moveX *= -1;
    }
    if (state.timer % 30 !== 0) return;

    var nextX = npc.x + state.moveX;
    var minX = state.baseX - 2;
    var maxX = state.baseX + 2;
    if (nextX < minX || nextX > maxX || !canOccupyTile(npc, npcs, nextX, npc.y)) {
      state.moveX *= -1;
      nextX = npc.x + state.moveX;
    }
    if (nextX >= minX && nextX <= maxX && canOccupyTile(npc, npcs, nextX, npc.y)) {
      startMove(npc, state, nextX, npc.y);
    }
  }

  function updatePatrol(npc, state, npcs) {
    if (!npc.waypoints || !npc.waypoints.length) return;
    state.timer++;
    if (state.timer % 30 !== 0) return;

    var point = npc.waypoints[state.waypoint] || npc.waypoints[0];
    if (!point) return;
    if (npc.x === point.x && npc.y === point.y) {
      state.waypoint = (state.waypoint + 1) % npc.waypoints.length;
      point = npc.waypoints[state.waypoint];
    }
    if (!point) return;

    var dx = point.x === npc.x ? 0 : (point.x > npc.x ? 1 : -1);
    var dy = dx === 0 && point.y !== npc.y ? (point.y > npc.y ? 1 : -1) : 0;
    var targetX = npc.x + dx;
    var targetY = npc.y + dy;
    if ((dx !== 0 || dy !== 0) && canOccupyTile(npc, npcs, targetX, targetY)) {
      startMove(npc, state, targetX, targetY);
    } else if (npc.x === point.x && npc.y === point.y) {
      state.waypoint = (state.waypoint + 1) % npc.waypoints.length;
    }
  }

  function updateWander(npc, state, npcs) {
    state.waitTimer--;
    if (state.waitTimer > 0) return;
    state.waitTimer = randInt(90, 150);

    var options = [
      { x: npc.x + 1, y: npc.y },
      { x: npc.x - 1, y: npc.y },
      { x: npc.x, y: npc.y + 1 },
      { x: npc.x, y: npc.y - 1 }
    ];

    for (var i = options.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = options[i];
      options[i] = options[j];
      options[j] = tmp;
    }

    for (var k = 0; k < options.length; k++) {
      var option = options[k];
      if (Math.abs(option.x - state.baseX) > 3 || Math.abs(option.y - state.baseY) > 3) continue;
      if (canOccupyTile(npc, npcs, option.x, option.y)) {
        startMove(npc, state, option.x, option.y);
        break;
      }
    }
  }

  function tryAutoDialog(npc, state) {
    if (state.touchCooldown > 0 || currentNpc || !Game.Main || !Game.Main.setState || !Game.UI) {
      return false;
    }
    var text = interact(npc);
    if (!text) return false;
    window[AUTO_DIALOG_KEY] = text;
    state.touchCooldown = 60;
    Game.Main.setState(Game.Config.STATE.DIALOG);
    if (Game.Audio && Game.Audio.playSfx) {
      Game.Audio.playSfx('confirm');
    }
    return true;
  }

  function updateChase(npc, state, npcs) {
    var pd = getPlayerData();
    if (!pd) return;

    var distance = Math.abs(pd.tileX - npc.x) + Math.abs(pd.tileY - npc.y);
    if (!state.chasing && distance <= 5) {
      state.chasing = true;
    } else if (state.chasing && distance > 7) {
      state.chasing = false;
    }

    if (distance === 0) {
      tryAutoDialog(npc, state);
      return;
    }

    if (!state.chasing) return;

    state.timer++;
    if (state.timer % 45 !== 0) return;

    var dx = pd.tileX > npc.x ? 1 : (pd.tileX < npc.x ? -1 : 0);
    var dy = pd.tileY > npc.y ? 1 : (pd.tileY < npc.y ? -1 : 0);
    var targetX = npc.x;
    var targetY = npc.y;

    if (Math.abs(pd.tileX - npc.x) >= Math.abs(pd.tileY - npc.y) && dx !== 0) {
      targetX += dx;
      state.facing = dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      targetY += dy;
      state.facing = dy > 0 ? 'down' : 'up';
    }

    npc.facing = state.facing;
    if ((targetX !== npc.x || targetY !== npc.y) && canOccupyTile(npc, npcs, targetX, targetY)) {
      startMove(npc, state, targetX, targetY);
    }
  }

  function initMovement(npcs) {
    npcMovement = {};
    if (!npcs) return;
    for (var i = 0; i < npcs.length; i++) {
      var npc = npcs[i];
      if (!npc) continue;
      var state = getMovementState(npc);
      state.baseX = npc.x;
      state.baseY = npc.y;
      state.fromX = npc.x;
      state.fromY = npc.y;
      state.targetX = npc.x;
      state.targetY = npc.y;
      state.moveProgress = 1;
      state.moving = false;
      state.timer = 0;
      state.waypoint = 0;
      state.waitTimer = randInt(90, 150);
      state.facing = npc.facing || 'down';
      state.touchCooldown = 0;
      state.chasing = false;
      npc.facing = state.facing;
      if (!npc.movement) npc.movement = 'static';
    }
  }

  function updateMovement(npcs) {
    if (!npcs || !npcs.length) return false;
    var changed = false;

    for (var i = 0; i < npcs.length; i++) {
      var npc = npcs[i];
      if (!npc || npc.defeated) continue;
      var state = getMovementState(npc);
      if (state.touchCooldown > 0) state.touchCooldown--;

      if (updateMovingNpc(npc, state)) {
        changed = true;
        continue;
      }

      switch (npc.movement || 'static') {
        case 'pace':
          updatePace(npc, state, npcs);
          break;
        case 'patrol':
          updatePatrol(npc, state, npcs);
          break;
        case 'wander':
          updateWander(npc, state, npcs);
          break;
        case 'chase':
          updateChase(npc, state, npcs);
          break;
      }
      if (state.moving) changed = true;
    }

    return changed;
  }

  function getNpcRenderPos(npc) {
    var state = getMovementState(npc);
    var ts = Game.Config.TILE_SIZE;
    if (!state || !state.moving) {
      return { x: npc.x * ts, y: npc.y * ts };
    }
    var renderX = (state.fromX + (state.targetX - state.fromX) * state.moveProgress) * ts;
    var renderY = (state.fromY + (state.targetY - state.fromY) * state.moveProgress) * ts;
    return { x: renderX, y: renderY };
  }

  function hookRuntimeIntegrations() {
    if (Game.Map && !Game.Map.__npcMovementPatched) {
      Game.Map.__npcMovementPatched = true;
      var originalLoad = Game.Map.load;
      var originalGetCurrentMap = Game.Map.getCurrentMap;
      var originalDraw = Game.Map.draw;

      Game.Map.load = function(mapId, spawnX, spawnY) {
        originalLoad(mapId, spawnX, spawnY);
        var map = originalGetCurrentMap();
        if (map && map.npcs) {
          initMovement(map.npcs);
        }
      };

      Game.Map.draw = function() {
        var map = originalGetCurrentMap();
        if (!map) return originalDraw();

        for (var y = 0; y < Game.Config.MAP_ROWS; y++) {
          for (var x = 0; x < Game.Config.MAP_COLS; x++) {
            Game.Renderer.drawTile(map.tiles[y][x], x, y);
          }
        }

        if (map.items) {
          for (var i = 0; i < map.items.length; i++) {
            var item = map.items[i];
            if (!item.taken) {
              var ts = Game.Config.TILE_SIZE;
              var px = item.x * ts;
              var py = item.y * ts;
              var t = Date.now() / 300;
              var brightness = Math.sin(t) * 0.3 + 0.7;
              var r = Math.floor(255 * brightness);
              var g = Math.floor(200 * brightness);
              Game.Renderer.drawRect(px + 4, py + 4, 8, 8, 'rgb(' + r + ',' + g + ',0)');
              Game.Renderer.drawRect(px + 6, py + 6, 4, 4, '#fff');
            }
          }
        }

        if (map.npcs) {
          for (var n = 0; n < map.npcs.length; n++) {
            var npc = map.npcs[n];
            var renderPos = getNpcRenderPos(npc);
            var state = getMovementState(npc);
            var flipped = state && state.facing === 'right';
            Game.Renderer.drawSprite(npc.sprite, renderPos.x, renderPos.y, npc.palette, flipped);
          }
        }
      };
    }

    if (Game.Player && !Game.Player.__npcMovementPatched) {
      Game.Player.__npcMovementPatched = true;
      var originalPlayerUpdate = Game.Player.update;
      Game.Player.update = function() {
        originalPlayerUpdate();
        var map = Game.Map && Game.Map.getCurrentMap ? Game.Map.getCurrentMap() : null;
        if (map && map.npcs) {
          updateMovement(map.npcs);
        }
      };
    }

    if (Game.UI && !Game.UI.__npcAutoDialogPatched) {
      Game.UI.__npcAutoDialogPatched = true;
      var originalDrawDialog = Game.UI.drawDialog;
      Game.UI.drawDialog = function(text) {
        originalDrawDialog(window[AUTO_DIALOG_KEY] || text);
      };
    }
  }

  window.addEventListener('load', hookRuntimeIntegrations);

  return {
    interact: interact,
    advance: advance,
    showDefeatedDialog: showDefeatedDialog,
    getCurrentDialog: getCurrentDialog,
    getCurrentNpc: getCurrentNpc,
    updateMovement: updateMovement,
    getNpcRenderPos: getNpcRenderPos,
    initMovement: initMovement
  };
})();
