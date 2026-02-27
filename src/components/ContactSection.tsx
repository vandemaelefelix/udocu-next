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
    <section id="contact" className="flex h-screen">
      {/* Left: image with text overlay */}
      <div className="relative w-3/5 overflow-hidden">
        <Image
          src={contactImage}
          alt="Contact"
          fill
          className="object-cover object-center"
          sizes="60vw"
        />
        {/* "LET'S TALK" overlay */}
        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12">
          <p
            className="font-posterman font-black uppercase leading-none"
            style={{
              fontSize: "clamp(80px, 12vw, 180px)",
              color: "var(--color-orange-light)",
            }}
          >
            LET&apos;S
          </p>
          <p
            className="font-posterman font-black uppercase leading-none"
            style={{
              fontSize: "clamp(80px, 12vw, 180px)",
              color: "var(--color-orange-light)",
            }}
          >
            TALK
          </p>
        </div>
      </div>

      {/* Right: contact details */}
      <div className="flex w-2/5 flex-col justify-end px-12 pb-12">
        <div>
          <h2
            className="mb-6 font-posterman font-black uppercase leading-none"
            style={{
              fontSize: "clamp(28px, 3.5vw, 52px)",
              color: "var(--color-orange-light)",
            }}
          >
            {t("name")}
          </h2>
          <div
            className="space-y-1 font-serif text-[18px] leading-6.5"
            style={{ color: "var(--color-orange-light)" }}
          >
            <p>
              <a
                href={`mailto:${t("email")}`}
                className="hover:opacity-70 transition-opacity"
              >
                {t("email")}
              </a>
            </p>
            <p>
              <a
                href={`tel:${t("phone").replace(/\s/g, "")}`}
                className="hover:opacity-70 transition-opacity"
              >
                {t("phone")}
              </a>
            </p>
          </div>
          <div
            className="mt-6 font-serif text-[18px] leading-6.5"
            style={{ color: "var(--color-orange-light)" }}
          >
            <p>{t("addressLine1")}</p>
            <p>{t("addressLine2")}</p>
          </div>
          <div
            className="mt-6 flex items-center gap-4"
            style={{ color: "var(--color-orange-light)" }}
          >
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:opacity-70 transition-opacity"
            >
              <FacebookIcon width={28} height={28} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:opacity-70 transition-opacity"
            >
              <InstagramIcon width={28} height={28} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="hover:opacity-70 transition-opacity"
            >
              <YouTubeIcon width={28} height={28} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
