"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var configMerge_1 = require("./configMerge"); // Assuming the configuration merge functions and types are exported from 'configMerge.ts'
// Step 1: Read the content of the 'config.json' file
var configJson = fs.readFileSync('config.json', 'utf-8');
// Step 2: Parse the JSON content into an object
var configData = JSON.parse(configJson);
// Step 3: Extract the global config and program configs from the parsed data
var globalConfig = configData;
var programConfigs = configData.programs;
// Step 4: Merge the configurations
var mergedConfig = (0, configMerge_1.mergeConfigs)(globalConfig, programConfigs);
// Test case to check if the program-specific configurations are overridden
console.log('Global Config:', globalConfig);
console.log('Program Configs:', programConfigs);
console.log('Merged Config:', mergedConfig);
