-- Chitepo LMS - create an isolated database + user on your EXISTING MySQL.
-- Run as root on the VPS:   sudo mysql < deploy/setup-database.sql
-- This never touches your other databases.
--
-- >>> Change CHANGE_ME_DB_PASSWORD to a strong value and use the SAME value
--     for DATABASE_PASSWORD in backend/.env <<<

CREATE DATABASE IF NOT EXISTS chitepo
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'chitepo'@'localhost'
  IDENTIFIED BY 'CHANGE_ME_DB_PASSWORD';

GRANT ALL PRIVILEGES ON chitepo.* TO 'chitepo'@'localhost';
FLUSH PRIVILEGES;
