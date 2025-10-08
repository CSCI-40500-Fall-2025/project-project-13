import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { getItem } from "./utils/secureStore"; // web-safe wrapper

export default function RootLayout() {
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

  return (
    <Stack>
      {!loggedIn ? (
        <>
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/signup" />
        </>
      ) : (
        <Stack.Screen name="(tabs)/home" />
      )}
    </Stack>
  );
}
