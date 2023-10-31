/*
  Warnings:

  - Added the required column `egSchema` to the `EventGrammar` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "spec"."EventGrammar" ADD COLUMN     "egSchema" JSONB NOT NULL;
