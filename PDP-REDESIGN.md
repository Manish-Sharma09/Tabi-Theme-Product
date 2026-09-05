# Product page redesign

What changed, what you need to set up in Shopify admin, and how to roll it out
to the remaining templates.

Branch: `pdp-redesign`. Prototype template: `templates/product.new-design.json`.

---

## 1. Before anything goes live

Work on a **duplicate theme**, not the live one:

1. Shopify admin → Online Store → Themes → ⋯ → **Duplicate**
2. `shopify theme dev --theme <duplicate-id>` to preview locally, or
   `shopify theme push --theme <duplicate-id>` to upload
3. Publish only after the QA list in section 6 passes

Nothing in this branch changes a template you have not migrated. The redesign is
gated behind a section setting (`enable_new_layout`), so an un-migrated template
renders exactly as it does today even with all the new code present.

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

### "Why you'll love it" — three highlights

| Key | Type | Example |
|---|---|---|
| `usp_1_heading` | Single line text | `Light & Breathable` |
| `usp_1_text` | Multi-line text | `Soft cotton cambric keeps the piece comfortable through long days.` |
| `usp_2_heading` | Single line text | `Made with Character` |
| `usp_2_text` | Multi-line text | `Traditional handblock printing gives every piece subtle variations of its own.` |
| `usp_3_heading` | Single line text | `Shape Without Stiffness` |
| `usp_3_text` | Multi-line text | `Smocking adds definition while allowing the garment to move naturally with you.` |

The icons are **not** metafields — pick them per template on the section's
column blocks in the theme editor.

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
| `sections/pdp-why-love.liquid` | Three product highlights. |
| `sections/pdp-feature-band.liquid` | Image + text band, used twice. |
| `sections/pdp-info-columns.liquid` | Product information accordions. |
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
  option label override. Without `size_guide_page` set, renders as before.
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

---

## 5. Rolling out to the other 20 templates

Once the prototype is signed off:

```bash
python3 migrate_pdp.py templates/product.*.json
```

`migrate_pdp.py` sits at the repo root. It is tooling, not theme code — Shopify
CLI only uploads the known theme directories, so it never reaches the store. It:

- keeps every setting you have already changed in the theme editor (it merges,
  it does not overwrite)
- migrates each template's accordion copy into the new info columns — Material
  and Care into column 2, Shipping & Returns split across columns 3 and 4 by
  looking for return/exchange/refund wording
- moves the Size Guide tab's page onto the variant picker so it becomes the
  modal link (`size-guide`, or `kids-size-guide` for the kids template)
- disables the old accordion blocks rather than deleting them, so any template
  can be reverted from the theme editor
- writes a `.json.bak` beside each file before changing it
- is safe to re-run

Re-running after the tabs are already disabled will not re-migrate their
content — migrate from a clean checkout of the template if you need to redo it.

---

## 6. QA list before publishing

- [ ] A product **with** size variants, and one with **only a default variant**
- [ ] A **sold out** product, and one with some sizes sold out
- [ ] BUY NOW against **Razorpay Magic Checkout** — see the risk below
- [ ] Pincode box: valid pincode, invalid pincode, blocked prefix, COD-excluded
      prefix
- [ ] Information accordions at 749px and 750px — two columns above, one below
- [ ] Related products: same card, ratio and quick-add behaviour as a collection
      page, and a row with fewer products than columns
- [ ] Sticky gallery on desktop: scroll a long product and a short one, and
      check a product with a single image
- [ ] Size Guide modal opens, closes, and traps focus
- [ ] A product with **no** metafields filled in — the highlights section, the
      fit block and the metafield-driven accordions should vanish cleanly, not
      leave gaps
- [ ] The 20 **un-migrated** templates still look exactly as before

---

## 7. Known risks

**BUY NOW vs Razorpay Magic Checkout.** The custom button adds to cart, then
redirects to `/cart/checkout`. Razorpay Magic Checkout intercepts checkout, and
whether it intercepts this redirect has not been tested. Test it on the preview
theme before publishing. If it misbehaves, set the buy buttons block's *Second
button* back to **Shopify dynamic checkout** — one setting, no code change.

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
product shows the four typed accordions and none of the per-product ones.

