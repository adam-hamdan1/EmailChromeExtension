// Rule Processor Module
const RuleProcessor = (() => {
    // Process multiple emails against rules
    async function processEmails(emails) {
        const rules = await RuleManager.getRules();
        
        for (const email of emails) {
            try {
                const metadata = await GmailAPIHandler.getEmailMetadata(email.id);
                await processEmail(metadata, rules);
            } catch (error) {
                console.error(`Error processing email ${email.id}:`, error);
            }
        }
    }

    // Process a single email against all rules
    async function processEmail(emailMetadata, rules) {
        const headers = emailMetadata.payload.headers;
        const sender = headers.find(h => h.name.toLowerCase() === "from")?.value;
        const subject = headers.find(h => h.name.toLowerCase() === "subject")?.value;

        for (const rule of rules) {
            if (matchesRule(sender, subject, rule)) {
                try {
                    await GmailAPIHandler.applyLabel(emailMetadata.id, rule.labelId);
                    NotificationManager.showSuccess(`Applied label "${rule.labelName}" to email`);
                } catch (error) {
                    console.error("Error applying label:", error);
                    NotificationManager.showError("Failed to apply label");
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