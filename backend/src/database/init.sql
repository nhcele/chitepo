-- Mindelta Database Initialization Script
-- This script sets up the initial database structure and configuration

-- Create the database if it doesn't exist (handled by Docker environment variables)
-- USE mindelta;

-- Set charset and collation for proper UTF-8 support
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create a user for the application (handled by Docker environment variables)
-- The MYSQL_USER and MYSQL_PASSWORD environment variables will create the user automatically

-- Grant necessary privileges
-- GRANT ALL PRIVILEGES ON mindelta.* TO 'mindelta'@'%';
-- FLUSH PRIVILEGES;

-- Enable event scheduler for potential background tasks
SET GLOBAL event_scheduler = ON;

-- Set timezone to UTC
SET GLOBAL time_zone = '+00:00';

-- Optimize MySQL settings for development
SET GLOBAL innodb_buffer_pool_size = 134217728; -- 128MB in bytes
SET GLOBAL max_connections = 200;

-- Create initial admin user (will be handled by application seeding)
-- This is just a placeholder - actual user creation will be done via the application

SELECT 'Mindelta database initialization completed' as status;
