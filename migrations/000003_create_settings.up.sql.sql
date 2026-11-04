CREATE TABLE system_settings (
    `key` VARCHAR(50) PRIMARY KEY,
    `value` VARCHAR(255) NOT NULL,
    data_type VARCHAR(20) NOT NULL DEFAULT 'string',
    description VARCHAR(255) NULL,
    effective_date DATE NULL,
    updated_by VARCHAR(50) NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- Khởi tạo dữ liệu cấu hình mặc định
INSERT INTO system_settings (
    `key`,
    `value`,
    data_type,
    description,
    effective_date
)
VALUES
    (
        'vat_rate',
        '0.10',
        'number',
        'Tỷ lệ thuế VAT mặc định (10%)',
        '2026-01-01'
    ),
    (
        'ftf_rate',
        '0.011',
        'number',
        'Tỷ lệ phí giao dịch ngoại tệ (1.1%)',
        '2026-01-01'
    ),
    (
        'sync_interval_hours',
        '4',
        'number',
        'Tần suất đồng bộ tự động (giờ)',
        '2026-01-01'
    ),
    (
        'sync_lookback_days',
        '7',
        'number',
        'Số ngày đồng bộ lại gần nhất',
        '2026-01-01'
    );