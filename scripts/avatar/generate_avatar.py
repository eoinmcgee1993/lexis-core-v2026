#!/usr/bin/env python3
"""
Procedurally generates a simple, stylized female tutor avatar as a self-contained
.glb, compatible with frontend/src/components/TutorAvatar3D.jsx's morph-target
lookup (MOUTH_MORPH_CANDIDATES / BLINK_MORPH_CANDIDATES).

This is a placeholder — a simple low-poly bust, not a photoreal character. Swap
it for a real MetaPerson Creator / Ready Player Me export later by overwriting
frontend/public/avatar/lexis-tutor.glb (or pointing VITE_AVATAR_GLB_URL
elsewhere); as long as the replacement exposes mouth-open and eye-blink morph
targets under one of the candidate names, no code changes are needed.

Coordinate system: Y-up, +Z is the face-forward direction, head centered near
the world origin (matching TutorAvatar3D's camera, which looks at (0,0,0)).

Usage:
    python3 generate_avatar.py [--out ../../frontend/public/avatar/lexis-tutor.glb]
"""
import argparse
import math
from pathlib import Path

import numpy as np
import pygltflib as gltf


# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------

def uv_sphere_patch(radius, theta_range, phi_range, rings, sectors, center=(0.0, 0.0, 0.0), scale=(1.0, 1.0, 1.0)):
    """A grid patch of a UV sphere. theta: polar angle from +Y (0=top pole,
    pi=bottom pole). phi: azimuth around Y, 0 = +Z (front). Returns
    (positions Nx3 float32, normals Nx3 float32, indices Mx3 uint32)."""
    theta0, theta1 = theta_range
    phi0, phi1 = phi_range
    cx, cy, cz = center
    sx, sy, sz = scale

    thetas = np.linspace(theta0, theta1, rings + 1)
    phis = np.linspace(phi0, phi1, sectors + 1)

    positions = []
    normals = []
    for th in thetas:
        for ph in phis:
            nx = math.sin(th) * math.sin(ph)
            ny = math.cos(th)
            nz = math.sin(th) * math.cos(ph)
            positions.append((cx + nx * radius * sx, cy + ny * radius * sy, cz + nz * radius * sz))
            # Approximate normal (fine for a smooth, roughly-spherical shape
            # even when non-uniformly scaled — good enough at this stylization
            # level).
            normals.append((nx, ny, nz))

    positions = np.array(positions, dtype=np.float32)
    normals = np.array(normals, dtype=np.float32)
    norm_len = np.linalg.norm(normals, axis=1, keepdims=True)
    norm_len[norm_len == 0] = 1
    normals = normals / norm_len

    indices = []
    cols = sectors + 1
    for i in range(rings):
        for j in range(sectors):
            a = i * cols + j
            b = a + 1
            c = a + cols
            d = c + 1
            indices.append((a, c, b))
            indices.append((b, c, d))
    indices = np.array(indices, dtype=np.uint32)

    return positions, normals, indices


def box(center, half_extents):
    """Axis-aligned box. Returns (positions, normals, indices)."""
    cx, cy, cz = center
    hx, hy, hz = half_extents
    # 6 faces x 4 verts, each face flat-shaded with its own normal.
    faces = [
        # (normal, 4 corner offsets in CCW winding when viewed from outside)
        ((0, 0, 1), [(-hx, -hy, hz), (hx, -hy, hz), (hx, hy, hz), (-hx, hy, hz)]),
        ((0, 0, -1), [(hx, -hy, -hz), (-hx, -hy, -hz), (-hx, hy, -hz), (hx, hy, -hz)]),
        ((0, 1, 0), [(-hx, hy, hz), (hx, hy, hz), (hx, hy, -hz), (-hx, hy, -hz)]),
        ((0, -1, 0), [(-hx, -hy, -hz), (hx, -hy, -hz), (hx, -hy, hz), (-hx, -hy, hz)]),
        ((1, 0, 0), [(hx, -hy, hz), (hx, -hy, -hz), (hx, hy, -hz), (hx, hy, hz)]),
        ((-1, 0, 0), [(-hx, -hy, -hz), (-hx, -hy, hz), (-hx, hy, hz), (-hx, hy, -hz)]),
    ]
    positions = []
    normals = []
    indices = []
    for normal, corners in faces:
        base = len(positions)
        for cxo, cyo, czo in corners:
            positions.append((cx + cxo, cy + cyo, cz + czo))
            normals.append(normal)
        indices.append((base, base + 1, base + 2))
        indices.append((base, base + 2, base + 3))
    return (
        np.array(positions, dtype=np.float32),
        np.array(normals, dtype=np.float32),
        np.array(indices, dtype=np.uint32),
    )


