import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingParticles } from "@/components/FloatingParticles";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { PopupAnnouncementModal } from "@/components/PopupAnnouncementModal";
import { ContactWidget } from "@/components/ContactWidget";

export default function StoreLayout({ children }) {
  return (
    <>
      <AnnouncementBanner />
      <PopupAnnouncementModal />
      <FloatingParticles />
      <Navbar />
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col relative z-10">
        {children}
      </main>
      <ContactWidget />
      <Footer />
    </>
  );
}
