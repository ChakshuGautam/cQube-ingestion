"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var csv_writer_1 = require("csv-writer");
var fs = require("fs");
// Function to read the config.json file and extract the quoteChar parameter
function getQuoteCharFromConfig() {
    var _a;
    try {
        var configFile = fs.readFileSync('config.json', 'utf8');
        var config = JSON.parse(configFile);
        var quoteChar_1 = (_a = config.globals) === null || _a === void 0 ? void 0 : _a.quoteChar;
        return quoteChar_1;
    }
    catch (error) {
        console.error('Error reading config.json:', error.message);
        return undefined;
    }
}
// Function to run the ingestion process with the extracted quoteChar parameter
// Function to run the ingestion process with the extracted quoteChar parameter and sample data
function runIngestionProcess(quoteChar) {
    // Sample data
    var sampleData = [
        {
            state: 'value1',
            grade: 'value2',
            subject: 'value3',
            medium: 'value4',
            board: 'value5'
        },
        {
            state: 'value6',
            grade: 'value7',
            subject: 'value8',
            medium: 'value9',
            board: 'value10'
        }
    ];
    // Process the sample data with the quoteChar parameter
    if (quoteChar) {
        // Apply the quoteChar to each field in the sample data
        var processedData = sampleData.map(function (row) {
            var processedRow = {};
            for (var field in row) {
                processedRow[field] = "".concat(quoteChar).concat(row[field]).concat(quoteChar);
            }
            return processedRow;
        });
        // Perform the ingestion process with the processed data
        console.log('Running ingestion process with quoteChar:', quoteChar);
        console.log('Processed data:', processedData);
        // Example ingestion logic: Print each processed row
        processedData.forEach(function (row) {
            console.log('Ingesting data:', row);
            // TODO: Replace with your actual ingestion logic here
        });
        var outputPath_1 = './output/processed_data.csv';
        var csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: outputPath_1,
            header: Object.keys(processedData[0])
        });
        csvWriter.writeRecords(processedData)
            .then(function () { return console.log("Processed data saved to ".concat(outputPath_1, ".")); })
            .catch(function (err) { return console.error('Error saving processed data:', err); });
    }
    else {
        console.log('Error: quoteChar parameter not found in the configuration file.');
    }
}
// Rest of the script...
// Entry point
var quoteChar = getQuoteCharFromConfig();
runIngestionProcess(quoteChar);
