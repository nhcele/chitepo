-- Manual SQL script to create messages table if migration fails
-- Run this if you need to create the table manually

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

