# PDP metafields — setup and reference

Four parts of the product page now read from product metafields, so one
template can serve a whole catalogue and each product can still speak for
itself. This is the setup guide and the reference for what reads what.

Two rules hold everywhere and are worth reading once:

1. **The metafield wins; the theme editor is the fallback.** Every setting in
   the theme editor still works and still does what it did. A product that
   fills the matching metafield overrides it for that product only. So nothing
   breaks on the day this deploys — the pages look exactly as they do now, and
   change one product at a time as the metafields get filled in.

2. **Empty means hidden, not blank.** A row with nothing from either source is
   removed, not left as an empty accordion. A column with no rows left is
   removed. A section with nothing left renders nothing at all. So you never
   have to "turn off" a row for a product it does not apply to — just leave it
   empty.

---

## 1. Before anything else: create the definitions

Liquid can read a metafield that has no definition, but **nobody can type into
one**. Without a definition there is no field on the product page in admin. So
the definitions come first.

**Where:** Shopify admin → **Settings** → **Custom data** → **Products** →
**Add definition**.

For each one, fill in three things and save:

| Field in admin | What to put |
| --- | --- |
| **Name** | Anything readable — it is the label staff see on the product page |
| **Namespace and key** | Exactly as given in the tables below, e.g. `custom.fabric` |
| **Type** | Exactly as given in the tables below |

Two settings worth getting right while you are there:

- **"Limit to specific values"** on the icon fields. It turns a free-text box
  into a dropdown, which is the difference between a working icon and a silent
  blank. The accepted list is in section 4.
- Leave **"Products can have multiple values"** OFF everywhere unless a table
  says list. A single field defined as a list will still render (the first
  entry is used for media, all entries become bullets for text) but the admin
  UI is needlessly fiddly.

> **You do not need all of them.** Create the ones for the job in front of you.
> Section 6 has a suggested order that gets the most value for the least admin
> work.

---

## 2. Size chart — per product

**The problem this solves:** the chart was one page per template. A kaftan, a
pair of trousers and a cushion cover on the same template needed different
charts, and the only way to give them one was a new template each.

### Definitions

Namespace `custom`, all on **Products**:

| Key | Type | What it does |
| --- | --- | --- |
| `size_chart_page` | **Reference → Page** | The chart, written once as a page and pointed at from many products. **Start here** — this is the one to use for most products. |
| `size_chart_image` | **File** (accept images) | The chart as artwork, for when the designer sends a JPG or PNG. |
| `size_chart` | **Rich text** | The chart as copy — "measure across the chest", a list of points. Rich text cannot hold a table; use a page for a table. |
| `size_chart_note` | **Multi-line text** | The one line that is genuinely per product: "this style runs small". |
| `size_chart_title` | **Single line text** | Renames the dialog. Optional. |

### How they resolve

```
Does the product have size_chart_image, size_chart or size_chart_page?
├── Yes → show whichever of those are filled, in this order:
│         1. size_chart_image   (the artwork)
│         2. size_chart         (the copy)
│         3. size_chart_page    (the page's content)
│         The template's page is NOT used.
└── No  → show the template's "Size guide page" setting.

size_chart_note always shows last, under whatever appeared above it.
```

The dialog heading is, in order: `size_chart_title` → the title of whichever
page supplied the chart → the link's own label ("Size Guide").

"Anything product-level at all means the template page is not used" is
deliberate. It keeps *this product has its own chart* a single decision rather
than a merge you have to reason about.

### Reuse across the catalogue

`size_chart_page` is the reuse mechanism. Write **Womens tops size chart** once
as a page, point fifty products at it, and edit it in one place forever. Use
`size_chart_image` / `size_chart` only for the product that is genuinely its
own case.

### Theme editor

Product page → **Variant picker** block → **Size guide**:

- **Size guide page** is now the *fallback*, used on every product with no
  metafield of its own. Leave the existing `size-guide` page here and it keeps
  working exactly as today.
- Leave it **empty** and the "Size Guide" link appears only on products that
  carry their own chart. That is the right setting for a template mixing
  clothing and non-clothing.

### Known limit

The link lives beside the size option, so a product with **only a default
variant** (no options at all) has nowhere to show it. If you need a chart on
one of those, give the product a real option or ask and we will add a second
opener.

---

## 3. Product details accordions — per product

The accordions already read metafields. What is new is that it now works for
every kind of metafield, in any namespace, and a product can rename a row.

### Any metafield type now works

