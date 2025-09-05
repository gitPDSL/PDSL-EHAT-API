import { ValidUserMiddleware } from './valid-user.middleware';

describe('ValidUserMiddleware', () => {
  it('should be defined', () => {
    expect(new ValidUserMiddleware()).toBeDefined();
  });
});
