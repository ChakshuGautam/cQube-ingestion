/*
  Warnings:

  - You are about to drop the column `timeDimensions` on the `DatasetGrammar` table. All the data in the column will be lost.
  - Added the required column `timeDimension` to the `DatasetGrammar` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "spec"."DatasetGrammar" DROP COLUMN "timeDimensions",
ADD COLUMN     "timeDimension" JSONB NOT NULL;
