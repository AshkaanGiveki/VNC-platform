// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 3001,
//     proxy: {
//       '/api': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//       },
//       '/session': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//         ws: true,              // important for WebSocket
//       },
//     },
//   },
// });
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/session': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,              // important for WebSocket
      },
    },
  },
});