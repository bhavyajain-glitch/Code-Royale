const { db } = require('./firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const recordBattleOutcome = async (roomId, winner, players) => {
  const winnerRef = db.collection('users').doc(winner.uid);

  try {
    // Increment the winner's score by 10
    await winnerRef.update({
      score: FieldValue.increment(10)
    });
    console.log(`[DB] Updated score for winner: ${winner.email}`);

    // TODO: Could also save a record of the battle in a 'battles' collection

    return { success: true };
  } catch (error) {
    console.error("Error updating score:", error);
    return { success: false, error };
  }
};

module.exports = { recordBattleOutcome };