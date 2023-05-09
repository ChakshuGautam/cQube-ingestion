export async function measureExecutionTime<T>(
  func: (any) => Promise<T>,
): Promise<T> {
  const startTime = performance.now();
  const result = await func();
  const endTime = performance.now();

  this.logger.log(`Time taken: ${(endTime - startTime).toFixed(4)} ms`);
  return result;
}
