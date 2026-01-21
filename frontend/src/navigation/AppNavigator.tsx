import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import ExpenseListScreen from '../screens/ExpenseListScreen';
import MonthlyReportScreen from '../screens/MonthlyReportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#9ca3af',
    }}>
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
      }}
    />
    <Tab.Screen
      name="ExpenseList"
      component={ExpenseListScreen}
      options={{
        tabBarLabel: 'Expenses',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📋</Text>,
      }}
    />
    <Tab.Screen
      name="MonthlyReport"
      component={MonthlyReportScreen}
      options={{
        tabBarLabel: 'Report',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📊</Text>,
      }}
    />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen
      name="AddExpense"
      component={AddExpenseScreen}
      options={{
        presentation: 'modal',
      }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
});

export default AppNavigator;
