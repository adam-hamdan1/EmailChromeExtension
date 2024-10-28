// RuleProcessor.test.js
const RuleProcessor = require('./ruleProcessor'); // Adjust the path to your actual file

// Mock data for emails and rules
const mockEmails = [
    { id: "1", payload: { headers: [{ name: "From", value: "test@example.com" }, { name: "Subject", value: "Meeting Update" }] } },
    { id: "2", payload: { headers: [{ name: "From", value: "admin@example.com" }, { name: "Subject", value: "Urgent: Action Required" }] } },
];

const mockRules = [
    { senderMatch: true, sender: "test@example.com", subjectMatch: true, subject: "Meeting", labelId: "Label_1", labelName: "Meetings" },
    { senderMatch: true, sender: "admin@example.com", subjectMatch: true, subject: "Urgent", labelId: "Label_2", labelName: "Urgent" },
];

// Mock GmailAPIHandler
const GmailAPIHandler = {
    getEmailMetadata: jest.fn(async (emailId) => {
        return mockEmails.find(email => email.id === emailId);
    }),
    applyLabel: jest.fn(async (emailId, labelId) => {
        return `Label "${labelId}" applied to email ID: ${emailId}`;
    })
};

// Mock NotificationManager
const NotificationManager = {
    showSuccess: jest.fn(),
    showError: jest.fn()
};

// Mock RuleManager
const RuleManager = {
    getRules: jest.fn(async () => mockRules)
};

describe("RuleProcessor Module", () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Reset mocks before each test
    });

    test("should process multiple emails and apply correct labels", async () => {
        await RuleProcessor.processEmails(mockEmails);

        expect(GmailAPIHandler.applyLabel).toHaveBeenCalledWith("1", "Label_1");
        expect(NotificationManager.showSuccess).toHaveBeenCalledWith('Applied label "Meetings" to email');

        expect(GmailAPIHandler.applyLabel).toHaveBeenCalledWith("2", "Label_2");
        expect(NotificationManager.showSuccess).toHaveBeenCalledWith('Applied label "Urgent" to email');
    });

    test("should not apply any label if no rules match", async () => {
        const nonMatchingEmail = { id: "3", payload: { headers: [{ name: "From", value: "no-match@example.com" }, { name: "Subject", value: "Hello World" }] } };

        await RuleProcessor.processEmail(nonMatchingEmail, mockRules);

        expect(GmailAPIHandler.applyLabel).not.toHaveBeenCalled();
        expect(NotificationManager.showSuccess).not.toHaveBeenCalled();
    });

    test("should handle errors in applying labels gracefully", async () => {
        GmailAPIHandler.applyLabel.mockRejectedValue(new Error("Failed to apply label"));

        await RuleProcessor.processEmails(mockEmails);

        expect(NotificationManager.showError).toHaveBeenCalledWith("Failed to apply label");
    });
});
