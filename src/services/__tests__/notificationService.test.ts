import * as Notifications from "expo-notifications";
import {
  requestNotificationPermissions,
  registerForPushNotifications,
  setupNotificationHandler,
  setupNotificationListeners,
  setBadgeCount,
} from "../notificationService";
import { updateUserFCMToken } from "../userService";

// Mock expo-notifications
jest.mock("expo-notifications");

// Mock userService
jest.mock("../userService", () => ({
  updateUserFCMToken: jest.fn(),
}));

describe("notificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requestNotificationPermissions", () => {
    it("should return true when permissions are granted", async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      const result = await requestNotificationPermissions();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it("should return false when permissions are denied", async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      const result = await requestNotificationPermissions();

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error("Permission error")
      );

      const result = await requestNotificationPermissions();

      expect(result).toBe(false);
    });
  });

  describe("registerForPushNotifications", () => {
    it("should get token and store it in Firestore", async () => {
      const userId = "user123";
      const token = "expo_token_abc123";

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: token,
      });
      (updateUserFCMToken as jest.Mock).mockResolvedValue({ success: true });

      const result = await registerForPushNotifications(userId);

      expect(result).toBe(token);
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
      expect(updateUserFCMToken).toHaveBeenCalledWith(userId, token);
    });

    it("should return null if Firestore update fails", async () => {
      const userId = "user123";
      const token = "expo_token_abc123";

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: token,
      });
      (updateUserFCMToken as jest.Mock).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await registerForPushNotifications(userId);

      expect(result).toBeNull();
    });

    it("should handle token request failure", async () => {
      const userId = "user123";

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(
        new Error("Token error")
      );

      const result = await registerForPushNotifications(userId);

      expect(result).toBeNull();
      expect(updateUserFCMToken).not.toHaveBeenCalled();
    });
  });

  describe("setupNotificationHandler", () => {
    it("should set notification handler with correct options", () => {
      setupNotificationHandler();

      expect(Notifications.setNotificationHandler).toHaveBeenCalledWith({
        handleNotification: expect.any(Function),
      });
    });

    it("should return correct notification behavior options", async () => {
      let handlerFn: ((notification: any) => Promise<any>) | undefined;

      (Notifications.setNotificationHandler as jest.Mock).mockImplementation(
        (config) => {
          handlerFn = config.handleNotification;
        }
      );

      setupNotificationHandler();

      const result = await handlerFn?.(null);

      expect(result).toEqual({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      });
    });
  });

  describe("setupNotificationListeners", () => {
    it("should setup notification received listener", () => {
      const onNotificationReceived = jest.fn();
      const onNotificationResponse = jest.fn();

      const mockUnsubscribe = jest.fn();
      (
        Notifications.addNotificationReceivedListener as jest.Mock
      ).mockReturnValue({ remove: mockUnsubscribe });

      setupNotificationListeners(
        onNotificationReceived,
        onNotificationResponse
      );

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
    });

    it("should setup notification response listener", () => {
      const onNotificationReceived = jest.fn();
      const onNotificationResponse = jest.fn();

      const mockUnsubscribe = jest.fn();
      (
        Notifications.addNotificationResponseReceivedListener as jest.Mock
      ).mockReturnValue({ remove: mockUnsubscribe });

      setupNotificationListeners(
        onNotificationReceived,
        onNotificationResponse
      );

      expect(
        Notifications.addNotificationResponseReceivedListener
      ).toHaveBeenCalled();
    });

    it("should call callbacks when notifications are received", () => {
      const onNotificationReceived = jest.fn();
      const onNotificationResponse = jest.fn();
      const notification = { id: "123" };

      let receivedCallback: ((n: any) => void) | undefined;
      (
        Notifications.addNotificationReceivedListener as jest.Mock
      ).mockImplementation((cb) => {
        receivedCallback = cb;
        return { remove: jest.fn() };
      });

      setupNotificationListeners(
        onNotificationReceived,
        onNotificationResponse
      );

      receivedCallback?.(notification);

      expect(onNotificationReceived).toHaveBeenCalledWith(notification);
    });

    it("should return unsubscribe functions", () => {
      const onNotificationReceived = jest.fn();
      const onNotificationResponse = jest.fn();

      (
        Notifications.addNotificationReceivedListener as jest.Mock
      ).mockReturnValue({ remove: jest.fn() });
      (
        Notifications.addNotificationResponseReceivedListener as jest.Mock
      ).mockReturnValue({ remove: jest.fn() });

      const result = setupNotificationListeners(
        onNotificationReceived,
        onNotificationResponse
      );

      expect(result).toHaveProperty("unsubscribeNotification");
      expect(result).toHaveProperty("unsubscribeResponse");
      expect(typeof result.unsubscribeNotification).toBe("function");
      expect(typeof result.unsubscribeResponse).toBe("function");
    });
  });

  describe("setBadgeCount", () => {
    it("should set badge count successfully", async () => {
      (Notifications.setBadgeCountAsync as jest.Mock).mockResolvedValue(
        undefined
      );

      await setBadgeCount(5);

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(5);
    });

    it("should handle errors when setting badge count", async () => {
      (Notifications.setBadgeCountAsync as jest.Mock).mockRejectedValue(
        new Error("Badge error")
      );

      // Should not throw
      await expect(setBadgeCount(5)).resolves.toBeUndefined();
    });

    it("should set badge count to zero", async () => {
      (Notifications.setBadgeCountAsync as jest.Mock).mockResolvedValue(
        undefined
      );

      await setBadgeCount(0);

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    });
  });
});
