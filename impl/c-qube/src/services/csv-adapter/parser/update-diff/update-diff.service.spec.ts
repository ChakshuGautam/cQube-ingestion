import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../../../app.controller';
import { AppService } from '../../../../app.service';

import { DifferenceGeneratorService } from './update-diff.service';

describe('tests the file diff generator', () => {
  let appController: AppController;
  let differenceGeneratorService: DifferenceGeneratorService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, DifferenceGeneratorService],
    }).compile();

    appController = app.get<AppController>(AppController);
    differenceGeneratorService = app.get<DifferenceGeneratorService>(
      DifferenceGeneratorService,
    );
  });

  it('should be defined', () => {
    expect(differenceGeneratorService).toBeDefined();
  });

  /*it('should generate two arrays', async () => {
    const oldFilePath = './ingest/programs/diksha/avgplaytime-event.data.csv';
    const newFilePath =
      './test/fixtures/test-csvs/update-diff/avgplaytime-update.data.csv';
    const grammarFilePath =
      './ingest/programs/diksha/avgplaytime-event.grammar.csv';
    const { filePath, finalContent } =
      await differenceGeneratorService.getDataDifference(
        oldFilePath,
        newFilePath,
        grammarFilePath,
        './test/fixtures/test-csvs/update-diff',
      );
    console.log(finalContent);
    expect(finalContent).toBeDefined(); //
    const res = [
      'state_id,grade_diksha,subject_diksha,avg_play_time_in_mins_on_app_and_portal',
      '12,Class 8,History,3.24',
      '12,Class 8,History,-1.68',
    ];
    expect(finalContent).toEqual(res);
  });*/
});