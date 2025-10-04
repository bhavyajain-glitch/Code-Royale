const { db } = require('../../services/firebaseAdmin');

const getLeaderboard = async (req, res) => {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.orderBy('score', 'desc').limit(10).get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const leaderboard = [];
    snapshot.forEach(doc => {
      leaderboard.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
};

module.exports = { getLeaderboard };