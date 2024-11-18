// Notification Manager Module
const NotificationManager = (() => {
    const NOTIFICATION_TIMEOUT = 5000; // 5 seconds

    // Show success notification
    function showSuccess(message) {
        showNotification(message, 'success');
    }

    // Show error notification
    function showError(message) {
        showNotification(message, 'error');
    }

    // Show notification in extension popup
    function showNotification(message, type) {
        // Send message to popup if it's open
        chrome.runtime.sendMessage({
            action: 'showNotification',
            notification: { message, type }
        });

        // Create Chrome notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: type === 'success' ? 'assets/icons/success.png' : 'assets/icons/error.png',
            title: type === 'success' ? 'Success' : 'Error',
            message: message,
            priority: type === 'error' ? 2 : 0
        });
    }

    // Show notification in the popup UI
    function showPopupNotification(message, type) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // Remove notification after timeout
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, NOTIFICATION_TIMEOUT);
    }

    // Public interface
    return {
        showSuccess,
        showError,
        showPopupNotification
    };
})();

export default NotificationManager; // Add this line for ES Modules
