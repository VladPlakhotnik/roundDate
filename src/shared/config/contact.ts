export const defaultContactEmail = "hello@rounddate.pl";

function resolveContactEmail() {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || defaultContactEmail;
}

export const contactEmail = resolveContactEmail();
export const contactEmailHref = `mailto:${contactEmail}`;
