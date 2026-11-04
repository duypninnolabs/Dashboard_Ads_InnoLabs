-- Add brand_id to adsets
ALTER TABLE adsets ADD COLUMN IF NOT EXISTS brand_id BIGINT DEFAULT NULL AFTER campaign_id;
CREATE INDEX IF NOT EXISTS idx_adsets_brand ON adsets (brand_id);

-- Add brand_id to ads
ALTER TABLE ads ADD COLUMN IF NOT EXISTS brand_id BIGINT DEFAULT NULL AFTER id;
CREATE INDEX IF NOT EXISTS idx_ads_brand ON ads (brand_id);

-- Backfill adsets.brand_id from campaigns.brand_id
UPDATE adsets ast
JOIN campaigns c ON c.id = ast.campaign_id
SET ast.brand_id = c.brand_id
WHERE ast.brand_id IS NULL AND c.brand_id IS NOT NULL;

-- Backfill ads.adset_id from adsets matching meta_adset_id
UPDATE ads a
JOIN adsets ast ON ast.meta_adset_id = a.meta_adset_id
SET a.adset_id = ast.id
WHERE (a.adset_id = 0 OR a.adset_id IS NULL);

-- Backfill ads.campaign_id from adsets
UPDATE ads a
JOIN adsets ast ON ast.id = a.adset_id
SET a.campaign_id = ast.campaign_id
WHERE (a.campaign_id = 0 OR a.campaign_id IS NULL) AND ast.campaign_id > 0;

-- Backfill ads.brand_id from adsets
UPDATE ads a
JOIN adsets ast ON ast.id = a.adset_id
SET a.brand_id = ast.brand_id
WHERE a.brand_id IS NULL AND ast.brand_id IS NOT NULL;

-- Remove old placeholder dummy adsets with 'adset_' prefix (created before real Meta adsets sync)
DELETE FROM adsets WHERE meta_adset_id LIKE 'adset_%';


