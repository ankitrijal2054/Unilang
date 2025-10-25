// scripts/deleteTestAccounts.js

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, "../service-account-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

const auth = admin.auth();

// Test emails
const testEmails = [
  "apollo.alpha@gmail.com",
  "blaze.brooklyn@gmail.com",
  "cosmo.creed@gmail.com",
  "drift.delta@gmail.com",
  "echo.everest@gmail.com",
  "frost.falcon@gmail.com",
  "gale.gemini@gmail.com",
  "hydra.haven@gmail.com",
  "ion.infinity@gmail.com",
  "jax.jupiter@gmail.com",
  "kairo.knight@gmail.com",
  "lyra.lumin@gmail.com",
  "maverick.muse@gmail.com",
  "nova.nimbus@gmail.com",
  "onyx.orion@gmail.com",
  "phoenix.pulse@gmail.com",
  "quill.quasar@gmail.com",
  "raven.ryder@gmail.com",
  "skyler.sonic@gmail.com",
  "titan.trace@gmail.com",
  "ursa.unity@gmail.com",
  "vega.vortex@gmail.com",
  "wren.wilder@gmail.com",
  "xeno.xander@gmail.com",
  "yara.yonder@gmail.com",
  "zenith.zane@gmail.com",
];

async function deleteTestAccounts() {
  console.log("🗑️  Starting to delete test accounts...\n");

  for (const email of testEmails) {
    try {
      const userRecord = await auth.getUserByEmail(email);
      await auth.deleteUser(userRecord.uid);
      console.log(`✅ Deleted: ${email}`);
    } catch (error) {
      console.error(`❌ Failed to delete: ${email} - ${error.message}`);
    }
  }

  console.log("\n✅ All test accounts processed!\n");
}

// Run the script
deleteTestAccounts().catch((error) => {
  console.error("Fatal error:", error);
});
