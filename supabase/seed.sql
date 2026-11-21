-- ==============================================================================
-- PUNE FLOODGUARD AI: INITIAL SEED DATA FOR TROUBLE SPOTS & SHELTERS
-- (Marked with is_demo = true and clearly labelled)
-- ==============================================================================

-- Seed Pune Safe Places / Elevated Shelters (All marked with verification status)
INSERT INTO safe_places (id, name, category, lat, lng, source, verification, is_demo)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Tilak Road Sports Complex (Higher Ground)', 'Elevated Community Center', 18.5085, 73.8520, 'PMC Disaster Cell', 'official_shelter', true),
    ('a0000000-0000-0000-0000-000000000002', 'Fergusson College Amphitheatre & Main Hall', 'Institutional Relief Point', 18.5236, 73.8415, 'PMC Ward Office 3', 'official_shelter', true),
    ('a0000000-0000-0000-0000-000000000003', 'Swargate Flyover Upper Concourse', 'Infrastructure High Ground', 18.5018, 73.8584, 'Traffic Advisory 2024', 'listed', true),
    ('a0000000-0000-0000-0000-000000000004', 'COEP Technological University North Quad', 'Educational Campus', 18.5293, 73.8566, 'Listed Community Site', 'listed', true),
    ('a0000000-0000-0000-0000-000000000005', 'Sinhagad College Hilltop Campus', 'Elevated Campus', 18.4682, 73.8364, 'Ward 12 Relief Plan', 'unverified', true),
    ('a0000000-0000-0000-0000-000000000006', 'Katraj PMT Bus Terminus First Floor Hall', 'Transport Hub', 18.4552, 73.8647, 'PMC Transport Emergency', 'listed', true)
ON CONFLICT (id) DO NOTHING;
