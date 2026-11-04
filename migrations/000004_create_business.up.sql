-- CREATE TABLE business_portfolios (
--     `id` INT AUTO_INCREMENT PRIMARY KEY,

--     `platform` VARCHAR(20) NOT NULL,                 -- META, GOOGLE, TIKTOK
--     `bm_id` VARCHAR(100) NOT NULL,                   -- ID Business từ platform
--     `bm_name` VARCHAR(255) NOT NULL,

--     `access_token` TEXT NULL,
--     `refresh_token` TEXT NULL,

--     `is_active` BOOLEAN NOT NULL DEFAULT TRUE,

--     `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
--         ON UPDATE CURRENT_TIMESTAMP,

--     UNIQUE KEY `uq_platform_bm` (`platform`, `bm_id`),
--     INDEX `idx_platform` (`platform`),
--     INDEX `idx_is_active` (`is_active`)
-- );