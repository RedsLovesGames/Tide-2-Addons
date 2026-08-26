package com.redslovesgames.tidefishrender;

import net.fabricmc.loader.api.FabricLoader;
import net.minecraft.item.ItemStack;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
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
            Class<?> components=Class.forName("com.redslovesgames.tidetraits.component.TideTraitsComponents");
            Method set=ItemStack.class.getMethod("set",Class.forName("net.minecraft.component.ComponentType"),Object.class);
            Field mutation=components.getField("MUTATION"),body=components.getField("BODY_TYPE");
            if(variant.equals("giant")||variant.equals("dwarf")){set.invoke(stack,body.get(null),variant);set.invoke(stack,mutation.get(null),"normal");}
            else{set.invoke(stack,mutation.get(null),variant);set.invoke(stack,body.get(null),"normal");}
            set.invoke(stack,components.getField("MUTATION_SEED").get(null),0x5449444546495348L);
            double percentile=variant.equals("giant")?100.0:variant.equals("dwarf")?0.0:50.0;
            set.invoke(stack,components.getField("SIZE_PERCENTILE").get(null),percentile);
        }catch(ReflectiveOperationException e){throw new IllegalStateException("Unable to apply Tideborne variant "+variant,e);}
    }
}
