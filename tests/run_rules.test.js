describe("run_rules.js Tests", () => {
  let mockRules;

  beforeEach(() => {
    // Mock chrome.storage.sync.get
    mockRules = [
      { sender: "test1@example.com", label: "Label1" },
      { sender: "test2@example.com", label: "Label2" }
    ];
    global.chrome = {
      storage: {
        sync: {
          get: jest.fn((key, callback) => {
            callback({ rules: mockRules });
          }),
          set: jest.fn((data, callback) => callback && callback())
        }
      }
    };

    // Mock fetch
    global.fetch = jest.fn((url, options) => {
      if (url === "http://localhost:3000/run-python") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ output: "Script executed successfully." })
        });
      }
      return Promise.reject(new Error("Fetch error"));
    });

    // Mock DOM
    document.body.innerHTML = `
      <div id="rulesContainer"></div>
      <button id="runSelectedRules"></button>
      <button id="deleteSelectedRules"></button>
      <button id="createRules"></button>
    `;
  });

  it("should display rules in the DOM", () => {
    require("../src/run_rules.js"); // Ensure the script runs
    const rulesContainer = document.getElementById("rulesContainer");
    expect(rulesContainer.children.length).toBe(mockRules.length);
    expect(rulesContainer.textContent).toContain("Rule 1: test1@example.com → Label1");
    expect(rulesContainer.textContent).toContain("Rule 2: test2@example.com → Label2");
  });

  it("should handle running selected rules", async () => {
    require("../src/run_rules.js");

    // Wait for the checkboxes to be rendered
    await new Promise(process.nextTick);

    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    expect(checkboxes.length).toBe(mockRules.length); // Ensure checkboxes are present

    // Simulate selecting a rule
    checkboxes[0].checked = true;

    const runButton = document.getElementById("runSelectedRules");

    // Simulate click event
    runButton.click();

    await new Promise(process.nextTick); // Wait for async actions
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000/run-python", expect.any(Object));
    expect(global.fetch.mock.calls[0][1].body).toContain("test1@example.com");
  });

  it("should delete selected rules", async () => {
    require("../src/run_rules.js");

    // Wait for the checkboxes to be rendered
    await new Promise(process.nextTick);

    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    expect(checkboxes.length).toBe(mockRules.length); // Ensure checkboxes are present

    const deleteButton = document.getElementById("deleteSelectedRules");

    // Simulate selecting a rule
    checkboxes[0].checked = true;

    // Simulate click event
    deleteButton.click();

    expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(
      { rules: [mockRules[1]] },
      expect.any(Function)
    );
  });

  afterEach(() => {
    delete global.chrome;
    delete global.fetch;
    document.body.innerHTML = "";
  });
});
