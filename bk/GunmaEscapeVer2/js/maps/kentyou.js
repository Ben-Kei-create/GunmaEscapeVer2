// Map: 群馬県庁タワー最上階 (第10章: 終焉の間)
Game.Maps = Game.Maps || {};
Game.Maps['kentyou'] = (function() {

  // 30x20 tower top floor - sterile government building interior
  // 9=floor, 3=wall, 8=door, 0=open area
  var F=9, W=3, D=8, G=0;
  var tiles = [
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,W,W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,W,D,D,W,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,D,F,F,D,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,W,F,F,W,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,W,W,W,W,D,W,W,W,W,W,W,W,W,F,F,W,W,W,W,W,W,W,D,W,W,W,W,W,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,W,W,D,W,W,W,W,W,W,W,W,W,F,F,F,F,W,W,W,W,W,W,W,W,W,D,W,W,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,W,F,F,F,F,W,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,W,F,F,F,F,W,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,W,F,F,F,F,W,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,W,W,D,W,W,W,W,W,W,W,W,W,F,F,F,F,W,W,W,W,W,W,W,W,W,D,W,W,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,W,W,W,W,D,W,W,W,W,W,W,W,W,F,F,W,W,W,W,W,W,W,D,W,W,W,W,W,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,D,D,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W]
  ];

  var guardSprite = [
    [0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,1,2,2,2,2,2,1,0,0,0,0,0,0,0],
    [0,0,1,2,3,2,3,2,1,0,0,0,0,0,0,0],
    [0,0,1,2,2,2,2,2,1,0,0,0,0,0,0,0],
    [0,0,0,1,2,2,2,1,0,0,0,0,0,0,0,0],
    [0,0,1,4,4,4,4,4,1,0,0,0,0,0,0,0],
    [0,1,4,4,4,4,4,4,4,1,0,0,0,0,0,0],
    [0,1,4,4,4,4,4,4,4,1,0,0,0,0,0,0],
    [0,0,1,4,4,4,4,4,1,0,0,0,0,0,0,0],
    [0,0,1,5,5,5,5,5,1,0,0,0,0,0,0,0],
    [0,0,1,5,0,0,0,5,1,0,0,0,0,0,0,0],
    [0,0,1,5,0,0,0,5,1,0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];
  var guardPalette = { 1:'#222244', 2:'#aabb99', 3:'#111122', 4:'#334455', 5:'#223344' };

  // Juke Final - true form, towering and fractured
  var jukeFinalSprite = [
    [0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,1,2,2,2,2,2,2,2,1,0,0,0,0,0],
    [0,1,2,2,2,2,2,2,2,2,2,1,0,0,0,0],
    [0,1,2,3,2,2,2,2,3,2,2,1,0,0,0,0],
    [0,1,2,2,2,4,4,4,2,2,2,1,0,0,0,0],
    [0,0,1,2,2,4,5,4,2,2,1,0,0,0,0,0],
    [0,1,6,6,6,6,6,6,6,6,6,1,0,0,0,0],
    [1,6,6,6,7,6,6,6,7,6,6,6,1,0,0,0],
    [1,6,6,6,6,6,6,6,6,6,6,6,1,0,0,0],
    [1,6,6,6,6,6,6,6,6,6,6,6,1,0,0,0],
    [0,1,6,6,6,6,6,6,6,6,6,1,0,0,0,0],
    [0,0,1,6,6,6,6,6,6,6,1,0,0,0,0,0],
    [0,0,0,1,8,8,8,8,8,1,0,0,0,0,0,0],
    [0,0,0,1,8,0,0,0,8,1,0,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];
  var jukeFinalPalette = {
    1:'#000011', 2:'#112244', 3:'#ff8800', 4:'#ff3333',
    5:'#ffffff', 6:'#0a0a1e', 7:'#cc2222', 8:'#111133'
  };

  var npcs = [
    {
      id: 'lastGuard1',
      x: 5, y: 8,
      name: '最後の門番',
      dialog: [
        'この先は大臣の間だ。通す訳にはいかない。',
        '結界の主がここで待っている。',
        '引き返せ。君たちの現実はもう消えかけている。'
      ],
      defeatedDialog: [
        '...掟の番人が倒された。',
        'もう私には止める力がない。先へ行け。'
      ],
      afterDialog: null,
      defeated: false,
      movement: 'pace',
      sprite: guardSprite,
      palette: guardPalette
    },
    {
      id: 'lastGuard2',
      x: 24, y: 8,
      name: '最後の門番',
      dialog: [
        'ジュークが呼んでいる。この土地の掟が、終わりを望んでいる。',
        '...お前たちが来ることを、ずっと待っていたのかもしれないがな。',
        '行け。だが覚悟を持って行け。'
      ],
      defeatedDialog: [
        'よくここまで来た。後は頼む。',
        '群馬を...頼む。'
      ],
      afterDialog: null,
      defeated: false,
      movement: 'pace',
      sprite: guardSprite,
      palette: { 1:'#112222', 2:'#99bbaa', 3:'#001111', 4:'#223344', 5:'#112233' }
    },
    {
      id: 'jukeFinalNpc',
      x: 15, y: 2,
      name: 'ジューク',
      dialog: [
        'さあ、最後の掟を越えてみせろ！',
        '俺はこの土地の掟そのものだ。',
        '記憶も、名前も、路線も...全て俺が管理する。',
        'お前たちが帰りたければ俺を倒せ。これが最後の賭けだ！'
      ],
      defeatedDialog: [
        '...お前たちは、本当に強かった。',
        '掟が...砕けた。',
        '帰れ。現実へ。名前を取り戻して...生きろ。'
      ],
      afterDialog: 'battle_juke_final',
      defeated: false,
      sprite: jukeFinalSprite,
      palette: jukeFinalPalette
    }
  ];

  var items = [
    { id: 'superYakimanju', x: 2, y: 10, taken: false },
    { id: 'superYakimanju', x: 27, y: 10, taken: false }
  ];

  var exits = [
    { x: 14, y: 18, target: 'ikaho', spawnX: 14, spawnY: 1 },
    { x: 15, y: 18, target: 'ikaho', spawnX: 15, spawnY: 1 }
  ];

  return {
    name: '群馬県庁タワー最上階',
    tiles: tiles,
    npcs: npcs,
    items: items,
    exits: exits
  };
})();
