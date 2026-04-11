// Equipment Downtime Tracker - Shared Types
// This file exports all shared types, enums, and utilities

// =============================================
// ENUMS (mirrors PostgreSQL enums)
// =============================================

export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  TECHNICIAN = 'technician',
  OPERATOR = 'operator',
}

export enum EquipmentStatus {
  RUNNING = 'running',
  DEGRADED = 'degraded',
  DOWN = 'down',
}

export enum DowntimeSeverity {
  CRITICAL = 'critical',
  NON_CRITICAL = 'non_critical',
}

export enum DowntimeStatus {
  REPORTED = 'reported',
  ACKNOWLEDGED = 'acknowledged',
  IN_REPAIR = 'in_repair',
  RESOLVED = 'resolved',
}

export enum EntityType {
  EQUIPMENT = 'equipment',
  MODULE = 'module',
  COMPONENT = 'component',
}

export enum ZoneType {
  PRINTER_ZONE = 'printer_zone',
  INSERTER_ZONE = 'inserter_zone',
  JET_ZONE = 'jet_zone',
  FINISHING_ZONE = 'finishing_zone',
  OTHER = 'other',
}

export enum EquipmentType {
  PRINTER = 'printer',
  INSERTER = 'inserter',
  JET = 'jet',
  FINISHER = 'finisher',
  OTHER = 'other',
}

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface Company {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Building {
  id: string;
  companyId: string;
  name: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  floorNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Zone {
  id: string;
  floorId: string;
  companyId: string;
  name: string;
  zoneType: ZoneType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Equipment {
  id: string;
  zoneId: string;
  companyId: string;
  name: string;
  equipmentId: string;
  type: EquipmentType;
  status: EquipmentStatus;
  photoUrl?: string;
  floorMapX?: number;
  floorMapY?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentWithRelations extends Equipment {
  zone?: Zone;
  modules?: Module[];
}

export interface Module {
  id: string;
  equipmentId: string;
  companyId: string;
  name: string;
  moduleId: string;
  status: EquipmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleWithRelations extends Module {
  equipment?: Equipment;
  components?: Component[];
}

export interface Component {
  id: string;
  moduleId: string;
  companyId: string;
  name: string;
  componentId: string;
  status: EquipmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComponentWithRelations extends Component {
  module?: Module;
}

export interface FloorMap {
  id: string;
  floorId: string;
  companyId: string;
  imageUrl: string;
  width?: number;
  height?: number;
  uploadedBy?: string;
  createdAt: Date;
}

export interface Part {
  id: string;
  companyId: string;
  name: string;
  partNumber: string;
  cost?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DowntimeEvent {
  id: string;
  equipmentId: string;
  companyId: string;
  moduleId?: string;
  componentId?: string;
  reportedBy: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
  severity: DowntimeSeverity;
  status: DowntimeStatus;
  description: string;
  photoUrl?: string;
  reportedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface DowntimeEventWithRelations extends DowntimeEvent {
  equipment?: Equipment;
  module?: Module;
  component?: Component;
  reportedByUser?: User;
  acknowledgedByUser?: User;
  resolvedByUser?: User;
  workLogs?: WorkLog[];
}

export interface WorkLog {
  id: string;
  downtimeEventId: string;
  technicianId: string;
  description: string;
  timeSpentMinutes: number;
  createdAt: Date;
}

export interface WorkLogWithRelations extends WorkLog {
  technician?: User;
  partsUsed?: PartsUsed[];
}

export interface PartsUsed {
  id: string;
  workLogId: string;
  partId: string;
  quantity: number;
  costAtTime: number;
  createdAt: Date;
}

export interface PartsUsedWithRelations extends PartsUsed {
  part?: Part;
}

export interface StatusHistory {
  id: string;
  companyId: string;
  entityType: EntityType;
  entityId: string;
  oldStatus?: EquipmentStatus;
  newStatus: EquipmentStatus;
  changedBy: string;
  reason?: string;
  downtimeEventId?: string;
  createdAt: Date;
}

export interface StatusHistoryWithRelations extends StatusHistory {
  changedByUser?: User;
}

// =============================================
// API REQUEST/RESPONSE TYPES
// =============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface CreateCompanyRequest {
  name: string;
}

export interface CreateUserRequest {
  companyId: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface CreateEquipmentRequest {
  zoneId: string;
  name: string;
  equipmentId: string;
  type: EquipmentType;
  photoUrl?: string;
  floorMapX?: number;
  floorMapY?: number;
}

export interface CreateDowntimeEventRequest {
  equipmentId: string;
  moduleId?: string;
  componentId?: string;
  severity: DowntimeSeverity;
  description: string;
  photoUrl?: string;
}

export interface UpdateStatusRequest {
  status: EquipmentStatus;
  reason?: string;
}

export interface CreateWorkLogRequest {
  downtimeEventId: string;
  description: string;
  timeSpentMinutes: number;
}

export interface CreatePartsUsedRequest {
  workLogId: string;
  partId: string;
  quantity: number;
  costAtTime: number;
}

// =============================================
// REPORTING TYPES
// =============================================

export interface MTTRReport {
  companyId: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  resolvedRepairs: number;
  totalRepairMinutes: number;
  mttrMinutes: number;
}

export interface EquipmentDowntimeSummary {
  companyId: string;
  equipmentId: string;
  equipmentName: string;
  currentStatus: EquipmentStatus;
  totalDowntimeEvents: number;
  criticalEvents: number;
  openEvents: number;
  totalDowntimeMinutes: number;
}

export interface TechnicianPerformance {
  technicianId: string;
  technicianName: string;
  companyId: string;
  eventsHandled: number;
  workLogsCount: number;
  totalTimeMinutes: number;
  avgTimePerLog: number;
  totalPartsCost: number;
}

export interface CurrentStatus {
  companyId: string;
  companyName: string;
  runningCount: number;
  degradedCount: number;
  downCount: number;
  totalEquipment: number;
  openEvents: number;
}

// =============================================
// WEBSOCKET/REAL-TIME TYPES
// =============================================

export type RealTimeEventType = 
  | 'STATUS_CHANGE'
  | 'DOWNTIME_REPORTED'
  | 'DOWNTIME_ACKNOWLEDGED'
  | 'DOWNTIME_RESOLVED'
  | 'EQUIPMENT_UPDATED';

export interface RealTimeEvent {
  type: RealTimeEventType;
  companyId: string;
  payload: unknown;
  timestamp: Date;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

export function getStatusColor(status: EquipmentStatus): string {
  switch (status) {
    case EquipmentStatus.RUNNING:
      return '#22c55e'; // green-500
    case EquipmentStatus.DEGRADED:
      return '#eab308'; // yellow-500
    case EquipmentStatus.DOWN:
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

export function getStatusLabel(status: EquipmentStatus): string {
  switch (status) {
    case EquipmentStatus.RUNNING:
      return 'Running';
    case EquipmentStatus.DEGRADED:
      return 'Degraded';
    case EquipmentStatus.DOWN:
      return 'Down';
    default:
      return 'Unknown';
  }
}

export function getDowntimeStatusLabel(status: DowntimeStatus): string {
  switch (status) {
    case DowntimeStatus.REPORTED:
      return 'Reported';
    case DowntimeStatus.ACKNOWLEDGED:
      return 'Acknowledged';
    case DowntimeStatus.IN_REPAIR:
      return 'In Repair';
    case DowntimeStatus.RESOLVED:
      return 'Resolved';
    default:
      return 'Unknown';
  }
}

export function getSeverityLabel(severity: DowntimeSeverity): string {
  switch (severity) {
    case DowntimeSeverity.CRITICAL:
      return 'Critical';
    case DowntimeSeverity.NON_CRITICAL:
      return 'Non-Critical';
    default:
      return 'Unknown';
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.SUPERVISOR:
      return 'Supervisor';
    case UserRole.TECHNICIAN:
      return 'Technician';
    case UserRole.OPERATOR:
      return 'Operator';
    default:
      return 'Unknown';
  }
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole[]): boolean {
  return requiredRole.includes(userRole);
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 4,
  [UserRole.SUPERVISOR]: 3,
  [UserRole.TECHNICIAN]: 2,
  [UserRole.OPERATOR]: 1,
};

export function canAccessRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

// =============================================
// VALIDATION HELPERS
// =============================================

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_TIME_SPENT_MINUTES: 1,
  MAX_TIME_SPENT_MINUTES: 1440, // 24 hours
} as const;

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= VALIDATION.MIN_PASSWORD_LENGTH;
}
