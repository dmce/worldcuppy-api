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
            $match: { resolved: true },
          },
          {
            $group: {
              _id: { id: '$user', username: '$username' },
              Points: { $sum: '$points' },
              Picks: { $sum: 1 },
            },
          },
          {
            $sort: { Points: -1 },
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