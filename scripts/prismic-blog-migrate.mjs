/**
 * One-off Prismic content migration.
 *
 * Creates:
 *   - The real "Aangestipt / Marked" blog post (nl-be + en-us, dated today so
 *     it sorts first on the blog list, which orders by publish_date desc).
 *   - 5 clearly-labelled TEST posts ("TEST POST n — DELETE ME", tagged TEST),
 *     back-dated so they never outrank the real post.
 *
 * Requires a Prismic write token (Settings → API & Security → Migration API)
 * in .env.local as PRISMIC_WRITE_TOKEN.
 *
 * Run:  node --env-file=.env.local scripts/prismic-blog-migrate.mjs
 *
 * NOTE: created documents land in a "migration release" — publish it from the
 * Prismic dashboard to go live. This script does NOT delete the old placeholder
 * posts (Prismic has no delete API); remove those in the dashboard.
 */
import * as prismic from "@prismicio/client";

const repositoryName = process.env.NEXT_PUBLIC_PRISMIC_REPOSITORY;
const writeToken = process.env.PRISMIC_WRITE_TOKEN;

if (!repositoryName) {
  console.error("✗ Missing NEXT_PUBLIC_PRISMIC_REPOSITORY");
  process.exit(1);
}
if (!writeToken) {
  console.error(
    "✗ Missing PRISMIC_WRITE_TOKEN.\n" +
      "  Generate one in Prismic: Settings → API & Security → Migration API,\n" +
      "  then add it to .env.local as PRISMIC_WRITE_TOKEN=...",
  );
  process.exit(1);
}

// ── Rich-text helpers (Prismic StructuredText node format) ─────────────
const h1 = (text) => [{ type: "heading1", text, spans: [] }];
const p = (text) => ({ type: "paragraph", text, spans: [] });
const h2 = (text) => ({ type: "heading2", text, spans: [] });

// ── Real post ──────────────────────────────────────────────────────────
const PUBLISH_DATE = "2026-07-10";

