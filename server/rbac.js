export const roles = {
  SUPER_ADMIN: ["*"],
  CONTENT_ADMIN: [
    "content:create",
    "content:read",
    "content:edit",
    "media:read",
  ],
  ISLAMIC_REVIEWER: ["content:read", "review:islamic"],
  EDITOR: [
    "content:read",
    "content:edit",
    "review:editorial",
    "publish:approve",
  ],
  MEDIA_MANAGER: ["media:*"],
  LIBRARY_MANAGER: ["library:*", "media:read"],
  SOCIAL_MEDIA_MANAGER: ["social:*", "media:read"],
  ANALYTICS_MANAGER: ["analytics:read"],
  AUTHOR: ["content:create", "content:read-own", "content:edit-own"],
  VIEWER: ["content:read"],
};

export function can(role, permission) {
  const grants = roles[role] || [];
  return grants.some((grant) => {
    if (grant === "*") return true;
    if (grant === permission) return true;
    return grant.endsWith("*") && permission.startsWith(grant.slice(0, -1));
  });
}

export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user || !can(req.user.role, permission)) {
    return res
      .status(403)
      .json({ error: "Insufficient permission", permission });
  }
  next();
};
