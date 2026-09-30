import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";

const initial = {
  users: [],
  content: [],
  media: [],
  auditLogs: [],
  settings: { siteName: "Sunna Seed Project", timezone: "Africa/Lagos" },
};
let queue = Promise.resolve();

async function ensureStore() {
  await fs.mkdir(path.dirname(config.dataFile), { recursive: true });
  try {
    await fs.access(config.dataFile);
  } catch {
    await fs.writeFile(config.dataFile, JSON.stringify(initial, null, 2));
  }
}
export async function readStore() {
  await ensureStore();
  return JSON.parse(await fs.readFile(config.dataFile, "utf8"));
}
export function updateStore(mutator) {
  queue = queue.then(async () => {
    const data = await readStore();
    const result = await mutator(data);
    const temporary = `${config.dataFile}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(data, null, 2));
    await fs.rename(temporary, config.dataFile);
    return result;
  });
  return queue;
}
export function audit(data, user, action, entity, previousValue, newValue) {
  data.auditLogs.unshift({
    id: crypto.randomUUID(),
    userId: user.id,
    userEmail: user.email,
    action,
    entity,
    timestamp: new Date().toISOString(),
    previousValue,
    newValue,
  });
}
