Original prompt: そうだね。セーブできる村役場みたいなところで、そこらへんの説明を牧師にさせてみてもいいかもね。合言葉を伝えたうえで、つづきからもできると。でも、PCかわっちゃうとダメだったりするから、あいことばはかならずめもするようにとか。

- 2026-03-23: ハイブリッドセーブを実装予定。通常は localStorage、持ち運び用に「あいことば」。
- 2026-03-23: 現状の不具合として、タイトルの「つづきから」が slot 0 を見ており、save.js の 1..3 スロット仕様と不整合。
- 2026-03-23: 既存の field menu 拡張が js/ui.js と js/player.js に未コミットで入っているため、編集時に上書き注意。
- TODO: save.js に passphrase encode/decode と storyFlags の保存を追加。
- TODO: タイトルと村NPCの両方から使える save menu UI を追加。
- TODO: 前橋に記録役NPCを追加し、同一PC/ブラウザでの「つづきから」と、PC変更時の「あいことば」注意を説明させる。
- 2026-03-23: save.js を version 2 相当に拡張。通常セーブに storyFlags を追加し、合言葉の生成/復元を実装。
- 2026-03-23: タイトルを `はじめから / つづきから / あいことば / 実績` の4択に変更。`つづきから` の slot 0 バグを解消し、 slot 1..3 を使う流れにした。
- 2026-03-23: `js/save_menu.js` を新設。前橋の「記録の牧師」から記録帳を開けるようにし、説明文もゲーム内に追加。
- 2026-03-23: テスト用に `window.advanceTime` と `window.render_game_to_text` を main.js から公開。
- 2026-03-23: 検証結果
  - `node --check` は save/main/ui/story/maebashi/save_menu で通過。
  - Playwright でタイトル画面、前橋の記録帳UI、タイトルの `つづきから` スロット画面の描画を確認。
  - ブラウザ上の evaluate で `Game.Save.save(1)`, `Game.Save.load(1)`, `Game.Save.createPassphrase()`, `Game.Save.loadPassphrase(...)` の成功を確認。
