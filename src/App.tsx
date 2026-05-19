import { useState } from 'react';
import Navbar from './components/layout/Navbar';
import HeroSection from './components/landing/HeroSection';
import SolutionsSection from './components/landing/SolutionsSection';
import FeaturesSection from './components/landing/FeaturesSection';
import IntegrationsSection from './components/landing/IntegrationsSection';
import TestimonialsSection from './components/landing/TestimonialsSection';
import PricingSection from './components/landing/PricingSection';
import CtaSection from './components/landing/CtaSection';
import Footer from './components/layout/Footer';
import DashboardSection from './components/dashboard/DashboardSection';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');

  return (
    <main className="bg-[var(--bg-page)] min-h-screen animate-fade-up" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      {currentView === 'landing' ? (
        <>
          <Navbar onStartDashboard={() => setCurrentView('dashboard')} />
          <HeroSection onStartDashboard={() => setCurrentView('dashboard')} />
          <SolutionsSection />
          <FeaturesSection />
          <IntegrationsSection />
          <TestimonialsSection />
          <PricingSection />
          <CtaSection />
          <Footer />
        </>
      ) : (
        <>
          <Navbar onStartDashboard={() => setCurrentView('dashboard')} isDashboard />
          <DashboardSection onBack={() => setCurrentView('landing')} />
          <Footer />
        </>
      )}
    </main>
  );
}
