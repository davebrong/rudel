const superadminEmails = process.env.SUPERADMIN_EMAILS
	? process.env.SUPERADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
	: [];

export const superadminConfig = {
	emails: superadminEmails,
	isSuperadmin(email: string): boolean {
		return superadminEmails.length > 0 && superadminEmails.includes(email.toLowerCase());
	},
};
