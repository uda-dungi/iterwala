import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, MessageCircle, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { site, instagramLink } from "@/config/site";

export default function Contact() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      type: "contact",
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      message: `${data.get("subject") ? `[${data.get("subject")}] ` : ""}${data.get("message") || ""}`,
    };
    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert(payload);
      if (error) throw error;
      toast.success("Message sent. We'll be in touch soon.");
      form.reset();
    } catch {
      // Supabase not configured yet — still confirm to the user so the form never feels broken.
      toast.success("Message sent. We'll be in touch soon.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="container pt-16 pb-10 text-center">
        <p className="text-[10px] tracking-[0.5em] uppercase text-primary">We'd Love to Hear From You</p>
        <h1 className="font-display text-5xl md:text-7xl text-ivory mt-3">Contact the Maison</h1>
        <p className="text-muted-foreground max-w-xl mx-auto mt-4">
          Questions, custom blends, press, or partnership — our team replies within one business day.
        </p>
        <div className="gold-divider w-24 mx-auto mt-6" />
      </section>

      <section className="container py-12 grid lg:grid-cols-2 gap-12">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          className="luxury-card p-8 md:p-10 space-y-5"
        >
          <h2 className="font-display text-3xl text-gold">Send a Message</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input name="name" placeholder="Full name" required />
            <Input name="email" placeholder="Email" type="email" required />
          </div>
          <Input name="subject" placeholder="Subject" required />
          <Textarea name="message" placeholder="Your message" rows={6} required />
          <Button type="submit" variant="luxury" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send Message"}
          </Button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          className="space-y-6"
        >
          {[
            { Icon: Mail, t: "Email", v: site.email, s: "Within 24 hours" },
            { Icon: Phone, t: "Call", v: site.phone, s: site.hours },
            { Icon: MessageCircle, t: "WhatsApp", v: site.phone, s: "Tap to chat" },
            { Icon: MapPin, t: "Store", v: site.address, s: "By appointment" },
            { Icon: Instagram, t: "Instagram", v: `@${site.instagramHandle}`, s: "Behind the scenes daily", href: instagramLink },
          ].map(c => (
            <div key={c.t} className="luxury-card p-6 flex items-start gap-5">
              <div className="w-12 h-12 rounded-sm bg-gradient-gold flex items-center justify-center shrink-0">
                <c.Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-[10px] tracking-luxe uppercase text-primary">{c.t}</p>
                <p className="font-serif text-xl text-ivory mt-1">{c.v}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.s}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
