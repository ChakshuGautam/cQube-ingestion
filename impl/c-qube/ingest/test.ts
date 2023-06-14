import * as fs from 'fs';
import { mergeConfigs, GlobalConfig, ProgramConfig } from './configMerge'; 

const configJson = fs.readFileSync('config.json', 'utf-8');

const configData = JSON.parse(configJson);

const globalConfig: GlobalConfig = configData;
const programConfigs: ProgramConfig[] = configData.programs;

const mergedConfig: GlobalConfig = mergeConfigs(globalConfig, programConfigs);

console.log('Global Config:', globalConfig);
console.log('Program Configs:', programConfigs);
console.log('Merged Config:', mergedConfig);
