import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShopProvider } from "@/store/shop";
import { AuthProvider } from "@/store/auth";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderFailed from "./pages/OrderFailed";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import Auth from "./pages/Auth";
import AdminOrders from "./pages/AdminOrders";
import AdminLogin from "./pages/AdminLogin";
import Quiz from "./pages/Quiz";
import Wholesale from "./pages/Wholesale";
import Policy from "./pages/Policy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" position="top-center" toastOptions={{ className: "!bg-card !text-ivory !border-border" }} />
      <BrowserRouter>
        <AuthProvider>
          <ShopProvider>
            <Routes>
              {/* Admin area — no storefront navbar, footer, cart, or marketing overlays */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/orders" replace />} />
                <Route path="login" element={<AdminLogin />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="*" element={<Navigate to="/admin/orders" replace />} />
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
                <Route path="/shipping" element={<Policy kind="shipping" />} />
                <Route path="/returns" element={<Policy kind="returns" />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </ShopProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
