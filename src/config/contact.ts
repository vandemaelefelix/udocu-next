/**
 * Single source of truth for udocu's contact details and social links.
 *
 * Update these values here — every consumer (contact section, structured
 * data / schema.org, llms.txt) reads from this file, so there is exactly one
 * place to change when a link or contact detail changes.
 */

export interface SocialLink {
  platform: string;
  url: string;
}

export const contactInfo = {
  name: "Kurt Vandemaele",
  email: "udocu@yahoo.com",
  /** Display format; the `tel:` link is derived by stripping whitespace. */
  phone: "+32 475 73 11 56",
  address: {
    line1: "André Devaerelaan 20",
    line2: "8500 Kortrijk",
    locality: "Kortrijk",
    postalCode: "8500",
    country: "BE",
  },
} as const;

export const socialLinks: SocialLink[] = [
  {
    platform: "Facebook",
    url: "https://www.facebook.com/profile.php?id=61584662377420",
  },
  {
    platform: "Instagram",
    url: "https://www.instagram.com/udocu.be/",
  },
];
