import React, { useState, useEffect } from "react";
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
} from "react-native";
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

  const renderCard = (attraction: any, i: number) => {
    const media = buildMedia(attraction);
    const reviews = Array.isArray(attraction.reviews) ? attraction.reviews : [];
    const opening_hours = attraction.opening_hours;
    const address = attraction.formatted_address || attraction.address || attraction.vicinity || "";
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


        {/* Title + address + rating */}
        <Text style={styles.title}>{attraction.location || attraction.description}</Text>
        {address ? <Text style={styles.address}>{address}</Text> : null}
        {typeof attraction.rating === "number" && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#ffd86b" />
            <Text style={styles.ratingText}>{attraction.rating}</Text>
            {typeof attraction.user_ratings_total === "number" && <Text style={styles.ratingCount}>({attraction.user_ratings_total})</Text>}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1a10" },
  searchRow: { flexDirection: "row", padding: 12 },
  input: { flex: 1, backgroundColor: "#122012", padding: 10, borderRadius: 12, color: "#fff", marginRight: 8 },
  searchBtn: { backgroundColor: "#3a7d3a", padding: 10, borderRadius: 12, justifyContent: "center", alignItems: "center" },

  card: { marginBottom: 24, backgroundColor: "#0f2416", borderRadius: 12, padding: 16 },

  title: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 4 },
  address: { color: "#9fb99a", marginBottom: 6 },

  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  ratingText: { color: "#fff", fontWeight: "700", marginLeft: 4 },
  ratingCount: { color: "#9fb99a", marginLeft: 4 },

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
});
