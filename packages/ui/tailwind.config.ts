import type { Config } from 'tailwindcss';
import baseConfig from "@ytclipper/tailwind-config"

const config: Config = {
  ...baseConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    "../../apps/app/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;