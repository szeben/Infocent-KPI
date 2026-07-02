-- Migration: Add columns to dev_commitments table
-- Date: 2026-07-02
-- Description: Adds delivery_committed and measured_for_kpi boolean columns.

ALTER TABLE public.dev_commitments 
ADD COLUMN IF NOT EXISTS delivery_committed BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS measured_for_kpi BOOLEAN NOT NULL DEFAULT TRUE;
