export const google = {
    auth: {
        OAuth2: class {
            setCredentials(_: unknown): void { /* noop */ }
            async getAccessToken(): Promise<{ token: string }> {
                return { token: 'fake-test-access-token' };
            }
        },
    },
};
