import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera, CameraView } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useRef, useState } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";

type NavProp = NativeStackNavigationProp<RootStackParamList, "CapturesScreen">;

const saveVideo = async (uri: string) => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    console.warn("Media Library permissions denied");
    return;
  }

  try {
    const asset = await MediaLibrary.createAssetAsync(uri);
    const albumName = "CheckMate Captures";
    let album = await MediaLibrary.getAlbumAsync(albumName);

    if (!album) {
      album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album.id, false);
    }

    console.log(`Saved to album "${albumName}":`, asset);
    return asset;
  } catch (err) {
    console.error("Error saving video to album:", err);
  }
};

const getMediaPermissions = async () => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    alert("Media permissions required to save videos");
    return false;
  }
  return true;
};

export default function RecorderScreen() {
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<NavProp>();
  const isFocused = useIsFocused();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [captureIndex, setCaptureIndex] = useState(1);
  const [captures, setCaptures] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    (async () => {
      const cam = await Camera.requestCameraPermissionsAsync();
      const mic = await Camera.requestMicrophonePermissionsAsync();
      setHasPermission(cam.status === "granted" && mic.status === "granted");
    })();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (recording) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording]);

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting permissions...</Text>
      </View>
    );
  }
  
  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.permissionText}>Camera access is required</Text>
      </View>
    );
  }

  const startCapture = async () => {
    try {
      setRecording(true);

      const video = await cameraRef.current?.recordAsync({
        maxDuration: 60,
      });

      if (video?.uri) {
        setCaptures((prev) => [...prev, video.uri]);
        const granted = await getMediaPermissions();
        if (!granted) return;
        await saveVideo(video.uri);
      }
    } catch (err) {
      console.error("Start Capture Error:", err);
    }
  };

  const stopCapture = () => {
    cameraRef.current?.stopRecording();
    setRecording(false);
    setSeconds(0);
    setCaptureIndex((prev) => prev + 1);
  };

  const resetAll = async () => {
    for (let uri of captures) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
    setCaptures([]);
    setSeconds(0);
    setRecording(false);
    setCaptureIndex(1);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        {isFocused && (
          <CameraView
            mode="video"
            ref={cameraRef}
            style={styles.camera}
            mute={true}
          />
        )}
        
        {/* Timer Overlay */}
        <View style={styles.timerContainer}>
          <View style={[styles.timerBadge, recording && styles.timerBadgeRecording]}>
            {recording && <View style={styles.recordingDot} />}
            <Text style={styles.timerText}>{formatTime(seconds)}</Text>
          </View>
        </View>
      </View>

      {/* Controls Section */}
      <View style={styles.controlsContainer}>
        {/* Capture Info */}
        <View style={styles.infoSection}>
          <Text style={styles.captureLabel}>Capture Session</Text>
          <Text style={styles.captureNumber}>#{captureIndex}</Text>
        </View>

        {/* Main Capture Button */}
        <TouchableOpacity
          style={[styles.captureButton, recording && styles.captureButtonRecording]}
          onPress={recording ? stopCapture : startCapture}
          activeOpacity={0.8}
        >
          <View style={styles.captureButtonInner}>
            <Ionicons
              name={recording ? "stop" : "radio-button-on"}
              size={32}
              color={theme.colors.onPrimary}
            />
            <Text style={styles.captureButtonText}>
              {recording ? "End Capture" : "Begin Capture"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={resetAll}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Reset All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, styles.viewButton]}
            onPress={() => navigation.navigate("CapturesScreen")}
            activeOpacity={0.7}
          >
            <Ionicons name="folder-open" size={20} color={theme.colors.primary} />
            <Text style={[styles.secondaryButtonText, styles.viewButtonText]}>
              View Captures
            </Text>
            {captures.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{captures.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ---------------- STYLES ----------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  permissionText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    overflow: "hidden",
    ...theme.shadows.lg,
  },
  camera: {
    flex: 1,
  },
  timerContainer: {
    position: "absolute",
    top: theme.spacing.xl,
    alignSelf: "center",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    ...theme.shadows.md,
  },
  timerBadgeRecording: {
    backgroundColor: "rgba(255, 82, 82, 0.95)",
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.onPrimary,
    marginRight: theme.spacing.sm,
  },
  timerText: {
    ...theme.typography.h3,
    color: theme.colors.accent,
    fontWeight: "700",
  },
  controlsContainer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  captureLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  captureNumber: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  captureButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  captureButtonRecording: {
    backgroundColor: theme.colors.error,
  },
  captureButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  captureButtonText: {
    ...theme.typography.h3,
    color: theme.colors.onPrimary,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewButton: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.primary,
    position: "relative",
  },
  secondaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  viewButtonText: {
    color: theme.colors.primary,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.round,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.sm,
  },
  badgeText: {
    ...theme.typography.small,
    color: theme.colors.onPrimary,
    fontWeight: "700",
    fontSize: 11,
  },
});
