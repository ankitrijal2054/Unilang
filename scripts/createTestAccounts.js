// scripts/createTestAccounts.js
const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, "../service-account-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

const auth = admin.auth();
const db = admin.firestore();

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

// Extract name from email for user profile
function extractName(email) {
  return email.split("@")[0].replace(/\./g, " ");
}

async function createTestAccounts() {
  const password = "test123"; // Default test password
  const results = {
    successful: [],
    failed: [],
  };

  console.log(
    `\n🚀 Starting to create ${testEmails.length} test accounts...\n`
  );

  for (const email of testEmails) {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: extractName(email),
      });

      // Create user profile in Firestore
      await db
        .collection("users")
        .doc(userRecord.uid)
        .set({
          uid: userRecord.uid,
          name: extractName(email),
          email,
          preferred_language: "en",
          status: "offline",
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          fcmToken: null,
        });

      results.successful.push(email);
      console.log(`✅ Created: ${email} (UID: ${userRecord.uid})`);
    } catch (error) {
      results.failed.push({ email, error: error.message });
      console.error(`❌ Failed: ${email} - ${error.message}`);
    }
  }

  // Print summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 Summary:`);
  console.log(
    `✅ Successful: ${results.successful.length}/${testEmails.length}`
  );
  console.log(`❌ Failed: ${results.failed.length}/${testEmails.length}`);

  if (results.failed.length > 0) {
    console.log(`\n⚠️  Failed accounts:`);
    results.failed.forEach(({ email, error }) => {
      console.log(`  - ${email}: ${error}`);
    });
  }

  console.log(`\n💾 Test Password: ${password}`);
  console.log(`${"=".repeat(60)}\n`);

  process.exit(0);
}

// Run the script
createTestAccounts().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
