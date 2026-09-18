// Single-flight guard for the one shared, CPU-only Ollama instance. Both the lesson-grounded
// tutor widget and the AI Chat page call through this before starting a generation, so overlapping
// requests never both hit Ollama at once and drag every in-flight reply down together. This app is
// explicitly single-instance (see docs/DECISIONS.md), so an in-process boolean is sufficient — no
// distributed lock is needed.
let locked = false;

export function tryAcquireGenerationLock() {
  if (locked) return false;
  locked = true;
  return true;
}

export function releaseGenerationLock() {
  locked = false;
}

export function isGenerationLocked() {
  return locked;
}
