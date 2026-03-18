const SECRET = "medsutra-secret-key";
const secretKey = new TextEncoder().encode(SECRET);

async function signAuthToken(payload) {
  const { SignJWT } = await import("jose");
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token provided" });
  const token = header.split(" ")[1];
  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, secretKey);
    req.hospitalId = payload.hospitalId;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();

  const token = header.split(" ")[1];
  if (!token) return next();

  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, secretKey);
    req.hospitalId = payload.hospitalId;
    next();
  } catch (e) {
    next();
  }
}

module.exports = { auth, optionalAuth, signAuthToken, SECRET };
