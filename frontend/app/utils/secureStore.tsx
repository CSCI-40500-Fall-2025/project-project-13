import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Web-safe wrapper
export const getItem = async (key: string) => {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
};

export const setItem = async (key: string, value: string) => {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
};

export const deleteItem = async (key: string) => {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
};
