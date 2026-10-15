# Onboarding a new brand or an idea (براند جديد / فكرة)

Used by Step 0 in `SKILL.md` when the merchant answers «براند جديد أو فكرة» to the first setup question. The merchant has no sales, no reviews, and often no exact numbers. The goal is the same as for a running store: a `business.md` every seat can read, and a customer seat. The difference: everything is a range, an assumption, or an open question, and the customer seat is a **hypothesis** («فرضية»), not a record of real customers.

## Tone

Say once, in Arabic: «حلو. بما إنه براند جديد، بسألك أكثر شوي: ٥ دفعات أسئلة قصيرة. أي سؤال ما تعرف جوابه قل «ما أعرف» وأسجله سؤال مفتوح، عادي جدًا في البداية.»

Friendly, plain Gulf Arabic. Never push for exact numbers; ranges are the right answer at this stage. Every AskUserQuestion batch has **at most four questions**, each with 2 to 4 short options where options help (the merchant can always type "Other"). Always include «ما أعرف للحين» as an option where it makes sense. When the merchant writes a long free answer, keep their words; do not tidy them into marketing language.

## The five batches

1. **الفكرة والمنتج**
   - وش المنتج أو الفكرة في سطر؟ (وش يحل، لمين)
   - وين وصلت؟ (فكرة بس · عندي عينة أو مورد · المنتج جاهز وما بدأت أبيع · بدأت بيع بسيط لأهلي وأصحابي)
   - ليش أنت؟ قصتك مع المنتج (وش خلاك تبدأ، خبرتك، علاقتك بالمشكلة)
   - كيف بتبيع؟ (سلة · زد · انستقرام وواتساب · ما قررت)

2. **العميل**
   - مين العميل اللي في بالك؟ (رجال · نساء · الاثنين) وكم عمره تقريبًا؟
   - وين ساكن غالبًا؟ (الرياض · جدة والغربية · الشرقية · كل المملكة · الخليج)
   - وش المشكلة أو الرغبة اللي تخليه يدور على منتج مثل منتجك؟
   - وش يستخدم الحين بدالك؟ (منتج منافس معروف · شي من الصيدلية أو السوق · يسويها بنفسه · ما يسوي شي)

3. **الأرقام (مدى تقريبي يكفي)**
   - كم تفكر تبيعه؟ (مدى بالريال، أو «ما قررت»)
   - كم يكلفك تقريبًا للحبة؟ (المنتج + التغليف + الشحن؛ مدى أو «ما أعرف»)
   - كم الميزانية اللي تقدر تصرفها لأول ٣ شهور؟ (أقل من 10 آلاف · 10 إلى 30 ألف · 30 إلى 100 ألف · أكثر)
   - متى تبي تطلق؟ (خلال شهر · ١ إلى ٣ شهور · أكثر من ٣ شهور · ما حددت)

4. **السوق والقنوات**
   - مين المنافسين اللي تعرفهم؟ (أسماء متاجر أو حسابات أو ماركات، أو «ما أعرف»)
   - وش القنوات اللي تقدر تشتغل عليها؟ (سناب · تيك توك · انستقرام · جوجل · مؤثرين · واتساب وأهل وأصحاب)
   - مين بيشتغل معك؟ (أنا لحالي · شريك · مستقلين · وكالة) وكم ساعة بالأسبوع تقدر تعطيه؟
   - وش ميزتك الحقيقية على المنافس؟ (سعر · جودة · قصة · خدمة · ما أدري للحين)

5. **الشخصية والحدود والنجاح**
   - لو البراند شخص، كيف يتكلم؟ واذكر ماركات أو حسابات يعجبك ذوقها (عربية أو عالمية)
   - الخطوط الحمراء: ادعاءات ما تبي تقولها، الحلال والشبهات، أشياء ما تسويها أبدًا (وجوه مزيفة، تقييمات مزيفة، استعجال مزيف)
   - وش يعني نجاح بعد ٩٠ يوم؟ (أول 100 طلب · أرجع رأس المال · أثبت إن الفكرة تبيع · رقم ثاني)
   - وش أكثر شي يخوّفك أو ما تعرفه؟

**Optional public research (light).** After batch 4, if web tools work in this session (WebSearch / WebFetch), offer once: «تبيني أطالع بسرعة وش يقول الناس عن منتجات مثل منتجك ومنافسينك (تقييمات ومنتديات عامة)؟ قراءة فقط.» On yes, see «The customer seat» below. If the tools fail or are missing, say so in one line and skip it.

## Writing `business.md`

