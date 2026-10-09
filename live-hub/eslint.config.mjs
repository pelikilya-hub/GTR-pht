import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored runtime (ported canvas/WebRTC custom elements, served as static assets).
    "public/vendor/**",
    // The Cloudflare Worker has its own tsconfig / lint surface.
    "worker/**", ".wrangler/**",
  ]),
]);

export default eslintConfig;
