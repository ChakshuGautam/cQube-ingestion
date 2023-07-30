import { readCSVFile } from '../utils/csvreader';
const fs = require('fs');

export class DifferenceGeneratorService {
  async getDataDifference(
    prevFilePath: string,
    newFilePath: string,
    grammarFilePath?: string,
    updateFileLocation?: string,
    updatedFileType?: string,
  ) {
    // check if old path exists, in case it does not it is first update just return new file content
    if (!fs.existsSync(prevFilePath)) {
      const finalContent = fs
        .readFileSync(newFilePath, 'utf-8')
        .split('\n')
        .map((row: string) => row.trim())
        .filter((row: string) => row !== '');

      fs.writeFileSync(prevFilePath, finalContent.join('\n'));
      return {
        filePath: newFilePath,
        finalContent,
      };
    }
    // TODO: Move to readCSV util fn
    const oldContent: string[] = fs
      .readFileSync(prevFilePath, 'utf-8')
      .split('\n')
      .map((row: string) => row.trim())
      .filter((row: string) => row !== '');

    const newContent: string[] = fs
      .readFileSync(newFilePath, 'utf-8')
      .split('\n')
      .map((row: string) => row.trim())
      .filter((row: string) => row !== '');

    const toBeDeleted: string[] = [];
    const toBeInserted: string[] = [];

    // checking if the header is same
    if (oldContent[0] === newContent[0]) {
      // finding the diff between these two like git
      oldContent.forEach((row: string) => {
        // find this row in the new file and if not found add to toBeDeleted
        const idx = newContent.indexOf(row);
        if (idx > -1) {
          newContent.splice(idx, 1);
        } else {
          toBeDeleted.push(row);
        }
      });

      toBeInserted.push(...newContent);

      // create updated CSV to ingest

      // find out metric from grammar
      const metricIdxs = [];
      if (grammarFilePath) {
        const grammarContent: string[] = await readCSVFile(grammarFilePath);
        console.log('grammarContent: ', grammarContent);
        const lastRow = grammarContent[4].split(',');
        // console.log('lastROw: ', lastRow);
        lastRow.forEach((cell: string, idx: number) => {
          if (cell.trim() === 'metric') metricIdxs.push(idx);
        });
      }
      // console.log(metricIdxs);
      const splitRows = toBeDeleted.map((row: string) => row.split(','));
      const finalContent = [oldContent[0], ...toBeInserted]; // TODO: add header row here
      splitRows.forEach((row: string[], idx: number) => {
        const newRow = [];
        row.forEach((item: string, rowIdx: number) => {
          if (metricIdxs.includes(rowIdx)) {
            newRow.push('-' + item);
          } else {
            newRow.push(item);
          }
        });
        finalContent.push(newRow.join(','));
      });

      // write to file
      const fileName =
        newFilePath.split('/').pop()?.split('.').slice(0, -2).join('.') +
        `.${updatedFileType ?? 'delta'}.csv`;
      const filePath = updateFileLocation;
      //   ? updateFileLocation + '/' + fileName
      // : fileName;

      // fs.writeFileSync(prevFilePath, finalContent.join('\n'));
      return { filePath, finalContent };
    }
  }

