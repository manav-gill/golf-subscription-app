const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header is required'
    });
  }

  const [scheme, token] = authHeader.trim().split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header must be in Bearer token format'
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'JWT server configuration is missing'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded user:', decoded);

    const resolvedUserId = decoded?.id || decoded?.userId;

    if (!decoded || !resolvedUserId || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: 'Token payload is invalid'
      });
    }

    req.user = {
      id: resolvedUserId,
      userId: resolvedUserId,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}

module.exports = authMiddleware;
