import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const vesselUsersTable = pgTable("vessel_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("client"),
  company: text("company"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertVesselUserSchema = createInsertSchema(vesselUsersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertVesselUser = z.infer<typeof insertVesselUserSchema>;
export type VesselUser = typeof vesselUsersTable.$inferSelect;