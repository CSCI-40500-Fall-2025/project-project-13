import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
// import * as SecureStore from 'expo-secure-store';
import { deleteItem } from "../utils/secureStore";
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const darkGreen = '#1a2a1a';
  const accent = '#3a7d3a';
  const textColor = '#c4f0c4';

  const handleLogout = async () => {
    await deleteItem("access_token");
    await deleteItem("refresh_token");
    await deleteItem("user_id");
    if (typeof localStorage !== 'undefined') localStorage.clear();
    globalThis.location.href = "/(auth)/login";
  };


  const CustomHeader = () => (
    <View
      style={{
        height: 60,
        backgroundColor: darkGreen,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 40,
      }}
    >
      <Text style={{ color: textColor, fontSize: 20, fontWeight: 'bold' }}>NYC Discovery</Text>
      <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconSymbol name="power" size={24} color={textColor} />
        <Text style={{ color: textColor, marginLeft: 5 }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        header: () => <CustomHeader />,
        tabBarStyle: {
          backgroundColor: darkGreen,
          borderTopWidth: 0,
          height: 60,
        },
        tabBarActiveTintColor: textColor,
        tabBarInactiveTintColor: accent,
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'For You',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="magnifyingglass" color={color} />,
        }}
      />
    </Tabs>
  );
}
