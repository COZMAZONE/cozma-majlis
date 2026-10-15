# Seats (المقاعد)

Three councils, one registry: `councils.json` (in this skill folder) lists each council's seats in table order. Keys, agent names, slugs, and the `## <Seat>` headings in round files stay in English exactly as listed (the room parses them). Pillar names and questions are shown in Arabic as the room displays them. For the creative and marketing seats, the seat's own `brains/<slug>/seat.json` is the authority for its Arabic name, pillar, question, and dimension; the tables below are the routing summary.

Brain paths are relative to `.claude/skills/majlis/`. Every agent is `.claude/agents/council-<key>.md`.

## «مجلس التاجر» (business)

| Seat (heading) | Key | Pillar (الركيزة) | Owns the question (السؤال) | Brain |
|---|---|---|---|---|
| Bezos | `bezos` | Strategy and decisions (الاستراتيجية والقرارات) | هل هذا هو الرهان الصح، وهل نقدر نرجع عنه؟ | `brains/jeff-bezos/` |
| Graham | `graham` | Product and startups (المنتج والنمو) | هل الناس فعلًا تبغى هذا، وهل هو ينمو؟ | `brains/paul-graham/` |
| Hormozi | `hormozi` | Offers, pricing, and sales (العروض والتسعير والبيع) | هل بيدفعون، وكم، وكيف نقفل البيعة؟ | `brains/alex-hormozi/` |
| Gary V | `garyvee` | Marketing and attention (التسويق والانتباه) | من وين يجي الانتباه، وهل سعره لسه رخيص؟ | `brains/gary-vaynerchuk/` |
| Martell | `martell` | People, hiring, and founder time (الفريق ووقت المؤسس) | مين بينفّذ هذا، وكم بياخذ من وقتك؟ | `brains/dan-martell/` |
| Wickman | `wickman` | Operations and scaling (التشغيل والتوسّع) | هل الشغل يمشي بدونك وأنت مو ماسكه بيدك؟ | `brains/gino-wickman/` |
| Buffett | `buffett` | Money and capital (المال ورأس المال) | إيش يسوي هذا بالكاش والمخاطرة والقيمة على المدى الطويل؟ | `brains/warren-buffett/` |
| Customer | `customer` | Customer experience (تجربة العميل) | هل بيصدّق الكلام ويشتري… ويرجع يشتري؟ | `brains/store-customer/` |

## «مجلس الكريتيف والتصميم» (creative), 9 seats

| Seat (heading) | Key | Pillar (summary) | Brain |
|---|---|---|---|
| Ogilvy | `ogilvy` | Research-led advertising and selling copy | `brains/david-ogilvy/` |
| Bernbach | `bernbach` | The creative idea, honesty, and craft | `brains/bill-bernbach/` |
| Schwartz | `schwartz` | Market awareness, desire, and the headline | `brains/eugene-schwartz/` |
| Sutherland | `sutherland` | Behavioural science and perceived value | `brains/rory-sutherland/` |
| Rams | `rams` | Product and visual design discipline (less, but better) | `brains/dieter-rams/` |
| Jobs | `jobs` | Product taste, simplicity, and the whole experience | `brains/steve-jobs/` |
| Chris Do | `chrisdo` | Brand strategy and design as business value | `brains/chris-do/` |
| Denney | `denney` | Performance creative: hooks, UGC, and testing | `brains/dara-denney/` |
| Customer | `customer` | Customer experience: would they stop, believe, buy | `brains/store-customer/` |

## «مجلس الماركتينج» (marketing)

| Seat (heading) | Key | Pillar (summary) | Brain |
|---|---|---|---|
| Godin | `godin` | The smallest viable audience, permission, story | `brains/seth-godin/` |
| Kotler | `kotler` | Marketing management: segmentation, targeting, positioning, the 4Ps | `brains/philip-kotler/` |
| Sharp | `sharp` | Evidence-based growth: penetration, mental and physical availability | `brains/byron-sharp/` |
| Ritson | `ritson` | Strategy before tactics; brand and performance balance | `brains/mark-ritson/` |
| Brunson | `brunson` | Funnels, offers, and the value ladder | `brains/russell-brunson/` |
| Miller | `miller` | Clear messaging: the customer as hero (StoryBrand) | `brains/donald-miller/` |
| Dunford | `dunford` | Positioning against real alternatives | `brains/april-dunford/` |
| Customer | `customer` | Customer experience: does the message land | `brains/store-customer/` |

**Every seat is a simulation.** Every expert seat on every council is built from that person's published work; they are not the people, do not speak for them, and have no affiliation with this product. The room shows a «محاكاة» tag on every seat.

