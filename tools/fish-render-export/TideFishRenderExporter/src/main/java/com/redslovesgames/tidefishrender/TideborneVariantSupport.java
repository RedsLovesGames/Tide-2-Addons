package com.redslovesgames.tidefishrender;

import net.fabricmc.loader.api.FabricLoader;
import net.minecraft.component.ComponentType;
import net.minecraft.item.ItemStack;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Locale;

final class TideborneVariantSupport {
    static final List<String> REQUESTABLE_VARIANTS = List.of("default", "iridescent", "scarred", "parasite_ridden", "albino", "giant", "dwarf", "perfect_specimen");
    private static final long DETERMINISTIC_SEED = 0x5449444546495348L;

    private TideborneVariantSupport() {}

    static boolean isLoaded() { return FabricLoader.getInstance().isModLoaded("tideborne"); }

    static VariantSpec apply(ItemStack stack, String requested, RegistryLoader.Entry entry) {
        String variant = normalize(requested);
        double baseLength = Math.max(0.01, entry.representativeLengthCm());
        double length = switch (variant) {
            case "giant" -> entry.recordHighCm() > 0 ? entry.recordHighCm() * 1.30 : baseLength * 1.30;
            case "dwarf" -> entry.typicalLowCm() > 0 ? entry.typicalLowCm() * 0.55 : baseLength * 0.55;
            case "parasite_ridden" -> baseLength * 0.90;
            default -> baseLength;
        };
        if (variant.equals("default")) return new VariantSpec(variant, length, false);
        if (!isLoaded()) throw new IllegalStateException("Variant '" + variant + "' requires Tideborne to be loaded");
        if (!REQUESTABLE_VARIANTS.contains(variant)) throw new IllegalArgumentException("Unknown Tideborne variant: " + variant);
        try {
            Class<?> components = Class.forName("com.redslovesgames.tidetraits.component.TideTraitsComponents");
            set(stack, components.getField("MUTATION"), isBodyType(variant) ? "normal" : variant);
            set(stack, components.getField("BODY_TYPE"), isBodyType(variant) ? variant : "normal");
            set(stack, components.getField("MUTATION_SEED"), DETERMINISTIC_SEED);
            set(stack, components.getField("SIZE_PERCENTILE"), variant.equals("giant") ? 100.0 : variant.equals("dwarf") ? 0.0 : 50.0);
            return new VariantSpec(variant, length, true);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Tideborne specimen components could not be applied", e);
        }
    }

    private static boolean isBodyType(String variant) { return variant.equals("giant") || variant.equals("dwarf"); }
    private static String normalize(String requested) {
        if (requested == null || requested.isBlank()) return "default";
        return requested.toLowerCase(Locale.ROOT).replace('-', '_');
    }

    @SuppressWarnings("unchecked")
    private static <T> void set(ItemStack stack, Field field, T value) throws IllegalAccessException {
        Object raw = field.get(null);
        if (!(raw instanceof ComponentType<?> component)) throw new IllegalStateException(field.getName() + " is not a ComponentType");
        stack.set((ComponentType<T>) component, value);
    }

    record VariantSpec(String name, double lengthCm, boolean specimenComponentsApplied) {}
}
