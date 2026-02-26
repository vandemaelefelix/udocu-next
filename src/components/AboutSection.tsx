import Image from "next/image";
import { useTranslations } from "next-intl";
import tvBackground from "@/assets/images/tv-background-image.png";
import {
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
} from "@/components/SocialIcons";

export default function AboutSection() {
  const t = useTranslations("about");

  return (
    <section id="about" className="flex min-h-screen">
      <div className="relative w-3/5">
        <Image src={tvBackground} alt="" fill className="object-cover" />
      </div>
      <div className="flex w-2/5 flex-col px-12 py-24">
        <div className="my-auto max-w-[372px] pt-16">
          <h2 className="mb-10 font-posterman text-[74px] font-black leading-[88px]">
            {t("title")}
          </h2>
          <div className="space-y-6 font-serif text-[20px] font-normal leading-[22px]">
            <p>{t("paragraph1")}</p>
            <p>{t("paragraph2")}</p>
            <p>{t("paragraph3")}</p>
            <p>{t("paragraph4")}</p>
          </div>
          <a
            href="#contact"
            className="group mt-10 inline-flex items-center gap-2 font-helvetica text-[16px] font-medium uppercase leading-[20px] transition-opacity hover:opacity-70"
          >
            {t("contactLink")}{" "}
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </a>
        </div>
        <div className="flex justify-end gap-4">
          <FacebookIcon className="h-5 w-5 transition-opacity hover:opacity-70" />
          <InstagramIcon className="h-5 w-5 transition-opacity hover:opacity-70" />
          <YouTubeIcon className="h-5 w-5 transition-opacity hover:opacity-70" />
        </div>
      </div>
    </section>
  );
}