def merge_patches(patches):
    """Merge a list of (positions, normals, indices) into one."""
    positions = []
    normals = []
    indices = []
    offset = 0
    for pos, nrm, idx in patches:
        positions.append(pos)
        normals.append(nrm)
        indices.append(idx + offset)
        offset += len(pos)
    return np.concatenate(positions), np.concatenate(normals), np.concatenate(indices)


# ---------------------------------------------------------------------------
# glTF assembly
# ---------------------------------------------------------------------------

class GLBBuilder:
    """Minimal helper for assembling a single-scene GLB with a handful of
    opaque, flat-color mesh primitives, some with morph targets."""

    def __init__(self):
        self.g = gltf.GLTF2(asset=gltf.Asset(generator="lexis-core avatar generator", version="2.0"))
        self.g.scenes.append(gltf.Scene(nodes=[]))
        self.g.scene = 0
        self._blob = bytearray()

    def _add_buffer_view(self, data: bytes, target=None):
        byte_offset = len(self._blob)
        self._blob.extend(data)
        # glTF requires 4-byte alignment for bufferViews used as vertex data.
        pad = (-len(data)) % 4
        self._blob.extend(b"\x00" * pad)
        bv = gltf.BufferView(buffer=0, byteOffset=byte_offset, byteLength=len(data))
        if target is not None:
            bv.target = target
        self.g.bufferViews.append(bv)
        return len(self.g.bufferViews) - 1

    def _add_accessor(self, array: np.ndarray, component_type, accessor_type, target=None, normalized=False):
        data = array.tobytes()
        bv_index = self._add_buffer_view(data, target=target)
        mins = array.min(axis=0).tolist() if array.ndim == 2 else [float(array.min())]
        maxs = array.max(axis=0).tolist() if array.ndim == 2 else [float(array.max())]
        acc = gltf.Accessor(
            bufferView=bv_index,
            componentType=component_type,
            count=len(array),
            type=accessor_type,
            min=mins,
            max=maxs,
            normalized=normalized,
        )
        self.g.accessors.append(acc)
        return len(self.g.accessors) - 1

    def add_material(self, rgb, roughness=0.75, metallic=0.0):
        mat = gltf.Material(
            pbrMetallicRoughness=gltf.PbrMetallicRoughness(
                baseColorFactor=[rgb[0], rgb[1], rgb[2], 1.0],
                roughnessFactor=roughness,
                metallicFactor=metallic,
            ),
            doubleSided=True,
        )
        self.g.materials.append(mat)
        return len(self.g.materials) - 1

    def add_mesh_node(self, name, positions, normals, indices, material_index, morph_target_name=None, morph_deltas=None):
        pos_acc = self._add_accessor(positions.astype(np.float32), gltf.FLOAT, gltf.VEC3, target=gltf.ARRAY_BUFFER)
        nrm_acc = self._add_accessor(normals.astype(np.float32), gltf.FLOAT, gltf.VEC3, target=gltf.ARRAY_BUFFER)
        # uint16 indices: every part here has well under 65536 vertices, and
        # this avoids relying on the OES_element_index_uint extension.
        idx_acc = self._add_accessor(indices.astype(np.uint16).reshape(-1), gltf.UNSIGNED_SHORT, gltf.SCALAR, target=gltf.ELEMENT_ARRAY_BUFFER)

        primitive = gltf.Primitive(
            attributes=gltf.Attributes(POSITION=pos_acc, NORMAL=nrm_acc),
            indices=idx_acc,
            material=material_index,
        )

        mesh_extras = None
        if morph_target_name is not None:
            delta_acc = self._add_accessor(morph_deltas.astype(np.float32), gltf.FLOAT, gltf.VEC3)
            primitive.targets = [{"POSITION": delta_acc}]
            mesh_extras = {"targetNames": [morph_target_name]}

        mesh = gltf.Mesh(primitives=[primitive], name=name)
        if mesh_extras is not None:
            mesh.extras = mesh_extras
            # Rest-pose weight for the morph target (0 = neutral / mouth
            # closed / eyes open). three.js reads this as the initial
            # morphTargetInfluences value before any app code touches it.
            mesh.weights = [0.0]

        self.g.meshes.append(mesh)
        mesh_index = len(self.g.meshes) - 1

        node = gltf.Node(mesh=mesh_index, name=name)
        self.g.nodes.append(node)
        node_index = len(self.g.nodes) - 1
        self.g.scenes[0].nodes.append(node_index)
        return node_index

    def save(self, path):
        self.g.buffers.append(gltf.Buffer(byteLength=len(self._blob)))
        self.g.set_binary_blob(bytes(self._blob))
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        self.g.save_binary(str(path))


