import { Link, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappLink, site } from "@/config/site";

export default function OrderFailed() {
  const [params] = useSearchParams();
  const txnid = params.get("txnid");
  const reason = params.get("reason");

  return (
    <div className="container py-16 sm:py-24 md:py-32 text-center max-w-lg">
      <XCircle className="w-14 h-14 sm:w-20 sm:h-20 mx-auto text-destructive mb-4 sm:mb-6" strokeWidth={1.2} />
      <h1 className="font-display text-2xl sm:text-4xl md:text-5xl text-ivory">Payment Didn't Go Through</h1>
      <p className="text-sm sm:text-base text-muted-foreground mt-3">
        No amount has been charged. Your bag is safe — you can try again with the same or a different payment method.
      </p>
      {txnid && <p className="text-xs text-muted-foreground mt-4">Reference: <span className="text-primary">{txnid}</span></p>}
      {reason && <p className="text-xs text-muted-foreground mt-1">Reason: {reason}</p>}

      <div className="flex flex-wrap gap-4 justify-center mt-10">
        <Button asChild variant="luxury" size="lg"><Link to="/checkout">Try Again</Link></Button>
        <Button asChild variant="outline-gold" size="lg">
          <a href={whatsappLink("Hi Itrawala, my payment didn't go through — can you help?")} target="_blank" rel="noopener noreferrer">
            WhatsApp Support
          </a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-6">Or email us at {site.email}</p>
    </div>
  );
}
