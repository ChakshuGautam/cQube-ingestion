-- AlterTable
ALTER TABLE "spec"."DatasetGrammar" ADD COLUMN     "eventGrammarId" INTEGER;

-- AddForeignKey
ALTER TABLE "spec"."DatasetGrammar" ADD CONSTRAINT "DatasetGrammar_eventGrammarId_fkey" FOREIGN KEY ("eventGrammarId") REFERENCES "spec"."EventGrammar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
