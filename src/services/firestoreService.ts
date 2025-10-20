import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  Query,
  DocumentData,
  writeBatch,
} from "firebase/firestore";

/**
 * Create a new document in a collection
 */
export const createDoc = async (
  collectionName: string,
  docId: string,
  data: DocumentData
) => {
  try {
    await setDoc(doc(db, collectionName, docId), data);
    return { success: true, docId };
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    return { success: false, error };
  }
};

/**
 * Update an existing document
 */
export const updateDoc_ = async (
  collectionName: string,
  docId: string,
  data: DocumentData
) => {
  try {
    await updateDoc(doc(db, collectionName, docId), data);
    return { success: true };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    return { success: false, error };
  }
};

/**
 * Delete a document
 */
export const deleteDoc_ = async (collectionName: string, docId: string) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return { success: true };
  } catch (error) {
    console.error(`Error deleting document in ${collectionName}:`, error);
    return { success: false, error };
  }
};

/**
 * Get a single document
 */
export const getDoc_ = async (collectionName: string, docId: string) => {
  try {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data(), id: docSnap.id };
    }
    return { success: false, error: "Document not found" };
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    return { success: false, error };
  }
};

/**
 * Get all documents from a collection or query
 */
export const getDocs_ = async (
  collectionNameOrQuery: string | Query<DocumentData>
) => {
  try {
    let querySnapshot;

    if (typeof collectionNameOrQuery === "string") {
      querySnapshot = await getDocs(collection(db, collectionNameOrQuery));
    } else {
      querySnapshot = await getDocs(collectionNameOrQuery);
    }

    const docs: DocumentData[] = [];
    querySnapshot.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: docs };
  } catch (error) {
    console.error("Error getting documents:", error);
    return { success: false, error };
  }
};

/**
 * Batch update multiple documents
 */
export const batchUpdate = async (
  collectionName: string,
  updates: { docId: string; data: DocumentData }[]
) => {
  try {
    const batch = writeBatch(db);

    updates.forEach(({ docId, data }) => {
      batch.update(doc(db, collectionName, docId), data);
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error batch updating documents:", error);
    return { success: false, error };
  }
};
