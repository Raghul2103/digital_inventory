// Authorization middleware check against role permissions
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User authentication required.'
      });
    }

    const { role } = req.user;

    if (!role) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. No role assigned.'
      });
    }

    // Admin role bypass (Admin role has all permissions by default or name 'Admin')
    if (role.name === 'Admin') {
      return next();
    }

    // Check if user's role has at least one of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      role.permissions && role.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. You do not have permission: ${requiredPermissions.join(' or ')}`
      });
    }

    next();
  };
};

module.exports = { authorize };
