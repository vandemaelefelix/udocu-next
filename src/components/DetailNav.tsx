import SiteNav from "@/components/SiteNav";

interface DetailNavProps {
  /** Key of the nav item to mark as active (underlined) */
  activeItem?: string;
  /** Explicit background color for the mobile overlay (CSS value or variable). Defaults to red-dark. */
  overlayBgColor?: string;
  /** Explicit text color for the mobile overlay (CSS value or variable). Defaults to red-light. */
  overlayTextColor?: string;
}

/**
 * The detail pages' nav: a sticky bar that inherits the page's colour scheme
 * and links back to the homepage's sections. The menu itself is `SiteNav`,
 * shared with the one-pager.
 */
export default function DetailNav({
  activeItem,
  overlayBgColor = "var(--color-red-dark)",
  overlayTextColor = "var(--color-red-light)",
}: DetailNavProps) {
  return (
    <SiteNav
      layout="sticky"
      sectionBehavior="navigate"
      activeItem={activeItem}
      overlayBgColor={overlayBgColor}
      overlayTextColor={overlayTextColor}
    />
  );
}
