/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `DatasetGrammar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `DimensionGrammar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `EventGrammar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Transformer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DatasetGrammar_name_key" ON "spec"."DatasetGrammar"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DimensionGrammar_name_key" ON "spec"."DimensionGrammar"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EventGrammar_name_key" ON "spec"."EventGrammar"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Transformer_name_key" ON "transformers"."Transformer"("name");
