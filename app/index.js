// app/splash.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getAuthToken } from './utils/auth';

export default function SplashScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create a promise that resolves after minimum wait time
    const minimumWait = new Promise(resolve => 
      setTimeout(resolve, 1000) // 3 second minimum splash screen
    );
    
    // Check auth token
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        // Return the destination based on auth status
        return token ? '/(tabs)/' : '/(auth)/LoginScreen';
      } catch (error) {
        console.error('Auth check failed:', error);
        return '/(auth)/LoginScreen'; // Default to login on error
      }
    };

    // Wait for both minimum time AND auth check to complete
    Promise.all([minimumWait, checkAuth()])
      .then(([_, destination]) => {
        setIsLoading(false);
        router.replace(destination);
      })
      .catch(error => {
        console.error("Error during splash screen:", error);
        setIsLoading(false);
        router.replace('/(auth)/LoginScreen');
      });
  }, []);

  return (
    
    <View style={styles.container}>
      <Image 
        source={require('../assets/clg_logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      
      <Text style={styles.collegeName}>ABDUL HAKEEM</Text>
      <Text style={styles.collegeText}>COLLEGE</Text>
      
      {isLoading && (
        <ActivityIndicator 
          size="large" 
          color="#4a6baf" 
          style={styles.loader}
        />
      )}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Created by Shahid*3</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  collegeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  collegeText: {
    fontSize: 22,
    color: '#4a6baf',
    fontWeight: '600',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});