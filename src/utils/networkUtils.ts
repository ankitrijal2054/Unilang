import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

/**
 * Check if device is currently online
 */
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
};

/**
 * Subscribe to network connectivity changes
 * @param callback - Called with true/false when network status changes
 * @returns Unsubscribe function
 */
export const subscribeToNetworkStatus = (
  callback: (isConnected: boolean) => void
): (() => void) => {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    callback(state.isConnected === true);
  });

  return unsubscribe;
};

/**
 * Check initial network status on app start
 */
export const checkInitialNetworkStatus = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
};
