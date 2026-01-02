-- ============================================
-- Fix Enum Values
-- ============================================

-- It seems event_status enum exists but prevents 'DRAFT' value.
-- Run this block to ensure all values exist.

ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- If the above fails or you want to start fresh and NO tables use this yet:
-- DROP TYPE event_status CASCADE;
-- CREATE TYPE event_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