const nlBody = [
  p(
    `Of het nu een regisseur, een schrijver of een acteur is, vaak hoor ik zij die broeden op een ei zeggen dat ze naar de wereld kijken in functie van wat ze te vertellen hebben. Zoals een moeder die een kind verwacht ook anders door het leven gaat. Zijn ze iets over agressie aan het maken, zullen ze speciaal oog hebben voor geweld en geweldenaars, hebben ze het over een soort lichtheid die veel te zeldzaam geworden is in onze wereld, gaan ze beter letten op de bloemetjes en de bijtjes, de blauwe hemels, een lachend kind of een pasgeboren lammetje dat tegen zijn mama schaap aanleunt. De ooi, jawel.`,
  ),
  p(
    `En zo ben ik al jaren alles aan het aanstippen wat met herinneringen te maken heeft, met mensen die op zoek zijn naar zichzelf, met mensen die niet kunnen praten of zich slecht voelen omdat er zoveel ongezegd is gebleven. De reden daarvoor zal wel ergens in mijn eigen verleden liggen.`,
  ),
  h2(
    `Udocu was eerder al een project in de roman die ik aan het schrijven ben`,
  ),
  p(
    `Mijn ouders blijven spoken in mijn geheugen, al het ongezegde dat wellicht nooit een obstakel had gevormd, hadden ze het maar eerder opgeruimd. Goeie mensen, daar niet van. Doodgoeie mensen. Maar zoals alle levende wezens moesten ze ook het leven in zonder gebruiksaanwijzing. Wellicht ben ik juist doordat er zoveel verleden is waar ik persoonlijk mee worstel, met Udocu begonnen. Ik zat al meer dan een decennium met dat project in mijn hoofd. Het hoofdpersonage in de roman die ik al een jaar of tien aan het schrijven ben, startte eerder de fictieve versie van Udocu op toen hij zijn job in de mediawereld kwijt geraakte. Toen hetzelfde me jaren later overkwam, besloot ik om hetzelfde te doen.`,
  ),
  h2(`Een boek kan je bekoren omdat het precies vertelt wat je nodig hebt`),
  p(
    `Udocu is er nu, maar ik blijf passages aanstippen die me helpen om te begrijpen waar ik mee bezig ben. Gedachten, fragmenten ook die aan een ander duidelijk kunnen maken wat ik doe en wat dat voor mijn klanten kan betekenen. Momenteel ben ik 'Wild van een woeste droom' aan het lezen, het nieuwste boek van de Duitse schrijfster Julia Schoch. Ik was immers redelijk wild van haar vorige: 'Het liefdespaar van de eeuw'. Haar nieuwste is iets minder, iets minder samenhangend, iets minder meeslepend, iets minder herkenbaar ook. Een boek kan je liggen omdat het precies vertelt wat je nodig hebt op het moment dat je het leest. Vandaar dat je soms helemaal weg kunt zijn van een verhaal dat je tien jaar later niets meer zegt of omgekeerd. Maar 'Wild van een woeste droom' mag me dan minder meeslepen, er staan toch passages in die ik gretig aanstip. Zoals deze.`,
  ),
  p(
    `Zo vertelt het hoofdpersonage hier dat het haar spijt dat ze niet beter heeft geluisterd naar de danser bij wie ze eerder logeerde. Als ze later haar verblijf bij hem voor de geest tracht te halen, ontbreekt het haar aan informatie waarmee ze haar herinneringen kan spekken. "Er zijn zoveel verhalen waar je niet in duikt. Omdat je te moe bent of het te druk hebt met andere dingen. Louter gemiste gesprekken die je niet kunt inhalen," zegt ze op pagina 132.`,
  ),
  h2(`Misschien laat het leven je niet toe om de vragen te stellen`),
  p(
    `En ja, dat stipte ik aan. Waarom? Omdat ik wel naar de verhalen luister die jij misschien gemist hebt omdat je destijds vergat de vragen te stellen. Misschien liet het leven je niet toe om die vragen te stellen. Je was de ouder die zoiets niet aan zijn of haar kind durfde te vragen. Of het kind dat bang was om iets te vragen wat je mama of papa niet op prijs zou stellen. Terwijl hij of zij misschien blij was geweest, had je die last van zijn of haar schouders gehaald. Als je nu een uitgebreid gesprek met jezelf laat vastleggen, geef je ongetwijfeld antwoorden op vragen die ooit zullen komen. Misschien ben je de antwoorden tegen die tijd vergeten, misschien vind je het dan moeilijk om ze uit te spreken of misschien wil je ze bij leven niet uitspreken, maar wil je dat na je dood je geliefden wel van jou te horen krijgen wat je toen niet gezegd kreeg.`,
  ),
  p(
    `Er zijn wel meer redenen om een 'Udocu' op te nemen.... Ik ga mijn gedachten daarover iets vaker met je delen.`,
  ),
];

