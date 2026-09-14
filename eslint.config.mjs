import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  // eslint-config-next@16 no longer registers the react-hooks plugin for the
  // flat config, so the rule reference below failed to resolve. Register it
  // explicitly (the package ships with eslint-config-next already).
  plugins: { "react-hooks": reactHooks },
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "warn",

    
    // React rules
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    
    // Next.js rules - no-img-element disabled pending next/image migration
    "@next/next/no-img-element": "off",
    
    // General JavaScript rules
    "prefer-const": "warn",
    "no-console": "off",
    "no-debugger": "warn",
    "no-empty": "warn",
    "no-irregular-whitespace": "warn",
    "no-case-declarations": "warn",
    "no-fallthrough": "warn",
    "no-mixed-spaces-and-tabs": "warn",
    "no-useless-escape": "warn",
  },
}, {
  // Standalone Node maintenance scripts are CommonJS by design; require() is fine there.
  files: ["**/*.cjs"],
  rules: {
    "@typescript-eslint/no-require-imports": "off",
  },
}, {
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "public/_next/**",
    "remote-server.js",
    "next-env.d.ts",
    "check.js",
    "examples/**",
    "skills",
    "tmp/**",
  ]
}];

export default eslintConfig;
