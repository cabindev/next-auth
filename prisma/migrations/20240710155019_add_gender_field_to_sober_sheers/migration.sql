/*
  Warnings:

  - Added the required column `gender` to the `CampaignBuddhistLent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CampaignBuddhistLent` ADD COLUMN `gender` VARCHAR(191) NOT NULL;
