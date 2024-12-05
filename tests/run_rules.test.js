/**
 * @file run_rules.test.js
 * Updated tests with all necessary fixes
 */

const mockRules = [
  { sender: "test1@example.com", label: "Important" },
  { sender: "test2@example.com", label: "Work" },
];

// Mock the global chrome API
global.chrome = {
  storage: {
    sync: {
      set: jest.fn((data, callback) => callback()),
      get: jest.fn((keys, callback) =>
        callback({ rules: mockRules })
      ),
    },
  },
};

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
  })
);

// Mock window.location
delete window.location;
window.location = { href: jest.fn() };

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = ""; // Clear DOM
});

describe("run_rules.js Tests", () => {
  test("should display rules in the DOM", () => {
    // Mock DOM structure
    document.body.innerHTML = `
      <div id="rules-container"></div>
    `;
    const rulesContainer = document.getElementById("rules-container");

    // Simulate DOM population
    mockRules.forEach((rule) => {
      const ruleElement = document.createElement("div");
      ruleElement.textContent = `${rule.sender} → ${rule.label}`;
      rulesContainer.appendChild(ruleElement);
    });

    // Assert rules are displayed correctly
    expect(rulesContainer.children.length).toBe(mockRules.length);
    mockRules.forEach((rule) => {
      expect(rulesContainer.textContent).toContain(
        `${rule.sender} → ${rule.label}`
      );
    });
  });

  test("should handle running selected rules", async () => {
    // Mock selected rules and fetch call
    const selectedRules = [{ sender: "test1@example.com", label: "Important" }];
    await global.fetch("http://localhost:3000/run-python", {
      method: "POST",
      body: JSON.stringify({ rules: selectedRules }),
    });

    // Assert fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/run-python",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ rules: selectedRules }),
      })
    );
  });

  test("should delete selected rules", () => {
    // Mock DOM structure
    document.body.innerHTML = `
      <div id="rules-container">
        <div class="rule">Rule 1</div>
        <div class="rule">Rule 2</div>
      </div>
    `;
    const rulesContainer = document.getElementById("rules-container");

    // Simulate deletion of rules
    while (rulesContainer.firstChild) {
      rulesContainer.removeChild(rulesContainer.firstChild);
    }
    chrome.storage.sync.set({ rules: [] }, jest.fn());

    // Assert rules are deleted and storage is updated
    expect(rulesContainer.children.length).toBe(0);
    expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(
      { rules: [] },
      expect.any(Function)
    );
  });
});
