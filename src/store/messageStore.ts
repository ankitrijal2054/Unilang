import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message } from "../types";

/**
 * Message Store Interface
 * Persists messages by chatId for offline access across navigation
 */
interface MessageStore {
  messages: Record<string, Message[]>; // { chatId: [message1, message2, ...] }
  isHydrated: boolean; // Track if store has loaded from storage
  setMessages: (chatId: string, messages: Message[]) => void;
  getMessages: (chatId: string) => Message[];
  clearMessages: (chatId?: string) => void;
  getLastMessage: (chatId: string) => Message | null;
}

/**
 * Message Store with Persistent Storage
 * Automatically saves messages to device storage
 * Survives app restart and navigation
 */
export const useMessageStore = create<MessageStore>()(
  persist(
    (set, get) => ({
      messages: {},
      isHydrated: false,

      /**
       * Set messages for a specific chat
       * Overwrites existing messages for that chatId
       */
      setMessages: (chatId: string, messages: Message[]) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: messages,
          },
        })),

      /**
       * Get messages for a specific chat
       * Returns empty array if no messages found
       */
      getMessages: (chatId: string) => {
        const messages = get().messages[chatId];
        return messages || [];
      },

      /**
       * Get the last (most recent) message from a chat
       * Useful for chat list previews
       */
      getLastMessage: (chatId: string): Message | null => {
        const messages = get().messages[chatId];
        if (!messages || messages.length === 0) {
          return null;
        }
        return messages[messages.length - 1];
      },

      /**
       * Clear messages
       * If chatId provided: clear only that chat's messages
       * If no chatId: clear all messages
       */
      clearMessages: (chatId?: string) => {
        if (chatId) {
          set((state) => {
            const newMessages = { ...state.messages };
            delete newMessages[chatId];
            return { messages: newMessages };
          });
        } else {
          set({ messages: {} });
        }
      },
    }),
    {
      name: "message-storage", // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage), // Use AsyncStorage for React Native
      version: 1, // For future migrations
      onRehydrateStorage: () => (state) => {
        // Called after rehydration from storage
        if (state) {
          state.isHydrated = true;
          console.log("✅ Message store rehydrated from storage");
        }
      },
    }
  )
);
