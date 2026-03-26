# Gemini 敵の悲痛な一言 生成プロンプト

以下をそのまま Gemini に渡してください。

```text
あなたはインディーゲームのシニア・ナラティブデザイナーです。
私は「群馬県を異界化したピクセルアートのロードムービーRPG」を作っています。

このゲームの核は以下です。

- 切ない旅
- 土地への敬意
- 理解して通してもらう体験
- シュールさの奥にある、敵と土地の誇りと悲哀

いま欲しいのは、戦闘勝利後のリザルト画面や戦闘終了直後に一瞬だけ出す、
「敵の悲痛な一言」です。

重要なのは、
- 長い台詞ではない
- 1文だけ
- プレイヤーを笑わせるネタではなく、少し胸に刺さる余韻
- ただし重すぎず、ピクセルRPGのテンポを壊さない

世界観ルール:
- 敵は単なる悪ではない
- 土地の誇り、役目、忘れ去られた悲しみを背負っている
- プレイヤーは「倒した」というより「理解し、通してもらった」「鎮めた」感覚に近い

文体ルール:
- 各台詞は日本語で1文のみ
- 18〜36文字程度を目安にする
- 説明口調にしない
- ポエムになりすぎない
- 叫び、吐息、諦め、安堵、未練のどれかがにじむこと
- 「群馬」「観光」「県」などの単語を毎回むやみに入れない
- 似た言い回しを繰り返さない

出力形式:
- JSON だけを出力する
- 各 enemyId ごとに `resultLament` を1つ入れる
- 必要なら `tone` を短く1語で付ける

出力例:
{
  "enemy_id_here": {
    "resultLament": "……ようやく、終われるのか。",
    "tone": "安堵"
  }
}

今回生成してほしい enemyId は以下です。

- strayDaruma
- roadsideBandit
- steamMonkey
- konnyakuCrawler
- silkShade
- cabbageWisp
- echoShard
- mistBeastling
- mudWisp
- darumaMaster
- threadMaiden
- yubatake_guardian
- onsenMonkey
- ishidanGuard
- cabbage
- anguraGuard
- chuji
- anguraBoss
- kumako_steam
- juke_gakuen
- echo_guardian
- sato_kumako_tunnel
- haruna_lake_beast
- oze_mud_wraith
- juke_minakami
- juke_final

さらにルール:
- 雑魚敵は「一瞬で空気が変わる短さ」
- ボス敵は「誇りや役目がにじむ深さ」
- 儀式ボスは「倒された」ではなく「理解された」ニュアンスを少し混ぜる
- 同じ語尾を連発しない
- 「……」の使いすぎ禁止

最後に、自分で軽くチェックしてから出してください。
チェック項目:
- すべて1文か
- すべて18〜36文字程度か
- 似た台詞が並んでいないか
- ネタっぽく崩れていないか
- それぞれの敵の誇りと悲哀が少しでも違って見えるか
```

