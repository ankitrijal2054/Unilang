import {
  updateUserStatus,
  updateUserProfile,
  subscribeToUserPresence,
  getAllUsers,
  updateUserFCMToken,
} from "../userService";
import { User } from "../../types";

// Mock Firebase modules
jest.mock("../firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "users"),
  doc: jest.fn(() => ({ id: "doc-ref" })),
  updateDoc: jest.fn(async () => {}),
  onSnapshot: jest.fn((ref, callback) => {
    // Mock callback with test user data
    callback({
      exists: () => true,
      id: "user123",
      data: () => ({
        uid: "user123",
        name: "Test User",
        email: "test@example.com",
        preferred_language: "en",
        status: "online",
        lastSeen: new Date().toISOString(),
        fcmToken: "token123",
        createdAt: new Date().toISOString(),
      }),
    });
    return jest.fn(); // Return unsubscribe function
  }),
  getDocs: jest.fn(async () => ({
    forEach: jest.fn((callback) => {
      callback({
        id: "user123",
        data: () => ({
          uid: "user123",
          name: "User One",
          email: "user1@example.com",
          preferred_language: "en",
          status: "online",
          lastSeen: new Date().toISOString(),
          fcmToken: "token1",
          createdAt: new Date().toISOString(),
        }),
      });
      callback({
        id: "user456",
        data: () => ({
          uid: "user456",
          name: "User Two",
          email: "user2@example.com",
          preferred_language: "es",
          status: "offline",
          lastSeen: new Date().toISOString(),
          fcmToken: "token2",
          createdAt: new Date().toISOString(),
        }),
      });
    }),
  })),
}));

