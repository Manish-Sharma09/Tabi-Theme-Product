# PDP content — what to write in every field

Copy-paste starting content for all the product metafields, written in the
voice the rest of the site already uses: plain, unhurried, specific. Short
sentences. British spelling (`colours`). No exclamation marks, no "luxurious",
no "elevate your wardrobe".

Everything here is a **worked example, not boilerplate to paste 200 times**.
Change the fabric, the place, the measurement. A sentence that is true of every
product tells a shopper nothing.

---

## 0. First: fill this, skip that

The page hides anything empty. That is the whole design — so the question for
each field is "is this *true of this product in particular*", and if it is not,
leave it empty and let the fallback do its job.

| Field | Fill per product? |
| --- | --- |
| `short_description` | **Always.** Two lines, the reason to want it. |
| `fit` | Clothing only. One word. |
| `model_details` | Clothing only, and only where there is a model shot. |
| `fit_recommendation` | Only where the fit is genuinely unusual. |
| `fabric` | **Always.** The one field a shopper actually reads. |
| `craft_technique` | Only where there is a craft — printing, embroidery, smocking, quilting. |
| `construction` | Where the make is a selling point — French seams, hand-rolled hems. |
| `silhouette` | Clothing only. |
| `product_detailing` | Only where there are details worth naming. |
| `wash_instructions` | Where care differs from the default — indigo, silk, brass. |
| `size_chart_page` | **Always, on anything sized.** Point at a shared page. |
| `size_chart_note` | Only where the product runs small, large or odd. |
| `size_chart_image` / `size_chart` / `size_chart_title` | Rarely. Only for the product that is its own case. |
| `usp_1..6_*` | **Only where the template's default rows are wrong.** See §2. |
| `usp_label` / `usp_lede` | Rarely — per collection, not per product. |
| `usp_media` | Where the product has its own film or a better shot than the section's. |

The trap: the default "Why you'll love it" rows say **"Relaxed, Comfortable
Fit"** and **"Vintage-Inspired Details"**. True of a kaftan. Nonsense on a
tablecloth. So non-clothing is where the `usp_*` overrides earn their keep, and
clothing mostly should not touch them.

---

## 1. Brand-level — theme editor, not metafields

These are typed once in the theme editor and apply to every product that does
not override them. They are already set; this is what they should say.

**PDP: Why you'll love it** → Section label / Opening line

```
Why you'll love it
Clothes with character, made for comfort.
```

**The five default rows** (block settings — the fallback for every product):

| # | Icon | Heading | Text | Highlight |
| --- | --- | --- | --- | --- |
| 1 | `leaf` | Relaxed, Comfortable Fit | An easy silhouette designed to let you move comfortably. | — |
| 2 | `flower` | Vintage-Inspired Details | Nostalgic details thoughtfully reimagined for everyday wear. | — |
| 3 | `needle` | Crafted with Care | Finished with thoughtful details such as smocking, hand embroidery or hand-block printing. | — |
| 4 | `shield` | Tested for Harmful Substances | The fabric has been independently tested according to REACH standards. | — |
| 5 | `box` | Made in Small Batches | Thoughtfully produced in limited runs and often made to order, helping us avoid unnecessary overproduction. | ✅ |

**Accordion fallbacks** (shown on products with no metafield of their own):

*Material and care*
```
Our fabrics, dyes and finishing processes are selected against stringent
quality and chemical-safety requirements (REACH standards), so what sits
against the skin is considered as carefully as how the piece looks.

Pre-treat stains when needed. Gentle machine wash with similar colours using a
mild detergent. Do not bleach. Tumble dry as permitted by the garment care
label, or dry in shade. Warm iron on the front or reverse as needed.
```

*Exchange & Return*
```
If your Tabi piece does not work for you, you can request an exchange or return
within 5 days of delivery, no questions asked.

Items must be unused and unwashed, with all tags attached and the original
packaging.

Please refer to our Shipping, Exchanges & Returns policy for more details.
```

**PDP: Need any help** → Contact blocks

| Icon | Link text | Action | Number |
| --- | --- | --- | --- |
| Phone | Call | Start a phone call | `+91 93197 50031` |
| WhatsApp | Chat | Open WhatsApp | `+91 93197 50031` |
| Instagram | @mytabi.in | Open a link | Link: `https://www.instagram.com/mytabi.in/` |

Hours: `Mon-Sat 9:30 AM TO 5:30 PM (IST)`

> Adding Instagram makes three channels, which stacks the card on mobile. That
> is the intended behaviour — but look at it on a phone before you commit.

---

## 2. Archetype A — women's clothing

Worked on a hand-block printed cotton kaftan. This is the fullest case; the
others are this with pieces removed.

