// Map: 上毛学園 (第5章: 歪んだ校舎)
Game.Maps = Game.Maps || {};
Game.Maps['gakuen'] = (function() {

  // 30x20 indoor school map
  // Tile: 0=floor(open), 3=wall, 8=door, 9=floor(indoor)
  var W = 3, F = 9, D = 8, G = 0;
  var tiles = [
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
    [W,F,F,F,F,F,F,W,F,F,F,F,F,F,W,D,W,F,F,F,F,F,F,W,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,W,F,F,F,F,F,F,W,F,W,F,F,F,F,F,F,W,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,D,F,F,F,F,F,F,W,F,W,F,F,F,F,F,F,D,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,W,F,F,F,F,F,F,W,F,W,F,F,F,F,F,F,W,F,F,F,F,F,W],
    [W,W,W,D,W,W,W,W,W,W,W,D,W,W,W,F,W,W,W,D,W,W,W,W,W,W,D,W,W,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,W,W,D,W,W,W,W,W,W,W,D,W,W,W,F,W,W,W,D,W,W,W,W,W,W,D,W,W,W],
    [W,F,F,F,F,F,F,W,F,F,F,F,F,F,W,F,W,F,F,F,F,F,F,W,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,W,F,F,F,F,F,F,W,F,W,F,F,F,F,F,F,W,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,D,F,F,F,F,F,F,W,F,W,F,F,F,F,F,F,D,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,W,F,F,F,F,F,F,W,F,W,F,F,F,F,F,F,W,F,F,F,F,F,W],
    [W,W,W,D,W,W,W,W,W,W,W,D,W,W,W,F,W,W,W,D,W,W,W,W,W,W,D,W,W,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,W,W,D,W,W,W,W,W,W,W,D,W,W,W,F,W,W,W,D,W,W,W,W,W,W,D,W,W,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,D,F,D,F,F,F,F,F,F,F,F,F,F,F,F,W],
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W]
  ];

  // Generic student sprite (shadowy silhouette)
  var studentSprite = [
    [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,1,2,2,2,2,1,0,0,0,0,0,0,0],
    [0,0,0,1,2,2,2,2,1,0,0,0,0,0,0,0],
    [0,0,0,1,2,2,2,2,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0],
    [0,0,0,1,3,3,3,3,1,0,0,0,0,0,0,0],
    [0,0,1,3,3,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,1,3,3,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,1,3,3,3,3,1,0,0,0,0,0,0,0],
    [0,0,0,1,4,4,4,4,1,0,0,0,0,0,0,0],
    [0,0,0,1,4,0,0,4,1,0,0,0,0,0,0,0],
    [0,0,0,1,4,0,0,4,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];
  var studentPalette = { 1:'#222233', 2:'#444466', 3:'#334466', 4:'#223344' };

  // Gakuencho (Dean/Principal) boss sprite - imposing figure in dark robes
  var gakuenchoSprite = [
    [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,1,1,2,2,2,2,1,1,0,0,0,0,0,0],
    [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0],
    [0,0,1,3,2,2,2,3,2,1,0,0,0,0,0,0],
    [0,0,1,2,2,4,4,2,2,1,0,0,0,0,0,0],
    [0,0,0,1,2,2,2,2,1,0,0,0,0,0,0,0],
    [0,0,1,5,5,5,5,5,5,1,0,0,0,0,0,0],
    [0,1,5,5,6,5,5,6,5,5,1,0,0,0,0,0],
    [0,1,5,5,5,5,5,5,5,5,1,0,0,0,0,0],
    [0,1,5,5,5,5,5,5,5,5,1,0,0,0,0,0],
    [0,0,1,5,5,5,5,5,5,1,0,0,0,0,0,0],
    [0,0,0,1,7,7,7,7,1,0,0,0,0,0,0,0],
    [0,0,0,1,7,0,0,7,1,0,0,0,0,0,0,0],
    [0,0,0,1,7,0,0,7,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];
  var gakuenchoPalette = {
    1:'#111122', 2:'#334455', 3:'#ccaa00', 4:'#ff4444',
    5:'#223355', 6:'#ffcc44', 7:'#112233'
  };

  var npcs = [
    {
      id: 'kageSeito1',
      x: 4, y: 7,
      name: '影の生徒',
      dialog: [
        '...ここは上毛学園。',
        '授業が始まるとチャイムが鳴る。',
        '永遠に、ずっと、鳴り続ける。'
      ],
      defeatedDialog: [
        '...学園長が倒れた。',
        'チャイムが...止まった気がする。'
      ],
      afterDialog: null,
      defeated: false,
      movement: 'wander',
      sprite: studentSprite,
      palette: studentPalette
    },
    {
      id: 'kageSeito2',
      x: 22, y: 7,
      name: '影の生徒',
      dialog: [
        '記憶を書き換えられると...楽になるんだ。',
        '現実のことは全部忘れられる。',
        '先生がそうしてくれるから。'
      ],
      defeatedDialog: [
        'あなたは...現実に帰るのか。',
        '...羨ましい。'
      ],
      afterDialog: null,
      defeated: false,
      movement: 'pace',
      sprite: studentSprite,
      palette: { 1:'#222244', 2:'#446688', 3:'#334488', 4:'#223366' }
    },
    {
      id: 'kageSeito3',
      x: 10, y: 14,
      name: '影の生徒',
      dialog: [
        'この教室の窓から外を見ても、何も見えない。',
        '群馬の空は...どんな色だったっけ。',
        '思い出せないよ。'
      ],
      defeatedDialog: [
        '学園長を倒したのか。',
        'この学園はいつか終わる...のかな。'
      ],
      afterDialog: null,
      defeated: false,
      sprite: studentSprite,
      palette: { 1:'#221122', 2:'#553366', 3:'#443355', 4:'#332244' }
    },
    {
      id: 'gakuenchoNpc',
      x: 15, y: 2,
      name: '学園長',
      dialog: [
        '...授業中ですよ。席に着きなさい。',
        'ここは記憶を書き換える場所です。',
        '佐藤くんも自分からそれを望んだのです。',
        '「現実に帰りたくない」と。',
        '...お前も、書き換えてあげましょうか？'
      ],
      defeatedDialog: [
        'まさか...私が負けるとは。',
        '佐藤くんは...自分の意志を持っていた。',
        '先へ行きなさい。屋上にジュークがいる。'
      ],
      afterDialog: 'battle_gakuencho_boss',
      defeated: false,
      sprite: gakuenchoSprite,
      palette: gakuenchoPalette
    }
  ];

  var items = [
    { id: 'herb', x: 2, y: 17, taken: false },
    { id: 'yakimanju', x: 27, y: 17, taken: false }
  ];

  var exits = [
    { x: 14, y: 18, target: 'tomioka', spawnX: 14, spawnY: 1 },
    { x: 15, y: 18, target: 'tomioka', spawnX: 15, spawnY: 1 }
  ];

  return {
    name: '上毛学園',
    tiles: tiles,
    npcs: npcs,
    items: items,
    exits: exits
  };
})();
