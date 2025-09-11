import { Test, TestingModule } from '@nestjs/testing';
import { ProjectStatusService } from './project-status.service';

describe('ProjectStatusService', () => {
  let service: ProjectStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectStatusService],
    }).compile();

    service = module.get<ProjectStatusService>(ProjectStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
