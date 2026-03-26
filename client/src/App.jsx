import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { PrivateRoute, PublicRoute } from './components/RouteGuards';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';

import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/Overview';
import Campaigns from './pages/Campaigns';
import CampaignBuilder from './pages/CampaignBuilder';
import EditCampaign from './pages/EditCampaign';
import Domains from './pages/Domains';
import Contacts from './pages/Contacts';
import Analytics from './pages/Analytics';
import EmailValidation from './pages/EmailValidation';
import ApiKeys from './pages/ApiKeys';
import Billing from './pages/Billing';
import Settings from './pages/Settings';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Transactions from './pages/admin/Transactions';
import SystemCampaigns from './pages/admin/SystemCampaigns';
import GlobalSettings from './pages/admin/GlobalSettings';
import Plans from './pages/admin/Plans';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' },
        }}
      />
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public routes — redirect to /dashboard if already logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Protected routes — all share the dashboard layout */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/new" element={<CampaignBuilder />} />
            <Route path="/campaigns/:id/edit" element={<EditCampaign />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/domains" element={<Domains />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/validation" element={<EmailValidation />} />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/transactions" element={<Transactions />} />
            <Route path="/admin/campaigns" element={<SystemCampaigns />} />
            <Route path="/admin/plans" element={<Plans />} />
            <Route path="/admin/settings" element={<GlobalSettings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
