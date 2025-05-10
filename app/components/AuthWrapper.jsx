// components/AuthWrapper.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { getAuthToken } from '../utils/auth';

export default function AuthWrapper({ children }) {
  const [authState, setAuthState] = useState({
    isChecking: true,
    isAuthenticated: false
  });

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await getAuthToken();
        setAuthState({
          isChecking: false,
          isAuthenticated: !!token
        });
      } catch (error) {
        console.error('Authentication check failed:', error);
        setAuthState({
          isChecking: false,
          isAuthenticated: false
        });
      }
    };

    checkAuthentication();
  }, []);

  if (authState.isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
      </View>
    );
  }

  return authState.isAuthenticated ? (
    children
  ) : (
    <Redirect href="/(auth)/LoginScreen" />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa'
  }
});