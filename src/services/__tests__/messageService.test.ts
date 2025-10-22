import {
  sendMessage,
  subscribeToMessages,
  updateMessageStatus,
  createSystemMessage,
  calculateUnreadCount,
  subscribeToUnreadCount,
} from "../messageService";
import * as firestoreLib from "firebase/firestore";

jest.mock("firebase/firestore");

// Mock networkUtils to prevent react-native-community/netinfo errors in Jest
jest.mock("../../utils/networkUtils", () => ({
  isOnline: jest.fn().mockResolvedValue(true),
  subscribeToNetworkStatus: jest.fn((callback) => {
    callback(true);
    return () => {};
  }),
}));

describe("messageService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("should successfully send a message", async () => {
      const mockDocRef = { id: "msg123" };
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await sendMessage("chat123", "Hello World", "user123");

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg123");
      expect(firestoreLib.addDoc).toHaveBeenCalled();
    });

    it("should create message with correct structure", async () => {
      const mockDocRef = { id: "msg123" };
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      await sendMessage("chat123", "Test message", "user123");

      const callArgs = (firestoreLib.addDoc as jest.Mock).mock.calls[0];
      const messageData = callArgs[1];

      expect(messageData).toEqual(
        expect.objectContaining({
          chatId: "chat123",
          senderId: "user123",
          text: "Test message",
          status: "sent",
          ai: expect.any(Object),
        })
      );
    });

    it("should handle send errors", async () => {
      (firestoreLib.addDoc as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      const result = await sendMessage("chat123", "Hello", "user123");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("subscribeToMessages", () => {
    it("should set up listener and return unsubscribe function", () => {
      const mockUnsubscribe = jest.fn();
      (firestoreLib.onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const callback = jest.fn();
      const unsubscribe = subscribeToMessages("chat123", callback);

      expect(firestoreLib.onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe("function");
    });

    it("should call callback with messages", () => {
      const mockMessages = [
        { id: "msg1", text: "Message 1", timestamp: new Date().toISOString() },
        { id: "msg2", text: "Message 2", timestamp: new Date().toISOString() },
      ];

      (firestoreLib.onSnapshot as jest.Mock).mockImplementation(
        (query, callback) => {
          callback({
            forEach: (fn: any) =>
              mockMessages.forEach((msg) => {
                fn({ id: msg.id, data: () => msg });
              }),
          });
          return jest.fn();
        }
      );

      const callback = jest.fn();
      subscribeToMessages("chat123", callback);

      expect(callback).toHaveBeenCalledWith(expect.any(Array));
    });

    it("should handle subscription errors", () => {
      (firestoreLib.onSnapshot as jest.Mock).mockImplementation(
        (query, success, error) => {
          if (error) error(new Error("Subscription error"));
          return jest.fn();
        }
      );

      const consoleSpy = jest.spyOn(console, "error");
      subscribeToMessages("chat123", jest.fn());

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("updateMessageStatus", () => {
    it("should update message status", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await updateMessageStatus("msg123", "read");

      expect(result.success).toBe(true);
      expect(firestoreLib.updateDoc).toHaveBeenCalled();
      const callArgs = (firestoreLib.updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toEqual(expect.objectContaining({ status: "read" }));
    });

    it("should handle status update errors", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      const result = await updateMessageStatus("msg123", "delivered");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should support all status types", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const statuses: Array<"sending" | "sent" | "delivered" | "read"> = [
        "sending",
        "sent",
        "delivered",
        "read",
      ];

      for (const status of statuses) {
        jest.clearAllMocks();
        (firestoreLib.updateDoc as jest.Mock).mockResolvedValue(undefined);
        await updateMessageStatus("msg123", status);
        expect(firestoreLib.updateDoc).toHaveBeenCalled();
        const callArgs = (firestoreLib.updateDoc as jest.Mock).mock.calls[0];
        expect(callArgs[1]).toEqual(expect.objectContaining({ status }));
      }
    });
  });

  describe("createSystemMessage", () => {
    it("should successfully create a system message", async () => {
      const mockDocRef = { id: "sysmsg123" };
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await createSystemMessage(
        "chat123",
        "User John joined the group"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("sysmsg123");
      expect(firestoreLib.addDoc).toHaveBeenCalled();
    });

    it("should create system message with correct structure", async () => {
      const mockDocRef = { id: "sysmsg123" };
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      await createSystemMessage("chat123", "User left the group");

      const callArgs = (firestoreLib.addDoc as jest.Mock).mock.calls[0];
      const messageData = callArgs[1];

      expect(messageData).toEqual(
        expect.objectContaining({
          chatId: "chat123",
          senderId: "system",
          text: "User left the group",
          type: "system",
          status: "read",
          ai: expect.any(Object),
        })
      );
    });

    it("should have correct AI structure for system messages", async () => {
      const mockDocRef = { id: "sysmsg123" };
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      await createSystemMessage("chat123", "Admin added user");

      const callArgs = (firestoreLib.addDoc as jest.Mock).mock.calls[0];
      const messageData = callArgs[1];

      expect(messageData.ai).toEqual({
        translated_text: "",
        detected_language: "",
        summary: "",
      });
    });

    it("should have timestamp in system message", async () => {
      const mockDocRef = { id: "sysmsg123" };
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      await createSystemMessage("chat123", "System message");

      const callArgs = (firestoreLib.addDoc as jest.Mock).mock.calls[0];
      const messageData = callArgs[1];

      expect(messageData).toHaveProperty("timestamp");
    });

    it("should handle creation errors", async () => {
      (firestoreLib.addDoc as jest.Mock).mockRejectedValue(
        new Error("Firestore error")
      );

      const result = await createSystemMessage("chat123", "User joined");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should support different system message types", async () => {
      const mockDocRef = { id: "sysmsg123" };
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const messages = [
        "User John joined the group",
        "Admin removed user Jane",
        "User Mike left the group",
        "Group name changed to New Group",
      ];

      for (const msg of messages) {
        jest.clearAllMocks();
        (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);
        const result = await createSystemMessage("chat123", msg);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("calculateUnreadCount", () => {
    it("should calculate unread count from multiple chats", async () => {
      const userId = "user123";

      // Mock chats query
      const mockChatsSnapshot = {
        docs: [{ id: "chat1" }, { id: "chat2" }],
      };

      // Mock messages with docs that have data() method
      const mockMessagesChat1 = {
        docs: [
          { data: () => ({ senderId: "user456" }) },
          { data: () => ({ senderId: "user789" }) },
          { data: () => ({ senderId: "user456" }) },
        ],
      };

      const mockMessagesChat2 = {
        docs: [
          { data: () => ({ senderId: "user999" }) },
          { data: () => ({ senderId: "user888" }) },
        ],
      };

      (firestoreLib.getDocs as jest.Mock)
        .mockResolvedValueOnce(mockChatsSnapshot)
        .mockResolvedValueOnce(mockMessagesChat1) // 3 unread in chat1
        .mockResolvedValueOnce(mockMessagesChat2); // 2 unread in chat2

      const result = await calculateUnreadCount(userId);

      expect(result.success).toBe(true);
      expect(result.count).toBe(5); // 3 + 2
    });

    it("should return 0 when no unread messages", async () => {
      const userId = "user123";

      const mockChatsSnapshot = {
        docs: [{ id: "chat1" }],
      };

      const mockMessagesChat1 = {
        docs: [],
      };

      (firestoreLib.getDocs as jest.Mock)
        .mockResolvedValueOnce(mockChatsSnapshot)
        .mockResolvedValueOnce(mockMessagesChat1); // No unread

      const result = await calculateUnreadCount(userId);

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
    });

    it("should handle errors gracefully", async () => {
      const userId = "user123";

      (firestoreLib.getDocs as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const result = await calculateUnreadCount(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should exclude messages from the user themselves", async () => {
      const userId = "user123";

      const mockChatsSnapshot = {
        docs: [{ id: "chat1" }],
      };

      const mockMessagesChat1 = {
        docs: [
          { data: () => ({ senderId: "user123" }) }, // Should be filtered out
          { data: () => ({ senderId: "user456" }) }, // Should be counted
        ],
      };

      (firestoreLib.getDocs as jest.Mock)
        .mockResolvedValueOnce(mockChatsSnapshot)
        .mockResolvedValueOnce(mockMessagesChat1);

      const result = await calculateUnreadCount(userId);

      // Only 1 message should be counted (user456's message, not user123's)
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });
  });

  describe("subscribeToUnreadCount", () => {
    it("should setup listener for unread count changes", () => {
      const userId = "user123";
      const callback = jest.fn();

      (firestoreLib.onSnapshot as jest.Mock).mockReturnValue(() => {});

      subscribeToUnreadCount(userId, callback);

      expect(firestoreLib.onSnapshot).toHaveBeenCalled();
    });

    it("should call callback with unread count", async () => {
      const userId = "user123";
      const callback = jest.fn();

      let snapshotCallback: ((snapshot: any) => void) | undefined;
      (firestoreLib.onSnapshot as jest.Mock).mockImplementation((query, cb) => {
        snapshotCallback = cb;
        return () => {};
      });

      const mockChatsSnapshot = {
        docs: [{ id: "chat1" }],
      };

      const mockMessagesSnapshot = {
        docs: [
          { data: () => ({ senderId: "user456", status: "sent" }) },
          { data: () => ({ senderId: "user789", status: "sent" }) },
          { data: () => ({ senderId: "user456", status: "delivered" }) },
          { data: () => ({ senderId: "user999", status: "sent" }) },
          { data: () => ({ senderId: "user888", status: "sent" }) },
        ],
      };

      (firestoreLib.getDocs as jest.Mock)
        .mockResolvedValueOnce(mockChatsSnapshot)
        .mockResolvedValueOnce(mockMessagesSnapshot); // 5 unread from others

      subscribeToUnreadCount(userId, callback);

      // Trigger the snapshot
      await snapshotCallback?.({});

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(callback).toHaveBeenCalledWith(5);
    });

    it("should return unsubscribe function", () => {
      const userId = "user123";
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (firestoreLib.onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = subscribeToUnreadCount(userId, callback);

      expect(typeof unsubscribe).toBe("function");
    });

    it("should handle subscription errors", () => {
      const userId = "user123";
      const callback = jest.fn();

      (firestoreLib.onSnapshot as jest.Mock).mockImplementation(() => {
        throw new Error("Subscription error");
      });

      const unsubscribe = subscribeToUnreadCount(userId, callback);

      // Should return a no-op function instead of throwing
      expect(typeof unsubscribe).toBe("function");
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
