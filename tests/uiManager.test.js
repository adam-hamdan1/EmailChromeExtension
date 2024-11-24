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
jest.mock('../src/notificationManager', () => ({
    NotificationManager: {
        showError: jest.fn(),
        showSuccess: jest.fn(),
    },
}));
jest.mock('../src/uiManager', () => ({
    setupRuleForm: jest.fn(),
    setupRefreshButton: jest.fn(),
    updateRulesList: jest.fn(),
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
        document.body.innerHTML = `
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
            <button id="refresh-rules">Refresh Rules</button>
        `;
        document.body.appendChild(container);

        // Initialize the UIManager
    });

    beforeEach(() => {
        UIManager.setupRuleForm();
        UIManager.setupRuleForm.mockImplementation(() => {
            const form = document.getElementById('rule-form');
            form.addEventListener('submit', jest.fn());
        });
        UIManager.setupRefreshButton.mockImplementation(() => {
            const refreshButton = document.getElementById('refresh-rules');
            refreshButton.addEventListener('click', jest.fn());
        });
    });

    afterEach(() => {
        document.body.removeChild(container);
    });


    test('setupRuleForm() should call RuleManager.addRule on form submission', async () => {
        RuleManager.addRule.mockResolvedValueOnce();

        const form = document.getElementById('rule-form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        // Wait for async operation to complete
        await Promise.resolve();

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

        // Wait for async operation to complete
        await Promise.resolve();

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


    test('setupRefreshButton() should reload and update rules list', async () => {
        RuleManager.loadRules.mockResolvedValueOnce();
        RuleManager.getRules.mockResolvedValueOnce([]);

        UIManager.setupRefreshButton();

        const refreshButton = document.getElementById('refresh-rules');
        refreshButton.click();

        // Wait for async operations to resolve
        await Promise.resolve();

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

