/*
  Warnings:

  - Added the required column `instrumentField` to the `EventGrammar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instrumentTypeType` to the `EventGrammar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schema` to the `EventGrammar` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "spec"."EventGrammar" ADD COLUMN     "instrumentField" TEXT NOT NULL,
ADD COLUMN     "instrumentTypeType" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "schema" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "spec"."InstrumentType" (
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "InstrumentType_pkey" PRIMARY KEY ("type")
);

-- AddForeignKey
ALTER TABLE "spec"."EventGrammar" ADD CONSTRAINT "EventGrammar_instrumentTypeType_fkey" FOREIGN KEY ("instrumentTypeType") REFERENCES "spec"."InstrumentType"("type") ON DELETE RESTRICT ON UPDATE CASCADE;
