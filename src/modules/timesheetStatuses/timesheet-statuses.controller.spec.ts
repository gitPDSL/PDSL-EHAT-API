import { Test, TestingModule } from '@nestjs/testing';
import { TimesheetStatusesController } from './timesheet-statuses.controller';

describe('TimesheetStatusesController', () => {
  let controller: TimesheetStatusesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimesheetStatusesController],
    }).compile();

    controller = module.get<TimesheetStatusesController>(TimesheetStatusesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
