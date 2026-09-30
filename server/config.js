import path from "node:path";

export const config = {
  port: Number(process.env.PORT || 4000),
  origin: process.env.APP_ORIGIN || "http://localhost:5173",
  jwtSecret:
    process.env.JWT_SECRET ||
    "development-only-secret-change-before-production",
  dataFile: path.resolve(process.env.DATA_FILE || "./data/store.json"),
  isProduction: process.env.NODE_ENV === "production",
};

if (config.isProduction && config.jwtSecret.includes("development-only")) {
  throw new Error("JWT_SECRET must be configured in production");
}