**`short_description`** — Multi-line text
```
An easy, floor-skimming kaftan in hand-block printed cotton voile. Cut loose
through the body with a deep armhole, so it moves with you and layers over
almost anything.
```

**`fit`** — Single line text
```
Relaxed
```

**`model_details`** — Single line text
```
Model is 5'7" and is wearing a size S
```

**`fit_recommendation`** — Multi-line text
```
Cut generously through the body. If you are between sizes, take the smaller
one — it will still sit loose.
```

**`fabric`** — Rich text
```
100% cotton voile. Light enough for a hot afternoon and opaque enough to wear
on its own.

Woven and printed in Bagru, Rajasthan. Small irregularities in the print are
part of hand-block printing, not a flaw in the piece.
```

**`craft_technique`** — Rich text
```
Hand-block printed with carved teak blocks, one colour and one block at a time.
A single length of fabric passes under the printer's hand several hundred
times.

Dyed with natural indigo in a fermented vat. The colour deepens over the first
few washes and then settles.
```

**`construction`** — Rich text
```
French seams throughout, so there are no raw edges inside.

A faced neckline rather than a bias binding, which sits flatter against the
collarbone. Side slits to the hip.
```

**`silhouette`** — Rich text
```
Straight through the shoulder and body with a deep armhole. Falls to the ankle
on a 5'6" frame.
```

**`product_detailing`** — Rich text
```
Hand-embroidered mirror work at the neckline. Coconut shell buttons. Side
pockets set into the seam, deep enough for a phone.
```

**`wash_instructions`** — Rich text
```
Wash separately in cold water the first two or three times — natural indigo
releases colour until it settles.

After that: gentle machine wash with similar colours, mild detergent, no
bleach. Dry in shade. Warm iron on the reverse.
```

**`size_chart_page`** → `womens-size-chart` (see §7)

**`size_chart_note`** — Multi-line text
```
This style is cut loose. If you want it closer to the body, take a size down.
```

**`usp_*`** — leave empty. The five brand rows are correct for this product.

**`usp_media`** — the product's own film if there is one, otherwise leave empty.

---

## 3. Archetype B — kids clothing

**`short_description`**
```
A hand-smocked cotton dress with room to run in. Soft enough to sleep in, sturdy
enough for the fourth wash of the week.
```

**`fit`** → `Relaxed`

**`model_details`**
```
Model is 3 years old and is wearing 2-3Y
```

**`fit_recommendation`**
```
Sized with room to grow. If your child is between sizes, take the larger one.
```

**`fabric`**
```
100% cotton poplin, pre-washed so it softens with wear rather than shrinking
out of shape.

Chosen for how it behaves after twenty washes, not how it looks on the first
day.
```

**`craft_technique`**
```
Hand-smocked across the bodice. Each pleat is gathered and stitched by hand,
which is what lets the fabric stretch over the head and then sit flat again.
```

**`construction`**
```
Flat-felled seams at the shoulder, so nothing rubs. Generous hem allowance —
let it down once and the dress lasts another season.
```

**`silhouette`**
```
Gathered at the chest and loose to the knee. Wide enough through the skirt to
sit cross-legged.
```

**`product_detailing`**
```
Wooden buttons at the back. A small hand-embroidered flower at each cuff.
No labels at the neck — the care details are printed inside the side seam.
```

**`wash_instructions`**
```
Gentle machine wash, cold, with similar colours. Reshape the smocking while
damp and dry flat in shade.

No bleach, no tumble dry — both will flatten the smocking permanently.
```

**`size_chart_page`** → `kids-size-guide`

**`size_chart_note`**
```
Sized with growing room. Between sizes, take the larger one.
```

**USP overrides** — the brand defaults are written for adults. These four are
worth setting for kids:

| Field | Value |
| --- | --- |
| `usp_1_icon` | `feather` |
| `usp_1_heading` | Soft from the first wear |
| `usp_1_text` | Pre-washed cotton, so there is nothing stiff to break in. |
| `usp_2_icon` | `needle` |
| `usp_2_heading` | Hand-smocked |
| `usp_2_text` | Each pleat gathered and stitched by hand, which is what lets it stretch and settle back. |
| `usp_3_icon` | `garment` |
| `usp_3_heading` | Room to grow |
| `usp_3_text` | A generous hem you can let down once, and seams cut with the next size in mind. |
| `usp_4_icon` | `shield` |
| `usp_4_heading` | Tested for harmful substances |
| `usp_4_text` | The fabric is independently tested to REACH standards. Nothing goes against a child's skin that we have not checked. |

Leave `usp_5_*` empty — the brand's highlighted "Made in Small Batches" row is
right as it is.

---

## 4. Archetype C — home, table linen, cushion covers

