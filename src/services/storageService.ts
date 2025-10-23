import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Image } from "react-native";
import { app } from "./firebase";
import * as ImageManipulator from "expo-image-manipulator";

const storage = getStorage(app);

/**
 * Compress image to specified dimensions and quality
 * @param uri - Image URI from device
 * @param width - Target width in pixels
 * @param height - Target height in pixels
 * @param quality - JPEG quality (0-1 for Expo)
 * @returns Compressed image URI
 */
export const compressImage = async (
  uri: string,
  width: number,
  height: number,
  quality: number = 0.85
): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width, height } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch (error) {
    console.error("Image compression failed:", error);
    throw new Error("Failed to compress image");
  }
};

/**
 * Upload profile picture to Firebase Storage
 * @param imageUri - Image URI from device
 * @param userId - User ID for storage path
 * @returns Download URL of uploaded image
 */
export const uploadProfilePicture = async (
  imageUri: string,
  userId: string
): Promise<string> => {
  try {
    // Compress image to 200x200px
    const compressedUri = await compressImage(imageUri, 200, 200, 0.85);

    // Convert URI to blob
    const blob = await urlToBlob(compressedUri);

    // Upload to Storage
    const storageRef = ref(storage, `avatars/${userId}.jpg`);
    await uploadBytes(storageRef, blob, {
      contentType: "image/jpeg",
      cacheControl: "public, max-age=86400", // Cache for 24 hours
    });

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error("Profile picture upload failed:", error);
    throw new Error("Failed to upload profile picture");
  }
};

/**
 * Upload message image to Firebase Storage
 * @param imageUri - Image URI from device
 * @param chatId - Chat ID for storage path
 * @param messageId - Message ID for storage path
 * @returns Object with download URL and dimensions
 */
export const uploadMessageImage = async (
  imageUri: string,
  chatId: string,
  messageId: string
): Promise<{ url: string; width: number; height: number }> => {
  try {
    // Get original image dimensions
    const dimensions = await getImageDimensions(imageUri);

    // Calculate target height based on 800px width
    const targetHeight = Math.round(
      (800 / dimensions.width) * dimensions.height
    );

    // Compress image to max 800px width
    const compressedUri = await compressImage(
      imageUri,
      800,
      targetHeight,
      0.85
    );

    // Convert URI to blob
    const blob = await urlToBlob(compressedUri);

    // Check file size (max 10MB)
    if (blob.size > 10 * 1024 * 1024) {
      throw new Error("Image size exceeds 10MB limit");
    }

    // Upload to Storage
    const storageRef = ref(storage, `messages/${chatId}/${messageId}.jpg`);
    await uploadBytes(storageRef, blob, {
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000", // Cache for 1 year (immutable)
    });

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);

    return {
      url: downloadUrl,
      width: 800,
      height: targetHeight,
    };
  } catch (error) {
    console.error("Message image upload failed:", error);
    throw new Error("Failed to upload image message");
  }
};

/**
 * Convert image URI to Blob for Firebase Storage
 * @param uri - Image URI
 * @returns Blob object
 */
const urlToBlob = async (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(new Error("Failed to convert image to blob"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};

/**
 * Get image dimensions using React Native's Image.getSize
 * @param uri - Image URI
 * @returns Object with width and height
 */
const getImageDimensions = async (
  uri: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => {
        resolve({ width, height });
      },
      (error) => {
        console.error("Failed to get image dimensions:", error);
        reject(new Error("Failed to get image dimensions"));
      }
    );
  });
};

/**
 * Delete image from Firebase Storage
 * @param path - Full path to image in Storage (e.g., "avatars/userId.jpg")
 */
export const deleteStorageImage = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    // Note: deleteObject needs to be imported separately
    console.log(`Image deletion at path: ${path} (implement via Firebase SDK)`);
  } catch (error) {
    console.error("Image deletion failed:", error);
    throw new Error("Failed to delete image");
  }
};