**The Customer seat («صوت العميل») is not a real person.** It is a composite of THIS store's customers, built at onboarding (`/majlis setup`) from 20 to 50 real reviews, complaints, and messages (`brains/store-customer/sources.md`). It sits on all three councils. Until it is built (`STATUS: NOT_BUILT` in `_hot.md`) it speaks only from the customer profile in `business.md`, marks everything (افتراض), and quotes nothing. Its voice follows the store's audience: «احنا البنات», «احنا الشباب», or «احنا العملاء». For a new brand (`STATUS: NEW_BRAND`), the brain is `STATUS: HYPOTHESIS`: an «عميل متوقع» built from the founder's answers and light public research; every quote is public talk about the category, labelled (فرضية), never «our customers». Its `RUIN RISK` means brand-trust damage: a broken promise (shipping, results, guarantee), anything un-halal, fake faces or numbers, hidden offer conditions.

**A seat whose files have not landed** (no `seat.json`, brain, or agent yet) is shown in the room with an initials avatar. In a council, the Chair says it is missing, seats the rest, and never writes a card for it.

## Relevance weights (أوزان الصلة)

The Chair sets a weight per seat at the table for each decision, before Round 1, and writes the reason in one short Arabic line. Weights make the final score honest: on the business council a pricing call leans on Hormozi; on the creative council a hook test leans on Denney and Schwartz; on the marketing council a positioning call leans on Dunford and Ritson.

| Weight | Meaning |
|---|---|
| 3 | This decision lives in the seat's pillar |
| 2 | The pillar is materially affected |
| 1 | The pillar is touched at the edges |

Every seat is at least 1. Normally one or two seats get a 3. **Customer gets 3 on any creative, offer, landing page, product page, pricing, messaging, guarantee, or shipping-promise decision** (it may be a third 3 in that case). On pure finance, hiring, or internal-ops calls, Customer is 1 or 2.

Weight guidance per council:
- **Business:** as above (Hormozi on price and offers, Buffett on cash, Martell on team, Wickman on ops, Bezos on one-way bets, Graham on demand, Gary V on attention).
- **Creative:** ad concept or copy → Ogilvy, Schwartz 3; a hook or first 3 seconds for paid social → Denney 3; the big idea or tone → Bernbach 3; packaging, layout, LP/PDP design → Rams, Jobs 3; brand identity, logo, visual system → Chris Do 3; price perception, framing, choice design → Sutherland 3. Customer is 3 on almost every creative call.
- **Marketing:** positioning → Dunford 3; segmentation and the full plan → Kotler 3; brand vs performance budget, long term vs short term → Ritson, Sharp 3; reach, new buyers, distinctiveness → Sharp 3; funnel, offer sequence, launch → Brunson 3; message clarity, homepage or ad wording → Miller 3; a niche, community, or permission play → Godin 3.

## Quick council (المجلس السريع)

`--quick` seats four from the chosen council: the two highest-weight seats, the seat best placed to see the downside (business: Buffett or Bezos; creative: Rams or Sutherland; marketing: Ritson or Sharp; whichever is not already in), and the seat most likely to disagree with the others (the Chair names why). **If the decision touches what a customer sees, pays, or receives (creative, offer, LP, PDP, price, message, shipping), Customer is always one of the four**, taking the "most likely to disagree" slot if it is not already a top-weight seat. Use quick for reversible, low-stakes calls. Full council for anything the merchant cannot easily undo.

## Natural tensions to expect

Written from each seat's pillar; the brain authors refine these in each `_hot.md`.

**Business**
- Bezos and Buffett (long horizon, downside first) against Hormozi and Gary V (speed to cash, volume, act now).
- Graham (do things that don't scale, stay close to users) against Wickman (systems, process, accountability).
- Buffett (stay in your circle, avoid leverage) against Gary V (bet on the underpriced platform now).
- Martell (buy back your time, hire early) against Graham and Buffett (stay small and frugal until it works).
- Customer (trust, shipping, honest promises, real faces) against Hormozi and Gary V (more volume, harder offers, bolder hooks).

**Creative**
- Ogilvy and Schwartz (long, specific, research-led selling copy) against Rams and Jobs (cut until only the essential is left).
- Bernbach (one fresh idea, executed with craft) against Denney (test many hooks fast and let the numbers pick).
- Sutherland (perception and the irrational lever can beat the logical one) against Ogilvy (facts and the research sell).
- Chris Do (brand value, charge for meaning, consistency over time) against Denney (native, lo-fi, platform-first creative that may break the brand look).
- Customer (would we believe it, are those real people and real results, is it halal and honest) against anyone pushing a bolder claim or a staged look. Customer and Bernbach often agree on honesty; Customer and Denney often agree on real faces.

**Marketing**
- Sharp (reach every category buyer, mental and physical availability, broad) against Godin and Dunford (the smallest viable audience, a sharp niche).
- Ritson (strategy first, balance brand and performance, long term) against Brunson (funnels and offers that convert now).
- Kotler (the full STP and 4Ps plan) against Godin (ship, earn permission, tell the story; skip the big plan).
- Miller (one clear message, the customer is the hero) against Dunford (context and the real competitive alternative come first).
- Customer (does this message mean anything to us, is the promise kept) against any plan that grows reach faster than trust.

If Round 1 comes back unanimous, the Chair should be suspicious and press the seat whose pillar is most at risk in Round 2.
