import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { vesselUsersTable } from "./vessel-users";

export const vesselsTable = pgTable(
  "vessels",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => vesselUsersTable.id),
    name: text("name").notNull(),
    imoNumber: text("imo_number"),
    vesselType: text("vessel_type").notNull(),
    flag: text("flag"),
    dwt: numeric("dwt"),
    grt: numeric("grt"),
    yearBuilt: integer("year_built"),
    loa: numeric("loa"),
    beam: numeric("beam"),
    draft: numeric("draft"),
    classificationSociety: text("classification_society"),
    tradingArea: text("trading_area"),
    description: text("description"),
    status: text("status").notNull().default("available"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("vessels_status_idx").on(table.status),
    index("vessels_owner_id_idx").on(table.ownerId),
  ],
);

export const vesselContactsTable = pgTable(
  "vessel_contacts",
  {
    id: serial("id").primaryKey(),
    vesselId: integer("vessel_id")
      .notNull()
      .references(() => vesselsTable.id, { onDelete: "cascade" }),
    contactName: text("contact_name").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
  },
  (table) => [index("vessel_contacts_vessel_id_idx").on(table.vesselId)],
);

export const vesselPhotosTable = pgTable(
  "vessel_photos",
  {
    id: serial("id").primaryKey(),
    vesselId: integer("vessel_id")
      .notNull()
      .references(() => vesselsTable.id, { onDelete: "cascade" }),
    objectPath: text("object_path").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("vessel_photos_vessel_id_idx").on(table.vesselId),
  ],
);

export const charterPartiesTable = pgTable(
  "charter_parties",
  {
    id: serial("id").primaryKey(),
    vesselId: integer("vessel_id")
      .notNull()
      .references(() => vesselsTable.id),
    chartererId: integer("charterer_id")
      .notNull()
      .references(() => vesselUsersTable.id),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => vesselUsersTable.id),
    rate: numeric("rate"),
    rateCurrency: text("rate_currency").notNull().default("USD"),
    rateBasis: text("rate_basis"),
    laycanEarliest: timestamp("laycan_earliest", { withTimezone: true }),
    laycanLatest: timestamp("laycan_latest", { withTimezone: true }),
    durationDays: integer("duration_days"),
    cargoPurpose: text("cargo_purpose"),
    terms: text("terms"),
    status: text("status").notNull().default("enquiry"),
    ownerConfirmedAt: timestamp("owner_confirmed_at", { withTimezone: true }),
    chartererConfirmedAt: timestamp("charterer_confirmed_at", {
      withTimezone: true,
    }),
    hireStart: timestamp("hire_start", { withTimezone: true }),
    hireEnd: timestamp("hire_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("charter_parties_charterer_id_idx").on(table.chartererId),
    index("charter_parties_owner_id_idx").on(table.ownerId),
    index("charter_parties_vessel_id_idx").on(table.vesselId),
  ],
);

export const charterOffersTable = pgTable(
  "charter_offers",
  {
    id: serial("id").primaryKey(),
    charterId: integer("charter_id")
      .notNull()
      .references(() => charterPartiesTable.id, { onDelete: "cascade" }),
    actorId: integer("actor_id")
      .notNull()
      .references(() => vesselUsersTable.id),
    actorRole: text("actor_role").notNull(),
    supersedesOfferId: integer("supersedes_offer_id"),
    rate: numeric("rate"),
    rateCurrency: text("rate_currency").notNull().default("USD"),
    rateBasis: text("rate_basis"),
    laycanEarliest: timestamp("laycan_earliest", { withTimezone: true }),
    laycanLatest: timestamp("laycan_latest", { withTimezone: true }),
    durationDays: integer("duration_days"),
    cargoPurpose: text("cargo_purpose"),
    terms: text("terms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("charter_offers_charter_id_idx").on(table.charterId),
    index("charter_offers_actor_id_idx").on(table.actorId),
    index("charter_offers_created_at_idx").on(table.charterId, table.createdAt),
  ],
);

export const vesselNotificationsTable = pgTable(
  "vessel_notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => vesselUsersTable.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    relatedId: integer("related_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("vessel_notifications_user_id_idx").on(table.userId),
    index("vessel_notifications_read_idx").on(table.userId, table.read),
  ],
);