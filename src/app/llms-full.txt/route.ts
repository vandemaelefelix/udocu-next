import { SITE_URL } from "@/lib/seo";

const content = `# udocu — Preserving Personal and Cultural Heritage

> Udocu is a creative studio founded by journalist Kurt Vandemaele, dedicated to preserving personal and cultural heritage through in-depth documentary interviews, film, photography, and digital archives. Based in Kortrijk, Belgium. Website: ${SITE_URL}

## What is udocu?

Udocu is a creative studio dedicated to preserving personal and cultural heritage through documentary storytelling. We believe every life carries stories worth remembering. Our work captures the voices, images, and moments that define who we are — before they fade.

Through film, photography, and digital archives, we create lasting records that connect generations and communities. Whether it's a family history, an oral tradition, or a cultural practice on the verge of being forgotten — we document it, so as not to forget.

The tagline "So as not to forget who you were" (Dutch: "Om niet te vergeten wie u was") captures the mission: helping people preserve their personal stories for future generations.

## How it works

A seasoned journalist conducts an in-depth interview with you about who you are now, who you were, and who you want to become. About your life, family, friends, your passions, your health, your world, your loves, doubts, worries and fears. The interview is filmed with small cameras and delivered as a time capsule — an external hard drive that will prove more valuable year after year for yourself and perhaps also for your loved ones.

Today you give the answers to the questions that you or your loved ones will surely ask later. Often those questions only arise for your loved ones when you are no longer there or when you have forgotten the answers.

The result is yours alone. You do with it what you wish. An interview with your 21-year-old self can be shown to your son or daughter of 21 in 40 years' time. Every moment is a good moment to hold on to something of yourself.

## Who is Kurt Vandemaele?

Kurt Vandemaele was born on 8 March 1963 in Kortrijk, Belgium. At sixteen he was already writing for regional weeklies, at eighteen he was on the editorial staff of a daily newspaper. He was heard on free radio stations in Kortrijk and Ghent, contributed regularly to Radio 2 West-Vlaanderen and later Oost-Vlaanderen. At 24 he became a permanent contributor to Humo magazine, where he stayed for 24 years.

He went on to work for television, radio, and continued writing for daily, weekly, and monthly publications domestically and internationally. Over time he became increasingly interested in the stories of ordinary people — those who had nothing to sell, who didn't want to appear with a big photo in the newspapers.

The idea for udocu grew from a personal experience: watching his father become demented young and die far too early, and discovering that both parents had kept aspects of their personal stories hidden. The culture of silence they were products of created a distorted history. This inspired Kurt to record much more of our past — he interviews his loved ones and leaves his own experiences in unopened letters for his children.

## Services offered

1. **Personal documentary interviews**: Professional in-depth filmed interviews preserving your complete life story — your past, present, dreams, and reflections
2. **Family heritage documentation**: Capturing family histories, oral traditions, and generational stories before they are lost
3. **Cultural heritage preservation**: Documenting cultural practices, community traditions, and shared memories on the verge of being forgotten
4. **Digital time capsules**: High-quality video archives delivered on external hard drives, designed to grow in value over decades

## Who is udocu for?

- Anyone who wants to preserve their personal story for loved ones and future generations
- Families looking to document their heritage and create lasting memories
- Individuals at any age — from 21 to 95 — who want to capture who they are at this moment in time
- People who have lost loved ones and understand the value of recorded memories
- Communities wanting to preserve cultural practices and traditions

## Contact information

- **Name**: Kurt Vandemaele
- **Email**: Kurtvandemaele@udocu.be
- **Phone**: +32 475 73 11 56
- **Address**: André Devaerelaan 20, 8500 Kortrijk, Belgium
- **Website**: ${SITE_URL}
- **Languages**: Dutch (primary), English

## Site structure

- [Home](${SITE_URL}/en) — Main landing page with overview of all sections
- [About udocu](${SITE_URL}/en/about) — Detailed explanation of the udocu concept and services
- [Who Am I](${SITE_URL}/en/who-am-i) — Kurt Vandemaele's personal story and background
- [Work](${SITE_URL}/en/work) — Portfolio of documentary interviews and projects
- [Blog](${SITE_URL}/en/blog) — Stories, insights, and reflections on documentary storytelling
- [Contact](${SITE_URL}/en/contact) — Get in touch with udocu

## Frequently asked questions

### What does udocu mean?
"Udocu" combines "u" (you, in Dutch) with "docu" (documentary). It represents the concept of documenting you — your story, your life, your heritage.

### Where is udocu based?
Udocu is based in Kortrijk, Belgium, but serves clients throughout Belgium and beyond.

### What languages does udocu work in?
Udocu primarily works in Dutch but also offers services in English. The website is available in both Dutch and English.

### How much does a udocu interview cost?
Contact Kurt Vandemaele directly at Kurtvandemaele@udocu.be or +32 475 73 11 56 for pricing information.

### What do I receive after the interview?
You receive a complete time capsule on an external hard drive containing your professionally filmed interview. The result is entirely yours — you decide who sees it and when.

### At what age should I do an udocu interview?
Any age is a good time. Whether you're 21 or 95, every moment captures a unique version of who you are. Kurt recommends considering interviews at multiple life stages: 30, 37, 41, 46, 53, 60, 67, 75, 83, and 95.
`;

export function GET() {
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
