import { Test, TestingModule } from '@nestjs/testing';
import { LeaveStatusService } from './leave-status.service';

describe('LeaveStatusService', () => {
  let service: LeaveStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeaveStatusService],
    }).compile();

    service = module.get<LeaveStatusService>(LeaveStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
