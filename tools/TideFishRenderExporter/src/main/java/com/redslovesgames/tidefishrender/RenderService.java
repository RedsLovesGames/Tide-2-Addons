package com.redslovesgames.tidefishrender;

import com.google.gson.*;
import net.minecraft.block.BlockState;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gl.SimpleFramebuffer;
import net.minecraft.client.render.LightmapTextureManager;
import net.minecraft.client.render.OverlayTexture;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.texture.NativeImage;
import net.minecraft.client.util.BufferAllocator;
import net.minecraft.client.util.ScreenshotRecorder;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.BlockPos;
import org.lwjgl.opengl.GL11;

import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;

/** Uses Tide's real FishDisplayBlockEntity and FishDisplayRenderer at runtime. */
final class RenderService {
    private static final int SIZE=1024,PADDING=48;
    private static final String DISPLAY_BE="com.li64.tide.registries.blocks.entities.FishDisplayBlockEntity";
    private static final String DISPLAY_RENDERER="com.li64.tide.client.FishDisplayRenderer";
    private final MinecraftClient client; private final List<RegistryLoader.Entry> entries; private final Path root,renders,generated; private final TideRuntime tide;

    private RenderService(MinecraftClient c,List<RegistryLoader.Entry> e,TideRuntime t){client=c;entries=e;tide=t;root=c.runDirectory.toPath().resolve("fishrender-output");renders=root.resolve("fish/assets/renders");generated=root.resolve("generated");}
    static RenderService create() throws Exception{MinecraftClient c=MinecraftClient.getInstance();if(c.world==null)throw new IOException("Open a world first. Tide's FishDisplayRenderer needs a live ClientWorld.");return new RenderService(c,RegistryLoader.load(),TideRuntime.load(c));}
    RenderReport verifyAll() throws IOException{return process(entries,"verify",false);}
    RenderReport exportAll(String variant)throws IOException{return process(expand(entries,variant),variant,true);}
    RenderReport exportNamespace(String ns,String variant)throws IOException{return process(expand(entries.stream().filter(e->namespace(e.fishId()).equals(ns)).toList(),variant),variant,true);}
    RenderReport exportFish(String id,String variant)throws IOException{String canonical=id.contains(":")?id:id.replace("__",":");RegistryLoader.Entry e=entries.stream().filter(x->x.fishId().equals(canonical)).findFirst().orElseThrow(()->new IOException("Fish not in registry: "+canonical));return process(expand(List.of(e),variant),variant,true);}

    private List<Job> expand(List<RegistryLoader.Entry> base,String variant){if("all_variants".equals(variant)){List<Job> out=new ArrayList<>();for(var e:base){out.add(new Job(e,"default"));if(TideborneVariantSupport.isLoaded())for(String v:TideborneVariantSupport.VISUAL_VARIANTS)if(!v.equals("default"))out.add(new Job(e,v));}return out;}return base.stream().map(e->new Job(e,variant)).toList();}
    private RenderReport process(List<?> items,String mode,boolean writePng)throws IOException{
        List<Job> jobs=new ArrayList<>();for(Object o:items)jobs.add(o instanceof Job j?j:new Job((RegistryLoader.Entry)o,"default"));
        JsonArray failures=new JsonArray(),successes=new JsonArray();int ok=0,variants=0;
        for(Job job:jobs){JsonObject row=new JsonObject();row.addProperty("fish_id",job.entry.fishId());row.addProperty("source_mod",job.entry.sourceMod());row.addProperty("entity_id",job.entry.entityId());row.addProperty("variant",job.variant);try{Path png=renderOne(job,writePng);if(png!=null)row.addProperty("png",root.relativize(png).toString().replace('\\','/'));successes.add(row);ok++;if(!job.variant.equals("default"))variants++;}catch(Exception ex){row.addProperty("error",ex.getClass().getName()+": "+String.valueOf(ex.getMessage()));failures.add(row);}}
        Files.createDirectories(generated);JsonObject report=new JsonObject();report.addProperty("generated_at",Instant.now().toString());report.addProperty("mode",mode);report.addProperty("total_fish",new HashSet<>(jobs.stream().map(j->j.entry.fishId()).toList()).size());report.addProperty("jobs",jobs.size());report.addProperty("successful",ok);report.addProperty("failed",jobs.size()-ok);report.addProperty("variant_renders",variants);report.add("successes",successes);report.add("exceptions",failures);Path rp=generated.resolve("render-report.json");Files.writeString(rp,new GsonBuilder().setPrettyPrinting().create().toJson(report),StandardCharsets.UTF_8);JsonObject missing=new JsonObject();missing.addProperty("generated_at",Instant.now().toString());missing.addProperty("failed",failures.size());missing.add("missing",failures);Files.writeString(generated.resolve("missing-renders.json"),new GsonBuilder().setPrettyPrinting().create().toJson(missing),StandardCharsets.UTF_8);return new RenderReport(report.get("total_fish").getAsInt(),ok,jobs.size()-ok,variants,rp);
    }

