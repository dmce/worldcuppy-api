const MongoClient = require('mongodb').MongoClient;

const auth = {
  user: process.env.CosmoDBUser,
  password: process.env.CosmoDBPassword,
};

module.exports = function(context, req) {
  MongoClient.connect(
    process.env.CosmoDBUrl,
    { auth: auth },
    (err, database) => {
      if (err) throw err;
      const db = database.db('worldcuppy');
      const user = context.bindingData.user;
      db.collection('picks')
        .aggregate([
          {
            $group: {
              _id: { username: '$username', id: '$user' },
              Points: { $sum: '$points' },
              PicksTotal: { $sum: 1 },
              PicksFinished: {
                $sum: {
                  $cond: [{ $eq: ['$resolved', true] }, 1, 0],
                },
              },
              PicksWins: {
                $sum: {
                  $cond: [{ $eq: ['$points', 3] }, 1, 0],
                },
              },
              PicksDraws: {
                $sum: {
                  $cond: [{ $eq: ['$points', 1] }, 1, 0],
                },
              },
            },
          },
          {
            $sort: {
              Points: -1,
              PicksFinished: -1,
              PicksWins: -1,
              PicksDraws: -1,
              PicksTotal: -1,
            },
          },
        ])
        .toArray((err, result) => {
          if (err) throw err;
          context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scoreboard: result }),
          };
          database.close();
          context.done();
        });
    }
  );
};
