# UsefulTools

日常生活や学習などで役立つ、ブラウザで使える便利なツール集です。

会員登録やアプリのインストールを必要とせず、Webブラウザからすぐに利用できることを目指して開発しています。

## Features

- **ツール一覧・検索** — 登録されたツールを一覧表示し、検索できます。
- **サイドバー** — ツールへの移動、お気に入り、閲覧履歴にアクセスできます。
- **お気に入り・閲覧履歴** — 利用者のブラウザ内に保存します。
- **設定** — ライト／ダーク／システム設定に合わせたテーマと、アクセントカラーを変更できます。
- **データ管理** — 設定・お気に入り・履歴のバックアップ（JSON）のエクスポート／インポートに対応しています。
- **レスポンシブ UI** — PC・スマートフォンの画面サイズに合わせて表示を調整します。
- **SPA ナビゲーション** — ページ全体を再読み込みせずにツール間を移動できます。

### Available tools

| Tool | Description |
| --- | --- |
| 進数・基数変換ツール | 2進数・8進数・10進数・16進数などの進数を相互に変換するツール |
| メディアプレイヤー | 端末内の音声・動画ファイルをブラウザ上で再生するプレイヤー |

## Project structure

主なディレクトリとファイルの役割です。

```text
UsefulTools/
├── codes/                         # Webサイト本体
│   ├── index.html                 # トップページ
│   ├── assets/
│   │   ├── manifest.json          # Webアプリマニフェスト
│   │   ├── tools.json             # ツールの登録情報
│   │   ├── scripts/
│   │   │   ├── load.js            # 共通機能・依存関係の初期化
│   │   │   ├── router.js          # SPAルーター
│   │   │   └── tools.js           # ツール共通 UI・お気に入り等
│   │   └── styles/
│   │       ├── variable.css       # カラーテーマ・CSS変数
│   │       ├── common.css         # 共通レイアウト・スタイル
│   │       ├── tools.css          # ツールページ共通スタイル
│   │       └── page/              # ページ単位のスタイル
│   ├── components/
│   │   ├── header.js              # 共通ヘッダー
│   │   ├── sidebar.js             # サイドバー
│   │   ├── collapse.js            # アコーディオン
│   │   ├── modal.js               # モーダル
│   │   ├── search.js              # ツール検索
│   │   └── settings.js            # 設定・データ管理
│   ├── managers/
│   │   └── modals.js              # モーダルの生成・管理
│   └── tools/
│       ├── base-converter/
│       │   ├── index.html
│       │   ├── script.js
│       │   └── style.css
│       └── media-player/
│           ├── index.html
│           ├── script.js
│           ├── style.css
│           └── media-engine.js
└── default-tool.html              # ツールページの HTML テンプレート
```

※上記は主要なファイルを抜粋した構成です。細かなファイルや追加されたツールはリポジトリ内を確認してください。

## How it works

### Tool registry

ツールの情報は `codes/assets/tools.json` で管理します。各ツールには主に次の情報を登録します。

- `id` — ツールを識別する ID
- `title` — 表示名
- `description` — ツールの説明
- `url` — ツールページの URL
- `icon` — 表示するアイコン名

新しいツールを追加するときは、ツール用ディレクトリを作成し、`tools.json` に登録します。既存ツールの HTML・JavaScript・CSS の構成を参考にしてください。

### Common components

共通 UI は Web Components として実装しています。ヘッダー、サイドバー、検索、設定、アコーディオン、モーダルなどをページ間で再利用します。

### Navigation

`codes/assets/scripts/router.js` がページ遷移を管理します。ページごとの CSS とスクリプトを切り替え、HTML のキャッシュやスクロール位置も管理します。

### Local data

お気に入り・閲覧履歴・設定などのデータは IndexedDB に保存します。データベース操作には [LibDB](https://github.com/YSAS4331/LibDB) を利用しています。データは基本的に利用者のブラウザ内に保存されます。

## Technologies

- HTML
- CSS
- JavaScript (ES Modules)
- Web Components
- IndexedDB
- [Lucide](https://lucide.dev/) — アイコン
- [LibDB](https://github.com/YSAS4331/LibDB) — IndexedDB 操作ライブラリ

## Development

このリポジトリには、現時点で npm などのパッケージマネージャーを使ったビルド手順はありません。サイト本体は `codes/` 以下の静的ファイルで構成されています。

ローカルで確認する場合は、`codes/` をドキュメントルートとして静的ファイルサーバーから配信してください。各ページは `/assets/` などのルート相対パスを使用しているため、サブディレクトリではなくサイトのルートとして配信する必要があります。

## Data and privacy

お気に入り、閲覧履歴、設定などはブラウザの IndexedDB に保存されます。ブラウザのデータを削除した場合、これらのローカルデータも失われる可能性があります。必要に応じて設定画面からバックアップをエクスポートしてください。

## License

ライセンスはリポジトリ内のライセンス表記を確認してください。
