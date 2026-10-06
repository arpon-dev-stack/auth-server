import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  // 1. Core JS recommendations
  eslint.configs.recommended,

  // 2. Recommended TypeScript linting rules
  ...tseslint.configs.recommended,

  // 3. Turn off ESLint rules that conflict with Prettier (MUST be last)
  eslintConfigPrettier,

  // 4. Custom overrides and ignore rules
  {
    ignores: ["dist/", "node_modules/", "build/"],
  },
  {
    rules: {
      // Add custom rules here if needed
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
