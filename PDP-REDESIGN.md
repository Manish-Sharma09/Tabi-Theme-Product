# Product page redesign

What changed, what you need to set up in Shopify admin, and how to roll it out
to the remaining templates.

**The redesign is live on one template only: `templates/product.new-design.json`.**
The other 21 product templates are back to exactly their pre-redesign state and
render as they always did — they do not even request `product-page.css` or
`product-page.js`, because that pair is loaded from inside the
`enable_new_layout` branch. Rolling out to the rest is section 5, and it is a
deliberate step, not something that happens by leaving this branch merged.

---

## 0. Second round: the Product Page Analysis changes

A second review (`Product Page Analysis`, with a reference mockup) reordered the
page and changed several of the pieces described further down. **Where sections
1–7 and this section disagree, this section is current.** What changed:

This round was rebased onto `Update from Shopify for theme Tabi - Theme
(Testing Version)`, a sync of theme-editor work done in parallel. Everything
that sync brought down is kept: both bands' images and decorative images, the
approach section's `cta_url`, the two `custom_css` blocks, the related-products
colour scheme, and `buy_now_style: custom`. Disabling a section does not throw
its settings away — the images on *Made in small batches* are still on it.

**Page sequence** is now `main → Product details → You may also like → Why
you'll love it → A Tabi journey`. Two sections were dropped from the sequence
and are `"disabled": true` in `templates/product.new-design.json` rather than
deleted — every setting survives and the theme editor's show/hide eye brings
either one back:

- *Made in small batches* (feature band). Its content is now the highlighted
  fifth row inside "Why you'll love it".
- *Our three-part approach*. Not in the reviewed sequence.

**Benefit icons** are the site green (`#253c30`, the token `--pdp-green`) and
read `Natural Fabric · Handcrafted · Made to Order · Easy Exchanges & Returns`.
"Gentle on Skin" is gone; the open-palm icon carries "Handcrafted" and the tag
icon "Made to Order".

**No size arrives pre-selected.** The variant picker has a *Do not pre-select a
size* checkbox, on for `product.new-design`. Add to cart is disabled and reads
"Select a size" until the shopper picks one. See section 4.

**Fit notes moved out of the buy box** into a *Specification* accordion in the
Product details section. The `pdp_fit` block is disabled, not deleted.

**The pincode box** is drawn on `#efede9` (`--pdp-sand`) with a `#253c30` CHECK
button matching Add to cart, a 1px black field border, and its heading in the
product title's serif at the product title's weight rather than bold body text.

**"Why you'll love it"** is no longer three columns. It is a sand card: a
label, one serif line, and up to six rows of icon + heading + body, one of
which can be inverted to the brand green and bled to the content's edges, plus
a photograph.

The reviewed design for it is a phone layout, so the card has two shapes. Up to
990px it is that layout — held to 72rem and centred, photograph beneath the
rows. From 990px, the width at which the buy box above also goes side by side,
the card takes the full page width and splits: copy in one half, the photograph
filling the other. Left as one narrow column it rendered on a 1500px page as a
phone screenshot stranded in the middle of the section. The photograph is taken
out of the flow above 990px so the rows of copy size the card and
`object-fit: cover` crops the photo to fit — the same device, for the same
reason, as the seal band in section 4. Without an image the card stays the
single centred column at every width, because there would be no second column
to fill.

**"A Tabi journey"** (the *Tabi way* band) sits directly after "Why you'll love
it" with `decor_style: none` — the turning TABI seal is off, because the logo is
already in the header. The seal code is untouched and section 4's description of
it still holds for any band that switches it back on.

**The closing photograph** on the "Why you'll love it" card is the image that
was uploaded to the *Made in small batches* band in the theme editor. The
band's content became the highlighted row, so its photograph came with it —
swap it in the section's *Closing image* field if the mockup means a different
photo.

**Craft & technique** shows only on products that have `custom.craft_technique`.
Accordion rows now carry a *Hide this row when the metafield is empty* checkbox,
which turns the typed fallback off; it is on for that row only.

### Still to fill in after this round

| Where | What | What renders today |
|---|---|---|
| Products → `custom.fit`, `custom.model_details`, `custom.fit_recommendation` | Fit and model details | The *Specification* accordion is hidden — it has no typed fallback |
| Products → `custom.craft_technique` | Hand-block printing, embroidery, quilting, smocking | The *Craft & technique* accordion is hidden, by design |

"Tested for Harmful Substances" is live and cites **REACH standards**, which is
the standard the store's own Materials copy already names. If a different
certification is what the fabric is actually tested against, that row's text is
a theme-editor field.

---

## Third round

**The size gate is gone,** not switched off. Add to bag works on the first
available size the moment the page loads. This reverses "18M size is
automatically selected, please remove this otherwise it can create an
accidental order" from the Product Page Analysis, and puts that risk back: a
shopper who never touches the size row can order a size they did not pick.

It was first switched off through `require_size_selection` on the variant
picker block, and the theme went on rendering the gate anyway - `templates/*.json`
is owned by the theme editor, the store's copy still said `true`, and the
pushed `false` never took. A setting that cannot be relied on to be off is not
a way to turn something off, so the code went instead. git history has it if
the accidental-order concern comes back.

