# Product decisions

*Decisions that constrain how Coherence behaves, kept with their reasoning so later work can change the implementation without breaking the reason. Newest first. Implementation choices (how a sheet is cut, which table holds what) belong in the engineering log, [`docs/decisions.md`](../decisions.md). § numbers refer to the [Product Vision](../philosophy/product-vision.md).*

**Each entry:** Decision · Rationale · Implications · Principle · Replaces. A superseded or contested entry stays where it is, marked, with a link. Where a rationale is Claude's reading and not Chanté's words, it says so.

---

## 2026-09-13 · Lumi sees roughly the last 30 to 40 messages

**Decision.** Each turn, Lumi sees roughly the last 30 to 40 messages of the conversation, not a fixed 30. What's older reaches her as recent memory and through the Library, as before.
**Rationale.** From the code review (B9): a window that drops its oldest message every turn changes every request, so none of the conversation could be reused between turns and each reply waited on the whole history again. Letting the window move in steps keeps it the same for several turns, so replies come sooner and cost less. Chanté chose to update the canon to match (2026-09-13).
**Implications.**
- She never sees less than she did; sometimes up to nine messages more.
- The canon states the window as a range (`philosophy/lumi.md` §6). The principle of *Coherence remembers; Lumi understands* stands: when a cap bites, add retrieval, never a bigger window.

**Principle.** *Coherence remembers; Lumi understands* (below).
**Replaces.** "The last 30 messages" in `philosophy/lumi.md` and in *Coherence remembers; Lumi understands*.

## 2026-09-13 · Their word has to be theirs, and only their word brings back what was forgotten

**Decision.** Lumi treats something as the person's own word only when what she quotes carries what they meant: a real phrase of theirs (three words that say something), or most of a short message ("forget that", "keep that for the book"). A couple of words lifted out of a longer message are her reading, not their word. Something they asked her to forget comes back only when they ask for it again in their own words; her inferences and the between-visits filing never bring it back.
**Rationale.** From the code review (B4, 2026-09-13), not a new ask from Chanté. *(Claude's reading: "their word" is what lets a note outrank Lumi's guesses and lets a placement stand against later tidying. If two stray words can unlock it, explicit and inferred stop being distinguishable — the seam the AI & information architecture says to keep, §57 — and a forgotten thread could come back through a loose quote, which is worse for trust than asking once more.)*
**Implications.**
- More of what Lumi keeps from conversation is marked as her reading rather than their word; their corrections and forgetting still go through on a real quote.
- A thread, note or belief they had forgotten can be recreated through Lumi when they ask again in words she can quote; a loose fragment, a guess of hers or consolidation can't. Their later word is the more recent decision, and it wins.
- Where they tell her a thread belongs still counts as their placement, which she and consolidation won't move.

**Principle.** AI & IA §57 (explicit information ≠ inference), §61 (can we understand where consequential information came from?).
**Replaces.** The eight-character quote rule of Lumi's memory (engineering log, *Lumi's memory: their word checked in code*).

## 2026-09-13 · Plan with Lumi is scrapped; what they say matters this week is remembered

**Decision.** There is no Plan with Lumi on Today. When someone tells Lumi what matters more than the rest — this week, next week, or for a while — she holds it as a **stated priority**, and Today's path weighs it until the week ends or they say otherwise. A real deadline today can still come first, and Lumi says so.
**Rationale.** Chanté: "Let's actually scrap plan with lumi", then "Keep priorities". Earlier, on the proposal, she said Lumi "should absolutely remember" what matters this week. *(Claude's reading:)* priorities need nothing on the page: they come from what's said, so they fit a Today that stands on its own (`today-garden.md` §143).
**Implications.**
- User-expressed priority is kept apart from Lumi's recommendation and from urgency (`shared-model.md` → Priority and temporal scope). It has a scope — this week, next week, for a while — and never an invented date; a week's priority stops holding on its own, with nothing to clear.
- Nothing asks the user to set, rank or review priorities, and nothing shows or counts them. Changing or dropping one is saying so. How Lumi shows what she's holding stays open question 12.
- *Today does its own organising* (below) stands whole: nothing on Today sends you to Home. The rejection of a Replan button stands too.
- Settles part of open question 11: representation, expiry and supersession.

**Principle.** V§4 and EP§1 (the system does the organising), V§5 and EP§5 (Lumi proposes; the user corrects), EP§3 (show less than you know).
**Replaces.** Makes final "Plan with Lumi is not being built" in *Today does its own organising, and focus sessions are set aside for now* (below).

---

## 2026-09-13 · When something feels too big, Lumi asks before she hands over a step

**Decision.** Told in words that something feels too big, Lumi asks one short question about what makes it big (all of it, one part, or just today) before offering anything, then answers that: a smaller piece, a different thing, or letting it wait.
**Rationale.** Chanté, trying "this one feels too big" from the bubble on Today: "She gave me instructions on how to do it" (Lumi had said *Just go over to the compost container. You don't need to carry it out yet.*, the smallest piece). Asked what she'd have wanted, she chose one question first.
**Implications.** Lumi's persona (*What you're for* → Starting) and `lumi.md` §5 and §14. Today's card is unchanged: *Not this → Too big* still swaps in the smallest thing at once, and *Break it down* still offers steps to pick from, because those are choices the user made by tapping. The *Break it down* quick start in chat still goes straight to a first action: asking for a breakdown is the answer to the question.
**Principle.** Diagnose before prescribing (`lumi.md` §15, run 1); resistance changes the plan (EP§7); starting is its own problem (EP§10); one decision at a time (EP§3).
**Replaces.** *Too big: the smallest piece* as the first reply in conversation (`lumi.md` §14, from the removed *Not this* persona section).

---

## 2026-09-13 · Files shared with Lumi are read, not kept

**Decision.** On Home, a photo, a screenshot, a PDF or a text file can go with a message. Lumi reads it on that turn and does with it what she'd do with the same words: files what needs doing, answers what was asked. The file itself isn't kept. The conversation keeps a note that something was shared, by name, and later Lumi says she can't see it rather than guess.
**Rationale.** Chanté's ask, and her three calls: photos, PDFs and text files; read, don't keep; Home's composer only. *(Claude's reading: a photo of a sticky note or a whiteboard is a brain dump without the typing. Keeping the files would start an archive of uploads nobody asked to manage. It is the mail rule, a line per thing and never the mail, applied to files.)*
**Implications.**
- No page shows past files: nothing to browse, name or delete.
- The companion bubble and the Lists add-line stay words-only.
- Asking about a file shared earlier means sharing it again.