Before, anything that was not rich text was escaped and printed — so a list
metafield arrived as one run-on word and a file metafield printed the name of
its own object. Now the type decides the markup:

| Metafield type | What appears in the accordion |
| --- | --- |
| Single / multi-line text | A paragraph, with your line breaks kept |
| Rich text | Its own formatting, as authored |
| **List** of any text type | Bullet points |
| File → image | The image, responsive |
| File → video | A video player |
| File → anything else | A download link |
| Reference → Page | That page's content, tables included |
| URL | A link |
| True / false | "Yes" or "No" |
| Integer / decimal | The number |
| Dimension / weight / volume | The number **with its unit** — "42 in" |
| Rating | "4.5 / 5" |
| Money | Formatted in the shopper's currency |
| Date / date-time | "4 March 2026" |
| Colour | A colour chip beside the hex code |
| Reference → Product / Collection / Variant | A link to it |

Not supported: **Reference → Metaobject** and **JSON**. Both render nothing
rather than something wrong. If you need a metaobject here, say so and it can
be wired to its specific fields.

### Any namespace

The **Metafield key** box on an accordion block takes either form:

- `fabric` → means `custom.fabric` (unchanged — every existing template keeps working)
- `specs.thread_count` → means namespace `specs`, key `thread_count`

So an app's namespace, or a second namespace of your own, works with no code
change.

### A product can rename a row

Fill `<key>_heading` in the same namespace and that product shows a different
heading. A row keyed `fabric` reads **`custom.fabric_heading`**.

This is for the product whose "Fabric" row is really about its brass, or its
leather. Every other product keeps the heading typed on the block — which still
has to be filled in, because it is how the row is recognisable in the theme
editor.

| Key | Type |
| --- | --- |
| `<any row key>_heading` | **Single line text** |

### Specification row: add your own

The Specification block had three fixed rows. It now takes three more, each a
label and a metafield key typed in the theme editor:

Product page → **PDP: Info columns** → the **Specification** block →
**More specifications**.

| Label 4 | Metafield key 4 |
| --- | --- |
| `Length` | `length` |
| `Thread count` | `specs.thread_count` |
| `Drop` | `drop` |

Each row appears only on products where that metafield is filled, and only when
both the label and the key are set here. The three original rows
(`custom.fit`, `custom.model_details`, `custom.fit_recommendation`) are
unchanged.

Spec values are one short line by contract, so a list is joined with commas, a
dimension shows its unit, and a true/false shows Yes or No.

### Keys already in use

These are wired into the existing templates and need definitions if they do not
have them yet. All namespace `custom`, all on Products:

| Key | Type | Used by |
| --- | --- | --- |
| `fabric` | Rich text | Fabric accordion |
| `craft_technique` | Rich text | Craft & technique accordion (hidden when empty) |
| `construction` | Rich text | Construction accordion |
| `silhouette` | Rich text | Silhouette accordion |
| `product_detailing` | Rich text | Product-specific detailing accordion |
| `wash_instructions` | Rich text | Wash instructions accordion |
| `fit` | Single line text | Specification → Fit |
| `model_details` | Single line text | Specification → Model |
| `fit_recommendation` | Multi-line text | Specification → Fit tip |
| `short_description` | Multi-line text | The intro in the buy box |

---

## 4. "Why you'll love it" — per product, everything

Every part of this card can now come from the product: the label, the opening
line, each row's heading, text, icon and highlight, and the image or video.
**The theme editor settings are untouched** — same fields, same layout, same
video controls. They are the fallback.

### Definitions

Namespace `custom`, on **Products**. `N` is 1 to 6.

| Key | Type | What it does |
| --- | --- | --- |
| `usp_label` | Single line text | The small uppercase label |
| `usp_lede` | Single line text | The serif opening line |
| `usp_media` | **File** (accept images **and** videos) | The card's image or video — see below |
| `usp_N_heading` | Single line text | Row N's heading. **This is what makes row N appear.** |
| `usp_N_text` | Multi-line text | Row N's body |
| `usp_N_icon` | Single line text, **limited to specific values** | Row N's icon |
| `usp_N_highlight` | **True or false** | Whether row N is the green highlighted row |

### One field for image *or* video

`usp_media` is a single **File** metafield. Set its validation to accept images
and videos, then upload whatever the shoot produced — the section works out
which it is:

- An **image** renders as the card photo.
- A **video** renders as a real video player, using the section's existing
  autoplay, loop, mute and controls settings. Nothing needs re-setting per
  product.