const enBody = [
  p(
    `Whether it's a director, a writer or an actor, I often hear those who are brooding on an egg say that they look at the world in terms of what they have to tell. The way a mother expecting a child also moves through life differently. If they're making something about aggression, they'll have a special eye for violence and violent people; if they're dealing with a kind of lightness that has become far too rare in our world, they'll pay closer attention to the birds and the bees, the blue skies, a laughing child, or a newborn lamb leaning against its mother sheep. The ewe, indeed.`,
  ),
  p(
    `And so, for years now, I've been marking everything that has to do with memories — with people searching for themselves, with people who can't talk or who feel bad because so much has been left unsaid. The reason for that probably lies somewhere in my own past.`,
  ),
  h2(`Udocu was already a project in the novel I'm writing`),
  p(
    `My parents keep haunting my memory — all the unsaid things that might never have become an obstacle, if only they'd cleared them up sooner. Good people, no doubt about that. Thoroughly good people. But like all living beings, they too had to enter life without a manual. Perhaps it's precisely because there's so much past that I personally wrestle with that I started Udocu. I'd had that project in my head for more than a decade. The main character in the novel I've been writing for ten years or so first set up the fictional version of Udocu when he lost his job in the media world. When the same thing happened to me years later, I decided to do the same.`,
  ),
  h2(`A book can captivate you because it says exactly what you need`),
  p(
    `Udocu is here now, but I keep marking passages that help me understand what I'm doing. Thoughts, and fragments too, that can make clear to someone else what I do and what that can mean for my clients. At the moment I'm reading 'Wild van een woeste droom', the latest book by the German writer Julia Schoch. I was, after all, fairly wild about her previous one: 'Het liefdespaar van de eeuw' ('The Love Couple of the Century'). Her newest is a little less — a little less coherent, a little less gripping, a little less recognisable too. A book can suit you because it says exactly what you need at the moment you're reading it. That's why you can sometimes be completely swept up by a story that means nothing to you ten years later, or the other way round. But even if 'Wild van een woeste droom' grips me less, it still holds passages that I eagerly mark. Like this one.`,
  ),
  p(
    `Here the main character tells how she regrets not having listened better to the dancer she once stayed with. When she later tries to bring her stay with him to mind, she lacks the information to flesh out her memories. "There are so many stories you never dive into. Because you're too tired, or too busy with other things. Simply missed conversations that you can't make up for later," she says on page 132.`,
  ),
  h2(`Maybe life doesn't allow you to ask the questions`),
  p(
    `And yes, I marked that. Why? Because I do listen to the stories you may have missed because, back then, you forgot to ask the questions. Maybe life didn't allow you to ask them. You were the parent who didn't dare ask such a thing of their child. Or the child who was afraid to ask something your mum or dad wouldn't appreciate — when he or she might actually have been glad, had you lifted that weight off their shoulders. If you now have an extensive conversation with yourself recorded, you'll undoubtedly give answers to questions that will one day come. Maybe by then you'll have forgotten the answers, maybe you'll find them hard to say, or maybe you don't want to speak them while you're alive — but you do want your loved ones, after your death, to hear from you what you couldn't bring yourself to say back then.`,
  ),
  p(
    `There are plenty more reasons to record a 'Udocu'.... I'll be sharing my thoughts on that with you a little more often.`,
  ),
];

const migration = prismic.createMigration();

const realNl = migration.createDocument(
  {
    type: "blog_post",
    uid: "aangestipt",
    lang: "nl-be",
    data: { title: h1("Aangestipt"), body: nlBody, publish_date: PUBLISH_DATE },
  },
  "Aangestipt (NL)",
);

migration.createDocument(
  {
    type: "blog_post",
    uid: "aangestipt",
    lang: "en-us",
    data: { title: h1("Marked"), body: enBody, publish_date: PUBLISH_DATE },
  },
  "Marked (EN)",
  { masterLanguageDocument: realNl },
);

// ── 5 TEST posts (back-dated so the real post stays first) ──────────────
for (let i = 1; i <= 5; i++) {
  const date = `2026-07-0${i}`;
  const testNl = migration.createDocument(
    {
      type: "blog_post",
      uid: `test-post-${i}`,
      lang: "nl-be",
      tags: ["TEST"],
      data: {
        title: h1(`TEST POST ${i} — DELETE ME`),
        body: [
          p(
            `Dit is een TESTBERICHT (${i}). Veilig om te verwijderen — enkel bedoeld om de bloglijst te vullen.`,
          ),
        ],
        publish_date: date,
      },
    },
    `TEST POST ${i} (NL)`,
  );
  migration.createDocument(
    {
      type: "blog_post",
      uid: `test-post-${i}`,
      lang: "en-us",
      tags: ["TEST"],
      data: {
        title: h1(`TEST POST ${i} — DELETE ME`),
        body: [
          p(
            `This is a TEST POST (${i}). Safe to delete — only here to populate the blog list.`,
          ),
        ],
        publish_date: date,
      },
    },
    `TEST POST ${i} (EN)`,
    { masterLanguageDocument: testNl },
  );
}

// ── Submit ───────────────────────────────────────────────────────────
const writeClient = prismic.createWriteClient(repositoryName, { writeToken });

console.log(
  `Submitting migration to "${repositoryName}": 1 real post (nl+en) + 5 test posts (nl+en) = 12 documents…`,
);

await writeClient.migrate(migration, {
  reporter: (event) => {
    if (
      event.type === "documents:created" ||
      event.type === "documents:updated"
    ) {
      console.log(`  ${event.type}`, event.data ?? "");
    }
  },
});

console.log(
  "\n✓ Migration submitted.\n" +
    "  Next: open the Prismic dashboard → Releases → publish the migration release.\n" +
    "  Then delete the old placeholder posts (Blog post 1–6 / New blog post) in the dashboard.",
);
