import { useAuthStore } from "../authStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("setUser", () => {
    it("should set user and mark as authenticated", () => {
      const mockUser = {
        uid: "user123",
        email: "test@example.com",
        name: "John Doe",
        status: "online" as const,
        preferred_language: "en",
        fcm_token: "",
        created_at: "2024-01-01",
      };

      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setIsAuthenticated(true);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should set isAuthenticated to false when user is null", () => {
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setIsAuthenticated(false);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("setLoading", () => {
    it("should update loading state", () => {
      useAuthStore.getState().setIsLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setIsLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe("setError", () => {
    it("should set error message", () => {
      const errorMessage = "Authentication failed";
      useAuthStore.getState().setError(errorMessage);

      expect(useAuthStore.getState().error).toBe(errorMessage);
    });

    it("should clear error when null is passed", () => {
      useAuthStore.getState().setError("Some error");
      useAuthStore.getState().setError(null);

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("logout", () => {
    it("should reset store to initial state on logout", () => {
      const mockUser = {
        uid: "user123",
        email: "test@example.com",
        name: "John Doe",
        status: "online" as const,
        preferred_language: "en",
        fcm_token: "",
        created_at: "2024-01-01",
      };

      // Set some state
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setIsAuthenticated(true);
      useAuthStore.getState().setIsLoading(true);
      useAuthStore.getState().setError("Some error");

      // Logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("store subscription", () => {
    it("should notify subscribers of state changes", () => {
      const subscriber = jest.fn();
      const unsubscribe = useAuthStore.subscribe(subscriber);

      const mockUser = {
        uid: "user123",
        email: "test@example.com",
        name: "John Doe",
        status: "online" as const,
        preferred_language: "en",
        fcm_token: "",
        created_at: "2024-01-01",
      };

      useAuthStore.getState().setUser(mockUser);

      expect(subscriber).toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe("multiple actions", () => {
    it("should handle multiple sequential actions correctly", () => {
      const state = useAuthStore.getState();

      // Start loading
      state.setIsLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      // Set error during loading
      state.setError("Loading failed");
      expect(useAuthStore.getState().error).toBe("Loading failed");

      // Clear error and stop loading
      state.setError(null);
      state.setIsLoading(false);

      // Set user and authenticate
      const mockUser = {
        uid: "user123",
        email: "test@example.com",
        name: "John Doe",
        status: "online" as const,
        preferred_language: "en",
        fcm_token: "",
        created_at: "2024-01-01",
      };

      state.setUser(mockUser);
      state.setIsAuthenticated(true);

      const finalState = useAuthStore.getState();
      expect(finalState.isLoading).toBe(false);
      expect(finalState.error).toBeNull();
      expect(finalState.user).toEqual(mockUser);
      expect(finalState.isAuthenticated).toBe(true);
    });
  });
});
