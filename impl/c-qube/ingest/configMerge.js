"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeConfigs = void 0;
var fs = require("fs");
function mergeConfigs(globalConfig, programConfigs) {
    var mergedConfig = __assign(__assign({}, globalConfig), { programs: [] });
    for (var _i = 0, programConfigs_1 = programConfigs; _i < programConfigs_1.length; _i++) {
        var programConfig = programConfigs_1[_i];
        var mergedProgramConfig = __assign(__assign({}, programConfig), { dimensions: __assign(__assign({}, globalConfig.dimensions), programConfig.dimensions), './output': {
                location: programConfig['./output'].location,
            } });
        mergedConfig.programs.push(mergedProgramConfig);
    }
    return mergedConfig;
}
exports.mergeConfigs = mergeConfigs;
// Step 1: Read the global configuration
var globalConfig = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
// Step 2: Read the program-specific configurations
var programConfigs = globalConfig.programs;
// Step 3: Merge the program-specific configurations into the global configuration, with program-specific values overriding the global values
var mergedConfig = mergeConfigs(globalConfig, programConfigs);
// Step 4: Use the merged configuration throughout the program
console.log(mergedConfig);
