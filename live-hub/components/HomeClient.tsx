'use client';
import { HubProvider } from '@/lib/HubContext';
import { VendorScripts } from '@/components/VendorScripts';
import { Boot } from '@/components/Boot';
import { Toast } from '@/components/Toast';
import { Topbar } from '@/components/Topbar';
import { AuthModal } from '@/components/AuthModal';
import { Hero } from '@/components/Hero';
import { Dashboard } from '@/components/Dashboard';
import { Logbook } from '@/components/Logbook';
import { Timeline } from '@/components/Timeline';
import { Tiers } from '@/components/Tiers';
import { Scales } from '@/components/Scales';
import { Crew } from '@/components/Crew';
import { GtrReality } from '@/components/GtrReality';
import { ContentLines } from '@/components/ContentLines';
import { Places } from '@/components/Places';
import { Invite } from '@/components/Invite';
import { Sponsors } from '@/components/Sponsors';
import { AudioBar } from '@/components/AudioBar';
import { Footer } from '@/components/Footer';

// The whole hub is a live, per-second-changing dashboard (countdown, GPS,
// donation totals) with no SEO value in server-rendered numbers — so it
// renders client-only (app/page.tsx loads it with ssr:false).
export default function HomeClient() {
  return (
    <HubProvider>
      <VendorScripts />
      <div style={{ minHeight: '100vh', background: '#0B0B0C', color: '#ECE9E4', fontFamily: "'Golos Text',sans-serif" }}>
        <Boot />
        <Toast />
        <Topbar />
        <AuthModal />
        <Hero />
        <Dashboard />
        <Logbook />
        <Timeline />
        <Tiers />
        <Scales />
        <Crew />
        <GtrReality />
        <ContentLines />
        <Places />
        <Invite />
        <Sponsors />
        <AudioBar />
        <Footer />
      </div>
    </HubProvider>
  );
}
