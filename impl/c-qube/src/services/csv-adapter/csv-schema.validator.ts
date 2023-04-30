import * as z from 'zod';
import { readFileSync } from 'fs';

const threeRowSchema = z.object({
  key0: z.string(),
  key1: z.string(),
  key2: z.string(),
});

const fiveRowSchema = z.object({
  key0: z.string(),
  key1: z.string(),
  key2: z.string(),
  key3: z.string(),
  key4: z.string(),
});

/*
const doSomeWork = (filePath: string) => {
  const csvData = readFileSync(filePath, 'utf-8');
  console.log('csvData\n', csvData);

  let rows = csvData.split('\r\n');
  console.log('rows: ', rows);

  const columns = rows[0].split(',');
  rows = rows.slice(1);

  const dataToValidate = [];

  rows.forEach((row) => {
    const vals = row.split(',');
    const rowObj = {};
    for (let i = 0; i < vals.length; i++) {
      rowObj[columns[i]] = vals[i];
    }
    dataToValidate.push(rowObj);
  });

  dataToValidate.forEach((rowObj) => {
    try {
      sampleSchema.parse(rowObj);
      console.log(`successfully validated: ${JSON.stringify(rowObj)}`);
    } catch (e) {
      console.error(
        `Error validating row: ${JSON.stringify(rowObj)}. Error: ${e.message}`,
      );
    }
  });

  // parse(csvData, { delimiter: ',' }, (err: any, data: any[]) => {
  //   if (err) {
  //     console.error('err: ', err);
  //   } else {
  //     const validateThisData = [];
  //     // console.log(data);
  //     const cols = data[0];
  //     data = data.slice(1);
  //     data.forEach((row: string[]) => {
  //       const rowObj = {};
  //       for (let i = 0; i < row.length; i++) {
  //         rowObj[cols[i]] = row[i];
  //       }
  //       validateThisData.push(rowObj);
  //     });

  //     validateThisData.forEach((rowObj) => {
  //       try {
  //         sampleSchema.parse(rowObj);
  //         console.log(`successfully validated: ${JSON.stringify(rowObj)}`);
  //       } catch (e) {
  //         console.error(
  //           `Error validating row: ${JSON.stringify(rowObj)}. Error: ${e.message
  //           }`,
  //         );
  //       }
  //     });
  //   }
  // });
};

doSomeWork('./sample_csv.csv');
const doMyWork = async (filePath: string) => {
  let isFirstRow = true;
  let cols = [];
  const toValidate = [];

  createReadStream(filePath)
    .pipe(parse({ delimiter: ',' }))
    .on('data', (row: string[]) => {
      if (isFirstRow) {
        cols = row;
        isFirstRow = false;
      } else {
        const rowObj = {};
        for (let i = 0; i < row.length; i++) {
          rowObj[cols[i]] = row[i];
        }
        toValidate.push(rowObj);
      }
    })
    .on('end', () => {
      console.log('ONTO VALIDATION');
      toValidate.forEach((rowObj) => {
        try {
          sampleSchema.parse(rowObj);
          console.log(`successfully validated: ${JSON.stringify(rowObj)}`);
        } catch (e) {
          console.error(
            `Error validating row: ${JSON.stringify(rowObj)}. Error: ${e.message
            }`,
          );
        }
      });
    });
};

doMyWork('./sample_csv.csv');
*/

const mapper = (filePath: string, numRows: number) => {
  // read the file as a string
  const csvData = readFileSync(filePath, 'utf-8');
  console.log('csvData\n', csvData);

  // split into rows
  const rows = csvData.split('\n');
  console.log('rows: ', rows);

  // generate matrix with each cell as an individual string
  const matrix = [];

  rows.forEach((row) => {
    matrix.push(row.split(','));
  });

  console.log('matrix: ', matrix);
  // transpose the matrix
  const transpose = matrix[0].map((col, c) =>
    matrix.map((row, r) => matrix[r][c]),
  );

  console.log('transpose: ', transpose);

  // reverse the transpose (because bottomUp) ==> this can be passed as a flag and hence skipped
  const finalMatrix = transpose.map((row: string[]) => row.reverse());
  console.log('finalMatrix: ', finalMatrix);

  // mapping to objects
  const mappedObjectList = [];
  finalMatrix.forEach((row: string[]) => {
    const mappedObj = {};
    for (let i = 0; i < numRows; i++) {
      mappedObj[`key${i}`] = row[i];
    }
    mappedObjectList.push(mappedObj);
  });
  console.log('mappedObjectList: ', mappedObjectList);

  // validation
  mappedObjectList.forEach((obj) => {
    try {
      numRows === 3 ? threeRowSchema.parse(obj) : fiveRowSchema.parse(obj);
      console.log(`successfully validated: ${JSON.stringify(obj)}`);
    } catch (e) {
      console.error(
        `Error validating row: ${JSON.stringify(obj)}. Error: ${e.message}`,
      );
    }
  });
};

mapper('./sample_csv.csv', 3);
mapper('./sample.csv', 5);
