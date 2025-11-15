export const environment = {
  production: false,
  // Bypass proxy during SSR/dev to avoid '/api' being handled by the Node server
  apiUrl: 'http://localhost:8080/api'
};