The case the defaults get wrong. **Leave `fit`, `model_details`,
`fit_recommendation` and `silhouette` completely empty** — the Specification
row then hides itself, which is correct: a tablecloth has no fit.

**`short_description`**
```
A hand-block printed cotton tablecloth, sized for a six-seater and hemmed to
fall just past the knee of a seated guest.
```

**`fabric`**
```
100% cotton, in a mid-weight plain weave that presses flat and stays put on a
polished table.

Pre-shrunk, so the first wash will not cost you two inches of drop.
```

**`craft_technique`**
```
Hand-block printed in Bagru, Rajasthan, with carved teak blocks. The border and
the field are printed separately, in that order, which is why the corners meet
the way they do.
```

**`construction`**
```
Double-turned mitred hem, stitched by machine for strength at the corners where
a tablecloth actually wears.
```

**`product_detailing`**
```
Printed border on all four sides. Finished size 60 x 90 inches, which seats six
comfortably with room for serving dishes down the middle.
```

**`wash_instructions`**
```
Machine wash warm with similar colours. Remove while still slightly damp and
iron on the reverse — cotton takes a crease best just before it is dry.

Do not bleach. Soak food stains in cold water before washing; hot water sets
them.
```

**`size_chart`** — Rich text, in place of a page. Dimensions, not sizes:
```
Six-seater: 60 x 90 inches
Eight-seater: 60 x 108 inches
Runner: 14 x 72 inches

Measure your table top and add 10 inches to each side for the drop.
```

**`size_chart_title`** — Single line text
```
Sizes & dimensions
```

**USP overrides** — all five, because none of the defaults apply:

| Field | Value |
| --- | --- |
| `usp_1_icon` | `block-print` |
| `usp_1_heading` | Printed by hand, block by block |
| `usp_1_text` | Carved teak blocks, one colour at a time. Every cloth carries small irregularities no machine would leave. |
| `usp_2_icon` | `weave` |
| `usp_2_heading` | Sits flat, stays put |
| `usp_2_text` | A mid-weight plain weave that presses properly and does not slide off a polished table. |
| `usp_3_icon` | `exchange` |
| `usp_3_heading` | Made for the wash |
| `usp_3_text` | Pre-shrunk cotton with a double-turned hem, built for the weekly wash rather than the once-a-year one. |
| `usp_4_icon` | `shield` |
| `usp_4_heading` | Tested for harmful substances |
| `usp_4_text` | Fabric and dyes independently tested to REACH standards — it shares a table with your food. |
| `usp_5_icon` | `box` |
| `usp_5_heading` | Made in small batches |
| `usp_5_text` | Thoughtfully produced in limited runs and often made to order, helping us avoid unnecessary overproduction. |
| `usp_5_highlight` | `true` |

**`usp_lede`** — Single line text, for the whole home collection:
```
Everyday things, made to be used.
```

---

## 5. Archetype D — brass (peetal) and upcycled

Non-textile. Two fields do the heavy lifting here.

**The heading override.** A "Fabric" accordion on a brass object reads wrong.
Set **`fabric_heading`** on the product:

```
Material
```

Then `fabric` itself:
```
Solid brass, sand-cast and hand-finished. Unlacquered, so it will darken and
patinate with handling.

If you prefer it bright, a cut lemon and a pinch of salt will take it back.
```

**`wash_instructions`**
```
Wipe with a dry cloth after use. Do not put it in the dishwasher — the
detergent will strip the finish unevenly.

To brighten: half a lemon dipped in salt, then rinse and dry immediately. Water
left standing on brass is what leaves marks.
```

**Upcycled pieces** — `craft_technique` is the whole story:
```
Made from fabric left over from our own production runs. No two are identical,
because no two offcuts are.

What you receive will match the colourway shown but may differ in where the
print falls.
```

`size_chart_note` for upcycled:
```
Made from offcuts, so the placement of the print varies piece to piece.
```

---

## 6. The sixth row, and the highlight flag

Two fields that behave differently from the rest and are easy to get wrong.

### `usp_6_*` — a row the template does not have

"Why you'll love it" has five blocks. A product can still fill a sixth, and the
row appears. There is no block behind it, so there is no fallback — it shows on
that one product and nowhere else, and `usp_6_icon` is the only way it gets an
icon.

Use it for the claim that is true of exactly one product. On a piece cut from a
single surviving bolt:

| Field | Value |
| --- | --- |
| `usp_6_icon` | `tag` |
| `usp_6_heading` | One length only |
| `usp_6_text` | Cut from a single bolt of handloom we will not see again. When this size is gone, it is gone. |

Leave `usp_6_highlight` empty — see below.

### `usp_N_highlight` — and why empty is not the same as false

