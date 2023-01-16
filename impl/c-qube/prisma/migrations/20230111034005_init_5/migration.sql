/*
  Warnings:

  - Added the required column `schema` to the `DimensionGrammar` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "spec"."DimensionGrammar" ADD COLUMN     "schema" JSONB NOT NULL;
