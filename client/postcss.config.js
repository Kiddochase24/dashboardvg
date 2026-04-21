import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const tailwindConfigPath = path.resolve(configDir, "../tailwind.config.ts");

export default {
  plugins: {
    tailwindcss: {
      config: tailwindConfigPath,
    },
    autoprefixer: {},
  },
};
