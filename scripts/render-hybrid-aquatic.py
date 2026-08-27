#!/usr/bin/env python3
"""Render Tide-compatible Hybrid Aquatic fish directly from the mod's GeckoLib geometry + textures.

No generated/placeholder art is used. The exporter reads the source `.geo.json` cuboids and the
source entity textures from the supplied/downloaded Hybrid Aquatic JAR, projects them to a
transparent orthographic side-profile image, and writes one deterministic PNG per FishData ID.
"""
from __future__ import annotations

import argparse
import json
import math
import zipfile
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image

FISH_IDS = """anglerfish barreleye betta blobfish blowfish boxfish carp cichlid clownfish coelacanth damselfish danio discus dragonfish flashlight_fish flying_fish golden_dorado goldfish gourami herring john_dory lionfish mackerel mahi moray_eel needlefish oarfish ocean_sunfish opah parrotfish pearlfish piranha pleco ratfish rockfish sea_bass seahorse sheepshead_wrasse snailfish squirrelfish stingray stonefish sunfish surgeonfish tetra tiger_barb trevally triggerfish tuna""".split()

# These entities select a model/texture variant at runtime. Pick one real canonical/default-like
# source variant deterministically for documentation instead of inventing a blended representation.
SPECIAL = {
    "blowfish": ("geo/fish/blowfish/blowfish_small.geo.json", "textures/entity/fish/blowfish/blowfish_small.png"),
    "boxfish": ("geo/fish/boxfish/boxfish.geo.json", "textures/entity/fish/boxfish/whitespotted_boxfish.png"),
    "clownfish": ("geo/fish/clownfish/clownfish_big.geo.json", "textures/entity/fish/clownfish/clownfish.png"),
    "goldfish": ("geo/fish/goldfish/common_goldfish.geo.json", "textures/entity/fish/goldfish/common_goldfish.png"),
    "mahi": ("geo/fish/mahi/mahi_mahi.geo.json", "textures/entity/fish/mahi/mahi_mahi.png"),
    "ratfish": ("geo/fish/ratfish/ratfish.geo.json", "textures/entity/fish/ratfish/ratfish_silver.png"),
    "rockfish": ("geo/fish/rockfish/rockfish.geo.json", "textures/entity/fish/rockfish/copper_rockfish.png"),
    "seahorse": ("geo/fish/seahorse/seahorse.geo.json", "textures/entity/fish/seahorse/seahorse_common.png"),
    "sheepshead_wrasse": ("geo/fish/wrasse/california_sheepshead.geo.json", "textures/entity/fish/wrasse/california_sheepshead.png"),
    "stingray": ("geo/fish/stingray/stingray_blue_spotted.geo.json", "textures/entity/fish/stingray/stingray_blue_spotted.png"),
    "tetra": ("geo/fish/tetra/tetra.geo.json", "textures/entity/fish/tetra/neon_tetra.png"),
    "trevally": ("geo/fish/trevally/trevally.geo.json", "textures/entity/fish/trevally/pilotfish_white.png"),
}


def resource_paths(fid: str) -> tuple[str, str]:
    if fid in SPECIAL:
        return SPECIAL[fid]
    return f"geo/fish/{fid}/{fid}.geo.json", f"textures/entity/fish/{fid}/{fid}.png"


def rotate_xyz(point, pivot, degrees):
    q = np.asarray(point, dtype=float) - pivot
    rx, ry, rz = np.radians(np.asarray(degrees, dtype=float))
    if abs(rx) > 1e-9:
        c, s = math.cos(rx), math.sin(rx)
        q = np.array([q[0], q[1] * c - q[2] * s, q[1] * s + q[2] * c])
    if abs(ry) > 1e-9:
        c, s = math.cos(ry), math.sin(ry)
        q = np.array([q[0] * c + q[2] * s, q[1], -q[0] * s + q[2] * c])
    if abs(rz) > 1e-9:
        c, s = math.cos(rz), math.sin(rz)
        q = np.array([q[0] * c - q[1] * s, q[0] * s + q[1] * c, q[2]])
    return q + pivot


