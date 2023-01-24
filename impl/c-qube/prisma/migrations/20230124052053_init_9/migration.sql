/*
  Warnings:

  - You are about to drop the column `dataset` on the `Transformer` table. All the data in the column will be lost.
  - You are about to drop the column `event` on the `Transformer` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Transformer` table. All the data in the column will be lost.
  - Added the required column `datasetGrammarId` to the `Transformer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventGrammarId` to the `Transformer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transformers"."Transformer" DROP COLUMN "dataset",
DROP COLUMN "event",
DROP COLUMN "type",
ADD COLUMN     "datasetGrammarId" INTEGER NOT NULL,
ADD COLUMN     "eventGrammarId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "transformers"."Transformer" ADD CONSTRAINT "Transformer_eventGrammarId_fkey" FOREIGN KEY ("eventGrammarId") REFERENCES "spec"."EventGrammar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transformers"."Transformer" ADD CONSTRAINT "Transformer_datasetGrammarId_fkey" FOREIGN KEY ("datasetGrammarId") REFERENCES "spec"."DatasetGrammar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
