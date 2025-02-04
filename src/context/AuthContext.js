'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { message } from 'antd';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const {
    isAuthenticated,
    user: auth0User,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
    isLoading
  } = useAuth0();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (isAuthenticated && auth0User) {
      setUser(auth0User);
      getAccessTokenSilently()
        .then(setToken)
        .catch(error => {
          message.error('Failed to get access token');
          console.error(error);
        });
    } else {
      setUser(null);
      setToken(null);
    }
  }, [isAuthenticated, auth0User, getAccessTokenSilently]);

  const loginWithError = async (options) => {
    try {
      await loginWithRedirect(options);
    } catch (error) {
      message.error('Failed to login');
      console.error(error);
    }
  };

  const logoutWithError = async () => {
    try {
      await logout({ returnTo: window.location.origin });
    } catch (error) {
      message.error('Failed to logout');
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated,
      login: loginWithError,
      logout: logoutWithError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
