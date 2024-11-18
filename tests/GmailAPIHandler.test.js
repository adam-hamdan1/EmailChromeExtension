import GmailAPIHandler from '../src/gmailAPIHandler'; // Adjust the path as needed

// Mock Chrome APIs
global.chrome = {
    identity: {
        getAuthToken: jest.fn()
    },
    storage: {
        local: {
            set: jest.fn(),
            get: jest.fn((key, callback) => callback({ accessToken: 'fake-token' }))
        }
    }
};

// Mock the global fetch API for API calls
global.fetch = jest.fn();

describe('GmailAPIHandler', () => {
    beforeEach(() => {
        // Clear mock calls before each test
        jest.clearAllMocks();
    });

    test('authenticate retrieves an OAuth token and stores it', async () => {
        // Mock getAuthToken to resolve with a token
        chrome.identity.getAuthToken.mockImplementation((options, callback) => {
            callback('fake-token');
        });

        // Call the authenticate method
        await GmailAPIHandler.authenticate();

        // Verify that getAuthToken was called with interactive mode
        expect(chrome.identity.getAuthToken).toHaveBeenCalledWith(
            { interactive: true },
            expect.any(Function)
        );

        // Verify that the token was stored in chrome.storage.local
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ accessToken: 'fake-token' });
    });

    test('fetchEmails calls Gmail API with the stored OAuth token', async () => {
        const mockEmails = { messages: [{ id: '123' }, { id: '456' }] };

        // Mock fetch to return sample email data
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockEmails)
        });

        // Execute fetchEmails function
        const emails = await GmailAPIHandler.fetchEmails();

        // Verify fetch was called with correct URL and headers
        expect(fetch).toHaveBeenCalledWith(
            'https://www.googleapis.com/gmail/v1/users/me/messages',
            expect.objectContaining({
                headers: { Authorization: `Bearer fake-token` }
            })
        );

        // Verify the returned emails match the mocked data
        expect(emails).toEqual(mockEmails);
    });

    test('fetchEmails handles API errors gracefully', async () => {
        // Mock fetch to return an error response
        fetch.mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized'
        });

        // Execute fetchEmails and expect an error to be thrown
        await expect(GmailAPIHandler.fetchEmails()).rejects.toThrow(
            'Failed to fetch emails: Unauthorized (401)'
        );

        // Verify fetch was called
        expect(fetch).toHaveBeenCalledWith(
            'https://www.googleapis.com/gmail/v1/users/me/messages',
            expect.objectContaining({
                headers: { Authorization: `Bearer fake-token` }
            })
        );
    });
});
