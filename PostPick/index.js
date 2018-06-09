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
  const data = req.body;
  MongoClient.connect(
    process.env.CosmoDBUrl,
    { auth: auth },
    (err, database) => {
      if (err) throw err;
      console.log('Connected Successfully');
      const db = database.db('worldcuppy');
      db.collection('picks').insertOne(data, (err, result) => {
        if (err) throw err;
        const data = result.ops;
        context.res = {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result: data }),
        };
        database.close();
        context.done();
      });
    }
  );
});
