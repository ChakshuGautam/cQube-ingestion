import * as fs from 'fs';

export interface GlobalConfig {
  globals: {
    onlyCreateWhitelisted: boolean;
  };
  dimensions: {
    namespace: string;
    fileNameFormat: string;
    input: {
      files: string;
    };
  };
  programs: ProgramConfig[];
}

export interface ProgramConfig {
  name: string;
  namespace: string;
  description: string;
  shouldIngestToDB: boolean;
  input: {
    files: string;
  };
  './output': {
    location: string;
  };
  dimensions: {
    whitelisted: string[];
    blacklisted: string[];
  };
}

export function mergeConfigs(globalConfig: GlobalConfig, programConfigs: ProgramConfig[]): GlobalConfig {
  const mergedConfig: GlobalConfig = {
    ...globalConfig,
    programs: [],
  };

  for (const programConfig of programConfigs) {
    const mergedProgramConfig: ProgramConfig = {
      ...programConfig,
      dimensions: {
        ...globalConfig.dimensions,
        ...programConfig.dimensions,
      },
      './output': {
        location: programConfig['./output'].location,
      },
    };

    mergedConfig.programs.push(mergedProgramConfig);
  }

  return mergedConfig;
}

const globalConfig: GlobalConfig = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

const programConfigs: ProgramConfig[] = globalConfig.programs;

const mergedConfig: GlobalConfig = mergeConfigs(globalConfig, programConfigs);

console.log(mergedConfig);
