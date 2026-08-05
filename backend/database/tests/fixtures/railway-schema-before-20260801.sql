
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courseStudents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `courseId` int NOT NULL,
  `studentId` int NOT NULL,
  `status` enum('active','pending','inactive','enrolled','completed','withdrawn','suspended') NOT NULL DEFAULT 'active',
  `enrolledAt` datetime DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `registeredAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uqCourseStudent` (`courseId`,`studentId`),
  KEY `fkCourseStudentsStudent` (`studentId`),
  CONSTRAINT `fkCourseStudentsCourse` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fkCourseStudentsStudent` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `bi_courseStudents_student_role` BEFORE INSERT ON `courseStudents` FOR EACH ROW BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.studentId
          AND role = 'student'
          AND deletedAt IS NULL
          AND COALESCE(status, 'active') = 'active'
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'studentId debe pertenecer a un estudiante activo';
      END IF;
      SET NEW.enrolledAt = COALESCE(NEW.enrolledAt, NOW());
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `bu_courseStudents_student_role` BEFORE UPDATE ON `courseStudents` FOR EACH ROW BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.studentId
          AND role = 'student'
          AND deletedAt IS NULL
          AND COALESCE(status, 'active') = 'active'
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'studentId debe pertenecer a un estudiante activo';
      END IF;
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `teacherId` int NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idxCoursesTeacherStatus` (`teacherId`,`status`),
  CONSTRAINT `fkCoursesTeacher` FOREIGN KEY (`teacherId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `bi_courses_teacher_role` BEFORE INSERT ON `courses` FOR EACH ROW BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.teacherId
          AND role = 'teacher'
          AND deletedAt IS NULL
          AND COALESCE(status, 'active') = 'active'
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El teacherId debe pertenecer a un profesor activo';
      END IF;
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `bu_courses_teacher_role` BEFORE UPDATE ON `courses` FOR EACH ROW BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.teacherId
          AND role = 'teacher'
          AND deletedAt IS NULL
          AND COALESCE(status, 'active') = 'active'
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El teacherId debe pertenecer a un profesor activo';
      END IF;
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `courseId` int DEFAULT NULL,
  `eventType` varchar(100) NOT NULL,
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `meetingUrl` varchar(500) DEFAULT NULL,
  `userId` int DEFAULT NULL,
  `createdBy` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `data` json DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fkEventsUser` (`userId`),
  KEY `idxEventsCourse` (`courseId`),
  KEY `idxEventsCreatedBy` (`createdBy`),
  CONSTRAINT `fkEventsCourse` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fkEventsCreatedBy` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fkEventsUser` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `bi_events_integrity` BEFORE INSERT ON `events` FOR EACH ROW BEGIN
      IF NEW.createdBy IS NOT NULL AND NEW.courseId IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN courses c ON c.id = NEW.courseId
        WHERE u.id = NEW.createdBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'createdBy debe ser admin o profesor asignado al curso';
      END IF;
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `bu_events_integrity` BEFORE UPDATE ON `events` FOR EACH ROW BEGIN
      IF NEW.createdBy IS NOT NULL AND NEW.courseId IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN courses c ON c.id = NEW.courseId
        WHERE u.id = NEW.createdBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'createdBy debe ser admin o profesor asignado al curso';
      END IF;
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `type` enum('task_created','submission_created','submission_graded','course_updated','general') NOT NULL DEFAULT 'general',
  `title` varchar(255) DEFAULT NULL,
  `message` varchar(255) NOT NULL,
  `referenceId` int DEFAULT NULL,
  `referenceType` varchar(80) DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `readAt` datetime DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idxNotificationsRead` (`userId`,`isRead`),
  CONSTRAINT `fkNotificationsUser` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `taskId` int NOT NULL,
  `studentId` int NOT NULL,
  `fileUrl` varchar(500) DEFAULT NULL,
  `grade` decimal(5,2) DEFAULT NULL,
  `feedback` text,
  `status` enum('pending','submitted','reviewed','graded','late') NOT NULL DEFAULT 'submitted',
  `gradedBy` int DEFAULT NULL,
  `gradedAt` datetime DEFAULT NULL,
  `submittedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uqTaskStudent` (`taskId`,`studentId`),
  KEY `fkSubmissionsStudent` (`studentId`),
  KEY `idxSubmissionsStatus` (`status`),
  KEY `idxSubmissionsGradedBy` (`gradedBy`),
  CONSTRAINT `fkSubmissionsGradedBy` FOREIGN KEY (`gradedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fkSubmissionsStudent` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fkSubmissionsTask` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `bi_submissions_integrity` BEFORE INSERT ON `submissions` FOR EACH ROW BEGIN
      DECLARE course_id_value INT;
      DECLARE max_score_value DECIMAL(5,2);
      SELECT courseId, maxScore INTO course_id_value, max_score_value
      FROM tasks
      WHERE id = NEW.taskId;

      IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.studentId
          AND role = 'student'
          AND deletedAt IS NULL
          AND COALESCE(status, 'active') = 'active'
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'studentId debe pertenecer a un estudiante activo';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM courseStudents
        WHERE courseId = course_id_value
          AND studentId = NEW.studentId
          AND status IN ('active', 'enrolled')
          AND deletedAt IS NULL
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El estudiante no esta matriculado en el curso de la tarea';
      END IF;

      IF NEW.grade IS NOT NULL AND (NEW.grade < 0 OR NEW.grade > max_score_value) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La calificacion debe estar entre 0 y maxScore';
      END IF;

      IF NEW.gradedBy IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN courses c ON c.id = course_id_value
        WHERE u.id = NEW.gradedBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'gradedBy debe ser admin o profesor asignado al curso';
      END IF;

      IF NEW.grade IS NOT NULL THEN
        SET NEW.status = 'graded';
        SET NEW.gradedAt = COALESCE(NEW.gradedAt, NOW());
      END IF;
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `bu_submissions_integrity` BEFORE UPDATE ON `submissions` FOR EACH ROW BEGIN
      DECLARE course_id_value INT;
      DECLARE max_score_value DECIMAL(5,2);
      SELECT courseId, maxScore INTO course_id_value, max_score_value
      FROM tasks
      WHERE id = NEW.taskId;

      IF NEW.grade IS NOT NULL AND (NEW.grade < 0 OR NEW.grade > max_score_value) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La calificacion debe estar entre 0 y maxScore';
      END IF;

      IF NEW.gradedBy IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN courses c ON c.id = course_id_value
        WHERE u.id = NEW.gradedBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'gradedBy debe ser admin o profesor asignado al curso';
      END IF;

      IF NEW.grade IS NOT NULL AND OLD.grade IS NULL THEN
        SET NEW.status = 'graded';
        SET NEW.gradedAt = COALESCE(NEW.gradedAt, NOW());
      END IF;
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `courseId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `dueDate` datetime NOT NULL,
  `maxScore` decimal(5,2) NOT NULL DEFAULT '100.00',
  `status` enum('draft','published','closed') NOT NULL DEFAULT 'published',
  `createdBy` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idxTasksCourseStatus` (`courseId`,`status`),
  KEY `idxTasksCreatedBy` (`createdBy`),
  CONSTRAINT `fkTasksCourse` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fkTasksCreatedBy` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `bi_tasks_integrity` BEFORE INSERT ON `tasks` FOR EACH ROW BEGIN
      IF NEW.maxScore <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'maxScore debe ser mayor que cero';
      END IF;
      IF NEW.createdBy IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        LEFT JOIN courses c ON c.id = NEW.courseId
        WHERE u.id = NEW.createdBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'createdBy debe ser admin o profesor asignado al curso';
      END IF;
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `bu_tasks_integrity` BEFORE UPDATE ON `tasks` FOR EACH ROW BEGIN
      IF NEW.maxScore <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'maxScore debe ser mayor que cero';
      END IF;
      IF NEW.createdBy IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        LEFT JOIN courses c ON c.id = NEW.courseId
        WHERE u.id = NEW.createdBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'createdBy debe ser admin o profesor asignado al curso';
      END IF;
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('admin','teacher','student') NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `password` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idxUsersRoleStatus` (`role`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