Media precedence:

```
custom.usp_media (video)     ← wins over everything
custom.usp_media (image)
section: Video (uploaded)
section: Video link (YouTube / Vimeo)
section: Closing image
```

A **YouTube or Vimeo link stays a section setting**. Shopify has no metafield
type that holds one as an embeddable video rather than as a bare string, so
there is nothing reliable to read per product. Upload the file, or set the link
on the section.

### Rows are positions, not blocks

Row 1 reads `usp_1_*`, row 2 reads `usp_2_*`, and so on to 6. The mapping to
blocks is unchanged — slot 1 is the first block — so dragging a row in the
theme editor still reorders which metafield shows where.

What is new: **a product can fill a row the template has no block for.** Fill
`usp_6_heading` on a five-block template and a sixth row appears, taking its
icon from `usp_6_icon`. A row with no heading from either source is hidden.

### Icon names

Put one of these in `usp_N_icon`. Use **"Limit to specific values"** on the
definition so staff get a dropdown — anything not on this list draws no icon at
all, silently.

```
leaf        flower      needle      shield      box
feather     hand        weave       block-print garment
tag         exchange    process     person      truck
clock       check       calendar    none
```

### Highlight

`usp_N_highlight` is a true/false field and it overrides the block **either
way** — set it to false and that row is not highlighted even if the block says
it should be. That is why it is a real boolean and not a checkbox-ish text
field: "the product has not decided" has to be distinguishable from "the
product says no".

The design intends **one** highlighted row.

---

## 5. "Need any help?" — social channels and the mobile break

No metafields. All theme editor.

### Add any channel you like

Product page → **PDP: Need any help** → **Add block** → **Contact**. Up to six.

Each block has five settings:

| Setting | What to put |
| --- | --- |
| **Icon** | Pick from the dropdown |
| **Link text** | What the shopper reads — `Call`, or the number itself |
| **Action** | How the number becomes a link — see below |
| **Number or email address** | Type it however reads best |
| **Link** | Only used when Action is *Open a link* |

Actions:

| Action | Builds | Type the number as |
| --- | --- | --- |
| Start a phone call | `tel:` | `+91 93197 50031` — spaces and dashes are stripped, the plus sign is kept |
| Open WhatsApp | `wa.me` | Same — the plus sign is stripped too, because wa.me rejects it |
| Open an email | `mailto:` | `hello@example.com` |
| Open a link | The **Link** field | Leave the number empty; put the URL in **Link** |
| Show as text, no link | nothing | For an address or opening line |

**Type the number once.** This used to be two fields — a number to show and a
digits-only number to link — because one string cannot be valid for both `tel:`
and `wa.me`. Now the block says which kind of link it is, so the stripping is
decided per channel.

Icons available: Phone, WhatsApp, Chat, Email, Instagram, Facebook, YouTube,
Pinterest, TikTok, X / Twitter, LinkedIn, Telegram, Address, Website, or no
icon.

### Nothing to do to deploy this

A section with **no Contact blocks** falls back to the old Call and WhatsApp
settings, which every existing template already carries. So this ships without
touching a template. Add one Contact block and the fallback is ignored
completely — so add all the channels you want at once, including Call and
WhatsApp, not just the new ones.

### The mobile line break

"Need any help?" and "Get in touch." now break onto two lines on a phone and
still run on as one sentence on a desktop. It is automatic — the two existing
settings (Line one / Line two) decide where the break falls.

### Three or more channels

Two channels sit beside the copy on a phone, which is the reviewed design.
From three up the card stacks on small screens instead — copy, then the
channels, then the hours. The section counts its own blocks to decide, so there
is nothing to set.

---

## 6. Suggested order of work

Most value for the least admin work:

1. **`size_chart_page`** (1 definition). Write one page per real chart, point
   products at them. This is the task 1 win on its own and it is an afternoon.
2. **`size_chart_note`** (1 definition). "Runs small" per product, no chart
   work needed.
3. **Contact blocks** on "Need any help?" (0 definitions). Theme editor only.
   Do it while the metafields are being created.
4. **`usp_media`** (1 definition). Per-product photo or video on the
   "Why you'll love it" card.
5. **`usp_1_heading` … `usp_5_text`** (10 definitions). The rows the current
   template already has. Fill them on your best-selling products first; every
   other product keeps the block copy.
6. **`usp_N_icon` / `usp_N_highlight`** (12 definitions). Refinement. Skip
   until rows 1–5 are earning their place.
