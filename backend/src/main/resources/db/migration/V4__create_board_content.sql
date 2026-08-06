CREATE TABLE board_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL UNIQUE REFERENCES boards(id) ON DELETE CASCADE,
    canvas_data JSONB NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    last_saved_by UUID REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE board_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    saved_by UUID NOT NULL REFERENCES users(id),
    canvas_snapshot JSONB NOT NULL,
    version_number INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(board_id, version_number)
);

CREATE INDEX idx_board_versions_board_id ON board_versions(board_id);
CREATE INDEX idx_board_versions_board_version ON board_versions(board_id, version_number);
