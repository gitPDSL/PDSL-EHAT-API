import { Test, TestingModule } from '@nestjs/testing';
import { TimesheetStatusService } from './timesheet-status.service';

describe('TimesheetStatusService', () => {
  let service: TimesheetStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimesheetStatusService],
    }).compile();

    service = module.get<TimesheetStatusService>(TimesheetStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
