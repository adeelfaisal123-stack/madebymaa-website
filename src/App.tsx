import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppLayout } from './components/AppLayout'
import { AboutPage } from './pages/AboutPage'
import { AllKitchensPage } from './pages/AllKitchensPage'
import { BlogDetailPage } from './pages/BlogDetailPage'
import { BlogPage } from './pages/BlogPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { ContactPage } from './pages/ContactPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { DishDetailPage } from './pages/DishDetailPage'
import { DishesPage } from './pages/DishesPage'
import { HomePage } from './pages/HomePage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { KitchenDetailPage } from './pages/KitchenDetailPage'
import { LoginPage } from './pages/LoginPage'
import { NearbyPage } from './pages/NearbyPage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { SellerSignupPage } from './pages/SellerSignupPage'
import { WishlistPage } from './pages/WishlistPage'
import { useLocationStore } from './stores'

export default function App() {
  useEffect(() => {
    void import('bootstrap/dist/js/bootstrap.bundle.min.js')
    void useLocationStore.getState().resolveLabel()
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="kitchens" element={<AllKitchensPage />} />
        <Route path="kitchens/:id" element={<KitchenDetailPage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<BlogDetailPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="dishes/:id" element={<DishDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route element={<AppLayout />}>
          <Route path="explore" element={<DiscoverPage />} />
          <Route path="nearby" element={<NearbyPage />} />
          <Route path="dishes" element={<DishesPage />} />
        </Route>
        <Route path="login" element={<LoginPage mode="login" />} />
        <Route path="register" element={<LoginPage mode="register" />} />
        <Route path="seller/signup" element={<SellerSignupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
