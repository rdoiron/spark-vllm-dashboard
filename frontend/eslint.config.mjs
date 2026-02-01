import js from "@eslint/js"
import typescript from "typescript-eslint"
import next from "eslint-config-next"

const config = [
  {
    ignores: [".next/", "node_modules/", "dist/", "build/"],
  },
  ...next,
]

export default config