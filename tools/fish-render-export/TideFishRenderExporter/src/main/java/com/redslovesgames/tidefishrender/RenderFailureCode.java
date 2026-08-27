package com.redslovesgames.tidefishrender;

enum RenderFailureCode {
    UNSUPPORTED_VARIANT("unsupported_variant"),
    VARIANT_SETUP("variant_setup"),
    MISSING_ITEM("missing_item"),
    FISH_DATA_CONTRACT("fish_data_contract"),
    MISSING_DISPLAY_BLOCK("missing_display_block"),
    FISH_DISPLAY_REJECTED("fish_display_rejected"),
    EMPTY_FRAMEBUFFER("empty_framebuffer"),
    ENTITY_CONTRACT("entity_contract"),
    FISH_DISPLAY_RENDER_FAILURE("fish_display_render_failure"),
    DIRECT_ENTITY_RENDER_FAILURE("direct_entity_render_failure"),
    UNEXPECTED_EXCEPTION("unexpected_exception");

    private final String wireName;

    RenderFailureCode(String wireName) {
        this.wireName = wireName;
    }

    String wireName() {
        return wireName;
    }
}
