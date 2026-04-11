import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  pgEnum,
  unique,
  foreignKey,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';

// =============================================
// ENUMS
// =============================================

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'supervisor',
  'technician',
  'operator',
]);

export const equipmentStatusEnum = pgEnum('equipment_status', [
  'running',
  'degraded',
  'down',
]);

export const downtimeSeverityEnum = pgEnum('downtime_severity', [
  'critical',
  'non_critical',
]);

export const downtimeStatusEnum = pgEnum('downtime_status', [
  'reported',
  'acknowledged',
  'in_repair',
  'resolved',
]);

export const entityTypeEnum = pgEnum('entity_type', [
  'equipment',
  'module',
  'component',
]);

export const zoneTypeEnum = pgEnum('zone_type', [
  'printer_zone',
  'inserter_zone',
  'jet_zone',
  'finishing_zone',
  'other',
]);

export const equipmentTypeEnum = pgEnum('equipment_type', [
  'printer',
  'inserter',
  'jet',
  'finisher',
  'other',
]);

// =============================================
// TABLES
// =============================================

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  active: boolean('active').default(true).notNull(),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('idx_users_company_id').on(table.companyId),
  emailIdx: index('idx_users_email').on(table.email),
  roleIdx: index('idx_users_role').on(table.role),
}));

export const buildings = pgTable('buildings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('idx_buildings_company_id').on(table.companyId),
}));

export const floors = pgTable('floors', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  floorNumber: integer('floor_number').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  buildingIdx: index('idx_floors_building_id').on(table.buildingId),
}));

export const zones = pgTable('zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  floorId: uuid('floor_id').notNull().references(() => floors.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  zoneType: zoneTypeEnum('zone_type').notNull().default('other'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  floorIdx: index('idx_zones_floor_id').on(table.floorId),
  companyIdx: index('idx_zones_company_id').on(table.companyId),
}));

export const equipment = pgTable('equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  zoneId: uuid('zone_id').notNull().references(() => zones.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  equipmentId: varchar('equipment_id', { length: 100 }).notNull(),
  type: equipmentTypeEnum('type').notNull().default('other'),
  status: equipmentStatusEnum('status').notNull().default('running'),
  photoUrl: text('photo_url'),
  floorMapX: decimal('floor_map_x', { precision: 10, scale: 2 }),
  floorMapY: decimal('floor_map_y', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyEquipmentUnique: unique('equipment_company_id_equipment_id_unique').on(table.companyId, table.equipmentId),
  zoneIdx: index('idx_equipment_zone_id').on(table.zoneId),
  companyIdx: index('idx_equipment_company_id').on(table.companyId),
  statusIdx: index('idx_equipment_status').on(table.status),
  typeIdx: index('idx_equipment_type').on(table.type),
}));

export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  equipmentId: uuid('equipment_id').notNull().references(() => equipment.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  moduleId: varchar('module_id', { length: 100 }).notNull(),
  status: equipmentStatusEnum('status').notNull().default('running'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  equipmentModuleUnique: unique('modules_equipment_id_module_id_unique').on(table.equipmentId, table.moduleId),
  equipmentIdx: index('idx_modules_equipment_id').on(table.equipmentId),
  companyIdx: index('idx_modules_company_id').on(table.companyId),
  statusIdx: index('idx_modules_status').on(table.status),
}));

export const components = pgTable('components', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  componentId: varchar('component_id', { length: 100 }).notNull(),
  status: equipmentStatusEnum('status').notNull().default('running'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  moduleComponentUnique: unique('components_module_id_component_id_unique').on(table.moduleId, table.componentId),
  moduleIdx: index('idx_components_module_id').on(table.moduleId),
  companyIdx: index('idx_components_company_id').on(table.companyId),
  statusIdx: index('idx_components_status').on(table.status),
}));

