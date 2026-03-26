Game.Maps = Game.Maps || {};
Game.Maps.gunma_world = (function() {
  var size = 50;
  var tiles = [];
  for(var y=0; y<size; y++) {
      var row = [];
      for(var x=0; x<size; x++) {
          var t = 0; // grass
          if(x === 0 || x === size-1 || y === 0 || y === size-1) t = 3; // wall/mountain border
          // some trees
          else if(Math.random() < 0.15) t = 4;
          // some rivers
          else if((x > 10 && x < 13 && y > 20 && y < 40) || (x > 35 && x < 38 && y > 10 && y < 30)) t = 2; 
          row.push(t);
      }
      tiles.push(row);
  }
  
  var townLocs = [
      { id: 'maebashi', x: 25, y: 25 },
      { id: 'takasaki', x: 20, y: 28 },
      { id: 'tomioka', x: 15, y: 30 },
      { id: 'shimonita', x: 10, y: 32 },
      { id: 'ikaho', x: 22, y: 18 },
      { id: 'kusatsu', x: 10, y: 10 },
      { id: 'tsumagoi', x: 5, y: 20 },
      { id: 'haruna', x: 18, y: 15 },
      { id: 'minakami', x: 25, y: 5 },
      { id: 'gakuen', x: 30, y: 25 }
  ];
  
  var npcs = [];
  var exits = [];
  
  for(var i=0; i<townLocs.length; i++) {
      var loc = townLocs[i];
      // Make space around town
      for(var dy=-1; dy<=1; dy++) {
          for(var dx=-1; dx<=1; dx++) {
             tiles[loc.y + dy][loc.x + dx] = 1; // road around
          }
      }
      // Set town icon
      tiles[loc.y][loc.x] = 8; // Door tile for town
      
      // Add exit
      exits.push({
          x: loc.x, y: loc.y,
          target: loc.id,
          spawnX: 15, spawnY: 10, // approximate center
          dir: 'down'
      });
  }

  return {
    name: '群馬の地',
    mapType: 'world',
    tiles: tiles,
    npcs: npcs,
    items: [],
    exits: exits
  };
})();
