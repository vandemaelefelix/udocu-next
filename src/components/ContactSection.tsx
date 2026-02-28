import Image from "next/image";
import { useTranslations } from "next-intl";
import contactImage from "@/assets/images/contact-image.jpg";
import {
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
} from "@/components/SocialIcons";

export default function ContactSection() {
  const t = useTranslations("contact");

  return (
    <section
      id="contact"
      className="flex min-h-screen flex-col md:h-screen md:flex-row"
    >
      {/* Left: image with text overlay */}
      <div className="relative h-[45vh] w-full overflow-hidden md:h-auto md:w-3/5">
        <Image
          src={contactImage}
          alt="Contact"
          fill
          className="object-cover object-center"
          sizes="(max-width: 767px) 100vw, 60vw"
        />
        {/* "LET'S TALK" overlay */}
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-8 md:px-8 md:pb-12">
          <p
            className="font-posterman font-black uppercase leading-none"
            style={{ fontSize: "clamp(60px, 12vw, 180px)" }}
          >
            LET&apos;S
          </p>
          <p
            className="font-posterman font-black uppercase leading-none"
            style={{ fontSize: "clamp(60px, 12vw, 180px)" }}
          >
            TALK
          </p>
        </div>
      </div>

      {/* Right: contact details */}
      <div className="flex w-full flex-col justify-end px-6 pb-8 pt-8 md:w-2/5 md:px-12 md:pb-12 md:pt-0">
        <div>
          <h2
            className="mb-6 font-posterman font-black uppercase leading-none"
            style={{ fontSize: "clamp(28px, 3.5vw, 52px)" }}
          >
            {t("name")}
          </h2>
          <div className="space-y-1 font-serif text-[18px] leading-6.5">
            <p>
              <a
                href={`mailto:${t("email")}`}
                className="transition-opacity hover:opacity-70"
              >
                {t("email")}
              </a>
            </p>
            <p>
              <a
                href={`tel:${t("phone").replace(/\s/g, "")}`}
                className="transition-opacity hover:opacity-70"
              >
                {t("phone")}
              </a>
            </p>
          </div>
          <div className="mt-6 font-serif text-[18px] leading-6.5">
            <p>{t("addressLine1")}</p>
            <p>{t("addressLine2")}</p>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="transition-opacity hover:opacity-70"
            >
              <FacebookIcon width={28} height={28} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="transition-opacity hover:opacity-70"
            >
              <InstagramIcon width={28} height={28} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="transition-opacity hover:opacity-70"
            >
              <YouTubeIcon width={28} height={28} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
