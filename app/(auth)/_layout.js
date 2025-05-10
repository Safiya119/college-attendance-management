import { Stack } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="white" />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: {
            backgroundColor: 'transparent',
          }
        }}
      >
        <Stack.Screen name="LoginScreen" />
        <Stack.Screen name="SignupScreen" />
      </Stack>
    </>
  );
}
