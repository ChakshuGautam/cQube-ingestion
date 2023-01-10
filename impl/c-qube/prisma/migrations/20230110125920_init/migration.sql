-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "datasets";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "dimensions";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "spec";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "transformers";

-- CreateTable
CREATE TABLE "spec"."DimensionGrammar" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DimensionGrammar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spec"."DatasetGrammar" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatasetGrammar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spec"."EventGrammar" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EventGrammar_pkey" PRIMARY KEY ("id")
);
