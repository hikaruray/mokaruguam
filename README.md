# Mokaru Guam — 新サイト（Next.js + Vercel）

グアム完全貸切ガイドチャーター「Mokaru Guam」のリニューアルサイト。
承認済みプロトタイプ（`../site-prototype/index.html`）を Next.js 16 + Tailwind でコンポーネント化したもの。

> ⚠️ 現段階は **ローカル開発／レビュー用**。git push・本番デプロイ・DNS切替はしていません（オーナー承認後）。

---

## セットアップ & 起動（ローカル）

前提: Node.js 20 以上。

```bash
cd MokaruGuam/site
npm install
npm run dev
```

- サイト: http://localhost:3000
- 予約管理（Admin）: http://localhost:3000/admin （ローカルではパスワード不要）

本番相当のビルド確認:

```bash
npm run build
npm run start
```

---

## この段階でできること（実装済み）

- **トップページ**（プロトタイプ準拠）: ヒーロー / 信頼バー / 選ばれる理由 / 料金 / 人気スポット / お客様の声 / 動画 / リクエスト予約 / フッター、スマホ追従CTA。
- **下層ページ**:
  - `/plans` 料金・プラン詳細（各プラン・含む/含まない・繁忙期料金表・1人あたり表示）
  - `/faq` よくある質問（`operations.md`の実問い合わせ準拠、FAQPage の JSON-LD 構造化データ入り）
  - `/spots` 人気スポット一覧 ＋ `/spots/[slug]` 各スポット個別（7スポット、SSGで事前生成、「グアム ○○」SEO狙い）
  - `/reviews` お客様の声（仮文面＋「※掲載許諾確認中」注記、トップと整合）
  - 各ページに「リクエスト予約」導線、共通ヘッダー/フッター/CTA、内部リンク（トップ⇄下層）を整備。
- **写真動画リッチ×軽量**: `next/image`（AVIF/WebP自動・レスポンシブ・遅延読込、ヒーローのみ優先）、CLS対策、動画はクリック再生の軽量埋め込み枠。
- **料金の1人あたり動的表示**: 人数スライダーで per-person を即時計算（数字は `pricing.md` 準拠）。
- **リクエスト予約フォーム → 保存層**: 申込を保存（env未設定時はローカルJSON `.data/db.json`、本番はSupabase）。受付メールはResend、未設定時はサーバーログにフォールバック。
- **PayPal決済（仮押さえ→確定）**: `booking-payment-design.md` 準拠。intent=AUTHORIZE でカード（PayPalアカウント不要のAdvanced Card Fields）または PayPalボタンで**仮押さえ**→ Admin「確定」で**capture（決済確定）**／「お断り」で**void（解除）**。金額はサーバー側で `pricing.ts` から算出・検証（クライアント供給額は信用しない）。秘密鍵はサーバーのみ。**PayPal env 未設定時は決済なしのリクエストのみ**として動作。
  - Admin のキャンセル時 refund は枠のみ（今後対応）。
  - ⚠️ 本番前に **`supabase-bookings-paypal.sql` の ALTER をSupabaseで実行**（`payment` / `paypal_order_id` / `paypal_authorization_id` 列を追加）。未実行だと保存でエラーになる。
- **簡易Admin**: リクエスト一覧・確定(capture)/お断り(void)/キャンセルの状態管理＋支払い状態バッジ。`/admin` はBasic認証で保護（env `ADMIN_PASSWORD`、本番で未設定ならロック）。
- **SEO**: title/description/OGP（日本語）、robots.ts、sitemap.ts、モバイルファースト。

## まだ実装していないもの（意図的）

- **PayPal 本番（Live）**: 現在は Sandbox 鍵で動作。Live鍵への切替＋DNS/デプロイはオーナー承認後。
- **キャンセル時の返金（refund）**: `lib/paypal.ts` に `refundCapture` を用意済み。Admin操作に接続するのは今後。
- **実写真・実動画**: いまは全て仮画像（picsum.photos）。差し替えは `src/lib/images.ts` の1ファイルで完結する設計。
- **実メール送信**: `RESEND_API_KEY` 未設定のためコンソール記録。
- **VELTRA実口コミ**: 掲載許諾確認までダミー文＋「※掲載許諾確認中」注記。
- **英語版**: 当面日本語のみ。文言はコンポーネントに集約しており英語化しやすい構造。

---

## 環境変数

`.env.example` を `.env.local` にコピーして設定（すべて未設定でもローカルは動作）。

| 変数 | 用途 | 未設定時 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | OGP/リンクの絶対URL | localhost |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | 予約の本番保存 | ローカルJSON |
| `RESEND_API_KEY` | 受付メール送信 | コンソール記録 |
| `ADMIN_PASSWORD` | Admin のBasic認証 | 本番はロック（devは不要） |

---

## 本番化にあたりオーナーからいただきたいもの

1. **本番用の写真・動画**（ヒーロー、人気スポット各種、ツアー紹介動画のYouTube ID）。
2. **VELTRA口コミの転載可否**（掲載してよいレビュー・表記ルール）。
3. **LINE公式アカウントの正式URL**、**VELTRA掲載ページの正式URL**（現状はプレースホルダ）。
4. **Vercel / Supabase / Resend のアカウント作成・支払い設定**、ドメイン `mokaruguam.com` の **DNS切替**（不可逆・要承認）。
5. **Stripe** の本番キー（審査通過後）。
6. Googleアナリティクス／サーチコンソールの設定。

## 構成

```
src/
  app/
    layout.tsx          ルート（フォント・メタ・OGP）
    page.tsx            トップページ（各セクションを組み立て）
    globals.css         Tailwind + ブランドトークン
    robots.ts, sitemap.ts
    api/
      booking/route.ts        リクエスト予約の受付（保存→メール）
      admin/booking/route.ts  確定/お断り/キャンセル
    admin/
      page.tsx                予約管理ダッシュボード
      BookingActions.tsx      承認/却下/キャンセルボタン（client）
  components/           Header, Hero, TrustBar, Strengths, Pricing,
                        Spots, Reviews, VideoSection, Booking,
                        BookingForm, Footer, MobileCta, Section
  lib/
    store.ts            予約保存（Supabase ↔ ローカルJSON）
    supabase.ts         Supabaseクライアント（server-only）
    config.ts           サイト設定・連絡先・URL
    pricing.ts          料金データ（pricing.md準拠）+ 計算関数
    images.ts           画像ソース（本番差し替えはここだけ）
  proxy.ts              Admin のBasic認証（Next.js 16 proxy規約）
```
