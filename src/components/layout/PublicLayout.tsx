import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { EmailPopup } from "@/components/marketing/EmailPopup";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

/** Storefront shell — shop nav, footer, cart, and marketing overlays. */
export function PublicLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="min-h-[60vh]">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
      <EmailPopup />
    </>
  );
}
