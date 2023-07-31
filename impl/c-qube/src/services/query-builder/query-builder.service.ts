import { Injectable } from '@nestjs/common';
import { JSONSchema4 } from 'json-schema';

const fs = require('fs');

type fk = {
  column: string;
  reference: {
    table: string;
    column: string;
  };
};

@Injectable()
export class QueryBuilderService {
  cleanStatement(statement: string): string {
    return (
      statement
        .replace(/^[ ]+|[ ]+$/g, '')
        // Due to BAD data in CSV files, this might fail so commented out
        // .replace(/\s\s+/g, ' ')
        .replace(/\n/g, '')
        .replace(/\(\s+/g, '(')
        .replace(/\,\s+/g, ', ')
        .replace(/\s+\)/g, ')')
    );
  }

  addFKConstraintDuringCreation(
    schema: JSONSchema4,
    createStatement: string,
  ): string {
    createStatement = this.cleanStatement(createStatement);
    const fkStatements = schema.fk.map((fk: fk) => {
      let referenceField = `${fk.reference.table}(name)`;
      if (fk.reference.column) {
        referenceField = `${fk.reference.table}(${fk.reference.column})`;
      }
      return `constraint fk_${fk.column} FOREIGN KEY (${fk.column}) REFERENCES ${referenceField}`; //TODO: Should be the FK
    });
    createStatement = createStatement.replace(');', ',');
    createStatement += fkStatements.join(',\n');
    createStatement += ');';
    return this.cleanStatement(createStatement);
  }

  generateCreateStatement(schema: JSONSchema4, autoPrimaryKey = false): string {
    // console.log('schema: ', schema);
    const tableName = schema.title;
    const psqlSchema = schema.psql_schema;
    const primaryKeySegment = autoPrimaryKey ? '\n id SERIAL PRIMARY KEY,' : '';
    let createStatement = `CREATE TABLE ${psqlSchema}.${tableName} (${primaryKeySegment}\n`;

    const properties = schema.properties;

    const propsForUniqueConstraint = [];
    for (const property in properties) {
      if (['date', 'week', 'year', 'month'].includes(property.trim())) {
        propsForUniqueConstraint.push(property);
      }
      const column: JSONSchema4 = properties[property];
      createStatement += `  ${property} `;
      if (column.type === 'string' && column.format === 'date-time') {
        createStatement += 'TIMESTAMP';
      } else if (column.type === 'string' && column.format === 'date') {
        createStatement += `DATE`;
      } else if (
        column.type === 'number' &&
        (column.format === 'float' || column.format === 'double')
      ) {
        createStatement += 'FLOAT8';
      } else if (column.type === 'integer') {
        createStatement += `integer`;
      } else if (column.type === 'string') {
        createStatement += `VARCHAR`;
      } else {
        console.error('unssuported column.type', column.type);
        // type not supported
      }
      if (column.type === 'string' && column.maxLength) {
        createStatement += `(${column.maxLength})`;
      }
      if (column.type === 'string' && column.unique) {
        createStatement += ` UNIQUE`;
      }
      createStatement += ',\n';
    }

    createStatement = createStatement.slice(0, -2); // remove last comma and newline
    createStatement += '\n);';

    if (schema.fk !== undefined) {
      // console.log('fk constraints called');
      createStatement = this.addFKConstraintDuringCreation(
        schema,
        createStatement,
      );

      // adding unique constraint
      let uniqueStatements = `,\nconstraint unique_${tableName} UNIQUE (`;
      schema.fk.forEach((fk: fk) => {
        uniqueStatements += `${fk.column}, `;
      });
      propsForUniqueConstraint.forEach((prop) => {
        uniqueStatements += `${prop}, `;
      });

      uniqueStatements = uniqueStatements.slice(0, -2) + ')';
      createStatement = createStatement
        .slice(0, -2)
        .concat(uniqueStatements)
        .concat(');');
      console.log('sql:', createStatement);
      // console.log('schema: ', schema);
    }

    // console.log('create statement: ', createStatement);
    return this.cleanStatement(createStatement);
  }

  generateIndexStatement(schema: JSONSchema4): string[] | null {
    const psqlSchema = schema.psql_schema;
    const indexStatements = [];
    if (schema.indexes) {
      const indexes = schema.indexes;

      for (const index of indexes) {
        for (const column of index.columns) {
          const indexName = `${schema.title}_${column.join('_')}_idx`;
          const columns = column.join(', ');
          const statement = `CREATE INDEX ${indexName} ON ${psqlSchema}.${schema.title} (${columns});`;
          indexStatements.push(statement);
        }
      }
    }
    return indexStatements.map((statement) => this.cleanStatement(statement));
  }

  generateInsertStatement(schema: JSONSchema4, data: any): string {
    const tableName = schema.title;
    const psqlSchema = schema.psql_schema;
    const fields = [];
    const values = [];

    const propertiesToSkip = ['id'];

    const properties = schema.properties;
    for (const property in properties) {
      if (propertiesToSkip.includes(property)) continue;
      if (
        schema.properties[property].type === 'string' &&
        schema.properties[property].format === 'date'
      ) {
        values.push(`'${data[property].toISOString()}'`);
      } else {
        values.push(`'${data[property]}'`);
      }
      fields.push(property);
    }

    const query = `INSERT INTO ${psqlSchema}.${tableName} (${fields.join(
      ', ',
    )}) VALUES (${values.join(', ')});`;
    // ON CONFLICT ON CONSTRAINT unique_${tableName} DO UPDATE SET sum=sum+EXCLUDED.sum, count=count+EXCLUDED.count, avg=(sum+EXCLUDED.sum)/(count+EXCLUDED.count);`;
    return this.cleanStatement(query);
  }

