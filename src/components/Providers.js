'use client';
import { ApolloProvider } from '@apollo/client';
import { ConfigProvider } from 'antd';
import { useApollo } from '@/lib/apollo-client';
import Auth0ProviderWithNavigate from './Auth0Provider';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }) {
  const client = useApollo();
  
  return (
    <Auth0ProviderWithNavigate>
      <AuthProvider>
        <ApolloProvider client={client}>
          <ConfigProvider>
            {children}
          </ConfigProvider>
        </ApolloProvider>
      </AuthProvider>
    </Auth0ProviderWithNavigate>
  );
}
