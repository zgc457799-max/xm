import bpy
import sys
import os

def apply_vertex_colors_from_texture(glb_in, texture_png, glb_out, is_spongebob):
    print(f"\n================= Processing {os.path.basename(glb_in)} =================")
    
    # 1. Clear existing objects in the scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    
    # Purge orphan data to keep the file clean
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    
    # 2. Import GLB
    print(f"Importing: {glb_in}")
    bpy.ops.import_scene.gltf(filepath=glb_in)
    
    # 3. Find the imported mesh object
    mesh_objs = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not mesh_objs:
        raise Exception(f"No mesh objects found in {glb_in}")
    
    obj = mesh_objs[0]
    num_vertices = len(obj.data.vertices)
    num_loops = len(obj.data.loops)
    print(f"Found mesh: {obj.name} with {num_vertices} vertices and {num_loops} loops.")
    
    # Make active and selected
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    
    # 4. Bake loop colors (Vertex Colors) from the texture PNG
    print(f"Loading texture for vertex color baking: {texture_png}")
    if not os.path.exists(texture_png):
        raise Exception(f"Texture file not found: {texture_png}")
        
    image = bpy.data.images.load(texture_png, check_existing=True)
    width, height = image.size[0], image.size[1]
    
    print("Pre-fetching pixels...")
    pixels = [0.0] * (width * height * 4)
    image.pixels.foreach_get(pixels)
    
    # Create a new Color Attribute (vertex colors mapped directly to the POINT/VERTEX domain!)
    if "Color" in obj.data.color_attributes:
        obj.data.color_attributes.remove(obj.data.color_attributes["Color"])
        
    color_attr = obj.data.color_attributes.new(
        name="Color",
        type='FLOAT_COLOR',
        domain='POINT'
    )
        
    # Get active UV layer data
    uv_layer = obj.data.uv_layers.active.data
    
    print("Pre-fetching loop UVs...")
    uvs = [0.0] * (num_loops * 2)
    uv_layer.foreach_get("uv", uvs)
    
    print("Pre-fetching loop vertex indices...")
    loop_vertex_indices = [0] * num_loops
    obj.data.loops.foreach_get("vertex_index", loop_vertex_indices)
    
    print("Accumulating UV coordinates per vertex...")
    vertex_u = [0.0] * num_vertices
    vertex_v = [0.0] * num_vertices
    vertex_count = [0] * num_vertices
    
    for i in range(num_loops):
        v_idx = loop_vertex_indices[i]
        vertex_u[v_idx] += uvs[i * 2]
        vertex_v[v_idx] += uvs[i * 2 + 1]
        vertex_count[v_idx] += 1
        
    # 5. Define Palettes (Values are linear RGB!)
    # Formula: linear = (srgb/255.0)**2.2
    
    # SpongeBob Palettes (Linear RGB from beautiful cartoon sRGB values)
    sb_yellow = [1.0, 0.875, 0.0]      # Vibrant sunny yellow (#FFF000)
    sb_white  = [1.0, 1.0, 1.0]        # Pure White (#FFFFFF)
    sb_brown  = [0.260, 0.058, 0.004]  # Classic pants brown (#8B4513)
    sb_red    = [1.0, 0.0, 0.0]        # Deep red (#FF0000)
    sb_black  = [0.0, 0.0, 0.0]        # Pure black (#000000)
    sb_blue   = [0.0, 0.468, 0.875]      # Sky blue iris (#00B5F0)
    sb_orange = [1.0, 0.198, 0.0]      # Warm orange blush (#FF7A00)
    
    sb_palette = [sb_yellow, sb_white, sb_brown, sb_red, sb_black, sb_blue, sb_orange]
    
    # Patrick Palettes (Linear RGB from warm cartoon sRGB values)
    pat_pink  = [1.0, 0.340, 0.379]    # Rich warm peachy/coral pink (#FF9CA4)
    pat_green = [0.359, 0.741, 0.030]  # Vibrant lime green/chartreuse (#A0DF32)
    pat_white = [1.0, 1.0, 1.0]        # Pure White (#FFFFFF)
    pat_black = [0.0, 0.0, 0.0]        # Pure black (#000000)
    pat_red   = [1.0, 0.0, 0.0]        # Deep red mouth interior (#FF0000)
    pat_blue  = [0.003, 0.179, 0.748]  # Rich blue iris (#1075E0)
    pat_purple = [0.297, 0.086, 0.584] # Lavender purple flower spots (#9354C8)
    
    pat_palette = [pat_pink, pat_green, pat_white, pat_black, pat_red, pat_blue, pat_purple]
    
    print("Sampling & Snapping vertex colors...")
    flat_colors = [0.0] * (num_vertices * 4)
    
    for i in range(num_vertices):
        # 1. Coordinate height (Z) in range [-0.5, 0.5]
        v_co = obj.data.vertices[i].co
        z = v_co.z
        
        # 2. Get sampled texture color at vertex UVs
        count = vertex_count[i]
        if count > 0:
            avg_u = vertex_u[i] / count
            avg_v = vertex_v[i] / count
        else:
            avg_u = 0.5
            avg_v = 0.5
            
        avg_u = max(0.0, min(1.0, avg_u))
        avg_v = max(0.0, min(1.0, avg_v))
        
        px = int(avg_u * (width - 1))
        py = int(avg_v * (height - 1))
        pixel_idx = (py * width + px) * 4
        
        sampled_r = pixels[pixel_idx]
        sampled_g = pixels[pixel_idx + 1]
        sampled_b = pixels[pixel_idx + 2]
        sampled_a = pixels[pixel_idx + 3]
        
        # 3. Snap to the closest palette color
        palette = sb_palette if is_spongebob else pat_palette
        closest_color = palette[0]
        min_dist = 999.0
        
        for p_color in palette:
            dist = (p_color[0] - sampled_r)**2 + (p_color[1] - sampled_g)**2 + (p_color[2] - sampled_b)**2
            if dist < min_dist:
                min_dist = dist
                closest_color = p_color
                
        final_color = list(closest_color)
        
        # 4. Spatial Coordinate-Based Partitioning & Override Engine
        if is_spongebob:
            # SpongeBob spatial overrides:
            # 1. Shoes: Z < -0.35
            if z < -0.35:
                final_color = sb_black
            # 2. Socks: Z between -0.35 and -0.24 (White with Blue/Red stripes)
            elif z >= -0.35 and z < -0.24:
                # Blue stripe: Z in [-0.27, -0.255]
                if z >= -0.27 and z < -0.255:
                    final_color = sb_blue
                # Red stripe: Z in [-0.30, -0.285]
                elif z >= -0.30 and z < -0.285:
                    final_color = sb_red
                else:
                    final_color = sb_white
            # 3. Legs: Z between -0.24 and -0.16
            elif z >= -0.24 and z < -0.16:
                final_color = sb_yellow
            # 4. Pants (Brown): Z between -0.16 and -0.06 with Black belt loops
            elif z >= -0.16 and z < -0.06:
                import math
                theta = math.atan2(v_co.x, v_co.y)
                is_belt_loop = False
                if z >= -0.12 and z < -0.09:
                    loop_angles = [0.4, -0.4, 1.2, -1.2, 2.0, -2.0, 2.8, -2.8]
                    for la in loop_angles:
                        d_theta = theta - la
                        if d_theta > 3.14159: d_theta -= 2 * 3.14159
                        elif d_theta < -3.14159: d_theta += 2 * 3.14159
                        if abs(d_theta) < 0.12:
                            is_belt_loop = True
                            break
                if is_belt_loop:
                    final_color = sb_black
                else:
                    final_color = sb_brown
            # 5. Shirt (White): Z between -0.06 and 0.04
            elif z >= -0.06 and z < 0.04:
                # Tie box: Y > 0.14, Z between -0.16 and 0.04, X between -0.12 and 0.12
                is_tie = (v_co.y > 0.14) and (-0.10 <= v_co.x <= 0.10) and (sampled_r > 0.35) and (sampled_r > sampled_b)
                if is_tie:
                    final_color = sb_red
                else:
                    final_color = sb_white
            # 6. Body (Yellow Sponge): Z >= 0.04
            elif z >= 0.04:
                final_color = sb_yellow
                
                # Check for arms (outside main body width)
                is_arm = (abs(v_co.x) > 0.22) and (z < 0.05)
                if is_arm:
                    final_color = sb_yellow
                else:
                    # Face features in the front
                    if v_co.y > 0.15:
                        # Left eye center: (-0.1345, 0.2223, 0.2078), Right eye center: (0.1332, 0.2229, 0.2081)
                        dist_left_eye = (v_co.x - (-0.1345))**2 + (v_co.y - 0.2223)**2 + (v_co.z - 0.2078)**2
                        dist_right_eye = (v_co.x - 0.1332)**2 + (v_co.y - 0.2229)**2 + (v_co.z - 0.2081)**2
                        
                        # Left cheek center: (-0.23, 0.21, 0.09), Right cheek center: (0.23, 0.21, 0.09)
                        dist_l_cheek = (v_co.x - (-0.23))**2 + (v_co.y - 0.21)**2 + (v_co.z - 0.09)**2
                        dist_r_cheek = (v_co.x - 0.23)**2 + (v_co.y - 0.21)**2 + (v_co.z - 0.09)**2
                        
                        # Pupils & Iris: distance < 0.04
                        if dist_left_eye < 0.04**2 or dist_right_eye < 0.04**2:
                            if closest_color in [sb_blue, sb_black, sb_white]:
                                final_color = closest_color
                            else:
                                final_color = sb_white
                        # Eye whites: distance between 0.04 and 0.11
                        elif dist_left_eye < 0.11**2 or dist_right_eye < 0.11**2:
                            final_color = sb_white
                        # Cheeks blush & 3 freckles dots
                        elif dist_l_cheek < 0.045**2 or dist_r_cheek < 0.045**2:
                            import math
                            is_freckle = False
                            # Left cheek sub-freckles
                            if dist_l_cheek < 0.045**2:
                                cx, cz = -0.23, 0.09
                                freckles_l = [
                                    (cx - 0.016, cz + 0.012),
                                    (cx + 0.016, cz + 0.012),
                                    (cx, cz - 0.016)
                                ]
                                for fx, fz in freckles_l:
                                    fd = (v_co.x - fx)**2 + (v_co.z - fz)**2
                                    if fd < 0.008**2:
                                        is_freckle = True
                                        break
                            # Right cheek sub-freckles
                            if dist_r_cheek < 0.045**2:
                                cx, cz = 0.23, 0.09
                                freckles_r = [
                                    (cx - 0.016, cz + 0.012),
                                    (cx + 0.016, cz + 0.012),
                                    (cx, cz - 0.016)
                                ]
                                for fx, fz in freckles_r:
                                    fd = (v_co.x - fx)**2 + (v_co.z - fz)**2
                                    if fd < 0.008**2:
                                        is_freckle = True
                                        break
                            
                            if is_freckle:
                                final_color = sb_red
                            else:
                                final_color = sb_orange
                        else:
                            # Mouth box: Z between 0.02 and 0.12, X between -0.25 and 0.25
                            is_mouth_or_cheek = (0.02 <= z <= 0.12) and (-0.26 <= v_co.x <= 0.26)
                            if is_mouth_or_cheek:
                                # Teeth: Y > 0.19, Z in [0.03, 0.08], X in [-0.06, 0.06]
                                is_teeth = (v_co.y > 0.19) and (0.03 <= z <= 0.08) and (-0.06 <= v_co.x <= 0.06)
                                if is_teeth:
                                    final_color = sb_white
                                else:
                                    # Preserve red/tongue, black/cavity, force yellow otherwise
                                    if closest_color in [sb_red, sb_black]:
                                        final_color = closest_color
                                    else:
                                        final_color = sb_yellow
        else:
            # Patrick Star spatial overrides:
            # 1. Legs: Z < -0.32
            if z < -0.32:
                final_color = pat_pink
            # 2. Shorts (Green): Z between -0.32 and -0.08 with Lavender Purple flowers and side dots
            elif z >= -0.32 and z < -0.08:
                import math
                theta = math.atan2(v_co.x, v_co.y)
                flower_centers = [
                    (0.0, -0.22),      # Front center big flower
                    (1.1, -0.21),      # Left-front flower
                    (-1.1, -0.21),     # Right-front flower
                    (2.6, -0.22),      # Back-left flower
                    (-2.6, -0.22),     # Back-right flower
                ]
                is_flower = False
                for tc, zc in flower_centers:
                    d_theta = theta - tc
                    # wrap around
                    if d_theta > 3.14159: d_theta -= 2 * 3.14159
                    elif d_theta < -3.14159: d_theta += 2 * 3.14159
                    
                    dy = 22.0 * (z - zc)
                    dx = d_theta
                    dist = (dx**2 + dy**2)**0.5
                    
                    phi = math.atan2(dy, dx)
                    r_mod = 0.28 * (1.0 + 0.35 * math.cos(5 * phi))
                    
                    if dist < r_mod:
                        is_flower = True
                        break
                
                # Check for leg opening spots (small purple dots on sides)
                is_leg_dot = False
                if not is_flower and z < -0.26:
                    leg_dots = [
                        (0.6, -0.30),
                        (-0.6, -0.30),
                        (2.2, -0.30),
                        (-2.2, -0.30),
                    ]
                    for tc, zc in leg_dots:
                        d_theta = theta - tc
                        if d_theta > 3.14159: d_theta -= 2 * 3.14159
                        elif d_theta < -3.14159: d_theta += 2 * 3.14159
                        
                        dy = 22.0 * (z - zc)
                        dx = d_theta
                        dist = (dx**2 + dy**2)**0.5
                        if dist < 0.12:
                            is_leg_dot = True
                            break
                            
                if is_flower or is_leg_dot:
                    final_color = pat_purple
                else:
                    final_color = pat_green
            # 3. Body: Z >= -0.08
            elif z >= -0.08:
                final_color = pat_pink
                
                # Face features in the front
                if v_co.y > 0.10:
                    # Eyebrows: Y > 0.10, Z between 0.17 and 0.25, X between -0.12 and 0.12
                    is_eyebrow = (0.17 <= z <= 0.25) and (-0.12 <= v_co.x <= 0.12) and (sampled_r < 0.25 and sampled_g < 0.25 and sampled_b < 0.25)
                    
                    if is_eyebrow:
                        final_color = pat_black
                    else:
                        # Left Eye Pupil Center: (-0.0592, 0.1182, 0.1603), Right Eye Pupil Center: (0.0758, 0.1261, 0.1366)
                        dist_left_eye = (v_co.x - (-0.0592))**2 + (v_co.y - 0.1182)**2 + (v_co.z - 0.1603)**2
                        dist_right_eye = (v_co.x - 0.0758)**2 + (v_co.y - 0.1261)**2 + (v_co.z - 0.1366)**2
                        
                        # Pupils (Black): distance < 0.018
                        if dist_left_eye < 0.018**2 or dist_right_eye < 0.018**2:
                            final_color = pat_black
                        # Iris (Blue): distance between 0.018 and 0.033
                        elif dist_left_eye < 0.033**2 or dist_right_eye < 0.033**2:
                            final_color = pat_blue
                        # Eye whites: distance between 0.033 and 0.065
                        elif dist_left_eye < 0.065**2 or dist_right_eye < 0.065**2:
                            final_color = pat_white
                        else:
                            # Mouth box: Z between 0.0 and 0.12, X between -0.18 and 0.18
                            is_mouth = (0.0 <= z <= 0.12) and (-0.18 <= v_co.x <= 0.18)
                            if is_mouth:
                                # Preserve red tongue/mouth cavity
                                if closest_color in [pat_red] or (sampled_r > 0.5 and sampled_g < 0.3 and sampled_b < 0.3):
                                    final_color = pat_red
                                else:
                                    final_color = pat_pink
                                
        flat_colors[i * 4] = final_color[0]
        flat_colors[i * 4 + 1] = final_color[1]
        flat_colors[i * 4 + 2] = final_color[2]
        flat_colors[i * 4 + 3] = sampled_a
        
    print("Writing colors to per-vertex color attribute...")
    color_attr.data.foreach_set("color", flat_colors)
    
    # 5. Build Principled BSDF material using Color Attribute node
    obj.data.materials.clear()
    
    mat = bpy.data.materials.new(name="CyberMaterial")
    mat.blend_method = 'OPAQUE'
    mat.use_nodes = True
    
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    # Principled BSDF
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.location = (0, 0)
    
    # Material Output
    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_out.location = (300, 0)
    
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    
    # Set Metallic, Roughness, and Specular IOR Level values
    node_bsdf.inputs['Metallic'].default_value = 0.15
    node_bsdf.inputs['Roughness'].default_value = 0.60
    
    try:
        node_bsdf.inputs['Specular IOR Level'].default_value = 0.50
        print("Set Specular IOR Level to 0.50 successfully.")
    except KeyError:
        node_bsdf.inputs[13].default_value = 0.50
        
    # Color Attribute Node
    node_col_attr = nodes.new(type='ShaderNodeVertexColor')
    node_col_attr.location = (-300, 0)
    node_col_attr.layer_name = "Color"
    
    # Link Color output to Principled BSDF Base Color input
    links.new(node_col_attr.outputs['Color'], node_bsdf.inputs['Base Color'])
    
    obj.data.materials.append(mat)
    
    # 6. Export as self-contained optimized GLB (no animations, no skins, NO textures/images!)
    print(f"Exporting to: {glb_out}")
    bpy.ops.export_scene.gltf(
        filepath=glb_out,
        export_format='GLB',
        export_materials='EXPORT',
        export_animations=False,
        export_skins=False,
        export_cameras=False,
        export_lights=False
    )
    print("Export complete!")

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(project_root, "public")
    
    # SpongeBob paths
    spongebob_in = os.path.join(public_dir, "jrtg-round-model-1779515060361.glb")
    spongebob_tex = os.path.join(public_dir, "spongebob_pet.png")
    spongebob_out = os.path.join(public_dir, "jrtg-round-model-1779515060361.glb")
    
    # Patrick paths
    patrick_in = os.path.join(public_dir, "jrtg-round-model-1779515636455.glb")
    patrick_tex = os.path.join(public_dir, "patrick_pet.png")
    patrick_out = os.path.join(public_dir, "jrtg-round-model-1779515636455.glb")
    
    # Run for SpongeBob
    apply_vertex_colors_from_texture(spongebob_in, spongebob_tex, spongebob_out, is_spongebob=True)
    
    # Run for Patrick
    apply_vertex_colors_from_texture(patrick_in, patrick_tex, patrick_out, is_spongebob=False)
    
    print("\nAll 3D models fully repaired, POINT vertex-colored, and optimized successfully!")
