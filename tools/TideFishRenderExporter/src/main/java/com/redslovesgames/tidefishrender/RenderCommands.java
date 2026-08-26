package com.redslovesgames.tidefishrender;

import net.fabricmc.fabric.api.client.command.v2.FabricClientCommandSource;
import net.minecraft.text.Text;

final class RenderCommands {
    private RenderCommands() {}
    static int verify(FabricClientCommandSource source) { try { RenderReport r=RenderService.create().verifyAll(); source.sendFeedback(Text.literal("Fish render verification: "+r.successful()+"/"+r.totalFish()+" ready. Report: "+r.reportPath())); return r.failed()==0?1:0; } catch(Exception e){ source.sendError(Text.literal("fishrender verify failed: "+e.getClass().getSimpleName()+": "+e.getMessage())); return 0; } }
    static int exportAll(FabricClientCommandSource source,String variant){ return run(source,()->RenderService.create().exportAll(variant)); }
    static int exportNamespace(FabricClientCommandSource source,String namespace,String variant){ return run(source,()->RenderService.create().exportNamespace(namespace,variant)); }
    static int exportFish(FabricClientCommandSource source,String fishId,String variant){ return run(source,()->RenderService.create().exportFish(fishId,variant)); }
    private static int run(FabricClientCommandSource source,ThrowingSupplier<RenderReport> action){ try{ RenderReport r=action.get(); source.sendFeedback(Text.literal("Fish render export complete: "+r.successful()+" successful, "+r.failed()+" failed. Report: "+r.reportPath())); return r.failed()==0?1:0; }catch(Exception e){ source.sendError(Text.literal("fishrender failed: "+e.getClass().getSimpleName()+": "+e.getMessage())); return 0; } }
    @FunctionalInterface private interface ThrowingSupplier<T>{T get() throws Exception;}
}
