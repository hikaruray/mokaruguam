import Link from "next/link";
import { LINE_URL } from "@/lib/config";

// Sticky bottom bar on mobile so the primary action is always reachable.
// Primary = booking request (brand orange, given more width). LINE is the
// secondary question channel (LINE green outline, narrower).
export default function MobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1.4fr] gap-2 border-t border-line bg-white/95 p-2.5 backdrop-blur md:hidden">
      <a
        href={LINE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-[#06c755] py-3 text-center text-sm font-medium text-[#06c755]"
      >
        質問はLINE
      </a>
      <Link
        href="/reserve"
        className="rounded-full bg-brand py-3 text-center text-sm font-bold text-white"
      >
        リクエスト予約・空き確認
      </Link>
    </div>
  );
}
