INSERT INTO board_templates (name, description, category, canvas_data, is_global) VALUES
(
    'Mind Map',
    'Central topic with branching ideas radiating outward',
    'ideation',
    '{"nodes":[{"id":"center","type":"circle","position":{"x":400,"y":300},"data":{"label":"Central Idea","color":"#dbeafe"}},{"id":"b1","type":"rectangle","position":{"x":150,"y":150},"data":{"label":"Branch 1","color":"#dcfce7"}},{"id":"b2","type":"rectangle","position":{"x":650,"y":150},"data":{"label":"Branch 2","color":"#fef9c3"}},{"id":"b3","type":"rectangle","position":{"x":150,"y":450},"data":{"label":"Branch 3","color":"#f3e8ff"}},{"id":"b4","type":"rectangle","position":{"x":650,"y":450},"data":{"label":"Branch 4","color":"#fee2e2"}}],"edges":[{"id":"e1","source":"center","target":"b1","type":"default"},{"id":"e2","source":"center","target":"b2","type":"default"},{"id":"e3","source":"center","target":"b3","type":"default"},{"id":"e4","source":"center","target":"b4","type":"default"}]}',
    true
),
(
    'Org Chart',
    'Hierarchical organizational structure top-down',
    'organization',
    '{"nodes":[{"id":"ceo","type":"rectangle","position":{"x":350,"y":50},"data":{"label":"CEO","color":"#dbeafe"}},{"id":"vp1","type":"rectangle","position":{"x":150,"y":200},"data":{"label":"VP Engineering","color":"#dcfce7"}},{"id":"vp2","type":"rectangle","position":{"x":550,"y":200},"data":{"label":"VP Product","color":"#dcfce7"}},{"id":"m1","type":"rectangle","position":{"x":50,"y":350},"data":{"label":"Team Lead A","color":"#f3f4f6"}},{"id":"m2","type":"rectangle","position":{"x":250,"y":350},"data":{"label":"Team Lead B","color":"#f3f4f6"}},{"id":"m3","type":"rectangle","position":{"x":450,"y":350},"data":{"label":"PM 1","color":"#f3f4f6"}},{"id":"m4","type":"rectangle","position":{"x":650,"y":350},"data":{"label":"PM 2","color":"#f3f4f6"}}],"edges":[{"id":"e1","source":"ceo","target":"vp1","type":"default"},{"id":"e2","source":"ceo","target":"vp2","type":"default"},{"id":"e3","source":"vp1","target":"m1","type":"default"},{"id":"e4","source":"vp1","target":"m2","type":"default"},{"id":"e5","source":"vp2","target":"m3","type":"default"},{"id":"e6","source":"vp2","target":"m4","type":"default"}]}',
    true
),
(
    'Flowchart',
    'Process flow with start, steps, decisions, and end',
    'process',
    '{"nodes":[{"id":"start","type":"circle","position":{"x":350,"y":50},"data":{"label":"Start","color":"#dcfce7"}},{"id":"step1","type":"rectangle","position":{"x":325,"y":180},"data":{"label":"Step 1","color":"#ffffff"}},{"id":"decision","type":"diamond","position":{"x":350,"y":330},"data":{"label":"Condition?","color":"#fef9c3"}},{"id":"step2a","type":"rectangle","position":{"x":150,"y":480},"data":{"label":"Yes Path","color":"#ffffff"}},{"id":"step2b","type":"rectangle","position":{"x":525,"y":480},"data":{"label":"No Path","color":"#ffffff"}},{"id":"end","type":"circle","position":{"x":350,"y":620},"data":{"label":"End","color":"#fee2e2"}}],"edges":[{"id":"e1","source":"start","target":"step1","type":"default"},{"id":"e2","source":"step1","target":"decision","type":"default"},{"id":"e3","source":"decision","target":"step2a","type":"default"},{"id":"e4","source":"decision","target":"step2b","type":"default"},{"id":"e5","source":"step2a","target":"end","type":"default"},{"id":"e6","source":"step2b","target":"end","type":"default"}]}',
    true
),
(
    'Brainstorming',
    'Sticky notes canvas for brainstorming sessions',
    'ideation',
    '{"nodes":[{"id":"frame","type":"frame","position":{"x":50,"y":50},"data":{"label":"Brainstorming Session","width":700,"height":500}},{"id":"s1","type":"stickyNote","position":{"x":100,"y":120},"data":{"label":"Idea 1","color":"#fef08a"}},{"id":"s2","type":"stickyNote","position":{"x":300,"y":120},"data":{"label":"Idea 2","color":"#fda4af"}},{"id":"s3","type":"stickyNote","position":{"x":500,"y":120},"data":{"label":"Idea 3","color":"#86efac"}},{"id":"s4","type":"stickyNote","position":{"x":100,"y":320},"data":{"label":"Idea 4","color":"#93c5fd"}},{"id":"s5","type":"stickyNote","position":{"x":300,"y":320},"data":{"label":"Idea 5","color":"#fdba74"}},{"id":"s6","type":"stickyNote","position":{"x":500,"y":320},"data":{"label":"Idea 6","color":"#fef08a"}}],"edges":[]}',
    true
),
(
    'Process Map',
    'Horizontal process flow with stages and connections',
    'process',
    '{"nodes":[{"id":"p1","type":"circle","position":{"x":50,"y":200},"data":{"label":"Start","color":"#dcfce7"}},{"id":"p2","type":"rectangle","position":{"x":200,"y":185},"data":{"label":"Review","color":"#ffffff"}},{"id":"p3","type":"diamond","position":{"x":400,"y":200},"data":{"label":"Ready?","color":"#fef9c3"}},{"id":"p4","type":"rectangle","position":{"x":580,"y":185},"data":{"label":"Process","color":"#ffffff"}},{"id":"p5","type":"rectangle","position":{"x":760,"y":185},"data":{"label":"Deliver","color":"#ffffff"}},{"id":"p6","type":"circle","position":{"x":940,"y":200},"data":{"label":"Done","color":"#fee2e2"}},{"id":"p7","type":"rectangle","position":{"x":380,"y":350},"data":{"label":"Revise","color":"#f3e8ff"}}],"edges":[{"id":"e1","source":"p1","target":"p2","type":"default"},{"id":"e2","source":"p2","target":"p3","type":"default"},{"id":"e3","source":"p3","target":"p4","type":"default"},{"id":"e4","source":"p4","target":"p5","type":"default"},{"id":"e5","source":"p5","target":"p6","type":"default"},{"id":"e6","source":"p3","target":"p7","type":"default"},{"id":"e7","source":"p7","target":"p2","type":"default"}]}',
    true
);
