// Map: 水上 (第9章: 雪と川の谷)
Game.Maps = Game.Maps || {};
Game.Maps['minakami'] = (function() {

  // 30x20 river valley map
  // 0=snow/ground(grass), 1=bridge/road, 2=river(water), 3=cliff(wall), 4=tree
  var G=0, R=1, W=2, K=3, T=4;
  var tiles = [
    [K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,G,G,T,T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,T,G,G,G,G,K],
    [K,G,G,T,T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,T,G,G,G,G,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,W,W,W,W,W,W,W,W,W,W,W,W,R,R,R,R,W,W,W,W,W,W,W,W,W,W,W,W,K],
    [K,W,W,W,W,W,W,W,W,W,W,W,W,R,R,R,R,W,W,W,W,W,W,W,W,W,W,W,W,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,G,G,T,T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,T,G,G,G,G,K],
    [K,G,G,T,T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,T,G,G,G,G,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,G,G,G,G,G,G,G,G,G,G,G,G,G,R,R,G,G,G,G,G,G,G,G,G,G,G,G,G,K],
    [K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K]
  ];

  var guideSprite = [
    [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
    [0,0,1,3,2,3,2,1,0,0,0,0,0,0,0,0],
    [0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0],
    [0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0],
    [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
    [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
    [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
    [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
    [0,0,1,5,5,5,5,1,0,0,0,0,0,0,0,0],
    [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
    [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];
  var guidePalette = { 1:'#333333', 2:'#ddccaa', 3:'#222222', 4:'#446688', 5:'#332211' };

  // Juke Minakami sprite - imposing figure with dark coat
  var jukeSprite = [
    [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,1,2,2,2,2,2,1,0,0,0,0,0,0],
    [0,0,0,1,2,2,2,2,2,1,0,0,0,0,0,0],
    [0,0,0,1,3,2,2,3,2,1,0,0,0,0,0,0],
    [0,0,0,1,2,2,4,2,2,1,0,0,0,0,0,0],
    [0,0,0,0,1,2,2,2,1,0,0,0,0,0,0,0],
    [0,0,1,5,5,5,5,5,5,5,1,0,0,0,0,0],
    [0,1,5,5,5,6,5,6,5,5,5,1,0,0,0,0],
    [0,1,5,5,5,5,5,5,5,5,5,1,0,0,0,0],
    [0,1,5,5,5,5,5,5,5,5,5,1,0,0,0,0],
    [0,0,1,5,5,5,5,5,5,5,1,0,0,0,0,0],
    [0,0,0,1,7,7,7,7,7,1,0,0,0,0,0,0],
    [0,0,0,1,7,0,0,0,7,1,0,0,0,0,0,0],
    [0,0,0,1,7,0,0,0,7,1,0,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];
  var jukePalette = { 1:'#111111', 2:'#334455', 3:'#cc3333', 4:'#ffaa00', 5:'#1a1a2e', 6:'#cc4444', 7:'#111122' };

  var npcs = [
    {
      id: 'minakamiGuide',
      x: 4, y: 5,
      name: '水上の案内人',
      dialog: [
        '水上谷は冬が早い。この時期に来るとは無謀だな。',
        '川を渡る橋は一本だけ。奥に何かがいる。',
        '古谷という男...岩陰に隠れていたぞ。'
      ],
      defeatedDialog: [
        'ジュークを倒したか。谷に静けさが戻った。',
        '古谷と合流できたか？先を急げ。'
      ],
      afterDialog: null,
      defeated: false,
      movement: 'static',
      sprite: guideSprite,
      palette: guidePalette
    },
    {
      id: 'furuyaShadow',
      x: 25, y: 5,
      name: '岩陰の人影',
      dialog: [
        '...来るなと言ったはずだ。',
        '俺が一人で路線を断てば...お前たちは帰れる。',
        '俺みたいな奴が消えても、誰も困らない。'
      ],
      defeatedDialog: [
        '...助かった。迷惑かけた。',
        'ジュークが奥にいる。一緒に行こう。'
      ],
      afterDialog: null,
      defeated: false,
      sprite: guideSprite,
      palette: { 1:'#222222', 2:'#bbaa99', 3:'#111111', 4:'#554433', 5:'#221100' }
    },
    {
      id: 'jukeMinakamiNpc',
      x: 15, y: 3,
      name: 'ジューク',
      dialog: [
        '掟の番人の恐さを教えてやるよ。',
        '古谷を守りたければ俺を倒してみせろ。',
        '...お前たちの絆は本物か？証明しな！'
      ],
      defeatedDialog: [
        '...まさか、水上まで来るとは。',
        '古谷とやらを大事にしろよ。'
      ],
      afterDialog: 'battle_juke_minakami',
      defeated: false,
      sprite: jukeSprite,
      palette: jukePalette
    }
  ];

  var items = [
    { id: 'herb', x: 2, y: 10, taken: false },
    { id: 'superYakimanju', x: 27, y: 10, taken: false }
  ];

  var exits = [
    { x: 14, y: 18, target: 'forest', spawnX: 14, spawnY: 1 },
    { x: 15, y: 18, target: 'forest', spawnX: 15, spawnY: 1 }
  ];

  return {
    name: '水上谷',
    tiles: tiles,
    npcs: npcs,
    items: items,
    exits: exits
  };
})();
