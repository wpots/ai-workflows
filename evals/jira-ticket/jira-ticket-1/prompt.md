---
tags: [jira-ticket, runnable]
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The response proposes one Jira Story, not yet created, whose body is at most 250 words with Description, Acceptance criteria, Visual design (the Figma frame) and Dependencies (the marketing copy), no user-story sentence, and at most 8 one-sentence acceptance criteria at capability level. It has no Tech notes section and none of the backlog item's file paths, function names, library names or slicing; the one thing the product owner must decide stays as a one-line open question. It asks which epic the story goes under without inventing a key, proposes flagging the story with a comment that gives that question as the reason and mentions the product owner, and says the draft needs the user's go before anything is created."
---

File a Jira story for this backlog item. Our tickets are in English. There is no
Jira access in this run: create nothing, and show me the ticket as you would
file it (type, summary, body) at the point where you would ask for my go.

````markdown
# Saved searches for the webshop

## Ticket

TBD — proposed story "Saved searches"

## Status

draft

## User story

As a returning customer, I want to save a search with its filters and be told
when new products match it, so that I do not have to repeat the same search
every week.

## Context

Customers who buy spare parts return to the same handful of searches: a brand,
a size range, a price ceiling. Support gets around forty mails a month asking
"can you tell me when the 12 mm hex bit sets are back in stock". The product
owner wants the webshop to answer that itself. Analytics show that 31% of
sessions start with a search the same visitor ran in the previous 30 days, and
that those sessions convert 2.4 times better than first-time searches, so the
repeat is real and worth shortening. The design is in Figma (page "Account",
frame "Saved searches") and the notification copy is still with marketing.
Saved searches build on the account area that shipped last quarter; a visitor
without an account is asked to sign in or register before saving.

## Acceptance criteria

1. On a search results page a signed-in customer sees a "Save this search"
   button next to the result count. A visitor who is not signed in sees the
   same button; pressing it opens the sign-in dialog and, after signing in,
   saves the search that was on screen.
2. Pressing the button saves the search text and every active filter (brand,
   size, price range, availability, sort order) as one saved search and shows a
   confirmation that names the saved search. The name defaults to the search
   text and, when the text is empty, to the first active filter.
3. A customer can rename a saved search to a name of at most 60 characters.
   Names do not have to be unique; two saved searches with the same name are
   shown in the order they were created.
4. A customer can have at most 20 saved searches. At the limit the button is
   disabled and explains why; deleting one re-enables it without a page reload.
5. Saving the same search text with the same filters twice does not create a
   second saved search; the customer sees "Already saved" and a link to it.
   Filters are compared as a set, so the order in which they were applied does
   not matter.
6. The account area gets a "Saved searches" page that lists every saved search
   with its name, its filters as readable chips and the number of products that
   match it now. Opening one runs the search with its filters applied.
7. The match count on that page is read when the page is opened and is never
   older than five minutes; it does not make the page slower than the order
   history page at the 95th percentile.
8. A customer can delete a saved search from the list. Deleting asks for no
   confirmation but offers an undo for ten seconds; after that the deletion is
   final.
9. A customer can choose per saved search whether to be notified by email when
   new products match it: never, daily or weekly. The default is weekly. A
   saved search the customer has never opened in 90 days is switched to
   "never" and the customer is told once.
10. The notification email lists at most ten new products with image, name and
    price, and a link to the full result. It is sent at 08:00 in the customer's
    time zone, falls back to Europe/Amsterdam when none is known, and is not
    sent when nothing new matches.
11. A product counts as new for a saved search when it became visible in the
    shop after the last notification for that search, or after the search was
    saved when none was sent yet. A product that is hidden and shown again is
    new again only after seven days.
12. Every notification email has a one-click unsubscribe link for that saved
    search and a link to all notification settings. The unsubscribe works
    without signing in and survives a forwarded email.
13. Deleting the customer's account deletes their saved searches and stops the
    emails within one working day. Exporting the customer's data includes the
    saved searches.
14. The list, the button and the email are available in Dutch and English, and
    follow the language of the customer's account; the filter chips use the
    names shown on the results page.

## Technical notes

- Add a `saved_searches` table (id, customer_id, name, query_text, filters
  jsonb, filters_hash, notify_frequency, last_notified_at, last_opened_at,
  created_at). Unique index on (customer_id, query_text, filters_hash); the
  hash is a SHA-256 over the filters sorted by key, built by
  `hashFilters()` in `src/lib/search/hashFilters.ts`.
- The button is a client component, `SaveSearchButton.tsx` in
  `src/modules/search/`, calling the server action `saveSearchAction` in
  `src/modules/search/saveSearchAction.ts`. Validate the payload with Zod
  (`savedSearchSchema`) before it reaches the repository in
  `src/lib/search/savedSearchRepository.ts`.
- The match count comes from `countMatches()` in the search adapter; cache it
  per saved search for five minutes with `unstable_cache` and the tag
  `saved-search-<id>`. Do not call Elasticsearch once per row: use one
  `_msearch` request for the whole page.
- The notification job runs as a Payload job (`sendSavedSearchDigests`) every
  15 minutes and picks up the customers whose local time is 08:00 using
  `Intl.DateTimeFormat`. Rendering uses React Email in
  `src/emails/SavedSearchDigest.tsx`; sending goes through the existing
  Postmark adapter. Rejected: a database trigger (cannot render email) and a
  per-customer cron (too many schedules).
- The unsubscribe link carries an HMAC-signed token (`signUnsubscribeToken()`,
  secret `UNSUBSCRIBE_TOKEN_SECRET`) so it needs no session.
- Undo on delete is optimistic in the client with `useOptimistic`; the server
  deletes after ten seconds through a delayed job, not a timer in the request.
- The 90-day rule runs in the same job as the digests, before sending.
- Not chosen: storing filters as columns (the filter set changes every release)
  and localStorage-only saved searches (lost across devices).

## Slicing

1. Table, repository and the save button with the duplicate check and the
   limit (criteria 1 to 5).
2. The account page with rename, delete and undo, and the match counts
   (criteria 3, 6, 7, 8).
3. The notification job, the email and the 90-day rule (criteria 9 to 11).
4. Unsubscribe, account deletion and export, translations (criteria 12 to 14).

## Blocked on

- The notification copy from marketing blocks slice 3's email text; the job and
  the layout can be built with placeholder copy.
- Whether customers may save a search while signed out and keep it after
  signing in (a guest saved search) is undecided; the product owner has to
  answer it. It blocks criterion 1's sign-in flow in slice 1.

## Out of scope

- Push notifications and SMS.
- Sharing a saved search with another customer.
- Saved searches for the B2B portal, which has its own search.
- Price-drop alerts on single products.
- Changing the search ranking.
- Admin reporting on saved searches.
- Migrating the wish list.
- Rate limiting the unsubscribe endpoint beyond the platform default.

## How to verify

- Save a search with three filters, reload, and see it in the account area.
- Save it again with the filters in another order and see "Already saved".
- Create 20 saved searches and see the button disabled; delete one and see it
  enabled.
- Set one to daily, import a matching product at 07:50, and see the email at
  08:00 with only that product.
- Open the unsubscribe link in a private window and see the setting change.
````
