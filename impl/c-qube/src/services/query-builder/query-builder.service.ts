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
    const tableName = schema.title;
    const psqlSchema = schema.psql_schema;
    const primaryKeySegment = autoPrimaryKey ? '\n id SERIAL PRIMARY KEY,' : '';
    let createStatement = `CREATE TABLE ${psqlSchema}.${tableName} (${primaryKeySegment}\n`;

    const properties = schema.properties;
    for (const property in properties) {
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
      createStatement = this.addFKConstraintDuringCreation(
        schema,
        createStatement,
      );
    }
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
    return this.cleanStatement(query);
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

    const tempTableName = `temp_${tableName}`;
    const createTempTable = `CREATE TABLE IF NOT EXISTS ${tempTableName} (LIKE ${psqlSchema}.${tableName});`;
    queries.push(createTempTable);
    const autoGen = `ALTER TABLE ${tempTableName} ADD COLUMN id SERIAL PRIMARY KEY;`;
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
    const insertTempTableRows = `${insertTempTable}${rows.join(', ')};`;
    queries.push(this.cleanStatement(insertTempTable));
    let joinStatements = '';
    let whereStatements = '';

    if (schema.fk !== undefined) {
      schema.fk.forEach((fk: fk) => {
        const referenceTable = fk.reference.table;
        const referenceColumn = fk.reference.column;
        const childColumn = fk.column;
        joinStatements += ` LEFT JOIN dimensions.${referenceTable} ON ${tempTableName}.${childColumn} = dimensions.${referenceTable}.${childColumn}`;
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
        WHERE TRUE${whereStatements === '' ? ' ' : whereStatements};`;

    queries.push(filteredInsert);

    const dropTempTable = `DROP TABLE ${tempTableName};`;
    queries.push(dropTempTable);
    const query = `${createTempTable}\n${insertTempTableRows}\n${filteredInsert}\n${dropTempTable}`;
    // const query = `${createTempTable}\n${insertTempTableRows}\n${filteredInsert}`;
    // if (query.toLowerCase().includes('null')) {
    //   console.log('NULL Query: ', query);
    // }
    // return queries.map((q) => this.cleanStatement(q)); // this.cleanStatement(query);
    // console.log('query: ', query);
    return this.cleanStatement(query);
  }

  generateUpdateStatement(schema: JSONSchema4, data: any): string[] {
    throw new Error('Method not implemented.');
  }
}
