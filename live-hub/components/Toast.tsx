'use client';
import { useHub } from '@/lib/HubContext';

export function Toast() {
  const { toast } = useHub();
  if (!toast) return null;
  return (
    <div style={{ position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 1500, background: '#18181B', border: '1px solid #E5372C', color: '#ECE9E4', fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, padding: '12px 18px', boxShadow: '0 8px 30px rgba(0,0,0,.6)', maxWidth: '90vw', textAlign: 'center' }}>
      {toast}
    </div>
  );
}
