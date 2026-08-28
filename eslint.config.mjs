import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  globalIgnores([
    ".next/**",
    ".artifacts/**",
    "coverage/**",
    "dist/**",
    "outputs/**",
    "playwright-report/**",
    "test-results/**",
    "tmp/**",
  ]),
]);
