// Optional module loader for native modules that may not be available in Expo Go

export const loadDocumentScanner = () => {
  try {
    // @ts-ignore - Module may not exist in Expo Go
    return require('react-native-document-scanner-plugin').default;
  } catch (error) {
    console.log('Document scanner module not available');
    return null;
  }
};

export const loadBlobUtil = () => {
  try {
    // @ts-ignore
    return require('react-native-blob-util').default;
  } catch (error) {
    console.log('Blob util module not available');
    return null;
  }
};

export const loadImagesToPdf = () => {
  try {
    // @ts-ignore
    return require('react-native-images-to-pdf');
  } catch (error) {
    console.log('Images to PDF module not available');
    return null;
  }
};
