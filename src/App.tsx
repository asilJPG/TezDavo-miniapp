import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/layout/Layout";
import { Splash } from "./components/ui/Splash";
import { useTelegramInit } from "./hooks/useTelegramInit";
import { useAuthStore } from "./store";

// Pages
import { HomePage } from "./pages/Home";
import { SearchPage } from "./pages/Search";
import { MedicinePage } from "./pages/Medicine";
import { PharmaciesPage } from "./pages/Pharmacies";
import { PharmacyDetailPage } from "./pages/PharmacyDetail";
import { CartPage } from "./pages/Cart";
import { OrdersPage } from "./pages/Orders";
import { OrderDetailPage } from "./pages/OrderDetail";

import { ProfilePage } from "./pages/Profile";

export default function App() {
  useTelegramInit();
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <Splash />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/medicine/:id" element={<MedicinePage />} />
          <Route path="/pharmacies" element={<PharmaciesPage />} />
          <Route path="/pharmacy/:id" element={<PharmacyDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            fontFamily: "Onest, sans-serif",
            fontSize: 14,
            borderRadius: 12,
          },
        }}
      />
    </BrowserRouter>
  );
}
