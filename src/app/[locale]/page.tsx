import Image from "next/image";
import { useTranslations } from "next-intl";
import backgroundHero from "@/assets/images/background-hero.png";
import UdocuLogo from "@/components/UdocuLogo";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main>
      <section className="relative flex h-screen items-center justify-center">
        <Image
          src={backgroundHero}
          alt="background hero"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 w-fit text-center">
          <UdocuLogo className="w-full" color="var(--color-green-light)" />
          <p className="user-select-none mt-4 whitespace-nowrap font-serif text-[80px] font-bold leading-24 tracking-[0.019em] text-green-light">
            {t("tagline")}
          </p>
        </div>
      </section>
    </main>
  );
}
