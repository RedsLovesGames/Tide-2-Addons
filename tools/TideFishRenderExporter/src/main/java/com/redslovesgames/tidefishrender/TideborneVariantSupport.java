package com.redslovesgames.tidefishrender;

import net.fabricmc.loader.api.FabricLoader;
import net.minecraft.component.ComponentType;
import net.minecraft.item.ItemStack;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Locale;

final class TideborneVariantSupport {
    static final List<String> VISUAL_VARIANTS=List.of("default","iridescent","scarred","parasite_ridden","albino","giant","dwarf","perfect_specimen");
    private TideborneVariantSupport(){}
    static boolean isLoaded(){return FabricLoader.getInstance().isModLoaded("tideborne");}
    static void apply(ItemStack stack,String requested){
        if(requested==null||requested.equals("default")||!isLoaded())return;
        String variant=requested.toLowerCase(Locale.ROOT);
        try{
            Class<?> c=Class.forName("com.redslovesgames.tidetraits.component.TideTraitsComponents");
            if(variant.equals("giant")||variant.equals("dwarf")){set(stack,c.getField("BODY_TYPE"),variant);set(stack,c.getField("MUTATION"),"normal");}
            else{set(stack,c.getField("MUTATION"),variant);set(stack,c.getField("BODY_TYPE"),"normal");}
            set(stack,c.getField("MUTATION_SEED"),0x5449444546495348L);
            set(stack,c.getField("SIZE_PERCENTILE"),variant.equals("giant")?100.0:variant.equals("dwarf")?0.0:50.0);
        }catch(ReflectiveOperationException e){throw new IllegalStateException("Unable to apply Tideborne variant "+variant,e);}
    }
    @SuppressWarnings("unchecked") private static <T> void set(ItemStack stack,Field field,T value)throws IllegalAccessException{stack.set((ComponentType<T>)field.get(null),value);}
}
