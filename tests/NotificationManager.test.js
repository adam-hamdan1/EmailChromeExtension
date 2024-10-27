import NotificationManager from '../path/to/NotificationManager'; // Adjust the path

// Mock Chrome APIs
global.chrome = {
    runtime: {
        sendMessage: jest.fn()
    },
    notifications: {
        create: jest.fn()
    }
};

// Set up a basic DOM environment for showPopupNotification test
document.body.innerHTML = '<div id="notification-container"></div>';

describe('NotificationManager', () => {
    afterEach(() => {
        jest.clearAllMocks();
        document.getElementById('notification-container').innerHTML = ''; // Clear notifications after each test
    });

    test('showSuccess sends success message and creates success notification', () => {
        const message = 'Operation successful';

        NotificationManager.showSuccess(message);

        // Verify `chrome.runtime.sendMessage` was called with correct data
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'showNotification',
            notification: { message, type: 'success' }
        });

        // Verify `chrome.notifications.create` was called with success icon and message
        expect(chrome.notifications.create).toHaveBeenCalledWith({
            type: 'basic',
            iconUrl: 'assets/icons/success.png',
            title: 'Success',
            message: message,
            priority: 0
        });
    });

    test('showError sends error message and creates error notification', () => {
        const message = 'An error occurred';

        NotificationManager.showError(message);

        // Verify `chrome.runtime.sendMessage` was called with correct data
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'showNotification',
            notification: { message, type: 'error' }
        });

        // Verify `chrome.notifications.create` was called with error icon and message
        expect(chrome.notifications.create).toHaveBeenCalledWith({
            type: 'basic',
            iconUrl: 'assets/icons/error.png',
            title: 'Error',
            message: message,
            priority: 2
        });
    });

    test('showPopupNotification adds a notification element to the container', () => {
        const message = 'Popup message';
        const type = 'success';

        NotificationManager.showPopupNotification(message, type);

        // Check if notification element was added to the DOM
        const container = document.getElementById('notification-container');
        const notification = container.querySelector('.notification-success');

        expect(notification).not.toBeNull();
        expect(notification.textContent).toBe(message);

        // Verify fade-out and removal after timeout
        jest.advanceTimersByTime(NotificationManager.NOTIFICATION_TIMEOUT + 300);
        expect(container.querySelector('.notification-success')).toBeNull();
    });
});
