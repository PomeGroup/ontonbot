// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import hooksLint from "eslint-plugin-react-hooks";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  hooksLint.configs["recommended-latest"]
);