The design intends **exactly one** highlighted row, and the template gives it to
row 5, "Made in Small Batches". The metafield overrides the block **in both
directions**, which is the part that catches people out:

| You want | Set |
| --- | --- |
| The highlight moved to row 3 on this product | `usp_3_highlight` = **true** *and* `usp_5_highlight` = **false** |
| No highlight at all on this product | `usp_5_highlight` = **false** |
| The normal behaviour | leave every `usp_N_highlight` **empty** |

Setting only the first half of row one gives you two green rows, which is the
most common mistake.

**Empty ≠ false.** Empty means "this product has no opinion, use the block
setting". `false` means "not on this product, whatever the block says". That
distinction is why the field is a real True/false type and not a text field.

---

## 7. Size chart pages

Create these once as Shopify pages, then point `size_chart_page` at them from
every product they suit. The dialog already styles tables — wide charts scroll
inside the dialog rather than breaking the page.

### Page: "Womens size chart" (handle `womens-size-chart`)

Paste into the page's rich-text editor as a table. All measurements in inches,
body measurements not garment measurements.

| Size | Bust | Waist | Hip |
| --- | --- | --- | --- |
| XS | 32 | 26 | 35 |
| S | 34 | 28 | 37 |
| M | 36 | 30 | 39 |
| L | 38½ | 32½ | 41½ |
| XL | 41 | 35 | 44 |
| 2XL | 44 | 38 | 47 |

Then, underneath:

```
How to measure

Bust — around the fullest part, tape level and not pulled tight.
Waist — around the narrowest part, usually just above the navel.
Hip — around the fullest part, about 8 inches below the waist.

These are body measurements, not garment measurements. Our pieces are cut with
ease built in, so a size M is made to fit a 36 inch bust comfortably rather
than exactly.

Between two sizes? Most of our styles are cut loose — take the smaller size for
a closer fit, the larger for more room. Where a style runs differently, it says
so on the product page.
```

### Page: "Kids size chart" (handle `kids-size-guide`)

| Size | Age | Height | Chest |
| --- | --- | --- | --- |
| 0-6M | 0-6 months | up to 26 | 17 |
| 6-12M | 6-12 months | 26-30 | 18 |
| 1-2Y | 1-2 years | 30-34 | 20 |
| 2-3Y | 2-3 years | 34-38 | 21 |
| 3-4Y | 3-4 years | 38-41 | 22 |
| 4-5Y | 4-5 years | 41-44 | 23 |
| 5-6Y | 5-6 years | 44-47 | 24 |
| 6-7Y | 6-7 years | 47-49 | 25 |
| 7-8Y | 7-8 years | 49-52 | 26 |

```
How to measure

Height — against a wall, without shoes.
Chest — around the fullest part, tape level and not pulled tight.

Go by height and chest rather than age where the two disagree — age is the
roughest guide of the three.

Our kids pieces are cut with growing room. Between two sizes, take the larger.
```

---

## 8. Icon names

For `usp_N_icon`. Anything not on this list draws no icon, silently.

| Name | Reads as |
| --- | --- |
| `leaf` | Natural fabric |
| `feather` | Light, breathable, soft |
| `flower` | Vintage or decorative detail |
| `needle` | Hand-finished, embroidered, smocked |
| `block-print` | Hand-block printing |
| `weave` | Structure, drape, weight |
| `garment` | Fit, cut, sizing |
| `hand` | Handmade, gentle on skin |
| `shield` | Tested, safe, certified |
| `box` | Small batches, made to order |
| `exchange` | Durability, returns, longevity |
| `tag` | Made to order |
| `process` | How it is made |
| `person` | The people who made it |
| `truck` | Shipping |
| `clock` | Time, lead time |
| `check` | A plain confirmation |
| `calendar` | Dates, delivery windows |
| `none` | No icon |

---

## 9. Tone: what to avoid

The copy above is built on three habits. They are what make it sound like the
rest of the site rather than like a catalogue.

**Name the thing.** "Cotton voile, 100% cotton" beats "premium natural fabric".
"Bagru, Rajasthan" beats "traditional Indian artisans". A specific is worth
three adjectives.

**Say what it does for the person.** "Deep enough for a phone" beats "functional
pockets". "Will not cost you two inches of drop" beats "pre-shrunk for your
convenience".

**Admit the trade.** "Small irregularities are part of hand-block printing."
"Unlacquered, so it will darken." A brand that names the downside is believed
about the upside. This is the habit the existing site copy already has, and it
is the one most easily lost when filling two hundred products in an afternoon.

Avoid: *elevate, curated, timeless, luxurious, must-have, effortlessly chic,
indulge, pamper, statement piece, wardrobe staple*. And exclamation marks.
