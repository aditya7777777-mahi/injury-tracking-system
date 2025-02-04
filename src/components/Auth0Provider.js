'use client';
import { Auth0Provider } from '@auth0/auth0-react';

const Auth0ProviderWithNavigate = ({ children }) => {
  if (typeof window === 'undefined') return null;

  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/api/v2/`,
        scope: 'openid profile email'
      }}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithNavigate;
