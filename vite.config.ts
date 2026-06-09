import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  plugins: [
    devtools(),
    nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  // transformers.js (semantic matching) is browser-only and lazy-loaded on the
  // client. Keep it out of the SSR/Nitro server bundle — it pulls in onnxruntime
  // and balloons (or kills) the server build, and its code path never runs on the
  // server. The client build still bundles it as an on-demand chunk.
  ssr: {
    external: ['@huggingface/transformers'],
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers'],
  },
})

export default config
