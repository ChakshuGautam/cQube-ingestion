const fs = require('fs');

export const getDataDifference = (
  prevFilePath: string,
  newFilePath: string,
) => {
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
    console.log('oldContent: ', oldContent);
    console.log('toBeDeleted: ', toBeDeleted);
    console.log('newContent: ', newContent);

    toBeInserted.push(...newContent);

    return { toBeDeleted, toBeInserted };
  }
};
