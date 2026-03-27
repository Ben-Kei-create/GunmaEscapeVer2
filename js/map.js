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
    if (Game.NPC && Game.NPC.initMovement && currentMap && currentMap.npcs) {
      Game.NPC.initMovement(currentMap.npcs);
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
        if (currentMap.npcs[i].x === x && currentMap.npcs[i].y === y) return false;
      }
    }

    return true;
  }

  function checkExit(x, y) {
    if (!currentMap || !currentMap.exits) return null;
    for (var i = 0; i < currentMap.exits.length; i++) {
      var exit = currentMap.exits[i];
      if (exit.x === x && exit.y === y) return exit;
    }
    return null;
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
    if (Game.Renderer.drawParallaxBackground) {
      Game.Renderer.drawParallaxBackground(currentMap);
    }
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
        var ts = Game.Config.TILE_SIZE;
        var renderPos = Game.NPC && Game.NPC.getNpcRenderPos
          ? Game.NPC.getNpcRenderPos(npc)
          : { x: npc.x * ts, y: npc.y * ts };
        var flipped = npc.facing === 'right';
        Game.Renderer.drawSprite(npc.sprite, renderPos.x, renderPos.y, npc.palette, flipped);
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
    checkItem: checkItem,
    getNpcAt: getNpcAt,
    draw: draw
  };
})();
