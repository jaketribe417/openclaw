-- =============================================
-- Equipment Downtime Tracking System
-- PostgreSQL Database Schema
-- Version: 1.0.0
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'technician', 'operator');
CREATE TYPE equipment_status AS ENUM ('running', 'degraded', 'down');
CREATE TYPE downtime_severity AS ENUM ('critical', 'non_critical');
CREATE TYPE downtime_status AS ENUM ('reported', 'acknowledged', 'in_repair', 'resolved');
CREATE TYPE entity_type AS ENUM ('equipment', 'module', 'component');
CREATE TYPE zone_type AS ENUM ('printer_zone', 'inserter_zone', 'jet_zone', 'finishing_zone', 'other');
CREATE TYPE equipment_type AS ENUM ('printer', 'inserter', 'jet', 'finisher', 'other');

-- =============================================
-- TABLES
-- =============================================

-- Companies (top-level tenant)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buildings
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Floors
CREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    floor_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zones
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    zone_type zone_type NOT NULL DEFAULT 'other',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    equipment_id VARCHAR(100) NOT NULL,
    type equipment_type NOT NULL DEFAULT 'other',
    status equipment_status NOT NULL DEFAULT 'running',
    photo_url TEXT,
    floor_map_x FLOAT,
    floor_map_y FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, equipment_id)
);

-- Modules
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    status equipment_status NOT NULL DEFAULT 'running',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(equipment_id, module_id)
);

-- Components
CREATE TABLE components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    component_id VARCHAR(100) NOT NULL,
    status equipment_status NOT NULL DEFAULT 'running',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(module_id, component_id)
);

-- Floor Maps
CREATE TABLE floor_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parts Catalog
CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    cost DECIMAL(12,2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, part_number)
);

-- Downtime Events
CREATE TABLE downtime_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
    component_id UUID REFERENCES components(id) ON DELETE SET NULL,
    reported_by UUID NOT NULL REFERENCES users(id),
    acknowledged_by UUID REFERENCES users(id),
    resolved_by UUID REFERENCES users(id),
    severity downtime_severity NOT NULL,
    status downtime_status NOT NULL DEFAULT 'reported',
    description TEXT NOT NULL,
    photo_url TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work Logs (during repairs)
