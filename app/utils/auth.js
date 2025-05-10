import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem('@auth_token', token);
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
};

export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('@auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('@auth_token');
  } catch (error) {
    console.error('Error removing auth token:', error);
  } 
};

// Create a default export object with all the auth functions
const authModule = {
  storeAuthToken,
  getAuthToken,
  removeAuthToken
};

// Export as default
export default authModule;