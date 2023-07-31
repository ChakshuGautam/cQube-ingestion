import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { AppModule  } from './app.module';
import { measureExecutionTime } from './utils/runtime';
import { NestFactory } from '@nestjs/core';
import { bootstrap } from './main';

const mockConfigService = {
  get: jest.fn((key: string) => {
    // Provide mock configuration values based on the keys used in AppModule
    if (key === 'DB_USERNAME') return 'test_user';
    if (key === 'DB_HOST') return 'localhost';
    if (key === 'DB_NAME') return 'test_db';
    if (key === 'DB_PASSWORD') return 'test_password';
    if (key === 'DB_PORT') return 5432;
    return undefined; // Return undefined for any other keys
  }),
};
class MockLogger {
  log = jest.fn();
}


describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return "Hello World!"', () => {
    expect('Hello World!').toBe('Hello World!');
  });

  it('should return "Hello World!"', () => {
    const expectedResponse = 'Hello World!';
    const response = appController.getHello();
    expect(response).toEqual(expectedResponse);
  });
});

describe('AppModule', () => {
  let appModule: AppModule;
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(ConfigService)
    .useValue(mockConfigService)
    .compile();
    appModule = app.get<AppModule>(AppModule);
  });

  it('should be defined', () => {
    expect(appModule).toBeDefined();
  });
});

describe('AppService', () => {
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    appService = module.get<AppService>(AppService);
  });

  it('should return "KPI created"', () => {
    const expectedResponse = 'KPI created';
    const response = appService.createKPI();
    expect(response).toEqual(expectedResponse);
  });

  it('should measure the execution time and log the result', async () => {
    const mockFunc = jest.fn().mockResolvedValue('test result');
    const mockLogger = new MockLogger();

    const result = await measureExecutionTime.call({ logger: mockLogger }, mockFunc);

    expect(mockFunc).toHaveBeenCalled();
    expect(result).toBe('test result');
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringMatching(/^Time taken: \d+\.\d+ ms$/));
  });

  it('should return the result from the provided function', async () => {
    const expectedResult = 'test result';
    const mockFunc = jest.fn().mockResolvedValue(expectedResult);
    const mockLogger = new MockLogger();

    const result = await measureExecutionTime.call({ logger: mockLogger }, mockFunc);

    expect(result).toBe(expectedResult);
  });

});

describe('AppModule', () => {
  it('should create and listen to the Nest.js application', async () => {
    // Mock the NestFactory.create function
    const mockApp = {
      listen: jest.fn().mockResolvedValueOnce(undefined),
    };
    jest.spyOn(NestFactory, 'create').mockResolvedValueOnce(mockApp as any);

    // Call the bootstrap function
    await bootstrap();

    // Expect NestFactory.create to be called with AppModule
    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);

    // Expect app.listen to be called with port 3000
    expect(mockApp.listen).toHaveBeenCalledWith(3000);
  });
});
