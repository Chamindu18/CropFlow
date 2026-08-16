CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT uk_users_email UNIQUE (email),

    CONSTRAINT ck_users_role
        CHECK (role IN ('FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN')),

    CONSTRAINT ck_users_status
        CHECK (
            status IN (
                'PENDING_VERIFICATION',
                'ACTIVE',
                'SUSPENDED',
                'DEACTIVATED'
            )
        )
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_status ON users (status);