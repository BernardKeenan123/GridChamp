import jwt from 'jsonwebtoken'

// Verifies the JWT token from the Authorization header
// Attaches the decoded userId to req so downstream routes can use it
export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}