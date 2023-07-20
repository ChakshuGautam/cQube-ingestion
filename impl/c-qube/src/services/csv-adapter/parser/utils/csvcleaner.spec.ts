import {
  processCsv,
  removeEmptyLines,
  getFilesInDirectory,
  processSleep,
} from './csvcleaner';
// import * as fs from 'fs';
const fs1 = require('fs');
const readline = require('readline');


// // Define the input and output file paths
// const inputFilePath = 'test-input.csv';
// const outputFilePath = 'test-output.csv';

// // Create a sample input file
// fs1.writeFileSync(inputFilePath, 'Hello, "World"\n');

// // Call the processCsv function and wait for it to complete
// processCsv(inputFilePath, outputFilePath)
//   .then((result) => {
//     console.log('Process completed:', result);

//     // Assert that the output file exists
//     if (fs1.existsSync(outputFilePath)) {
//       console.log('Output file exists.');

//       // Read the contents of the output file and assert its value
//       const outputContent = fs1.readFileSync(outputFilePath, 'utf8');
//       if (outputContent === 'Hello, World\n') {
//         console.log('Output content is correct.');
//       } else {
//         console.log('Output content is incorrect.');
//       }
//     } else {
//       console.log('Output file does not exist.');
//     }

//     // Clean up the files
//     fs1.unlinkSync(inputFilePath);
//     fs1.unlinkSync(outputFilePath);
//   })
//   .catch((error) => {
//     console.error('An error occurred:', error);
//   });

describe('remove empty lines', () => {
  // TODO: Ask what the ReadCSV function does
  test('parse the file fine', async () => {
    const testFilePath = './test/fixtures/test-csvs/csvcleaner/withEmpty.csv';
    const dupFilePath =
      './test/fixtures/test-csvs/csvcleaner/withEmpty.dup.csv';
    const withoutEmptyFilePath =
      './test/fixtures/test-csvs/csvcleaner/withoutEmpty.csv';

    fs1.copyFileSync(testFilePath, dupFilePath);

    await removeEmptyLines(dupFilePath);
    const removedData = fs1.readFileSync(dupFilePath, 'utf-8');
    const withoutData = fs1.readFileSync(withoutEmptyFilePath, 'utf-8');
    expect(removedData).toEqual(withoutData);
    fs1.unlinkSync(dupFilePath);
  });
  test('test get files in directory', async () => {
    const files = await getFilesInDirectory('./test/fixtures/test-csvs');
    expect(files).toEqual([
      'test/fixtures/test-csvs/csvcleaner/withEmpty.csv',
      'test/fixtures/test-csvs/csvcleaner/withoutEmpty.csv',
      'test/fixtures/test-csvs/csvreader/invalid.reader.csv',
      'test/fixtures/test-csvs/csvreader/valid.reader.csv',
      'test/fixtures/test-csvs/event-grammars/test-dimension.grammar.csv',
    ]);
  });
  test('processSleep resolves after the specified time', async () => {
    const startTime = Date.now();
    const sleepTime = 2000; 
    await processSleep(sleepTime);
    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeGreaterThanOrEqual(sleepTime);
  });
});
