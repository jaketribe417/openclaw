import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { 
  companies, 
  users, 
  buildings, 
  floors, 
  zones, 
  equipment, 
  modules, 
  components,
  parts,
} from './schema.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://edt_admin:changeme_in_production@localhost:5432/equipment_downtime_tracker',
});

const db = drizzle(pool);

async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    // Create demo company
    const [demoCompany] = await db.insert(companies).values({
      name: 'Lineage Connect Demo',
    }).returning();
    
    console.log(`✅ Created company: ${demoCompany.name}`);
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const [adminUser] = await db.insert(users).values({
      companyId: demoCompany.id,
      email: 'admin@lineageconnect.com',
      passwordHash: hashedPassword,
      name: 'System Administrator',
      role: 'admin',
      active: true,
    }).returning();
    
    console.log(`✅ Created admin user: ${adminUser.email}`);
    
    // Create test users for each role
    const [supervisor] = await db.insert(users).values({
      companyId: demoCompany.id,
      email: 'supervisor@lineageconnect.com',
      passwordHash: await bcrypt.hash('supervisor123', 10),
      name: 'Jane Supervisor',
      role: 'supervisor',
      active: true,
    }).returning();
    
    const [technician] = await db.insert(users).values({
      companyId: demoCompany.id,
      email: 'technician@lineageconnect.com',
      passwordHash: await bcrypt.hash('tech123', 10),
      name: 'Mike Technician',
      role: 'technician',
      active: true,
    }).returning();
    
    const [operator] = await db.insert(users).values({
      companyId: demoCompany.id,
      email: 'operator@lineageconnect.com',
      passwordHash: await bcrypt.hash('operator123', 10),
      name: 'Sarah Operator',
      role: 'operator',
      active: true,
    }).returning();
    
    console.log('✅ Created test users for all roles');
    
    // Create building
    const [mainBuilding] = await db.insert(buildings).values({
      companyId: demoCompany.id,
      name: 'Main Production Facility',
      address: '1700 Broadway, Lenexa, KS 66219',
    }).returning();
    
    console.log(`✅ Created building: ${mainBuilding.name}`);
    
    // Create floors
    const [floor1] = await db.insert(floors).values({
      buildingId: mainBuilding.id,
      name: 'Production Floor 1',
      floorNumber: 1,
    }).returning();
    
    const [floor2] = await db.insert(floors).values({
      buildingId: mainBuilding.id,
      name: 'Production Floor 2',
      floorNumber: 2,
    }).returning();
    
    console.log('✅ Created floors');
    
    // Create zones
    const [printerZone] = await db.insert(zones).values({
      floorId: floor1.id,
      companyId: demoCompany.id,
      name: 'Printer Zone A',
      zoneType: 'printer_zone',
    }).returning();
    
    const [inserterZone] = await db.insert(zones).values({
      floorId: floor1.id,
      companyId: demoCompany.id,
      name: 'Inserter Zone B',
      zoneType: 'inserter_zone',
    }).returning();
    
    const [finishingZone] = await db.insert(zones).values({
      floorId: floor1.id,
      companyId: demoCompany.id,
      name: 'Finishing Zone C',
      zoneType: 'finishing_zone',
    }).returning();
    
    console.log('✅ Created zones');
    
    // Create equipment
    const [printer1] = await db.insert(equipment).values({
      zoneId: printerZone.id,
      companyId: demoCompany.id,
      name: 'High-Speed Printer 1',
      equipmentId: 'PRN-001',
      type: 'printer',
      status: 'running',
      floorMapX: 100,
      floorMapY: 150,
    }).returning();
    
    const [printer2] = await db.insert(equipment).values({
      zoneId: printerZone.id,
      companyId: demoCompany.id,
      name: 'High-Speed Printer 2',
      equipmentId: 'PRN-002',
      type: 'printer',
      status: 'running',
      floorMapX: 200,
      floorMapY: 150,
    }).returning();
    
    const [inserter1] = await db.insert(equipment).values({
      zoneId: inserterZone.id,
      companyId: demoCompany.id,
      name: 'Mail Inserter 1',
      equipmentId: 'INS-001',
      type: 'inserter',
      status: 'running',
      floorMapX: 300,
      floorMapY: 250,
    }).returning();
    
    const [finisher1] = await db.insert(equipment).values({
      zoneId: finishingZone.id,
      companyId: demoCompany.id,
      name: 'Envelope Finisher 1',
      equipmentId: 'FIN-001',
      type: 'finisher',
      status: 'running',
      floorMapX: 150,
      floorMapY: 350,
    }).returning();
    
    console.log('✅ Created equipment');
    
    // Create modules for printer 1
    const [printHead] = await db.insert(modules).values({
      equipmentId: printer1.id,
      companyId: demoCompany.id,
      name: 'Print Head Assembly',
      moduleId: 'PH-001',
      status: 'running',
    }).returning();
    
    const [paperFeed] = await db.insert(modules).values({
      equipmentId: printer1.id,
      companyId: demoCompany.id,
      name: 'Paper Feed Mechanism',
      moduleId: 'PF-001',
      status: 'running',
    }).returning();
    
    const [controlUnit] = await db.insert(modules).values({
      equipmentId: printer1.id,
      companyId: demoCompany.id,
      name: 'Control Unit',
      moduleId: 'CU-001',
      status: 'running',
    }).returning();
    
    console.log('✅ Created modules');
    
    // Create components for print head
    const [inkCartridge] = await db.insert(components).values({
      moduleId: printHead.id,
      companyId: demoCompany.id,
      name: 'Ink Cartridge',
      componentId: 'IC-001',
      status: 'running',
    }).returning();
    
    const [nozzle] = await db.insert(components).values({
      moduleId: printHead.id,
      companyId: demoCompany.id,
      name: 'Nozzle Assembly',
      componentId: 'NA-001',
      status: 'running',
    }).returning();
    
    console.log('✅ Created components');
    
    // Create parts catalog
    const [part1] = await db.insert(parts).values({
      companyId: demoCompany.id,
      name: 'Standard Ink Cartridge',
      partNumber: 'INK-STD-001',
      cost: 45.99,
      description: 'Standard capacity ink cartridge for printer series',
    }).returning();
    
    const [part2] = await db.insert(parts).values({
      companyId: demoCompany.id,
      name: 'High-Capacity Ink Cartridge',
      partNumber: 'INK-HC-001',
      cost: 79.99,
      description: 'High-capacity ink cartridge for extended run time',
    }).returning();
    
    const [part3] = await db.insert(parts).values({
      companyId: demoCompany.id,
      name: 'Nozzle Assembly Kit',
      partNumber: 'NOZ-ASM-001',
      cost: 125.50,
      description: 'Complete nozzle assembly replacement kit',
    }).returning();
    
    const [part4] = await db.insert(parts).values({
      companyId: demoCompany.id,
      name: 'Paper Feed Roller',
      partNumber: 'PFR-STD-001',
      cost: 32.00,
      description: 'Standard paper feed roller assembly',
    }).returning();
    
    console.log('✅ Created parts catalog');
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\nTest users:');
    console.log('  Admin: admin@lineageconnect.com / admin123');
    console.log('  Supervisor: supervisor@lineageconnect.com / supervisor123');
    console.log('  Technician: technician@lineageconnect.com / tech123');
    console.log('  Operator: operator@lineageconnect.com / operator123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch(console.error);
