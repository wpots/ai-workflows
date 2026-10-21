// Fictional Jira data for the demo recordings: project DEMO ("Demo Shop").
// Read by ./bin/jira. Nothing here exists in a real Jira.

const SITE = "https://demo-shop.atlassian.net";

const PEOPLE = {
  wieteke: { displayName: "Wieteke Pots", emailAddress: "wieteke.pots@greenberry.nl", accountId: "demo-wp" },
  robin: { displayName: "Robin Jansen", emailAddress: "robin.jansen@demo-shop.example", accountId: "demo-rj" },
  noor: { displayName: "Noor Bakker", emailAddress: "noor.bakker@demo-shop.example", accountId: "demo-nb" },
  po: { displayName: "Sanne de Wit", emailAddress: "sanne.dewit@demo-shop.example", accountId: "demo-sw" },
};

const ME = PEOPLE.wieteke;

const SPRINTS = [
  { id: 1515, name: "DEMO Sprint 15", state: "closed", boardId: 42, startDate: "2026-09-21T08:00:00.000Z", endDate: "2026-10-02T16:00:00.000Z", completeDate: "2026-10-02T15:40:00.000Z", goal: "Zoeken en voorraad live" },
  { id: 1516, name: "DEMO Sprint 16", state: "active", boardId: 42, startDate: "2026-10-05T08:00:00.000Z", endDate: "2026-10-16T16:00:00.000Z", goal: "Checkout 2.0, eerste helft" },
  { id: 1517, name: "DEMO Sprint 17", state: "future", boardId: 42, startDate: "2026-10-19T08:00:00.000Z", endDate: "2026-10-30T16:00:00.000Z", goal: "" },
];

const EPICS = {
  "DEMO-100": "Checkout 2.0",
  "DEMO-101": "Vindbaarheid",
  "DEMO-102": "Klantaccount",
};

