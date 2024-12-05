// Mock the Chrome storage API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn((key, callback) => {
        callback({ rules: [] }); // Return an empty rules array by default
      }),
      set: jest.fn((data, callback) => {
        callback && callback(); // Invoke the callback if provided
      }),
    },
  },
};


describe('create_rules.js functionality', () => {
  beforeEach(() => {
  document.body.innerHTML = `
    <input id="sender" />
    <input id="label" />
    <button id="saveRule"></button>
    <button id="backToRunRules"></button>
  `;
  global.alert = jest.fn(); // Mock alert
  require('../src/create_rules.js'); // Load the script
});


  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  test('Saves a rule when fields are filled', () => {
  document.getElementById('sender').value = 'test@example.com';
  document.getElementById('label').value = 'Important';

  const saveButton = document.getElementById('saveRule');
  saveButton.click();

  expect(chrome.storage.sync.get).toHaveBeenCalledWith('rules', expect.any(Function));
  expect(chrome.storage.sync.set).toHaveBeenCalledWith(
    { rules: [{ sender: 'test@example.com', label: 'Important' }] },
    expect.any(Function)
  );
  expect(window.location.href).toBe('http://localhost/'); // Match the value set in the code
});


  test('Navigates back when "Back" button is clicked', () => {
    const backButton = document.getElementById('backToRunRules');
    backButton.click();

    expect(window.location.href).toBe('http://localhost/'); // Match the value set in the code
  });

});
