import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="bg-ink text-[#cdd6d8]">
      <div className="mx-auto max-w-5xl px-5 py-11 text-sm">
        <div className="flex flex-wrap justify-between gap-5">
          <div>
            <div className="text-xl font-bold text-white">
              Mokaru<span className="text-brand"> Guam</span>
            </div>
            <p className="mt-2 max-w-xs">
              グアム唯一の完全貸切ガイドチャーター。あなただけの1日を、日本語ガイドと専用車で。
            </p>
          </div>
          <div>
            <p className="mb-1.5 font-bold text-white">メニュー</p>
            <p><Link href="/plans" className="hover:text-white">料金・プラン</Link></p>
            <p><Link href="/spots" className="hover:text-white">人気スポット</Link></p>
            <p><Link href="/reviews" className="hover:text-white">お客様の声</Link></p>
            <p><Link href="/faq" className="hover:text-white">よくある質問</Link></p>
          </div>
          <div>
            <p className="mb-1.5 font-bold text-white">ご予約・ご案内</p>
            <p><Link href="/reserve" className="hover:text-white">リクエスト予約</Link></p>
            <p><Link href="/guide" className="hover:text-white">予約の流れ・キャンセル</Link></p>
            <p><Link href="/about" className="hover:text-white">会社案内</Link></p>
          </div>
          <div>
            <p className="mb-1.5 font-bold text-white">お問い合わせ</p>
            <p>{CONTACT_EMAIL}</p>
            <p>LINE公式アカウント</p>
            <p>VELTRA でも予約受付中</p>
          </div>
        </div>
        <div className="mt-6 border-t border-[#333c3f] pt-4 text-xs text-[#8a9497]">
          © {new Date().getFullYear()} Mokaru Guam. Next.js + Vercel。
        </div>
      </div>
    </footer>
  );
}
