// Use CommonJS require for Node.js compatibility
const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');
const express = require('express');
const cors = require('cors'); // Import cors
const Database = require('better-sqlite3');
const db = new Database('users.db');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();

const listUsers = async (nextPageToken) => {
  const listUsersResult = await auth.listUsers(1000, nextPageToken);
  return {
    users: listUsersResult.users.map(userRecordToFirebaseUser),
    nextPageToken: listUsersResult.pageToken
  };
};

const updateUser = async (uid, updates) => {
  const userRecord = await auth.updateUser(uid, updates);
  return userRecordToFirebaseUser(userRecord);
};

const deleteUser = async (uid) => {
  await auth.deleteUser(uid);
};

const bulkUpdateUsers = async (uids, updates) => {
  const promises = uids.map(uid => auth.updateUser(uid, updates));
  await Promise.all(promises);
};

const bulkDeleteUsers = async (uids) => {
  await auth.deleteUsers(uids);
};

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
  isSuspicious INTEGER DEFAULT 0 -- Add this column
)`);

function insertOrUpdateUser(user, isSuspiciousFlag = 0) { // Add isSuspiciousFlag
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) // Add isSuspicious
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
      isSuspiciousFlag // Pass the flag
    );
}

const app = express();
app.use(cors({
  origin: 'http://localhost:4001',
  credentials: true
}));
app.use(express.json());

app.post('/sync-users', async (req, res) => {
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

    res.json({ success: true, total: allFirebaseUsers.length });
  } catch (err) {
    console.error('Failed to sync users:', err);
    res.status(500).json({ error: 'Failed to sync users', details: err.message });
  }
});

app.get('/users', (req, res) => {
  console.log('Received /users request with query:', req.query);
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 100;
  const offset = (page - 1) * pageSize;

  let query = 'SELECT * FROM users';
  let countQuery = 'SELECT COUNT(*) as count FROM users';
  const params = [];
  const whereClauses = [];

  // Apply search filter
  if (req.query.search) {
    const searchLower = `%${req.query.search.toLowerCase()}%`;
    whereClauses.push('(LOWER(email) LIKE ? OR LOWER(displayName) LIKE ? OR LOWER(uid) LIKE ?)');
    params.push(searchLower, searchLower, searchLower);
  }

  // Apply status filter
  if (req.query.status && req.query.status !== 'all') {
    if (req.query.status === 'enabled') {
      whereClauses.push('disabled = 0');
    } else {
      whereClauses.push('disabled = 1');
    }
  }

  // Apply email verification filter
  if (req.query.emailVerified && req.query.emailVerified !== 'all') {
    if (req.query.emailVerified === 'verified') {
      whereClauses.push('emailVerified = 1');
    } else {
      whereClauses.push('emailVerified = 0');
    }
  }

  // Apply provider filter
  if (req.query.provider && req.query.provider !== 'all') {
    whereClauses.push('providerData LIKE ?');
    params.push(`%"providerId":"${req.query.provider}"%`);
  }

  // Apply date range filter
  if (req.query.dateRangeFrom) {
    whereClauses.push('creationTime >= ?');
    params.push(req.query.dateRangeFrom);
  }
  if (req.query.dateRangeTo) {
    // To include the entire day, append 'T23:59:59.999Z' if only a date is provided
    let dateTo = req.query.dateRangeTo;
    if (dateTo.length === 10) { // Assuming YYYY-MM-DD format for date only
      dateTo += 'T23:59:59.999Z';
    }
    whereClauses.push('creationTime <= ?');
    params.push(dateTo);
  }

  // Apply suspiciousOnly filter
  if (req.query.suspiciousOnly === 'true') {
    whereClauses.push('isSuspicious = 1');
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
    countQuery += ' WHERE ' + whereClauses.join(' AND ');
  }

  // Add sorting
  let sortField = req.query.sortField || 'creationTime';
  const sortDirection = req.query.sortDirection === 'asc' ? 'ASC' : 'DESC';
  // If sorting by creationTime or lastSignInTime, cast to datetime
  if (sortField === 'creationTime' || sortField === 'lastSignInTime') {
    query += ` ORDER BY datetime(${sortField}) ${sortDirection}`;
  } else {
    query += ` ORDER BY ${sortField} ${sortDirection}`;
  }

  const queryParams = [...params]; // Copy params for the main query
  query += ' LIMIT ? OFFSET ?';
  queryParams.push(pageSize, offset);

  console.log('SQL Query:', query);
  console.log('SQL Params:', queryParams);
  console.log('Count Query:', countQuery);
  console.log('Count Params:', params);

  const users = db.prepare(query).all(...queryParams).map(row => ({
    ...row,
    emailVerified: !!row.emailVerified,
    disabled: !!row.disabled,
    customClaims: JSON.parse(row.customClaims),
    providerData: JSON.parse(row.providerData)
  }));
  const total = db.prepare(countQuery).get(...params).count; // Use original params for count query
  res.json({ users, total, page, pageSize });
});

app.post('/user/:uid', async (req, res) => {
  try {
    const user = await updateUser(req.params.uid, req.body);
    // After updating in Firebase, update in SQLite
    // Note: isSuspicious status is not re-calculated here for performance. 
    // It will be updated on the next /sync-users call.
    insertOrUpdateUser(user, user.isSuspicious ? 1 : 0); // Pass existing isSuspicious status
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/user/:uid', async (req, res) => {
  try {
    await deleteUser(req.params.uid);
    // After deleting in Firebase, delete from SQLite
    db.prepare('DELETE FROM users WHERE uid = ?').run(req.params.uid);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/users/bulk-update', async (req, res) => {
  try {
    const { userIds, updates } = req.body;
    await bulkUpdateUsers(userIds, updates);
    // After bulk updating in Firebase, update in SQLite
    // Note: isSuspicious status is not re-calculated here for performance. 
    // It will be updated on the next /sync-users call.
    userIds.forEach(uid => {
      // Fetch the updated user from Firebase to ensure consistency
      auth.getUser(uid).then(userRecord => {
        // Assuming userRecordToFirebaseUser now includes isSuspicious if available
        insertOrUpdateUser(userRecordToFirebaseUser(userRecord), userRecord.isSuspicious ? 1 : 0);
      }).catch(console.error); // Log error if fetching individual user fails
    });
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Failed to bulk update users' });
  }
});

app.post('/users/bulk-delete', async (req, res) => {
  try {
    const { userIds } = req.body;
    await bulkDeleteUsers(userIds);
    // After bulk deleting in Firebase, delete from SQLite
    const deleteStmt = db.prepare('DELETE FROM users WHERE uid = ?');
    userIds.forEach(uid => deleteStmt.run(uid));
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Failed to bulk delete users' });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));
