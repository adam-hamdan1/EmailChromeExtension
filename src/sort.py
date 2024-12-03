import os
import pickle
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/gmail.modify']


def authenticate_gmail():
    """Authenticate and return the Gmail API service."""
    creds = None
    if os.path.exists('../token.pickle'):
        with open('../token.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=8080)  # Replace with manual code input if necessary
        with open('../token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    return build('gmail', 'v1', credentials=creds)

def get_label_id(service, label_name):
    labels = service.users().labels().list(userId='me').execute()
    #print("Fetched labels:", labels)
    for label in labels.get('labels', []):
        #print("Checking label:", label['name'])
        if label['name'] == label_name:
            return label['id']
    #print(f"Label '{label_name}' not found.")
    return None


def move_emails_by_sender(service, sender_email, label_name, mark_as_read=True):
    """Move all emails from a specific sender to a specified label, excluding drafts, spam, and trash."""
    
    # Check for the existing label
    label_id = get_label_id(service, label_name)
    if not label_id:
        # Create the label if it doesn't exist
        print(f"Creating label '{label_name}'...")
        label_body = {
            'name': label_name,
            'labelListVisibility': 'labelShow',
            'messageListVisibility': 'show'
        }
        label = service.users().labels().create(userId='me', body=label_body).execute()
        label_id = label['id']
        print(f"Label '{label_name}' created successfully.")
    else:
        print(f"Label '{label_name}' already exists. Using existing label.")

    # Search for all emails from the sender, excluding drafts, spam, and trash
    query = f"from:{sender_email} is:anywhere -in:draft -in:spam -in:trash"
    results = service.users().messages().list(userId='me', q=query).execute()
    messages = results.get('messages', [])

    if not messages:
        print(f"No emails found from {sender_email}.")
        return

    for message in messages:
        # Fetch existing label IDs
        existing_labels = service.users().messages().get(userId='me', id=message['id']).execute().get('labelIds', [])
        labels_to_remove = [label for label in existing_labels if label != 'UNREAD']

        # Update labels: remove all existing labels and add only the new one
        service.users().messages().modify(
            userId='me',
            id=message['id'],
            body={'addLabelIds': [label_id], 'removeLabelIds': existing_labels}
        ).execute()

    print(f"Found {len(messages)} emails from {sender_email}. Moving them to '{label_name}'...")

    for message in messages:
        # Fetch the current labels for the email
        message_details = service.users().messages().get(userId='me', id=message['id']).execute()
        current_labels = message_details.get('labelIds', [])

        # Determine read/unread behavior
        add_labels = [label_id]
        remove_labels = []
        if mark_as_read is True:
            # Explicitly mark as read
            if 'UNREAD' in current_labels:
                remove_labels.append('UNREAD')
        elif mark_as_read is False:
            # Explicitly mark as unread
            if 'UNREAD' not in current_labels:
                add_labels.append('UNREAD')
        # If mark_as_read is None, retain current state

        # Modify the email labels
        service.users().messages().modify(
            userId='me',
            id=message['id'],
            body={'addLabelIds': add_labels, 'removeLabelIds': remove_labels}
        ).execute()
    print("Emails moved successfully!")



def main():
    service = authenticate_gmail()
    #sender_email = input("Enter the sender's email address: ")
    #label_name = input("Enter the folder (label) name: ")
    sender_email = "hello@tryhackme.com"
    label_name = "testing"
    move_emails_by_sender(service, sender_email, label_name)

if __name__ == '__main__':
    main()
