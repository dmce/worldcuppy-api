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
              Picks: { $sum: 1 },
            },
          },
          {
            $sort: { Points: -1, Picks: -1 },
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