Write `business.md` from `business.template.md` with these changes:
- Replace `STATUS: TEMPLATE` with `STATUS: NEW_BRAND (براند جديد)`. Under the date, add `brand_stage: new` and the `runtime:` line.
- Section 1 becomes «الفكرة والمنتج ووين وصلنا» and holds the founder story («ليش أنا») in two or three lines, in the founder's words.
- Section 2 «الأرقام» holds **ranges and assumptions only**: intended price, unit cost, gross margin per order as a range (price minus cost; say «(افتراض)»), budget for 90 days, launch date. Never write a number the founder did not give as a fact; mark each one `(تقريبي)` or `(افتراض)`.
- Section 3 «العميل المتوقع»: who, age, city, pain, current alternative. Label it «(فرضية، ما فيه عملاء للحين)».
- Section 4: the channels they can use and the competitors they named.
- Add «الشخصية والذوق» (how the brand talks, taste references) under section 7's red lines or as its own short section.
- Section 9 «مشاكل مفتوحة الحين» holds the biggest fear.
- Section 10 **«أسئلة مفتوحة»**: every «ما أعرف» answer, as a short question, plus anything the Chair thinks the founder must learn before spending (for example «كم يكلف الشحن فعليًا للحبة؟»). Number them Q1, Q2, ...
- Section 11 «النجاح بعد ٩٠ يوم»: the founder's definition, as written.

Keep it under about 130 lines. Show a five-line summary and ask «فيه شي غلط؟» once.

## The customer seat for a new brand («عميل متوقع»)

There are no reviews, so the seat is built as an **expected customer** from the founder's answers, plus light public research when it worked. It is a hypothesis and must say so everywhere.

Write in `brains/store-customer/`:
- `_hot.md`: replace `STATUS: NOT_BUILT` with `STATUS: HYPOTHESIS <date> (<n> public sources)` and add the line `> فرضية: «عميل متوقع» مبني من وصف المؤسس وبحث عام خفيف. ما فيه ولا عميل حقيقي للحين. كل كلامه فرضية لين تجي تقييمات حقيقية.` Fill «مين احنا» from batches 1 and 2 (voice: «احنا البنات», «احنا الشباب», or «احنا العملاء») and 3 to 6 named patterns, each marked (فرضية) and tied either to source ids or to «من وصف المؤسس».
- `sources.md`: replace `STATUS: NOT_BUILT` with `STATUS: HYPOTHESIS`. Only text you actually fetched in this session, **verbatim**, one row each, ids S001, S002, ... (the same S### ids `check_quotes.py` checks), with the type `بحث عام (فرضية)`, the URL, and the month. These are strangers talking about the category or a competitor, not this brand's customers; say so in the header. Remove names and handles ([محذوف]). Never invent, merge, translate inside the quote, or tidy a line. Quote at most a sentence or two per source. If research was skipped or found nothing, keep the table empty and write «ما فيه مصادر عامة: المقعد يتكلم من وصف المؤسس فقط ولا يقتبس».
- `objections.md`, `voice.md`, `positions.md`: from the founder's answers and the fetched sources only, every line marked (فرضية). Where there is nothing, write «ما عندنا كلام عملاء عن هذا».

Tell the merchant plainly: «مقعد العميل الحين فرضية: مبني من كلامك ومن بحث عام. أول ما يجيك 20 تقييم أو رسالة حقيقية، شغّل /majlis setup وأبنيه من جديد من كلام عملائك.»

## How the councils treat a new brand

When `business.md` says `STATUS: NEW_BRAND` (or `brand_stage: new`):
- **The Chair** says it in the brief under «المتجر»: «براند جديد: ما فيه أرقام بيع ولا عملاء حقيقيين. كل الأرقام مدى أو افتراض، وكلام صوت العميل فرضية.» Pull the relevant «أسئلة مفتوحة» into the brief's assumptions.
- **Numbers:** seats reason in ranges and mark every number they use `(افتراض)`. A scenario line like «إذا السعر 149 والتكلفة 60 إلى 70 (افتراض)…» is the right shape. No seat states a conversion rate, CAC, or repeat rate as a fact.
- **Customer seat quotes** are hypotheses. The Chair, in `verdict.md`, labels them «فرضية من بحث عام» and never as «عملاؤنا قالوا».
- **Scoring is unchanged**, but the verdict prefers cheap tests: for a new brand the «أرخص اختبار» line in the report is mandatory and should test the riskiest assumption before money is spent. A GO that depends on an untested assumption becomes GO WITH CONDITIONS or WAIT, with the test as the trigger.
- When the brand gets real sales and reviews, `/majlis setup` switches it to a running store: update `business.md` (`STATUS:` line removed, `brand_stage: existing`), keep the answered open questions as facts, and rebuild the customer seat from real texts (the hypothesis files are replaced, not merged).
