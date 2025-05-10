import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { storeAuthToken, getAuthToken } from '../utils/auth';
import { facultyLogin } from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const router = useRouter();
  const [facultyId, setFacultyId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAuthToken();
      if (token) {
        router.replace('/(tabs)');
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (!facultyId || !password) {
      Alert.alert('Error', 'Both fields are required');
      return;
    }

    setLoading(true);
    try {
      const response = await facultyLogin({ facultyId, password });
      if (response.success) {
        await storeAuthToken(response.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', response.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', error.error || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#f8f9fa', '#e9ecef']}
        style={styles.background}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/clg_logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>ABDUL HAKEEM COLLEGE</Text>
              <Text style={styles.subtitle}>Faculty Portal</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Faculty ID</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color="#6C63FF" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your faculty ID"
                  placeholderTextColor="#9e9e9e"
                  value={facultyId}
                  onChangeText={setFacultyId}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color="#6C63FF" style={styles.icon} />
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#9e9e9e"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons 
                    name={showPassword ? 'visibility-off' : 'visibility'} 
                    size={20} 
                    color="#6C63FF" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>LOGIN</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(auth)/SignupScreen')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6C63FF',
  },
  background: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.08,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    marginBottom: height * 0.02,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: width * 0.04,
    color: '#6C63FF',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: width * 0.06,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: width * 0.035,
    marginBottom: 8,
    color: '#495057',
    fontFamily: 'Inter-Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    marginBottom: height * 0.02,
    backgroundColor: '#f8f9fa',
  },
  icon: {
    marginLeft: 15,
  },
  input: {
    flex: 1,
    height: height * 0.06,
    paddingHorizontal: 15,
    fontSize: width * 0.04,
    color: '#495057',
    fontFamily: 'Inter-Regular',
  },
  passwordInput: {
    flex: 1,
    height: height * 0.06,
    paddingHorizontal: 15,
    fontSize: width * 0.04,
    color: '#495057',
    fontFamily: 'Inter-Regular',
  },
  toggleButton: {
    padding: 15,
  },
  button: {
    height: height * 0.065,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.02,
    shadowColor: '#6C63FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#a5a1ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: height * 0.025,
  },
  footerText: {
    color: '#6c757d',
    fontSize: width * 0.035,
    fontFamily: 'Inter-Regular',
  },
  footerLink: {
    color: '#6C63FF',
    fontWeight: '600',
    fontSize: width * 0.035,
    fontFamily: 'Inter-SemiBold',
  },
});

export default LoginScreen;