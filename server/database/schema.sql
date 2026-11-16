-- ============================================================
-- CAMPUS RESOURCE ALLOCATION SYSTEM - MYSQL DATABASE SCHEMA
-- Relational Database: MySQL 8.0+ / MariaDB
-- College Campus Infrastructure: Block C & Block E Inventory
-- ============================================================

CREATE DATABASE IF NOT EXISTS campus_resource_db;
USE campus_resource_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role ENUM('Student', 'Faculty/Staff', 'Admin') DEFAULT 'Student',
    department VARCHAR(100) NOT NULL,
    status ENUM('Active', 'Suspended') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. RESOURCES TABLE (Updated with Block & Floor)
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    block ENUM('Block C', 'Block D', 'Block E') NOT NULL,
    floor VARCHAR(50) NOT NULL,
    category ENUM('Classroom', 'Computer Lab', 'Specialized Lab', 'Seminar Hall / Auditorium') NOT NULL,
    capacity INT NOT NULL,
    facilities TEXT,
    available BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(50) PRIMARY KEY,
    resource_id INT NOT NULL,
    resource_name VARCHAR(150) NOT NULL,
    block VARCHAR(50),
    floor VARCHAR(50),
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    booking_date VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    time_display VARCHAR(50),
    purpose TEXT,
    priority ENUM('Normal', 'High') DEFAULT 'Normal',
    status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
    queue_position VARCHAR(20) DEFAULT '—',
    admin_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);

-- 4. SYSTEM SETTINGS TABLE (Auto-Approve policy)
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(100) NOT NULL
);

-- Initial System Settings
INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES
('auto_approve_mode', 'false'),
('admin_password', '1203');

-- Initial Users
INSERT IGNORE INTO users (id, name, email, role, department, status) VALUES
('STU-2024-089', 'Shreya Rawat', 'shreya.rawat@campus.edu', 'Student', 'Computer Science', 'Active'),
('STU-2024-112', 'Aman Verma', 'aman.verma@campus.edu', 'Student', 'Information Technology', 'Active'),
('FAC-1004', 'Dr. K. S. Rao', 'ksrao@campus.edu', 'Faculty/Staff', 'Computer Science', 'Active'),
('ADM-001', 'Campus Resource Admin', 'admin.resources@campus.edu', 'Admin', 'Estate & Facility Management', 'Active');

-- ============================================================
-- SEED DATA: BLOCK E & BLOCK C INVENTORY (31 REAL CAMPUS VENUES)
-- ============================================================

INSERT INTO resources (id, name, block, floor, category, capacity, facilities, available, description) VALUES
-- E BLOCK - GROUND FLOOR
(1, 'E001', 'Block E', 'Ground Floor', 'Classroom', 100, 'Projector, Whiteboard', TRUE, 'Large capacity ground floor lecture classroom in Block E.'),
(2, 'E002', 'Block E', 'Ground Floor', 'Classroom', 100, 'Projector, Whiteboard', TRUE, 'Large capacity ground floor lecture classroom in Block E.'),
(3, 'E003', 'Block E', 'Ground Floor', 'Classroom', 100, 'Projector, Whiteboard', TRUE, 'Large capacity ground floor lecture classroom in Block E.'),
(4, 'E004', 'Block E', 'Ground Floor', 'Specialized Lab', 60, 'Nursing Equipment, Clinical Kits', TRUE, 'Specialized Nursing Laboratory with clinical setup.'),

-- E BLOCK - FIRST FLOOR
(5, 'E101', 'Block E', '1st Floor', 'Classroom', 100, 'Projector, Whiteboard', TRUE, 'First floor standard lecture classroom in Block E.'),
(6, 'E102', 'Block E', '1st Floor', 'Classroom', 100, 'Projector, Whiteboard', TRUE, 'First floor standard lecture classroom in Block E.'),
(7, 'E103', 'Block E', '1st Floor', 'Classroom', 100, 'Projector, Whiteboard', TRUE, 'First floor standard lecture classroom in Block E.'),
(8, 'E104', 'Block E', '1st Floor', 'Computer Lab', 60, 'Projector, Computers, Whiteboard', TRUE, 'First floor computer lab & practical computing classroom.'),