# ---------------------------------------------------------------------------
# The avatar
# ---------------------------------------------------------------------------

DEG = math.pi / 180.0

# Colors (linear-ish sRGB floats 0-1 — close enough for baseColorFactor at
# this stylization level).
SKIN = (0.91, 0.72, 0.58)
HAIR = (0.22, 0.14, 0.10)
BLOUSE = (0.055, 0.463, 0.435)  # matches the app's cyan/teal brand palette
EYEBROW = (0.16, 0.10, 0.07)
EYE = (0.09, 0.06, 0.05)
LIP = (0.79, 0.44, 0.51)
MOUTH_INTERIOR = (0.40, 0.11, 0.11)

HEAD_R = 0.108


def build():
    b = GLBBuilder()

    # --- Head ---------------------------------------------------------
    pos, nrm, idx = uv_sphere_patch(HEAD_R, (0, math.pi), (-math.pi, math.pi), rings=16, sectors=24)
    skin_mat = b.add_material(SKIN, roughness=0.55)
    b.add_mesh_node("Head", pos, nrm, idx, skin_mat)

    # --- Neck + shoulders/body (neck reuses the skin material) -----------
    neck_top_y, neck_bottom_y = -HEAD_R * 0.85, -HEAD_R * 1.65
    neck_r = HEAD_R * 0.42

    def cylinder(radius, y0, y1, sectors=16):
        phis = np.linspace(-math.pi, math.pi, sectors + 1)
        positions = []
        normals = []
        for y in (y0, y1):
            for ph in phis:
                x, z = math.sin(ph) * radius, math.cos(ph) * radius
                positions.append((x, y, z))
                normals.append((math.sin(ph), 0, math.cos(ph)))
        positions = np.array(positions, dtype=np.float32)
        normals = np.array(normals, dtype=np.float32)
        indices = []
        cols = sectors + 1
        for j in range(sectors):
            a, bI, c, d = j, j + 1, cols + j, cols + j + 1
            indices.append((a, c, bI))
            indices.append((bI, c, d))
        return positions, normals, np.array(indices, dtype=np.uint32)

    npos, nnrm, nidx = cylinder(neck_r, neck_top_y, neck_bottom_y)
    b.add_mesh_node("Neck", npos, nnrm, nidx, skin_mat)

    body_pos, body_nrm, body_idx = uv_sphere_patch(
        HEAD_R, (0, 150 * DEG), (-math.pi, math.pi), rings=10, sectors=20,
        center=(0, neck_bottom_y - HEAD_R * 0.55, -HEAD_R * 0.15),
        scale=(2.7, 1.5, 1.9),
    )
    blouse_mat = b.add_material(BLOUSE, roughness=0.8)
    b.add_mesh_node("Body", body_pos, body_nrm, body_idx, blouse_mat)

    # --- Hair: crown cap + two mirrored side/back bands, leaving the face
    # oval (front, low theta-from-crown, narrow phi) uncovered. -----------
    hair_mat = b.add_material(HAIR, roughness=0.45)
    HAIR_R = HEAD_R * 1.09
    crown = uv_sphere_patch(HAIR_R, (0, 50 * DEG), (-math.pi, math.pi), rings=8, sectors=28, center=(0, 0.006, -0.004))
    side_r = uv_sphere_patch(HAIR_R, (40 * DEG, 100 * DEG), (55 * DEG, math.pi), rings=8, sectors=14, center=(0, 0.006, -0.004))
    side_l = uv_sphere_patch(HAIR_R, (40 * DEG, 100 * DEG), (-math.pi, -55 * DEG), rings=8, sectors=14, center=(0, 0.006, -0.004))
    hair_pos, hair_nrm, hair_idx = merge_patches([crown, side_r, side_l])
    b.add_mesh_node("Hair", hair_pos, hair_nrm, hair_idx, hair_mat)

    # --- Hair length past the shoulders (two tapered side strands, each
    # built from two stacked boxes narrowing toward the tip) -------------
    def strand(x_sign):
        x = x_sign * 0.100
        return merge_patches([
            box((x, -0.045, -0.018), (0.026, 0.065, 0.024)),
            box((x * 1.02, -0.175, -0.020), (0.017, 0.075, 0.017)),
        ])

    strand_pos, strand_nrm, strand_idx = merge_patches([strand(-1), strand(1)])
    b.add_mesh_node("HairStrands", strand_pos, strand_nrm, strand_idx, hair_mat)

    # --- Eyebrows (static, thin flat boxes) -------------------------------
    brow_mat = b.add_material(EYEBROW, roughness=0.6)
    brow_pos, brow_nrm, brow_idx = merge_patches([
        box((-0.040, 0.040, 0.101), (0.017, 0.0025, 0.005)),
        box((0.040, 0.040, 0.101), (0.017, 0.0025, 0.005)),
    ])
    b.add_mesh_node("Eyebrows", brow_pos, brow_nrm, brow_idx, brow_mat)

    # --- Eyes (morph target: eyesClosed) ---------------------------------
    eye_mat = b.add_material(EYE, roughness=0.25)
    eye_r = 0.0145
    eye_centers = ((-0.041, 0.018, 0.101), (0.041, 0.018, 0.101))
    eye_l_sphere = uv_sphere_patch(eye_r, (0, math.pi), (-math.pi, math.pi), rings=8, sectors=8, center=eye_centers[0])
    eye_r_sphere = uv_sphere_patch(eye_r, (0, math.pi), (-math.pi, math.pi), rings=8, sectors=8, center=eye_centers[1])
    eyes_pos, eyes_nrm, eyes_idx = merge_patches([eye_l_sphere, eye_r_sphere])
    # Blink: flatten each eyeball to a thin lid-line by scaling Y toward its
    # own center by 90%, i.e. delta = -0.9 * (y - centerY) for each eye.
    eyes_deltas = np.zeros_like(eyes_pos)
    for cx, cy, cz in eye_centers:
        mask = np.isclose(eyes_pos[:, 0] - cx, 0, atol=eye_r * 1.05) & np.isclose(eyes_pos[:, 2] - cz, 0, atol=eye_r * 1.05)
        eyes_deltas[mask, 1] = -0.9 * (eyes_pos[mask, 1] - cy)
    b.add_mesh_node("Eyes", eyes_pos, eyes_nrm, eyes_idx, eye_mat, morph_target_name="eyesClosed", morph_deltas=eyes_deltas)

    # --- Mouth (morph target: mouthOpen) ----------------------------------
    # A small 2x2 ribbon: top row = upper lip (fixed), bottom row = lower
    # lip/interior, resting almost coincident with the top row (reads as a
    # thin closed mouth line) and dropping down + widening when the morph
    # target is active. Positioned mid-face (below the nose line), not down
    # near the chin/collar.
    half_w = 0.021
    mouth_y = -0.027
    mouth_z = 0.106
    mouth_pos = np.array([
        (-half_w, mouth_y + 0.0015, mouth_z),
        (half_w, mouth_y + 0.0015, mouth_z),
        (-half_w, mouth_y - 0.0015, mouth_z),
        (half_w, mouth_y - 0.0015, mouth_z),
    ], dtype=np.float32)
    mouth_nrm = np.tile(np.array([0, 0, 1], dtype=np.float32), (4, 1))
    mouth_idx = np.array([(0, 2, 1), (1, 2, 3)], dtype=np.uint32)
    mouth_deltas = np.array([
        (0, 0, 0),
        (0, 0, 0),
        (-half_w * 0.35, -0.020, -0.004),
        (half_w * 0.35, -0.020, -0.004),
    ], dtype=np.float32)
    mouth_mat = b.add_material(LIP, roughness=0.5)
    b.add_mesh_node("Mouth", mouth_pos, mouth_nrm, mouth_idx, mouth_mat, morph_target_name="mouthOpen", morph_deltas=mouth_deltas)

    return b


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default=str(Path(__file__).resolve().parents[2] / "frontend" / "public" / "avatar" / "lexis-tutor.glb"))
    args = parser.parse_args()

    builder = build()
    builder.save(args.out)
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
