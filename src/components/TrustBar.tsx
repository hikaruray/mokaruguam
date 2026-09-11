// The four claims directly under the hero.
//
// 🔴 Every one of them has to be true of the arrangement business, not the
// charter. The previous set was「グアム唯一の完全貸切ガイドチャーター」, a VELTRA
// ★4.8 badge, 日本語ガイド＋専用車 and 最大7名まで1台で — a service that ends
// 2026-09-30, and a rating earned by it.
//
// The badge is gone rather than reworded: it was a score for guided tours, and
// carrying it over to a booking service would attribute reviews to work we did
// not do. /reviews keeps those reviews, dated and attributed, which is the
// honest place for them.
export default function TrustBar() {
  return (
    <div className="bg-brand text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-8 gap-y-2 px-5 py-4 text-center text-sm font-medium">
        <div>
          <b className="font-bold">グアム在住</b>の日本人スタッフ
        </div>
        <div>
          <b className="font-bold">渡航前</b>から手配できます
        </div>
        <div>やり取りは日本語・メールだけ</div>
        <div>
          レストランは<b className="font-bold">取れなければ0円</b>
        </div>
      </div>
    </div>
  );
}
