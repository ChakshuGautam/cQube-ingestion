/*
  Warnings:

  - You are about to drop the column `datasetGrammarId` on the `Transformer` table. All the data in the column will be lost.
  - You are about to drop the column `eventGrammarId` on the `Transformer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transformers"."Transformer" DROP COLUMN "datasetGrammarId",
DROP COLUMN "eventGrammarId";
