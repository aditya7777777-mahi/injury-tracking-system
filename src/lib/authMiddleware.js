import jwksRsa from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const client = jwksRsa({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

const getKey = (header, callback) => {
  if (!header.kid) {
    return callback(new Error('No KID specified in JWT header'));
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    if (!key || typeof key.getPublicKey !== 'function') {
      return callback(new Error('Invalid key object'));
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

export const verifyToken = async (token) => {
  if (!token || token === 'null' || token === 'undefined') {
    throw new Error('No token provided');
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
};
