ALTER TABLE call_logs ADD COLUMN tokens_cache_creation_5m INTEGER;
ALTER TABLE call_logs ADD COLUMN tokens_cache_creation_1h INTEGER;
ALTER TABLE call_logs ADD COLUMN native_session_tag TEXT;
ALTER TABLE call_logs ADD COLUMN native_cache_group_tag TEXT;
CREATE INDEX IF NOT EXISTS idx_call_logs_native_cache_group
  ON call_logs(native_cache_group_tag, model, timestamp, id)
  WHERE native_cache_group_tag IS NOT NULL AND status = 200;
