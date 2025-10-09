import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol'; // Import IconSymbol

// Basic Event Component
function EventCard({ eventName, clubName, date, location }: { eventName: string; clubName: string; date: string; location: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light']; // Using light for fallback
  return (
    <ThemedView style={[eventStyles.card, { backgroundColor: colors.clubCardBackground }]}>
      <ThemedText style={eventStyles.eventName}>{eventName}</ThemedText>
      <ThemedText style={eventStyles.clubName}>{clubName}</ThemedText>
      <ThemedText style={eventStyles.dateLocation}>{date} @ {location}</ThemedText>
      <TouchableOpacity style={eventStyles.detailsButton}>
        <ThemedText style={eventStyles.detailsButtonText}>View Details</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const eventStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 5,
  },
  clubName: {
    fontSize: 14,
    color: '#D8BFD8', // Lighter purple for club name
    marginBottom: 3,
  },
  dateLocation: {
    fontSize: 12,
    color: '#D8BFD8',
    marginBottom: 10,
  },
  detailsButton: {
    backgroundColor: '#6a0dad', // Purple accent
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Basic Club Component
function ClubCard({ clubName, description, members }: { clubName: string; description: string; members: number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light']; // Using light for fallback
  return (
    <ThemedView style={[clubStyles.card, { backgroundColor: colors.clubCardBackground }]}>
      <ThemedText style={clubStyles.clubName}>{clubName}</ThemedText>
      <ThemedText style={clubStyles.description}>{description}</ThemedText>
      <ThemedText style={clubStyles.members}>{members} Members</ThemedText>
      <TouchableOpacity style={clubStyles.joinButton}>
        <ThemedText style={clubStyles.joinButtonText}>Join Club</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const clubStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  clubName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#D8BFD8', // Lighter purple for description
    marginBottom: 8,
  },
  members: {
    fontSize: 12,
    color: '#D8BFD8',
    marginBottom: 10,
  },
  joinButton: {
    backgroundColor: '#6a0dad', // Purple accent
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});


export default function ClubHubScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const clubPageBackgroundColor = colors.clubPageBackground || '#26152B';
  const clubSectionBackgroundColor = colors.clubSectionBackground || '#26152B'; // Same as page background

  return (
    <ScrollView style={[styles.container, { backgroundColor: clubPageBackgroundColor }]}>
      {/* Header */}
      <ThemedView style={[styles.header, { backgroundColor: clubSectionBackgroundColor }]}>
        <ThemedText type="title" style={styles.headerTitle}>Club Hub</ThemedText>
        <TouchableOpacity style={styles.locationButton}>
          <IconSymbol name="graduationcap.fill" size={20} color={colors.purpleAccent} />
          <ThemedText style={[styles.locationText, { color: colors.purpleAccent }]}>Hunter College</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Trending Events Section */}
      <ThemedView style={[styles.section, { backgroundColor: clubSectionBackgroundColor }]}>
        <View style={styles.sectionHeaderWithButton}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>🔥 Trending @ Hunter College</ThemedText>
        </View>
        <EventCard eventName="Hackathon 2025" clubName="Computer Science Club" date="Oct 26, 2025" location="Hunter North" />
        <EventCard eventName="Spring Gala" clubName="Student Government" date="May 10, 2026" location="Great Hall" />
        <EventCard eventName="Chess Tournament" clubName="Chess Club" date="Nov 15, 2025" location="Campus Library" />
      </ThemedView>

      {/* Club Events Section */}
      <ThemedView style={[styles.section, { backgroundColor: clubSectionBackgroundColor }]}>
        <View style={styles.sectionHeaderWithButton}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Browse all Club Events</ThemedText>
          <TouchableOpacity style={styles.smallSearchButton}>
            <IconSymbol name="magnifyingglass" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <EventCard eventName="Study Session" clubName="Math Club" date="Oct 10, 2025" location="LARC" />
        <EventCard eventName="Debate Practice" clubName="Debate Team" date="Oct 12, 2025" location="Student Union" />
      </ThemedView>

      {/* Clubs Section */}
      <ThemedView style={[styles.section, { backgroundColor: clubSectionBackgroundColor }]}>
        <View style={styles.sectionHeaderWithButton}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Browse all Clubs</ThemedText>
          <TouchableOpacity style={styles.smallSearchButton}>
            <IconSymbol name="magnifyingglass" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <ClubCard clubName="Computer Science Club" description="For students interested in coding and technology." members={150} />
        <ClubCard clubName="Art History Society" description="Exploring art through discussions and museum visits." members={50} />
        <ClubCard clubName="Book Club" description="Reading and discussing various literary works." members={75} />
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
    color: '#ECEDEE', // Set header title color for dark purple theme
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6a0dad', // Using purpleAccent for border
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeaderWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ECEDEE', // Set section title color for dark purple theme
    marginRight: 10,
  },
  smallSearchButton: {
    backgroundColor: '#6a0dad', // Purple accent
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
