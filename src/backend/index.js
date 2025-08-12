// Use CommonJS require for Node.js compatibility
const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');
const express = require('express');

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

const app = express();
app.use(express.json());

app.get('/users', async (req, res) => {
  try {
    const { users, nextPageToken } = await listUsers();
    res.json({ users, nextPageToken });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/user/:uid', async (req, res) => {
  try {
    const user = await updateUser(req.params.uid, req.body);
    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err); // Add detailed logging
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
});

app.delete('/user/:uid', async (req, res) => {
  try {
    await deleteUser(req.params.uid);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/users/bulk-update', async (req, res) => {
  try {
    const { userIds, updates } = req.body;
    await bulkUpdateUsers(userIds, updates);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Failed to bulk update users' });
  }
});

app.post('/users/bulk-delete', async (req, res) => {
  try {
    const { userIds } = req.body;
    await bulkDeleteUsers(userIds);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Failed to bulk delete users' });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));
