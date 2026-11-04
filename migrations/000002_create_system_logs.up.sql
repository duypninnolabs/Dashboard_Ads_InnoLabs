CREATE TABLE system_logs (
    log_id CHAR(36) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `level` VARCHAR(20) NOT NULL,
    `message` TEXT NOT NULL,
    `service` VARCHAR(100) NULL,
    `host` VARCHAR(255) NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `ip` VARCHAR(45) NULL,
    `request_body` JSON NULL,
    `response` JSON NULL,
    `tags` JSON NULL,
    `errors` JSON NULL,
    `metadata` JSON NULL,

    PRIMARY KEY (log_id),

    INDEX idx_system_logs_timestamp (`timestamp`),
    INDEX idx_system_logs_level (`level`),
    INDEX idx_system_logs_service (`service`),
    INDEX idx_system_logs_user_id (`user_id`),
    INDEX idx_system_logs_ip (`ip`),
    INDEX idx_system_logs_level_timestamp (`level`, `timestamp`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;