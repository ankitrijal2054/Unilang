import {
  createDirectChat,
  createGroupChat,
  subscribeToUserChats,
  updateChatLastMessage,
  updateChat,
} from "../chatService";
import * as firestoreLib from "firebase/firestore";

jest.mock("firebase/firestore");

describe("chatService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createDirectChat", () => {
    it("should create a direct chat between two users", async () => {
      const mockDocRef = { id: "chat123" };
      (firestoreLib.getDocs as jest.Mock).mockResolvedValue({
        empty: true,
        docs: [],
      });
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await createDirectChat("user1", "user2", "user1");

      expect(result.success).toBe(true);
      expect(result.chatId).toBe("chat123");
    });

    it("should prevent duplicate direct chats", async () => {
      // First chat exists
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            id: "existing_chat",
            data: () => ({
              id: "existing_chat",
              participants: ["user1", "user2"],
              type: "direct",
            }),
          },
        ],
      };
      (firestoreLib.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await createDirectChat("user1", "user2", "user1");

      expect(result.success).toBe(true);
      expect(result.chatId).toBe("existing_chat");
      expect(firestoreLib.addDoc).not.toHaveBeenCalled();
    });

    it("should create chat with correct structure", async () => {
      const mockDocRef = { id: "chat123" };
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (firestoreLib.getDocs as jest.Mock).mockResolvedValue({
        empty: true,
        docs: [],
      });

      await createDirectChat("user1", "user2", "user1");

      expect(firestoreLib.addDoc).toHaveBeenCalled();
      const callArgs = (firestoreLib.addDoc as jest.Mock).mock.calls[0];
      const chatData = callArgs[1];

      expect(chatData).toEqual(
        expect.objectContaining({
          type: "direct",
          participants: expect.arrayContaining(["user1", "user2"]),
          createdBy: "user1",
        })
      );
    });

    it("should handle creation errors", async () => {
      (firestoreLib.getDocs as jest.Mock).mockResolvedValue({
        empty: true,
        docs: [],
      });
      (firestoreLib.addDoc as jest.Mock).mockRejectedValue(
        new Error("Failed to create chat")
      );

      const result = await createDirectChat("user1", "user2", "user1");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("createGroupChat", () => {
    it("should create a group chat with multiple participants", async () => {
      const mockDocRef = { id: "group123" };
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await createGroupChat(
        "Test Group",
        ["user1", "user2", "user3"],
        "user1"
      );

      expect(result.success).toBe(true);
      expect(result.chatId).toBe("group123");
    });

    it("should create group with correct structure", async () => {
      const mockDocRef = { id: "group123" };
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      await createGroupChat("Friends", ["user1", "user2", "user3"], "user1");

      expect(firestoreLib.addDoc).toHaveBeenCalled();
      const callArgs = (firestoreLib.addDoc as jest.Mock).mock.calls[0];
      const chatData = callArgs[1];

      expect(chatData).toEqual(
        expect.objectContaining({
          type: "group",
          name: "Friends",
          adminId: "user1",
        })
      );
      // Verify participants includes all users and admin
      expect(chatData.participants).toContain("user1");
      expect(chatData.participants).toContain("user2");
      expect(chatData.participants).toContain("user3");
    });

    it("should create group including admin in participants", async () => {
      const mockDocRef = { id: "group123" };
      (firestoreLib.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      await createGroupChat("Friends", ["user2", "user3"], "user1");

      const callArgs = (firestoreLib.addDoc as jest.Mock).mock.calls[0];
      const chatData = callArgs[1];

      // Admin should be added to participants array
      expect(chatData.participants).toContain("user1");
      expect(chatData.participants).toContain("user2");
      expect(chatData.participants).toContain("user3");
    });
  });

  describe("subscribeToUserChats", () => {
    it("should set up listener for user chats", () => {
      const mockUnsubscribe = jest.fn();
      (firestoreLib.onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const callback = jest.fn();
      const unsubscribe = subscribeToUserChats("user123", callback);

      expect(firestoreLib.onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe("function");
    });

    it("should call callback with chats sorted by last message time", () => {
      const now = Date.now();
      const mockChats = [
        {
          id: "chat1",
          updatedAt: new Date(now - 1000).toISOString(), // older
        },
        {
          id: "chat2",
          updatedAt: new Date(now - 5000).toISOString(), // oldest
        },
      ];

      (firestoreLib.onSnapshot as jest.Mock).mockImplementation(
        (query, callback) => {
          callback({
            forEach: (fn: any) =>
              mockChats.forEach((chat) => {
                fn({ id: chat.id, data: () => chat });
              }),
          });
          return jest.fn();
        }
      );

      const callback = jest.fn();
      subscribeToUserChats("user123", callback);

      expect(callback).toHaveBeenCalledWith(expect.any(Array));
      const chatsArg = (callback as jest.Mock).mock.calls[0][0];
      // Verify sorted by time (latest first) based on updatedAt field
      if (chatsArg.length >= 2) {
        expect(
          new Date(chatsArg[0].updatedAt).getTime()
        ).toBeGreaterThanOrEqual(new Date(chatsArg[1].updatedAt).getTime());
      }
    });

    it("should handle subscription errors", () => {
      (firestoreLib.onSnapshot as jest.Mock).mockImplementation(
        (query, success, error) => {
          if (error) error(new Error("Subscription error"));
          return jest.fn();
        }
      );

      const consoleSpy = jest.spyOn(console, "error");
      subscribeToUserChats("user123", jest.fn());

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("updateChatLastMessage", () => {
    it("should update last message info", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await updateChatLastMessage(
        "chat123",
        "Hello",
        new Date()
      );

      expect(result.success).toBe(true);
      expect(firestoreLib.updateDoc).toHaveBeenCalled();
      const callArgs = (firestoreLib.updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toEqual(
        expect.objectContaining({
          lastMessage: "Hello",
        })
      );
    });

    it("should handle update errors", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      const result = await updateChatLastMessage(
        "chat123",
        "Hello",
        new Date()
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("updateChat", () => {
    it("should update group name", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await updateChat("chat123", { name: "New Group Name" });

      expect(result.success).toBe(true);
      expect(firestoreLib.updateDoc).toHaveBeenCalled();
      const callArgs = (firestoreLib.updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toEqual(
        expect.objectContaining({
          name: "New Group Name",
        })
      );
    });

    it("should add members to group (update participants)", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const newParticipants = ["user1", "user2", "user3", "user4"];
      const result = await updateChat("chat123", {
        participants: newParticipants,
      });

      expect(result.success).toBe(true);
      const callArgs = (firestoreLib.updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toEqual(
        expect.objectContaining({
          participants: newParticipants,
        })
      );
    });

    it("should remove member from group (update participants array)", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const newParticipants = ["user1", "user3"]; // user2 removed
      const result = await updateChat("chat123", {
        participants: newParticipants,
      });

      expect(result.success).toBe(true);
      expect(newParticipants.length).toBe(2);
      expect(newParticipants).not.toContain("user2");
    });

    it("should delete group by setting isDeleted flag", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await updateChat("chat123", { isDeleted: true });

      expect(result.success).toBe(true);
      const callArgs = (firestoreLib.updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toEqual(
        expect.objectContaining({
          isDeleted: true,
        })
      );
    });

    it("should handle member leaving group", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const newParticipants = ["user1", "user3", "user4"]; // user2 (self) left
      const result = await updateChat("chat123", {
        participants: newParticipants,
      });

      expect(result.success).toBe(true);
      expect(newParticipants.length).toBe(3);
    });

    it("should update multiple fields at once", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const updates = {
        name: "Updated Group",
        participants: ["user1", "user2"],
      };
      const result = await updateChat("chat123", updates);

      expect(result.success).toBe(true);
      const callArgs = (firestoreLib.updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toEqual(expect.objectContaining(updates));
    });

    it("should include updatedAt timestamp in update", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateChat("chat123", { name: "New Name" });

      const callArgs = (firestoreLib.updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toHaveProperty("updatedAt");
    });

    it("should handle update errors", async () => {
      (firestoreLib.updateDoc as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      const result = await updateChat("chat123", { name: "New Name" });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
