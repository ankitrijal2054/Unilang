import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Chat } from "../types";
import { db } from "../services/firebase";
import { COLLECTIONS } from "./constants";

/**
 * Hook to get the display name for a chat
 * - For group chats: returns the group name
 * - For direct chats: fetches and returns the other participant's name
 * - Falls back to "Chat" if unable to determine
 */
export const useChatDisplayName = (chat: Chat, currentUserId?: string) => {
  const [displayName, setDisplayName] = useState<string>("Chat");

  useEffect(() => {
    const fetchDisplayName = async () => {
      // Group chat - use group name
      if (chat.type === "group" && chat.name) {
        setDisplayName(chat.name);
        return;
      }

      // Direct chat - fetch other participant's name
      if (chat.type === "direct" && currentUserId) {
        try {
          const otherParticipantId = chat.participants.find(
            (p) => p !== currentUserId
          );

          if (otherParticipantId) {
            const userDocRef = doc(db, COLLECTIONS.USERS, otherParticipantId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              setDisplayName(userDocSnap.data().name || otherParticipantId);
            } else {
              setDisplayName(otherParticipantId);
            }
          }
        } catch (error) {
          console.error("Error fetching chat display name:", error);
          setDisplayName("Chat");
        }
      }
    };

    fetchDisplayName();
  }, [chat.id, chat.type, chat.name, currentUserId, chat.participants]);

  return displayName;
};
