// Use CommonJS require for Node.js compatibility
require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
const Database = require('better-sqlite3');
const db = new Database('users.db');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();

// Helper to convert Firebase Admin SDK UserRecord to our FirebaseUser type
const userRecordToFirebaseUser = (userRecord) => {
  return {
    uid: userRecord.uid,
    email: userRecord.email,
    displayName: userRecord.displayName || null,
    photoURL: userRecord.photoURL || null,
    emailVerified: userRecord.emailVerified,
    disabled: userRecord.disabled,
    creationTime: userRecord.metadata.creationTime,
    lastSignInTime: userRecord.metadata.lastSignInTime,
    customClaims: userRecord.customClaims,
    providerData: userRecord.providerData.map(provider => ({
      uid: provider.uid,
      displayName: provider.displayName || null,
      email: provider.email || null,
      photoURL: provider.photoURL || null,
      providerId: provider.providerId
    }))
  };
};

db.exec(`CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT,
  displayName TEXT,
  photoURL TEXT,
  emailVerified INTEGER,
  disabled INTEGER,
  creationTime TEXT,
  lastSignInTime TEXT,
  customClaims TEXT,
  providerData TEXT,
  isSuspicious INTEGER DEFAULT 0
)`);

function insertOrUpdateUser(user, isSuspiciousFlag = 0) {
  // Normalize creationTime and lastSignInTime to ISO 8601
  let creationTime = user.creationTime;
  let lastSignInTime = user.lastSignInTime;
  try {
    creationTime = new Date(user.creationTime).toISOString();
  } catch (e) {}
  try {
    lastSignInTime = user.lastSignInTime ? new Date(user.lastSignInTime).toISOString() : null;
  } catch (e) {}
  db.prepare(`INSERT OR REPLACE INTO users (uid, email, displayName, photoURL, emailVerified, disabled, creationTime, lastSignInTime, customClaims, providerData, isSuspicious)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      user.uid,
      user.email,
      user.displayName,
      user.photoURL,
      user.emailVerified ? 1 : 0,
      user.disabled ? 1 : 0,
      creationTime,
      lastSignInTime,
      JSON.stringify(user.customClaims || {}),
      JSON.stringify(user.providerData || []),
      isSuspiciousFlag
    );
}

async function syncUsers() {
  console.log('Starting user sync...');
  try {
    // 1. Fetch all users from Firebase
    let allFirebaseUsers = [];
    let nextPageToken = undefined;
    do {
      const result = await auth.listUsers(1000, nextPageToken);
      allFirebaseUsers = allFirebaseUsers.concat(result.users.map(userRecordToFirebaseUser));
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    // 2. Identify suspicious users
    const userGroups = new Map(); // Key: normalizedName_creationDate, Value: [user1, user2, ...]
    allFirebaseUsers.forEach(user => {
      const normalizedName = user.displayName?.toLowerCase() || '';
      const creationDate = user.creationTime ? new Date(user.creationTime).toISOString().split('T')[0] : '';
      const key = `${normalizedName}_${creationDate}`;
      if (!userGroups.has(key)) {
        userGroups.set(key, []);
      }
      userGroups.get(key).push(user);
    });

    const suspiciousUids = new Set();
    userGroups.forEach(userList => {
      if (userList.length > 1) {
        userList.forEach(user => suspiciousUids.add(user.uid));
      }
    });

    // Get UIDs currently in SQLite
    const existingUidsInDb = db.prepare('SELECT uid FROM users').all().map(row => row.uid);
    const firebaseUidsSet = new Set(allFirebaseUsers.map(user => user.uid));

    // Insert/Update users from Firebase
    allFirebaseUsers.forEach(user => {
      const isSuspiciousFlag = suspiciousUids.has(user.uid) ? 1 : 0;
      insertOrUpdateUser(user, isSuspiciousFlag);
    });

    // Delete users from SQLite that are no longer in Firebase
    existingUidsInDb.forEach(uid => {
      if (!firebaseUidsSet.has(uid)) {
        db.prepare('DELETE FROM users WHERE uid = ?').run(uid);
      }
    });

    console.log(`User sync completed. Total users: ${allFirebaseUsers.length}`);
    return { success: true, total: allFirebaseUsers.length };
  } catch (err) {
    console.error('Failed to sync users:', err);
    throw err;
  }
}

async function autoDisableSuspiciousUsers() {
  console.log('Starting auto-disable suspicious users...');
  try {
    const suspiciousUsers = db.prepare('SELECT uid FROM users WHERE isSuspicious = 1 AND disabled = 0').all();
    const uidsToDisable = suspiciousUsers.map(user => user.uid);

    if (uidsToDisable.length === 0) {
      console.log('No suspicious users to disable.');
      return { success: true, disabledCount: 0 };
    }

    const batchSize = 100; // Process 100 users at a time
    let disabledCount = 0;

    for (let i = 0; i < uidsToDisable.length; i += batchSize) {
      const batchUids = uidsToDisable.slice(i, i + batchSize);
      console.log(`Disabling batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uidsToDisable.length / batchSize)}: ${batchUids.length} users...`);
      const disablePromises = batchUids.map(uid => auth.updateUser(uid, { disabled: true }));
      await Promise.all(disablePromises);

      // Update SQLite after disabling in Firebase for the current batch
      const updateStmt = db.prepare('UPDATE users SET disabled = 1 WHERE uid = ?');
      batchUids.forEach(uid => updateStmt.run(uid));
      disabledCount += batchUids.length;

      // Add a delay between batches to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }

    console.log(`Auto-disable completed. Disabled ${disabledCount} users.`);
    return { success: true, disabledCount };
  } catch (err) {
    console.error('Failed to auto-disable suspicious users:', err);
    throw err;
  }
}

async function main() {
  try {
    console.log('Starting scheduled task: sync users and auto-disable suspicious...');
    await syncUsers();
    await autoDisableSuspiciousUsers();
    console.log('Scheduled task completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Scheduled task failed:', error);
    process.exit(1);
  }
}

main();