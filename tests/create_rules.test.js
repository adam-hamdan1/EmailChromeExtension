// Mock the Chrome storage API to simulate browser behavior
global.chrome = {
  storage: {
    sync: {
      get: jest.fn((key, callback) => {
        // Simulate fetching data with a default empty "rules" array
        callback({ rules: [] });
      }),
      set: jest.fn((data, callback) => {
        // Simulate storing data and invoke the callback if provided
        if (callback) callback();
      }),
    },
  },
};

// Test suite for create_rules.js functionality
describe('create_rules.js functionality', () => {
  beforeEach(() => {
    // Set up the DOM elements required for the tests
    document.body.innerHTML = `
      <input id="sender" />
      <input id="label" />
      <button id="saveRule"></button>
      <button id="backToRunRules"></button>
    `;

    // Mock the alert function to avoid actual alerts during tests
    global.alert = jest.fn();

    // Load the script being tested
    require('../src/create_rules.js');
  });

  afterEach(() => {
    // Clear all mocks after each test to ensure no state is carried over
    jest.clearAllMocks();
  });

  test('Saves a rule when fields are filled', () => {
    // Populate the input fields with test values
    document.getElementById('sender').value = 'test@example.com';
    document.getElementById('label').value = 'Important';

    // Simulate a click on the "Save Rule" button
    const saveButton = document.getElementById('saveRule');
    saveButton.click();

    // Assert that the Chrome storage API was called to retrieve existing rules
    expect(chrome.storage.sync.get).toHaveBeenCalledWith('rules', expect.any(Function));

    // Assert that the new rule was saved correctly
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      { rules: [{ sender: 'test@example.com', label: 'Important' }] },
      expect.any(Function)
    );

    // Assert that the page navigates to the expected location after saving
    expect(window.location.href).toBe('http://localhost/'); // Adjust to the actual expected URL in your app
  });

  test('Navigates back when "Back" button is clicked', () => {
    // Simulate a click on the "Back to Run Rules" button
    const backButton = document.getElementById('backToRunRules');
    backButton.click();

    // Assert that the page navigates to the expected location
    expect(window.location.href).toBe('http://localhost/'); // Adjust to the actual expected URL in your app
  });
});
