import jwt from 'jsonwebtoken'

// Middleware to protect routes that require authentication
// Checks for a valid JWT token in the Authorization header
// and attaches the userId to the request object if valid
export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  // Reject requests with no Authorization header or incorrect format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  // Extract the token from the header - format is "Bearer <token>"
  const token = authHeader.split(' ')[1]

  try {
    // Verify the token signature and expiry using the JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach the userId from the token payload to the request
    // so route handlers can identify the logged in user
    req.userId = decoded.userId

    // Pass control to the next middleware or route handler
    next()
  } catch (err) {
    // Token is invalid or expired
    return res.status(401).json({ error: 'Invalid token' })
  }
}