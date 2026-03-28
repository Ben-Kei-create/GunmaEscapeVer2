// Map system
Game.Map = (function() {
  var currentMap = null;
  var currentMapId = '';

  function load(mapId, spawnX, spawnY) {
    currentMapId = mapId;
    currentMap = Game.Maps[mapId];
    if (!currentMap) return;
    Game.Player.init(spawnX, spawnY);
    if (Game.Weather) {
      Game.Weather.setMapWeather(currentMap.name || currentMapId);
    }
    if (Game.Encounters && Game.Encounters.onMapLoaded) {
      Game.Encounters.onMapLoaded(currentMapId);
    }
    if (Game.UI && Game.UI.showAreaBanner) {
      Game.UI.showAreaBanner(currentMapId);
    }
    if (Game.Audio && Game.Audio.refreshFieldBgm) {
      Game.Audio.refreshFieldBgm();
    }
    if (Game.Main && Game.Main.handleMapLoaded) {
      Game.Main.handleMapLoaded(currentMapId);
    }
  }

  function getCurrentMap() {
    return currentMap;
  }

  function getCurrentMapId() {
    return currentMapId;
  }

  function getTile(x, y) {
    if (!currentMap) return -1;
    if (x < 0 || x >= Game.Config.MAP_COLS || y < 0 || y >= Game.Config.MAP_ROWS) return -1;
    return currentMap.tiles[y][x];
  }

  function isPassable(x, y) {
    var tile = getTile(x, y);
    if (tile === -1) return false;

    // Check border - only passable with all keys
    if (tile === Game.Config.TILE.BORDER) {
      return Game.Player.hasAllKeys();
    }

    // Check if tile type is passable
    if (Game.Config.PASSABLE.indexOf(tile) === -1) return false;

    // Check NPC collision
    if (currentMap.npcs) {
      for (var i = 0; i < currentMap.npcs.length; i++) {
        var npc = currentMap.npcs[i];
        if (npc.hideWhenDefeated && npc.defeated) continue;
        if (npc.x === x && npc.y === y) return false;
      }
    }

    return true;
  }

  function getExitAt(x, y) {
    if (!currentMap || !currentMap.exits) return null;
    for (var i = 0; i < currentMap.exits.length; i++) {
      var exit = currentMap.exits[i];
      if (exit.x === x && exit.y === y) return exit;
    }
    return null;
  }

  function isExitUnlocked(exit) {
    if (!exit) return false;
    if (typeof exit.minChapter === 'number' && Game.Player && Game.Player.getData) {
      if ((Game.Player.getData().chapter || 1) < exit.minChapter) return false;
    }
    if (exit.requiresFlag && (!Game.Story || !Game.Story.hasFlag || !Game.Story.hasFlag(exit.requiresFlag))) {
      return false;
    }
    if (exit.requiresNotFlag && Game.Story && Game.Story.hasFlag && Game.Story.hasFlag(exit.requiresNotFlag)) {
      return false;
    }
    if (exit.requiresItem && Game.Player && Game.Player.hasItem && !Game.Player.hasItem(exit.requiresItem)) {
      return false;
    }
    return true;
  }

  function buildBlockedExitMessage(exit) {
    if (exit && exit.blockedMessage) return exit.blockedMessage;
    return 'この先は、まだ町の気配がつながっていない。';
  }

  function getBlockedExitAt(x, y) {
    var exit = getExitAt(x, y);
    if (!exit || isExitUnlocked(exit)) return null;
    return {
      x: x,
      y: y,
      exit: exit,
      message: buildBlockedExitMessage(exit)
    };
  }

  function getDirectionFromDelta(dx, dy) {
    if (dx < 0) return 'left';
    if (dx > 0) return 'right';
    if (dy < 0) return 'up';
    if (dy > 0) return 'down';
    return '';
  }

  function getDefaultBlockedPassageMessage(direction) {
    var dirLabel = {
      up: '北',
      down: '南',
      left: '西',
      right: '東'
    };
    return (dirLabel[direction] || '先') + 'へ続く道は、まだ旅の筋が結ばれていない。';
  }

  function getBlockedPassage(currentX, currentY, dx, dy) {
    if (!currentMap) return null;
    var targetX = currentX + dx;
    var targetY = currentY + dy;
    var direction = getDirectionFromDelta(dx, dy);
    var blockedExit = getBlockedExitAt(targetX, targetY);
    if (blockedExit) return blockedExit;

    if (currentMap.blockedPassages) {
      for (var i = 0; i < currentMap.blockedPassages.length; i++) {
        var passage = currentMap.blockedPassages[i];
        if (passage.x !== currentX || passage.y !== currentY) continue;
        if (passage.dir && passage.dir !== direction) continue;
        return {
          x: currentX,
          y: currentY,
          direction: direction,
          message: passage.message || getDefaultBlockedPassageMessage(direction)
        };
      }
    }

    if (targetX >= 0 && targetX < Game.Config.MAP_COLS &&
        targetY >= 0 && targetY < Game.Config.MAP_ROWS) {
      return null;
    }

    var currentTile = getTile(currentX, currentY);
    if (currentTile !== Game.Config.TILE.ROAD &&
        currentTile !== Game.Config.TILE.FLOOR &&
        currentTile !== Game.Config.TILE.DOOR) {
      return null;
    }
    if (getExitAt(currentX, currentY)) return null;

    return {
      x: currentX,
      y: currentY,
      direction: direction,
      message: getDefaultBlockedPassageMessage(direction)
    };
  }

  function checkExit(x, y) {
    var exit = getExitAt(x, y);
    if (!exit || !isExitUnlocked(exit)) return null;
    return exit;
  }

  function checkItem(x, y) {
    if (!currentMap || !currentMap.items) return null;
    for (var i = 0; i < currentMap.items.length; i++) {
      var item = currentMap.items[i];
      if (!item.taken && item.x === x && item.y === y) return item;
    }
    return null;
  }

  function getNpcAt(x, y) {
    if (!currentMap || !currentMap.npcs) return null;
    for (var i = 0; i < currentMap.npcs.length; i++) {
      if (currentMap.npcs[i].x === x && currentMap.npcs[i].y === y) {
        return currentMap.npcs[i];
      }
    }
    return null;
  }

  function draw() {
    if (!currentMap) return;
    for (var y = 0; y < Game.Config.MAP_ROWS; y++) {
      for (var x = 0; x < Game.Config.MAP_COLS; x++) {
        Game.Renderer.drawTile(currentMap.tiles[y][x], x, y);
      }
    }

    // Draw items
    if (currentMap.items) {
      for (var i = 0; i < currentMap.items.length; i++) {
        var item = currentMap.items[i];
        if (!item.taken) {
          drawItemOnMap(item);
        }
      }
    }

    // Draw NPCs
    if (currentMap.npcs) {
      for (var i = 0; i < currentMap.npcs.length; i++) {
        var npc = currentMap.npcs[i];
        if (npc.hideWhenDefeated && npc.defeated) continue;
        var ts = Game.Config.TILE_SIZE;
        Game.Renderer.drawSprite(npc.sprite, npc.x * ts, npc.y * ts, npc.palette);
      }
    }
  }

  function drawItemOnMap(item) {
    var ts = Game.Config.TILE_SIZE;
    var px = item.x * ts;
    var py = item.y * ts;
    // Sparkle effect
    var t = Date.now() / 300;
    var brightness = Math.sin(t) * 0.3 + 0.7;
    var r = Math.floor(255 * brightness);
    var g = Math.floor(200 * brightness);
    Game.Renderer.drawRect(px + 4, py + 4, 8, 8, 'rgb(' + r + ',' + g + ',0)');
    Game.Renderer.drawRect(px + 6, py + 6, 4, 4, '#fff');
  }

  return {
    load: load,
    getCurrentMap: getCurrentMap,
    getCurrentMapId: getCurrentMapId,
    getTile: getTile,
    isPassable: isPassable,
    checkExit: checkExit,
    getBlockedExitAt: getBlockedExitAt,
    getBlockedPassage: getBlockedPassage,
    checkItem: checkItem,
    getNpcAt: getNpcAt,
    draw: draw
  };
})();
