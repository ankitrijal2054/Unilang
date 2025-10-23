// Jest setup file
// Firebase mocks are set up below

// Mock Firebase
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return jest.fn();
  }),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  enableIndexedDbPersistence: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn((query, callback) => {
    callback({ docs: [] });
    return jest.fn();
  }),
  writeBatch: jest.fn(() => ({
    update: jest.fn(),
    commit: jest.fn(),
  })),
  serverTimestamp: jest.fn(() => new Date().toISOString()),
}));

jest.mock("firebase/messaging", () => ({
  getMessaging: jest.fn(() => ({})),
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(() =>
    Promise.resolve({
      uri: "file://mock-compressed-image.jpg",
      width: 800,
      height: 600,
    })
  ),
  SaveFormat: {
    JPEG: "jpeg",
    PNG: "png",
  },
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "file://mock-image.jpg" }],
    })
  ),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  uploadBytes: jest.fn(() => Promise.resolve({})),
  getDownloadURL: jest.fn(() =>
    Promise.resolve("https://storage.example.com/image.jpg")
  ),
}));

// Mock React Native Image
jest.mock("react-native", () => ({
  Image: {
    getSize: jest.fn((uri, success) => {
      success(800, 600);
    }),
  },
  Platform: {
    OS: "ios",
    select: jest.fn((obj) => obj.ios),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  },
}));

// Mock console methods in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
