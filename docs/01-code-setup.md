# Procedure for Code Setup and Installation

## Pull the code

Clone the Github repository to your local filesystem

```bash
git clone https://github.com/ChakshuGautam/cQube-ingestion.git
```

## Start Docker Instances

Change your current directory to the cloned repository

```bash
cd cQube-ingestion
```

Start the Docker Network and the Instances

```bash
docker-compose up -d
```

This creates the `cqube-pocs` network and instances of `timescaledb`, `graphql-engine` and `pgbool` images.

## Install dependencies

Once this is done change your current directory to `impl/c-qube`

```bash
cd impl/c-qube
```

Create the environment (`.env`) file for connecting to the `timescaledb` docker instance.

```bash
touch .env
echo "DATABASE_URL"="postgres://timescaledb:postgrespassword@localhost:8001/postgres?sslmode=disable" > .env
```

Install all the necessary `yarn` dependencies (while staying within the `impl/c-qube` folder)

```bash
yarn install
```

You can use the build command in case you would like to build the Nest project.

```bash
yarn build
```
You can use the command cli to run the ingestion process

```bash
yarn cli ingest
```  
After the process have been completed, you should have completed all the following steps \

✅ 1. The Data has been Nuked 

✅ 2. Config parsing completed 

✅ 3. Dimensions have been ingested

✅ 4. Event Grammars have been ingested

✅ 5. Dataset Grammars have been ingested
## Run Migrations and Set Up Database Schemas

Now that we have our yarn dependencies installed we can go ahead and run migrations to migrate our schemas to our locally running docker database instance (while staying within the `impl/c-qube` folder).

```bash
npx prisma migrate dev
```
and to generate Prisma Client, you can run the following command:
```bash
npx prisma generate
```
## Testing and Coverage

Tests can be run in order to check for breaking or unintentional changes in the code by running the following command.

```bash
yarn test
```

Similarly the developer can also test the percentage of code coverage that the current testing suite provides via the following command.

```bash
yarn test:cov
```
