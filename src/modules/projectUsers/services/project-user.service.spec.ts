import { Test, TestingModule } from '@nestjs/testing';
import { ProjectUserService } from './project-user.service';

describe('ProjectUserService', () => {
  let service: ProjectUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectUserService],
    }).compile();

    service = module.get<ProjectUserService>(ProjectUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
