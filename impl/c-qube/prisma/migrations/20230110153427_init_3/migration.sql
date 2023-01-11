-- CreateTable
CREATE TABLE "transformers"."Pipe" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "transformerId" INTEGER NOT NULL,
    "eventGrammarId" INTEGER NOT NULL,
    "datasetGrammarId" INTEGER NOT NULL,

    CONSTRAINT "Pipe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transformers"."Pipe" ADD CONSTRAINT "Pipe_transformerId_fkey" FOREIGN KEY ("transformerId") REFERENCES "transformers"."Transformer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transformers"."Pipe" ADD CONSTRAINT "Pipe_eventGrammarId_fkey" FOREIGN KEY ("eventGrammarId") REFERENCES "spec"."EventGrammar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transformers"."Pipe" ADD CONSTRAINT "Pipe_datasetGrammarId_fkey" FOREIGN KEY ("datasetGrammarId") REFERENCES "spec"."DatasetGrammar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