CREATE TABLE work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    downtime_event_id UUID NOT NULL REFERENCES downtime_events(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES users(id),
    description TEXT NOT NULL,
    time_spent_minutes INTEGER NOT NULL CHECK (time_spent_minutes > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parts Used in Repairs
CREATE TABLE parts_used (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_log_id UUID NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES parts(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    cost_at_time DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Status History (critical for audit, rollups, MTBF)
CREATE TABLE status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    old_status equipment_status,
    new_status equipment_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    downtime_event_id UUID REFERENCES downtime_events(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- General Audit Log (broader changes)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by UUID REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES (performance-critical)
-- =============================================
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_buildings_company_id ON buildings(company_id);
CREATE INDEX idx_floors_building_id ON floors(building_id);
CREATE INDEX idx_zones_floor_id ON zones(floor_id);
CREATE INDEX idx_zones_company_id ON zones(company_id);
CREATE INDEX idx_equipment_zone_id ON equipment(zone_id);
CREATE INDEX idx_equipment_company_id ON equipment(company_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_type ON equipment(type);
CREATE INDEX idx_modules_equipment_id ON modules(equipment_id);
CREATE INDEX idx_modules_company_id ON modules(company_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_components_module_id ON components(module_id);
CREATE INDEX idx_components_company_id ON components(company_id);
CREATE INDEX idx_components_status ON components(status);
CREATE INDEX idx_floor_maps_floor_id ON floor_maps(floor_id);
CREATE INDEX idx_parts_company_id ON parts(company_id);
CREATE INDEX idx_parts_part_number ON parts(part_number);
CREATE INDEX idx_downtime_events_equipment_id ON downtime_events(equipment_id);
CREATE INDEX idx_downtime_events_company_id ON downtime_events(company_id);
CREATE INDEX idx_downtime_events_status ON downtime_events(status);
CREATE INDEX idx_downtime_events_severity ON downtime_events(severity);
CREATE INDEX idx_downtime_events_reported_at ON downtime_events(reported_at);
CREATE INDEX idx_work_logs_downtime_event_id ON work_logs(downtime_event_id);
CREATE INDEX idx_work_logs_technician_id ON work_logs(technician_id);
CREATE INDEX idx_status_history_entity ON status_history(entity_type, entity_id);
CREATE INDEX idx_status_history_company_id ON status_history(company_id);
CREATE INDEX idx_status_history_created_at ON status_history(created_at);
CREATE INDEX idx_audit_log_company_id ON audit_log(company_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy function
CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_company_id', TRUE), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply RLS policies to all tables with company_id
CREATE POLICY tenant_isolation_companies ON companies
    USING (id = get_current_company_id() OR get_current_company_id() IS NULL);

CREATE POLICY tenant_isolation_users ON users
    FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY tenant_isolation_buildings ON buildings
    FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY tenant_isolation_zones ON zones
    FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY tenant_isolation_equipment ON equipment
    FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY tenant_isolation_modules ON modules
    FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY tenant_isolation_components ON components
    FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY tenant_isolation_floor_maps ON floor_maps
    FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY tenant_isolation_parts ON parts
    FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY tenant_isolation_downtime_events ON downtime_events
    FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY tenant_isolation_status_history ON status_history
    FOR ALL USING (company_id = get_current_company_id());

CREATE POLICY tenant_isolation_audit_log ON audit_log
    FOR ALL USING (company_id = get_current_company_id());

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger function for StatusHistory (on status changes)
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO status_history (
            company_id, entity_type, entity_id, old_status, new_status,
            changed_by, reason, downtime_event_id
        ) VALUES (
            NEW.company_id,
            CASE 
                WHEN TG_TABLE_NAME = 'equipment' THEN 'equipment'::entity_type
                WHEN TG_TABLE_NAME = 'modules' THEN 'module'::entity_type
                WHEN TG_TABLE_NAME = 'components' THEN 'component'::entity_type
            END,
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID, NEW.updated_at),
            NULLIF(current_setting('app.change_reason', TRUE), ''),
            NULLIF(current_setting('app.downtime_event_id', TRUE), '')::UUID
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to relevant tables
CREATE TRIGGER trg_equipment_status
    AFTER UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION log_status_change();

CREATE TRIGGER trg_module_status
    AFTER UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION log_status_change();

CREATE TRIGGER trg_component_status
    AFTER UPDATE ON components
    FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        company_id, table_name, record_id, operation,
        changed_by, old_values, new_values
    ) VALUES (
        COALESCE(NEW.company_id, OLD.company_id),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach audit trigger to key tables
CREATE TRIGGER trg_audit_downtime_events
    AFTER INSERT OR UPDATE OR DELETE ON downtime_events
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER trg_audit_equipment
    AFTER INSERT OR UPDATE OR DELETE ON equipment
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_update_companies_updated_at
    BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_buildings_updated_at
    BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_floors_updated_at
    BEFORE UPDATE ON floors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_zones_updated_at
    BEFORE UPDATE ON zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_equipment_updated_at
    BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_modules_updated_at
    BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_components_updated_at
    BEFORE UPDATE ON components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_parts_updated_at
    BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER VIEWS FOR REPORTING
-- =============================================

-- MTTR view (Mean Time To Repair)
CREATE VIEW vw_mttr AS
SELECT 
    e.company_id,
    e.id AS equipment_id,
    e.name AS equipment_name,
    e.equipment_id AS equipment_code,
    COUNT(de.id) FILTER (WHERE de.status = 'resolved') AS resolved_repairs,
    SUM(wl.time_spent_minutes) AS total_repair_minutes,
    ROUND(SUM(wl.time_spent_minutes)::NUMERIC / NULLIF(COUNT(de.id) FILTER (WHERE de.status = 'resolved'), 0), 2) AS mttr_minutes
FROM equipment e
LEFT JOIN downtime_events de ON de.equipment_id = e.id
LEFT JOIN work_logs wl ON wl.downtime_event_id = de.id
WHERE de.severity = 'critical'
GROUP BY e.company_id, e.id, e.name, e.equipment_id;

-- Equipment downtime summary view
CREATE VIEW vw_equipment_downtime_summary AS
SELECT 
    e.company_id,
    e.id AS equipment_id,
    e.name AS equipment_name,
    e.status AS current_status,
    COUNT(de.id) AS total_downtime_events,
    COUNT(de.id) FILTER (WHERE de.severity = 'critical') AS critical_events,
    COUNT(de.id) FILTER (WHERE de.status != 'resolved') AS open_events,
    SUM(EXTRACT(EPOCH FROM (COALESCE(de.resolved_at, NOW()) - de.reported_at))/60) AS total_downtime_minutes
FROM equipment e
LEFT JOIN downtime_events de ON de.equipment_id = e.id
GROUP BY e.company_id, e.id, e.name, e.status;

-- Technician performance view
CREATE VIEW vw_technician_performance AS
SELECT 
    u.id AS technician_id,
    u.name AS technician_name,
    u.company_id,
    COUNT(DISTINCT de.id) AS events_handled,
    COUNT(DISTINCT wl.id) AS work_logs_count,
    SUM(wl.time_spent_minutes) AS total_time_minutes,
    ROUND(AVG(wl.time_spent_minutes), 2) AS avg_time_per_log,
    SUM(pu.cost_at_time * pu.quantity) AS total_parts_cost
FROM users u
LEFT JOIN downtime_events de ON de.acknowledged_by = u.id OR de.resolved_by = u.id
LEFT JOIN work_logs wl ON wl.technician_id = u.id
LEFT JOIN parts_used pu ON pu.work_log_id = wl.id
WHERE u.role IN ('technician', 'supervisor', 'admin')
GROUP BY u.id, u.name, u.company_id;

-- Current status snapshot view
CREATE VIEW vw_current_status AS
SELECT 
    c.id AS company_id,
    c.name AS company_name,
    COUNT(e.id) FILTER (WHERE e.status = 'running') AS running_count,
    COUNT(e.id) FILTER (WHERE e.status = 'degraded') AS degraded_count,
    COUNT(e.id) FILTER (WHERE e.status = 'down') AS down_count,
    COUNT(e.id) AS total_equipment,
    COUNT(de.id) FILTER (WHERE de.status != 'resolved') AS open_events
FROM companies c
LEFT JOIN equipment e ON e.company_id = c.id
LEFT JOIN downtime_events de ON de.company_id = c.id AND de.status != 'resolved'
GROUP BY c.id, c.name;

-- =============================================
-- SEED DATA (Optional Demo Data)
-- =============================================

-- Create a demo company
INSERT INTO companies (name) VALUES ('Lineage Connect Demo');

-- Create demo admin user (password: 'admin123' - hashed with bcrypt)
-- Note: In production, use proper password hashing
INSERT INTO users (company_id, email, password_hash, name, role) 
SELECT id, 'admin@lineageconnect.com', '$2b$10$YourHashedPasswordHere', 'System Administrator', 'admin'
FROM companies WHERE name = 'Lineage Connect Demo';

-- =============================================
-- FINAL NOTES
-- =============================================
-- 1. In your Node.js app: Set session variables on every connection:
--    SET app.current_company_id = 'uuid';
--    SET app.current_user_id = 'uuid';
--
-- 2. Use transactions for status updates + downtime events
--
-- 3. For roll-up logic: Check child statuses in application layer
--
-- 4. Retention: Archive old data (>2 years) periodically
--
-- 5. Testing: Verify RLS with different company contexts
