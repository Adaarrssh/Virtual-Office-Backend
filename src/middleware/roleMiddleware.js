exports.superAdminOnly = (req, res, next) => {
  if (req.user.role !== "superadmin")
    return res.status(403).json({ message: "Super Admin access required" });
  next();
};

exports.managerOnly = (req, res, next) => {
  if (req.user.role !== "manager")
    return res.status(403).json({ message: "Manager access required" });
  next();
};