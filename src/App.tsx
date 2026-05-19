import { useState } from 'react';
import Navbar from './components/layout/Navbar';
import HeroSection from './components/sections/HeroSection';
import SolutionsSection from './components/sections/SolutionsSection';
import FeaturesSection from './components/sections/FeaturesSection';
import IntegrationsSection from './components/sections/IntegrationsSection';
import TestimonialsSection from './components/sections/TestimonialsSection';
import PricingSection from './components/sections/PricingSection';
import CtaSection from './components/sections/CtaSection';
import Footer from './components/layout/Footer';
import DashboardSection from './components/sections/DashboardSection';

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
