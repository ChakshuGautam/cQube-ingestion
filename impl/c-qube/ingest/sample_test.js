var fs = require('fs');
// Define the test data
var testData = [
    { district: 'New York', value: 10 },
    { district: 'new york', value: 20 },
    { district: 'NEW YORK', value: 30 },
];
// Write the test data to a CSV file
var csvData = testData.map(function (_a) {
    var district = _a.district, value = _a.value;
    return "".concat(district, ",").concat(value);
}).join('\n');
fs.writeFileSync('test_data.csv', csvData);
// Simulate the ingestion process
function simulateDataIngestion() {
    // Read the test data CSV file
    var data = fs.readFileSync('test_data.csv', 'utf8');
    // Split the CSV data into rows
    var rows = data.trim().split('\n');
    var caseSensitiveFKSearch = false;
    var _loop_1 = function (row) {
        var _a = row.split(','), district = _a[0], value = _a[1];
        // Perform FK matching with case sensitivity control
        var matchingDistrict = caseSensitiveFKSearch
            ? testData.find(function (item) { return item.district === district; })
            : testData.find(function (item) { return item.district.toLowerCase() === district.toLowerCase(); });
        if (matchingDistrict) {
            // FK match found, continue with data ingestion
            console.log("Ingesting data: District: ".concat(matchingDistrict.district, ", Value: ").concat(value));
            // Perform data ingestion logic here
        }
        else {
            console.log("Ignoring data: District not found: ".concat(district));
            // Handle FK mismatch or logging logic here
        }
    };
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var row = rows_1[_i];
        _loop_1(row);
    }
}
// Run the data ingestion simulation
simulateDataIngestion();
