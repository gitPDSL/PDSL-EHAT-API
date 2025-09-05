import { Test, TestingModule } from '@nestjs/testing';
import { ProjectUsersController } from './project-users.controller';

describe('ProjectUsersController', () => {
  let controller: ProjectUsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectUsersController],
    }).compile();

    controller = module.get<ProjectUsersController>(ProjectUsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