// type, status, assignee, sp (story points), sprints (ids), epic, prio, labels,
// created, description (markdown-ish text), links, comments
const ISSUES = [
  // Sprint 15 — closed
  { key: "DEMO-120", type: "Story", summary: "Productpagina toont voorraadstatus", status: "Done", assignee: "wieteke", sp: 5, sprints: [1515], epic: "DEMO-101", created: "2026-09-08",
    description: "Als bezoeker wil ik op de productpagina zien of een product op voorraad is, zodat ik niet pas in de checkout teleurgesteld word.\n\nAcceptatiecriteria\n- Op voorraad, beperkt (< 5) of uitverkocht\n- Uitverkocht: de knop 'In winkelwagen' is uitgeschakeld" },
  { key: "DEMO-121", type: "Story", summary: "Zoeken op productnaam", status: "Done", assignee: "robin", sp: 8, sprints: [1515], epic: "DEMO-101", created: "2026-09-08",
    description: "Als bezoeker wil ik op productnaam zoeken, zodat ik snel vind wat ik zoek." },
  { key: "DEMO-122", type: "Bug", summary: "Winkelwagen telt verkeerd na verwijderen van een product", status: "Done", assignee: "wieteke", sp: 3, sprints: [1515], epic: "DEMO-100", prio: "High", created: "2026-09-15",
    description: "Na het verwijderen van een product blijft het aantal in het winkelwagenicoon staan.\n\nStappen\n1. Voeg twee producten toe\n2. Verwijder er één\n3. Het icoon toont nog 2" },
  { key: "DEMO-123", type: "Task", summary: "Upgrade naar Next.js 16", status: "Done", assignee: "noor", sp: 3, sprints: [1515], created: "2026-09-10",
    description: "Upgrade de webshop naar Next.js 16 en los de deprecation warnings op." },

  // Sprint 16 — active, ends 16 October
  { key: "DEMO-130", type: "Story", summary: "Checkout-overzicht met btw per regel", status: "Done", assignee: "wieteke", sp: 5, sprints: [1516], epic: "DEMO-100", created: "2026-09-29",
    description: "Als klant wil ik in het checkout-overzicht per regel de prijs, het aantal en de btw zien, zodat ik weet wat ik betaal.\n\nAcceptatiecriteria\n- Per regel: product, aantal, prijs, btw-tarief\n- Totaal excl. en incl. btw\n- Bedragen in Nederlandse notatie" },
  { key: "DEMO-131", type: "Story", summary: "Prijzen in Nederlandse notatie", status: "Done", assignee: "wieteke", sp: 2, sprints: [1516], epic: "DEMO-100", created: "2026-09-29",
    description: "Als klant wil ik prijzen zien als € 12,50 en € 1.234,56, zoals ik gewend ben.\n\nAcceptatiecriteria\n- Komma als decimaalteken, punt als duizendtalscheiding\n- Overal waar een prijs staat" },
  { key: "DEMO-132", type: "Story", summary: "Kortingscode invoeren in de winkelwagen", status: "In Progress", assignee: "wieteke", sp: 8, sprints: [1516], epic: "DEMO-100", created: "2026-09-29",
    description: "Als klant wil ik een kortingscode invoeren in de winkelwagen, zodat de korting direct zichtbaar is.\n\nAcceptatiecriteria\n- Geldige code: korting zichtbaar als aparte regel\n- Ongeldige of verlopen code: duidelijke foutmelding\n- Eén code per bestelling" },
  { key: "DEMO-133", type: "Bug", summary: "Afbeeldingen zonder alt-tekst op de categoriepagina", status: "Done", assignee: "noor", sp: 2, sprints: [1516], prio: "High", labels: ["a11y"], created: "2026-10-01",
    description: "De productafbeeldingen op /categorie/* hebben geen alt-tekst. Schermlezers lezen de bestandsnaam voor." },
  { key: "DEMO-134", type: "Task", summary: "Lighthouse-score productpagina boven 90", status: "In Review", assignee: "robin", sp: 3, sprints: [1516], labels: ["performance"], created: "2026-10-01",
    description: "Performance-score op mobiel is nu 74. Doel: boven 90. Grootste winst: LCP-afbeelding en ongebruikte JS." },
  { key: "DEMO-142", type: "Bug", summary: "Bezorgkosten verdwijnen na wisselen van land", status: "In Progress", assignee: "wieteke", sp: 3, sprints: [1516], epic: "DEMO-100", prio: "High", created: "2026-10-09",
    description: "Wie in de checkout het bezorgland wisselt van Nederland naar België, ziet de bezorgkosten verdwijnen. Het totaal klopt dan niet meer.\n\nStappen\n1. Voeg een product toe en ga naar de checkout\n2. Kies als land België\n3. De regel 'Bezorgkosten' is weg, het totaal is € 6,95 te laag\n\nVerwacht: bezorgkosten voor België (€ 6,95) blijven zichtbaar en tellen mee.",
    comments: [{ author: "po", created: "2026-10-09T14:12:00.000Z", body: "Gemeld door twee klanten via de klantenservice. Graag deze sprint." }] },

  // Sprint 17 — future
  { key: "DEMO-140", type: "Story", summary: "Verlanglijstje bewaren tussen sessies", status: "To Do", assignee: "wieteke", sp: 5, sprints: [1517], epic: "DEMO-102", created: "2026-10-06",
    description: "Als bezoeker wil ik dat mijn verlanglijstje bewaard blijft als ik later terugkom, ook zonder account." },
  { key: "DEMO-141", type: "Story", summary: "Producten vergelijken (maximaal drie)", status: "To Do", assignee: "robin", sp: 13, sprints: [1517], epic: "DEMO-101", created: "2026-10-06",
    description: "Als bezoeker wil ik tot drie producten naast elkaar vergelijken op prijs, specificaties en reviews." },
  { key: "DEMO-143", type: "Story", summary: "Cadeaubon als betaalmiddel", status: "To Do", assignee: "wieteke", sp: null, sprints: [1517], epic: "DEMO-100", created: "2026-10-08",
    description: "Als klant wil ik met een cadeaubon (deels) betalen.\n\nOpen vragen\n- Welke aanbieder?\n- Mag het restant op de bon blijven staan?" },
  { key: "DEMO-144", type: "Task", summary: "Foutmeldingen uit de checkout naar #demo-shop-alerts", status: "To Do", assignee: "noor", sp: 1, sprints: [1517], created: "2026-10-07",
    description: "Stuur fouten uit de checkout als alert naar het Slack-kanaal #demo-shop-alerts." },
  { key: "DEMO-145", type: "Story", summary: "Bezorgmoment kiezen in de checkout", status: "To Do", assignee: "wieteke", sp: null, sprints: [1517], epic: "DEMO-100", created: "2026-10-08",
    description: "Als klant wil ik in de checkout een bezorgdag en tijdvak kiezen.",
    links: [{ type: "Blocks", inward: "DEMO-142" }] },

  // Backlog
  { key: "DEMO-150", type: "Story", summary: "Bestelgeschiedenis in het klantaccount", status: "To Do", assignee: null, sp: null, sprints: [], epic: "DEMO-102", created: "2026-10-10",
    description: "Als klant wil ik in mijn account mijn eerdere bestellingen zien." },
];

module.exports = { SITE, PEOPLE, ME, SPRINTS, EPICS, ISSUES, NEXT_KEY: 151 };
