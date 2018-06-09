const MongoClient = require('mongodb').MongoClient;
const jwksRsa = require('jwks-rsa');

const secret = jwksRsa.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: 'https://dmce.eu.auth0.com/.well-known/jwks.json',
});

const validateJwt = require('azure-functions-auth')({
  clientId: process.env.AuthZeroClientId,
  clientSecret: secret,
  algorithms: ['RS256'],
  domain: process.env.AuthZeroDomain,
  audience: process.env.AuthZeroAudience,
});

const auth = {
  user: process.env.CosmoDBUser,
  password: process.env.CosmoDBPassword,
};

module.exports = validateJwt(function(context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');

  MongoClient.connect(
    process.env.CosmoDBUrl,
    { auth: auth },
    (err, database) => {
      if (err) throw err;
      const db = database.db('worldcuppy');
      const id = parseInt(context.bindingData.id);
      db.collection('picks')
        .find({ fixtureId: id })
        .toArray((err, result) => {
          if (err) throw err;
          context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ picks: result }),
          };
          database.close();
          context.done();
        });
    }
  );
});