  generateBulkInsertStatementOld(schema: JSONSchema4, data: any[]): string {
    const tableName = schema.title;
    const psqlSchema = schema.psql_schema;
    const fields = [];
    const values = [];

    const propertiesToSkip = ['id'];

    const properties = schema.properties;
    for (const property in properties) {
      if (propertiesToSkip.includes(property)) continue;
      fields.push(property);
    }

    for (const row of data) {
      const rowValues = [];
      for (const property in properties) {
        if (propertiesToSkip.includes(property)) continue;
        if (
          schema.properties[property].type === 'string' &&
          schema.properties[property].format === 'date'
        ) {
          rowValues.push(`'${row[property].toISOString()}'`);
        } else {
          rowValues.push(`'${row[property]}'`);
        }
      }
      values.push(`(${rowValues.join(', ')})`);
    }

    const query = `INSERT INTO ${psqlSchema}.${tableName} (${fields.join(
      ', ',
    )}) VALUES ${values.join(', ')};`;
    // console.log('insert statement: ', query);
    return this.cleanStatement(query);
  }

  addOnConflictStatement(tableName: string, query: string): string {
    return query
      .slice(0, -1)
      .concat(
        ` ON CONFLICT ON CONSTRAINT unique_${tableName} DO UPDATE SET sum = datasets.${tableName}.sum + EXCLUDED.sum, count = datasets.${tableName}.count + EXCLUDED.count, avg = (datasets.${tableName}.sum + EXCLUDED.sum) / (datasets.${tableName}.count + EXCLUDED.count); `,
      );
  }

  generateBulkInsertStatement(schema: JSONSchema4, data: any[]): string {
    const tableName = schema.title;
    const psqlSchema = schema.psql_schema;
    const fields = [];
    // const values = [];

    const queries = [];

    const propertiesToSkip = ['id'];

    const properties = schema.properties;
    for (const property in properties) {
      if (propertiesToSkip.includes(property)) continue;
      fields.push(property);
    }

    const tempTableName = `temp_${tableName} `;
    const createTempTable = `CREATE TABLE IF NOT EXISTS ${tempTableName} (LIKE ${psqlSchema}.${tableName}); `;
    queries.push(createTempTable);
    const autoGen = `ALTER TABLE ${tempTableName} ADD COLUMN id SERIAL PRIMARY KEY; `;
    queries.push(autoGen);
    const rows = [];
    let id = 1;
    for (const row of data) {
      const rowValues = [];
      for (const property in properties) {
        // if (propertiesToSkip.includes(property)) continue;
        if (
          schema.properties[property].type === 'string' &&
          schema.properties[property].format === 'date'
        ) {
          rowValues.push(`'${row[property].toISOString()}'`);
        } else {
          rowValues.push(`'${row[property]}'`);
        }
      }
      rowValues.push(id + '');
      id++;
      rows.push(`(${rowValues.join(', ')})`);
    }
    const tempTableFields = [...fields, 'id'];
    const insertTempTable = `INSERT INTO ${tempTableName} (${tempTableFields.join(
      ', ',
    )}) VALUES `;
    const insertTempTableRows = `${insertTempTable}${rows.join(', ')}; `;
    queries.push(this.cleanStatement(insertTempTable));
    let joinStatements = '';
    let whereStatements = '';

    if (schema.fk !== undefined) {
      schema.fk.forEach((fk: fk) => {
        const referenceTable = fk.reference.table;
        const referenceColumn = fk.reference.column;
        const childColumn = fk.column;
        joinStatements += ` LEFT JOIN dimensions.${referenceTable} ON ${tempTableName}.${childColumn} = dimensions.${referenceTable}.${childColumn} `;
        whereStatements += ` AND dimensions.${referenceTable}.${childColumn} IS NOT NULL`;
      });
    }

    const filteredInsert = `INSERT INTO ${psqlSchema}.${tableName} (${fields.join(
      ', ',
    )})
        SELECT ${fields
        .map((field) => `${tempTableName}.${field}`)
        .join(', ')} FROM ${tempTableName}
        ${joinStatements === '' ? ' ' : joinStatements}
        WHERE TRUE${whereStatements === '' ? ' ' : whereStatements} 
        ON CONFLICT ON CONSTRAINT unique_${tableName} DO UPDATE SET sum = ${psqlSchema}.${tableName}.sum + EXCLUDED.sum, count = ${psqlSchema}.${tableName}.count + EXCLUDED.count, avg = (${psqlSchema}.${tableName}.sum + EXCLUDED.sum) / (${psqlSchema}.${tableName}.count + EXCLUDED.count);`;

    queries.push(filteredInsert);

    const dropTempTable = `DROP TABLE ${tempTableName}; `;
    queries.push(dropTempTable);
    const query = `${createTempTable} \n${insertTempTableRows} \n${filteredInsert} \n${dropTempTable} `;
    // const query = `${ createTempTable } \n${ insertTempTableRows } \n${ filteredInsert } `;
    // if (query.toLowerCase().includes('null')) {
    //   console.log('NULL Query: ', query);
    // }
    // return queries.map((q) => this.cleanStatement(q)); // this.cleanStatement(query);
    // console.log('query: ', query);
    return this.cleanStatement(query);
  }

  generateUpdateStatement(
    schema: JSONSchema4,
    data: any,
    where: string,
  ): string {
    // throw new Error('Method not implemented.');
    return `UPDATE ${schema.schema.psql_schema}.${schema.tableName} 
SET sum = sum + ${data.sum},
    count = count + ${data.count - 2 * data.negcount},
    avg = (sum + ${data.sum}) /(count+${data.count - 2 * data.negcount})
WHERE ${where} `;
  }
}
