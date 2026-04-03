import { PDFDocument } from "pdf-lib";
import { Image } from "react-native";
import RNBlobUtil from "react-native-blob-util";

type ImageInfo = { uri: string; width: number; height: number };

const ensureFileUri = (p: string) => (p.startsWith("file://") ? p : `file://${p}`);

const getImageSize = (uri: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });

const base64ToUint8Array = (base64: string) => {
  // RN-safe base64 decode: use Buffer provided by rn polyfill through RNBlobUtil
  const binary = RNBlobUtil.base64.decode(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const uint8ArrayToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return RNBlobUtil.base64.encode(binary);
};

export const createPdfFromJpegs = async (params: {
  imageUris: string[];
  outputPath: string; // file:///...
}): Promise<string> => {
  const outputUri = ensureFileUri(params.outputPath);
  const outputFilePath = outputUri.replace(/^file:\/\//, "");

  const imageInfos: ImageInfo[] = [];
  for (const uri of params.imageUris) {
    const normalized = ensureFileUri(uri);
    const { width, height } = await getImageSize(normalized);
    imageInfos.push({ uri: normalized, width, height });
  }

  const pdfDoc = await PDFDocument.create();

  for (const info of imageInfos) {
    const filePath = info.uri.replace(/^file:\/\//, "");
    const base64 = await RNBlobUtil.fs.readFile(filePath, "base64");
    const jpgBytes = base64ToUint8Array(base64);

    const embedded = await pdfDoc.embedJpg(jpgBytes);

    // Use the scanned image aspect ratio for the page.
    // Use 1px == 1pt to keep it simple; PDF viewers will scale to screen.
    const page = pdfDoc.addPage([info.width, info.height]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: info.width,
      height: info.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBase64 = uint8ArrayToBase64(pdfBytes);

  await RNBlobUtil.fs.writeFile(outputFilePath, pdfBase64, "base64");

  return outputUri;
};
