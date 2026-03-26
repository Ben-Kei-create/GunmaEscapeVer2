// Map: 榛名湖 (第7章: 霧の湖畔)
Game.Maps = Game.Maps || {};
Game.Maps['haruna'] = (function() {

  // 30x20 outdoor lake map
  // 0=grass, 1=road/path, 2=water, 3=wall, 4=tree
  var G=0, P=1, W=2, K=3, T=4;
  var tiles = [
    [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
    [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
    [T,G,G,G,G,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,G,G,G,G,G,T],
    [T,G,G,G,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,G,G,G,G,T],
    [T,G,G,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,G,G,G,T],
    [T,G,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,G,G,T],
    [T,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,G,T],
    [T,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,G,T],
    [T,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,G,T],
    [T,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,G,T],
    [T,G,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,G,G,T],
    [T,G,G,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,G,G,G,T],
    [T,G,G,G,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,G,G,G,G,T],
    [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
    [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
    [T,G,G,T,T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,T,G,G,G,T],
    [T,G,G,T,T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,T,G,G,G,T],
    [T,G,G,G,G,G,G,G,G,G,G,G,G,G,P,P,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
    [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T]
  ];

  var fisherSprite = [
    [0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,2,2,2,1,0,0,0,0,0,0,0,0,0],
    [0,0,1,3,2,3,1,0,0,0,0,0,0,0,0,0],
    [0,0,1,2,2,2,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,4,4,4,1,0,0,0,0,0,0,0,0,0],
    [0,1,4,4,4,4,4,1,0,0,0,0,0,0,0,0],
    [0,1,4,4,4,4,4,1,0,5,5,5,5,5,0,0],
    [0,0,1,4,4,4,1,0,0,0,0,0,0,5,0,0],
    [0,0,1,6,6,6,1,0,0,0,0,0,0,5,0,0],
    [0,0,1,6,0,6,1,0,0,0,0,0,0,5,0,0],
    [0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];
  var fisherPalette = { 1:'#333333', 2:'#ddbb88', 3:'#222222', 4:'#335577', 5:'#aacc88', 6:'#443322' };

  // Lake beast - massive aquatic creature
  var lakeBeastSprite = [
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
    [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
    [0,1,2,2,3,2,2,2,2,3,2,2,2,2,1,0],
    [0,1,2,2,2,2,4,4,4,2,2,2,2,2,1,0],
    [1,2,2,2,2,2,4,4,4,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [0,1,2,5,2,2,2,2,2,2,2,5,2,2,1,0],
    [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
    [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
    [0,0,0,1,2,2,1,0,0,1,2,2,1,0,0,0],
    [0,0,0,0,1,2,1,0,0,1,2,1,0,0,0,0],
    [0,0,0,0,1,2,1,0,0,1,2,1,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];
  var lakeBeastPalette = { 1:'#113355', 2:'#224477', 3:'#ffcc00', 4:'#cc3333', 5:'#88aacc' };

  var npcs = [
    {
      id: 'harunaFisher',
      x: 4, y: 15,
      name: '榛名の漁師',
      dialog: [
        'このあたりの霧は濃い。迷うなよ。',
        '榛名湖は昔から「ものを忘れさせる湖」と言われていた。',
        '気をつけろ、湖底から何かが這い上がってくる。'
      ],
      defeatedDialog: [
        '湖の獣を倒したか。霧が少し晴れた気がする。',
        '山川という男がこっちに向かってると聞いたぞ。'
      ],
      afterDialog: null,
      defeated: false,
      movement: 'static',
      sprite: fisherSprite,
      palette: fisherPalette
    },
    {
      id: 'harunaFogWatcher',
      x: 25, y: 15,
      name: '霧見の老人',
      dialog: [
        '湖の霧は結界の澱みが形になったものじゃ。',
        '晴らすには...湖底の理由を断たねばならん。',
        '生きて帰ってこいよ、旅人。'
      ],
      defeatedDialog: [
        '湖が静かになった。ありがとう。',
        '榛名山の向こう、水上に仲間がいるぞ。'
      ],
      afterDialog: null,
      defeated: false,
      sprite: fisherSprite,
      palette: { 1:'#444444', 2:'#ccbbaa', 3:'#111111', 4:'#776655', 5:'#888888', 6:'#554433' }
    },
    {
      id: 'harunaLakeBeastNpc',
      x: 15, y: 3,
      name: '榛名湖の獣',
      dialog: [
        '...グォォォ...',
        '湖の底から来た。全てを飲み込む。',
        '記憶も、名前も、存在も。覚悟しろ！'
      ],
      defeatedDialog: [
        '...グ...。',
        '湖が...静かになる...'
      ],
      afterDialog: 'battle_haruna_lake_beast',
      defeated: false,
      sprite: lakeBeastSprite,
      palette: lakeBeastPalette
    }
  ];

  var items = [
    { id: 'herb', x: 2, y: 16, taken: false },
    { id: 'superYakimanju', x: 27, y: 16, taken: false }
  ];

  var exits = [
    { x: 14, y: 18, target: 'onuma', spawnX: 14, spawnY: 1 },
    { x: 15, y: 18, target: 'onuma', spawnX: 15, spawnY: 1 }
  ];

  return {
    name: '榛名湖',
    tiles: tiles,
    npcs: npcs,
    items: items,
    exits: exits
  };
})();
