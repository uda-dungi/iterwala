import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { whatsappLink, site } from "@/config/site";

/** Floating WhatsApp support button — opens a chat with a pre-filled message. */
export function WhatsAppButton() {
  return (
    <motion.a
      href={whatsappLink(`Hi ${site.brand}, I'd like to know more about your fragrances.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200, damping: 18 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-5 right-5 z-[90] w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-luxury"
    >
      <MessageCircle className="w-7 h-7" fill="currentColor" strokeWidth={0} />
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
    </motion.a>
  );
}
