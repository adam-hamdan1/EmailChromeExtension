import GmailAPIHandler from 'src/gmailAPIHandler';

describe('GmailAPIHandler', () => {
    beforeEach(() => {
        // Reset mocks before each test
        chrome.identity.getAuthToken.mockClear();
        chrome.storage.local.set.mockClear();
    });

    test('authenticate retrieves an OAuth token', async () => {
        await GmailAPIHandler.authenticate();
        expect(chrome.identity.getAuthToken).toHaveBeenCalledWith(
            { interactive: true },
            expect.any(Function)
        );
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ accessToken: 'fake-token' });
    });

    test('fetchEmails calls Gmail API with OAuth token', async () => {
        const mockEmails = { messages: [{ id: '123' }, { id: '456' }] };
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(mockEmails)
            })
        );

        const emails = await GmailAPIHandler.fetchEmails();
        expect(global.fetch).toHaveBeenCalledWith(
            'https://www.googleapis.com/gmail/v1/users/me/messages',
            expect.objectContaining({
                headers: { Authorization: `Bearer fake-token` }
            })
        );
        expect(emails).toEqual(mockEmails);
    });
});
