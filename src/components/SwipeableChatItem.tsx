import React, { useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { Chat } from "../types";
import { ChatListItem } from "./ChatListItem";
import { colorPalette } from "../utils/theme";

interface SwipeableChatItemProps {
  chat: Chat;
  onPress: () => void;
  onDelete: () => void;
  otherUserAvatarUrl?: string;
}

export const SwipeableChatItem: React.FC<SwipeableChatItemProps> = ({
  chat,
  onPress,
  onDelete,
  otherUserAvatarUrl,
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.swipeActionsContainer}>
        <Animated.View
          style={[
            styles.deleteAction,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              swipeableRef.current?.close();
              onDelete();
            }}
          >
            <MaterialCommunityIcons name="delete" size={24} color="#fff" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      <View style={styles.chatItemContainer}>
        <ChatListItem
          chat={chat}
          onPress={onPress}
          otherUserAvatarUrl={otherUserAvatarUrl}
        />
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  chatItemContainer: {
    backgroundColor: colorPalette.background,
  },
  swipeActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteAction: {
    backgroundColor: colorPalette.error,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    paddingVertical: 20,
  },
  deleteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});
