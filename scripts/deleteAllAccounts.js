// scripts/deleteAllAccounts.js

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, "../service-account-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

const auth = admin.auth();

async function deleteAllAccounts(nextPageToken) {
  try {
    // List batch of users, 1000 at a time
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    listUsersResult.users.forEach(async (userRecord) => {
      try {
        await auth.deleteUser(userRecord.uid);
        console.log(`✅ Deleted user: ${userRecord.email}`);
      } catch (error) {
        console.error(`❌ Failed to delete user: ${userRecord.email}`, error);
      }
    });

    if (listUsersResult.pageToken) {
      // Recursively list next batch of users
      await deleteAllAccounts(listUsersResult.pageToken);
    }
  } catch (error) {
    console.error("❌ Error listing users:", error);
  }
}

// Run the script
deleteAllAccounts().catch((error) => {
  console.error("Fatal error:", error);
});