    private Path renderOne(Job job,boolean writePng)throws Exception{
        Identifier itemId=Identifier.of(job.entry.itemId());Item item=Registries.ITEM.get(itemId);if(item==null||item==Registries.ITEM.get(Identifier.of("minecraft:air")))throw new IllegalStateException("Missing ItemStack item: "+itemId);
        ItemStack stack=new ItemStack(item);TideborneVariantSupport.apply(stack,job.variant);BlockState state=Registries.BLOCK.get(Identifier.of("tide:fish_display")).getDefaultState();Object display=tide.newDisplay(BlockPos.ORIGIN,state);if(!tide.setDisplayStack(display,stack))throw new IllegalStateException("Fish Display rejected stack: "+itemId);Object data=tide.getDisplayData(display);if(data==null)throw new IllegalStateException("No DisplayData for "+job.entry.fishId());if(tide.entityType(data)==null)throw new IllegalStateException("Missing entity type for "+job.entry.fishId());
        NativeImage image=null;ImageOps.Bounds bounds=null;float scale=1.35f;try{for(int pass=0;pass<6;pass++){if(image!=null)image.close();image=renderFramebuffer(display,scale);bounds=ImageOps.alphaBounds(image);if(bounds==null)throw new IllegalStateException("Framebuffer contained zero alpha pixels");if(!bounds.touches(image.getWidth(),image.getHeight(),18))break;scale*=0.72f;}Path out=renderPath(job);if(writePng){try(NativeImage cropped=ImageOps.cropWithPadding(image,bounds,PADDING)){ImageOps.write(cropped,out);}}return writePng?out:null;}finally{if(image!=null)image.close();}
    }

    private NativeImage renderFramebuffer(Object display,float scale)throws Exception{
        SimpleFramebuffer fb=new SimpleFramebuffer(SIZE,SIZE,true,true);BufferAllocator allocator=new BufferAllocator(2_097_152);try{fb.setClearColor(0f,0f,0f,0f);fb.setTexFilter(GL11.GL_NEAREST);fb.beginWrite(true);fb.clear(false);MatrixStack matrices=new MatrixStack();matrices.translate(0.0,-0.15,-3.2);matrices.scale(scale,scale,scale);VertexConsumerProvider.Immediate consumers=VertexConsumerProvider.immediate(allocator);Object renderer=tide.newRenderer(client.getEntityRenderDispatcher());tide.render(renderer,display,matrices,consumers,LightmapTextureManager.MAX_LIGHT_COORDINATE,OverlayTexture.DEFAULT_UV);consumers.draw();return ScreenshotRecorder.takeScreenshot(fb);}finally{fb.endWrite();fb.delete();allocator.close();client.getFramebuffer().beginWrite(true);}}
    private Path renderPath(Job j){String base=j.entry.fishId().replace(':','_').replace('/','_').replaceFirst("_","__");String suffix=j.variant.equals("default")?"":"__"+j.variant;return renders.resolve(base+suffix+".png");}
    private static String namespace(String id){int i=id.indexOf(':');return i<0?"minecraft":id.substring(0,i);} private record Job(RegistryLoader.Entry entry,String variant){}

    private static final class TideRuntime{
        private final Constructor<?> displayCtor,rendererCtor;private final Method setDisplayStack,getDisplayData,entityType,render;
        private TideRuntime(Constructor<?> a,Method b,Method c,Method d,Constructor<?> e,Method f){displayCtor=a;setDisplayStack=b;getDisplayData=c;entityType=d;rendererCtor=e;render=f;}
        static TideRuntime load(MinecraftClient client)throws Exception{ClassLoader cl=RenderService.class.getClassLoader();Class<?> be=Class.forName(DISPLAY_BE,true,cl),renderer=Class.forName(DISPLAY_RENDERER,true,cl);Constructor<?> dc=be.getConstructor(BlockPos.class,BlockState.class);Method ss=be.getMethod("setDisplayStack",ItemStack.class),gd=be.getMethod("getDisplayData"),et=gd.getReturnType().getMethod("entityType");Object dispatcher=client.getEntityRenderDispatcher();Constructor<?> rc=Arrays.stream(renderer.getConstructors()).filter(c->c.getParameterCount()==1&&c.getParameterTypes()[0].isInstance(dispatcher)).findFirst().orElseThrow(()->new NoSuchMethodException("FishDisplayRenderer(EntityRenderDispatcher) constructor not found"));Method rm=Arrays.stream(renderer.getMethods()).filter(m->m.getName().equals("render")&&m.getParameterCount()==6&&m.getParameterTypes()[0].isAssignableFrom(be)).findFirst().orElseThrow(()->new NoSuchMethodException("FishDisplayRenderer.render(...) not found"));return new TideRuntime(dc,ss,gd,et,rc,rm);}
        Object newDisplay(BlockPos pos,BlockState state)throws Exception{return displayCtor.newInstance(pos,state);}boolean setDisplayStack(Object display,ItemStack stack)throws Exception{return(boolean)setDisplayStack.invoke(display,stack);}Object getDisplayData(Object display)throws Exception{return getDisplayData.invoke(display);}Object entityType(Object data)throws Exception{return entityType.invoke(data);}Object newRenderer(Object dispatcher)throws Exception{return rendererCtor.newInstance(dispatcher);}void render(Object renderer,Object display,MatrixStack matrices,VertexConsumerProvider consumers,int light,int overlay)throws Exception{render.invoke(renderer,display,0f,matrices,consumers,light,overlay);}
    }
}
