export default defineNuxtConfig({
  css: ['~/assets/css/style.css', '@vuepic/vue-datepicker/dist/main.css'],
  ssr: false,
  srcDir: 'src/',
  plugins: [],
  devtools: { enabled: true },
  compatibilityDate: '2025-04-09',
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NODE_ENV === 'production'
        ? process.env.API_BASE_URL_PROD
        : process.env.API_BASE_URL_DEV
    }
  },
  build: {
    transpile: ['@vuepic/vue-datepicker']
  },
  modules: []
})