**Principle.** V§4, EP§1, EP§23.
**Replaces.** The composer's *Add file* placeholder, hidden 2026-09-12 as a dead control.

---

## 2026-09-13 · Today does its own organising, and focus sessions are set aside for now

**Decision.** Nothing on Today sends you to Home. *Not this* re-cuts the path on the card and shows what fits instead, with Lumi's one line on why; *Break it down* shows a few small steps on the card to pick the first from. *Start with Lumi* and focus sessions — the session bar, check-ins, the abandoned-session greeting and the *Body double* quick start — are removed from the product for now. Plan with Lumi is not being built.
**Rationale.** Chanté: "Right now all the options on the today page just direct you to the home page chat. I'd really like to find a way to keep all that organizing on the Today page." Asked, she chose to "get rid of the start with lumi and focus sessions for now", and for *Not this* and *Break it down* to happen on the card without a conversation. On Plan with Lumi: "It was small and easy to miss. I wasn't a huge fan of the options either." *(Claude's reading:)* the Garden "should stand on its own as an immediately understandable surface" (`today-garden.md` §143), and leaving the page to change the plan was the opposite.
**Implications.**
- **This departs from the canon, and knowingly.** The Study (`focus-study.md`: accompaniment, containment, meaningful outcomes and leaving), Lumi's body-doubling role (`lumi.md`, V§7) and M5's outcome loop have no surface in the app now. The canon is unchanged — it is still the intended direction — and open question 2 now includes what a session is when it returns. Session reflection, the only automatic link between a way in and its outcome, is dormant; completions, declines and re-entry remain.
- Lumi initiates nothing: check-ins were the one unprompted thing she did (open question 9).
- Correction stays cheap (EP§6): a decline is one tap and a first step one more, and neither needs explaining.
- The table, its rows and the domain code are kept so sessions can come back without a migration.

**Principle.** EP§1 (the system does the organising), EP§2–4 (one decision at a time, on the surface you're on), EP§18 (one understanding across spaces: the decline and the step still reach Lumi), §143 of the Garden.
**Replaces.** *Today's handoffs into chat* (2026-09-12, `today.md`) and the product surface of M5 *Focus Together*.

---

## 2026-09-13 · Lumi may name time away when it helps someone get their bearings

**Decision.** In conversation, Lumi may say how long someone has been away when that helps them orient, as in the model strategy's *"You disappeared for four days. We don't need to reconstruct the four days."* She never does it in a way that makes the absence feel like a debt. Counts of what's undone stay out, and so does any tally of what piled up. Pages show neither.
**Rationale.** Chanté adopted the recommendation from review feedback she relayed ([open question 17](open-questions.md)). The persona's "never say how long it's been" contradicted the model strategy's own example, and in voice eval run 5 Lumi echoed a user's "two weeks" while declining to reconstruct them, which oriented rather than accused. *(Claude's reading: a number is judged by whether it adds burden or costs agency, and a gap named in order to set it down does neither; a count of what's undone is still a bill.)*
**Implications.**
- The persona ("What you're for" and *Coming back*) and the context block's re-entry line allow it.
- The day plan's line on Today still never names the gap. A page isn't a conversation, and widening that is Chanté's call.
- Open question 17 is settled for time away. Whether a count may appear inside a noticed pattern ("you've moved this three times") stays open.

**Principle.** V§8, V§12, EP§8; model strategy.
**Replaces.** "Never … say how long it's been" (persona → *Coming back*) and "Don't mention how long it's been unless they do" (context block).

## 2026-09-13 · Mail is switched off, for now

**Decision.** Lumi doesn't read mail, and Insights leaves the nav, until mail comes back. The code stays, behind one switch (`MAIL_ON` in `src/core/email/types.ts`).
**Rationale.** Chanté asked: "If I turn off the mail integration, will users still get a warning when they create an account?", then asked for the app side of it. *(Claude's reading:)* reading Gmail is a restricted Google scope. While the app asks for it, Google sign-in can't be published without Google's security review: anyone off the test list is blocked, and test users see the unverified-app screen. Without it, the consent screen can be published with no review, so signing up with Google stops being a warning before the product has begun.
**Implications.**
- Nothing new for the user to keep; the Connect Google chip, which came back about weekly in Testing, goes with it.
- Leads already noticed stay stored, unanswered, and nothing shows them while mail is off. Turning it back on brings them back.
- Mail returning means Google's verification for `gmail.readonly`. Where mail would live is still open question 4.

**Principle.** The one question (does this reduce executive-function burden?): a blocked or alarming sign-up is burden before the product begins.
**Replaces.** Suspends *Mail is a look, not an inbox* (below) while mail is off. That entry stays as the design for when it returns.

---

## 2026-09-13 · Threads that become categories become sections of the Library

**Decision.** A thread can sit under a broader thread. A thread that holds threads is a **section** of the Library; inside a section, a thread that holds threads of its own is a **shelf**; the threads are **books**, titled with their names. Three levels at most. Lumi does the arranging between visits, conservatively, and the user corrects it by saying where something belongs. The Library shows the sections on its bookcases, and a section opens to its shelves and books; a book opens to where the thread stands.
**Rationale.** Chanté: "I'd like you to keep building on lumi's memory system, and incorporate it into the library. Threads that become categories should gain their own section in the library. Eventually you'll be able to click on the different sections and see all the books that are there. The title of the books will be all your threads." Her mockup opens a thread as a book: *Library › Coherence › Memory & Continuity › AI Continuity & Identity*, with *Where we've arrived*, *What we've settled — for now*, *Still alive* and *How this thread changed*. *(Claude's reading:)* this is Library §17 ("Coherence may begin as an item under Ideas. Over time, it becomes substantial enough to have its own section") and §55 (structure emerges conservatively), and it answers the presentation half of spatial-map question 7: a Collection and a Thread Group are threads, not a separate filing layer.
**Implications.**
- Nothing is named, filed or kept by the user. A section's name is the thread's name, the words they use; it appears only once two threads belong under it. A thread Lumi shelved stays put, and a placement the user makes is never undone by Lumi.
- Being a section is derived from what a thread holds, never stored, so a section disappears on its own if everything leaves it.
- One place per thread for now. Cross-links (Library §34) are not built.
- Which bookcase a section takes is presentation (the order sections arrived), not data. The slot count, the alcove, painted close-ups, Lumi's size in the room and the stage remain open (question 3).
- Correction is in words only for now. Dragging in the Library remains open (`ef-burden-log.md`).
- Forgetting a section forgets that thread only; what was in it becomes loose.

**Principle.** V§4 and EP§1 (the system does the organising), EP§6 (correction beats configuration), EP§2–4 (progressive disclosure: room → section → shelf → book), EP§17 (a note shows whether it is their word or Lumi's reading), Library §17, §25–28, §33, §39, §55.
**Replaces.** "Collections, Thread Groups, shelves and a Library page stay open" in *Recent conversation lives on…* (below), for the presentation model only.
**Confirmed.** Chanté, 2026-09-13, as a working version. On what a section is: "A section is like a category. It might be yoga, cooking, the title of a book they're writing, some area of focus — something they keep mentioning in various ways. It's what threads fall under." On placement: the names on the bookcases in arrival order, parchment over the room and the table page stand as a working version. The proper integration into the room waits ("Let's wait to integrate it properly"), and so do the spatial map's remaining questions. Until then, the same day: the rooms stay bare, and the categories and threads show only in a hidden debug mode, as parchment over the rooms (Chanté: "a debug mode button somewhere hidden that, when turned on, shows the categories and threads as parchment over the rooms").

---

## 2026-09-13 · Lumi carries the philosophy, in a brief sent with every call

**Decision.** A synthesis of the canon written for Lumi, [`docs/philosophy/lumi-brief.md`](../philosophy/lumi-brief.md), is part of her cached prompt prefix: the conversation, the day plan and the mail leads all carry it. It holds the *why* (the problem Coherence exists for, *Coherence remembers; Lumi understands*, the division of labour, what starting, resistance, capacity and return are like, presence, what she is not, the places); the persona keeps the *how*. Only settled canon goes in, never *proposed* sections, ideas or open questions. It is reviewed when a source changes (`npm run check` fails until it is), when evidence shows her misreading the philosophy, and at least monthly.
**Rationale.** Chanté: "I'd really like Lumi to have access to the philosophy of this project … make sure that's part of her context. This should be periodically reviewed and updated." *(Claude's reading: the persona's rules cover the situations they name, and the philosophy is what lets her judgement hold in the ones they don't. Written down and reviewed, it keeps who she is in Coherence's documents rather than in whatever one model happens to do.)*
**Implications.**
- Her prompt prefix roughly doubles, from about 2,050 tokens to about 4,000. It is cached, so the cost falls mostly on the first call; the brief's size limit is in the doc.
- **A tension with the model strategy**, which warns against defining Lumi "entirely through one enormous system prompt". The brief is generated from documented canon, reviewed against it and checked by evaluation, so her identity still lives in the documents; the prompt only carries it. If it needs to grow much, the answer is retrieval, not a longer prefix.
- The canon's other rule holds in the prompt too: it may never teach the user its vocabulary or methodology (EP§19).
- The reflection step, which only proposes belief operations, doesn't carry it.

**Principle.** Model strategy (*Lumi should not be model-dependent*), V§4–5, V§21, EP§19.
**Replaces.** The persona as the only part of Coherence's thinking she was sent.

---

## 2026-09-13 · A date is typed the way it's said, and a day is not an appointment

**Decision.** A task gets a date on the Lists sheet by tapping its date column and typing it as you'd say it — *fri*, *sep 30*, *in two weeks* — with no calendar to operate; it shows as *Today*, *Tomorrow* or *Sep 30* once saved. Only days for now, no times. A task with a day but no time stays an ordinary task on that day: it can be Right now, and Today treats being due as a reason to put it first. Only a task with a time is a fixed commitment under Later.
**Rationale.** Chanté's ask: "an easy way to do that that doesn't involve a calendar dropdown … click the empty date column for that item. Then it should auto format after it sends", and "leave time for now". *(Claude's reading:)* an essay due Friday is something to do on Friday, not an appointment at midnight; treating it as one would have taken it off the path on the very day it matters.
**Implications.**
- Giving a date is optional correction (EP§6); saying it to Lumi still works and means the same thing (`shared-model.md` → equivalent actions).
- A date that has gone by is still only its date (*Never a count of what's undone*).
- Vague spans (*next week*) aren't turned into a day (`shared-model.md`: do not invent a precise date). Whether Coherence should hold a *this week* kind of date is not decided.
- Times, when they come, need a way to tell a day from a fixed time that isn't midnight by convention.

**Principle.** EP§6 (correction beats configuration), V§12 (no failure states), EP§3 (show less than you know).
**Replaces.** Nothing; before this, dates came only from conversation, and a dated task was treated as fixed-time on its day.

---

## 2026-09-13 · Recent conversation lives on, and what mattered is filed in the Library

**Decision.** Lumi's memory keeps recent conversation after it scrolls away and keeps revising it: a short memory of each visit and, for the subjects that run through the user's life, a Library thread with a summary Lumi rewrites and a growing archive of notes. When a subject comes up again, Lumi has its summary and the parts of the archive that bear on the moment. Threads are life-model objects. Forgetting something never scrubs the conversation.
**Rationale.** Chanté: "recent conversations should live on in lumi's memory … periodically revised, with things that are meaningful getting recorded in their rightful category (this will be the library). For instance if I talk to lumi about a book I'm writing very often, when I bring it up interesting things about it she should record those thoughts in a growing archive. Then when I bring up the topic next time, she should have access to a quick summary, and any other relevant parts of that archive." And: "Forgetting should not scrub the conversation." *(Claude's reading: this is the canon's Thread — persistent context across fragmented activity, AI & IA §3 and §41, Library §12–16 — arriving through conversation first, before any room presents it.)*
**Implications.**
- The first answer to open question 22: threads become structure first. Collections, Thread Groups, shelves and a Library page stay open (question 3; the presentation half of spatial-map question 7).
- Structure emerges conservatively (Library §55): a thread appears only for a subject the user spent real time on or came back to. Nothing is filed, named or reviewed by the user.
- Current understanding and history stay distinct (Library §33): a note that changed is superseded, not overwritten.
- Privacy waits (Chanté: "let's not worry about privacy yet"): personal details are kept like anything else. Secrets and instruction-like text are still never stored.
- Recall is by words for now. Meaning-based recall is the next layer, grown and refined as development goes (Chanté: "something I would like to grow and refine as we develop").

**Principle.** V§16–17, EP§18; *Coherence remembers, Lumi understands*; AI & IA §24–26; Library §12–16, §20–24, §33, §55.
**Replaces.** The M6 plan's rolling conversation summary ([engineering log](../decisions.md), same date).
**Confirmed.** Chanté, 2026-09-13, after it landed.

## 2026-09-13 · Lists is in the nav again, as a sheet over the page you're on

**Decision.** A sixth icon on the rail, **Lists**, brings up everything on the user's lists on one sheet over whatever page they're on: the lists as tabs and a side column, Completed, two quick views (Today, Due soon), search, a ⋯ on each row to move it to another list or let it go, and **Add task**, which is one line to Lumi, who files it. There are no counts, no Overdue view, no sort or filter. The Library keeps its name and stays its room.
**Rationale.** Chanté's ask, with `art/mockups/lists-mockup.png`: "a new icon to the nav bar for lists, that brings up all your todos." Asked where the mockup met settled decisions, she chose: a sheet over the page rather than its own page or a panel inside the Library; counts and Overdue left out (*Never a count of what's undone*, *no overdue debt*); search plus Add through Lumi rather than a form, sort and filter; the icon after Today. On review she moved it below the Library, with a soft divider between them: "I'd like to separate the rooms from the tools."
**Implications.**
- Full lists are visible somewhere again, which answers the canon difference noted on *Lists is called the Library* (EP§18: full lists live in Lists rather than appearing everywhere).
- The nav is grouped: the rooms (Home, Today, Library), then the tools (Lists, Insights), then Settings, a utility, each group set apart by a soft break. A new entry is placed by which it is: a place to be, or something to use from any place.
- Lists and the Library are both in the nav. *(Claude's reading: Lists is not a new space but a sheet over the place you're in (spaces §44–45); the Library remains where the broader shape — Threads, history — becomes navigable, open question 3.)* Open question 15 now reads Home / Today / Lists / Library / Insights / Settings.
- A date that has gone by is only its date: it isn't red, isn't collected in a view, and doesn't top the list.
- Moving a row and letting it go are corrections (EP§6, EP§16): each is an event marked as the user's, and Lumi sees it in her next turn. Adding goes through Lumi, so the user never sets a list or a date.
- Lumi steps out of view while the sheet is open; she is one line away through Add task. Whether she should stay visible beside it is Chanté's to review.
- The mockup's closing quote ("Small steps still move the stars") was left off (Principle 13, `today.md` → Cut from the mockup); an ornament sits there.

**Principle.** EP§18 (one understanding across spaces), EP§2–4 and V§11 (show less than you know), V§3 and V§12 (no red counts or failure states), EP§5–6 and EP§16 (correction beats configuration).
**Replaces.** The list-view half of *Lists is called the Library, and for now it is only its room*, below: "no page shows them; filing, ticking and correcting happen in conversation." The Library's name and room stand.

## 2026-09-13 · The lantern is Lumi's

**Decision.** Lumi stays hands-free most of the time, but the lantern is hers, not one prop among many: she often picks it up, and often sets it down again. Beyond the lantern, she engages with and picks up many things in her world.
**Rationale.** Chanté: "she should be hands free, but the lantern is hers, and she picks it up often. But also puts it down. Ultimately I would like lumi to engage with and pick up lots of things." *(Claude's reading: the lantern keeps its place in who she is, the warm light she carries, without tying up her hands; handling things is how she lives in the places.)*
**Implications.**
- She has two resting states, empty-handed and holding her lantern, each with its own quiet idle, and a movement between them each way.
- Handling an object is ordinary for her, not a special effect, so making a new one has to be cheap (`animation-pipeline.md`).
- Her small idle life may be moved by code (`art-direction.md` bet 2), but she is never fully still: breathing and a slow sway stay (Chanté: "still want some sway/breathing motion"; `design/motion-and-interaction.md` §12).
- Where the lantern rests when she sets it down is open.
**Principle.** Lumi inhabits her world (spaces §19, §29); a nearly invisible base idle and a shared rest pose (motion §12, §15).
**Replaces.** Refines *Lumi is hands-free most of the time* (below), which called the lantern one of the things she picks up, "like a book or a cup".

## 2026-09-13 · On a phone, the nav is a bar along the bottom with its names showing

**Decision.** Below 768px the rail becomes a bar along the bottom of the screen: the five icons, each with its name under it, the place you're in marked with a star. Nothing opens, pins or locks there.
**Rationale.** Chanté's ask, from her phone: move the nav to the bottom. *(Claude's reading: a phone has no hover, so the names were a tap on the compass star away; with the bar's width there is room for them, and showing them removes that tap. This sits beside her desktop preference for icons with expandable names rather than against it.)* Chanté approved the bar with the names on it on review.
**Implications.**
- The rule stands: an icon's name is always reachable. On a phone it is simply always visible.
- Pin and lock are desktop behaviours only; nothing on a phone depends on them.
- The page and the composer stop above the bar; nothing is drawn under it.

**Principle.** V§14, `spaces.md` §35 (mobile preserves the hierarchy, not the literal layout), §36.
**Replaces.** The phone trial in *The nav is icons, with the names a hover away*, below.

## 2026-09-13 · Lumi is hands-free most of the time

**Decision.** Lumi's usual state is holding nothing. The lantern stops being part of her and becomes one of the things in her world she can pick up and set down, like a book or a cup.
**Rationale.** Chanté: "Lumi will be hands free often." *(Claude's reading, from the direction that started the work: handling things in her surroundings makes her a resident of the places rather than an emblem carrying a fixed prop.)*
**Implications.**
- Her movements are drawn from the hands-free rest pose (`art-direction.md` §4a); objects she holds are what she picked up, and the Library's retrieval (carrying a Thread to the table) builds on it.
- Her warmth rests on her glowing eyes when nothing lights her hands (`art-direction.md` §2).
- The lantern body stays served beside the hands-free one for now; whether and when it is retired is an implementation choice (`docs/decisions.md`).
**Principle.** Lumi inhabits her world (spaces §19, §29); presence, not performance.
**Replaces.** The lantern carried at all times (the lantern character, 2026-09-12); the hands-free proposal of the same day.

## 2026-09-13 · The nav is icons, with the names a hover away

**Decision.** The places are icons on a narrow green rail that is always there; their names are on a parchment sheet that opens from the rail on hover, focus or tap, and can be pinned open. The rail marks where you are with a star.
**Rationale.** Chanté's call, with `art/mockups/rail-nav.png`: she would rather have icons with expandable names than plain names always showing. *(Claude's reading: the rail gives the paintings back the width the sidebar took, and keeps the way around visible without holding a column of words in view.)*
**Implications.**
- Icons can carry meaning, but only where the name is always a hover, focus or tap away. An icon with no way to see its name is still out.
- The names stay plain (`spaces.md` §3): *Home, Today, Library*, never place-names the user has to decode.
- Pinning the sheet out (the rail's top half) and locking it in (the bottom half) are optional and undone the same way; nothing may depend on either.
- Phones were a trial (the rail plus a tap on the compass star); superseded by the bottom bar (entry above).

**Principle.** V§14, `spaces.md` §3 and §21.
**Replaces.** The sidebar of plain names ([engineering log](../decisions.md), same date).

## 2026-09-13 · Approved documentation reconciliation

Chanté approved the conceptual comparison and consolidation structure. **Previous approach → why it changed → current approach:**

- Earning/spending coherence → contradicted the foundations and complete space documents → environmental growth is continuity, not a reward economy; recognition survives without currency, unlocks or absence costs.
- Library primarily described as history → active Threads, commitments and current context also need a home → Library exposes the breadth of the shared life model, with historical and intellectual exploration within it.
- Later / Not today treated as interchangeable → temporary attention is not a durable priority change → Not today excludes today's foreground without scheduling tomorrow or changing importance; equivalent input methods match only when operation and scope match.
- Correction treated as generally learned evidence → a local adjustment must not become a permanent rule, but an explicit instruction remains authoritative → learn cautiously and preserve intended scope.
- Partial Spaces and Garden and scattered design prose → complete documents are available → dedicated product and design documents with shared terminology, preserved originals and a provenance record.

**Requirements and limits.** [Shared model and terminology](../product/shared-model.md) states the approved distinctions. The [reconciliation record](reconciliation.md) maps sources and surviving implementation knowledge. No code, schema or V1 scope changes. Check-in defaults, concrete spatial interactions, adaptive-plan triggers and mobile presence remain open.

**Historical disposition.** The older “Rewards: earning coherence” entry below is superseded, not contested anymore. Earlier Library questions are broadened as above. Old “Later” shorthand and absolute “derived, not maintained” wording are qualified by authority and temporal scope. The original entries remain as history, not competing current requirements. Numbered references to the old Spaces/Garden edition link to the archive. The earlier “all still in force” assertion is subject to these explicit dispositions.

## 2026-09-13 · Lists is called the Library, and for now it is only its room

**Decision.** The nav item and page *Lists* are renamed **Library** (`/library`; `/lists` redirects), set in a painted reading room with Lumi standing in it. The list view came off the page the same day: nothing sits on the painting. The lists themselves are unchanged — Lumi files into them, Today draws its path from them, and her context reads them — but no page shows them; filing, ticking and correcting happen in conversation.
**Rationale.** Chanté's asks, on review: the Library's painting arrived, the place name fits it, and the list panel over the room was not what she wanted there. *(Why the panel came off is Claude's reading; Chanté asked for it without giving a reason.)*
**Implications.**
- The first place name to reach the nav; *Today* stays *Today*. That answers question 15 for the Library only.
- **Differs from the canon:** EP§18 says "full lists live in Lists rather than appearing everywhere", and EP§21 has the user reorder things in Lists. With no list view, full lists live nowhere the user can see. Raised with Chanté; until the Library shows what it holds, the conversation is the only way to see everything.
- What the Library shows next is question 3; `art/mockups/book-mockup-1.png`, `book-mockup2.png` and `book_layout-mockup.png` show a thread as an open book, and Chanté's spatial IA for the Library is `art/scenery/library/library-spatial-information-architecture.md`.

**Principle.** V§14, EP§15, EP§18, EP§19.
**Replaces.** *Lists*, a plain page with the tick ([engineering log](../decisions.md), same date).

## 2026-09-13 · Lumi waves when you arrive

**Decision.** When the user arrives — the app opened, or its tab shown again, after thirty minutes or more away, or a first visit — Lumi waves once, a moment later, then goes back to breathing. It is her one drawn gesture, and a reaction, not an idle animation: it never plays on a schedule.
**Rationale.** Warmth through behaviour, not slogans (EP§13: "welcoming you back without guilt"): returning is met by her, not by a count or a message. She moves in answer to something that happened (`lumi.md` §16), and arriving is an event, not time passing, so it passes §8's test for anything she starts: about something that changed, and ignorable at no cost — no reply, nothing recorded. Once per arrival, so presence doesn't become interruption (EP§11). *(The fit with §8 is Claude's reading; Chanté approved the wave and its trigger on review.)*
**Implications.**
- Nothing is asked of the user and nothing is stored about them: arrival is measured in the browser, as an animation cue, not domain state.
- A second reaction (a look-up when a reply lands, a small brightening at *Done*) must pass the same test and stay rarer than the idle life. Motion that plays on a timer belongs to the idle loops, and those stay below what pulls the eye.
- Moving between pages is not an arrival.

**Principle.** V§7, V§8, EP§11, EP§13.
**Replaces.** Breath and blink as her only motion ([engineering log](../decisions.md), same date).

## 2026-09-13 · Coherence remembers; Lumi understands

**Decision.** Coherence, not the language model, holds the user's life as durable structured context. Each turn assembles the subset Lumi needs, and Lumi's job is to interpret it and respond. ([model strategy](../product/lumi-model-strategy.md))
**Rationale.** A model that "remembers" through long histories or huge context windows makes continuity depend on that model and its limits. Structured context survives a model change and can be retrieved on purpose.
**Implications.**
- Already the shape of the system: tables and events are the truth, a capped context block and the last 30 messages (since the same day, roughly 30 to 40: *Lumi sees roughly the last 30 to 40 messages*, above) feed each turn, and a summary (M6) holds older conversation. When a cap bites, add retrieval or a read tool, never a bigger window.
- New features ask: *what does this allow Lumi to understand, and how does it help her help?*
- The structured context the strategy names but Coherence doesn't yet hold (Library threads, Garden state, relationships between things, a clear record of what was moved without being chosen) is open question 22.

**Principle.** V§4, V§16–17, EP§18.

**Addendum, same day.** [`docs/product/ai-and-information-architecture.md`](../product/ai-and-information-architecture.md), Chanté's, joins the canon as the *why* of the AI layer; [`architecture.md`](../architecture.md) stays the *how* as built. Its seams are requirements now (§57): conversation ≠ state, state ≠ history, explicit ≠ inferred, memory ≠ application state, language generation ≠ state mutation, priority ≠ attention, spaces ≠ separate data silos. So is its pace: the philosophy implemented minimally, seams before sophistication (§58), no ontology before the experience needs it (§56). Most of the seams already hold in the code: tools are the only write path, events are append-only, beliefs carry source, confidence and supersession, judgements are derived, and every page reads one state. Where the code doesn't meet the document yet is open questions 10–12, 19, 22, 24 and 25. *(Which seams hold is Claude's reading of the code.)*

## 2026-09-13 · Lumi is a designed behaviour system, not a model's personality

**Decision.** Lumi's behaviour is documented in [`docs/philosophy/lumi.md`](../philosophy/lumi.md), implemented in `persona.ts` and the tool descriptions, and checked by evaluation. Her identity must not live only in one system prompt or in behaviour that happens to emerge from one model.
**Rationale.** If Lumi exists only inside the model, changing models changes the character and the philosophy of the product. Documented, evaluated behaviour belongs to Coherence.
**Implications.**
- `lumi.md` is the source for her behaviour. `product.md`'s voice guide is folded into it.
- Strong and weak interactions are design evidence: record them, name the behaviour behind them, and update the document (not just the prompt).
- The persona prompt stays byte-stable as a cached prefix, but it is an implementation, and it is judged against `lumi.md`.

**Replaces.** `product.md` → Lumi's voice as the source of truth for her behaviour. The comment in `persona.ts` still points there (follow-up).

## 2026-09-13 · The model that builds Coherence and the model that is Lumi are chosen separately

**Decision.** Development keeps using whatever is strongest for engineering and documentation (Claude, today). For Lumi in production, OpenAI models are prototyped **alongside** the current Anthropic implementation and evaluated against Lumi's own requirements, not generic benchmarks. **Status: exploring.** No switch has been decided. *(Lumi was switched to OpenAI the same day; see the update below.)*
**Rationale.** Lumi's role is relational and interpretive, which is different from coding. The best model for one layer need not be the best for the other. This is not a judgement that one model is universally better.
**Implications.**
- The provider stays behind one module (`src/core/ai/model.ts`; sticky decision 10), though Anthropic-specific options also appear in the planner, lead and reflection calls.
- The evaluation needs the model strategy's questions as scenarios, graded the same way for every model (`lumi.md` §17).
- A second provider receiving conversations, beliefs and mail gists is a privacy change: the privacy note in `pre-prod.md` names Anthropic only.
- Method, criteria and the other model calls (planner, leads, reflection) are open question 21.

**Replaces.** The implicit assumption that Lumi runs on `claude-opus-5` because the project does (`CLAUDE.md` → Stack still describes the current implementation).

**Update 2026-09-13 · Lumi runs on OpenAI.** At Chanté's ask, every model call Lumi makes (the conversation, the day plan, mail leads and reflection) now goes to OpenAI's `gpt-6-astra`. The Anthropic implementation stays alongside, one setting away (`LUMI_MODEL=anthropic:claude-opus-5`), so the two can still be compared. The provider-specific options now live only in `model.ts`, which settles the second half of the first implication. OpenAI replaces Anthropic as the provider that receives conversations, beliefs and mail gists, and requests are sent with `store: false`. The comparison itself, and its blind grading, are still open question 21.

## 2026-09-12 · The Product Vision is foundational

**Decision.** [`docs/philosophy/product-vision.md`](../philosophy/product-vision.md) is the foundation of the canon. When product, UX, AI or technical decisions are ambiguous, its principles take precedence over conventional productivity-software assumptions.
**Rationale.** Coherence deliberately rejects patterns that are individually reasonable (more features, more structure, more engagement). Without a stable written foundation, the product drifts back toward them one reasonable feature at a time.
**Implications.** Every other canonical document answers to the vision. A change that contradicts it is surfaced to Chanté before anything is edited. [`PROJECT-CANON.md`](../../PROJECT-CANON.md) maps it to the rest.
**Replaces.** [`product.md`](../product.md) as the statement of the philosophy. Its voice guide stays until `philosophy/lumi.md` exists.

**Addendum, same day.** [`docs/philosophy/experience-principles.md`](../philosophy/experience-principles.md) joins the vision as canonical: the vision says why, the principles say how. Its *in practice* examples illustrate; they aren't specs. Its *watch for* lists and four tests (one-second, cognitive-load, maintenance, Coherence) apply to every review. It replaces [`design-philosophy.md`](../design-philosophy.md) §3 and [`today.md`](../today.md)'s general principles as the statement of interaction rules.

## 2026-09-12 · Direct manipulation is correction that teaches Lumi

**Decision.** The user can correct Lumi's organisation by hand, and every manual move tells Lumi something. In Lists, a vertical drag says relative priority, a horizontal drag says category, and moving something to *Later* says stop foregrounding it. Correcting is never required: Lumi organises first. (EP§5–6, EP§16)

**Previous approach → why it changed → current approach.**
- **Before (2026-09-11):** the Lists mockup's *drag-to-prioritise* was rejected with its per-column counts and five Add buttons, as maintenance the user would have to keep up ([`ef-burden-log.md`](../ef-burden-log.md)). Reorder was deferred ("later", [`today.md`](../today.md)). Moving things between lists happens in conversation.
- **Why it changed:** the objection was to *required* sorting, where the user keeps order so the system works. EP§6 draws the line in a different place: a correction is cheaper than configuration, and a manual move is valuable "when it expresses judgment rather than administrative maintenance" (EP§16). A drag that also updates Lumi's understanding is the opposite of maintenance.
- **Now:** optional correction by hand, reflected in Lumi's context. Counts, a due date on every row, and more than one Add stay out.

**Implications.**
- Not built. Lists has the tick only, and the planner doesn't treat *Later* as "don't foreground".
- A manual move must reach Lumi as an event and, where it means something durable, a belief. Changes that aren't reflected in AI context are a *watch for* (EP§16, EP§18).
- "Requiring manual sorting Lumi could perform" remains a *watch for*. Nothing may depend on the user dragging.
- The design choices are open question 20.

**Principle.** EP§5, EP§6, EP§16, EP§18.
**Replaces.** The *drag-to-prioritise* rejection in the EF-burden log's Lists-board row, and "reorder and drag later".

## 2026-09-12 · Four places, each answering one question

**Decision.** Coherence is organised as places that embody cognitive activities, each answering one question:
- **Home**: *Here I am.* Arriving, talking, reflecting, returning.
- **Garden** (Today): *What matters today?* Tending what deserves attention now.
- **Library** (Lists): *Where have I been?* Organising and retrieving what the system is holding.
- **Study** (Focus): *What am I doing now?* Giving attention to one thing.

**Rationale.** §14: places can become familiar, Lumi can inhabit them, and they can grow with the user's history, so the product feels inhabited rather than operated. A question per place tells the user what it is for without learning an interface, and gives each place a test for what belongs in it. *(The question-as-test framing is Claude's reading.)* The Home rename made the same move first: "Chat" named the mechanism, "Home" the place.

**Implications.**
- **Home asks nothing of you.** It is Lumi's home, calm, the open conversation. Anything on Home that asks for something needs a reason to stay or a different room (open question 1).
- **Today becomes the Garden:** *what needs tending now?*, not *what remains incomplete?* (§15). *A path, not a pile* (below) still governs what it shows. Not every task becomes a literal plant.
- **Lists lives in the Library,** which grows richer as history accumulates (§14).
- **Focus lives in the Study.** Sessions currently run on Home (open question 2).
- Places grow with relationship, continuity and accumulated life, **not points** (§14).
- A new feature starts by asking which place's question it answers. If it answers none, that is a warning sign.
- The code still has *Home · Today · Lists · Insights · Settings*. Insights has no place yet (question 4). Whether the user sees *Today* or *Garden* is question 15.

**Principle.** §11 (only what the current decision needs), §14.
**Replaces.** The V1 nav *Home · Today · Lists · Insights · Settings* as the intended model ([`features.md`](../features.md) → Navigation).

**Addendum, 2026-09-13.** [`docs/product/spaces.md`](../archive/2026-09-13-before-reconciliation/docs/product/spaces.md), Chanté's, is the place document. It keeps everything above and adds:
- A feature is placed by the cognitive mode it belongs to, and never gets a space just for being a feature (§4). The same object appears differently in each space.
- Navigation stays plain: *Home · Today · Lists · Focus*, with Garden, Library and Study as design vocabulary and the labels tested (§3; open question 15).
- Spaces are views of one life context. Lumi carries the continuity, and context travels (§19–20).
- The environment earns imagery the interface doesn't, and a rich environment never means a dense interface (§23–24).
- Spaces change slowly with the relationship: discovered, not awarded, never decaying, never a judgement (§25–27). Nothing about the world is required to use the product (§28).

**Not reconciled:** it words two questions differently. The Library asks *What am I holding, and where does it belong?* (above: *Where have I been?*), and the Study *What are we doing now?* (above: *What am I doing now?*). The questions above stand until Chanté picks (open questions 2 and 3).

**Addendum, 2026-09-13 (later).** [`docs/product/today-garden.md`](../archive/2026-09-13-before-reconciliation/docs/product/today-garden.md), Chanté's, is the Garden's place document (the text as received is missing §78–119). It keeps *Today is a path, not a pile* and *Lumi proposes; the user decides* (below), and adds:
- Today is a temporary projection of the broader model, never a second source of truth (§2, §121).
- Capacity changes scope. Low capacity makes the page smaller, never redder, and high capacity is not a reason to fill the day (§12–14).
- Nothing unfinished becomes overdue debt; carryover comes from renewed relevance, and repeated deferral is a signal, not a score (§52–54).
- No planning ritual in the morning or the evening, and Today stands on its own without a conversation first (§55, §71, §143).
- The Garden's growth reflects continuity, never output (§33, §66); open question 14 is still Chanté's to decide.

**Not reconciled either:** it words the Garden's question as *What deserves my attention today?* (Purpose), *What deserves tending today?* (§59) and *What needs tending today?* (§158), where the decided question is *What matters today?*. It also gives the Library *What am I carrying?* (§59) and the Study *How do we stay with it?* (§60). The questions above stand until Chanté picks (open questions 2, 3 and 5). Where the page as built falls short of it: open questions 5, 16, 20, 22, 26 and 27.

## 2026-09-12 · Rewards: earning coherence — superseded 2026-09-13

> **Historical status, superseded 2026-09-13 by the approved reconciliation above:** formerly contested by the Product Vision. Recorded from Chanté's message on 2026-09-12, before the vision was added. The vision's §14 says *"inhabited, not gamified … The user is not earning decorations for completing tasks … Growth should feel like expansion, not reward"*, and §20 says Coherence is not *"a gamified habit tracker"*. The Experience Principles go further: EP§14, *"Growth reflects history, not achievement"*, lists points, currencies, unlock requirements and completion-based decoration as things to watch for, and EP§20 warns against "rewards intended to bring users back without functional reason". Nothing below is a requirement until Chanté reconciles them ([open question 14](open-questions.md)).

**As described.** Coherence gamifies. The user earns *coherence* for completing tasks and for just showing up, and spends it on plants or little things for Lumi that she engages with. Always positive, with no negative consequences.

**Rationale given.** From Chanté's notes: recognise the behaviours ADHD brains rarely get credit for (showing up, beginning, returning), and "recognize consistency without turning absence into loss."

**What both versions agree on.** Nothing decays, wilts, empties or is lost. No streaks. Absence costs nothing and returning is welcomed (§8, §12). Whatever form growth takes, a hard week never makes the places sadder.

**Replaces, if adopted.** "Explicitly not in V1: … gamification, streaks" ([`product.md`](../product.md)).

## 2026-09-12 · The design direction is inhabited, painted places

**Decision.** Coherence moves toward much more imagery and animation: painted isometric places behind the spaces, and Lumi animated within them.

**Rationale.** §14: the product should feel inhabited, with familiar places Lumi lives in. [`art-direction.md`](../art-direction.md) §3 adds what the painted world gives that the book couldn't: warmth, a reason to come back that isn't a to-do list, and Lumi as company rather than an icon.

**Implications.**
- "No decorative imagery" and "Lumi only as a small avatar" no longer hold.
- The places should be pleasant enough to return to without becoming an attention trap (§18). So far the painting sits behind and the type leads, on Home and on the Garden.
- The rules a painted world must keep are *proposed* in `art-direction.md` §3, not decided.
- `design-philosophy.md` and `product.md` → Visual direction are out of date until `docs/design/visual-language.md` replaces them.

**Principle.** §13–14, §18.
**Replaces.** "Antique book × modern editorial interface … No decorative imagery" (`product.md`) and the order of permission in `design-philosophy.md` §2. The path here: printer's ornaments as the only decoration → a painted room behind Home → a painted garden behind Today → inhabited places as the direction (all 2026-09-12).

## 2026-09-12 · The product is Coherence; Lumi is she

**Decision.** The product is **Coherence** (formerly Lumen). The companion is **Lumi**, she/her, in the medallion costume. Rooms are isometric.
**Rationale.** §19: the name is about reducing fragmentation at every scale, from *what do I do next?* to *what am I trying to move forward in my life?*
**Replaces.** Lumen, and Lumi as "he". What was renamed is in the engineering log.

---

## Foundations from the first build (2026-09-11 → 12)

Distilled from the engineering log, [`product.md`](../product.md) and [`today.md`](../today.md). All still in force, and all consistent with the vision.

### The one question overrides convention · 2026-09-11

**Decision.** Every design and implementation choice is checked against *does this reduce the user's executive-function burden, or accidentally create more of it?*, ahead of conventional productivity patterns.
**Rationale.** Productivity systems require the executive functions they are meant to support (§1).
**Implications.** Anything that asks the user to set, keep, rate, confirm or remember something, or shows a count of undone things, gets an EF-burden-log row before it is built. Derived beats asked.
**Principle.** §1, §21.

### A companion, not a task manager; the conversation is capture · 2026-09-11

**Decision.** The primary interface is a conversation with Lumi. She files, updates and closes things through tools; there is no second capture surface.
**Rationale.** A form with fields and a type picker is a system to manage. Lumi turning natural conversation into structure is exactly §4's example.
**Implications.** Lists' one *Add* opens the conversation. Lumi in the corner can be told things from any page.
**Principle.** §4.
**Replaces.** Quick capture from the Today mockup (deferred, to revisit if chat capture proves slow in daily use).

### Today is a path, not a pile · 2026-09-12

**Decision.** Today visually prioritises one current action rather than displaying the complete daily task list.
**Rationale.** Showing many equally weighted tasks transfers prioritisation burden back to the user, which conflicts with reducing executive-function overhead.
**Implications.** Everything else is progressively disclosed as *After that* (≤ 3) and *Later* (fixed times only), or lives elsewhere. "Everything else can wait" is real prioritisation information. The path is stable across reloads and re-cut only on purpose. It still holds inside the Garden.
**Principle.** §11.

### Lumi proposes; the user decides · 2026-09-12

**Decision.** Lumi's plan is a proposal. *Not this* changes it in one tap, with a reason, and is never recorded as failure. A request in the user's own words ("something easy") outranks Lumi's order.
**Rationale.** Authority stays with the user. Resistance says something about their state, which makes it the richest learning signal the product has.
**Implications.** No carousel of alternatives; *Not this* is the one way to change the current thing. Reasons feed Lumi's beliefs, not a record.
**Principle.** §5, §9.

### Never a count of what's undone; coming back is a greeting · 2026-09-11

**Decision.** No overdue counts, badges, unread counts or "1 of 3". Returning after a gap is met with an offer to help work out what's still relevant.
**Rationale.** A count is a bill, and returning costs most when the user has the least capacity to pay it (§8).
**Implications.** Collapses without numbers ("A few more, when you get there"). Lumi does the going-through during re-entry. Staleness is derived and never shown as a number.
**Principle.** §8, §12.

### Derived, not maintained · 2026-09-11

**Decision.** Lumi's understanding of the user (beliefs, with confidence and evidence) comes from what they say and what happens. The user never rates, tags or configures what behaviour can reveal. Tone is learned, not set.
**Implications.** No settings for things behaviour can reveal. The planned *What Lumi knows* page is for correcting, not curating.
**Principle.** §16.

### Quiet by default · 2026-09-11

*Partly superseded 2026-09-13: check-ins went with focus sessions (Today does its own organising, above), so Lumi currently speaks unprompted not at all; the greeting stays deterministic.*

**Decision.** Lumi speaks unprompted only at check-ins the user agreed to. The greeting and the check-ins are deterministic.
**Rationale.** Effective presence is often quiet (§7). An unprompted message is a small demand.
**Implications.** Any future notification must clear this bar (open question 9).
**Principle.** §7, §18.

### A session's end is a fact, not a request · 2026-09-12

*Suspended 2026-09-13: focus sessions are removed from the product for now (Today does its own organising, above). This stays the design for when they return.*

**Decision.** Focus sessions start only through Lumi. *Done* and *End* close a session in code, with no "did you finish?". A session left open is offered back once and never treated as a failure.
**Rationale.** Three asks up front, none during: the body double doesn't interrogate.
**Implications.** No timer controls to configure. No stats, streaks or session history.
**Principle.** §7, §12.

### Mail is a look, not an inbox · 2026-09-12

**Suspended 2026-09-13:** mail is switched off for now ([Mail is switched off, for now](#2026-09-13--mail-is-switched-off-for-now)). This stays the design for when it returns.

**Decision.** Lumi reads recent mail read-only and asks one question per thing she noticed, with two answers: *Still needs doing* or *Let it go*.
**Rationale.** A second inbox would be a second system to manage.
**Implications.** No unread or "needs reply" counts, no refresh button, no sync, no stored mail.
**Principle.** §4, §11.
