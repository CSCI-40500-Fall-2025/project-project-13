import { StyleSheet, ScrollView, TouchableOpacity, View, Modal, Image, Linking, Alert, Dimensions } from 'react-native';
import React, { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Define types for event and club data for better type safety
interface EventData {
  eventName: string;
  clubName: string;
  date: string;
  location: string;
  description: string;
  imageUri?: string;
}

interface ClubData {
  clubName: string;
  description: string;
  members: number;
  contactEmail?: string;
  website?: string;
  imageUri?: string;
}

const { width: SCREEN_W } = Dimensions.get("window");

// Basic Event Component - Updated to accept an onPress handler
function EventCard({ eventName, clubName, date, location, description, imageUri, onPress }: EventData & { onPress: (event: EventData) => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const eventData = { eventName, clubName, date, location, description, imageUri };
  return (
    <ThemedView style={[eventStyles.card, { backgroundColor: colors.clubCardBackground }]}>
      <ThemedText style={eventStyles.eventName}>{eventName}</ThemedText>
      <ThemedText style={eventStyles.clubName}>{clubName}</ThemedText>
      <ThemedText style={eventStyles.dateLocation}>{date} @ {location}</ThemedText>
      <TouchableOpacity style={eventStyles.detailsButton} onPress={() => onPress(eventData)}>
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
    color: '#D8BFD8', // lighter purple for club name
    marginBottom: 3,
  },
  dateLocation: {
    fontSize: 12,
    color: '#D8BFD8',
    marginBottom: 10,
  },
  detailsButton: {
    backgroundColor: '#6a0dad', // purple accent
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

// Basic Club Component - Updated to accept an onPress handler
function ClubCard({ clubName, description, members, contactEmail, website, imageUri, onPress }: ClubData & { onPress: (club: ClubData) => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const clubData = { clubName, description, members, contactEmail, website, imageUri };
  return (
    <ThemedView style={[clubStyles.card, { backgroundColor: colors.clubCardBackground }]}>
      <ThemedText style={clubStyles.clubName}>{clubName}</ThemedText>
      <ThemedText style={clubStyles.description}>{description}</ThemedText>
      <ThemedText style={clubStyles.members}>{members} Members</ThemedText>
      <TouchableOpacity style={clubStyles.joinButton} onPress={() => onPress(clubData)}>
        <ThemedText style={clubStyles.joinButtonText}>View Club</ThemedText>
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
    color: '#D8BFD8', // lighter purple for description
    marginBottom: 8,
  },
  members: {
    fontSize: 12,
    color: '#D8BFD8',
    marginBottom: 10,
  },
  joinButton: {
    backgroundColor: '#6a0dad', // purple accent
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

// Event Details Modal Component
function EventDetailModal({ isVisible, onClose, event }: { isVisible: boolean; onClose: () => void; event: EventData | null }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const darkPurpleBackground = colors.clubPageBackground || '#26152B';
  const purpleAccent = colors.purpleAccent || '#6a0dad';

  if (!event) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={eventDetailModalStyles.centeredView}>
        <View style={[eventDetailModalStyles.modalView, { backgroundColor: darkPurpleBackground }]}>
          {/* Photo Placeholder */}
          <View style={eventDetailModalStyles.imagePlaceholder}>
            {event.imageUri ? (
              <Image source={{ uri: event.imageUri }} style={eventDetailModalStyles.modalImage} resizeMode="cover" />
            ) : (
              <ThemedText style={{ color: 'white' }}>Event Image Placeholder</ThemedText>
            )}
          </View>

          <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
            <ThemedText style={eventDetailModalStyles.eventName}>{event.eventName}</ThemedText>
            <ThemedText style={eventDetailModalStyles.clubName}>{event.clubName}</ThemedText>
            <ThemedText style={eventDetailModalStyles.dateLocation}>{event.date} @ {event.location}</ThemedText>
            <ThemedText style={eventDetailModalStyles.description}>{event.description}</ThemedText>

            {/* Action Buttons */}
            <View style={eventDetailModalStyles.actionButtons}>
              <TouchableOpacity style={[eventDetailModalStyles.actionButton, { backgroundColor: purpleAccent }]}>
                <IconSymbol name="bookmark.fill" size={20} color="white" />
                <ThemedText style={eventDetailModalStyles.actionButtonText}>Bookmark Event</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[eventDetailModalStyles.actionButton, { backgroundColor: purpleAccent }]}>
                <IconSymbol name="heart.fill" size={20} color="white" />
                <ThemedText style={eventDetailModalStyles.actionButtonText}>Like Event</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={eventDetailModalStyles.closeButton}>
            <ThemedText style={eventDetailModalStyles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const eventDetailModalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // semi transparent overlay
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // ensures image stays within bounds
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 10,
    textAlign: 'center',
  },
  clubName: {
    fontSize: 16,
    color: '#D8BFD8',
    marginBottom: 5,
  },
  dateLocation: {
    fontSize: 14,
    color: '#D8BFD8',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#ECEDEE',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 5,
    marginBottom: 10, // margin between stacked buttons
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: 'gray',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Club Details Modal Component
function ClubDetailModal({ isVisible, onClose, club }: { isVisible: boolean; onClose: () => void; club: ClubData | null }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const darkPurpleBackground = colors.clubPageBackground || '#26152B';
  const purpleAccent = colors.purpleAccent || '#6a0dad';

  if (!club) return null;

  const openUrl = async (url?: string) => {
    if (!url) return;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert("Can't open link", url);
    } catch { Alert.alert("Failed to open link"); }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={clubDetailModalStyles.centeredView}>
        <View style={[clubDetailModalStyles.modalView, { backgroundColor: darkPurpleBackground }]}>
          {/* Photo Placeholder */}
          <View style={clubDetailModalStyles.imagePlaceholder}>
            {club.imageUri ? (
              <Image source={{ uri: club.imageUri }} style={clubDetailModalStyles.modalImage} resizeMode="cover" />
            ) : (
              <ThemedText style={{ color: 'white' }}>Club Image Placeholder</ThemedText>
            )}
          </View>

          <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
            <ThemedText style={clubDetailModalStyles.clubName}>{club.clubName}</ThemedText>
            <ThemedText style={clubDetailModalStyles.description}>{club.description}</ThemedText>
            <ThemedText style={clubDetailModalStyles.members}>{club.members} Members</ThemedText>
            {club.contactEmail && <ThemedText style={clubDetailModalStyles.contact}>Contact: {club.contactEmail}</ThemedText>}
            {club.website && (
              <TouchableOpacity onPress={() => openUrl(club.website)}>
                <ThemedText style={clubDetailModalStyles.website}>Visit Website</ThemedText>
              </TouchableOpacity>
            )}

            {/* Action Button */}
            <TouchableOpacity style={[clubDetailModalStyles.followButton, { backgroundColor: purpleAccent }]}>
              <IconSymbol name="person.badge.plus" size={20} color="white" />
              <ThemedText style={clubDetailModalStyles.followButtonText}>Follow Club</ThemedText>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={clubDetailModalStyles.closeButton}>
            <ThemedText style={clubDetailModalStyles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const clubDetailModalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // ensures image stays within bounds
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  clubName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ECEDEE',
    textAlign: 'center',
    marginBottom: 10,
  },
  members: {
    fontSize: 14,
    color: '#D8BFD8',
    marginBottom: 10,
  },
  contact: {
    fontSize: 14,
    color: '#D8BFD8',
    marginBottom: 5,
  },
  website: {
    fontSize: 14,
    color: '#ADD8E6', // different color for clickable link
    textDecorationLine: 'underline',
    marginBottom: 15,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    gap: 5,
  },
  followButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: 'gray',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


export default function ClubHubScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const clubPageBackgroundColor = colors.clubPageBackground || '#26152B';
  const clubSectionBackgroundColor = colors.clubSectionBackground || '#26152B';

  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const [clubModalVisible, setClubModalVisible] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubData | null>(null);

  const openEventModal = (event: EventData) => {
    setSelectedEvent(event);
    setEventModalVisible(true);
  };

  const closeEventModal = () => {
    setEventModalVisible(false);
    setSelectedEvent(null);
  };

  const openClubModal = (club: ClubData) => {
    setSelectedClub(club);
    setClubModalVisible(true);
  };

  const closeClubModal = () => {
    setClubModalVisible(false);
    setSelectedClub(null);
  };


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
        <EventCard
          eventName="Hackathon 2025"
          clubName="Computer Science Club"
          date="Oct 26, 2025"
          location="Hunter North"
          description="Join the annual Hackathon! Work on exciting projects, learn new technologies, and compete for prizes."
          onPress={openEventModal}
        />
        <EventCard
          eventName="Spring Gala"
          clubName="Student Government"
          date="May 10, 2026"
          location="Great Hall"
          description="An elegant evening of celebration, music, and dance to mark the end of the academic year."
          onPress={openEventModal}
        />
        <EventCard
          eventName="Chess Tournament"
          clubName="Chess Club"
          date="Nov 15, 2025"
          location="Campus Library"
          description="Test your skills against the best chess players at Hunter College. All skill levels welcome!"
          onPress={openEventModal}
        />
      </ThemedView>

      {/* Club Events Section */}
      <ThemedView style={[styles.section, { backgroundColor: clubSectionBackgroundColor }]}>
        <View style={styles.sectionHeaderWithButton}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Browse all Club Events</ThemedText>
          <TouchableOpacity style={styles.smallSearchButton}>
            <IconSymbol name="magnifyingglass" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <EventCard
          eventName="Study Session"
          clubName="Math Club"
          date="Oct 10, 2025"
          location="LARC"
          description="Prepare for your upcoming math exams with group study sessions and peer tutoring."
          onPress={openEventModal}
        />
        <EventCard
          eventName="Debate Practice"
          clubName="Debate Team"
          date="Oct 12, 2025"
          location="Student Union"
          description="Hone your public speaking and argumentation skills with weekly debate practices."
          onPress={openEventModal}
        />
      </ThemedView>

      {/* Clubs Section */}
      <ThemedView style={[styles.section, { backgroundColor: clubSectionBackgroundColor }]}>
        <View style={styles.sectionHeaderWithButton}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Browse all Clubs</ThemedText>
          <TouchableOpacity style={styles.smallSearchButton}>
            <IconSymbol name="magnifyingglass" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <ClubCard
          clubName="Computer Science Club"
          description="For students interested in coding and technology. We host workshops, coding challenges, and guest speakers."
          members={150}
          contactEmail="csc@hunter.cuny.edu"
          website="https://www.huntercsc.org"
          onPress={openClubModal}
        />
        <ClubCard
          clubName="Art History Society"
          description="Exploring art through discussions and museum visits. Discover new artists and art movements with us."
          members={50}
          contactEmail="arthistory@hunter.cuny.edu"
          website=""
          onPress={openClubModal}
        />
        <ClubCard
          clubName="Book Club"
          description="Reading and discussing various literary works, from classics to contemporary bestsellers. Join our vibrant discussions!"
          members={75}
          contactEmail="bookclub@hunter.cuny.edu"
          website=""
          onPress={openClubModal}
        />
      </ThemedView>

      {/* Modals */}
      <EventDetailModal isVisible={eventModalVisible} onClose={closeEventModal} event={selectedEvent} />
      <ClubDetailModal isVisible={clubModalVisible} onClose={closeClubModal} club={selectedClub} />
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
    color: '#ECEDEE', // set header title color for dark purple theme
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6a0dad',
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
    color: '#ECEDEE', // set section title color for dark purple theme
    marginRight: 10,
  },
  smallSearchButton: {
    backgroundColor: '#6a0dad',
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
