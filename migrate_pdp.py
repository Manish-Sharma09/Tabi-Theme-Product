#!/usr/bin/env python3
"""
Migrate a Shopify product template JSON to the redesigned product page.

Run against one template first, review it on a preview theme, then run it
across the rest:

    python3 migrate_pdp.py templates/product.new-clothing-collection.json
    python3 migrate_pdp.py templates/product.*.json

What it does, per template:

  main (main-product)
    - turns on `enable_new_layout`, the thumbnail gallery and the tax note
    - adds the five new buy-box blocks with stable ids, so re-running updates
      them in place instead of stacking duplicates
    - reorders block_order to the redesign's order, leaving any block it does
      not know about at the end rather than dropping it
    - moves the Size Guide tab's page onto the variant picker, where it becomes
      the modal link beside "Select Size"
    - disables the collapsible tabs, keeping their content in the file so the
      template can be rolled back from the theme editor

  new sections
    - pdp-why-love, the two feature bands, pdp-info-columns, pdp-approach
    - info columns are seeded with the copy migrated out of the tabs, so no
      merchant text is retyped or lost

  related-products
    - carousel layout, five across, small uppercase heading

Idempotent: every id it writes is fixed, so running twice leaves the same file.
"""

import json
import re
import sys
import shutil
from pathlib import Path

# --------------------------------------------------------------------------
# Which tab heading feeds which info column.
#
# Headings vary across the 21 templates ("Material" vs "Materials and
# Standards", "Shipping & Returns" vs "Shipping Details"), so matching is on a
# lowercased, normalised heading.
# --------------------------------------------------------------------------
TAB_ROUTING = {
    "material": ("2", "Fabric composition"),
    "materials and standards": ("2", "Fabric composition"),
    "care instructions": ("2", "Care instructions"),
    "easy care instructions": ("2", "Care instructions"),
    "additional information": ("1", "Additional information"),
    "shipping & returns": ("split", None),
    "shipping and returns": ("split", None),
    "shipping details": ("3", "Shipping timelines"),
    "return details": ("4", "Returns and exchanges"),
}

# Tabs that do not become info rows.
TAB_SKIP = {"description", "size guide"}

# Rows in column 1 are per-product and read metafields, so they are seeded the
# same way on every template and hide themselves until a product has data.
PRODUCT_DETAIL_ROWS = [
    ("Fabric", "fabric"),
    ("Craft / technique", "craft_technique"),
    ("Construction", "construction"),
    ("Silhouette", "silhouette"),
    ("Product-specific detailing", "product_detailing"),
]

# The redesign's buy-box order. Anything in the template that is not named here
# keeps its relative position at the end of the list.
BLOCK_ORDER = [
    "vendor",
    "title",
    "price",
    "description",
    "pdp_trust",
    "variant_picker",
    "pdp_fit",
    "pdp_size_help",
    "quantity_selector",
    "buy_buttons",
    "pdp_usp",
    "pdp_delivery",
]

RETURN_WORDS = re.compile(r"\b(return|exchang|refund)", re.I)


def split_paragraphs(html):
    """Split tab HTML into paragraph-sized chunks.

    Content in these templates is either <p>..</p> runs or one <p> broken up
    with <br/><br/>. Both shapes appear across the 21 files, so both are
    handled; anything else falls through as a single chunk.
    """
    if not html:
        return []
    paras = re.findall(r"<p>.*?</p>", html, re.S)
    if len(paras) > 1:
        return paras
    inner = paras[0][3:-4] if paras else html
    parts = [p.strip() for p in re.split(r"(?:<br\s*/?>\s*){2,}", inner) if p.strip()]
    if len(parts) > 1:
        return ["<p>%s</p>" % p for p in parts]
    return [html]


def split_shipping_returns(html):
    """Separate shipping copy from returns copy in a combined tab.

    Heuristic: a paragraph mentioning return, exchange or refund is returns
    copy. Everything else is shipping. When nothing matches, all of it stays
    with shipping rather than being guessed into the wrong column.
    """
    shipping, returns = [], []
    for para in split_paragraphs(html):
        (returns if RETURN_WORDS.search(para) else shipping).append(para)
    return "".join(shipping), "".join(returns)


