import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader2, LogOut, Package, ShieldCheck } from "lucide-react";
import { useAuth } from "@/store/auth";
import { isAdminEmail } from "@/config/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

const navItems = [
  { to: "/admin/orders", label: "Orders", icon: Package },
];

export function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/admin/login";
  const isAdmin = isAdminEmail(user?.email);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isLoginPage) {
    if (isAdmin) return <Navigate to="/admin/orders" replace />;
    return (
      <>
        <ScrollToTop />
        <Outlet />
      </>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full luxury-card p-8 text-center">
          <ShieldCheck className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl text-ivory">Access Denied</h1>
          <p className="text-muted-foreground mt-3 text-sm">
            This area is restricted to Itrawala administrators.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button variant="outline-gold" onClick={() => navigate("/")}>Back to Website</Button>
            <Button variant="luxury" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <ScrollToTop />
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card/50">
        <div className="p-6 border-b border-border">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Itrawala</p>
          <h1 className="font-display text-xl text-ivory mt-1">Admin Panel</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-ivory hover:bg-background/60"
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground truncate mb-3">{user.email}</p>
          <Button variant="outline-gold" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-primary">Admin</p>
            <p className="font-display text-lg text-ivory">Orders</p>
          </div>
          <Button variant="outline-gold" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
