import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
    useEffect(() => {
        NavigationBar.setBackgroundColorAsync('#FFFFFF');
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Tabs
                screenOptions={{
                    tabBarStyle: {
                        backgroundColor: '#FFFFFF',
                        borderTopWidth: 1,
                        borderTopColor: '#F0F0F0',
                    },
                    tabBarActiveTintColor: '#4CAF50',
                    tabBarInactiveTintColor: '#888888',
                    tabBarShowLabel: false,
                    headerShown: false,
                }}
                initialRouteName="listings"
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="person-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="listings"
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="home-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="settings-outline" size={size} color={color} />
                        ),
                    }}
                />

                {/* Hidden Screens */}
                <Tabs.Screen
                    name="[id]"
                    options={{
                        tabBarButton: () => null,
                        headerShown: false,
                    }}
                />
                <Tabs.Screen
                    name="LeaveReview"
                    options={{
                        tabBarButton: () => null,
                        headerShown: false,
                    }}
                />
                <Tabs.Screen
                    name="about"
                    options={{
                        tabBarButton: () => null,
                        headerShown: false,
                    }}
                />
            </Tabs>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
});