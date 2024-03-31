import { Test, TestingModule } from "@nestjs/testing";
import { AppService } from "./app.service";

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
});