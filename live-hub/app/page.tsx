'use client';
import dynamic from 'next/dynamic';

// Client-only: the whole hub is a live, clock-driven dashboard.
const HomeClient = dynamic(() => import('@/components/HomeClient'), { ssr: false });

export default function Page() {
  return <HomeClient />;
}
