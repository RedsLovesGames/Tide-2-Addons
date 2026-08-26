package com.redslovesgames.tidefishrender;

import java.nio.file.Path;

record RenderReport(int totalFish, int successful, int failed, int variantRenders, Path reportPath) {}
