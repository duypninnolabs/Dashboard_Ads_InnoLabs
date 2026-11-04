CREATE TABLE `business_portfolios` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,

    `platform` VARCHAR(20) NOT NULL DEFAULT 'META',

    `meta_business_id` VARCHAR(100) NOT NULL,

    `business_name` VARCHAR(255) NOT NULL,

    `access_token` TEXT NOT NULL,

    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,

    `initial_sync_completed` BOOLEAN NOT NULL DEFAULT FALSE,

    `last_synced_at` DATETIME NULL,

    `created_at` TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    `updated_at` TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY `uq_platform_business`
        (`platform`, `meta_business_id`)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ad_accounts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,

    `business_portfolio_id` INT NOT NULL,

    `meta_account_id` VARCHAR(100) NOT NULL,

    `account_name` VARCHAR(255) NOT NULL,

    `currency` VARCHAR(10) NOT NULL DEFAULT 'VND',

    `timezone_name` VARCHAR(100)
        NOT NULL
        DEFAULT 'Asia/Ho_Chi_Minh',

    `account_status` INT DEFAULT NULL,

    `is_sync_enabled` BOOLEAN NOT NULL DEFAULT TRUE,

    `last_synced_at` DATETIME NULL,

    `created_at` TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    `updated_at` TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY `uq_meta_account`
        (`meta_account_id`),

    INDEX `idx_account_business`
        (`business_portfolio_id`),

    CONSTRAINT `fk_account_business`
        FOREIGN KEY (`business_portfolio_id`)
        REFERENCES `business_portfolios`(`id`)
        ON DELETE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `brands` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,

    `brand_name` VARCHAR(150) NOT NULL,

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    `updated_at` TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY `uq_brand_name` (`brand_name`)
);

CREATE TABLE `campaigns` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,

    `ad_account_id` INT NOT NULL,

    `brand_id` INT DEFAULT NULL,

    `meta_campaign_id` VARCHAR(100) NOT NULL,

    `campaign_name` VARCHAR(255) NOT NULL,

    `campaign_status` VARCHAR(50) DEFAULT NULL,

    `effective_status` VARCHAR(50) DEFAULT NULL,

    `is_sync_enabled` BOOLEAN NOT NULL DEFAULT TRUE,

    `history_synced` BOOLEAN NOT NULL DEFAULT FALSE,

    `history_synced_at` DATETIME NULL,

    `first_seen_at` DATETIME NULL,

    `last_active_at` DATETIME NULL,

    `created_at` TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    `updated_at` TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY `uq_meta_campaign`
        (`meta_campaign_id`),

    INDEX `idx_campaign_account`
        (`ad_account_id`),

    INDEX `idx_campaign_brand`
        (`brand_id`),

    INDEX `idx_campaign_sync`
        (`is_sync_enabled`, `history_synced`),

    CONSTRAINT `fk_campaign_account`
        FOREIGN KEY (`ad_account_id`)
        REFERENCES `ad_accounts`(`id`)
        ON DELETE CASCADE,

    CONSTRAINT `fk_campaign_brand`
        FOREIGN KEY (`brand_id`)
        REFERENCES `brands`(`id`)
        ON DELETE SET NULL

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `campaign_daily_insights` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,

    `campaign_id` BIGINT NOT NULL,

    `insight_date` DATE NOT NULL,

    `spend` DECIMAL(15,2) NOT NULL DEFAULT 0,

    `impressions` BIGINT NOT NULL DEFAULT 0,

    `reach` BIGINT NOT NULL DEFAULT 0,

    `clicks` BIGINT NOT NULL DEFAULT 0,

    `messages` BIGINT NOT NULL DEFAULT 0,

    `leads` BIGINT NOT NULL DEFAULT 0,

    `ctr` DECIMAL(10,4) NOT NULL DEFAULT 0,

    `cpc` DECIMAL(15,2) NOT NULL DEFAULT 0,

    `cpm` DECIMAL(15,2) NOT NULL DEFAULT 0,

    `is_finalized` BOOLEAN NOT NULL DEFAULT FALSE,

    `finalized_at` DATETIME NULL,

    `last_synced_at` DATETIME NULL,

    `created_at` TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    `updated_at` TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY `uq_campaign_date`
        (`campaign_id`, `insight_date`),

    INDEX `idx_insight_date`
        (`insight_date`),

    INDEX `idx_insight_tracking`
        (`insight_date`, `is_finalized`),

    CONSTRAINT `fk_insight_campaign`
        FOREIGN KEY (`campaign_id`)
        REFERENCES `campaigns`(`id`)
        ON DELETE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;