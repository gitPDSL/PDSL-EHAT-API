import { Test, TestingModule } from '@nestjs/testing';
import { ProjectStatusesController } from './project-statuses.controller';

describe('ProjectStatusesController', () => {
  let controller: ProjectStatusesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectStatusesController],
    }).compile();

    controller = module.get<ProjectStatusesController>(ProjectStatusesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
