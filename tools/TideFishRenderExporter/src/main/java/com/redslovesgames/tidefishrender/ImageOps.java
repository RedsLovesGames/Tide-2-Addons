package com.redslovesgames.tidefishrender;

import net.minecraft.client.texture.NativeImage;
import java.io.IOException;
import java.nio.file.Path;

final class ImageOps {
    private ImageOps() {}
    record Bounds(int minX,int minY,int maxX,int maxY){int width(){return maxX-minX+1;}int height(){return maxY-minY+1;}boolean touches(int w,int h,int m){return minX<=m||minY<=m||maxX>=w-1-m||maxY>=h-1-m;}}
    static Bounds alphaBounds(NativeImage img){int minX=img.getWidth(),minY=img.getHeight(),maxX=-1,maxY=-1;for(int y=0;y<img.getHeight();y++)for(int x=0;x<img.getWidth();x++){int a=(img.getColor(x,y)>>>24)&255;if(a>0){if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y;}}return maxX<0?null:new Bounds(minX,minY,maxX,maxY);}
    static NativeImage cropWithPadding(NativeImage src,Bounds b,int pad){NativeImage out=new NativeImage(NativeImage.Format.RGBA,b.width()+pad*2,b.height()+pad*2,true);for(int y=0;y<b.height();y++)for(int x=0;x<b.width();x++)out.setColor(x+pad,y+pad,src.getColor(b.minX()+x,b.minY()+y));return out;}
    static void write(NativeImage image,Path file)throws IOException{java.nio.file.Files.createDirectories(file.getParent());image.writeTo(file);}
}
