import SocialLinks from "@/components/SocialLinks";

export default function SocialDock() {
  return (
    <footer>
      <SocialLinks className="fixed right-8 bottom-6 z-50 hidden gap-4 transition-opacity duration-500 md:flex" />
    </footer>
  );
}