7. **Spec extras** and **`<key>_heading` overrides**. As specific products need
   them, not up front.

---

## 7. Testing checklist

Preview a product page and check each of these. They are the cases that break
quietly rather than loudly.

**Size chart**

- [ ] A product with **no** size chart metafields still shows the template's
      chart, unchanged.
- [ ] A product with `size_chart_page` shows **its** chart, not the template's.
- [ ] A product with `size_chart_image` shows the image, and it is not blown up
      past its own resolution.
- [ ] A product with `size_chart_note` shows the note under the chart in both
      of the above cases.
- [ ] Clear the template's **Size guide page** setting: the link disappears on
      products with no chart, and stays on products that have one.
- [ ] The dialog closes on the X, on Escape, and on a backdrop click.
- [ ] A wide chart table scrolls **inside** the dialog, not the whole page.

**Product details**

- [ ] An existing template renders identically before any new metafield is
      filled.
- [ ] A list metafield shows bullet points, not one run-on word.
- [ ] A dimension metafield shows its unit.
- [ ] A row with `metafield_only` ticked is absent on a product with no value,
      rather than showing fallback copy.
- [ ] A `<key>_heading` override changes the heading on that product only.
- [ ] A spec extra row appears only where its metafield is filled.

**Why you'll love it**

- [ ] A product with no metafields renders exactly the block copy, as today.
- [ ] `usp_2_heading` on one product changes row 2 there and nowhere else.
- [ ] `usp_media` with an **image** replaces the section image.
- [ ] `usp_media` with a **video** plays, is muted, and loops — check on a
      phone, where an unmuted autoplay is blocked silently.
- [ ] `usp_6_heading` on a five-block template produces a sixth row.
- [ ] A bad icon name draws no icon and does not shift the other rows' icons.
- [ ] `usp_3_highlight` set to false un-highlights a row the block highlights.

**Need any help?**

- [ ] Before adding blocks, the card looks exactly as it does today.
- [ ] Two channels: one row on a phone, copy left, channels right.
- [ ] Four channels: stacked on a phone, nothing overflowing the border.
- [ ] "Need any help?" breaks after line one on a phone and runs on at desktop
      width.
- [ ] Every channel opens the right thing on a real phone — `tel:`, WhatsApp
      and `mailto:` behave differently on desktop and cannot be trusted there.

---

## 8. What changed in the theme

| File | Change |
| --- | --- |
| `snippets/pdp-metafield.liquid` | **New.** Renders any metafield type as finished markup. Shared by the accordions, the size chart and anything added later. |
| `snippets/pdp-size-chart.liquid` | **New.** Resolves and renders the size guide dialog body. |
| `sections/main-product.liquid` | Resolves once whether a chart exists, so the link and the dialog cannot disagree; the dialog body is now the snippet above. |
| `snippets/product-variant-picker.liquid` | The Size Guide link appears for a product-level chart, not only a template page. |
| `sections/pdp-info-columns.liquid` | All metafield types; `namespace.key`; per-product row headings; three extra Specification rows. |
| `sections/pdp-why-love.liquid` | Label, lede, per-row icon and highlight, and the image-or-video file, all per product. Rows walk the six slots, so a product can fill one the template has no block for. |
| `sections/pdp-help.liquid` | Repeatable Contact blocks with per-channel link building; mobile line break; stacks from three channels. Falls back to the old settings when no blocks exist. |
| `snippets/pdp-icon.liquid` | Facebook, Email, YouTube, X/Twitter, LinkedIn, Pinterest, TikTok, Telegram, Address, Website, Chat — drawn as line glyphs to match the existing set. |
| `assets/product-page.css` | Styles for metafield-rendered content and the size chart body; the "Need any help?" break and stacked layout. **Also a fix:** the size guide dialog is moved to `<body>` by Dawn's ModalDialog, so it sat outside every `.pdp` root and the `--pdp-line` / `--pdp-sand` its table styling already referenced resolved to nothing — table borders fell back to `currentColor` and the header row had no ground. The tokens are now declared on the dialog too. |

### A note on deploying

`templates/*.json` does not reliably reach this store, which is why the
sections carry presets and why every setting has a default. Nothing here needs
a template change:

- The size chart falls back to the template's existing page setting.
- "Need any help?" falls back to its existing Call and WhatsApp settings.
- "Why you'll love it" and the accordions fall back to their existing block
  copy.

Deploy the theme, then fill metafields at whatever pace suits.
