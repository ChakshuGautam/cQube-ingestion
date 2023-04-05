/*
  Warnings:

  - You are about to drop the column `instrumentTypeType` on the `EventGrammar` table. All the data in the column will be lost.
  - Added the required column `instrumentType` to the `EventGrammar` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "spec"."EventGrammar" DROP CONSTRAINT "EventGrammar_instrumentTypeType_fkey";

-- AlterTable
ALTER TABLE "spec"."EventGrammar" DROP COLUMN "instrumentTypeType",
ADD COLUMN     "instrumentType" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "spec"."EventGrammar" ADD CONSTRAINT "EventGrammar_instrumentType_fkey" FOREIGN KEY ("instrumentType") REFERENCES "spec"."InstrumentType"("type") ON DELETE RESTRICT ON UPDATE CASCADE;