def transform_point(point, cube, bone_name, bones):
    q = np.asarray(point, dtype=float)
    if cube.get("rotation"):
        pivot = np.asarray(cube.get("pivot", cube.get("origin", [0, 0, 0])), dtype=float)
        q = rotate_xyz(q, pivot, cube["rotation"])
    bone_id = bone_name
    while bone_id:
        bone = bones[bone_id]
        if bone.get("rotation"):
            q = rotate_xyz(q, np.asarray(bone.get("pivot", [0, 0, 0]), dtype=float), bone["rotation"])
        bone_id = bone.get("parent")
    return q


def box_uv(u, v, dx, dy, dz):
    # Standard Bedrock box-UV unwrap used by GeckoLib geometry files.
    return {
        "west": [(u, v + dz), (u + dz, v + dz), (u + dz, v + dz + dy), (u, v + dz + dy)],
        "north": [(u + dz, v + dz), (u + dz + dx, v + dz), (u + dz + dx, v + dz + dy), (u + dz, v + dz + dy)],
        "east": [(u + dz + dx, v + dz), (u + dz + dx + dz, v + dz), (u + dz + dx + dz, v + dz + dy), (u + dz + dx, v + dz + dy)],
        "south": [(u + dz + dx + dz, v + dz), (u + dz + dx + dz + dx, v + dz), (u + dz + dx + dz + dx, v + dz + dy), (u + dz + dx + dz, v + dz + dy)],
        "up": [(u + dz, v), (u + dz + dx, v), (u + dz + dx, v + dz), (u + dz, v + dz)],
        "down": [(u + dz + dx, v), (u + dz + dx + dx, v), (u + dz + dx + dx, v + dz), (u + dz + dx, v + dz)],
    }


def cube_faces(cube, bone_name, bones):
    origin = np.asarray(cube.get("origin", [0, 0, 0]), dtype=float)
    size = np.asarray(cube.get("size", [0, 0, 0]), dtype=float)
    inflate = float(cube.get("inflate", 0) or 0)
    origin -= inflate
    size += inflate * 2
    x0, y0, z0 = origin
    x1, y1, z1 = origin + size
    vertices = {
        "000": [x0, y0, z0], "100": [x1, y0, z0], "110": [x1, y1, z0], "010": [x0, y1, z0],
        "001": [x0, y0, z1], "101": [x1, y0, z1], "111": [x1, y1, z1], "011": [x0, y1, z1],
    }
    face_vertices = {
        "west": ["000", "001", "011", "010"], "east": ["101", "100", "110", "111"],
        "north": ["100", "000", "010", "110"], "south": ["001", "101", "111", "011"],
        "up": ["010", "011", "111", "110"], "down": ["000", "100", "101", "001"],
    }
    raw_uv = cube.get("uv", [0, 0])
    if isinstance(raw_uv, dict):
        uvs = {}
        for face in face_vertices:
            entry = raw_uv.get(face)
            if entry and "uv" in entry:
                u, v = entry["uv"]
                w, h = entry.get("uv_size", [1, 1])
                uvs[face] = [(u, v), (u + w, v), (u + w, v + h), (u, v + h)]
            else:
                uvs[face] = [(0, 0)] * 4
    else:
        u, v = raw_uv
        uvs = box_uv(float(u), float(v), *size)
    if cube.get("mirror"):
        uvs["west"], uvs["east"] = uvs["east"], uvs["west"]
        uvs = {key: list(reversed(value)) for key, value in uvs.items()}
    for face, keys in face_vertices.items():
        yield face, [transform_point(vertices[key], cube, bone_name, bones) for key in keys], uvs[face]