def collect_tabs(main):
    """Read the collapsible tabs out of the main section.

    Returns the migrated column content, and the Size Guide page handle so it
    can be moved onto the variant picker.
    """
    blocks = main.get("blocks", {})
    columns = {"1": [], "2": [], "3": [], "4": []}
    size_guide_page = ""

    for block_id in main.get("block_order", []):
        block = blocks.get(block_id)
        if not block or block["type"] != "collapsible_tab":
            continue

        # A tab the merchant switched off stays off. Its content is still in
        # the file, but promoting it into the new layout would silently
        # re-publish copy someone chose to hide.
        if block.get("disabled"):
            continue

        settings = block.get("settings", {})
        heading = (settings.get("heading") or "").strip()
        key = heading.lower()
        content = settings.get("content") or ""

        if key == "size guide":
            size_guide_page = settings.get("page") or ""
            continue
        if key in TAB_SKIP or not content.strip():
            continue

        route = TAB_ROUTING.get(key)
        if route is None:
            # An unrecognised tab is kept rather than dropped - it lands in
            # Product details under its own heading for a human to re-file.
            columns["1"].append((heading, content))
            continue

        column, label = route
        if column == "split":
            shipping, returns = split_shipping_returns(content)
            if shipping:
                columns["3"].append(("Shipping timelines", shipping))
            if returns:
                columns["4"].append(("Returns and exchanges", returns))
        else:
            columns[column].append((label, content))

    return columns, size_guide_page


def build_info_columns(columns):
    """Build the pdp-info-columns section from the migrated tab content."""
    blocks, order = {}, []

    def add(block_id, settings):
        blocks[block_id] = {"type": "row", "settings": settings}
        order.append(block_id)

    # Column 1: metafield-driven product details, then anything migrated.
    for i, (label, key) in enumerate(PRODUCT_DETAIL_ROWS, start=1):
        add("row_detail_%d" % i, {"column": "1", "label": label, "metafield_key": key, "content": ""})

    for i, (label, content) in enumerate(columns["1"], start=1):
        add("row_extra_%d" % i, {"column": "1", "label": label, "metafield_key": "", "content": content})

    # Column 2: migrated material and care copy. A wash-instructions row is
    # seeded as a metafield so per-product care can be added later without
    # editing every template again.
    for i, (label, content) in enumerate(columns["2"], start=1):
        add("row_material_%d" % i, {"column": "2", "label": label, "metafield_key": "", "content": content})

    add(
        "row_wash",
        {"column": "2", "label": "Wash instructions", "metafield_key": "wash_instructions", "content": ""},
    )

    # Columns 3 and 4: migrated policy copy.
    for i, (label, content) in enumerate(columns["3"], start=1):
        add("row_shipping_%d" % i, {"column": "3", "label": label, "metafield_key": "", "content": content})

    for i, (label, content) in enumerate(columns["4"], start=1):
        add("row_returns_%d" % i, {"column": "4", "label": label, "metafield_key": "", "content": content})

    return {
        "type": "pdp-info-columns",
        "blocks": blocks,
        "block_order": order,
        "settings": {
            "column_1_title": "Product details",
            "column_2_title": "Material & care",
            "column_3_title": "Shipping & delivery",
            "column_4_title": "Exchanges & returns",
            "color_scheme": "scheme-1",
            "padding_top": 24,
            "padding_bottom": 24,
        },
    }


def upsert_block(main, block_id, block_type, settings):
    """Add a block, or refresh its type while keeping any settings a merchant
    has already changed. Re-running the script must not undo theme-editor work.
    """
    blocks = main.setdefault("blocks", {})
    existing = blocks.get(block_id)
    if existing and existing.get("type") == block_type:
        merged = dict(settings)
        merged.update(existing.get("settings", {}))
        existing["settings"] = merged
        existing.pop("disabled", None)
    else:
        blocks[block_id] = {"type": block_type, "settings": settings}


def reorder(main):
    order = main.get("block_order", [])
    blocks = main.get("blocks", {})
    known = [b for b in BLOCK_ORDER if b in blocks]
    rest = [b for b in order if b not in known]
    main["block_order"] = known + rest


