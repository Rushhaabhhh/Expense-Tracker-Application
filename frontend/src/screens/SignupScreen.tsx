import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Lock, DollarSign } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const SignupScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const budget = monthlyBudget ? parseFloat(monthlyBudget) : 0;
      await signup(email, password, name, budget);
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start tracking your expenses today</Text>
            </View>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <User size={20} color="#64748b" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                editable={!loading}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Mail size={20} color="#64748b" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock size={20} color="#64748b" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password (min 6 characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Budget Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <DollarSign size={20} color="#64748b" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Monthly Budget (optional)"
                value={monthlyBudget}
                onChangeText={setMonthlyBudget}
                keyboardType="numeric"
                editable={!loading}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#1e293b',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  linkText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  linkBold: {
    color: '#3b82f6',
    fontWeight: '700',
  },
});

export default SignupScreen;