def render_geometry(geometry, texture: Image.Image, output: Path, target_w=760, target_h=340, margin=28):
    model = geometry["minecraft:geometry"][0]
    bones = {bone["name"]: bone for bone in model.get("bones", [])}
    faces, points = [], []
    for bone in model.get("bones", []):
        for cube in bone.get("cubes", []):
            for face in cube_faces(cube, bone["name"], bones):
                faces.append(face)
                points.extend(face[1])

    # A tiny yaw keeps zero-thickness fins readable while staying effectively side-on.
    yaw = math.radians(4.0)
    def camera(point):
        x, y, z = point
        xr = x * math.cos(yaw) + z * math.sin(yaw)
        zr = -x * math.sin(yaw) + z * math.cos(yaw)
        return np.array([zr, -y, xr], dtype=float)

    projected = np.asarray([camera(point) for point in points])
    min_x, min_y = np.min(projected[:, :2], axis=0)
    max_x, max_y = np.max(projected[:, :2], axis=0)
    span_x, span_y = max(max_x - min_x, 1e-6), max(max_y - min_y, 1e-6)
    scale = min((target_w - margin * 2) / span_x, (target_h - margin * 2) / span_y)
    width = min(target_w, max(64, int(math.ceil(span_x * scale + margin * 2))))
    height = min(target_h, max(64, int(math.ceil(span_y * scale + margin * 2))))
    offset_x = (width - span_x * scale) / 2 - min_x * scale
    offset_y = (height - span_y * scale) / 2 - min_y * scale

    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    zbuf = np.full((height, width), -1e30, dtype=np.float32)
    tex = np.asarray(texture.convert("RGBA"))
    tex_h, tex_w = tex.shape[:2]

    for _face_name, verts, face_uvs in faces:
        cp = [camera(point) for point in verts]
        screen = np.asarray([[q[0] * scale + offset_x, q[1] * scale + offset_y, q[2]] for q in cp], dtype=float)
        normal = np.cross(np.asarray(verts[1]) - np.asarray(verts[0]), np.asarray(verts[2]) - np.asarray(verts[0]))
        nlen = np.linalg.norm(normal)
        if nlen:
            normal /= nlen
        brightness = 0.84 + 0.16 * abs(float(normal[0]))

        for tri in ((0, 1, 2), (0, 2, 3)):
            a, b, c = [screen[i] for i in tri]
            ta, tb, tc = [np.asarray(face_uvs[i], dtype=float) for i in tri]
            x0 = max(0, int(math.floor(min(a[0], b[0], c[0]))))
            x1 = min(width - 1, int(math.ceil(max(a[0], b[0], c[0]))))
            y0 = max(0, int(math.floor(min(a[1], b[1], c[1]))))
            y1 = min(height - 1, int(math.ceil(max(a[1], b[1], c[1]))))
            denominator = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
            if abs(denominator) < 1e-9:
                continue

            xx, yy = np.meshgrid(np.arange(x0, x1 + 1, dtype=float) + 0.5, np.arange(y0, y1 + 1, dtype=float) + 0.5)
            w1 = ((b[1] - c[1]) * (xx - c[0]) + (c[0] - b[0]) * (yy - c[1])) / denominator
            w2 = ((c[1] - a[1]) * (xx - c[0]) + (a[0] - c[0]) * (yy - c[1])) / denominator
            w3 = 1.0 - w1 - w2
            mask = (w1 >= -1e-6) & (w2 >= -1e-6) & (w3 >= -1e-6)
            if not np.any(mask):
                continue
            depth = w1 * a[2] + w2 * b[2] + w3 * c[2]
            sub_z = zbuf[y0:y1 + 1, x0:x1 + 1]
            mask &= depth >= sub_z - 1e-5
            if not np.any(mask):
                continue
            u = w1 * ta[0] + w2 * tb[0] + w3 * tc[0]
            v = w1 * ta[1] + w2 * tb[1] + w3 * tc[1]
            tx = np.floor(u).astype(int) % tex_w
            ty = np.floor(v).astype(int) % tex_h
            pixels = tex[ty, tx].copy()
            mask &= pixels[:, :, 3] > 0
            if not np.any(mask):
                continue
            pixels[:, :, :3] = np.clip(pixels[:, :, :3].astype(float) * brightness, 0, 255).astype(np.uint8)
            sub_rgba = rgba[y0:y1 + 1, x0:x1 + 1]
            sub_rgba[mask] = pixels[mask]
            sub_z[mask] = depth[mask]

    image = Image.fromarray(rgba, "RGBA")
    bounds = image.getbbox()
    if bounds:
        pad = 8
        bounds = (max(0, bounds[0] - pad), max(0, bounds[1] - pad), min(width, bounds[2] + pad), min(height, bounds[3] + pad))
        image = image.crop(bounds)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, optimize=True)
    return image.size


