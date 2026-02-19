-- Add category column to courses table
ALTER TABLE courses 
ADD COLUMN category ENUM('core_ideology', 'contemporary_studies', 'practical_governance', 'diaspora_program') NULL
AFTER difficulty;

-- Verify the column was added
DESCRIBE courses;

