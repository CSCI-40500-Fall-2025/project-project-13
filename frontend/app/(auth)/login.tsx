import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { getItem, setItem } from "../utils/secureStore";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const BACK_URL = Constants.expoConfig?.extra?.BACK_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const checkLogin = async () => {
      const token = await getItem("access_token");
      if (token) {
        router.replace("/(tabs)"); // ✅ correct path
      }
    };
    checkLogin();
  }, [router]);

  async function handleSubmit() {
    setError(null);
    if (!email || !password) {
      setError("Email and password required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACK_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: any = {};
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        setError(data?.detail || data?.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      const { access_token, refresh_token, user_id } = data;

      if (access_token) await setItem("access_token", access_token);
      if (refresh_token) await setItem("refresh_token", refresh_token);
      if (user_id) await setItem("user_id", user_id);

      router.replace("/(tabs)"); // ✅ navigate to home tab after login
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Enter your email"
        placeholderTextColor="#a0bfa0"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Enter your password"
        placeholderTextColor="#a0bfa0"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a2a1a", padding: 20, justifyContent: "center" },
  label: { color: "#c4f0c4", marginBottom: 5, fontWeight: "600" },
  input: { backgroundColor: "#223322", color: "#c4f0c4", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, marginBottom: 15 },
  forgotText: { color: "#88c088", textAlign: "right", marginBottom: 20 },
  button: { backgroundColor: "#3a7d3a", padding: 15, borderRadius: 8, alignItems: "center", marginBottom: 20 },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#ff6b6b", textAlign: "center", marginBottom: 15 },
  linkText: { color: "#88c088", textAlign: "center" },
});
