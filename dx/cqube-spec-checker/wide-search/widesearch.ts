"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var csv = require("csv-parser");

function searchCSVFiles(rootDir, searchText) {
  // Function to recursively search directories
  function searchDirectories(directory) {
    var files = fs.readdirSync(directory);
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
      var file = files_1[_i];
      var filePath = path.join(directory, file);
      var fileStat = fs.statSync(filePath);
      if (fileStat.isDirectory()) {
        // Recursive call for subdirectories
        searchDirectories(filePath);
      } else if (file.endsWith('.csv')) {
        // Read CSV file and search for the text
        var fileContent = fs.readFileSync(filePath, 'utf8');
        if (fileContent.includes(searchText)) {
          console.log('Text found in file:', filePath);

          // Manipulate the CSV file
          manipulateCSV(filePath);
        }
      }
    }
  }

  // Start the search from the root directory
  searchDirectories(rootDir);
}

function manipulateCSV(filePath) {
  var rows = [];

  // Read the CSV file and collect the rows
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', function (row) {
      rows.push(row);
    })
    .on('end', function () {
      // Manipulate the rows
      rows.forEach(function (row) {
        // Manipulate the row data as needed
        row['column_name'] = 'new_value';
      });

      // Write the manipulated rows back to the CSV file
      var fileContent = rows.map(function (row) {
        return Object.values(row).join(',');
      }).join('\n');

      fs.writeFileSync(filePath, fileContent, 'utf8');

      console.log('CSV file manipulated:', filePath);
    });
}

// Example usage
var rootDirectory = '/home/tahseer/Desktop/cQubeIngestion/cQube-ingestion/impl/c-qube/ingest/dimensions';
var searchText = 'latitude';
searchCSVFiles(rootDirectory, searchText);
