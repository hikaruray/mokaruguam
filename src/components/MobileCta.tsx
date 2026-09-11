import Link from "next/link";

// Sticky bottom bar on mobile so the primary action is always reachable.
//
// 2026-09-11: this used to be a two-button bar — LINE on the left, booking on
// the right. LINE was removed with the pivot (email is the only channel now),
// so the bar is a single full-width action. See the note on LINE_URL in
// config.ts before re-adding a second button.
export default function MobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-2.5 backdrop-blur md:hidden">
      <Link
        href="/reserve"
        className="block rounded-full bg-brand py-3 text-center text-sm font-bold text-white"
      >
        手配を依頼する
      </Link>
    </div>
  );
}
