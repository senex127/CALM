import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import GlobalTheme from './components/GlobalTheme';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OffersPage from './pages/OffersPage';
import OfferPage from './pages/OfferPage';
import AboutPage from './pages/AboutPage';
import MyReservationsPage from './pages/MyReservationsPage';

import AdminLayout from './pages/admin/AdminLayout';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminOffersPage from './pages/admin/AdminOffersPage';
import AdminOfferFormPage from './pages/admin/AdminOfferFormPage';
import AdminReservationsPage from './pages/admin/AdminReservationsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

export default function App() {
  return (
    <GlobalTheme>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/offres" element={<OffersPage />} />
          <Route path="/offres/:id" element={<OfferPage />} />
          <Route path="/a-propos" element={<AboutPage />} />

          <Route path="/mes-reservations" element={<ProtectedRoute><MyReservationsPage /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="offres" element={<AdminOffersPage />} />
            <Route path="offres/nouvelle" element={<AdminOfferFormPage />} />
            <Route path="offres/:offerId" element={<AdminOfferFormPage />} />
            <Route path="reservations" element={<AdminReservationsPage />} />
            <Route path="utilisateurs" element={<AdminUsersPage />} />
            <Route path="parametres" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
      </main>
      <BottomNav />
    </GlobalTheme>
  );
}
