import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "react-native";

type CompressionOptions = {
  maxEdge?: number;
  jpegQuality?: number;
};

const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_JPEG_QUALITY = 0.7;

const ensureFileUri = (p: string) => (p.startsWith("file://") ? p : `file://${p}`);

const getImageSize = (uri: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });

export const compressImageForPdf = async (
  inputUri: string,
  options: CompressionOptions = {}
): Promise<string> => {
  const uri = ensureFileUri(inputUri);
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const jpegQuality = options.jpegQuality ?? DEFAULT_JPEG_QUALITY;

  try {
    const { width, height } = await getImageSize(uri);
    const longestEdge = Math.max(width, height);
    const scale = Math.min(1, maxEdge / longestEdge);

    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const actions: ImageManipulator.Action[] = [];
    if (scale < 1) {
      actions.push({ resize: { width: targetWidth, height: targetHeight } });
    }

    const result = await ImageManipulator.manipulateAsync(actions.length ? uri : uri, actions, {
      compress: jpegQuality,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return ensureFileUri(result.uri);
  } catch {
    const result = await ImageManipulator.manipulateAsync(uri, [], {
      compress: jpegQuality,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return ensureFileUri(result.uri);
  }
};

export const compressImagesForPdf = async (
  inputUris: string[],
  options: CompressionOptions = {}
): Promise<string[]> => {
  const out: string[] = [];
  for (const u of inputUris) {
    out.push(await compressImageForPdf(u, options));
  }
  return out;
};