**Which brings up the thing to know about this repo: pushing a template does
not reliably change the theme.** Everything else does. Verified against the
live page after one push: `assets/product-page.css`, `locales/en.default.json`
and `sections/main-product.liquid` were all current, while
`templates/product.new-design.json` was several commits behind and
`sections/pdp-info-columns.liquid` had not arrived at all.

So anything that has to actually take effect belongs in a schema default or in
code, never only in a template setting. That is why the "Need any help?" panel
reads section settings that all carry defaults, and why the size gate was
deleted rather than disabled.

**One green.** `--pdp-accent` was `#3f4a2e` and the add-to-bag hover `#354027`,
so the page carried three olives. Both now resolve to `--pdp-green` (#253c30).
`--pdp-green-deep` exists only so a hover still reads as a state change.

**The buy box shows a short intro,** from `custom.short_description`, and no
"Read more". The full `product.description` moved to a Description accordion in
the information section. The intro does NOT fall back to the full description
when the metafield is empty — falling back would put the long copy straight
back in the buy box on every product nobody has written an intro for.
**So `custom.short_description` is a new metafield to create** (multi-line
text), and the buy box has no copy until it is filled.

**Product details** gained two rows: Description, and a size-help row carrying
the Instagram handle and the WhatsApp number. The buy box keeps its own
size-help block as well.

**Related products** sits between "Why you'll love it" and the Tabi journey
band.

**"Why you'll love it" takes a video** — uploaded to Shopify, or a YouTube or
Vimeo link — with autoplay, mute, loop and controls, plus a media shape and a
desktop split. A video wins over the image; clear it to go back to the photo.
Muting is forced whenever autoplay is on: browsers block an unmuted autoplay
and the failure is silent. The shape applies below 990px, where the media has
a box of its own; above that it is one half of the card and its height is
whatever the rows of copy come to. On mobile the media now leads, and the
section's own padding is cut to 40% — the card is the section there, so the
page padding on top of the card's own padding read as dead space. The card also
goes full bleed under 750px.

**The gallery autoplays its first video** when `autoplay_media` is on. Dawn
keeps every video in a `<template>` inside `<deferred-media>` and clones it in
on a poster click, so `autoplay` in Liquid alone does nothing — there is no
video element on first paint. The script calls Dawn's own `loadContent(false)`
instead. Only the first one starts: `loadContent()` calls `pauseAllMedia()` on
the way in, so two racing would each pause the other.

**The size guide cross works.** Dawn's `ModalDialog` binds its close handler
with `this.querySelector('[id^="ModalClose-"]')` in the constructor. The button
was `PdpSizeGuideClose-`, so that returned null, the constructor threw on the
`addEventListener` after it, and the ESC-key and backdrop-click listeners
registered below it never bound either — the dialog opened with no way at all
to close it. The id now starts with `ModalClose-`.

Its mobile layout is fixed too. Dawn sets `top: 0; margin-top: 5rem;
height: 80%`, which on anything taller than about 250px puts the last 50px of
the panel below the fold, so the bottom of a size chart was unreachable. Both
edges are pinned instead, the padding is symmetric (Dawn's was `0 1.5rem 0
3rem`), the close button is 44px, and a wide chart scrolls inside its own box.

**The active thumbnail** is one black hairline. Dawn draws a 1px border and a
1px box-shadow ring on top of it, which reads as a 2px frame.

**The breadcrumb** was already in `sections/main-product.liquid`, in a desktop
and a mobile variant with their own inline `<style>`. Only its colours and type
are restated, in `product-page.css`, so the trail belongs to the redesign
rather than sitting on it in #282b30 at 14px. The selectors carry
`nav.breadcrumb.onlydesktopbredcrumb` because that inline block is that
specific.

### "Need any help?" is its own section

`sections/pdp-help.liquid`, placed directly after the information accordions,
and it replaces the buy box's *Size help* block - that block is now disabled on
the template.

A section rather than part of `pdp-info-columns`, for a reason particular to
this theme: a section can be dragged in from the theme editor. Pushing
`templates/*.json` does not reliably reach the store here, so **if the section
does not appear after a push, add it by hand** - Customize, the product
template, Add section, "PDP: Need any help". Every setting carries a default,
so one added that way renders complete without filling a field.

Its classes are `pdp-needhelp*`, not `pdp-help*`. The buy box's size-help
snippet already owns `.pdp-help`, `.pdp-help__title` and `.pdp-help__text`; the
first version of this section reused those names, which would have restyled the
size-help block on any template still showing it.

The two numbers are separate fields from the two labels. `wa.me` rejects spaces
and plus signs while `tel:` accepts them, so one field cannot serve both the
text shown and the link followed.

The reference design sets this in a geometric sans. It renders in the theme's
own heading family instead, so it does not read as imported from another store -
change `.pdp-needhelp__title` if the sans is wanted.

### Three interactive additions

**Hover zoom.** `image_zoom` is `hover` rather than `lightbox`. Both work at
once - `snippets/product-thumbnail.liquid` renders the lightbox opener
regardless, and `image_zoom` only picks the magnify class and the corner icon -
so the main image magnifies under the pointer and still opens full size on a
click. Dawn's own `magnify.js` does the work; nothing was written for this.

**The sticky add-to-bag bar now appears on scroll.** It already existed
(`sections/sticky-atc.liquid`, rendered for every product page from
`layout/theme.liquid`) but shipped with `show` hardcoded on the element and its
scroll handler commented out, so it sat across the bottom of the page from
first paint.

The handler it replaces measured the add-to-bag button's position once on
DOMContentLoaded. That number goes stale the moment anything above the button
changes height - a gallery image finishing loading, a variant change
re-rendering the buy box, a phone rotating - and the bar then appeared at the
wrong scroll position or not at all. An IntersectionObserver watches the button
itself instead: no measurement, survives every relayout, and fires only when
the button actually leaves the viewport. It is re-pointed on variant change,
because product-info replaces the markup holding the button it was watching.
The bar's height is reserved as page padding while it is shown, so a fixed bar
cannot cover the footer.

Its button needed no restyling - the section is on `scheme-5`, whose button
colour is already #253c30.

**Thumbnail hover swaps the main image**, on desktop with a real mouse. It
calls Dawn's own `setActiveMedia()` so the thumbnails' `aria-current`, the live
region and the slider's bookkeeping stay in step. Images only: that method ends
by calling `playActiveMedia()`, and a video starting because the pointer
crossed its thumbnail is an ambush rather than a swap. 70ms delay, cancelled on
mouseleave - sweeping across a six-thumbnail rail otherwise ran five swaps on
the way to the last one.

**`max_blocks` is 30** on the main product section. Dawn ships it without one,
which means Shopify's default of 16, and the redesigned templates carry 19.

---

## 1. Before anything goes live

Work on a **duplicate theme**, not the live one:

1. Shopify admin → Online Store → Themes → ⋯ → **Duplicate**
2. `shopify theme dev --theme <duplicate-id>` to preview locally, or
   `shopify theme push --theme <duplicate-id>` to upload
3. Publish only after the QA list in section 6 passes

Nothing in this branch changes a template you have not migrated. The redesign is
gated behind a section setting (`enable_new_layout`), so an un-migrated template
renders exactly as it does today even with all the new code present. That gate
is what makes the current split safe: 21 templates carry none of the redesign's
settings, so every new branch in the shared snippets evaluates to the old
behaviour — `buy_now_style` falls back to `dynamic`, `related-products` to the
grid and an `<h2>`, and the variant picker to Dawn's plain legend.

---

## 2. Metafields to create

Admin → Settings → **Custom data** → Products → Add definition.

All of these live in the `custom` namespace. Every one is optional: a row, a
column or a whole section hides itself when its metafield is empty, so you can
create the definitions now and fill them in over time.

### Buy box — fit notes

| Key | Type | Example |
|---|---|---|
| `fit` | Single line text | `Relaxed` |
| `model_details` | Single line text | `Model is 5'9 and is wearing size M` |
| `fit_recommendation` | Multi-line text | `If you are between sizes, we recommend sizing up.` |

### "Why you'll love it" — up to six rows

One heading and one text metafield per row, numbered by the row's position in
the theme editor. The template ships five rows, so `usp_1_*` through `usp_5_*`
are the ones worth creating; the section reads up to `usp_6_*`.

| Key | Type | Example |
|---|---|---|
| `usp_1_heading` | Single line text | `Relaxed, Comfortable Fit` |
| `usp_1_text` | Multi-line text | `An easy silhouette designed to let your little one move comfortably.` |
| `usp_2_heading` | Single line text | `Vintage-Inspired Details` |
| `usp_2_text` | Multi-line text | `Nostalgic details thoughtfully reimagined for everyday wear.` |
| `usp_3_heading` | Single line text | `Crafted with Care` |
| `usp_3_text` | Multi-line text | `Finished with thoughtful details such as smocking, hand embroidery or hand-block printing.` |
| `usp_4_heading` | Single line text | `Tested for Harmful Substances` |
| `usp_4_text` | Multi-line text | `The fabric has been independently tested according to REACH standards.` |
| `usp_5_heading` | Single line text | `Made in Small Batches` |
| `usp_5_text` | Multi-line text | `Thoughtfully produced in limited runs and often made to order.` |

Row 5 is the highlighted one. Every row falls back to the text typed on its own
block, so filling these in is optional and per product — leave them empty and
the collection-level copy on the template stands.

The icons are **not** metafields — pick them per template on the section's row
blocks in the theme editor. The mockup's five are `leaf`, `flower`, `needle`,
`shield` and `box`.

### Product information accordions

| Key | Type |
|---|---|
| `fabric` | Single line text *(you already use this on product cards)* |
| `craft_technique` | Multi-line text |
| `construction` | Multi-line text |
| `silhouette` | Multi-line text |
| `product_detailing` | Multi-line text |
| `wash_instructions` | Multi-line text |

Fabric composition, care, shipping and returns copy migrated over from your
existing accordions as fixed text per template, so those already have content.
Point any accordion at a metafield later by filling in its **Metafield key**
field in the theme editor — it then shows that metafield instead of the typed
text, and hides itself on products where the metafield is empty.

Rich text metafields work too — the theme renders their HTML rather than
escaping it.

---

## 3. Theme editor settings to fill in

Open the migrated template in the theme editor (Customize → pick the product
template) and set:

**Product information section**
- *Size help* block → your real WhatsApp number. Two fields: the number **shown**
  (`+91 98765 43210`) and the number **for the link** (`919876543210`, digits
  only). They are separate on purpose — `wa.me` rejects spaces and plus signs.
- *Delivery check* block → dispatch days, transit days, and optionally:
  - **Faster zones**: one rule per line, `prefixes | min days | max days`, e.g.
    ```
    400,401,410 | 1 | 2
    11,12,13    | 2 | 4
    ```
    First matching line wins, so list the tightest prefixes first.
  - **Pincodes not served** and **COD pincodes**: comma-separated prefixes.
    Leave empty for "everywhere".

**Feature bands** — both need images:
- *Made in small batches* → the block-printing photo, plus the botanical sprig
  as the decorative image
- *The Tabi way* → the lifestyle photo, the round TABI seal as the decorative
  image, and a link to your about page

**Approach section** → the "Discover how Tabi works" button link.

### What is still empty on `product.new-design`

These settings carry a label with nothing behind it. Each is a theme-editor
field, not a code change, and each will need filling again for every template
you later roll out to:

| Setting | Count | What renders today |
|---|---|---|
| Feature band → *Image* | 2 bands | Band collapses to a single full-width column |
| Feature band → *Decorative image* | 2 bands | Nothing; the artwork is optional |
| *The Tabi way* → *Link* (label is `Read more about us`) | 1 | Link hidden until the URL is set |
| Approach → *Button link* (label is `Discover how Tabi works`) | 1 | Button hidden until the URL is set |
| ~~Size help → *WhatsApp number*~~ | — | Filled: `+91 93197 50031`, the number in the footer's *Connect with us* block |

A label with no destination used to render `href="#"`, which looked live and
jumped to the top of the page when clicked. Both sections now require the URL
as well as the label, so an unfinished link is visibly absent rather than
quietly broken — see section 4.

### Two places the mockup and your existing copy disagree

The information columns' *Shipping* and *Exchanges* rows use the mockup's
sentences as their row headings. Two of them state a policy the store's own
accordion copy states differently, so the mockup's wording was **not** taken as
fact — decide these and set them in the theme editor:

| Row | Mockup says | Your existing copy says | What is live now |
|---|---|---|---|
| Exchange window | "Easy exchanges within 7 days." | "within 5 days of delivery" | **5 days**, the store's own number |
| Refund method | "Refunds via original payment method or store credit." | Does not say | The mockup's heading, with the body deferring to the policy page |

The exchange window was left at 5 because a heading of 7 above a body of 5 is a
customer-service problem, not a design decision. The refund row is the mockup's
claim and needs confirming against the actual policy before publishing.

`product.new-design` has `size_guide_page` set to `size-guide`. When you roll
out, set it on clothing templates only — `migrate_pdp.py` picks it up from each
template's own Size Guide tab, so home, table-linen and toy templates correctly
end up with none.

---

## 4. What the code does

### New files

| File | Purpose |
|---|---|
| `assets/product-page.css` | All redesign styling, including the shared section rhythm. Loaded only by the product page's own sections. |
| `assets/product-page.js` | Delivery check, carousel, buy now, info-column breakpoint sync. |
| `snippets/pdp-icon.liquid` | The line-icon set. |
| `snippets/pdp-trust-icons.liquid` | Four-up reassurance strip. |
| `snippets/pdp-fit-details.liquid` | Fit / model / recommendation rows. |
| `snippets/pdp-size-help.liquid` | Instagram + WhatsApp prompt. |
| `snippets/pdp-usp-line.liquid` | "Free Shipping • COD Available". |
| `sections/pdp-why-love.liquid` | The product highlights card — rows on sand, one optionally highlighted, with a closing image. |
| `sections/pdp-feature-band.liquid` | Image + text band, used twice. |
| `sections/pdp-info-columns.liquid` | Product information accordions, in the design's four columns. |
| `sections/pdp-approach.liquid` | Three-part approach + CTA. |

The pincode box has no file of its own. It used to live in
`snippets/pdp-delivery-check.liquid`, and the store answered that render with
`Could not find asset snippets/pdp-delivery-check.liquid` — the file was in the
repository but never reached the theme, while its sibling `pdp-` snippets did.
Its markup now sits inline in `sections/main-product.liquid` under the
`pdp_delivery` block, so there is no separate file left to go missing. Settings
and behaviour are unchanged.

### Spacing

Every section below the buy box passes its padding to `.pdp-section` as
`--pdp-pad-top` / `--pdp-pad-bottom` rather than writing `padding-top` into its
own inline style. Two things follow, and together they are what makes the gaps
down the page even:

- one mobile scale for all of them. Dawn's own sections quietly render
  three-quarters of their configured padding below 750px. The PDP sections used
  to apply the raw number at every width, so sections set to the same value in
  the theme editor still came out unevenly spaced against the main product
  section and the related products row.
- adjacent sections contribute equal halves to the gap between them. Every
  section on the prototype template is set to 48 / 48, so every gap is the same.
  `migrate_pdp.py` uses a single `SECTION_PADDING` constant for the same reason
  — change it there rather than section by section.

### Existing files touched

All changes are additive and default to current behaviour:

- `sections/main-product.liquid` — `pdp` root class behind `enable_new_layout`;
  five new block types appended to the `case` (the last of which carries the
  pincode box inline); the size guide modal; `enable_sticky_media`, which pins
  the gallery on desktop while the buy box scrolls past it. Every existing
  branch is unchanged.
- `snippets/product-variant-picker.liquid` — optional "Size Guide" link and
  option label override, plus the `data-pdp-size-gate` marker on the size
  fieldset. Without `size_guide_page` and `require_size_selection` set, renders
  as before.
- `snippets/buy-buttons.liquid` — optional custom BUY NOW. Defaults to
  `buy_now_style: dynamic`, i.e. today's behaviour.
- `sections/related-products.liquid` — optional carousel layout and small
  uppercase heading. Defaults to the grid and `<h2>`, and the migrated
  templates use those defaults: the row renders the theme's own product cards
  in the theme's own grid, so it matches the collection pages. The carousel is
  still one setting away if you want it.

**`assets/custom-fixes.css` was not touched.** It loads globally, so redesign
rules deliberately live in a separate stylesheet that only the product page
requests. Its section 10 (mobile PDP media capped at 78vh) still applies and
still wanted.

### No pre-selected size

Shopify picks the first available variant, so the buy box arrived with a size
already chosen — a shopper who never touched the size row could add 18M to the
cart by accident. With *Do not pre-select a size* on, the page loads with no
chip selected, Add to cart disabled, and its label replaced by "Select a size";
the first click on any size releases all three.

Three decisions worth knowing, because each one had an obvious alternative:

**It is done in the browser, not in Liquid.** Suppressing `checked`
server-side needs a "did the URL choose a variant" signal, and the only one
available — `product.selected_variant` — is documented against `?variant=`.
Dawn re-renders the picker through `?option_values=`, so a gate built on
`selected_variant` risks leaving Add to cart disabled *after* the shopper has
in fact chosen a size, which is a broken store rather than a cosmetic bug.
Clearing the pre-selection in the browser needs no such guarantee: the markup
Shopify renders, and every re-render after it, stays Dawn's own. A shopper with
JavaScript off gets today's behaviour — a pre-selected size and a working
button — rather than a page that cannot add to cart.

**The script is inline in `sections/main-product.liquid`, not in
`product-page.js`.** It runs while the parser is still inside the section, so
the chip is cleared before the row can paint; out of a deferred file the
selected chip could flash first. And a gate that disables Add to cart has to
own the code that re-enables it — split across a deferred file, a script that
failed to load would leave the button disabled with no way back.

**Only the named size option is gated**, not every option group. Clearing all
of them would mean a Size + Colour product re-selecting a size the moment the
shopper picked a colour: the section is re-rendered with whatever option values
are set, and a colour on its own resolves to the first available variant, size
included.

Two smaller notes. The gate is skipped when the URL already carries `variant`
or `option_values`, so a shared link to a chosen size still arrives chosen. And
Enter inside the quantity field submits the form even with the button disabled,
so the gate also blocks `submit` — with `stopImmediatePropagation`, because
submit fires with the form as its target, where capture and bubble listeners
run in the order they were added and a deferred `product-form.js` always adds
its own after this one.

The custom BUY NOW button needs no separate gate. `PDPBuyNow` already watches
the add-to-cart button's `disabled` attribute through a `MutationObserver` and
mirrors it, for the sold-out reason described in `assets/product-page.js`, so
disabling one disables the other and releasing one releases the other. That
matters now that `buy_now_style` is `custom` on this template. With
`product-page.js` missing the button is inert anyway — it is `type="button"`
and every line that makes it do anything lives in that file.

A product with a single size still asks for the click. That is the instruction
applied uniformly; if it reads as friction on one-size products, the gate is a
checkbox and can be turned off per template.

### The information columns

Two levels, as the design draws them: a column heading and a stack of accordion
rows underneath, all inside one bordered box.

The box is drawn by the grid itself — one hairline round the outside, and the
columns divided by hairlines rather than by a gap. The dividers are borders on
the columns with padding inside them, not a gap with a rule sitting in it: a
border on a grid item is drawn at that item's own edge, so with a gap the rule
hugs one column and leaves a gap's width of white on the other side. The columns
stretch to a common height, which is what runs a divider the full height of the
box when one column holds two rows and its neighbour holds five.

The column count follows the width: one on a phone (columns divided
horizontally), **two between 750px and 989px**, and one per surviving column
heading from 990px up. Four of them at tablet width came to about 120px of text
each and every row heading wrapped to two or three lines.

The column heading carries no rule of its own any more, and the last row in each
column carries no bottom rule — the box and the dividers do that work now.

Shopify section blocks are a flat list, so "rows inside a column" needs
expressing some other way. A **Column heading** block starts a column and every
**Accordion** block after it belongs to that column until the next Column
heading. Moving a row between columns in the theme editor is then exactly what
it looks like — dragging it above or below a heading — and no row has to be told
which column it lives in. The number of columns is however many headings
survive, not a setting.

The first version of this section *did* number every row's column, and wrapped a
group `<details>` around a row `<details>` with a script opening and closing the
outer layer at 750px. The column numbers are gone for good. The two levels are
back because the design asks for them, but the outer one is a `<button>` and a
`<div>`, which is what removes the breakpoint script: a column's rows are shown
or hidden by an `is-open` class that CSS owns at every width, rather than by the
browser's own `<details>` machinery, which a media query cannot overrule. So
there is no accordion nested inside an accordion, and the columns behave the
same way at every width.

Columns ship open — `is-open` and `aria-expanded="true"` are in the markup — so
`product-page.js` only ever *removes* correct state. With the script blocked or
broken every column is still open and readable and only the folding is missing,
which is the right way round for copy a shopper came to read.

The two levels are deliberately unalike, because a heading that looks like a row
is how a nested accordion gets confusing: the column heading is uppercase,
tracked and near-black, while a row is sentence case, untracked, muted and sits
on a hairline. Only rows carry body copy.

### The turning seal

The **Tabi way** band carries the round seal from the brand artwork: `TABI`
held still in the middle while `A PLACE TO BELONG` turns slowly around it, and
stops while a visitor hovers it.

It is drawn in `snippets/pdp-seal.liquid` rather than uploaded as an image, so
both lines of wording and the name stay theme settings, and the mark stays
sharp at any size. Three things about how it is built:

- **Two arcs, not one ring.** Both halves of the artwork read left to right —
  the top with its letters' tops pointing up and out, the bottom with theirs
  pointing down and out. That is two arcs drawn in opposite directions between
  9 and 3 o'clock. One continuous circle would run the bottom half right to
  left, which is a different mark.
- **Each line fills its half.** `textLength` spaces every line to the same span
  of arc, so retyping either one keeps the ring evenly set instead of drifting
  off centre. Around 16–22 characters a line reads best; much shorter and the
  letters spread very wide.
- **The middle word is sized to fit.** A fixed size only works for a word the
  length of the one it was set for — a six-letter name at the drawn size runs
  straight through the ring and out over the stars. Liquid estimates the width
  and picks the largest size that still occupies the measure `TABI` does, so
  `TABI` is unchanged and longer names simply set smaller.

Two settings on the band control the motion: **Seconds per turn** (higher is
slower, 28 by default) and **Direction**. The ring holds still on hover, and
does not turn at all for a visitor who has asked for reduced motion — a mark
that turns forever is exactly the kind of motion that setting exists to stop,
and held still it is simply a seal.

**Where it sits.** Absolutely positioned in the bottom-right corner of the copy
half, at every width, so it never adds to the band's height. The copy leaves it
room through one bottom padding, and both the seal's width and that reservation
read the same custom property, so they cannot drift apart.

Getting the spacing right on this band took three goes, and the reason is worth
recording: **the seal was never what made it too tall — the photograph was.**

Laid out normally, an image is sized by its own aspect ratio. A 1200×972 photo
in a 640px column asks for 519px of height and the grid row obliges, whatever
the copy beside it needs. The copy here needs about 300px, so the band came out
200px taller than its content, with the surplus split as blank beige above and
below the paragraph.

So on a seal band from 750px up, the photograph is taken out of the flow
(`position: absolute; inset: 0`) and contributes no height at all. The row is
sized by the copy, and `object-fit: cover` crops the photo to fill it. Two
places that is deliberately not applied:

- **bands without a seal** — their copy can be two short paragraphs, and sized
  by that alone the band would collapse towards its 22rem floor with the
  photograph cropped to a strip. They keep today's behaviour exactly.
- **below 750px**, where the halves are stacked rather than side by side. There
  is no row to share, and taking the image out of the flow left a full-width
  photograph squashed to that same 220px floor.

The copy is also ranged to the top on a seal band rather than centred. Centred,
the leftover height is split above and below the paragraph and neither gap
belongs to anything; ranged top, there is one deliberate space and the seal is
sitting in it.

Measured on this band at 1382px: height 519px → **439px**, blank above the copy
154px → **46px**, and no text line is touched by the seal at any width from
390px to 1600px.

**Choosing it.** The band's *Corner decoration* setting picks between the
uploaded image (the botanical sprig, and the default), the seal, and none. It
is nil on every band saved before the seal existed, which Liquid reads as "not
the seal", so those keep rendering the image exactly as they did.

### The description: read more

The description collapses to two lines with a **Read more** toggle underneath,
so the size chips and the buy buttons stay reachable without scrolling on a
phone. Four settings on the *Description* block control it — whether to collapse
at all, how many lines, and the two labels.

The full description is always in the markup; only the clamp and the toggle are
presentational. The clamp is scoped to `pdp-read-more:defined`, which is true
only once `product-page.js` has registered the element, so with the script
blocked or broken the description simply renders in full rather than stranding a
shopper two lines in with no way to open it. The toggle ships `hidden` and the
script reveals it only after measuring real overflow, so a one-line description
gets no toggle at any width.

### Centred section headings

Section headings across the store are centred — the home page's rich text,
collection feature and app rows all ship `alignment: center` — so the product
page's own sections now match. "Why you'll love it" and the approach section
already were; the rule in `product-page.css` catches the rest by targeting the
heading as a *direct child* of the section shell.

That scoping is deliberate: it deliberately misses the eyebrow and display
heading inside a **feature band**, which sit in the copy half of a two-column
band against a 46ch measure and belong ranged left with the paragraph beneath
them.

The related-products heading is the one that reaches further than this template
— see the note in section 5.

### Mobile

Changes to the buy box below 750px, all in `product-page.css`:

- the product title drops from 2.8rem to **2.2rem**, the size the theme already
  sets for a product title elsewhere. At 2.8rem a two-line name pushed the
  price, the chips and the buttons off the first screen.
- the trust row's icons and labels step down so most labels hold one line, and
  the element after the row gets a 2.8rem top margin — the shortest label used
  to sit about ten pixels above "Select Size" and the two read as one block.
- size chips grow to a **44px** touch target with padding, not a fixed height,
  so a chip still centres its label whether that reads "S" or "3-4 Y".
- the pincode panel gives some padding back to its contents, and its field and
  button stack — **also between 750px and 989px**, where the buy box is half a
  tablet viewport and the field was truncating its own placeholder.

One bug fixed alongside them. Three elements on this page ship the `hidden`
attribute and are revealed by script, and `hidden` is enforced by the UA
stylesheet alone — so any `display` an author rule sets on the same element wins
and the attribute quietly stops meaning anything. The pincode results list is
`display: grid`, so while "hidden" it still contributed its top margin and left
dead space under the CHECK button on every page load before a check.

### Three fixes found by auditing the full rollout

These were found while all 22 templates carried the redesign. They live in the
shared section and snippet code, so they still apply now that only
`product.new-design` uses it — and they are already right for whatever you roll
out to next.

**BUY NOW now follows ADD TO CART's availability.** Both buttons render their
disabled state from Liquid, which is correct on first paint and wrong from the
first variant change onwards: choosing a size re-renders the section server
side, but `product-info.js` copies only named regions back into the page — price,
SKU, inventory — and hands the add-to-cart button's disabled state to
`product-form.js`, which owns that one button and nothing else. Nothing in that
path knew `<pdp-buy-now>` existed, so selecting a sold-out size left BUY NOW live
beside a greyed-out ADD TO CART. It failed safely — `cart/add.js` rejects the
variant and the shared error region says so — but only after offering a click
that should not have been on offer. `<pdp-buy-now>` now watches the add-to-cart
button's `disabled` attribute rather than recomputing availability, because that
button is the one Dawn already keeps correct for sold out, for unavailable
variants and for quantity rules alike. The `[disabled]` styling it needs was
already in `product-page.css`.

**Links without a destination are hidden rather than rendered as `#`.** The
approach CTA and the feature band link each fell back to `href="#"` when their
URL was empty. Both carry a default label and neither carries a default URL, so
every template that had been migrated shipped with exactly that combination: a
button that looked live and jumped to the top of the page. Both now require
label *and* URL.

**A feature band with no image is a single column.** `.pdp-band__inner` applied
`grid-template-columns` from the split setting regardless of whether an image
existed, so a band without one seated its copy in the first track and left the
second as an empty stretch of beige — 45% of the band on desktop, at every width
above 750px. The split now collapses to `1fr` when the image is unset, which is
the state both of `product.new-design`'s bands are in today. The `case` on the
split setting also gained an `else`, so a template saved before that setting
existed no longer emits an empty custom property.

---

## 5. Rolling out to the other 21 templates

Not done, and deliberately so — the redesign is on `product.new-design` alone.
It was rolled out to all 22 once and then reverted, so if you are reading an
older copy of this file that says otherwise, this section is the current truth.

Once the prototype is signed off:

```bash
# one template first, reviewed on a preview theme
python3 migrate_pdp.py templates/product.new-clothing-collection.json

# then the rest, when that one is right
python3 migrate_pdp.py templates/product.*.json
```

Note the glob includes `product.new-design.json`; re-running against it is
harmless because the script is idempotent.

`migrate_pdp.py` sits at the repo root. It is tooling, not theme code — Shopify
CLI only uploads the known theme directories, so it never reaches the store. It:

- keeps every setting you have already changed in the theme editor (it merges,
  it does not overwrite)
- migrates each template's accordion copy into the new info columns — Material
  and Care into *Material & care*, Shipping & Returns split across *Shipping &
  delivery* and *Exchanges & returns* by looking for return/exchange/refund
  wording, and anything it cannot route into *Product details* under its own
  heading for a human to re-file
- moves the Size Guide tab's page onto the variant picker so it becomes the
  modal link (`size-guide`, or `kids-size-guide` for the kids template)
- disables the old accordion blocks rather than deleting them, so any template
  can be reverted from the theme editor
- writes a `.json.bak` beside each file before changing it
- is safe to re-run

Re-running after the tabs are already disabled will not re-migrate their
content — migrate from a clean checkout of the template if you need to redo it.

### One change that reaches every product template

The centred-headings work added a **Heading alignment** setting to the
*Related products* section, and it **defaults to Centre**. Every product
template has that section and none of them carry the setting yet, so the
default applies and the "You may also like" heading is now centred on all 22 —
including the 21 that are otherwise untouched by the redesign.

That is the intended behaviour: section headings are centred everywhere else on
the store, and the heading was already centred on this section's small-label
variant by an inline style. It is called out here because it is the single
exception to "an un-migrated template renders exactly as it did before", and
because reverting it is one field per template in the theme editor
(*Related products → Heading alignment → Left*) rather than a code change.

---

## 6. QA list before publishing

- [ ] A product **with** size variants, and one with **only a default variant**
- [ ] A **sold out** product, and one with some sizes sold out
- [ ] BUY NOW against **Razorpay Magic Checkout** — see the risk below
- [ ] Pincode box: valid pincode, invalid pincode, blocked prefix, COD-excluded
      prefix
- [ ] Information accordions at 749px, 750px and 990px — stacked, two columns,
      then four — with the box border and the dividers correct at each, and one
      column folded shut, then reopened
- [ ] Description **Read more**: a long description collapses to two lines and
      expands; a one-or-two line description shows **no** toggle at all; the
      toggle reads "Read less" while open
- [ ] Description with JavaScript disabled: the full text, no clamp, no toggle
- [ ] Section headings centred — the info columns label, "Why you'll love it",
      the approach section, and "You may also like" — while the two feature
      bands stay ranged left
- [ ] The turning seal: it turns, `TABI` stays upright in the middle, and it
      stops while the pointer is over it and starts again when it leaves
- [ ] The seal at 750px, 990px, 1100px and 1400px — in the bottom-right corner
      of the copy half, never touching the text, and never leaving a band of
      empty beige above the copy
- [ ] The seal band's photograph: cropped to the copy's height on desktop, full
      height on a phone (it must not be squashed to a strip when stacked)
- [ ] The "Made in small batches" band unchanged — its photograph still sets
      that band's height
- [ ] The seal with reduced motion turned on (macOS: System Settings →
      Accessibility → Display → Reduce motion) — it should render still, not
      disappear
- [ ] The "Made in small batches" band still shows its uploaded sprig, not a
      seal
- [ ] Buy box on a 390px phone: title on one or two lines, clear space between
      the trust row and "Select Size", size chips comfortable to tap, and the
      pincode field and button stacked
- [ ] Pincode panel before any check: no dead space under the CHECK button
- [ ] Information accordions with JavaScript disabled: every column should still
      be open and readable, only the folding gone
- [ ] Related products: same card, ratio and quick-add behaviour as a collection
      page, and a row with fewer products than columns
- [ ] Sticky gallery on desktop: scroll a long product and a short one, and
      check a product with a single image
- [ ] Size Guide modal opens, closes, and traps focus
- [ ] A product with **no** metafields filled in — the highlights section, the
      fit block and the metafield-driven accordions should vanish cleanly, not
      leave gaps
- [ ] The 21 **un-migrated** templates still look as before and still do not
      request `product-page.css` or `product-page.js` at all. One deliberate
      exception now: their "You may also like" heading is centred — see the
      note at the end of section 5

---

## 7. Known risks

**BUY NOW vs Razorpay Magic Checkout — settled for now by turning BUY NOW off.**

Razorpay Magic Checkout is rendered site-wide from `layout/theme.liquid`, and it
injects a checkout button of its own onto the product page. Alongside the
theme's own second button that gave the shopper *two* ways to skip the cart,
sitting next to each other and behaving differently.

So `product.new-design` now sets the buy buttons block's *Second button* to
**None**. The theme renders ADD TO BAG and nothing else, and Razorpay's button
is the only checkout control on the page. The custom button's label is left in
the setting, so switching *Second button* back to **Custom Buy now button**
restores it exactly as it was — one field, no code change.

That also retires the untested question this section used to raise: the custom
button added to cart and then redirected to `/cart/checkout`, and whether
Razorpay intercepted that redirect was never established. It no longer renders,
so it no longer matters.

**The other 21 templates still show two.** They never set `buy_now_style`, so
the snippet falls back to `dynamic` and they render Shopify's own
`payment_button` — which is a second checkout control beside Razorpay's in
exactly the same way. That is the live state and predates this redesign, so it
has been left alone rather than changed unasked. Fixing it is the same one
setting per template, or a `migrate_pdp.py` pass.

**Buy now carries the whole cart.** Like Shopify's own dynamic checkout, it does
not clear existing cart items first.

**Delivery estimates are approximations.** They come from the theme settings,
not a courier API, and skip weekends but not public holidays. When you get a
real serviceability API, only `assets/product-page.js` needs to change — the
markup and settings stay.

**The sticky add-to-cart bar is still on.** `sections/sticky-atc.liquid` is
rendered globally from `layout/theme.liquid` and is enabled in
`config/settings_data.json` (`enable_section: true`), so it slides up on every
product page once you scroll past 300px. It is not in the new mockups. Left
alone because turning it off is a merchandising decision, not a code one — flip
it in the theme editor if you don't want it. Check how it looks against the new
buy box either way.

**Three carousel libraries still load globally** — jQuery, Slick and Swiper, in
`layout/theme.liquid`. The new carousel deliberately uses none of them. Worth a
separate cleanup pass.

**The metafield-driven accordions stay hidden** until the product-detail
metafields are filled. That is by design — an accordion pointed at an empty
metafield hides itself rather than opening onto nothing — but it means a fresh
product shows the typed accordions and none of the per-product ones. Every row
in *Product details* is metafield-driven, so on a product with no metafields
that whole column is absent and the section renders three columns at full
width rather than three and a gap.

