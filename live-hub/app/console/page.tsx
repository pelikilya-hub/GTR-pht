'use client';
import dynamic from 'next/dynamic';

const Console = dynamic(() => import('@/components/Console'), { ssr: false });
export default function ConsolePage() {
  return <Console />;
}