describe("userService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateUserStatus", () => {
    it("should update user status to online", async () => {
      const { updateDoc } = require("firebase/firestore");

      const result = await updateUserStatus("user123", "online");

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      console.log("✅ User status updated to online: user123");
    });

    it("should update user status to offline with lastSeen", async () => {
      const { updateDoc } = require("firebase/firestore");

      const result = await updateUserStatus("user123", "offline");

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      const call = updateDoc.mock.calls[0];
      const updateData = call[1];
      expect(updateData.status).toBe("offline");
      expect(updateData.lastSeen).toBeDefined();
      console.log("✅ User status updated to offline: user123");
    });

    it("should handle errors gracefully", async () => {
      const { updateDoc } = require("firebase/firestore");
      updateDoc.mockRejectedValueOnce(new Error("Firebase error"));

      const result = await updateUserStatus("user123", "online");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      console.log("✅ Error handled in updateUserStatus");
    });
  });

  describe("updateUserProfile", () => {
    it("should update user profile with new name", async () => {
      const { updateDoc } = require("firebase/firestore");

      const updates: Partial<User> = { name: "New Name" };
      const result = await updateUserProfile("user123", updates);

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      console.log("✅ User profile updated: user123");
    });

    it("should update user profile with language change", async () => {
      const { updateDoc } = require("firebase/firestore");

      const updates: Partial<User> = { preferred_language: "es" };
      const result = await updateUserProfile("user123", updates);

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      console.log("✅ User language updated: user123");
    });

    it("should update multiple profile fields at once", async () => {
      const { updateDoc } = require("firebase/firestore");

      const updates: Partial<User> = {
        name: "Updated Name",
        preferred_language: "fr",
      };
      const result = await updateUserProfile("user123", updates);

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      console.log("✅ Multiple profile fields updated: user123");
    });

    it("should handle update errors", async () => {
      const { updateDoc } = require("firebase/firestore");
      updateDoc.mockRejectedValueOnce(new Error("Update failed"));

      const updates: Partial<User> = { name: "New Name" };
      const result = await updateUserProfile("user123", updates);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      console.log("✅ Error handled in updateUserProfile");
    });
  });

  describe("subscribeToUserPresence", () => {
    it("should subscribe to user presence updates", (done) => {
      const callback = jest.fn();
      const unsubscribe = subscribeToUserPresence("user123", callback);

      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            uid: "user123",
            status: "online",
          })
        );
        unsubscribe();
        console.log("✅ Presence listener triggered: user123");
        done();
      }, 100);
    });

    it("should return unsubscribe function", () => {
      const callback = jest.fn();
      const unsubscribe = subscribeToUserPresence("user123", callback);

      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
      console.log("✅ Unsubscribe function returned");
    });

    it("should handle presence updates with lastSeen", (done) => {
      const callback = jest.fn();
      subscribeToUserPresence("user123", callback);

      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            lastSeen: expect.any(String),
          })
        );
        console.log("✅ Presence updates with lastSeen: user123");
        done();
      }, 100);
    });

    it("should handle presence callback with null user", (done) => {
      const { onSnapshot } = require("firebase/firestore");
      onSnapshot.mockImplementationOnce((ref, callback) => {
        callback({
          exists: () => false,
        });
        return jest.fn();
      });

      const callback = jest.fn();
      subscribeToUserPresence("user123", callback);

      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(null);
        console.log("✅ Handles null user presence");
        done();
      }, 100);
    });
  });

  describe("getAllUsers", () => {
    it("should fetch all users from Firestore", async () => {
      const result = await getAllUsers();

      expect(result.success).toBe(true);
      expect(result.users).toBeDefined();
      expect(result.users?.length).toBe(2);
      console.log("✅ All users fetched: 2 users");
    });

    it("should return correct user data structure", async () => {
      const result = await getAllUsers();

      if (result.users) {
        const user = result.users[0];
        expect(user.uid).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.status).toBeDefined();
        console.log("✅ User data structure correct");
      }
    });

    it("should include online status for users", async () => {
      const result = await getAllUsers();

      if (result.users) {
        const statuses = result.users.map((u) => u.status);
        expect(statuses).toContain("online");
        expect(statuses).toContain("offline");
        console.log("✅ User statuses included");
      }
    });

    it("should handle fetch errors", async () => {
      const { getDocs } = require("firebase/firestore");
      getDocs.mockRejectedValueOnce(new Error("Fetch error"));

      const result = await getAllUsers();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      console.log("✅ Error handled in getAllUsers");
    });
  });

  describe("updateUserFCMToken", () => {
    it("should update user FCM token", async () => {
      const { updateDoc } = require("firebase/firestore");

      const result = await updateUserFCMToken("user123", "new-fcm-token");

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      console.log("✅ FCM token updated: user123");
    });

    it("should handle FCM token update errors", async () => {
      const { updateDoc } = require("firebase/firestore");
      updateDoc.mockRejectedValueOnce(new Error("Token update failed"));

      const result = await updateUserFCMToken("user123", "new-fcm-token");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      console.log("✅ Error handled in updateUserFCMToken");
    });
  });

  describe("Presence System Integration", () => {
    it("should handle status transitions: online -> offline -> online", async () => {
      const { updateDoc } = require("firebase/firestore");

      // Go online
      const result1 = await updateUserStatus("user123", "online");
      expect(result1.success).toBe(true);

      // Go offline
      const result2 = await updateUserStatus("user123", "offline");
      expect(result2.success).toBe(true);

      // Go online again
      const result3 = await updateUserStatus("user123", "online");
      expect(result3.success).toBe(true);

      expect(updateDoc).toHaveBeenCalledTimes(3);
      console.log("✅ Status transitions handled correctly");
    });

    it("should keep lastSeen updated on status change", async () => {
      const { updateDoc } = require("firebase/firestore");

      await updateUserStatus("user123", "offline");

      const call = updateDoc.mock.calls[0];
      const updateData = call[1];
      const lastSeen1 = updateData.lastSeen;

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      await updateUserStatus("user123", "offline");

      const call2 = updateDoc.mock.calls[1];
      const updateData2 = call2[1];
      const lastSeen2 = updateData2.lastSeen;

      expect(lastSeen1).not.toEqual(lastSeen2);
      console.log("✅ LastSeen timestamp updates correctly");
    });
  });
});
