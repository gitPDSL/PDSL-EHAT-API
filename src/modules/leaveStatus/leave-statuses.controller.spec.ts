import { Test, TestingModule } from '@nestjs/testing';
import { LeaveStatusesController } from './leave-statuses.controller';

describe('LeaveStatusesController', () => {
  let controller: LeaveStatusesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveStatusesController],
    }).compile();

    controller = module.get<LeaveStatusesController>(LeaveStatusesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
