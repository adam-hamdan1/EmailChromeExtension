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
        chrome.identity.getAuthToken.mockClear();
        chrome.storage.local.set.mockClear();
        fetch.mockClear();
    });

    test('authenticate retrieves an OAuth token', async () => {
        // Mock implementation for getAuthToken to resolve with a token
        chrome.identity.getAuthToken.mockImplementation((options, callback) => {
            callback('fake-token');
        });

        await GmailAPIHandler.authenticate();

        // Check that getAuthToken was called with { interactive: true }
        expect(chrome.identity.getAuthToken).toHaveBeenCalledWith(
            { interactive: true },
            expect.any(Function)
        );

        // Check that the token was stored in chrome.storage.local
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ accessToken: 'fake-token' });
    });

    test('fetchEmails calls Gmail API with OAuth token', async () => {
        const mockEmails = { messages: [{ id: '123' }, { id: '456' }] };

        // Mock fetch to return sample email data
        fetch.mockResolvedValue({
            json: () => Promise.resolve(mockEmails)
        });

        // Execute fetchEmails function
        const emails = await GmailAPIHandler.fetchEmails();

        // Verify that fetch was called with the correct URL and headers
        expect(fetch).toHaveBeenCalledWith(
            'https://www.googleapis.com/gmail/v1/users/me/messages',
            expect.objectContaining({
                headers: { Authorization: `Bearer fake-token` }
            })
        );

        // Verify the response matches the mocked email data
        expect(emails).toEqual(mockEmails);
    });
});
