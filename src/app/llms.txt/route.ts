import { SITE_URL } from "@/lib/seo";
import { contactInfo } from "@/config/contact";

const content = `# udocu

> Udocu is a creative studio founded by journalist Kurt Vandemaele, dedicated to preserving personal and cultural heritage through in-depth documentary interviews, film, photography, and digital archives. Based in Kortrijk, Belgium.

## About

Udocu captures the stories, voices, and memories of ordinary people before they fade. Through intimate, in-depth video interviews, Kurt Vandemaele — a veteran journalist with 24 years at Humo magazine — helps individuals create lasting time capsules for themselves and future generations.

The concept: a professional journalist conducts a deep interview about who you are now, who you were, and who you want to become — your life, family, passions, fears, and dreams. The result is a personal documentary delivered on a USB stick, growing more valuable with every passing year.

## Services

- **Personal documentary interviews**: In-depth filmed interviews preserving your life story
- **Family heritage documentation**: Capturing family histories and oral traditions
- **Cultural heritage preservation**: Documenting cultural practices and community stories
- **Digital archives**: Creating lasting digital records connecting generations

## Key Information

- **Founder**: Kurt Vandemaele (journalist, former Humo contributor)
- **Location**: Kortrijk, Belgium
- **Contact**: ${contactInfo.email} | ${contactInfo.phone}
- **Website**: ${SITE_URL}
- **Languages**: Dutch

## Links

- [About udocu](${SITE_URL}/about)
- [Who is Kurt Vandemaele](${SITE_URL}/who-am-i)
- [Work & Interviews](${SITE_URL}/work)
- [Procedure and pricing](${SITE_URL}/werkwijze)
- [Blog](${SITE_URL}/blog)
- [Contact](${SITE_URL}/contact)
- [Full LLM context](${SITE_URL}/llms-full.txt)
`;

export function GET() {
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
