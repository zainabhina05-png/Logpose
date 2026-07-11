-- =============================================================
-- Log Pose — Full Snowflake Setup
-- Run in Snowsight with ACCOUNTADMIN role, then switch to
-- logpose_app_role for the table creation block.
-- =============================================================

-- ── Step 1: Infra (run as ACCOUNTADMIN) ──────────────────────
USE ROLE ACCOUNTADMIN;

CREATE WAREHOUSE IF NOT EXISTS logpose_wh
  WAREHOUSE_SIZE = 'XSMALL'
  AUTO_SUSPEND = 60
  AUTO_RESUME = TRUE
  INITIALLY_SUSPENDED = TRUE
  COMMENT = 'Log Pose app warehouse';

CREATE DATABASE IF NOT EXISTS logpose_db
  COMMENT = 'Log Pose passion tracker data';

CREATE SCHEMA IF NOT EXISTS logpose_db.app;

CREATE ROLE IF NOT EXISTS logpose_app_role;

-- Grant the role the minimum required privileges
GRANT USAGE ON WAREHOUSE logpose_wh TO ROLE logpose_app_role;
GRANT USAGE ON DATABASE logpose_db TO ROLE logpose_app_role;
GRANT USAGE ON SCHEMA logpose_db.app TO ROLE logpose_app_role;
GRANT CREATE TABLE ON SCHEMA logpose_db.app TO ROLE logpose_app_role;

-- Grant Cortex SENTIMENT function access (needed for AI scoring)
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE logpose_app_role;

-- Attach the role to your Snowflake user (replace MY_USER)
-- GRANT ROLE logpose_app_role TO USER MY_USER;

-- ── Step 2: Tables (run as logpose_app_role) ─────────────────
USE ROLE logpose_app_role;
USE DATABASE logpose_db;
USE SCHEMA app;
USE WAREHOUSE logpose_wh;

CREATE TABLE IF NOT EXISTS users (
  user_id      STRING  DEFAULT UUID_STRING() PRIMARY KEY,
  email        STRING  UNIQUE NOT NULL,
  password_hash STRING,
  display_name STRING  NOT NULL,
  is_guest     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS islands (
  island_id  STRING  DEFAULT UUID_STRING() PRIMARY KEY,
  user_id    STRING  NOT NULL,
  name       STRING  NOT NULL,
  color_hex  STRING  DEFAULT '#C9973B',
  icon       STRING  DEFAULT 'island',
  archived   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS entries (
  entry_id        STRING  DEFAULT UUID_STRING() PRIMARY KEY,
  island_id       STRING  NOT NULL,
  user_id         STRING  NOT NULL,
  minutes_spent   NUMBER  NOT NULL,
  mood_score      NUMBER  NOT NULL,
  note            STRING,
  sentiment_score FLOAT,
  logged_at       TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Grant DML on all tables to the app role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA logpose_db.app TO ROLE logpose_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON FUTURE TABLES IN SCHEMA logpose_db.app TO ROLE logpose_app_role;
