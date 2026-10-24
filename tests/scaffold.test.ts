import { SIM_VERSION } from '../src/sim';

test('sim module loads headless', () => {
  expect(SIM_VERSION).toBe(1);
});
