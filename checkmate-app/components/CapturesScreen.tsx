import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../navigation/types";

type NavProp = NativeStackNavigationProp<RootStackParamList, "CapturesScreen">;

export default function CapturesScreen() {
  const navigation = useNavigation<NavProp>();
  const [videos, setVideos] = useState<MediaLibrary.Asset[]>([]);

  const fetchVideosFromAlbum = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      alert("Media permissions required to view videos");
      return;
    }

    try {
      const albumName = "CheckMate Captures";
      const album = await MediaLibrary.getAlbumAsync(albumName);

      if (!album) {
        setVideos([]);
        return;
      }

      // Fetch assets from this album
      const assets = await MediaLibrary.getAssetsAsync({
        album: album,
        mediaType: ["video"],
        first: 100, // fetch up to 100 videos
        sortBy: [["creationTime", false]], // newest first
      });

      setVideos(assets.assets);
    } catch (err) {
      console.error("Error fetching videos:", err);
    }
  };

  useEffect(() => {
    fetchVideosFromAlbum();
  }, []);

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => navigation.navigate("VideoPlayer", { uri: item.uri })}
    >
      <View style={styles.videoThumbnail}>
        <Ionicons name="play-circle" size={40} color="#ffffff" />
      </View>
      <Text style={styles.videoText}>{item.filename}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {videos.length === 0 ? (
        <Text style={styles.noVideos}>No captures yet!</Text>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
        />
      )}
    </View>
  );
}

// ---------------- STYLES ----------------
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  videoItem: {
    flex: 1,
    margin: 8,
    alignItems: "center",
  },
    videoThumbnail: {
    width: (width - 48) / 2,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
  },
  videoText: {
    color: "#fff",
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
  noVideos: {
    color: "#fff",
    fontSize: 18,
    alignSelf: "center",
    marginTop: 50,
  },
});