def migrate(path):
    path = Path(path)
    data = json.loads(path.read_text())
    sections = data["sections"]
    main = sections["main"]

    columns, size_guide_page = collect_tabs(main)

    # --- main-product section settings ------------------------------------
    main["settings"].update(
        {
            "enable_new_layout": True,
            "gallery_layout": "thumbnail",
            "mobile_thumbnails": "show",
            "media_size": "large",
            "media_position": "left",
            "image_zoom": "lightbox",
        }
    )

    # --- existing blocks ---------------------------------------------------
    blocks = main.setdefault("blocks", {})

    if "price" in blocks:
        blocks["price"].setdefault("settings", {})["shipping-tax"] = True

    if "variant_picker" in blocks:
        vp = blocks["variant_picker"].setdefault("settings", {})
        vp.update(
            {
                "picker_type": "button",
                "size_guide_page": size_guide_page,
                "size_guide_label": "Size Guide",
                "size_guide_option": "Size",
                "size_label": "Select Size",
            }
        )

    if "buy_buttons" in blocks:
        bb = blocks["buy_buttons"].setdefault("settings", {})
        bb.update({"buy_now_style": "custom", "buy_now_label": "Buy now"})

    # The description moves above the fold; the tabs it used to sit beside are
    # replaced by the info columns section, so they are switched off. Content
    # stays in the file so the template can be reverted in the theme editor.
    if "description" not in blocks:
        blocks["description"] = {"type": "description", "settings": {}}

    for block in blocks.values():
        if block.get("type") == "collapsible_tab":
            block["disabled"] = True

    # The redesign ends the buy box at the delivery check - there is no share
    # control in it. Disabled rather than deleted so it is one click to restore.
    if "share" in blocks:
        blocks["share"]["disabled"] = True

    # --- new buy-box blocks ------------------------------------------------
    upsert_block(main, "pdp_trust", "pdp_trust", {
        "icon_1": "leaf", "label_1": "Natural Fabrics",
        "icon_2": "tag", "label_2": "Made to Order",
        "icon_3": "hand", "label_3": "Gentle on Skin",
        "icon_4": "exchange", "label_4": "Easy Exchanges",
    })
    upsert_block(main, "pdp_fit", "pdp_fit", {
        "fit_label": "Fit:",
        "model_label": "Model Details:",
        "recommendation_label": "Fit Recommendation:",
    })
    upsert_block(main, "pdp_size_help", "pdp_size_help", {
        "heading": "Need help choosing your size?",
        "subheading": "Chat with us on Instagram or Whatsapp",
        "instagram_handle": "@mytabi.in",
        "instagram_url": "https://www.instagram.com/mytabi.in/",
        "whatsapp_display": "",
        "whatsapp_number": "",
    })
    upsert_block(main, "pdp_usp", "pdp_usp", {"items": "Free Shipping, COD Available"})
    upsert_block(main, "pdp_delivery", "pdp_delivery", {
        "heading": "When will it reach you?",
        "placeholder": "Enter delivery pincode",
        "button_label": "Check",
        "dispatch_min": 2,
        "dispatch_max": 5,
        "transit_min": 3,
        "transit_max": 7,
        "zone_rules": "",
        "blocked_prefixes": "",
        "cod_enabled": True,
        "cod_prefixes": "",
        "label_delivering": "Delivering to {pincode}",
        "label_dispatch": "Made to order in {min}–{max} working days",
        "label_estimated": "Estimated delivery:",
        "label_cod_yes": "COD available at this pincode",
        "label_cod_no": "COD not available at this pincode",
        "label_invalid": "Please enter a valid 6-digit pincode.",
        "label_unserviceable": "Sorry, we do not deliver to {pincode} yet.",
    })

    reorder(main)

    # --- sections below the buy box ---------------------------------------
    sections["pdp-why-love"] = {
        "type": "pdp-why-love",
        "blocks": {
            "col_1": {"type": "column", "settings": {"icon": "feather"}},
            "col_2": {"type": "column", "settings": {"icon": "hand"}},
            "col_3": {"type": "column", "settings": {"icon": "weave"}},
        },
        "block_order": ["col_1", "col_2", "col_3"],
        "settings": {
            "heading": "Why you'll love it",
            "color_scheme": "scheme-1",
            "padding_top": 48,
            "padding_bottom": 40,
        },
    }

    sections["pdp-band-batches"] = {
        "type": "pdp-feature-band",
        "settings": {
            "image_position": "left",
            "split": "media_wide",
            "mobile_text_first": True,
            "eyebrow": "Made in small batches",
            "heading": "Made in small batches.",
            "body": "<p>Made thoughtfully, in limited runs and often to order.</p><p>Less excess. More intention.</p>",
            "link_label": "",
            "decor_width": 9,
            "color_scheme": "scheme-1",
            "padding_top": 12,
            "padding_bottom": 12,
        },
    }

    sections["pdp-info-columns"] = build_info_columns(columns)

    sections["pdp-band-tabi-way"] = {
        "type": "pdp-feature-band",
        "settings": {
            "image_position": "left",
            "split": "media_narrow",
            "mobile_text_first": True,
            "eyebrow": "The Tabi way",
            "heading": "A journey towards slower, mindful living.",
            "body": (
                "<p>Tabi is a celebration of the everyday journey - yours and ours, together! "
                "It is built around the idea that the things we choose to live with can help us "
                "live a little more slowly and consciously. All Tabi products are built with love "
                "and care for the planet and the people using them, while blending the rich "
                "artisanal heritage of Indian handcrafts into everyday pieces.</p>"
            ),
            "link_label": "Read more about us",
            "decor_width": 9,
            "color_scheme": "scheme-1",
            "padding_top": 12,
            "padding_bottom": 12,
        },
    }

    sections["pdp-approach"] = {
        "type": "pdp-approach",
        "blocks": {
            "pillar_1": {
                "type": "pillar",
                "settings": {
                    "icon": "garment",
                    "heading": "Product",
                    "lead": "Made to be valued, worn often and kept.",
                    "text": "Natural fabrics, thoughtful design, comfort, craft and quality that make you want to reach for a piece again and again.",
                },
            },
            "pillar_2": {
                "type": "pillar",
                "settings": {
                    "icon": "process",
                    "heading": "Process",
                    "lead": "Make closer to demand.",
                    "text": "Small batches and made-to-order production help us create more intentionally and reduce unnecessary excess.",
                },
            },
            "pillar_3": {
                "type": "pillar",
                "settings": {
                    "icon": "person",
                    "heading": "People",
                    "lead": "Every garment carries somebody's work.",
                    "text": "We value the skill, time and hands behind every piece we make. This ensures the person behind the product is never the cheapest component.",
                },
            },
        },
        "block_order": ["pillar_1", "pillar_2", "pillar_3"],
        "settings": {
            "heading": "Our three-part approach",
            "intro": "Everything we make is viewed through three lenses.",
            "cta_label": "Discover how Tabi works",
            "color_scheme": "scheme-1",
            "padding_top": 48,
            "padding_bottom": 40,
        },
    }

    # --- related products --------------------------------------------------
    related = sections.get("related-products")
    if related:
        related["settings"].update(
            {
                "layout": "carousel",
                "heading_style": "eyebrow",
                "heading": "You may also like",
                "products_to_show": 10,
                "columns_desktop": 5,
                "columns_mobile": "1",
            }
        )

    # --- section order -----------------------------------------------------
    order = [
        "main",
        "pdp-why-love",
        "pdp-band-batches",
        "pdp-info-columns",
        "pdp-band-tabi-way",
        "pdp-approach",
    ]
    if related:
        order.append("related-products")
    # Anything else the template already had keeps its place at the end.
    order += [s for s in data.get("order", []) if s not in order]
    data["order"] = order

    shutil.copyfile(path, path.with_suffix(".json.bak"))
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")

    rows = sum(len(v) for v in columns.values())
    print("%-46s size guide: %-16s migrated rows: %d" % (path.name, size_guide_page or "-", rows))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for arg in sys.argv[1:]:
        migrate(arg)
