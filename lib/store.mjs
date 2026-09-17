import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createSeed } from './seed.mjs';

export class JsonStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = null;
    this.queue = Promise.resolve();
  }

  async init({ reset = false } = {}) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    if (!reset) {
      try {
        this.data = JSON.parse(await readFile(this.filePath, 'utf8'));
        return;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    this.data = createSeed();
    await this.persist(this.data);
  }

  snapshot() {
    return structuredClone(this.data);
  }

  async transact(mutator) {
    // `run` carries this call's own outcome (resolves/rejects with the mutator's result).
    // `this.queue` must never reject, or every later transaction would inherit this one's
    // failure forever and the server's write path would be wedged until restart.
    const run = this.queue.then(async () => {
      const draft = structuredClone(this.data);
      const output = await mutator(draft);
      await this.persist(draft);
      this.data = draft;
      return output;
    });
    this.queue = run.then(() => undefined, () => undefined);
    return run;
  }

  async persist(value) {
    const temporary = `${this.filePath}.tmp`;
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await rename(temporary, this.filePath);
  }
}
