-- Add image and detail columns to careers table
ALTER TABLE careers ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE careers ADD COLUMN IF NOT EXISTS long_description text;
ALTER TABLE careers ADD COLUMN IF NOT EXISTS syllabus text;
