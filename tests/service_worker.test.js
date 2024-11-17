// Mock Chrome APIs
global.chrome = {
    identity: {
        getAuthToken: jest.fn(),
        removeCachedAuthToken: jest.fn(),
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
        },
    },
    runtime: {
        onMessage: {
            addListener: jest.fn(),
        },
        onInstalled: {
            addListener: jest.fn(),
        },
    },
    notifications: {
        create: jest.fn(),
    },
};

// Mock fetch API
global.fetch = jest.fn();

// Import all service worker functions
const {
    authenticate,
    saveToken,
    getToken,
    refreshToken,
    fetchEmails,
    processEmails,
    getEmailMetadata,
    applyRule,
    labelEmail,
    loadRules,
    saveRule,
    notifyUser,
} = require('./service_worker');

describe('Service Worker Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('authenticate() should call getAuthToken and saveToken', () => {
        const mockToken = 'testToken';
        chrome.identity.getAuthToken.mockImplementation((options, callback) => callback(mockToken));

        authenticate();

        expect(chrome.identity.getAuthToken).toHaveBeenCalledWith({ interactive: true }, expect.any(Function));
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ authToken: mockToken }, expect.any(Function));
    });

    test('saveToken() should store token in chrome.storage.local', () => {
        const token = 'testToken';
        saveToken(token);

        expect(chrome.storage.local.set).toHaveBeenCalledWith({ authToken: token }, expect.any(Function));
    });

    test('getToken() should retrieve token from chrome.storage.local', () => {
        const mockToken = 'testToken';
        chrome.storage.local.get.mockImplementation((key, callback) => callback({ authToken: mockToken }));

        const callback = jest.fn();
        getToken(callback);

        expect(chrome.storage.local.get).toHaveBeenCalledWith('authToken', expect.any(Function));
        expect(callback).toHaveBeenCalledWith(mockToken);
    });

    test('refreshToken() should remove cached token and re-authenticate', () => {
        const mockToken = 'testToken';
        chrome.storage.local.get.mockImplementation((key, callback) => callback({ authToken: mockToken }));
        chrome.identity.removeCachedAuthToken.mockImplementation((options, callback) => callback());

        refreshToken();

        expect(chrome.identity.removeCachedAuthToken).toHaveBeenCalledWith({ token: mockToken }, expect.any(Function));
        expect(chrome.identity.getAuthToken).toHaveBeenCalled();
    });

    test('fetchEmails() should fetch and process emails if token exists', async () => {
        const mockToken = 'testToken';
        const mockEmails = { messages: [{ id: 'email1' }, { id: 'email2' }] };

        chrome.storage.local.get.mockImplementation((key, callback) => callback({ authToken: mockToken }));
        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue(mockEmails),
        });

        await fetchEmails();

        expect(fetch).toHaveBeenCalledWith('https://www.googleapis.com/gmail/v1/users/me/messages', {
            headers: { Authorization: `Bearer ${mockToken}` },
        });
    });

    test('processEmails() should process emails and apply rules', async () => {
        const emails = [{ id: 'email1' }, { id: 'email2' }];
        const mockMetadata = { id: 'email1', payload: { headers: [{ name: 'From', value: 'test@example.com' }] } };
        const mockRules = [{ sender: 'test@example.com', labelId: 'label1' }];

        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue(mockMetadata),
        });

        chrome.storage.local.get.mockImplementation((key, callback) => callback({ rules: mockRules }));

        await processEmails(emails);

        expect(fetch).toHaveBeenCalledTimes(2); // Fetching metadata for both emails
        expect(fetch).toHaveBeenCalledWith(
            `https://www.googleapis.com/gmail/v1/users/me/messages/email1`,
            expect.any(Object)
        );
    });

    test('getEmailMetadata() should fetch metadata for a given email ID', async () => {
        const emailId = 'email1';
        const mockMetadata = { id: emailId, payload: { headers: [] } };
        const mockToken = 'testToken';

        chrome.storage.local.get.mockImplementation((key, callback) => callback({ authToken: mockToken }));
        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue(mockMetadata),
        });

        const metadata = await getEmailMetadata(emailId);

        expect(metadata).toEqual(mockMetadata);
        expect(fetch).toHaveBeenCalledWith(
            `https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}`,
            expect.any(Object)
        );
    });

    test('applyRule() should apply label if rule matches', async () => {
        const emailMetadata = {
            id: 'email1',
            payload: { headers: [{ name: 'From', value: 'test@example.com' }] },
        };
        const rule = { sender: 'test@example.com', labelId: 'label1' };

        const labelEmailMock = jest.fn();
        await applyRule(emailMetadata, rule);

        expect(fetch).toHaveBeenCalledWith(
            `https://www.googleapis.com/gmail/v1/users/me/messages/email1/modify`,
            expect.any(Object)
        );
    });

    test('labelEmail() should apply a label to an email', async () => {
        const emailId = 'email1';
        const labelId = 'label1';
        const mockToken = 'testToken';

        chrome.storage.local.get.mockImplementation((key, callback) => callback({ authToken: mockToken }));
        fetch.mockResolvedValueOnce({ ok: true });

        await labelEmail(emailId, labelId);

        expect(fetch).toHaveBeenCalledWith(
            `https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`,
            expect.any(Object)
        );
    });

    test('loadRules() should retrieve rules from chrome.storage.local', () => {
        const mockRules = [{ sender: 'test@example.com', labelId: 'label1' }];
        chrome.storage.local.get.mockImplementation((key, callback) => callback({ rules: mockRules }));

        const callback = jest.fn();
        loadRules(callback);

        expect(chrome.storage.local.get).toHaveBeenCalledWith('rules', expect.any(Function));
        expect(callback).toHaveBeenCalledWith(mockRules);
    });

    test('saveRule() should store a new rule in chrome.storage.local', () => {
        const newRule = { sender: 'new@example.com', labelId: 'label2' };
        const existingRules = [{ sender: 'test@example.com', labelId: 'label1' }];
        chrome.storage.local.get.mockImplementation((key, callback) => callback({ rules: existingRules }));

        saveRule(newRule);

        expect(chrome.storage.local.set).toHaveBeenCalledWith(
            { rules: [...existingRules, newRule] },
            expect.any(Function)
        );
    });

    test('notifyUser() should create a notification', () => {
        const message = 'Test notification';
        notifyUser(message);

        expect(chrome.notifications.create).toHaveBeenCalledWith({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Email Sorted',
            message: message,
        });
    });
});

