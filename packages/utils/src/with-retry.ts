export type RetryTask<T> = () => Promise<T>;

export interface WithRetryOptions {
  retries?: number;
}

export const withRetry = <T>(
  run: RetryTask<T>,
  options: WithRetryOptions = {}
): RetryTask<T> => {
  const retries = options.retries ?? 1;

  return async () => {
    const attempt = async (remaining: number): Promise<T> => {
      try {
        return await run();
      } catch (error) {
        if (remaining === 0) {
          throw error;
        }
        return await attempt(remaining - 1);
      }
    };

    return await attempt(retries);
  };
};
