import { StrictMode } from 'react';

import { Auth0Provider } from '@auth0/auth0-react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App.tsx';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
// const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

if (!domain || !clientId ) {
  throw new Error('Auth0 environment variables are not set properly.');
}

const onRedirectCallback = (appState?: any) => {
  console.log('Auth0 redirect callback:', { appState });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      }}
      useRefreshTokens
      cacheLocation='localstorage'
      onRedirectCallback={onRedirectCallback}
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
);
