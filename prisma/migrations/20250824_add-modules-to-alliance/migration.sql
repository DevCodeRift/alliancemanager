-- Add modules JSON column to Alliance
ALTER TABLE "Alliance" ADD COLUMN IF NOT EXISTS modules jsonb;
