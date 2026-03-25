import { RouteProp } from "@react-navigation/native";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View } from "react-native";

type Params = {
  VideoPlayer: { uri: string };
};

type Props = {
  route: RouteProp<Params, "VideoPlayer">;
};

export default function VideoPlayerScreen({ route }: Props) {
  const { uri } = route.params;

  // Create player for this video
  const player = useVideoPlayer(uri);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  video: {
    flex: 1,
  },
});
