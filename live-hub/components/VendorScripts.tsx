'use client';
import Script from 'next/script';

// Ports of the prototype's self-contained canvas/WebRTC custom elements.
// Each file guards its own customElements.define(...) call.
export function VendorScripts() {
  return (
    <>
      <Script src="/vendor/gtr-deity.js" strategy="afterInteractive" />
      <Script src="/vendor/gtr-matrix-photo.js" strategy="afterInteractive" />
      <Script src="/vendor/gtr-rtc.js" strategy="afterInteractive" />
    </>
  );
}
