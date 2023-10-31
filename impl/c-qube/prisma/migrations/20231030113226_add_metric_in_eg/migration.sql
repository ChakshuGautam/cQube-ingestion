/*
  Warnings:

  - Added the required column `metric` to the `EventGrammar` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "spec"."EventGrammar" ADD COLUMN     "metric" TEXT NOT NULL;
