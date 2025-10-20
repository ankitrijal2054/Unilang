import {
  sendMessage,
  subscribeToMessages,
  updateMessageStatus,
} from "../messageService";
import * as firestoreLib from "firebase/firestore";

jest.mock("firebase/firestore");

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
});