-- E BLOCK - SECOND FLOOR
(9, 'E201', 'Block E', '2nd Floor', 'Classroom', 100, 'Projector, Whiteboard', TRUE, 'Second floor lecture classroom in Block E.'),
(10, 'E202', 'Block E', '2nd Floor', 'Classroom', 100, 'Projector, Whiteboard', TRUE, 'Second floor lecture classroom in Block E.'),
(11, 'E203', 'Block E', '2nd Floor', 'Classroom', 100, 'Projector, Whiteboard', TRUE, 'Second floor lecture classroom in Block E.'),
(12, 'E204', 'Block E', '2nd Floor', 'Computer Lab', 60, 'Computers, Whiteboard, Projector', TRUE, 'Second floor computer lab for technical programming and labs.'),

-- E BLOCK - THIRD FLOOR
(13, 'E301', 'Block E', '3rd Floor', 'Classroom', 100, 'Projector, Smart Board', TRUE, 'Interactive smart board equipped classroom on 3rd floor.'),
(14, 'E302', 'Block E', '3rd Floor', 'Classroom', 80, 'Projector, Whiteboard', TRUE, 'Third floor lecture classroom with 80 capacity.'),
(15, 'E303', 'Block E', '3rd Floor', 'Classroom', 100, 'Smart Board', TRUE, 'Third floor interactive smart classroom.'),
(16, 'E304', 'Block E', '3rd Floor', 'Classroom', 100, 'Projector, Whiteboard', TRUE, 'Third floor lecture room with high visibility projector setup.'),

-- C BLOCK - GROUND FLOOR
(17, 'C001', 'Block C', 'Ground Floor', 'Classroom', 80, 'Projector, Whiteboard', TRUE, 'Ground floor lecture classroom in Block C.'),
(18, 'C003', 'Block C', 'Ground Floor', 'Classroom', 80, 'Projector, Whiteboard', TRUE, 'Ground floor lecture classroom in Block C.'),

-- C BLOCK - FIRST FLOOR
(19, 'C102', 'Block C', '1st Floor', 'Classroom', 80, 'Projector, Whiteboard', TRUE, 'First floor classroom in Block C.'),
(20, 'C104', 'Block C', '1st Floor', 'Classroom', 80, 'Projector, Whiteboard', TRUE, 'First floor classroom in Block C.'),

-- C BLOCK - SECOND FLOOR
(21, 'C202', 'Block C', '2nd Floor', 'Classroom', 80, 'Projector, Whiteboard', TRUE, 'Second floor classroom in Block C.'),
(22, 'C203', 'Block C', '2nd Floor', 'Classroom', 80, 'Whiteboard, Projector', TRUE, 'Second floor classroom in Block C.'),
(23, 'C204', 'Block C', '2nd Floor', 'Classroom', 80, 'Whiteboard, Projector', TRUE, 'Second floor classroom in Block C.'),

-- C BLOCK - THIRD FLOOR
(24, 'C302', 'Block C', '3rd Floor', 'Classroom', 90, 'Smart Board', TRUE, 'Third floor interactive classroom with smart board.'),
(25, 'C304', 'Block C', '3rd Floor', 'Classroom', 90, 'Smart Board', TRUE, 'Third floor interactive classroom with smart board.'),
(26, 'C306', 'Block C', '3rd Floor', 'Classroom', 80, 'Projector, 1 Whiteboard', TRUE, 'Third floor classroom in Block C.'),

-- C BLOCK - LABS & SPECIALIZED HALLS
(27, 'Lab 6', 'Block C', 'C Block Labs', 'Computer Lab', 55, '55 Computers', TRUE, 'Dedicated computer lab equipped with 55 terminals.'),
(28, 'Lab 7', 'Block C', 'C Block Labs', 'Computer Lab', 55, '55 Computers', TRUE, 'Dedicated computer lab equipped with 55 terminals.'),
(29, 'Logic Design Lab', 'Block C', 'C Block Labs', 'Specialized Lab', 45, '1 Whiteboard, 8 Performing Kits', TRUE, 'Specialized lab for digital logic and circuit design.'),
(30, 'Civil Lab', 'Block C', 'C Block Labs', 'Specialized Lab', 40, 'Civil Engineering Equipment', TRUE, 'Specialized civil engineering and material testing laboratory.'),
(31, 'OSH', 'Block C', 'Main Wing', 'Seminar Hall / Auditorium', 120, '1 Smart Board, Audio System', TRUE, 'Open Seminar Hall (OSH) for symposiums, guest talks and presentations.')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    block = VALUES(block),
    floor = VALUES(floor),
    category = VALUES(category),
    capacity = VALUES(capacity),
    facilities = VALUES(facilities),
    description = VALUES(description);
