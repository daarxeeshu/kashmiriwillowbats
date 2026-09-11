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
    "scripts/**",
    /* Third-party build output served as static assets, not source we maintain.
       `public/configurator/draco/draco_wasm_wrapper.js` is Google's compiled Draco
       decoder — 6 lint errors in generated code nobody is going to hand-edit, which
       is exactly the noise that trains people to ignore a red lint run. */
    "public/**",
    /* One-off measurement scripts kept for reference, not shipped and not imported
       by anything in `app/` or `components/`. */
    ".analysis/**",
  ]),
]);

export default eslintConfig;