export const floorMaps = pgTable('floor_maps', {
  id: uuid('id').primaryKey().defaultRandom(),
  floorId: uuid('floor_id').notNull().references(() => floors.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  width: integer('width'),
  height: integer('height'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  floorIdx: index('idx_floor_maps_floor_id').on(table.floorId),
}));

export const parts = pgTable('parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  partNumber: varchar('part_number', { length: 100 }).notNull(),
  cost: decimal('cost', { precision: 12, scale: 2 }),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyPartUnique: unique('parts_company_id_part_number_unique').on(table.companyId, table.partNumber),
  companyIdx: index('idx_parts_company_id').on(table.companyId),
  partNumberIdx: index('idx_parts_part_number').on(table.partNumber),
}));

export const downtimeEvents = pgTable('downtime_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  equipmentId: uuid('equipment_id').notNull().references(() => equipment.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').references(() => modules.id, { onDelete: 'set null' }),
  componentId: uuid('component_id').references(() => components.id, { onDelete: 'set null' }),
  reportedBy: uuid('reported_by').notNull().references(() => users.id),
  acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  severity: downtimeSeverityEnum('severity').notNull(),
  status: downtimeStatusEnum('status').notNull().default('reported'),
  description: text('description').notNull(),
  photoUrl: text('photo_url'),
  reportedAt: timestamp('reported_at', { withTimezone: true }).defaultNow().notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  equipmentIdx: index('idx_downtime_events_equipment_id').on(table.equipmentId),
  companyIdx: index('idx_downtime_events_company_id').on(table.companyId),
  statusIdx: index('idx_downtime_events_status').on(table.status),
  severityIdx: index('idx_downtime_events_severity').on(table.severity),
  reportedAtIdx: index('idx_downtime_events_reported_at').on(table.reportedAt),
}));

export const workLogs = pgTable('work_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  downtimeEventId: uuid('downtime_event_id').notNull().references(() => downtimeEvents.id, { onDelete: 'cascade' }),
  technicianId: uuid('technician_id').notNull().references(() => users.id),
  description: text('description').notNull(),
  timeSpentMinutes: integer('time_spent_minutes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  downtimeEventIdx: index('idx_work_logs_downtime_event_id').on(table.downtimeEventId),
  technicianIdx: index('idx_work_logs_technician_id').on(table.technicianId),
}));

export const partsUsed = pgTable('parts_used', {
  id: uuid('id').primaryKey().defaultRandom(),
  workLogId: uuid('work_log_id').notNull().references(() => workLogs.id, { onDelete: 'cascade' }),
  partId: uuid('part_id').notNull().references(() => parts.id),
  quantity: integer('quantity').notNull(),
  costAtTime: decimal('cost_at_time', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const statusHistory = pgTable('status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  entityType: entityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  oldStatus: equipmentStatusEnum('old_status'),
  newStatus: equipmentStatusEnum('new_status').notNull(),
  changedBy: uuid('changed_by').notNull().references(() => users.id),
  reason: text('reason'),
  downtimeEventId: uuid('downtime_event_id').references(() => downtimeEvents.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  entityIdx: index('idx_status_history_entity').on(table.entityType, table.entityId),
  companyIdx: index('idx_status_history_company_id').on(table.companyId),
  createdAtIdx: index('idx_status_history_created_at').on(table.createdAt),
}));

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  tableName: text('table_name').notNull(),
  recordId: uuid('record_id').notNull(),
  operation: varchar('operation', { length: 10 }).notNull(), // INSERT, UPDATE, DELETE
  changedBy: uuid('changed_by').references(() => users.id),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('idx_audit_log_company_id').on(table.companyId),
  createdAtIdx: index('idx_audit_log_created_at').on(table.createdAt),
}));

// Export all tables for use in other modules
export const schema = {
  companies,
  users,
  buildings,
  floors,
  zones,
  equipment,
  modules,
  components,
  floorMaps,
  parts,
  downtimeEvents,
  workLogs,
  partsUsed,
  statusHistory,
  auditLog,
};
