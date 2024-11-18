// Rule Processor Module
const RuleProcessor = (() => {
    // Process multiple emails against rules
    async function processEmails(emails) {
        try {
            const rules = await RuleManager.getRules(); // Fetch all rules
            if (!rules || rules.length === 0) {
                console.warn("No active rules found");
                NotificationManager.showError("No active rules found");
                return;
            }

            for (const email of emails) {
                try {
                    const metadata = await GmailAPIHandler.getEmailMetadata(email.id); // Fetch email metadata
                    await processEmail(metadata, rules); // Process email against rules
                } catch (error) {
                    console.error(`Error processing email ${email.id}:`, error);
                    NotificationManager.showError(`Error processing email ${email.id}`);
                }
            }
        } catch (error) {
            console.error("Error fetching rules:", error);
            NotificationManager.showError("Error fetching rules");
        }
    }

    // Process a single email against all rules
    async function processEmail(emailMetadata, rules) {
        const headers = emailMetadata.payload.headers || [];
        const sender = headers.find(h => h.name.toLowerCase() === "from")?.value || "";
        const subject = headers.find(h => h.name.toLowerCase() === "subject")?.value || "";

        // Process images and attachments separately to avoid errors
        const attachments = emailMetadata.payload.parts || [];
        for (const part of attachments) {
            if (part.mimeType && part.mimeType.startsWith('image/')) {
                console.log(`Skipping image attachment: ${part.filename}`);
                // Optionally log or store image details, but do not attempt to download
                continue;
            }
        }

        // Now, proceed to check rules for the email
        for (const rule of rules) {
            if (matchesRule(sender, subject, rule)) {
                try {
                    await GmailAPIHandler.applyLabel(emailMetadata.id, rule.labelId); // Apply label
                    NotificationManager.showSuccess(`Applied label "${rule.labelName}" to email`);
                } catch (error) {
                    console.error(`Error applying label "${rule.labelName}" to email ${emailMetadata.id}:`, error);
                    NotificationManager.showError(`Failed to apply label "${rule.labelName}"`);
                }
            }
        }
    }

    // Check if email matches rule criteria
    function matchesRule(sender, subject, rule) {
        if (rule.senderMatch && !sender.includes(rule.sender)) {
            return false;
        }

        if (rule.subjectMatch && !subject.includes(rule.subject)) {
            return false;
        }

        return true;
    }

    // Public interface
    return {
        processEmails,
        processEmail
    };
})();

export default RuleProcessor; // Add this line for ES Modules
