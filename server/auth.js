import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { readStore, updateStore } from "./store.js";

export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@sunnaseed.local";
  const password =
    process.env.ADMIN_PASSWORD || "change-this-before-deployment";
  await updateStore(async (data) => {
    if (!data.users.some((user) => user.email === email))
      data.users.push({
        id: crypto.randomUUID(),
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "SUPER_ADMIN",
        active: true,
      });
  });
}
export async function login(email, password) {
  const data = await readStore();
  const user = data.users.find(
    (entry) =>
      entry.email.toLowerCase() === String(email).toLowerCase() && entry.active,
  );
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return null;
  const safeUser = { id: user.id, email: user.email, role: user.role };
  return {
    user: safeUser,
    token: jwt.sign(safeUser, config.jwtSecret, {
      expiresIn: "8h",
      issuer: "sunna-seed-api",
    }),
  };
}
export function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, config.jwtSecret, {
      issuer: "sunna-seed-api",
    });
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
