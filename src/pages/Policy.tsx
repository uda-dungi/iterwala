import { site } from "@/config/site";

type Kind = "privacy" | "terms" | "shipping" | "returns";

// Content mirrors the published policies at itrawala.in (Privacy Policy, Terms &
// Conditions, Shipping, Cancellation & Refund), adapted for this prepaid-only,
// PayU-powered storefront. Update here if the source pages change.
const content: Record<Kind, { title: string; eyebrow: string; body: { h: string; p: string }[] }> = {
  shipping: {
    eyebrow: "Delivery", title: "Shipping Policy",
    body: [
      { h: "Our Promise", p: "Our goal is to deliver your products in a timely, safe, and dependable manner. Below is everything you need to know about our delivery procedures and schedules." },
      { h: "Processing Orders", p: "With the exception of Sundays and public holidays, all confirmed (paid) orders are processed within 1–2 business days. You'll receive a confirmation email or SMS with tracking information as soon as your order ships." },
      { h: "Time of Shipping & Fees", p: `Standard delivery typically takes 3–7 business days depending on your location; rural or remote pin codes may take a little longer. Shipping is free on prepaid orders above ₹${site.freeShippingThreshold} — a flat fee applies below that, shown at checkout before you pay.` },
      { h: "Postponements", p: "Despite our best efforts to guarantee on-time delivery, there may occasionally be delays due to courier partner issues, unforeseen weather, or incorrect shipping information. We'll notify you of any delay we're aware of." },
      { h: "International Shipping", p: "We currently ship within India only. International delivery options are planned for a future update." },
      { h: "Incorrect Address / Failed Delivery", p: "It's the customer's responsibility to provide correct shipping information. Re-shipping fees may apply if a package is returned due to an inaccurate address or unsuccessful delivery attempts." },
      { h: "Need Assistance?", p: `For any questions about delivery or your order status, reach us at ${site.phone} or ${site.email}.` },
    ],
  },
  returns: {
    eyebrow: "Peace of Mind", title: "Cancellation & Refund Policy",
    body: [
      { h: "Our Commitment", p: "We want your buying experience with us to be seamless because we appreciate your trust. Please review this policy carefully before placing your order." },
      { h: "Cancellation of Order", p: `Order cancellations are accepted up to 24 hours after the order is placed, or before it is dispatched — whichever comes first. Contact us at ${site.phone} or ${site.email} to cancel. Orders cannot be cancelled once they're processed or shipped.` },
      { h: "Returns & Refunds", p: "We only accept returns for items delivered incorrectly, damaged, or defective. Please share unboxing photos or a video within 48 hours of delivery to raise a return — the item must be unused, unopened, and in its original packaging." },
      { h: "Refund Timeline", p: "Once approved, refunds are processed to the original PayU payment method within 7–10 business days. The exact time it reflects in your account depends on your bank or card issuer." },
      { h: "Non-Refundable Items", p: "Opened or used goods, products bought during sales/with discount codes (unless faulty), and personalised or modified products are not eligible for return or refund." },
      { h: "Reach Out to Us", p: `For any cancellation or refund query, contact us at ${site.phone} or ${site.email}.` },
    ],
  },
  privacy: {
    eyebrow: "Your Data", title: "Privacy Policy",
    body: [
      { h: "Our Commitment", p: `At ${site.brand}, your privacy and trust are extremely important to us. This policy outlines how we collect, use, and protect your personal information when you shop with us. By using our website, you agree to the practices described here.` },
      { h: "Information We Collect", p: "Personal information (name, email, phone, billing/shipping address); payment details processed securely via PayU (we never store your full card or bank details); order details and history; and website usage data such as IP address, browser type, and cookies." },
      { h: "How We Use It", p: "To process and deliver your orders, communicate order updates and — only with your consent — offers, provide customer support, improve our website and recommendations, and prevent fraud." },
      { h: "Sharing of Information", p: "We do not sell, trade, or rent your personal information. We only share data with trusted service providers (PayU for payments, courier partners for delivery, marketing tools) needed to fulfil your order, or when required by law." },
      { h: "Cookies & Tracking", p: "Our website uses cookies to enhance your browsing experience, remember preferences, and analyse performance. You can disable cookies in your browser, though some features may not work properly." },
      { h: "Data Security", p: "Payments are processed over secure, SSL-encrypted gateways via PayU — we do not store your card or bank details on our servers." },
      { h: "Your Rights", p: "You may access, update, or correct your information; request deletion of your account/data (except where retention is legally required); and opt out of marketing emails anytime." },
      { h: "Third-Party Links", p: "Our website may link to third-party sites. We aren't responsible for their privacy practices — please review their policies separately." },
      { h: "Contact", p: `For any privacy request, write to ${site.email} or call ${site.phone}.` },
    ],
  },
  terms: {
    eyebrow: "The Fine Print", title: "Terms of Service",
    body: [
      { h: "General", p: `Welcome to ${site.brand}. By accessing or purchasing from our website you agree to be bound by these terms. "We/our/us" refers to ${site.brand}; "you/customer" refers to the person using our site. You confirm you are at least 18, or have parental/guardian consent.` },
      { h: "Products & Services", p: `${site.brand} specialises in handcrafted perfumes, attars, and fragrance products. Product images are for illustration — actual packaging may vary slightly. All products are for external use only; avoid contact with eyes or ingestion.` },
      { h: "Pricing & Payments", p: "All prices are listed in INR, inclusive/exclusive of applicable taxes as shown at checkout. We reserve the right to update prices and offers without prior notice. Every order is prepaid — payment is completed securely via PayU before dispatch." },
      { h: "Shipping & Delivery", p: `We aim to dispatch orders within 2–5 business days of purchase. Delivery timelines may vary by location, courier partner, and unforeseen circumstances; see our Shipping Policy for details. ${site.brand} isn't liable for delays beyond our control.` },
      { h: "Returns, Refunds & Cancellations", p: "Due to the nature of personal-care products, returns/exchanges aren't accepted once a product is opened or used. Unopened, sealed products may be returned within 7 days of delivery in original condition. Approved refunds are processed within 7–10 business days. Cancellations are only accepted before an order is dispatched — see our Cancellation & Refund Policy." },
      { h: "Intellectual Property", p: `All content, logos, product names, designs and visuals on our website and social media are the intellectual property of ${site.brand}. Reproduction or unauthorised use without prior permission is strictly prohibited.` },
      { h: "Limitation of Liability", p: `${site.brand} isn't responsible for allergic reactions or side effects from product misuse — we recommend a patch test before full application. We aren't liable for indirect or consequential damages arising from product use.` },
      { h: "User Responsibilities", p: "Customers must provide accurate, complete details when ordering. Misuse of our website, fraudulent activity, or false information may result in order cancellation and legal action." },
      { h: "Privacy", p: "Your personal information is kept secure and used only to process orders — see our full Privacy Policy for details." },
      { h: "Governing Law", p: "These Terms are governed by the laws of India. Disputes fall under the exclusive jurisdiction of the courts in Deoli, Rajasthan." },
      { h: "Changes to Terms", p: `${site.brand} may modify these Terms at any time. Continued use of our site after changes constitutes acceptance of the updated terms.` },
      { h: "Contact", p: `${site.address} · ${site.email} · ${site.phone}` },
    ],
  },
};

export default function Policy({ kind }: { kind: Kind }) {
  const c = content[kind];
  return (
    <div className="container py-8 md:py-16 max-w-3xl">
      <div className="text-center mb-6 md:mb-12">
        <p className="text-[10px] tracking-[0.5em] uppercase text-primary">{c.eyebrow}</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-6xl text-ivory mt-3">{c.title}</h1>
        <div className="gold-divider w-24 mx-auto mt-4 sm:mt-6" />
      </div>
      <div className="space-y-6 md:space-y-8">
        {c.body.map(s => (
          <div key={s.h}>
            <h2 className="font-serif text-xl sm:text-2xl text-ivory">{s.h}</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-2">{s.p}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-8 md:mt-12 pt-6 border-t border-border">
        Last updated July 2026. For questions, contact {site.email} or {site.phone}.
      </p>
    </div>
  );
}