  async combineDeltaFiles(
    folderPath: string,
    header: string,
    ingestFolderPath: string,
    grammarFilePath?: string,
  ) {
    const deltaFileNameRegex = /\-event\.data\.\d+\.csv$/i;
    const dataFileNameRegex = /\-event\.data\.csv$/i;
    const checklistFilePath = folderPath + '/checkpoint.csv';
    const checkPointExists = fs.existsSync(checklistFilePath);
    const checkedFiles = [];
    let dataFileName: string;
    let checkPointData: string[];

    if (checkPointExists) {
      checkPointData = fs.readFileSync(checklistFilePath, 'utf-8').split('\n');

      checkedFiles.push(
        ...checkPointData[1]
          .split(',')
          .pop()
          .split('|')
          .map((file: string) => file.trim()),
        ingestFolderPath,
      );
    }

    console.log('checked files: ', checkedFiles);

    let filenames: string[];
    let isDataFilePresent = false;
    try {
      filenames = fs.readdirSync(folderPath);
      isDataFilePresent = filenames.some((filename: string) => {
        if (dataFileNameRegex.test(filename)) {
          dataFileName = filename;
          return true;
        }
      });
      filenames = filenames.filter((filename) => {
        if (isDataFilePresent) {
          return (
            deltaFileNameRegex.test(filename) &&
            !checkedFiles.includes(filename)
          );
        } else return deltaFileNameRegex.test(filename);
      });
    } catch (err) {
      console.error('Error reading directory:', err);
      throw new Error('Error reading directory');
    }

    if (!filenames || !filenames.length) {
      throw new Error('No updates found');
    }

    // we are assuming that each row of csv has unique combination of dimensions and timeDimensions
    // const oldData = {};
    const finalData = {};

    if (dataFileName) {
      filenames.unshift(dataFileName);
    }
    console.log('filenames: ', filenames);

    filenames.forEach((filename: string, idx: number) => {
      const fileData = fs
        .readFileSync(folderPath + '/' + filename, 'utf-8')
        .split('\n')
        .map((row: string) => {
          return row
            .split(',')
            .map((item: string) => item.trim())
            .join(',');
        })
        .filter((item: string) => item !== '');

      if (fileData[0] !== header) {
        console.error(`Header mismatch in file ${filename}`);
      }

      console.log('fileData: ', fileData);
      // TODO: use grammar file path to figure out the metric location
      fileData.forEach((row: string) => {
        const key = row.split(',').slice(0, -1).join(',');
        console.log('split: ', row.split(','));
        console.log('slice: ', row.split(',').slice(0, -1));
        console.log('key: ', key);
        finalData[key] = row.split(',').pop();
        // if (idx === 0) oldData[key] = row.split(',').pop();
      });

      console.log('finalData: ', finalData);
    });

    const combinedData = Object.keys(finalData).map((key: string) => {
      return key + ',' + finalData[key];
    });

    // create update file to get delta
    const updateFilePath =
      folderPath + '/' + filenames[0].split('.')[0].concat('.update.csv');
    fs.writeFileSync(updateFilePath, combinedData.join('\n'), 'utf-8');

    // get the delta

    const { finalContent } = await this.getDataDifference(
      folderPath + '/' + filenames[0],
      updateFilePath,
      grammarFilePath
        ? grammarFilePath
        : folderPath + '/' + filenames[0].split('.')[0].concat('.grammar.csv'),
    );

    // write the delta to ingest folder
    const ingestFilePath =
      ingestFolderPath + '/' + filenames[0].split('.')[0].concat('.data.csv');
    console.log('outputFilePath: ', ingestFilePath);
    // write to file
    if (dataFileName) {
      fs.writeFileSync(ingestFilePath, finalContent.join('\n'), 'utf-8');
    } else {
      fs.writeFileSync(ingestFilePath, combinedData.join('\n'), 'utf-8');
    }

    // update the table snapshot in this minio table for future comparrisons since we are only storing delta in the ingest table (UP-DOWN counter file)
    const folderDataFilePath =
      folderPath + '/' + filenames[0].split('.')[0].concat('.data.csv');
    await fs.rename(updateFilePath, folderDataFilePath, (err) => {
      if (err) {
        console.error('Error renaming the file:', err);
      } else {
        console.log('File renamed successfully.');
      }
    });

    // update checklist
    // check if checklist.csv exists
    // if not create one
    // if yes, update it
    const newCheckPointRow = `${Date.now()},${[
      ...checkedFiles,
      ...filenames,
    ].join('|')}`;

    if (checkPointExists) {
      console.log('checkPointData: ', checkPointData);
      // checkPointData.push(newCheckPointRow);
      fs.writeFileSync(
        checklistFilePath,
        [checkPointData[0], newCheckPointRow, ...checkPointData.slice(1)].join(
          '\n',
        ),
        'utf-8',
      );
    } else {
      const checkListRows = ['timestamp,filenames', newCheckPointRow];

      fs.writeFileSync(checklistFilePath, checkListRows.join('\n'), 'utf-8');
    }

    return ingestFilePath;
  }
}
