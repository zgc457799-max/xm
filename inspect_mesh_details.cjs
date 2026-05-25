const fs = require('fs');
const path = require('path');

function inspectGlbDetails(filename) {
  const filePath = path.join(__dirname, 'public', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filename}`);
    return;
  }
  const fileBuf = fs.readFileSync(filePath);
  
  // Read header
  const magic = fileBuf.toString('utf8', 0, 4);
  const version = fileBuf.readUInt32LE(4);
  
  if (magic !== 'glTF') {
    console.error('Not a valid GLB file');
    return;
  }
  
  // Read Chunk 0 header
  const chunkLength = fileBuf.readUInt32LE(12);
  
  // Read Chunk 0 (JSON)
  const jsonStr = fileBuf.toString('utf8', 20, 20 + chunkLength);
  
  try {
    const gltf = JSON.parse(jsonStr);
    console.log(`\n================= Details of ${filename} =================`);
    console.log('Accessors:', gltf.accessors ? gltf.accessors.length : 0);
    console.log('Materials:', gltf.materials ? JSON.stringify(gltf.materials, null, 2) : 'None');
    console.log('Meshes:', gltf.meshes ? JSON.stringify(gltf.meshes, null, 2) : 'None');
    
    // Check if attributes include COLOR_0
    if (gltf.meshes && gltf.meshes[0] && gltf.meshes[0].primitives && gltf.meshes[0].primitives[0]) {
      const prim = gltf.meshes[0].primitives[0];
      console.log('Primitive Attributes:', Object.keys(prim.attributes));
      if (prim.attributes.COLOR_0 !== undefined) {
        console.log('---> Found Vertex Colors (COLOR_0)!');
      }
    }
  } catch (err) {
    console.error('Error parsing JSON:', err);
  }
}

inspectGlbDetails('jrtg-round-model-1779515060361.glb');
inspectGlbDetails('jrtg-round-model-1779515636455.glb');
