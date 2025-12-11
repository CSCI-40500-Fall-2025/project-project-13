import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  Text,
  Linking,
  Share,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

const { width: SCREEN_W } = Dimensions.get("window");

function AutoSizedImage({ uri, maxWidth = SCREEN_W * 0.95, maxHeight = 380 }: { uri: string; maxWidth?: number; maxHeight?: number; }) {
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    if (!uri) {
      setLoading(false);
      return;
    }
    Image.getSize(
      uri,
      (naturalWidth, naturalHeight) => {
        if (!mounted) return;
        const widthRatio = maxWidth / naturalWidth;
        const heightRatio = maxHeight / naturalHeight;
        const ratio = Math.min(widthRatio, heightRatio, 1);
        setSize({ width: naturalWidth * ratio, height: naturalHeight * ratio });
        setLoading(false);
      },
      () => { setLoading(false); }
    );
    return () => { mounted = false; };
  }, [uri]);

  if (loading) return <ActivityIndicator style={{ width: maxWidth, height: maxHeight }} />;

  return <Image source={{ uri }} style={{ width: size?.width, height: size?.height, borderRadius: 12 }} resizeMode="cover" />;
}

export default function DiscoverScreen() {
  const BACK_URL = Constants.expoConfig?.extra?.BACK_URL || "http://127.0.0.1:8000";

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatVisible, setChatVisible] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string, content: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchAllAttractions();
  }, []);

  const fetchAllAttractions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACK_URL}/attractions`);
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const doSearch = async () => {
    if (!query.trim()) {
      fetchAllAttractions();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACK_URL}/attractions/search?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally { setLoading(false); }
  };

  const openUrl = async (url?: string) => {
    if (!url) return;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert("Can't open link", url);
    } catch { Alert.alert("Failed to open link"); }
  };

  const openMaps = (lat?: number, lng?: number, label?: string) => {
    if (lat == null || lng == null) return;
    const query = `${lat},${lng}`;
    const url = Platform.OS === "ios"
      ? `maps:0,0?q=${encodeURIComponent(label || "")}@${query}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
    openUrl(url);
  };

  const shareAttraction = async (a: any) => {
    try {
      const text = a.website || a.formatted_address || a.location || JSON.stringify(a).slice(0, 300);
      await Share.share({ message: text });
    } catch { Alert.alert("Share failed"); }
  };

  // Markdown styles for chat
  const markdownStyles = useMemo(() => ({
    body: { color: "#fff", fontSize: 14, lineHeight: 20 },
    heading1: { color: "#4ade80", fontSize: 18, fontWeight: "bold" as const, marginTop: 8, marginBottom: 4 },
    heading2: { color: "#4ade80", fontSize: 16, fontWeight: "bold" as const, marginTop: 8, marginBottom: 4 },
    heading3: { color: "#86efac", fontSize: 14, fontWeight: "bold" as const, marginTop: 6, marginBottom: 2 },
    strong: { color: "#fff", fontWeight: "bold" as const },
    em: { color: "#9fb99a", fontStyle: "italic" as const },
    bullet_list: { marginLeft: 8 },
    ordered_list: { marginLeft: 8 },
    list_item: { marginBottom: 4 },
    paragraph: { marginBottom: 8 },
    link: { color: "#60a5fa" },
  }), []);

  // Chat functions with optimized updates
  const sendChatMessage = async () => {
    if (!chatQuery.trim() || chatLoading) return;

    const userMessage = chatQuery.trim();
    setChatQuery("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    // Add placeholder for assistant response
    setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch(`${BACK_URL}/chat?query=${encodeURIComponent(userMessage)}`);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let assistantContent = "";
      let lastUpdate = 0;
      const UPDATE_INTERVAL = 100; // Only update UI every 100ms

      const updateMessage = (content: string, force = false) => {
        const now = Date.now();
        if (force || now - lastUpdate > UPDATE_INTERVAL) {
          lastUpdate = now;
          setChatMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { role: "assistant", content };
            return newMessages;
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "status") {
                assistantContent = data.message + "\n";
                updateMessage(assistantContent, true);
              } else if (data.type === "token") {
                assistantContent += data.content;
                updateMessage(assistantContent);
              } else if (data.type === "error") {
                assistantContent = `**Error:** ${data.message}`;
                updateMessage(assistantContent, true);
              } else if (data.type === "complete") {
                updateMessage(assistantContent, true);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      // Final update and scroll
      updateMessage(assistantContent, true);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

    } catch (err: any) {
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: "assistant", content: `**Error:** ${err.message}` };
        return newMessages;
      });
    } finally {
      setChatLoading(false);
    }
  };

  const buildMedia = (a: any) => {
    const imgs: string[] = Array.isArray(a.images)
      ? a.images.map((p: any) => p.url).filter(Boolean)
      : [];
    const vids: any[] = Array.isArray(a.videos) ? a.videos.filter(Boolean) : [];
    const media: Array<{ type: "image" | "video"; url: string; title?: string }> = [];
    imgs.forEach(u => media.push({ type: "image", url: u }));
    vids.forEach(v => media.push({ type: "video", url: v.url || v, title: v.title || v.url }));
    return media;
  };

  // Helper to format price level as dollar signs
  const formatPriceLevel = (level: number | null | undefined): string => {
    if (level == null || level < 0 || level > 4) return "";
    return "$".repeat(level + 1);
  };

  // Helper to format business status
  const formatBusinessStatus = (status: string | null | undefined): { text: string; color: string } | null => {
    if (!status) return null;
    switch (status) {
      case "OPERATIONAL": return { text: "Open", color: "#4ade80" };
      case "CLOSED_TEMPORARILY": return { text: "Temporarily Closed", color: "#fbbf24" };
      case "CLOSED_PERMANENTLY": return { text: "Permanently Closed", color: "#f87171" };
      default: return null;
    }
  };

  // Helper to format type labels (convert snake_case to Title Case)
  const formatTypeLabel = (type: string): string => {
    return type
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderCard = (attraction: any, i: number) => {
    const media = buildMedia(attraction);
    const reviews = Array.isArray(attraction.reviews) ? attraction.reviews : [];
    const opening_hours = attraction.opening_hours;
    const address = attraction.formatted_address || attraction.address || attraction.vicinity || "";
    const types = Array.isArray(attraction.types) ? attraction.types : (Array.isArray(attraction.tags) ? attraction.tags : []);
    const description = attraction.description || "";
    const primaryType = attraction.primary_type || (types.length > 0 ? types[0] : null);
    const priceLevel = formatPriceLevel(attraction.price_level);
    const businessStatus = formatBusinessStatus(attraction.business_status);

    return (
      <View key={i} style={styles.card}>
        {/* Media carousel */}
        {media.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
            snapToInterval={SCREEN_W * 0.9} // width of each card
            decelerationRate="fast"
            contentContainerStyle={{
              paddingLeft: 0, // ensures first image starts at left edge
              paddingRight: SCREEN_W * 0.05, // small peek for last item
            }}
          >
            {media.map((m, idx) => (
              <View
                key={idx}
                style={{
                  width: SCREEN_W * 0.9, // slightly narrower than full screen
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8, // spacing between media
                }}
              >
                <AutoSizedImage uri={m.url} maxWidth={SCREEN_W * 0.9} />
                {m.type === "video" && (
                  <View style={styles.playOverlay}>
                    <Ionicons name="play" size={40} color="#fff" />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        {/* Primary Type Badge + Business Status */}
        <View style={styles.badgeRow}>
          {primaryType && (
            <View style={styles.primaryTypeBadge}>
              <Text style={styles.primaryTypeBadgeText}>{formatTypeLabel(primaryType)}</Text>
            </View>
          )}
          {businessStatus && (
            <View style={[styles.statusBadge, { backgroundColor: businessStatus.color + "20" }]}>
              <View style={[styles.statusDot, { backgroundColor: businessStatus.color }]} />
              <Text style={[styles.statusText, { color: businessStatus.color }]}>{businessStatus.text}</Text>
            </View>
          )}
          {priceLevel && (
            <Text style={styles.priceLevel}>{priceLevel}</Text>
          )}
        </View>

        {/* Title + address + rating */}
        <Text style={styles.title}>{attraction.location || attraction.description}</Text>
        {address ? <Text style={styles.address}>{address}</Text> : null}

        {/* Description */}
        {description && description !== address && (
          <Text style={styles.descriptionText} numberOfLines={3}>{description}</Text>
        )}

        {/* Rating */}
        {typeof attraction.rating === "number" && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#ffd86b" />
            <Text style={styles.ratingText}>{attraction.rating}</Text>
            {typeof attraction.user_ratings_total === "number" && <Text style={styles.ratingCount}>({attraction.user_ratings_total})</Text>}
          </View>
        )}

        {/* Tags/Types */}
        {types.length > 0 && (
          <View style={styles.tagsContainer}>
            {types.slice(0, 5).map((type: string, idx: number) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagText}>{formatTypeLabel(type)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Links */}
        <View style={styles.linksRow}>
          {attraction.website && (
            <TouchableOpacity style={styles.linkBtn} onPress={() => openUrl(attraction.website)}>
              <Ionicons name="link" size={16} color="#fff" />
              <Text style={styles.linkText}>Website</Text>
            </TouchableOpacity>
          )}
          {(attraction.phone || attraction.international_phone) && (
            <TouchableOpacity style={styles.linkBtn} onPress={() => openUrl(`tel:${attraction.phone || attraction.international_phone}`)}>
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.linkText}>Call</Text>
            </TouchableOpacity>
          )}
          {attraction.latitude && attraction.longitude && (
            <TouchableOpacity style={styles.linkBtn} onPress={() => openMaps(attraction.latitude, attraction.longitude, attraction.location)}>
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.linkText}>Map</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.linkBtn} onPress={() => shareAttraction(attraction)}>
            <Ionicons name="share-social" size={16} color="#fff" />
            <Text style={styles.linkText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Opening hours */}
        {opening_hours?.weekday_text?.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Opening Hours</Text>
            {opening_hours.weekday_text.map((line: string, idx: number) => (
              <Text key={idx} style={styles.openText}>{line}</Text>
            ))}
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.map((r: any, idx: number) => (
              <View key={idx} style={styles.reviewCard}>
                <Text style={styles.reviewAuthor}>{r.author_name || r.author || "User"}</Text>
                {typeof r.rating === "number" && <Text style={styles.reviewRating}>Rating: {r.rating}</Text>}
                {r.text && <Text style={styles.reviewText}>{r.text}</Text>}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Search */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Search..."
            placeholderTextColor="#9fb99a"
            onChangeText={setQuery}
            value={query}
            returnKeyType="search"
            onSubmitEditing={doSearch}
          />
          <TouchableOpacity onPress={doSearch} style={styles.searchBtn}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#3a7d3a" />
        ) : error ? (
          <Text style={{ color: "#fff", padding: 16 }}>{error}</Text>
        ) : results.length === 0 ? (
          <Text style={{ color: "#fff", padding: 16 }}>No attractions found</Text>
        ) : (
          results.map(renderCard)
        )}
      </ScrollView>

      {/* Chat Floating Button */}
      <TouchableOpacity
        style={styles.chatFab}
        onPress={() => setChatVisible(true)}
      >
        <Ionicons name="chatbubbles" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChatVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatModalContainer}
        >
          <View style={styles.chatModal}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>🗽 NYC Trip Planner</Text>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {chatMessages.length === 0 && (
                <View style={styles.chatWelcome}>
                  <Text style={styles.chatWelcomeText}>
                    👋 Hi! I'm your NYC trip planning assistant.
                  </Text>
                  <Text style={styles.chatWelcomeSubtext}>
                    Ask me things like:
                  </Text>
                  <Text style={styles.chatExample}>"I want to visit museums and parks, I have 3 hours"</Text>
                  <Text style={styles.chatExample}>"Family-friendly activities for kids"</Text>
                  <Text style={styles.chatExample}>"Best places for photography in Manhattan"</Text>
                </View>
              )}
              {chatMessages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.chatBubble,
                    msg.role === "user" ? styles.chatBubbleUser : styles.chatBubbleAssistant
                  ]}
                >
                  {msg.role === "user" ? (
                    <Text style={styles.chatBubbleText}>{msg.content}</Text>
                  ) : (
                    <Markdown style={markdownStyles}>{msg.content}</Markdown>
                  )}
                </View>
              ))}
              {chatLoading && (
                <ActivityIndicator style={{ marginTop: 12 }} color="#3a7d3a" />
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask about NYC attractions..."
                placeholderTextColor="#6b8a6b"
                value={chatQuery}
                onChangeText={setChatQuery}
                onSubmitEditing={sendChatMessage}
                editable={!chatLoading}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, chatLoading && { opacity: 0.5 }]}
                onPress={sendChatMessage}
                disabled={chatLoading}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1a10" },
  searchRow: { flexDirection: "row", padding: 12 },
  input: { flex: 1, backgroundColor: "#122012", padding: 10, borderRadius: 12, color: "#fff", marginRight: 8 },
  searchBtn: { backgroundColor: "#3a7d3a", padding: 10, borderRadius: 12, justifyContent: "center", alignItems: "center" },

  card: { marginBottom: 24, backgroundColor: "#0f2416", borderRadius: 12, padding: 16 },

  // Badge row for primary type, status, and price
  badgeRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 8, gap: 8 },
  primaryTypeBadge: { backgroundColor: "#3a7d3a", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  primaryTypeBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "600" },
  priceLevel: { color: "#4ade80", fontSize: 14, fontWeight: "700" },

  title: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 4 },
  address: { color: "#9fb99a", marginBottom: 6 },

  // Description
  descriptionText: { color: "#c4d4c0", fontSize: 14, lineHeight: 20, marginBottom: 10 },

  // Rating
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  ratingText: { color: "#fff", fontWeight: "700", marginLeft: 4 },
  ratingCount: { color: "#9fb99a", marginLeft: 4 },

  // Tags
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12, gap: 6 },
  tagChip: { backgroundColor: "#1a3d2a", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: "#2d5a3d" },
  tagText: { color: "#9fb99a", fontSize: 12 },

  linksRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  linkBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: "#224d22", marginRight: 8, marginTop: 6 },
  linkText: { color: "#fff", marginLeft: 6 },

  sectionTitle: { color: "#fff", fontWeight: "700", marginBottom: 6 },
  openText: { color: "#9fb99a", fontSize: 13 },

  reviewCard: { padding: 12, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, marginBottom: 8 },
  reviewAuthor: { color: "#fff", fontWeight: "700", marginBottom: 2 },
  reviewRating: { color: "#ffd86b", marginBottom: 2 },
  reviewText: { color: "#9fb99a", fontSize: 13 },

  playOverlay: { position: "absolute", alignSelf: "center", top: "40%", backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 40, padding: 12 },

  // Chat styles
  chatFab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3a7d3a",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  chatModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  chatModal: {
    height: "80%",
    backgroundColor: "#0f1a10",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a3d2a",
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  chatMessages: {
    flex: 1,
    marginTop: 12,
  },
  chatWelcome: {
    padding: 16,
    backgroundColor: "#1a3d2a",
    borderRadius: 12,
    marginBottom: 16,
  },
  chatWelcomeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  chatWelcomeSubtext: {
    color: "#9fb99a",
    marginBottom: 8,
  },
  chatExample: {
    color: "#4ade80",
    fontSize: 13,
    marginBottom: 4,
    fontStyle: "italic",
  },
  chatBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  chatBubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#3a7d3a",
  },
  chatBubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "#1a3d2a",
  },
  chatBubbleText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
  chatInputRow: {
    flexDirection: "row",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1a3d2a",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#122012",
    padding: 12,
    borderRadius: 20,
    color: "#fff",
    marginRight: 8,
  },
  chatSendBtn: {
    backgroundColor: "#3a7d3a",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
