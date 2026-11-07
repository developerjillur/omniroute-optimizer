ALTER TABLE usage_history ADD COLUMN tokens_cache_creation_5m INTEGER
  CHECK (tokens_cache_creation_5m IS NULL OR
    (typeof(tokens_cache_creation_5m) = 'integer' AND tokens_cache_creation_5m >= 0));
ALTER TABLE usage_history ADD COLUMN tokens_cache_creation_1h INTEGER
  CHECK (tokens_cache_creation_1h IS NULL OR
    (typeof(tokens_cache_creation_1h) = 'integer' AND tokens_cache_creation_1h >= 0));
