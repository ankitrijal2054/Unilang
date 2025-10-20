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

// Mock console methods in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
