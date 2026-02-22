import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants/theme';

// User Authentication screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Patient Screens
import PatientDashboardScreen from '../screens/patient/DashboardScreen';
import PatientMedicationsScreen from '../screens/patient/MedicationsScreen';
import PatientAppointmentsScreen from '../screens/patient/AppointmentsScreen';
import PatientChatScreen from '../screens/patient/ChatScreen';
import PatientTodoScreen from '../screens/shared/TodoScreen';

// Employee/clinician Screens
import ClinicianPatientsScreen from '../screens/clinician/PatientsScreen';
import ClinicianAppointmentsScreen from '../screens/clinician/AppointmentsScreen';
import ClinicianEnquiriesScreen from '../screens/clinician/EnquiriesScreen';
import ClinicianAnalyticsScreen from '../screens/clinician/AnalyticsScreen';
import ClinicianTodoScreen from '../screens/shared/TodoScreen';

// Admin Screens
import AdminUsersScreen from '../screens/admin/UserManagementScreen';
import AdminAIAnalyticsScreen from '../screens/admin/AIAnalyticsScreen';
import AdminLoginHistoryScreen from '../screens/admin/LoginHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Patient Tabs
function PatientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: { backgroundColor: COLORS.white, borderTopColor: COLORS.border },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Dashboard: 'home-outline',
            Medications: 'medkit-outline',
            Appointments: 'calendar-outline',
            Chat: 'chatbubble-outline',
            Todo: 'checkbox-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={PatientDashboardScreen} />
      <Tab.Screen name="Medications" component={PatientMedicationsScreen} />
      <Tab.Screen name="Appointments" component={PatientAppointmentsScreen} />
      <Tab.Screen name="Chat" component={PatientChatScreen} />
      <Tab.Screen name="Todo" component={PatientTodoScreen} />
    </Tab.Navigator>
  );
}

// Employee/Clinician Tabs 
function ClinicianTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: { backgroundColor: COLORS.white, borderTopColor: COLORS.border },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Patients: 'people-outline',
            Appointments: 'calendar-outline',
            Enquiries: 'alert-circle-outline',
            Analytics: 'bar-chart-outline',
            Todo: 'checkbox-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Patients" component={ClinicianPatientsScreen} />
      <Tab.Screen name="Appointments" component={ClinicianAppointmentsScreen} />
      <Tab.Screen name="Enquiries" component={ClinicianEnquiriesScreen} />
      <Tab.Screen name="Analytics" component={ClinicianAnalyticsScreen} />
      <Tab.Screen name="Todo" component={ClinicianTodoScreen} />
    </Tab.Navigator>
  );
}

// Admin Tabs
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: { backgroundColor: COLORS.white, borderTopColor: COLORS.border },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            UserManagement: 'people-circle-outline',
            AIAnalytics: 'analytics-outline',
            LoginHistory: 'time-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="UserManagement"
        component={AdminUsersScreen}
        options={{ title: 'Users' }}
      />
      <Tab.Screen
        name="AIAnalytics"
        component={AdminAIAnalyticsScreen}
        options={{ title: 'AI Analytics' }}
      />
      <Tab.Screen
        name="LoginHistory"
        component={AdminLoginHistoryScreen}
        options={{ title: 'Login History' }}
      />
    </Tab.Navigator>
  );
}

// App Root Navigator
export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!user) return 'Auth';
    if (user.role === 'clinician') return 'ClinicianTabs';
    if (user.role === 'admin') return 'AdminTabs';
    return 'PatientTabs';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={getInitialRoute()} screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Auth" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {user.role === 'patient' && (
              <Stack.Screen name="PatientTabs" component={PatientTabs} />
            )}
            {user.role === 'clinician' && (
              <Stack.Screen name="ClinicianTabs" component={ClinicianTabs} />
            )}
            {user.role === 'admin' && (
              <Stack.Screen name="AdminTabs" component={AdminTabs} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
