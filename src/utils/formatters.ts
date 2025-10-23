import { formatDistanceToNow, isToday, isYesterday } from "date-fns";

/**
 * Format timestamp to display time (e.g., "2:30 PM")
 */
export const formatTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
};

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
export const formatRelativeTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "";
  }
};

/**
 * Format timestamp for chat list (e.g., "2:30 PM", "Yesterday", "Oct 20")
 */
export const formatChatTime = (
  timestamp: string | undefined | null
): string => {
  try {
    if (!timestamp) {
      return "";
    }

    const date = new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "";
    }

    if (isToday(date)) {
      return formatTime(timestamp);
    }

    if (isYesterday(date)) {
      return "Yesterday";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

/**
 * Format date for message separators (e.g., "Today", "Yesterday", "October 20, 2025")
 */
export const formatMessageDate = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);

    if (isToday(date)) {
      return "Today";
    }

    if (isYesterday(date)) {
      return "Yesterday";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
};

/**
 * Truncate text to specific length with ellipsis
 */
export const truncateText = (text: string, length: number = 50): string => {
  if (text.length <= length) {
    return text;
  }
  return text.substring(0, length) + "...";
};

/**
 * Format last seen timestamp for contacts list (simplified)
 * Shows: "Today", "Yesterday", "2 days ago", "3 days ago", or date like "Oct 20"
 */
export const formatLastSeen = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (isToday(date)) {
      return "Today";
    }

    if (isYesterday(date)) {
      return "Yesterday";
    }

    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }

    // For older dates, show just the date without time
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};
