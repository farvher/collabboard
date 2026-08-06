CREATE TABLE board_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    canvas_data JSONB NOT NULL DEFAULT '{}',
    thumbnail_url TEXT,
    is_global BOOLEAN NOT NULL DEFAULT true,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_templates_category ON board_templates(category);
CREATE INDEX idx_board_templates_org_id ON board_templates(org_id);
