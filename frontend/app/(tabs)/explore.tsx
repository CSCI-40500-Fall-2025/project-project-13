import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function DiscoverScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Hardcoded fake events data
  const fakeEvents = [
    {
      id: 1,
      title: "Central Park Food Festival",
      date: "March 15, 2024",
      time: "12:00 PM - 8:00 PM",
      location: "Central Park, NYC",
      category: "Food & Drink",
      price: "Free",
      description: "Join us for a day of delicious food from NYC's best vendors in the heart of Central Park.",
      icon: "restaurant"
    },
    {
      id: 2,
      title: "Broadway Show: Hamilton",
      date: "March 20, 2024",
      time: "7:30 PM",
      location: "Richard Rodgers Theatre",
      category: "Entertainment",
      price: "$89 - $199",
      description: "Experience the revolutionary musical that tells the story of Alexander Hamilton.",
      icon: "musical-notes"
    },
    {
      id: 3,
      title: "Brooklyn Bridge Walking Tour",
      date: "March 18, 2024",
      time: "10:00 AM - 12:00 PM",
      location: "Brooklyn Bridge",
      category: "Tourism",
      price: "$25",
      description: "Discover the history and architecture of one of NYC's most iconic landmarks.",
      icon: "walk"
    },
    {
      id: 4,
      title: "MOMA Art Exhibition",
      date: "March 22, 2024",
      time: "11:00 AM - 5:00 PM",
      location: "Museum of Modern Art",
      category: "Culture",
      price: "$25",
      description: "Explore contemporary art from emerging and established artists around the world.",
      icon: "color-palette"
    },
    {
      id: 5,
      title: "Yankees vs Red Sox Game",
      date: "March 25, 2024",
      time: "7:05 PM",
      location: "Yankee Stadium",
      category: "Sports",
      price: "$45 - $150",
      description: "Watch the classic rivalry between the Yankees and Red Sox at Yankee Stadium.",
      icon: "baseball"
    },
    {
      id: 6,
      title: "Hunter College Career Fair",
      date: "March 28, 2024",
      time: "10:00 AM - 3:00 PM",
      location: "Hunter College Campus",
      category: "Education",
      price: "Free",
      description: "Connect with top employers and explore career opportunities in various fields.",
      icon: "briefcase"
    }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Discover NYC</ThemedText>
      </ThemedView>

      {/* Search Bar */}
      <ThemedView style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search places, events, restaurants..."
            placeholderTextColor={colors.text + '80'}
          />
        </View>
      </ThemedView>

      {/* Categories */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Categories</ThemedText>
        <View style={styles.categoryGrid}>
          <TouchableOpacity style={[styles.categoryCard, { backgroundColor: colors.tint }]}>
            <Ionicons name="restaurant" size={24} color="white" />
            <ThemedText style={styles.categoryText}>Restaurants</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.categoryCard, { backgroundColor: colors.tint }]}>
            <Ionicons name="calendar" size={24} color="white" />
            <ThemedText style={styles.categoryText}>Events</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.categoryCard, { backgroundColor: colors.tint }]}>
            <Ionicons name="camera" size={24} color="white" />
            <ThemedText style={styles.categoryText}>Attractions</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.categoryCard, { backgroundColor: colors.tint }]}>
            <Ionicons name="school" size={24} color="white" />
            <ThemedText style={styles.categoryText}>Hunter</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Featured Events */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Featured Events</ThemedText>
        {fakeEvents.map((event) => (
          <TouchableOpacity key={event.id} style={[styles.eventCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.eventHeader}>
              <View style={styles.eventIconContainer}>
                <Ionicons name={event.icon as any} size={24} color={colors.tint} />
              </View>
              <View style={styles.eventInfo}>
                <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                <ThemedText style={[styles.eventCategory, { color: colors.tint }]}>{event.category}</ThemedText>
              </View>
              <View style={styles.eventPriceContainer}>
                <ThemedText style={[styles.eventPrice, { color: colors.tint }]}>{event.price}</ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.eventDescription, { color: colors.text + 'CC' }]}>{event.description}</ThemedText>
            <View style={styles.eventDetails}>
              <View style={styles.eventDetailRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.text + '80'} />
                <ThemedText style={[styles.eventDetailText, { color: colors.text + '80' }]}>{event.date}</ThemedText>
              </View>
              <View style={styles.eventDetailRow}>
                <Ionicons name="time-outline" size={16} color={colors.text + '80'} />
                <ThemedText style={[styles.eventDetailText, { color: colors.text + '80' }]}>{event.time}</ThemedText>
              </View>
              <View style={styles.eventDetailRow}>
                <Ionicons name="location-outline" size={16} color={colors.text + '80'} />
                <ThemedText style={[styles.eventDetailText, { color: colors.text + '80' }]}>{event.location}</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  categoryCard: {
    width: '45%',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  categoryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  placeholderCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  eventCard: {
    marginBottom: 15,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventCategory: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventPriceContainer: {
    alignItems: 'flex-end',
  },
  eventPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 13,
  },
});
