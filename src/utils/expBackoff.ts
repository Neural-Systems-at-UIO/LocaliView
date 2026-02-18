interface backoffOptions {
    retries: number;
    factor: number;
    minTimeout: number;
    maxTimeout: number;
}

const defaultOptions: backoffOptions = {
    retries: 8,
    factor: 1.2,
    minTimeout: 1000,
    maxTimeout: 30000,
};

export const exponentialBackoff = async <T>(
    fn: () => Promise<T>,
    options: Partial<backoffOptions> = {}
): Promise<T> => {
    const { retries, factor, minTimeout, maxTimeout } = { ...defaultOptions, ...options };

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= retries) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (attempt === retries) throw lastError;

            const timeout = Math.min(
                maxTimeout,
                Math.floor(minTimeout * Math.pow(factor, attempt))
            );
            await new Promise((resolve) => setTimeout(resolve, timeout));
        }
        attempt++;
    }

    throw lastError;
};