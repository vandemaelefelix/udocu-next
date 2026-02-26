import { useTranslations } from "next-intl";
import UdocuLogo from "@/components/UdocuLogo";

const NAV_ITEMS = ["about", "work", "contact", "blog"] as const;

export default function StickyNav() {
  const t = useTranslations("nav");

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
      <UdocuLogo className="h-10 w-auto" />
      <ul className="flex gap-8 font-helvetica text-xs font-medium uppercase tracking-widest">
        {NAV_ITEMS.map((item) => (
          <li key={item}>
            <a
              href={`#${item}`}
              className="transition-opacity hover:opacity-70"
            >
              {t(item)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
