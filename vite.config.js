export default {
  base: './',
  build: {
    lib: { entry: 'src/main.ts', name: 'ClausCrawl', formats: ['iife'], fileName: () => 'assets/app.js', cssFileName: 'style' },
    rollupOptions: { output: { assetFileNames: 'assets/[name][extname]' } },
    target: 'es2022',
    sourcemap: false
  }
};
