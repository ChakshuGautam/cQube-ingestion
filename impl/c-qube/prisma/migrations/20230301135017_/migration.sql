/*
  Warnings:

  - Added the required column `timeDimensions` to the `DatasetGrammar` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "spec"."DatasetGrammar" ADD COLUMN     "timeDimensions" JSONB NOT NULL;
