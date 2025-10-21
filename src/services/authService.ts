import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  AuthError,
} from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User } from "../types";
import { COLLECTIONS } from "../utils/constants";

/**
 * Sign up with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  name: string,
  preferredLanguage: string = "en"
): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const { uid } = userCredential.user;

    // Create user document in Firestore
    const userData: User = {
      uid,
      name,
      email,
      preferred_language: preferredLanguage,
      status: "online",
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, COLLECTIONS.USERS, uid), userData);

    console.log("✅ User signed up successfully:", email);
    return {
      success: true,
      user: userData,
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error("❌ Sign up failed:", authError.message);

    let errorMessage = "Sign up failed";
    if (authError.code === "auth/email-already-in-use") {
      errorMessage = "Email already in use";
    } else if (authError.code === "auth/weak-password") {
      errorMessage = "Password must be at least 6 characters";
    } else if (authError.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const { uid } = userCredential.user;

    // Fetch user profile from Firestore to get full user data
    const userDocRef = doc(db, COLLECTIONS.USERS, uid);
    const userDocSnap = await getDoc(userDocRef);

    let userData: User | null = null;
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      userData = {
        uid,
        name: data.name,
        email: data.email,
        preferred_language: data.preferred_language,
        status: "online",
        lastSeen: new Date().toISOString(),
        createdAt: data.createdAt,
        fcmToken: data.fcmToken,
      };
    } else {
      // Fallback if user doc doesn't exist
      userData = {
        uid,
        name: email.split("@")[0],
        email,
        preferred_language: "en",
        status: "online",
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    }

    console.log("✅ User signed in successfully:", email);
    return {
      success: true,
      user: userData,
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error("❌ Sign in failed:", authError.message);

    let errorMessage = "Sign in failed";
    if (authError.code === "auth/user-not-found") {
      errorMessage = "User not found";
    } else if (authError.code === "auth/wrong-password") {
      errorMessage = "Incorrect password";
    } else if (authError.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (authError.code === "auth/user-disabled") {
      errorMessage = "User account has been disabled";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (
  idToken: string
): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const { uid, email, displayName } = userCredential.user;

    // Check if user document exists, if not create it
    const userRef = doc(db, COLLECTIONS.USERS, uid);

    // We'll just update the user doc if it exists or create if not
    const userData: Partial<User> = {
      uid,
      name: displayName || email?.split("@")[0] || "User",
      email: email || "",
      status: "online",
      lastSeen: new Date().toISOString(),
    };

    await setDoc(userRef, userData, { merge: true });

    // Fetch full user profile to return
    const userDocSnap = await getDoc(userRef);
    let fullUserData: User | null = null;
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      fullUserData = {
        uid,
        name: data.name,
        email: data.email,
        preferred_language: data.preferred_language || "en",
        status: "online",
        lastSeen: new Date().toISOString(),
        createdAt: data.createdAt || new Date().toISOString(),
        fcmToken: data.fcmToken,
      };
    }

    console.log("✅ User signed in with Google:", email);
    return {
      success: true,
      user: fullUserData || userData,
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error("❌ Google sign in failed:", authError.message);

    return {
      success: false,
      error: "Google sign in failed. Please try again.",
    };
  }
};

/**
 * Sign out
 */
export const signOutUser = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Update user status to offline before signing out
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      await setDoc(
        userRef,
        {
          status: "offline",
          lastSeen: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    await signOut(auth);
    console.log("✅ User signed out successfully");
    return { success: true };
  } catch (error) {
    const authError = error as AuthError;
    console.error("❌ Sign out failed:", authError.message);
    return {
      success: false,
      error: "Sign out failed. Please try again.",
    };
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChanged = (callback: (user: any) => void) => {
  return auth.onAuthStateChanged(callback);
};
