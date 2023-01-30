## Query Builder

Builds SQL queries from a JSON Schema object.

```js
const schema = {
  title: 'my_table',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string', maxLength: 255, unique: true },
    date_created: { type: 'string', format: 'date-time' },
  },
  indexes: [
    { columns: [['name', 'date_created']] },
    { columns: [['name'], ['date_created']] },
  ],
  fk: [
    {
      column: 'id',
      reference: {
        table: 'other_table',
        column: 'id',
      },
    },
  ],
};
const qb = new QueryBuilderService();
const query = qb.generateCreateStatement(schema);
const query = qb.generateIndexStatement(schema);
```

### Developer Workflow

Run tests on a watch mode

```bash
$ yarn run test:watch
```

### TODO

- [ ] Add tests for `fk` and `indexes` generation
