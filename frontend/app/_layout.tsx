import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { getItem } from "./utils/secureStore"; // web-safe wrapper
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await getItem("access_token");
        setLoggedIn(!!token);
      } catch (err) {
        console.warn("Error checking login:", err);
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // return (
  //   <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
  //     <Stack>
  //     {!loggedIn ? (
  //       <>
  //         <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
  //         <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
  //       </>
  //       ) : (
  //         <Stack.Screen name="(tabs)/home" options={{ headerShown: false }} />
  //       )}
  //     </Stack>
  //     <StatusBar style="auto" />
  //   </ThemeProvider>
  // );

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );


}
