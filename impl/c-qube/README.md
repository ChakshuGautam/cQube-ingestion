## cQube Implemenation

cQube implemenation is a proof of concept for the cQube project. It is a NodeJS application that uses [Prisma](https://www.prisma.io/) as the ORM and [NestJS](https://nestjs.com/) as the framework. It serves as a tech bed for newer and more advanced features of cQube.

### Installation

```bash
$ yarn install
```

### Running the app

```bash
# development
$ yarn run start
```

### Test

```bash
# watch tests
$ yarn run test:watch
```

## Pending Items

- [ ] Update implementation of Database and Model Management to [Prisma Schema DSL](https://github.com/amplication/prisma-schema-dsl)
- [ ] Creating auto SDKs for the Datasets, Dimensions, KPIs and Transformers.
- [ ] Publish the SDKs to NPM automatically with every commit.
