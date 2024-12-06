/**
 * Observes changes in the DOM and ensures that any `.popup` elements
 * are correctly re-attached to the document body if removed.
 */
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        // Find all elements with the "popup" class
        const popups = document.querySelectorAll(".popup");
        popups.forEach((popup) => {
            // Re-attach the popup to the body if it's not already in the DOM
            if (!document.body.contains(popup)) {
                document.body.appendChild(popup);
            }
        });
    });
});

// Start observing the body for added/removed child nodes or subtree changes
observer.observe(document.body, { childList: true, subtree: true });

/**
 * Creates and displays a popup notification with a custom message.
 *
 * @param {string} message - The message to display in the popup.
 */
export function createPopup(message) {
    // Create the popup container
    const popup = document.createElement("div");
    popup.className = "popup";
    Object.assign(popup.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "15px 20px",
        backgroundColor: "#333",
        color: "#fff",
        fontSize: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        zIndex: "1000",
        opacity: "0",
        transition: "opacity 0.3s ease-in-out",
    });

    // Set the popup message
    popup.textContent = message;

    // Append the popup to the document body
    document.body.appendChild(popup);

    // Animate the popup's appearance
    setTimeout(() => {
        popup.style.opacity = "1";
    }, 10);

    // Automatically hide and remove the popup after 3 seconds
    setTimeout(() => {
        popup.style.opacity = "0";
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 300); // Matches the CSS transition duration
    }, 3000);
}

