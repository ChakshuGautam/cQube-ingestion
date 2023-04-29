-- CreateEnum
CREATE TYPE "spec"."EventType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- AlterTable
ALTER TABLE "spec"."EventGrammar" ADD COLUMN     "eventType" "spec"."EventType" NOT NULL DEFAULT 'INTERNAL';
