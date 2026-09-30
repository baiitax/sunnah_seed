import express from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { config } from "./config.js";
import { authenticate, login, seedAdmin } from "./auth.js";
import { requirePermission } from "./rbac.js";
import { audit, readStore, updateStore } from "./store.js";
import {
  contentSchema,
  makeContentId,
  publicationWarnings,
} from "./content.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: config.origin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "sunna-seed-api" }),
);
app.post(
  "/api/auth/login",
  rateLimit({ windowMs: 15 * 60_000, limit: 10 }),
  async (req, res) => {
    const result = await login(req.body.email, req.body.password);
    if (!result) return res.status(401).json({ error: "Invalid credentials" });
    res.json(result);
  },
);
app.get("/api/content", async (req, res) => {
  const data = await readStore();
  const published = data.content.filter((item) => item.status === "PUBLISHED");
  const query = String(req.query.q || "").toLowerCase();
  res.json(
    query
      ? published.filter((item) =>
          `${item.title} ${item.excerpt} ${item.type}`
            .toLowerCase()
            .includes(query),
        )
      : published,
  );
});
app.get(
  "/api/admin/content",
  authenticate,
  requirePermission("content:read"),
  async (_req, res) => res.json((await readStore()).content),
);
app.post(
  "/api/admin/content",
  authenticate,
  requirePermission("content:create"),
  async (req, res) => {
    const parsed = contentSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(422)
        .json({ error: "Validation failed", issues: parsed.error.issues });
    const created = await updateStore((data) => {
      const item = {
        ...parsed.data,
        id: makeContentId(parsed.data.type, data.content.length + 1),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user.id,
        version: 1,
      };
      data.content.push(item);
      audit(data, req.user, "CONTENT_CREATED", item.id, null, item);
      return item;
    });
    res.status(201).json(created);
  },
);
app.patch(
  "/api/admin/content/:id",
  authenticate,
  requirePermission("content:edit"),
  async (req, res) => {
    let status = 200;
    const result = await updateStore((data) => {
      const index = data.content.findIndex((item) => item.id === req.params.id);
      if (index < 0) {
        status = 404;
        return { error: "Content not found" };
      }
      const previous = data.content[index];
      const parsed = contentSchema.safeParse({ ...previous, ...req.body });
      if (!parsed.success) {
        status = 422;
        return { error: "Validation failed", issues: parsed.error.issues };
      }
      const warnings = publicationWarnings(parsed.data);
      if (parsed.data.status === "PUBLISHED" && warnings.length) {
        status = 422;
        return { error: "Publication blocked", warnings };
      }
      const updated = {
        ...previous,
        ...parsed.data,
        version: previous.version + 1,
        updatedAt: new Date().toISOString(),
      };
      data.content[index] = updated;
      audit(data, req.user, "CONTENT_UPDATED", updated.id, previous, updated);
      return updated;
    });
    res.status(status).json(result);
  },
);
app.get(
  "/api/admin/audit-logs",
  authenticate,
  requirePermission("content:read"),
  async (_req, res) => res.json((await readStore()).auditLogs.slice(0, 200)),
);
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Unexpected server error" });
});

await seedAdmin();
app.listen(config.port, "0.0.0.0", () =>
  console.log(`Sunna Seed API listening on ${config.port}`),
);
