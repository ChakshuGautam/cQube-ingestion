/*
  Warnings:

  - Added the required column `storage` to the `DimensionGrammar` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "spec"."DimensionGrammar" ADD COLUMN     "storage" JSONB NOT NULL;
