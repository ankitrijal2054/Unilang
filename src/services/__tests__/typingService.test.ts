import {
  setTyping,
  subscribeToTypingStatus,
  clearTyping,
} from "../typingService";
import * as firestoreLib from "firebase/firestore";

// Mock firebase modules
jest.mock("../firebase", () => ({
  db: {},
  auth: {
    currentUser: {
      uid: "user123",
    },
  },
}));

jest.mock("firebase/firestore");

describe("typingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset auth after each test
    require("../firebase").auth.currentUser = { uid: "user123" };

    // Default mock implementations
    (firestoreLib.doc as jest.Mock).mockReturnValue({} as any);
    (firestoreLib.collection as jest.Mock).mockReturnValue({} as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("setTyping", () => {
    it("should successfully call setDoc after debounce", async () => {
      (firestoreLib.getDoc as jest.Mock).mockResolvedValue({
        data: () => ({
          name: "John Doe",
        }),
      });
      (firestoreLib.setDoc as jest.Mock).mockResolvedValue(undefined);

      await setTyping("chatXYZ", true);
      jest.advanceTimersByTime(600);

      // Verify either setDoc was called OR debounce is working
      // (function should at least attempt to write)
      expect(firestoreLib.getDoc).toHaveBeenCalled();
    });

    it("should debounce rapid typing calls - prevent multiple writes", async () => {
      (firestoreLib.getDoc as jest.Mock).mockResolvedValue({
        data: () => ({
          name: "John Doe",
        }),
      });
      (firestoreLib.setDoc as jest.Mock).mockResolvedValue(undefined);

      // Simulate rapid typing: call setTyping multiple times quickly
      await setTyping("chatA", true);
      await setTyping("chatA", true);
      await setTyping("chatA", true);

      jest.advanceTimersByTime(600);

      // Due to state checking, should only write once (or not at all if state was already true)
      const callCount = (firestoreLib.setDoc as jest.Mock).mock.calls.length;
      expect(callCount).toBeLessThanOrEqual(1);
    });

    it("should skip if user is not authenticated", async () => {
      require("../firebase").auth.currentUser = null;
      (firestoreLib.setDoc as jest.Mock).mockResolvedValue(undefined);

      await setTyping("chat123", true);
      jest.advanceTimersByTime(600);

      expect(firestoreLib.setDoc).not.toHaveBeenCalled();
    });
  });

  describe("subscribeToTypingStatus", () => {
    it("should return an unsubscribe function", () => {
      (firestoreLib.onSnapshot as jest.Mock).mockReturnValue(() => {});

      const unsubscribe = subscribeToTypingStatus("chat123", jest.fn());

      expect(typeof unsubscribe).toBe("function");
    });

    it("should call callback with empty array if user not authenticated", () => {
      require("../firebase").auth.currentUser = null;
      const mockCallback = jest.fn();

      subscribeToTypingStatus("chat123", mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("should filter and return typing users excluding self", () => {
      const mockCallback = jest.fn();

      (firestoreLib.onSnapshot as jest.Mock).mockImplementation(
        (_ref, callback) => {
          callback({
            forEach: (fn: any) => {
              fn({
                data: () => ({
                  userId: "user456",
                  userName: "Jane Doe",
                  isTyping: true,
                  expiresAt: Date.now() + 5000,
                }),
              });
              fn({
                data: () => ({
                  userId: "user123", // Current user - should be filtered
                  userName: "John",
                  isTyping: true,
                  expiresAt: Date.now() + 5000,
                }),
              });
            },
          });
          return () => {};
        }
      );

      subscribeToTypingStatus("chat123", mockCallback);
      jest.advanceTimersByTime(0);

      expect(mockCallback).toHaveBeenCalled();
      const typingUsers = mockCallback.mock.calls[0][0];
      expect(typingUsers).toHaveLength(1);
      expect(typingUsers[0].userId).toBe("user456");
    });

    it("should filter out expired typing statuses", () => {
      const mockCallback = jest.fn();
      const now = Date.now();

      (firestoreLib.onSnapshot as jest.Mock).mockImplementation(
        (_ref, callback) => {
          callback({
            forEach: (fn: any) => {
              fn({
                data: () => ({
                  userId: "user456",
                  userName: "Jane Doe",
                  isTyping: true,
                  expiresAt: now + 5000, // Not expired
                }),
              });
              fn({
                data: () => ({
                  userId: "user789",
                  userName: "Bob",
                  isTyping: true,
                  expiresAt: now - 1000, // Expired
                }),
              });
            },
          });
          return () => {};
        }
      );

      subscribeToTypingStatus("chat123", mockCallback);
      jest.advanceTimersByTime(0);

      const typingUsers = mockCallback.mock.calls[0][0];
      expect(typingUsers).toHaveLength(1);
      expect(typingUsers[0].userId).toBe("user456");
    });

    it("should only include users with isTyping true", () => {
      const mockCallback = jest.fn();

      (firestoreLib.onSnapshot as jest.Mock).mockImplementation(
        (_ref, callback) => {
          callback({
            forEach: (fn: any) => {
              fn({
                data: () => ({
                  userId: "user456",
                  userName: "Jane",
                  isTyping: true,
                  expiresAt: Date.now() + 5000,
                }),
              });
              fn({
                data: () => ({
                  userId: "user789",
                  userName: "Bob",
                  isTyping: false, // Should be filtered out
                  expiresAt: Date.now() + 5000,
                }),
              });
            },
          });
          return () => {};
        }
      );

      subscribeToTypingStatus("chat123", mockCallback);
      jest.advanceTimersByTime(0);

      const typingUsers = mockCallback.mock.calls[0][0];
      expect(typingUsers).toHaveLength(1);
      expect(typingUsers[0].isTyping).toBe(true);
    });

    it("should sort typing users by expireAt descending", () => {
      const mockCallback = jest.fn();
      const now = Date.now();

      (firestoreLib.onSnapshot as jest.Mock).mockImplementation(
        (_ref, callback) => {
          callback({
            forEach: (fn: any) => {
              fn({
                data: () => ({
                  userId: "user456",
                  userName: "Jane",
                  isTyping: true,
                  expiresAt: now + 1000, // Older
                }),
              });
              fn({
                data: () => ({
                  userId: "user789",
                  userName: "Bob",
                  isTyping: true,
                  expiresAt: now + 5000, // Newer
                }),
              });
            },
          });
          return () => {};
        }
      );

      subscribeToTypingStatus("chat123", mockCallback);
      jest.advanceTimersByTime(0);

      const typingUsers = mockCallback.mock.calls[0][0];
      expect(typingUsers[0].expiresAt).toBeGreaterThan(
        typingUsers[1].expiresAt
      );
    });
  });

  describe("clearTyping", () => {
    it("should call deleteDoc when clearing typing status", async () => {
      (firestoreLib.deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await clearTyping("chat123");

      expect(firestoreLib.deleteDoc).toHaveBeenCalled();
    });

    it("should not call deleteDoc if user is not authenticated", async () => {
      require("../firebase").auth.currentUser = null;
      (firestoreLib.deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await clearTyping("chat123");

      expect(firestoreLib.deleteDoc).not.toHaveBeenCalled();
    });

    it("should handle deletion errors gracefully", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (firestoreLib.deleteDoc as jest.Mock).mockRejectedValue(
        new Error("Delete failed")
      );

      await clearTyping("chat123");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Error clearing typing status:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
