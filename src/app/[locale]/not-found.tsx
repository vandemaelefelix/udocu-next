import Link from "next/link";
import { useTranslations } from "next-intl";
import TapeSurface from "@/components/vhs/TapeSurface";
import { TAPE_PRESETS } from "@/components/vhs/presets";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center text-red-light">
      {/* Dead-channel backdrop. Sits behind the copy so nothing warps the text. */}
      <TapeSurface
        active
        params={TAPE_PRESETS.noSignal}
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ position: "fixed" }}
      />
      <h1 className="mb-4 font-posterman text-[72px] font-black leading-none md:text-[120px]">
        404
      </h1>
      <p className="mb-2 font-serif text-2xl font-semibold">{t("heading")}</p>
      <p className="mb-8 font-serif text-lg opacity-70">{t("description")}</p>
      <Link
        href="/"
        className="font-helvetica text-sm font-medium uppercase tracking-widest underline underline-offset-4 transition-opacity hover:opacity-70"
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
