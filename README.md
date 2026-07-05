# QuadAttribute

4つの属性を持つコマを4×4の盤面に並べる2人用ボードゲーム PWA。

## デプロイ先

- **GitHub Pages**: https://oshun5292.github.io/quad-attribute-game/
- **リポジトリ**: https://github.com/oshun5292/quad-attribute-game

`main` ブランチに push すると GitHub Pages に自動デプロイされます。

## 開発

```bash
npm install
npm test
```

## バージョン更新の手順

1. `sw.js` の `CACHE_VERSION` を +1 する
2. `main` に push する
3. ユーザーのスマホでは更新バナーが表示され、タップでリロードされる
