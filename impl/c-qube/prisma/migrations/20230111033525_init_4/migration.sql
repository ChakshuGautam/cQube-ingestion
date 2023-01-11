-- AlterTable
ALTER TABLE "spec"."DatasetGrammar" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "spec"."DimensionGrammar" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "spec"."EventGrammar" ALTER COLUMN "description" DROP NOT NULL;
