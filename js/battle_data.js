// Battle Data Extracted
Game.BattleData = (function() {
  var enemies = {
    ruined_checkpoint: {
      name: '朽ちた関所',
      hp: 45, maxHp: 45,
      attack: 0, defense: 0, goldReward: 0,
      sprite: [
        [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,1,2,2,2,3,3,3,2,2,1,0,0,0,0],
        [0,1,2,2,3,4,4,4,3,2,2,1,0,0,0,0],
        [1,2,2,3,4,4,4,4,3,2,2,1,0,0,0,0],
        [1,2,2,3,4,0,0,4,3,2,2,1,0,0,0,0],
        [1,2,2,3,4,0,0,4,3,2,2,1,0,0,0,0],
        [1,2,2,3,4,4,4,4,3,2,2,1,0,0,0,0],
        [1,2,2,3,4,4,4,4,3,2,2,1,0,0,0,0],
        [0,1,1,3,4,4,4,4,3,1,1,0,0,0,0,0],
        [0,0,1,1,3,3,3,3,1,1,0,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#222222', 2:'#444444', 3:'#778899', 4:'#2F4F4F' }
    },
    tomioka_weaver: {
      name: '紡ぎ続ける影',
      family: 'thread',
      mapTags: ["tomioka"],
      pride: '極上の生糸を生産し続けること',
      sorrow: '機械が止まっても手を止められないこと',
      silhouetteDiff: [
        '頭頂部から細い糸の束が上へ伸びる',
        '右腕が鋭く機械的な形状になっている',
        '足元がほつれた布のようにボロボロになっている'
      ],
      hp: 42, maxHp: 42,
      attack: 14, defense: 8, goldReward: 25, expReward: 15,
      dropItem: 'silk_scrap', dropRate: 0.2,
      sprite: [
        [0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,1,2,2,3,2,3,2,2,1,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,1,2,2,2,4,4,4,2,2,1,1,0,0,0],
        [0,0,1,2,2,1,1,1,1,1,2,2,1,0,0,0],
        [0,1,5,1,1,2,2,2,2,2,1,1,6,1,0,0],
        [0,1,5,1,2,2,2,2,2,2,2,1,6,1,0,0],
        [0,1,5,1,2,2,2,2,2,2,2,1,6,1,0,0],
        [0,0,1,1,2,2,2,2,2,2,2,1,6,1,0,0],
        [0,0,0,1,2,2,1,0,1,2,2,1,1,0,0,0],
        [0,0,0,1,5,5,1,0,1,2,2,1,0,0,0,0],
        [0,0,0,1,5,0,1,0,1,5,5,1,0,0,0,0],
        [0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0]
      ],
      palette: {
        1: '#2c2a35',
        2: '#e8e5df',
        3: '#1a1920',
        4: '#d4a3b3',
        5: '#ffffff',
        6: '#8b9bb4'
      }
    },
    tomioka_tangled: {
      name: '絡まりし記憶',
      family: 'thread',
      mapTags: ["tomioka", "shimonita"],
      pride: '決して切れぬ丈夫な絆であること',
      sorrow: 'もはや何を繋いでいたのか分からないこと',
      silhouetteDiff: [
        '全身が丸みを帯びた繭のような輪郭',
        '右目だけが糸の隙間から覗いている',
        '裾が地面に広がり、根を張っている'
      ],
      hp: 48, maxHp: 48,
      attack: 12, defense: 12, goldReward: 28, expReward: 18,
      dropItem: 'tangled_thread', dropRate: 0.25,
      sprite: [
        [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,1,2,5,2,2,1,0,0,0,0,0,0],
        [0,0,0,1,2,5,5,2,2,2,1,0,0,0,0,0],
        [0,0,1,2,2,2,1,1,2,5,2,1,0,0,0,0],
        [0,0,1,2,2,1,4,3,1,2,5,1,0,0,0,0],
        [0,1,2,5,2,1,1,1,1,2,2,2,1,0,0,0],
        [0,1,5,5,2,2,2,2,2,2,2,5,1,0,0,0],
        [1,2,2,2,1,1,1,1,1,1,2,2,2,1,0,0],
        [1,2,5,2,1,2,2,2,2,1,2,5,2,1,0,0],
        [1,5,5,2,2,1,1,1,1,2,2,5,5,1,0,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [1,2,5,2,2,5,2,2,5,2,2,5,2,1,0,0],
        [0,1,5,5,2,5,5,2,5,5,2,5,1,0,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: {
        1: '#3a3845',
        2: '#c8c6c2',
        3: '#000000',
        4: '#ff5e5e',
        5: '#f5f5f5'
      }
    },
    shimonita_packer: {
      name: '箱詰めの亡霊',
      family: 'thread',
      mapTags: ["shimonita"],
      pride: '規格通りに全てを納めること',
      sorrow: '中身がとうに空っぽであること',
      silhouetteDiff: [
        '背中に巨大な四角い荷物を背負っている',
        '両腕が異様に長く、地面につきそう',
        '顔に目や口が一切ないのっぺらぼう'
      ],
      hp: 40, maxHp: 40,
      attack: 16, defense: 6, goldReward: 22, expReward: 14,
      dropItem: 'empty_box', dropRate: 0.15,
      sprite: [
        [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,2,2,1,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,2,2,1,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,2,2,1,0,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,1,2,2,1,5,5,5,5,1,0,0,0],
        [0,0,0,1,2,2,2,1,5,4,5,5,1,0,0,0],
        [0,0,1,2,2,2,2,1,5,5,5,5,1,0,0,0],
        [0,0,1,2,1,2,2,1,5,5,4,5,1,0,0,0],
        [0,1,2,1,0,1,2,1,1,1,1,1,1,0,0,0],
        [0,1,2,1,0,1,2,2,2,1,0,0,0,0,0,0],
        [0,1,2,1,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,1,2,1,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,1,1,0,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: {
        1: '#2b2b2b',
        2: '#a39f98',
        3: '#111111',
        4: '#8c7c6b',
        5: '#d1c7b8'
      }
    },
    tomioka_inspector: {
      name: '品質の番人',
      family: 'guard',
      mapTags: ["tomioka"],
      pride: '不良品を絶対に通さない厳しい眼',
      sorrow: 'もはや検査すべきものが生産されていないこと',
      silhouetteDiff: [
        '頭部に角張った作業帽を被っている',
        '右手に細く長い検査杖を持っている',
        '左目が赤く鋭く光っている'
      ],
      hp: 52, maxHp: 52,
      attack: 18, defense: 10, goldReward: 35, expReward: 22,
      dropItem: 'inspector_lens', dropRate: 0.18,
      sprite: [
        [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,5,5,5,5,5,5,5,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,0,1,2,4,2,3,2,1,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,1,6,1,1,1,1,1,6,1,0,0,0,0],
        [0,0,1,6,6,6,2,2,2,6,6,6,1,0,0,0],
        [0,1,6,6,1,2,2,2,2,2,1,6,6,1,0,0],
        [0,1,6,1,0,1,2,2,2,1,0,1,1,1,0,0],
        [0,1,1,0,0,1,2,2,2,1,0,0,1,0,0,0],
        [0,0,0,0,0,1,6,6,6,1,0,0,1,0,0,0],
        [0,0,0,0,0,1,6,1,6,1,0,0,1,0,0,0],
        [0,0,0,0,0,1,6,1,6,1,0,0,1,0,0,0],
        [0,0,0,0,1,1,1,0,1,1,1,0,1,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0]
      ],
      palette: {
        1: '#1a1c23',
        2: '#e2e0d8',
        3: '#000000',
        4: '#ff3333',
        5: '#4a5a75',
        6: '#6b7d9c'
      }
    },
    shimonita_neglected_daruma: {
      name: '煤けた祈願',
      family: 'daruma',
      mapTags: ["shimonita", "tomioka"],
      pride: '工場の安全を静かに見守ること',
      sorrow: '片目を入れる主がもう戻らないこと',
      silhouetteDiff: [
        '全体に煤のような黒い斑点が散っている',
        '左目だけが虚ろに開眼している',
        '髭がだらしなく下へ垂れ下がっている'
      ],
      hp: 50, maxHp: 50,
      attack: 10, defense: 15, goldReward: 20, expReward: 12,
      dropItem: 'sooty_charm', dropRate: 0.12,
      sprite: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,1,2,2,5,2,2,2,5,2,2,2,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,1,2,2,1,1,2,2,2,1,1,2,2,2,1,0],
        [1,2,2,1,5,5,1,2,1,5,5,1,2,2,5,1],
        [1,2,5,1,3,3,1,2,1,5,5,1,2,2,2,1],
        [1,2,2,1,3,3,1,2,1,5,5,1,2,2,2,1],
        [1,2,2,1,1,1,1,2,1,1,1,1,2,5,2,1],
        [1,5,2,2,2,1,6,6,6,1,2,2,2,2,2,1],
        [1,2,2,2,2,1,6,1,6,1,2,2,2,5,2,1],
        [0,1,2,2,2,1,1,1,1,1,2,2,2,2,1,0],
        [0,1,2,5,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,5,2,2,5,2,2,2,1,0,0],
        [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0]
      ],
      palette: {
        1: '#2e1a1a',
        2: '#b53b3b',
        3: '#0a0a0a',
        4: '#d4c88c',
        5: '#5c4848',
        6: '#e3d7a8'
      }
    },
    tomioka_dyer_sludge: {
      name: '澱む極彩色',
      family: 'mud',
      mapTags: ["tomioka", "shimonita"],
      pride: '色鮮やかな布を染め上げた誇り',
      sorrow: '混ざり合い、黒く濁って流された痛み',
      silhouetteDiff: [
        '下半身がドロドロに溶けて地面と同化している',
        '頭頂部から不定形の染料が垂れている',
        '右半身が不自然に肥大化している'
      ],
      hp: 45, maxHp: 45,
      attack: 15, defense: 6, goldReward: 26, expReward: 16,
      dropItem: 'toxic_dye', dropRate: 0.28,
      sprite: [
        [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,5,5,1,0,0,0,0,0,0],
        [0,0,0,0,1,1,2,5,2,2,1,1,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [0,0,1,2,3,3,2,2,2,3,3,2,2,1,0,0],
        [0,1,2,2,3,4,2,2,2,3,4,2,2,2,1,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,1,5,2,2,2,3,3,3,2,2,2,5,2,1,0],
        [1,2,5,5,2,2,2,2,2,2,2,5,5,2,2,1],
        [1,2,2,5,2,2,2,2,2,2,2,5,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [0,1,1,2,2,1,2,2,2,1,2,2,2,1,1,0],
        [0,0,1,2,2,1,2,2,2,1,2,2,1,0,0,0],
        [0,1,2,2,2,2,1,2,1,2,2,2,2,1,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0]
      ],
      palette: {
        1: '#1a1525',
        2: '#4d3e63',
        3: '#0d0a12',
        4: '#c24ea0',
        5: '#7d679c'
      }
    },
    onsenMonkey: {
      name: '温泉猿',
      hp: 50, maxHp: 50,
      attack: 12, defense: 3, goldReward: 60,
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
    ishidanGuard: {
      name: '石段番人',
      hp: 55, maxHp: 55,
      attack: 14, defense: 5, goldReward: 80,
      sprite: [
        [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,1,3,2,2,2,3,2,1,0,0,0,0,0],
        [0,0,0,1,2,2,4,4,2,2,1,0,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,1,5,5,5,5,5,5,1,0,0,0,0,0],
        [0,0,1,5,5,5,5,5,5,5,5,1,0,0,0,0],
        [0,0,1,5,5,5,5,5,5,5,5,1,0,0,0,0],
        [0,0,0,1,5,5,5,5,5,5,1,0,0,0,0,0],
        [0,0,0,1,5,5,5,5,5,5,1,0,0,0,0,0],
        [0,0,0,1,6,6,0,0,6,6,1,0,0,0,0,0],
        [0,0,0,1,6,6,0,0,6,6,1,0,0,0,0,0],
        [0,0,0,0,7,7,0,0,7,7,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#554433', 2:'#aa8866', 3:'#111', 4:'#cc9966', 5:'#665544', 6:'#443322', 7:'#332211' }
    },
    cabbage: {
      name: '巨大キャベツ',
      hp: 60, maxHp: 60,
      attack: 15, defense: 4, goldReward: 100,
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
    },
    // Chapter 2 enemies
    anguraGuard: {
      name: 'アングラの見張り',
      hp: 80, maxHp: 80,
      attack: 18, defense: 6, goldReward: 120,
      sprite: [
        [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,0,1,3,1,3,1,1,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,0,0,1,4,4,1,0,0,0,0,0,0,0,0,0],
        [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
        [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
        [0,1,4,4,4,4,4,4,1,0,0,0,0,0,0,0],
        [0,0,1,4,4,4,4,1,0,0,0,0,0,0,0,0],
        [0,0,1,5,5,5,5,1,0,0,0,0,0,0,0,0],
        [0,0,1,5,0,0,5,1,0,0,0,0,0,0,0,0],
        [0,0,1,6,0,0,6,1,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#444', 3:'#ff0000', 4:'#333', 5:'#222', 6:'#111' }
    },
    chuji: {
      name: '国定忠治',
      hp: 120, maxHp: 120,
      attack: 22, defense: 8, goldReward: 200,
      sprite: [
        [0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [0,0,1,2,2,2,2,2,1,0,0,0,0,0,0,0],
        [0,0,1,3,2,2,3,2,1,0,0,0,0,0,0,0],
        [0,0,1,2,2,4,2,2,1,0,0,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,1,5,5,5,5,5,5,5,1,0,0,0,0,0,0],
        [1,5,5,5,5,5,5,5,5,5,1,0,0,0,0,0],
        [1,5,5,5,5,5,5,5,5,5,1,0,0,0,0,0],
        [0,1,5,5,5,5,5,5,5,1,0,0,0,0,0,0],
        [0,0,1,5,5,5,5,5,1,0,0,0,0,0,0,0],
        [0,0,1,6,6,0,6,6,1,0,0,0,0,0,0,0],
        [0,0,1,6,6,0,6,6,1,0,0,0,0,0,0,0],
        [0,0,0,7,7,0,7,7,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#444', 2:'#aaa', 3:'#ff0', 4:'#c88', 5:'#226', 6:'#335', 7:'#443' }
    },
    anguraBoss: {
      name: 'ナンバー12-グンマ',
      hp: 180, maxHp: 180,
      attack: 28, defense: 10, goldReward: 500,
      sprite: [
        [0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [0,1,2,2,2,2,2,2,2,1,0,0,0,0,0,0],
        [0,1,3,2,2,2,2,3,2,1,0,0,0,0,0,0],
        [0,1,2,2,2,4,2,2,2,1,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [0,1,5,5,5,5,5,5,5,1,0,0,0,0,0,0],
        [1,5,5,5,5,5,5,5,5,5,1,0,0,0,0,0],
        [1,5,5,5,5,5,5,5,5,5,1,0,0,0,0,0],
        [0,1,5,5,5,5,5,5,5,1,0,0,0,0,0,0],
        [0,0,1,6,6,0,6,6,1,0,0,0,0,0,0,0],
        [0,0,1,6,6,0,6,6,1,0,0,0,0,0,0,0],
        [0,0,0,7,7,0,7,7,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#333', 2:'#888', 3:'#f00', 4:'#c88', 5:'#2a2a3a', 6:'#333', 7:'#222' }
    },

    // ── ch3 boss ──
    kumako_steam: {
      name: '熊子・湯煙形態',
      hp: 110, maxHp: 110,
      attack: 18, defense: 8, goldReward: 150,
      sprite: [
        [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,1,1,2,2,1,1,0,0,0,0,0,0],
        [0,0,0,1,1,2,1,1,2,1,1,0,0,0,0,0],
        [0,0,1,1,2,1,1,1,1,2,1,1,0,0,0,0],
        [0,1,1,2,1,1,3,3,1,1,2,1,1,0,0,0],
        [0,1,1,2,1,1,1,1,1,1,2,1,1,0,0,0],
        [0,1,2,2,3,3,3,3,3,3,2,2,1,0,0,0],
        [0,1,2,3,3,2,2,2,2,3,3,2,1,1,0,0],
        [1,1,2,3,2,2,2,2,2,2,3,2,1,1,1,0],
        [1,2,2,3,2,2,1,1,2,2,3,2,2,1,1,0],
        [1,2,2,3,2,1,1,1,1,2,3,2,2,2,1,0],
        [1,2,2,3,3,1,1,1,1,3,3,2,2,2,1,0],
        [1,2,2,2,3,3,3,3,3,3,2,2,2,2,1,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,1,1,0],
        [0,1,1,1,2,2,2,2,2,2,2,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0]
      ],
      palette: { 1:'#ffffff', 2:'#aaddff', 3:'#ccccff' }
    },

    // ── ch4 boss ──
    yubatake_guardian: {
      name: '湯畑の守護者',
      hp: 140, maxHp: 140,
      attack: 22, defense: 12, goldReward: 200,
      ritualMode: 'temperature',
      ritualFailStyle: {
        text: '熱情が沸騰し、濁流となってあなたを押し流した。',
        returnEventId: 'ev_fail_yubatake_downstream'
      },
      ritualParams: {
        startTemperature: 110,
        targetMin: 35,
        targetMax: 50,
        freezeFailThreshold: 10,
        lowDiceCoolValue: 15,
        highDiceHeatValue: 8
      },
      sprite: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,2,0,0,0,1,1,0,0,0,2,1,0,0],
        [0,2,2,3,0,0,1,2,2,1,0,0,3,2,2,0],
        [0,2,3,3,0,1,2,3,3,2,1,0,3,3,2,0],
        [0,3,3,2,1,2,3,4,4,3,2,1,2,3,3,0],
        [0,0,3,2,1,2,3,3,3,3,2,1,2,3,0,0],
        [0,0,2,2,2,3,3,3,3,3,3,2,2,2,0,0],
        [0,0,1,2,3,3,3,3,3,3,3,3,2,1,0,0],
        [0,0,1,3,3,4,4,3,3,4,4,3,3,1,0,0],
        [0,0,2,3,3,4,4,3,3,4,4,3,3,2,0,0],
        [0,0,2,3,3,3,3,3,3,3,3,3,3,2,0,0],
        [0,0,3,3,3,2,2,3,3,2,2,3,3,3,0,0],
        [0,3,3,3,2,2,2,2,2,2,2,2,3,3,3,0],
        [3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3],
        [3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3]
      ],
      palette: { 1:'#ffffff', 2:'#aaddff', 3:'#228866', 4:'#88ccaa' }
    },

    // ── ch5 boss ──
    juke_gakuen: {
      name: 'ジューク（学園）',
      hp: 160, maxHp: 160,
      attack: 25, defense: 14, goldReward: 250,
      sprite: [
        [0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0],
        [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
        [0,0,0,0,0,2,1,1,1,1,2,0,0,0,0,0],
        [0,0,0,0,0,1,4,1,1,4,1,0,0,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,2,2,3,3,3,3,2,2,0,0,0,0],
        [0,0,0,2,2,2,3,3,3,3,2,2,2,0,0,0],
        [0,0,0,2,1,2,2,2,2,2,2,1,2,0,0,0],
        [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
        [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
        [0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],
        [0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],
        [0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],
        [0,0,0,0,2,2,2,0,0,2,2,2,0,0,0,0]
      ],
      palette: { 1:'#ffddcc', 2:'#111111', 3:'#ffffff', 4:'#ff0000' }
    },

    // ── ch6 mid-boss ──
    echo_guardian: {
      name: '返声の番',
      hp: 130, maxHp: 130,
      attack: 20, defense: 10, goldReward: 180,
      sprite: [
        [0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],
        [0,0,0,0,0,2,1,1,1,1,2,0,0,0,0,0],
        [0,0,0,0,2,1,1,1,1,1,1,2,0,0,0,0],
        [0,0,0,2,1,1,1,1,1,1,1,1,2,0,0,0],
        [0,0,2,1,1,3,3,1,1,3,3,1,1,2,0,0],
        [0,0,2,1,1,3,3,1,1,3,3,1,1,2,0,0],
        [0,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0],
        [0,2,1,1,1,1,3,3,3,3,1,1,1,1,2,0],
        [0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0],
        [0,0,0,2,2,1,1,1,1,1,1,2,2,0,0,0],
        [0,0,0,0,2,2,1,1,1,1,2,2,0,0,0,0],
        [0,0,0,2,1,1,2,2,2,2,1,1,2,0,0,0],
        [0,0,2,1,1,2,0,0,0,0,2,1,1,2,0,0],
        [0,2,1,1,2,0,0,0,0,0,0,2,1,1,2,0],
        [0,0,2,2,0,0,0,0,0,0,0,0,2,2,0,0]
      ],
      palette: { 1:'#ffffff', 2:'#cccccc', 3:'#ddaaff' }
    },

    // ── ch6 boss ──
    sato_kumako_tunnel: {
      name: '佐藤＆熊子',
      hp: 200, maxHp: 200,
      attack: 28, defense: 15, goldReward: 300,
      sprite: [
        [0,0,0,0,4,4,4,0,0,4,4,4,0,0,0,0],
        [0,0,0,4,4,4,4,4,4,4,4,4,4,0,0,0],
        [0,0,0,4,1,1,1,4,4,1,1,1,4,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,1,1,1,0,0,1,1,1,0,0,0,0],
        [0,0,0,2,2,2,2,0,0,3,3,3,3,0,0,0],
        [0,0,2,2,2,2,2,0,0,3,3,3,3,3,0,0],
        [0,2,2,1,2,2,2,0,0,3,3,3,1,3,3,0],
        [0,1,1,1,2,2,2,0,0,3,3,3,1,1,1,0],
        [0,0,0,2,2,2,2,0,0,3,3,3,3,0,0,0],
        [0,0,0,2,2,2,2,0,0,3,3,3,3,0,0,0],
        [0,0,0,2,2,2,2,0,0,3,3,3,3,0,0,0],
        [0,0,0,4,4,4,4,0,0,4,4,4,4,0,0,0],
        [0,0,0,4,4,0,0,0,0,0,0,4,4,0,0,0],
        [0,0,0,4,4,0,0,0,0,0,0,4,4,0,0,0],
        [0,0,4,4,4,0,0,0,0,0,0,4,4,4,0,0]
      ],
      palette: { 1:'#ffccaa', 2:'#2244cc', 3:'#22aa44', 4:'#111111' }
    },

    // ── ch7 boss ──
    haruna_lake_beast: {
      name: '榛名の湖獣',
      hp: 120, maxHp: 120,
      attack: 18, defense: 10, goldReward: 150,
      sprite: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,1,2,1,1,1,1,2,1,0,0,0,0],
        [0,0,0,1,2,2,1,1,1,1,2,2,1,0,0,0],
        [0,0,1,1,1,1,1,3,3,1,1,1,1,1,0,0],
        [0,1,1,1,4,1,1,3,3,1,1,4,1,1,0,0],
        [0,1,1,1,5,1,1,1,1,1,1,5,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,1,1,1,1,2,2,2,2,1,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0],
        [0,2,1,1,1,1,0,0,0,0,1,1,1,1,2,0],
        [0,2,1,1,0,0,0,0,0,0,0,0,1,1,2,0],
        [0,0,2,2,0,0,0,0,0,0,0,0,2,2,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#1E90FF', 2:'#00008B', 3:'#00FFFF', 4:'#FFFFFF', 5:'#FF0000' }
    },

    // ── ch8 boss ──
    oze_mud_wraith: {
      name: '尾瀬の泥異形',
      hp: 150, maxHp: 150,
      attack: 22, defense: 15, goldReward: 200,
      sprite: [
        [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,2,3,2,2,3,2,2,1,0,0,0],
        [0,0,1,2,2,2,3,2,2,3,2,2,2,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [1,2,2,2,3,3,3,3,3,3,3,3,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#654321', 2:'#8B4513', 3:'#000000' }
    },

    // ── ch9 boss ──
    juke_minakami: {
      name: 'ジューク（水上）',
      hp: 180, maxHp: 180,
      attack: 28, defense: 18, goldReward: 300,
      sprite: [
        [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,3,2,2,3,2,2,1,0,0,0,0],
        [0,0,0,1,2,4,2,2,4,2,2,1,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,5,5,5,5,2,2,1,0,0,0,0],
        [0,0,1,1,2,2,2,2,2,2,1,1,0,0,0,0],
        [0,1,2,1,2,2,2,2,2,2,1,2,1,0,0,0],
        [0,1,2,2,1,2,2,2,2,1,2,2,1,0,0,0],
        [0,0,1,2,2,1,1,1,1,2,2,1,0,0,0,0],
        [0,0,0,1,1,0,2,2,2,2,0,1,1,0,0,0],
        [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#4B0082', 2:'#8A2BE2', 3:'#FFFFFF', 4:'#FF0000', 5:'#000000' }
    },

    // ── ch10 final boss ──
    juke_final: {
      name: '真・ジューク',
      hp: 280, maxHp: 280,
      attack: 38, defense: 22, goldReward: 0,
      sprite: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,3,3,2,2,3,3,2,1,0,0,0],
        [0,0,1,2,2,3,3,2,2,3,3,2,2,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,3,3,3,2,2,2,2,2,2,1],
        [1,2,2,2,2,3,3,3,3,3,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palette: { 1:'#000000', 2:'#111111', 3:'#FF0000' },
      // Phase 2 sprite (white/gold) — swapped in by phase_change gimmick
      spritePhase2: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,1,2,3,3,2,2,3,3,2,1,0,0,0],
        [0,0,1,2,2,3,3,2,2,3,3,2,2,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,3,3,3,2,2,2,2,2,2,1],
        [1,2,2,2,2,3,3,3,3,3,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ],
      palettePhase2: { 1:'#FFFFFF', 2:'#F5F5F5', 3:'#FFD700' }
    }
  };

  var bossGimmicks = {

    // ── 第1章 ──────────────────────────────

    ruined_checkpoint: {
      boss_id: 'ruined_checkpoint',
      passive: {
        id: 'sturdy_gate',
        description: '止められた旅人たちの残響が門の形を保っている。ダイスを重ねて境界を越えるしかない。',
        apply: function(enemy) {}
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.34 && !enemy._memoryCracked;
        },
        action: function(enemy) {
          enemy._memoryCracked = true;
          return '瓦礫の奥で、通れなかった旅人たちの声がきしんだ。';
        }
      },
      dialogue: {
        phase_change: [
          { speaker: '主人公', text: 'ただの瓦礫じゃない。止められた気配が門の形を保ってる。' },
          { speaker: 'アカギ', text: '壊すな。越えるための数を、あいつに重ねろ。' }
        ]
      }
    },

    darumaMaster: {
      boss_id: 'darumaMaster',
      passive: {
        id: 'hollow_vow',
        description: '欠けた願いが片目のまま脈打ち、満ちない祈りを見返してくる。',
        apply: function(enemy, turnCount, playerEffects, enemyEffects, runtime) {
          if (runtime && runtime.ritualState && runtime.ritualState.hpZeroReached && !runtime.ritualState.eyeRepaired) {
            return '欠けた願いが、目のない窪みでまだ息をしている。';
          }
          return null;
        }
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.5 && !enemy._hollowOpened;
        },
        action: function(enemy) {
          enemy._hollowOpened = true;
          enemy.attack += 3;
          return '欠け目のだるまが、片目だけでこちらを見据えた。';
        }
      },
      special_move: {
        id: 'vacant_glare',
        name: '空願の凝視',
        description: '空っぽの願いを突き返す視線で、旅人の芯を揺さぶる。',
        trigger: function(turnCount, enemy) {
          return enemy.hp > 0 && (turnCount === 2 || turnCount === 5);
        },
        damage: function(enemy) {
          return Math.floor(enemy.attack * 1.45);
        },
        self_stun: 1,
        message: '欠け目のだるまが、願いの抜け殻を押し返してきた！'
      },
      sfx: { phase_change: 'reality_glitch', special_move: 'dice_roll_heavy' },
      dialogue: {
        phase_change: [
          { speaker: '欠け目のだるま', text: 'ミル…まだ片方しか、見えぬ。' },
          { speaker: 'アカギ', text: '目を逸らすな。空洞で値踏みされるぞ。' }
        ],
        special_move: [
          { speaker: '欠け目のだるま', text: '願イノ殻…返ソウ。' },
          { speaker: '主人公', text: '胸の奥の空っぽを、見透かされた…！' }
        ],
        victory: [
          { speaker: '欠け目のだるま', text: '…見エタ。これで、待テる。' },
          { speaker: '主人公', text: '目を入れてやっと、願いが閉じたんだな。' }
        ]
      }
    },

    threadMaiden: {
      boss_id: 'threadMaiden',
      passive: {
        id: 'loom_tension',
        description: '細い目は糸の節をほどくが、高い目は逆に絡まりを締めてしまう。',
        apply: function(enemy, turnCount, playerEffects, enemyEffects, runtime) {
          if (!runtime) return null;
          if (runtime.ritualState.lastLowDiceHit) {
            return '細い目が糸目をほぐしている。今の手つきだ。';
          }
          if (runtime.ritualHintState >= 2) {
            return '太い目ほど、逆に糸が食い込んでいく。';
          }
          return null;
        }
      },
      special_move: {
        id: 'snare_reel',
        name: '絡糸返し',
        description: '乱暴な手繰りに応じ、糸束がこちらの腕へ食い込んでくる。',
        trigger: function(turnCount) {
          return turnCount === 3 || turnCount === 6 || turnCount === 9;
        },
        damage: function(enemy) {
          return Math.floor(enemy.attack * 1.2);
        },
        effect: function(playerEffects, addEffectFn, enemyEffects, runtime, enemy) {
          var maxTangle = enemy && enemy.ritualParams ? (enemy.ritualParams.maxTangle || 12) : 12;
          if (runtime) {
            runtime.ritualGauge = Math.min(maxTangle + 3, runtime.ritualGauge + 2);
          }
          addEffectFn(playerEffects, 'slow', 2, 0);
        },
        message: '絡糸の機女が、引いたぶんだけ糸を締め返した！'
      },
      sfx: { special_move: 'train_echo' },
      dialogue: {
        special_move: [
          { speaker: '絡糸の機女', text: '引クナ…結ベル速サデ、触レヨ。' },
          { speaker: '主人公', text: '強く引くほど、逆に絡まりが増える…！' }
        ],
        victory: [
          { speaker: '絡糸の機女', text: '…やっと、止マレる。' },
          { speaker: '主人公', text: 'ほどくって、切ることじゃなかったんだな。' }
        ]
      }
    },

    // 佐藤テスト戦（チュートリアル）― 優先実装
    satoTest: {
      boss_id: 'satoTest',
      passive: {
        id: 'mentor_mercy',
        description: 'HPが0になっても1残る（負けイベントではない確認戦）',
        apply: function(enemy, dmg) {
          if (enemy.hp - dmg <= 0) { enemy.hp = 1; return true; }
          return false;
        }
      },
      phase_change: null,  // フェーズ変化なし
      special_move: {
        id: 'sato_lecture',
        name: '佐藤の説教',
        description: '3ターン目に強制発動。ダメージではなく次のダイス出目+2',
        trigger: function(turnCount) { return turnCount === 3; },
        effect: function(playerEffects, addEffectFn) {
          addEffectFn(playerEffects, 'dice_bonus', 1, 2);
        },
        message: '佐藤「ダイスの目をよく見ろ。数字の裏を読め」'
      },
      victory_flag: 'sato_test_cleared'
    },

    // 暗鞍ナンバー12（章ボス）
    anguraBoss: {
      boss_id: 'anguraBoss',
      passive: {
        id: 'heavy_cargo',
        description: '荷車の重み。毎ターン自身の素早さ-1、だが攻撃力+2',
        apply: function(enemy, turnCount) {
          enemy.attack += 2;
          // 行動遅延は外部処理
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.4; },
        action: function(enemy) {
          enemy.defense = Math.max(0, enemy.defense - 5);
          enemy.attack += 8;
          return '荷車が崩壊した！ナンバー12は身軽になり攻撃力が上がった！';
        }
      },
      special_move: {
        id: 'cargo_rush',
        name: '荷車突進',
        description: '大ダメージ突進。使用後1ターン行動不能',
        trigger: function(turnCount, enemy) { return turnCount % 4 === 0 && enemy.hp > 0; },
        damage: function(enemy) { return Math.floor(enemy.attack * 1.8); },
        self_stun: 1,
        message: 'ナンバー12は荷車ごと突っ込んできた！'
      },
      victory_flag: 'angura_boss_defeated'
    },

    // ── 第2章 ──────────────────────────────

    // ゴボウ牙主（爆根の長）
    gobouFang: {
      boss_id: 'gobouFang',
      passive: {
        id: 'underground_faith',
        description: '地中潜伏。2ターンに1回地面に潜り、攻撃が当たらない',
        apply: function(enemy, turnCount) {
          return turnCount % 2 === 0; // trueなら潜伏中
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.3; },
        action: function(enemy) {
          enemy.attack += 10;
          return '牙主は地表に飛び出した！「光が…痛ェ！だがもう逃げねェ！」';
        }
      },
      special_move: {
        id: 'root_eruption',
        name: '根の噴出',
        description: '地面から根が噴き出し、3ターン後に大ダメージ',
        trigger: function(turnCount) { return turnCount === 5 || turnCount === 10; },
        setup_turns: 3,
        damage: function(enemy) { return Math.floor(enemy.attack * 2.5); },
        message: '地面がひび割れ始めた…！（3ターン後に噴出！）'
      },
      victory_flag: 'gobou_fang_defeated'
    },

    // ── 第3章 ──────────────────────────────

    // 古谷（人間同士のリスペクト戦闘）
    furuyaBattle: {
      boss_id: 'furuyaBattle',
      passive: {
        id: 'mutual_respect',
        description: 'リスペクト戦闘。互いのダイス出目差で勝敗が決まる',
        apply: function(enemy, playerDiceTotal) {
          // 古谷も内部でダイスを振る
          var furuyaRoll = Math.floor(Math.random() * 6) + 1 +
                           Math.floor(Math.random() * 6) + 1;
          return { playerRoll: playerDiceTotal, furuyaRoll: furuyaRoll };
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.25; },
        action: function(enemy) {
          return '古谷「…ダイスには逆らえないか。お前の勝ちだ」';
        }
      },
      special_move: {
        id: 'lone_hack',
        name: '孤独のハック',
        description: 'プレイヤーのダイス1個の出目を強制的に1にする',
        trigger: function(turnCount) { return turnCount % 3 === 0; },
        effect: function(diceResults) {
          if (diceResults.length > 0) diceResults[0] = 1;
        },
        message: '古谷「俺は一人でやる。お前のダイスなんか要らない」'
      },
      victory_flag: 'furuya_battle_cleared'
    },

    // ── 第4章 ──────────────────────────────

    // 湯畑の守護者
    yubatake_guardian: {
      boss_id: 'yubatake_guardian',
      passive: {
        id: 'burning_spring',
        description: '毎ターン終了時、プレイヤーにやけどを付与する。やけど状態のプレイヤーは次ターン開始時に5ダメージを受ける。',
        apply: function(enemy, player) {
          if (!player) return;
          player.statusEffects = player.statusEffects || {};
          player.statusEffects.burn = {
            damage: 5,
            duration: 1
          };
        }
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.5 && !enemy._boilingForm;
        },
        action: function(enemy) {
          enemy._boilingForm = true;
          enemy.attack += 8;
          if (enemy.gimmick && enemy.gimmick.special_move) {
            enemy.gimmick.special_move.id = 'boiling_spray';
            enemy.gimmick.special_move.name = '熱湯噴射';
            enemy.gimmick.special_move.description = '沸騰形態の熱湯を噴き出し、大ダメージを与える';
            enemy.gimmick.special_move.message = '湯畑の守護者は沸騰した熱湯を噴き上げた！';
          }
          return '湯畑の守護者は沸騰形態へ変化した！ 攻撃力が大きく上がった！';
        }
      },
      special_move: {
        id: 'yunohana_burst',
        name: '湯の花爆発',
        description: '4ターンごとに湯の花を爆発させ、強烈なダメージを与える',
        trigger: function(turnCount, enemy) {
          return turnCount % 4 === 0;
        },
        damage: function(enemy) {
          return Math.floor(enemy.attack * 2);
        },
        message: '湯畑の守護者の湯の花爆発！ 灼熱の飛沫が襲いかかる！'
      },
      victory_flag: 'yubatake_defeated',
      bgm: 'ch4_kumako_battle',
      victory_bgm: 'ch4_victory',
      sfx: { phase_change: 'steam_hiss' },
      dialogue: {
        phase_change: [
          { speaker: '守護者', text: '湯畑の怒り…思い知れ…！' },
          { speaker: '主人公', text: '温度が急上昇してる…気をつけろ！' }
        ],
        special_move: [
          { speaker: '守護者', text: '全てを沸騰させよ…！' },
          { speaker: 'アカギ', text: '結界に同化させられるぞ！' }
        ],
        victory: [
          { speaker: '守護者', text: '…源泉が…静まる…' },
          { speaker: '主人公', text: '浄化の石…これでアカギを。' }
        ]
      }
    },

    // 熊子・湯煙形態（回復反転ギミック）
    kumako_steam: {
      boss_id: 'kumako_steam',
      passive: {
        id: 'heal_inversion',
        description: '回復反転結界。回復ダイス(H系)のHP回復がダメージに変わる',
        apply: function(healAmount) {
          return -healAmount;
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.5; },
        action: function(enemy) {
          enemy.defense += 5;
          return '熊子の輪郭が揺らぎ、液状に変わった！「痛い？ ならもっと溶けなさい」';
        }
      },
      special_move: {
        id: 'dissolving_embrace',
        name: '溶解の抱擁',
        description: '味方全体に中ダメージ＋回復封印2ターン',
        trigger: function(turnCount) { return turnCount % 3 === 0; },
        damage: function(enemy) { return Math.floor(enemy.attack * 1.2); },
        debuff: { type: 'heal_seal', turns: 2 },
        message: '熊子「温めてあげるわ♪ 全部、溶かしてあげる」'
      },
      victory_flag: 'kumako_steam_defeated',
      bgm: 'ch4_kumako_battle',
      victory_bgm: 'ch4_victory',
      sfx: { phase_change: 'steam_hiss' },
      dialogue: {
        phase_change: [
          { speaker: '熊子', text: 'まだまだ…もっと温めてあげる。' },
          { speaker: '主人公', text: '回復が毒になる…気をつけろ！' }
        ],
        special_move: [
          { speaker: '熊子', text: 'ぜーんぶ、ドロドロに溶けなさい♪' },
          { speaker: 'アカギ', text: '結界に同化させられるぞ！' }
        ],
        victory: [
          { speaker: '熊子', text: '…冷めちゃったわね。' },
          { speaker: '主人公', text: '浄化の石…これでアカギを。' }
        ]
      }
    },

    // ── 第5章 ──────────────────────────────

    // ジューク（学園）― ダイス封印＋減点ギミック
    juke_gakuen: {
      boss_id: 'juke_gakuen',
      passive: {
        id: 'rule_rewrite',
        description: '3ターンごとにプレイヤーの使えるダイスを1つ封印する。ただし最低1つは残る。',
        apply: function(enemy, player, turnCount) {
          if (!player || !turnCount || turnCount % 3 !== 0) return;
          player.sealedDice = player.sealedDice || [];
          var totalDice = player.diceCount || player.maxDice || 3;
          var usableDice = totalDice - player.sealedDice.length;
          if (usableDice <= 1) return;
          var candidates = [];
          for (var i = 0; i < totalDice; i++) {
            if (player.sealedDice.indexOf(i) === -1) {
              candidates.push(i);
            }
          }
          if (candidates.length === 0) return;
          var target = candidates[Math.floor(Math.random() * candidates.length)];
          player.sealedDice.push(target);
        }
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.4 && !enemy._finalRule;
        },
        action: function(enemy) {
          enemy._finalRule = true;
          enemy.defense = (enemy.defense || 0) + 10;
          if (typeof Game !== 'undefined' && Game.Battle && Game.Battle.player) {
            Game.Battle.player.sealedDice = [];
          }
          return 'ジューク学園は「最終ルール」を発動した！ すべての封印は解かれたが、防御力が上昇した！';
        }
      },
      special_move: {
        id: 'deduction_time',
        name: '減点タイム',
        description: '次のターン、プレイヤーのダイス出目がすべて半減する',
        trigger: function(turnCount, enemy) {
          return turnCount % 5 === 0;
        },
        damage: function(enemy) { return 0; },
        message: 'ジューク学園の減点タイム！ 次のターン、あらゆる出目が鈍る！'
      },
      victory_flag: 'juke_gakuen_defeated',
      bgm: 'ch5_juke_battle',
      victory_bgm: 'ch5_victory',
      sfx: { special_move: 'dice_roll_heavy' },
      dialogue: {
        phase_change: [
          { speaker: 'ジューク', text: '遊びは終わりだ、よそ者。' },
          { speaker: 'ジューク', text: '土地の掟、刻み込んでやるよ。' }
        ],
        special_move: [
          { speaker: 'ジューク', text: '出目なんて飾りだ。俺がルールだ！' },
          { speaker: '山川', text: 'ダイスの目が固定された！？' }
        ],
        victory: [
          { speaker: 'ジューク', text: 'チッ…今日はこの辺にしとくぜ。' },
          { speaker: '古谷', text: '逃げ足だけは速いヤツだ。' }
        ]
      }
    },

    // ── 第6章 ──────────────────────────────

    // 佐藤＆熊子・洗脳形態（二人羽織＋覚醒ギミック）
    sato_kumako_tunnel: {
      boss_id: 'sato_kumako_tunnel',
      passive: {
        id: 'two_person_act',
        description: 'HPが高いうちは二人で攻撃し攻撃力が1.5倍になる。弱ると佐藤が正気を取り戻し、攻撃力が元に戻る。',
        apply: function(enemy) {
          if (enemy.hp > enemy.maxHp * 0.6) {
            if (!enemy._duetBoostApplied) {
              enemy._baseAttack = enemy._baseAttack || enemy.attack;
              enemy.attack = Math.floor(enemy._baseAttack * 1.5);
              enemy._duetBoostApplied = true;
              enemy._returnedToNormal = false;
            }
          } else if (!enemy._returnedToNormal) {
            enemy._baseAttack = enemy._baseAttack || enemy.attack;
            enemy.attack = enemy._baseAttack;
            enemy._returnedToNormal = true;
          }
        }
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.35 && !enemy._satoAwakened;
        },
        action: function(enemy) {
          enemy._satoAwakened = true;
          enemy.defense = (enemy.defense || 0) + 15;
          enemy.selfDamagePerTurn = 5;
          return '佐藤が完全覚醒した！ 熊子をかばい、防御力が上昇した！ しかし毎ターン自滅していく！';
        }
      },
      special_move: {
        id: 'duet_of_despair',
        name: '絶望のデュエット',
        description: '5ターンごとに2回連続攻撃を行う。1回目は通常、2回目はattack×0.8。',
        trigger: function(turnCount, enemy) {
          return turnCount % 5 === 0;
        },
        damage: function(enemy) { return Math.floor(enemy.attack); },
        message: '佐藤＆熊子の絶望のデュエット！ 連続攻撃が襲いかかる！'
      },
      victory_flag: 'sato_kumako_defeated',
      bgm: 'ch6_sato_battle',
      victory_bgm: 'ch6_victory',
      sfx: { phase_change: 'train_echo' },
      dialogue: {
        phase_change: [
          { speaker: '佐藤', text: '俺のHPを削りきってくれ！' },
          { speaker: '熊子', text: 'お邪魔虫！記憶の核はもらうわ！' }
        ],
        special_move: [
          { speaker: '熊子', text: '次は終点〜！現実行きでーす♪' },
          { speaker: '主人公', text: '車窓の景色が…反転する！' }
        ],
        victory: [
          { speaker: '熊子', text: 'あーあ、路線が閉じちゃった。' },
          { speaker: '主人公', text: '佐藤！しっかりしろ！' },
          { speaker: '佐藤', text: '…俺はまだ、やれるさ。' }
        ]
      }
    },

    // 返声の番（6章中ボス）― 反響＋名前喰いギミック
    echo_guardian: {
      boss_id: 'echo_guardian',
      passive: {
        id: 'echo_reflect',
        description: 'プレイヤーが与えたダメージの20%を記録し、次ターンに跳ね返す。',
        apply: function(enemy, player, damageDealt) {
          if (typeof damageDealt !== 'number' || damageDealt <= 0) return;
          enemy._echoStoredDamage = Math.floor(damageDealt * 0.2);
        }
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.5 && !enemy._silentForm;
        },
        action: function(enemy) {
          enemy._silentForm = true;
          enemy._suppressMessages = true;
          return '返声の番は無言形態へ移行した……音が消えた。';
        }
      },
      special_move: {
        id: 'name_eater',
        name: '名前喰い',
        description: 'プレイヤーのダイス1つをランダムに選び、次ターンの出目を0にする',
        trigger: function(turnCount, enemy) {
          return turnCount % 3 === 0;
        },
        damage: function(enemy) { return 0; },
        message: '返声の番の名前喰い！ ひとつのダイスが沈黙した！'
      },
      victory_flag: 'echo_guardian_defeated',
      bgm: 'ch6_sato_battle',
      sfx: {},
      dialogue: {
        phase_change: [
          { speaker: '返声の番', text: '同ジ名前デ、二度越エルナ…' },
          { speaker: 'アカギ', text: '同じ奴が動くと反響するぞ！' }
        ],
        special_move: [
          { speaker: '返声の番', text: '過去ノ残響ニ、呑マレロ！' },
          { speaker: '主人公', text: '音が…記憶を揺さぶってくる！' }
        ],
        victory: [
          { speaker: '返声の番', text: '下ガル場所ナド…モウ…' },
          { speaker: '主人公', text: '進むしかないんだ。奥へ！' }
        ]
      }
    },

    // ── 第7章 ──────────────────────────────

    // 榛名の湖獣 ― 霧の加護＋湖底の咆哮ギミック
    haruna_lake_beast: {
      boss_id: 'haruna_lake_beast',
      passive: {
        id: 'mist_guard',
        description: '霧の加護により、ターン開始時5%の確率でプレイヤーの攻撃がミスになる。',
        apply: function(enemy, player) {
          if (enemy._mistDispersed) return;
          if (!player) return;
          player.statusEffects = player.statusEffects || {};
          player.statusEffects.mistBlind = {
            chance: 0.05,
            duration: 1
          };
        }
      },
      phase_change: {
        condition: function(enemy) {
          return enemy.hp <= enemy.maxHp * 0.45 && !enemy._mistDispersed;
        },
        action: function(enemy) {
          enemy._mistDispersed = true;
          enemy._waterForm = true;
          enemy.attackElement = 'water';
          enemy._applyWetEachTurn = true;
          return '榛名の湖獣の霧が晴れた！ 霧の加護は消えたが、水の力がむき出しになった！';
        }
      },
      special_move: {
        id: 'lakebed_howl',
        name: '湖底の咆哮',
        description: '次のターン、プレイヤーのダイスがすべて再度スピンし、出目が変わる',
        trigger: function(turnCount, enemy) {
          return turnCount % 4 === 0;
        },
        damage: function(enemy) { return 0; },
        message: '榛名の湖獣の湖底の咆哮！ ダイスの運命が揺らぎ始める！'
      },
      victory_flag: 'haruna_beast_defeated',
      bgm: 'ch7_beast_battle',
      victory_bgm: 'ch7_victory',
      sfx: { special_move: 'water_splash' },
      dialogue: {
        phase_change: [
          { speaker: '山川', text: '霧が晴れた…でも水圧が！' },
          { speaker: '湖獣', text: 'グルルォォォォ！' }
        ],
        special_move: [
          { speaker: '湖獣', text: '（湖面が大きく波立つ！）' },
          { speaker: 'アカギ', text: '来るぞ、踏ん張れ！' }
        ],
        victory: [
          { speaker: '湖獣', text: 'グルゥ……。' },
          { speaker: '山川', text: '霧が晴れていくわね。' }
        ]
      }
    },

    // ── 第8章 ──────────────────────────────

    // 尾瀬の泥異形 ― 毎ターン素早さ低下（slow蓄積）
    oze_mud_wraith: {
      boss_id: 'oze_mud_wraith',
      passive: {
        id: 'mud_sink',
        description: '毎ターン泥が足を引き、slowを付与',
        apply: function(enemy, turnCount, playerEffects) {
          addEffect(playerEffects, 'slow', 2, 2);
          if (turnCount % 2 === 0) {
            return '泥が足に絡みつく...動きが鈍る！';
          }
          return null;
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.3; },
        action: function(enemy) {
          enemy.attack += 8;
          return '泥異形が地中から巨体を引きずり出した！';
        }
      },
      special_move: {
        id: 'bottomless_mud',
        name: '底なしの泥',
        description: '大ダメージ＋1ターンスタン',
        trigger: function(turnCount) { return turnCount === 4 || turnCount === 8; },
        damage: function(enemy) { return Math.floor(enemy.attack * 1.4); },
        message: '泥の底に引きずり込まれる！'
      },
      bgm: 'ch8_mud_battle',
      victory_bgm: 'ch8_victory',
      sfx: { phase_change: 'mud_sink', special_move: 'mud_sink' },
      dialogue: {
        phase_change: [
          { speaker: '泥異形', text: '沈メ…記憶モロトモ…' },
          { speaker: '古谷', text: '足場が泥に！動きづらいぞ！' }
        ],
        special_move: [
          { speaker: '泥異形', text: '底無シノ泥ニ、抱カレヨ！' },
          { speaker: '主人公', text: '体が…泥に引きずり込まれる！' }
        ],
        victory: [
          { speaker: '泥異形', text: 'ポコッ…ブクブク…' },
          { speaker: '主人公', text: 'なんとか沈まずに済んだな。' }
        ]
      }
    },

    // ── 第9章 ──────────────────────────────

    // ジューク（水上） ― ダイス出目操作
    juke_minakami: {
      boss_id: 'juke_minakami',
      passive: {
        id: 'dice_rewrite',
        description: '偶数ターンにプレイヤーのダイスボーナスを封印',
        apply: function(enemy, turnCount, playerEffects) {
          if (turnCount > 0 && turnCount % 2 === 0) {
            // Remove any dice_bonus effects
            for (var i = playerEffects.length - 1; i >= 0; i--) {
              if (playerEffects[i].type === 'dice_bonus') {
                playerEffects.splice(i, 1);
              }
            }
            return 'ジュークが掟のダイスを振った！出目ボーナス封印！';
          }
          return null;
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.35; },
        action: function(enemy) {
          enemy.attack += 6;
          enemy.defense += 4;
          return 'ジューク「本気を出す…掟の力、見せてやる！」';
        }
      },
      special_move: {
        id: 'rule_dice',
        name: '掟のダイス',
        description: '固定ダメージ＋ダイスロック',
        trigger: function(turnCount) { return turnCount === 3 || turnCount === 7; },
        damage: function(enemy) { return 35; },
        self_stun: 0,
        message: 'ジュークの掟のダイスが炸裂した！'
      },
      bgm: 'ch9_juke_battle',
      victory_bgm: 'ch9_victory',
      sfx: { special_move: 'dice_shatter' },
      dialogue: {
        phase_change: [
          { speaker: 'ジューク', text: 'お前らの運命、書き換えてやる。' },
          { speaker: '古谷', text: '出目が偶数に固定されてる！？' }
        ],
        special_move: [
          { speaker: 'ジューク', text: '掟のダイス！全部書き換われ！' },
          { speaker: 'アカギ', text: '俺たちの意志まで奪う気か！' }
        ],
        victory: [
          { speaker: 'ジューク', text: 'また俺は…忘れられるのか。' },
          { speaker: '主人公', text: 'ジューク…お前は一体…' }
        ]
      }
    },

    // ── 第10章 ──────────────────────────────

    // 真・ジューク ― 2フェーズ最終ボス
    juke_final: {
      boss_id: 'juke_final',
      passive: {
        id: 'border_erosion',
        description: '毎ターン侵食ダメージ（2〜5）をプレイヤーに与える',
        apply: function(enemy, turnCount, playerEffects) {
          var erosionDmg = 2 + Math.floor(Math.random() * 4);
          var pd = Game.Player.getData();
          pd.hp -= erosionDmg;
          if (pd.hp < 1) pd.hp = 1;
          return '結界の侵食が体を蝕む！ ' + erosionDmg + 'ダメージ！';
        }
      },
      phase_change: {
        condition: function(enemy) { return enemy.hp <= enemy.maxHp * 0.5; },
        action: function(enemy) {
          // Swap to phase 2 sprite
          var e = enemies.juke_final;
          if (e.spritePhase2) {
            enemy.sprite = e.spritePhase2;
            enemy.palette = e.palettePhase2;
          }
          enemy.attack += 10;
          enemy.defense -= 5;
          enemy.name = '真・ジューク（覚醒）';
          return '境界線が反転した！真・ジュークが真の姿を現す！';
        }
      },
      special_move: {
        id: 'border_inversion',
        name: '侵食の境界線',
        description: '超大ダメージ＋回復封印',
        trigger: function(turnCount) { return turnCount === 5 || turnCount === 10 || turnCount === 15; },
        damage: function(enemy) { return Math.floor(enemy.attack * 1.5); },
        self_stun: 2,
        message: '真・ジューク「これが最後の掟だ…！」'
      },
      bgm: 'ch10_final_battle',
      victory_bgm: 'ch10_ending',
      sfx: { phase_change: 'reality_glitch', special_move: 'dice_shatter' },
      dialogue: {
        phase_change: [
          { speaker: 'ジューク', text: '俺の残響…全部乗せてやる！' },
          { speaker: '主人公', text: '結界が…現実と混ざっていく！' },
          { speaker: 'ジューク', text: '境界線ごと消え去れ、プレイヤー！' }
        ],
        special_move: [
          { speaker: 'ジューク', text: '侵食の境界線！全てを反転しろ！' },
          { speaker: '山川', text: '全ステータスがマイナスに！？' }
        ],
        victory: [
          { speaker: 'ジューク', text: '…終わったな。クソゲーが。' },
          { speaker: '主人公', text: 'お前のこと、忘れないよ。' },
          { speaker: 'ジューク', text: 'フッ…せいぜい生きろよ。' }
        ]
      }
    }
  };

  return {
    enemies: enemies,
    bossGimmicks: bossGimmicks,
    getEnemy: function(id) { return enemies[id]; },
    getGimmick: function(id) { return bossGimmicks[id]; }
  };
})();
