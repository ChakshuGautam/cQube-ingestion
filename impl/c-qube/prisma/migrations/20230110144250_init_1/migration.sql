/*
  Warnings:

  - Added the required column `dimensions` to the `DatasetGrammar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schema` to the `DatasetGrammar` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "spec"."DatasetGrammar" ADD COLUMN     "dimensions" JSONB NOT NULL,
ADD COLUMN     "schema" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "transformers"."Transformer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "dataset" TEXT NOT NULL,
    "transformSync" TEXT NOT NULL,
    "transformAsync" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Transformer_pkey" PRIMARY KEY ("id")
);
