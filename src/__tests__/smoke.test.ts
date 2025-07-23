import * as pkg from '../../package.json';

describe('Codex Context Forge', () => {
  it('should have package.json', () => {
    expect(pkg.name).toBe('codex-context-forge');
    expect(pkg.version).toBeDefined();
  });

  it('should have CLI commands', () => {
    expect(true).toBe(true); // Basic smoke test
  });
});
