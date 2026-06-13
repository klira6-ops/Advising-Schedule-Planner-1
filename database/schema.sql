-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema advising_schedule_planner_db
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `advising_schedule_planner_db` ;

-- -----------------------------------------------------
-- Schema advising_schedule_planner_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `advising_schedule_planner_db` DEFAULT CHARACTER SET utf8 ;
USE `advising_schedule_planner_db` ;

-- -----------------------------------------------------
-- Table `advising_schedule_planner_db`.`Student`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `advising_schedule_planner_db`.`Student` ;

CREATE TABLE IF NOT EXISTS `advising_schedule_planner_db`.`Student` (
  `student_id` INT NOT NULL AUTO_INCREMENT,
  `student_name` VARCHAR(45) NOT NULL,
  `student_email` VARCHAR(45) NOT NULL,
  `student_password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`student_id`),
  UNIQUE INDEX `student_email_UNIQUE` (`student_email` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `advising_schedule_planner_db`.`Advisor`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `advising_schedule_planner_db`.`Advisor` ;

CREATE TABLE IF NOT EXISTS `advising_schedule_planner_db`.`Advisor` (
  `Advisor_ID` INT NOT NULL AUTO_INCREMENT,
  `advisor_name` VARCHAR(45) NOT NULL,
  `advisor_email` VARCHAR(45) NOT NULL,
  `advisor_phone` VARCHAR(45) NULL,
  `advisor_password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`Advisor_ID`),
  UNIQUE INDEX `advisor_email_UNIQUE` (`advisor_email` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `advising_schedule_planner_db`.`Appointments`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `advising_schedule_planner_db`.`Appointments` ;

CREATE TABLE IF NOT EXISTS `advising_schedule_planner_db`.`Appointments` (
  `appointment_id` INT NOT NULL AUTO_INCREMENT,
  `time_created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `student_student_id` INT NOT NULL,
  `priority_slot` INT NOT NULL,
  `appointment_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `Advisor_Advisor_ID` INT NOT NULL,
  `status` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`appointment_id`, `student_student_id`, `Advisor_Advisor_ID`),
  INDEX `fk_Appointments_Student1_idx` (`student_student_id` ASC) VISIBLE,
  INDEX `fk_Appointments_Advisor1_idx` (`Advisor_Advisor_ID` ASC) VISIBLE,
  CONSTRAINT `fk_Appointments_Student1`
    FOREIGN KEY (`student_student_id`)
    REFERENCES `advising_schedule_planner_db`.`Student` (`student_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Appointments_Advisor1`
    FOREIGN KEY (`Advisor_Advisor_ID`)
    REFERENCES `advising_schedule_planner_db`.`Advisor` (`Advisor_ID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `advising_schedule_planner_db`.`Availability_Slots`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `advising_schedule_planner_db`.`Availability_Slots` ;



SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
