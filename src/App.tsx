import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShopProvider } from "@/store/shop";
import { AuthProvider } from "@/store/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PixelPageView } from "@/components/analytics/PixelPageView";
import { PublicLayout } from "@/components/layout/PublicLayout";

// The core shopping funnel stays in the main bundle — these are the pages a shopper
// hits first and most, so a loading flash here would cost more than the bytes save.
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

// Everything else is code-split: secondary pages and the whole admin area download
// only when someone actually navigates there, instead of being parsed by every
// shopper on first paint.
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout").then(m => ({ default: m.AdminLayout })));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const OrderFailed = lazy(() => import("./pages/OrderFailed"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Orders = lazy(() => import("./pages/Orders"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Wholesale = lazy(() => import("./pages/Wholesale"));
const Policy = lazy(() => import("./pages/Policy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner
        theme="dark"
        position="top-center"
        toastOptions={{ className: "!bg-card !text-ivory !border-border" }}
      />
      <BrowserRouter>
        {/* Meta PageView on every client-side route change (SPA) */}
        <PixelPageView />
        <AuthProvider>
          <ShopProvider>
            <ErrorBoundary>
              {/* Fallback for the code-split routes above. Deliberately minimal — the
                  chunks are small and usually arrive in a frame or two, so a spinner
                  would flash more than it would reassure. */}
              <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <Routes>
                {/* Admin area — no storefront navbar, footer, cart, or marketing overlays */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route
                    index
                    element={<Navigate to="/admin/orders" replace />}
                  />
                  <Route path="login" element={<AdminLogin />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route
                    path="*"
                    element={<Navigate to="/admin/orders" replace />}
                  />
                </Route>

                {/* Public website */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order/success" element={<OrderSuccess />} />
                  <Route path="/order/failed" element={<OrderFailed />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/wholesale" element={<Wholesale />} />
                  <Route path="/privacy" element={<Policy kind="privacy" />} />
                  <Route path="/terms" element={<Policy kind="terms" />} />
                  <Route
                    path="/shipping"
                    element={<Policy kind="shipping" />}
                  />
                  <Route path="/returns" element={<Policy kind="returns" />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
              </Suspense>
            </ErrorBoundary>
          </ShopProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