def update_manifest(path: Path, ids):
    data = json.loads(path.read_text(encoding="utf-8"))
    fish = data.setdefault("fish", {})
    for fid in ids:
        full_id = f"hybrid_aquatic:{fid}"
        fish[full_id] = {
            "source": "Hybrid Aquatic 1.6.9 GeckoLib source geometry + entity texture",
            "entity": full_id,
            "render_provenance": {
                "mod_version": "1.6.9",
                "modrinth_version_id": "F5POkJG0",
                "method": "source_geometry_static_export"
            },
            "variants": {
                "normal": {
                    "file": f"fish/assets/renders/hybrid_aquatic__{fid}.png",
                    "status": "source_backed_static_geometry"
                }
            }
        }

    # Remove newly-rendered entries from whichever failure/unavailable list the older manifest uses.
    full_ids = {f"hybrid_aquatic:{fid}" for fid in ids}
    for key, value in list(data.items()):
        if isinstance(value, list):
            data[key] = [item for item in value if not (isinstance(item, dict) and item.get("fish_id") in full_ids)]

    counts = data.setdefault("counts", {})
    requested = int(counts.get("requested_fish", 156))
    supported = len(fish)
    counts["requested_fish"] = requested
    counts["supported_fish"] = supported
    counts["normal"] = sum(1 for entry in fish.values() if entry.get("variants", {}).get("normal", {}).get("file"))
    counts["failed"] = max(0, requested - supported)
    counts["variant_renders"] = 0
    data["pipelineStatus"] = "source_authentic_complete" if counts["failed"] == 0 else "source_authentic_partial"
    data["policy"] = "Only source-authentic runtime or direct source-geometry renders are published. Missing compatibility entries remain unavailable rather than using invented artwork."
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--jar", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args()

    rendered = []
    provenance = {"mod": "Hybrid Aquatic", "version": "1.6.9", "modrinth_version_id": "F5POkJG0", "fish": {}}
    with zipfile.ZipFile(args.jar) as jar:
        names = set(jar.namelist())
        for fid in FISH_IDS:
            model_rel, texture_rel = resource_paths(fid)
            model_path = f"assets/hybrid_aquatic/{model_rel}"
            texture_path = f"assets/hybrid_aquatic/{texture_rel}"
            if model_path not in names or texture_path not in names:
                raise RuntimeError(f"Missing source assets for {fid}: {model_path} / {texture_path}")
            geometry = json.loads(jar.read(model_path))
            texture = Image.open(BytesIO(jar.read(texture_path))).convert("RGBA")
            output = args.output / f"hybrid_aquatic__{fid}.png"
            width, height = render_geometry(geometry, texture, output)
            rendered.append(fid)
            provenance["fish"][f"hybrid_aquatic:{fid}"] = {
                "model": model_path,
                "texture": texture_path,
                "render": str(output).replace("\\", "/"),
                "width": width,
                "height": height
            }
            print(f"HA_RENDER_OK hybrid_aquatic:{fid} {width}x{height}")

    if len(rendered) != 49:
        raise RuntimeError(f"Expected 49 Hybrid Aquatic renders, got {len(rendered)}")
    provenance_path = args.output.parent.parent / "render-data" / "hybrid-aquatic-render-provenance.json"
    provenance_path.parent.mkdir(parents=True, exist_ok=True)
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    if args.manifest:
        update_manifest(args.manifest, rendered)
    print(f"HA_RENDER_DONE total={len(rendered)}")


if __name__ == "__main__":
    main()
