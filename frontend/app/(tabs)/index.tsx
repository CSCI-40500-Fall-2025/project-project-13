import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>For You</ThemedText>
        <TouchableOpacity style={styles.locationButton}>
          <Ionicons name="location-outline" size={20} color={colors.tint} />
          <ThemedText style={[styles.locationText, { color: colors.tint }]}>NYC</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Trending Section Placeholder */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>🔥 Trending Now</ThemedText>
        <ThemedView style={styles.placeholderCard}>
          <ThemedText style={styles.placeholderText}>Trending places will appear here</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Personalized Feed Placeholder */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Recommended for You</ThemedText>
        <ThemedView style={styles.placeholderCard}>
          <ThemedText style={styles.placeholderText}>Personalized recommendations will appear here</ThemedText>
        </ThemedView>
        <ThemedView style={styles.placeholderCard}>
          <ThemedText style={styles.placeholderText}>Based on your interests and past visits</ThemedText>
        </ThemedView>
        <ThemedView style={styles.placeholderCard}>
          <ThemedText style={styles.placeholderText}>Bookmark events to receive more reccomendations!</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.tint }]}>
            <Ionicons name="search" size={24} color="white" />
            <ThemedText style={styles.actionText}>Search Places</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.tint }]}>
            <Ionicons name="location" size={24} color="white" />
            <ThemedText style={styles.actionText}>Check In</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  placeholderCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    marginBottom: 10,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
