import * as fs from 'fs';
import * as path from 'path';

function searchCSVFiles(rootDir: string, searchText: string): void {
  // Function to recursively search directories
  function searchDirectories(directory: string): void {
    const files: string[] = fs.readdirSync(directory);

    for (const file of files) {
      const filePath: string = path.join(directory, file);
      const fileStat: fs.Stats = fs.statSync(filePath);

      if (fileStat.isDirectory()) {
        // Recursive call for subdirectories
        searchDirectories(filePath);
      } else if (file.endsWith('.csv')) {
        // Read CSV file and search for the text
        const fileContent: string = fs.readFileSync(filePath, 'utf8');
        if (fileContent.includes(searchText)) {
          console.log('Text found in file:', filePath);
        }
      }
    }
  }

  // Start the search from the root directory
  searchDirectories(rootDir);
}

// Example usage
const rootDirectory: string = 'impl/c-qube/ingest';
const searchText: string = 'latitude';

searchCSVFiles(rootDirectory, searchText);
