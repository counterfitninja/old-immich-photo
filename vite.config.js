import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    // Expose env variables that start with VITE_ to the client
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version),
    },
  }
})
