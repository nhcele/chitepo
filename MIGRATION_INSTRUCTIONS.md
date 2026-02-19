# Migration Instructions for Messages Table

The certification migration has been partially applied, causing conflicts. Here are two ways to proceed:

## Option 1: Manually Create Messages Table (Recommended)

Run this SQL script directly in your MySQL database:

```sql
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) PRIMARY KEY,
  `course_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `recipient_id` VARCHAR(36) NOT NULL,
  `content` TEXT NOT NULL,
  `type` ENUM('instructor_to_student', 'student_to_instructor', 'system') DEFAULT 'student_to_instructor',
  `status` ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  `read_at` TIMESTAMP NULL,
  `is_archived` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `IDX_messages_course_created` (`course_id`, `created_at`),
  INDEX `IDX_messages_sender_created` (`sender_id`, `created_at`),
  INDEX `IDX_messages_recipient_created` (`recipient_id`, `created_at`),
  CONSTRAINT `FK_messages_course_id` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_messages_sender_id` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_messages_recipient_id` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Then mark the migration as complete:

```sql
INSERT INTO `migrations` (`timestamp`, `name`) 
VALUES (1733000000000, 'AddMessagingTable1733000000000')
ON DUPLICATE KEY UPDATE `name` = 'AddMessagingTable1733000000000';
```

## Option 2: Fix Certification Migration First

The certification migration needs to be made idempotent. You can:

1. Check if the certification tables already exist
2. If they do, mark that migration as complete in the migrations table
3. Then run the new migration

To check what migrations have run:
```sql
SELECT * FROM migrations ORDER BY timestamp DESC;
```

To mark a migration as complete (if tables already exist):
```sql
INSERT INTO `migrations` (`timestamp`, `name`) 
VALUES (1732640000000, 'AddCertificationTables1732640000000')
ON DUPLICATE KEY UPDATE `name` = 'AddCertificationTables1732640000000';
```

## Option 3: Use Migration Utils

Try using the migration utils script which might handle this better:

```bash
cd backend
npm run migration:utils run
```

## Verification

After creating the table, verify it exists:

```sql
SHOW TABLES LIKE 'messages';
DESCRIBE messages;
```

## Next Steps

Once the messages table is created, all the new features will work:
- ✅ Messaging system
- ✅ Instructor student progress viewing
- ✅ Recommendation system

All backend code is ready and just needs the database table!

