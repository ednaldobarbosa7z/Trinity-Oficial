// Safe defaults for local builds. Docker replaces this file from the root .env.
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  tmdbApiKey: '',
};
