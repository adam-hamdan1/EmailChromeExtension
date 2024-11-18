/**
 * @jest-environment jsdom
 */

// Mock dependencies
jest.mock('../src/ruleManagement', () => ({
    RuleManager: {
        addRule: jest.fn(),
        deleteRule: jest.fn(),
        getRules: jest.fn(),
        loadRules: jest.fn(),
    },
}));
jest.mock('./src/notificationManager', () => ({
    NotificationManager: {
        showError: jest.fn(),
        showSuccess: jest.fn(),
    },
}));
jest.mock('../src/coordinator', () => ({
    Coordinator: {
        loadAndProcessEmails: jest.fn(),
    },
}));

const { RuleManager } = require('../src/ruleManagement.js');
const { NotificationManager } = require('../src/notificationManager.js');
const UIManager = require('../src/uiManager.js');

describe('UI Manager Tests', () => {
    let container;

    beforeEach(() => {
        jest.clearAllMocks();

        // Set up a mock DOM
        container = document.createElement('div');
        container.innerHTML = `
            <form id="rule-form">
                <input name="sender" value="test@example.com" />
                <input name="subject" value="Test Subject" />
                <input name="labelId" value="label1" />
                <input name="labelName" value="Label Name" />
                <input name="senderMatch" type="checkbox" checked />
                <input name="subjectMatch" type="checkbox" />
                <button type="submit">Add Rule</button>
            </form>
            <div id="rules-list"></div>
            <button id="process-emails">Process Emails</button>
            <button id="refresh-rules">Refresh Rules</button>
        `;
        document.body.appendChild(container);

        // Initialize the UIManager
        UIManager.initialize();
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    test('initialize() should set up all event listeners', () => {
        const form = document.getElementById('rule-form');
        const processButton = document.getElementById('process-emails');
        const refreshButton = document.getElementById('refresh-rules');

        expect(form).toBeTruthy();
        expect(processButton).toBeTruthy();
        expect(refreshButton).toBeTruthy();
    });

    test('setupRuleForm() should call RuleManager.addRule on form submission', async () => {
        RuleManager.addRule.mockResolvedValueOnce();

        const form = document.getElementById('rule-form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        expect(RuleManager.addRule).toHaveBeenCalledWith({
            sender: 'test@example.com',
            subject: 'Test Subject',
            labelId: 'label1',
            labelName: 'Label Name',
            senderMatch: true,
            subjectMatch: false,
        });
        expect(NotificationManager.showError).not.toHaveBeenCalled();
    });

    test('setupRuleForm() should show error if RuleManager.addRule fails', async () => {
        RuleManager.addRule.mockRejectedValueOnce(new Error('Failed to add rule'));

        const form = document.getElementById('rule-form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        expect(NotificationManager.showError).toHaveBeenCalledWith('Failed to add rule');
    });

    test('setupRulesList() should populate rules list and handle delete', async () => {
        RuleManager.getRules.mockResolvedValueOnce([
            { id: 1, sender: 'test@example.com', subject: 'Subject 1', labelName: 'Label 1' },
        ]);

        await UIManager.updateRulesList();

        const rulesList = document.getElementById('rules-list');
        expect(rulesList.innerHTML).toContain('test@example.com');
        expect(rulesList.innerHTML).toContain('Subject 1');

        const deleteButton = rulesList.querySelector('.delete-rule');
        deleteButton.click();

        expect(RuleManager.deleteRule).toHaveBeenCalledWith(1);
        expect(NotificationManager.showSuccess).toHaveBeenCalled();
    });

    test('setupProcessButton() should trigger email processing', () => {
        const processButton = document.getElementById('process-emails');
        processButton.click();

        expect(Coordinator.loadAndProcessEmails).toHaveBeenCalled();
    });

    test('setupRefreshButton() should reload and update rules list', async () => {
        RuleManager.loadRules.mockResolvedValueOnce();
        RuleManager.getRules.mockResolvedValueOnce([]);

        const refreshButton = document.getElementById('refresh-rules');
        refreshButton.click();

        await Promise.resolve(); // Wait for async calls

        expect(RuleManager.loadRules).toHaveBeenCalled();
        expect(RuleManager.getRules).toHaveBeenCalled();
    });

    test('updateRulesList() should handle empty rules list', async () => {
        RuleManager.getRules.mockResolvedValueOnce([]);

        await UIManager.updateRulesList();

        const rulesList = document.getElementById('rules-list');
        expect(rulesList.innerHTML).toBe('');
    });
});

