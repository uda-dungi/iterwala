import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="container py-20 md:py-32 flex flex-col items-center justify-center text-center">
      <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Page Not Found</p>
      <h1 className="font-display text-6xl md:text-8xl text-ivory mt-4">404</h1>
      <p className="text-muted-foreground mt-4 max-w-md">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="gold-divider w-24 my-8" />
      <Button asChild variant="luxury" size="lg">
        <Link to="/">Return to Home</Link>
      </Button>
    </div>
  );
};

export default NotFound;
