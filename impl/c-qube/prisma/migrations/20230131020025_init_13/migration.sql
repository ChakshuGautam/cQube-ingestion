-- DropForeignKey
ALTER TABLE "transformers"."Transformer" DROP CONSTRAINT "Transformer_datasetGrammarId_fkey";

-- DropForeignKey
ALTER TABLE "transformers"."Transformer" DROP CONSTRAINT "Transformer_eventGrammarId_fkey";

-- AlterTable
ALTER TABLE "transformers"."Transformer" ADD COLUMN     "suggestiveDatasets" TEXT[],
ADD COLUMN     "suggestiveEvents" TEXT[];
