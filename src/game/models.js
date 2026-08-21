import * as THREE from 'three';
import { RARITIES } from './constants.js';

// Material Cache for high performance
const materialCache = new Map();
function getMaterial(color, options = {}) {
  const key = `${color}_${options.roughness || 0.5}_${options.metalness || 0.2}_${options.emissive || ''}_${options.transparent || false}`;
  if (!materialCache.has(key)) {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: options.roughness !== undefined ? options.roughness : 0.4,
      metalness: options.metalness !== undefined ? options.metalness : 0.2,
      emissive: options.emissive ? new THREE.Color(options.emissive) : new THREE.Color(0x000000),
      emissiveIntensity: options.emissiveIntensity || 0.6,
      transparent: options.transparent || false,
      opacity: options.opacity !== undefined ? options.opacity : 1.0,
      side: options.doubleSided ? THREE.DoubleSide : THREE.FrontSide
    });
    materialCache.set(key, mat);
  }
  return materialCache.get(key);
}

// -------------------------------------------------------------
// 1. Procedural Plane 3D Mesh Generator
// -------------------------------------------------------------
export function createPlaneBadgeSprite(planeDef) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 130;
  const ctx = canvas.getContext('2d');

  // Background badge pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = planeDef.rarity.color || '#38bdf8';
  ctx.lineWidth = 8;
  
  // Rounded rect
  const r = 24, x = 12, y = 12, w = 488, h = 106;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Name
  ctx.font = 'bold 36px -apple-system, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(planeDef.name, 256, 56);

  // Income + Rarity
  ctx.font = 'bold 28px -apple-system, system-ui, sans-serif';
  ctx.fillStyle = '#34d399';
  ctx.fillText(`+$${planeDef.baseIncome.toLocaleString()}/s  •  ${planeDef.rarity.name}`, 256, 96);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(4.2, 1.05, 1.0);
  sprite.position.set(0, 2.0, 0);
  return sprite;
}

export function createPlaneMesh(planeDef, showBadge = true) {
  const group = new THREE.Group();
  group.name = `plane_${planeDef.id}`;

  const primMat = getMaterial(planeDef.primaryColor, { roughness: 0.3, metalness: 0.3 });
  const secMat = getMaterial(planeDef.secondaryColor, { roughness: 0.4, metalness: 0.2 });
  const glassMat = getMaterial('#38bdf8', { roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.75 });
  const darkMat = getMaterial('#1e293b', { roughness: 0.8, metalness: 0.1 });
  const glowColor = planeDef.rarity.glow || '#ffffff';
  const glowMat = getMaterial(glowColor, { emissive: glowColor, emissiveIntensity: 1.2 });

  const animProps = []; // References to spinning props or pulsating parts

  switch (planeDef.modelType) {
    case 'paper': {
      // Paper plane: folded triangular origami
      const geom = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        // Top nose to wing tips and center fold
        0, 0.2, 1.4,   -1.2, 0.2, -0.8,   0, -0.2, -0.6,
        0, 0.2, 1.4,    0, -0.2, -0.6,    1.2, 0.2, -0.8,
        // Bottom keel fold
        0, -0.2, -0.6,  0, 0.3, -0.8,     0, 0.2, 1.4
      ]);
      geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geom.computeVertexNormals();
      const paperMesh = new THREE.Mesh(geom, getMaterial(planeDef.primaryColor, { doubleSided: true, roughness: 0.8 }));
      paperMesh.scale.set(1.2, 1.2, 1.2);
      group.add(paperMesh);
      break;
    }

    case 'prop_single':
    case 'crop_duster': {
      // Fuselage
      const fuseGeom = new THREE.CylinderGeometry(0.35, 0.2, 2.4, 8);
      fuseGeom.rotateX(Math.PI / 2);
      const fuse = new THREE.Mesh(fuseGeom, primMat);
      group.add(fuse);

      // Cockpit Canopy
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), glassMat);
      canopy.scale.set(0.9, 0.8, 1.4);
      canopy.position.set(0, 0.22, 0.2);
      group.add(canopy);

      // Wings (High wing or Low wing)
      const wingGeom = new THREE.BoxGeometry(3.6, 0.08, 0.7);
      const wings = new THREE.Mesh(wingGeom, primMat);
      wings.position.set(0, planeDef.modelType === 'crop_duster' ? -0.1 : 0.35, 0.2);
      group.add(wings);

      // Second wing if crop duster (Biplane)
      if (planeDef.modelType === 'crop_duster') {
        const topWing = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 0.7), secMat);
        topWing.position.set(0, 0.45, 0.2);
        group.add(topWing);

        // Struts
        const strutL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), darkMat);
        strutL.position.set(-1.2, 0.18, 0.2);
        const strutR = strutL.clone();
        strutR.position.x = 1.2;
        group.add(strutL, strutR);
      }

      // Tail & Rudder
      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.5), secMat);
      tailFin.position.set(0, 0.35, -1.0);
      const horizTail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.4), secMat);
      horizTail.position.set(0, 0.1, -1.0);
      group.add(tailFin, horizTail);

      // Propeller Spinner & Blades
      const propGroup = new THREE.Group();
      propGroup.position.set(0, 0, 1.25);
      const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 8), darkMat);
      spinner.rotateX(Math.PI / 2);
      propGroup.add(spinner);

      const bladeGeom = new THREE.BoxGeometry(1.2, 0.1, 0.03);
      const blades = new THREE.Mesh(bladeGeom, darkMat);
      propGroup.add(blades);
      group.add(propGroup);
      animProps.push(propGroup);

      // Wheels / Landing gear
      const gearL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 8), darkMat);
      gearL.rotateZ(Math.PI / 2);
      gearL.position.set(-0.45, -0.35, 0.3);
      const gearR = gearL.clone();
      gearR.position.x = 0.45;
      group.add(gearL, gearR);
      break;
    }

    case 'triplane': {
      // Triplane (Red Baron)
      const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.15, 2.2, 8), primMat);
      fuse.rotateX(Math.PI / 2);
      group.add(fuse);

      // Three Wings
      [-0.1, 0.25, 0.6].forEach(y => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.6), primMat);
        wing.position.set(0, y, 0.2);
        group.add(wing);
      });

      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.45), secMat);
      tailFin.position.set(0, 0.3, -0.9);
      const horizTail = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.35), secMat);
      horizTail.position.set(0, 0.05, -0.9);
      group.add(tailFin, horizTail);

      const propGroup = new THREE.Group();
      propGroup.position.set(0, 0, 1.15);
      const blades = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.03), darkMat);
      propGroup.add(blades);
      group.add(propGroup);
      animProps.push(propGroup);
      break;
    }

    case 'warbird':
    case 'seaplane': {
      // Sleek Fighter / Seaplane
      const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.18, 3.0, 10), primMat);
      fuse.rotateX(Math.PI / 2);
      group.add(fuse);

      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), glassMat);
      canopy.scale.set(0.8, 0.8, 1.6);
      canopy.position.set(0, 0.28, 0.3);
      group.add(canopy);

      // Elliptical Wings
      const wings = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.9), primMat);
      wings.position.set(0, -0.05, 0.3);
      group.add(wings);

      if (planeDef.modelType === 'seaplane') {
        // Dual Floats
        const floatGeom = new THREE.CylinderGeometry(0.2, 0.1, 2.6, 8);
        floatGeom.rotateX(Math.PI / 2);
        const floatL = new THREE.Mesh(floatGeom, secMat);
        floatL.position.set(-0.9, -0.65, 0.1);
        const floatR = floatL.clone();
        floatR.position.x = 0.9;
        group.add(floatL, floatR);
      }

      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.6), secMat);
      tailFin.position.set(0, 0.45, -1.3);
      const horizTail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.45), secMat);
      horizTail.position.set(0, 0.1, -1.3);
      group.add(tailFin, horizTail);

      const propGroup = new THREE.Group();
      propGroup.position.set(0, 0, 1.55);
      const blades = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.04), darkMat);
      const blades2 = blades.clone();
      blades2.rotateZ(Math.PI / 2);
      propGroup.add(blades, blades2);
      group.add(propGroup);
      animProps.push(propGroup);
      break;
    }

    case 'airliner':
    case 'heavy_airliner':
    case 'beluga': {
      // Commercial Airliner / Beluga Mega Freight
      const isBeluga = planeDef.modelType === 'beluga';
      const fuseRadius = isBeluga ? 0.85 : 0.65;
      const fuse = new THREE.Mesh(new THREE.CylinderGeometry(fuseRadius, 0.35, 4.8, 12), primMat);
      fuse.rotateX(Math.PI / 2);
      group.add(fuse);

      if (isBeluga) {
        // Bulbous hump
        const hump = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), primMat);
        hump.scale.set(1.0, 1.2, 1.6);
        hump.position.set(0, 0.4, 0.8);
        group.add(hump);
      }

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.6), glassMat);
      canopy.position.set(0, isBeluga ? 0.4 : 0.35, 2.0);
      group.add(canopy);

      // Swept Wings
      const wingGeom = new THREE.BoxGeometry(6.2, 0.14, 1.1);
      const wings = new THREE.Mesh(wingGeom, primMat);
      wings.position.set(0, -0.2, 0.2);
      wings.rotation.x = -0.05;
      group.add(wings);

      // Jet Engines under wings
      const engineCount = planeDef.modelType === 'heavy_airliner' ? 4 : 2;
      const offsets = engineCount === 4 ? [-2.2, -1.2, 1.2, 2.2] : [-1.5, 1.5];
      offsets.forEach(x => {
        const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.8, 8), secMat);
        eng.rotateX(Math.PI / 2);
        eng.position.set(x, -0.45, 0.2);
        // Engine glow inside
        const engGlow = new THREE.Mesh(new THREE.CircleGeometry(0.18, 8), glowMat);
        engGlow.position.set(0, -0.41, 0);
        engGlow.rotateX(Math.PI / 2);
        eng.add(engGlow);
        group.add(eng);
      });

      // Tail
      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.9), secMat);
      tailFin.position.set(0, 0.85, -2.0);
      const horizTail = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.6), secMat);
      horizTail.position.set(0, 0.3, -2.1);
      group.add(tailFin, horizTail);
      break;
    }

    case 'supersonic':
    case 'supersonic_gold': {
      // Concorde Delta Wing Supersonic
      const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.15, 5.4, 12), primMat);
      fuse.rotateX(Math.PI / 2);
      group.add(fuse);

      // Droop Nose
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.4, 12), primMat);
      nose.rotateX(-Math.PI / 2 - 0.15);
      nose.position.set(0, -0.1, 3.2);
      group.add(nose);

      // Huge Delta Wing
      const deltaGeom = new THREE.BufferGeometry();
      const deltaVerts = new Float32Array([
        0, 0, 1.8,    -2.8, 0, -2.0,   0, 0, -2.0,
        0, 0, 1.8,     0, 0, -2.0,     2.8, 0, -2.0
      ]);
      deltaGeom.setAttribute('position', new THREE.BufferAttribute(deltaVerts, 3));
      deltaGeom.computeVertexNormals();
      const deltaWings = new THREE.Mesh(deltaGeom, getMaterial(planeDef.primaryColor, { doubleSided: true, metalness: 0.6 }));
      group.add(deltaWings);

      // High Vertical Tail
      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 1.2), secMat);
      tailFin.position.set(0, 0.8, -2.0);
      group.add(tailFin);

      // 4 Rear Jet Thrusters with glowing afterburners
      [-0.7, -0.3, 0.3, 0.7].forEach(x => {
        const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8), darkMat);
        thruster.rotateX(Math.PI / 2);
        thruster.position.set(x, -0.2, -2.2);

        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 8), glowMat);
        flame.rotateX(-Math.PI / 2);
        flame.position.set(0, -0.5, 0);
        thruster.add(flame);
        group.add(thruster);
      });
      break;
    }

    case 'stealth_fighter':
    case 'warthog': {
      // F-22 Raptor / A-10 Thunderbolt
      const isA10 = planeDef.modelType === 'warthog';
      const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.25, 4.0, 8), primMat);
      fuse.rotateX(Math.PI / 2);
      fuse.scale.set(1.2, 0.7, 1.0);
      group.add(fuse);

      // Stealth Cockpit
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), glassMat);
      canopy.scale.set(0.7, 0.6, 1.6);
      canopy.position.set(0, 0.25, 0.8);
      group.add(canopy);

      // Angular Swept Wings
      const wings = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.1, 1.4), primMat);
      wings.position.set(0, 0.0, 0.0);
      group.add(wings);

      if (isA10) {
        // High rear dual nacelle engines
        [-0.8, 0.8].forEach(x => {
          const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.3, 1.2, 8), secMat);
          eng.rotateX(Math.PI / 2);
          eng.position.set(x, 0.5, -1.0);
          group.add(eng);
        });
      } else {
        // Twin Canted Vertical Fins
        const finL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.8), secMat);
        finL.position.set(-0.7, 0.45, -1.4);
        finL.rotateZ(-0.25);
        const finR = finL.clone();
        finR.position.x = 0.7;
        finR.rotateZ(0.5);
        group.add(finL, finR);

        // Twin Afterburners
        [-0.35, 0.35].forEach(x => {
          const ab = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 8), darkMat);
          ab.rotateX(Math.PI / 2);
          ab.position.set(x, 0.0, -1.9);
          const jetFlame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.7, 8), glowMat);
          jetFlame.rotateX(-Math.PI / 2);
          jetFlame.position.set(0, -0.55, 0);
          ab.add(jetFlame);
          group.add(ab);
        });
      }
      break;
    }

    case 'flying_wing':
    case 'blackbird':
    case 'darkstar': {
      // B-2 Spirit / SR-71 / Darkstar Mach 10
      if (planeDef.modelType === 'flying_wing') {
        // Stealth Chevron Flying Wing
        const geom = new THREE.BufferGeometry();
        const verts = new Float32Array([
          0, 0.1, 1.6,   -3.6, -0.05, -1.6,   -1.4, -0.05, -1.1,
          0, 0.1, 1.6,   -1.4, -0.05, -1.1,    0, 0.05, -1.5,
          0, 0.1, 1.6,    0, 0.05, -1.5,       1.4, -0.05, -1.1,
          0, 0.1, 1.6,    1.4, -0.05, -1.1,    3.6, -0.05, -1.6
        ]);
        geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        geom.computeVertexNormals();
        const mesh = new THREE.Mesh(geom, getMaterial(planeDef.primaryColor, { doubleSided: true, metalness: 0.8, roughness: 0.2 }));
        group.add(mesh);

        // Stealth Cockpit Blip
        const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), glassMat);
        cockpit.scale.set(0.8, 0.5, 1.2);
        cockpit.position.set(0, 0.16, 0.6);
        group.add(cockpit);
      } else {
        // SR-71 / Darkstar Needle Jet
        const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.15, 5.2, 10), primMat);
        fuse.rotateX(Math.PI / 2);
        fuse.scale.set(1.4, 0.6, 1.0);
        group.add(fuse);

        // Huge Engine Nacelles mounted on mid wings
        [-1.3, 1.3].forEach(x => {
          const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 3.6, 10), primMat);
          nacelle.rotateX(Math.PI / 2);
          nacelle.position.set(x, 0, -0.2);

          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 8), darkMat);
          spike.rotateX(Math.PI / 2);
          spike.position.set(0, 1.8, 0);
          nacelle.add(spike);

          // Canted vertical stabilizers on top of engines
          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.8), secMat);
          fin.position.set(0, 0.45, -0.6);
          nacelle.add(fin);

          // Glowing Afterburner Plasma
          const flame = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.2, 8), glowMat);
          flame.rotateX(-Math.PI / 2);
          flame.position.set(0, -2.1, 0);
          nacelle.add(flame);

          group.add(nacelle);
        });

        // Blended Delta Wings
        const wing = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 2.2), primMat);
        wing.position.set(0, 0, -0.4);
        group.add(wing);
      }
      break;
    }

    case 'rocket_plane':
    case 'shuttle':
    case 'mriya': {
      // X-15 / Space Shuttle / An-225
      const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.35, 4.6, 12), primMat);
      fuse.rotateX(Math.PI / 2);
      group.add(fuse);

      // Cockpit / Nose cone
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.5, 12), secMat);
      nose.rotateX(Math.PI / 2);
      nose.position.set(0, 0, 2.7);
      group.add(nose);

      // Wings
      const wings = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.12, 1.8), primMat);
      wings.position.set(0, -0.1, -0.2);
      group.add(wings);

      // Huge tail
      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 1.2), secMat);
      tailFin.position.set(0, 0.9, -1.8);
      group.add(tailFin);

      // Rocket Engines with massive fire glow
      [-0.4, 0, 0.4].forEach(x => {
        const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.7, 8), darkMat);
        eng.rotateX(Math.PI / 2);
        eng.position.set(x, -0.1, -2.4);

        const rocketFlame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.4, 8), glowMat);
        rocketFlame.rotateX(-Math.PI / 2);
        rocketFlame.position.set(0, -0.9, 0);
        eng.add(rocketFlame);
        group.add(eng);
      });
      break;
    }

    case 'ufo': {
      // Extraterrestrial Plasma Saucer
      const discGeom = new THREE.CylinderGeometry(2.0, 2.0, 0.3, 16);
      const disc = new THREE.Mesh(discGeom, primMat);
      group.add(disc);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 12), glassMat);
      dome.position.set(0, 0.3, 0);
      group.add(dome);

      // Glowing pulsating ring
      const ringGeom = new THREE.TorusGeometry(2.1, 0.12, 8, 24);
      ringGeom.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeom, glowMat);
      group.add(ring);
      animProps.push(ring);
      break;
    }

    case 'starfighter':
    case 'dreadnought': {
      // Cosmic Quantum Starfighter / Galactic Carrier
      const core = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 4.4), primMat);
      group.add(core);

      // Forward X-Wings
      const wing1 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 1.4), secMat);
      wing1.rotateZ(0.25);
      const wing2 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 1.4), secMat);
      wing2.rotateZ(-0.25);
      group.add(wing1, wing2);

      // Quantum Core Ring
      const qRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.15, 8, 16), glowMat);
      qRing.position.set(0, 0, -1.0);
      group.add(qRing);
      animProps.push(qRing);

      // Quad Plasma Thrusters
      [[-1.2, 0.5], [1.2, 0.5], [-1.2, -0.5], [1.2, -0.5]].forEach(([x, y]) => {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.2, 8), darkMat);
        pod.rotateX(Math.PI / 2);
        pod.position.set(x, y, -1.8);
        const trail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.5, 8), glowMat);
        trail.rotateX(-Math.PI / 2);
        trail.position.set(0, -1.0, 0);
        pod.add(trail);
        group.add(pod);
      });
      break;
    }

    default: {
      const basicMesh = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.5, 8), primMat);
      basicMesh.rotateX(Math.PI / 2);
      group.add(basicMesh);
    }
  }

  // Rarity Beacon Aura (Glow light underneath / around)
  const auraGeom = new THREE.RingGeometry(0.8, 1.8, 16);
  auraGeom.rotateX(-Math.PI / 2);
  const auraMesh = new THREE.Mesh(auraGeom, getMaterial(glowColor, {
    emissive: glowColor,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.55,
    doubleSided: true
  }));
  auraMesh.position.set(0, -0.5, 0);
  group.add(auraMesh);

  // Floating Info Badge
  if (showBadge) {
    const badgeSprite = createPlaneBadgeSprite(planeDef);
    group.add(badgeSprite);
    group.userData.badgeSprite = badgeSprite;
  }

  group.userData = {
    animProps,
    planeDef,
    baseY: 0,
    hoverOffset: Math.random() * Math.PI * 2
  };

  return group;
}

// -------------------------------------------------------------
// 2. Roblox Pilot Character Avatar Generator (With Skins & Crown)
// -------------------------------------------------------------
export function createPilotCharacter(rebirthRank = 0, avatarId = 'default') {
  const root = new THREE.Group();
  root.name = 'player';

  const avatarDef = AVATARS_DATABASE.find(a => a.id === avatarId) || AVATARS_DATABASE[0];

  // Skin, Suit, Helmet materials
  const skinMat = getMaterial('#fcd34d', { roughness: 0.6 }); // Roblox yellow
  const suitMat = getMaterial(avatarDef.suitColor || '#1e293b', { roughness: 0.4, metalness: avatarDef.metalness || 0.1 });
  const trimMat = getMaterial(avatarDef.trimColor || '#38bdf8', {
    roughness: 0.3,
    emissive: avatarDef.trimColor || '#0284c7',
    emissiveIntensity: avatarDef.emissiveIntensity || 0.5
  });
  const helmetMat = getMaterial(avatarDef.helmetColor || '#f97316', { roughness: 0.3, metalness: avatarDef.metalness || 0.2 });
  const visorMat = getMaterial(avatarDef.visorColor || '#0284c7', { roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 });
  const goldMat = getMaterial('#fbbf24', { metalness: 0.9, roughness: 0.2, emissive: '#f59e0b', emissiveIntensity: 1.2 });

  // Body Parts Group
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), suitMat);
  torso.position.y = 1.35;
  root.add(torso);

  // Chest harness badge
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), trimMat);
  badge.position.set(0, 0.1, 0.26);
  torso.add(badge);

  // Head & Helmet (Tagged so FPP can hide them to prevent clipping)
  const headGroup = new THREE.Group();
  headGroup.name = 'headGroup';
  headGroup.position.set(0, 0.85, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), skinMat);
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.72), helmetMat);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.1), visorMat);
  visor.position.set(0, 0.05, 0.35);
  headGroup.add(head, helmet, visor);

  // Floating Golden 3D Admin Crown
  const crownGroup = new THREE.Group();
  crownGroup.name = 'adminCrown';
  crownGroup.position.set(0, 0.65, 0);

  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.35, 0.18, 12, 1, true), goldMat);
  crownGroup.add(crownBase);

  // 5 Crown Points / Jewels
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const px = Math.cos(angle) * 0.36;
    const pz = Math.sin(angle) * 0.36;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.25, 6), goldMat);
    spike.position.set(px, 0.18, pz);
    crownGroup.add(spike);

    // Ruby / Emerald jewel on crown spike
    const gem = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 6, 6),
      getMaterial(i % 2 === 0 ? '#ef4444' : '#10b981', { emissive: i % 2 === 0 ? '#dc2626' : '#059669', emissiveIntensity: 2.0 })
    );
    gem.position.set(px, 0.3, pz);
    crownGroup.add(gem);
  }

  // Admin glowing halo ring above crown
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.04, 8, 24), getMaterial('#fbbf24', { emissive: '#fbbf24', emissiveIntensity: 2.0 }));
  halo.rotateX(Math.PI / 2);
  halo.position.set(0, 0.42, 0);
  crownGroup.add(halo);

  headGroup.add(crownGroup);
  torso.add(headGroup);

  // Jetpack / Tow Hitch on Back
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.3), getMaterial('#334155', { roughness: 0.5 }));
  backpack.position.set(0, 0.05, -0.38);
  const towHitch = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), getMaterial('#facc15', { emissive: '#facc15', emissiveIntensity: 0.8 }));
  towHitch.position.set(0, -0.2, -0.2);
  backpack.add(towHitch);
  torso.add(backpack);

  // Rebirth Wings (if player has rebirthed)
  const wingsGroup = new THREE.Group();
  wingsGroup.name = 'rebirthWings';
  wingsGroup.position.set(0, 0.2, -0.45);
  torso.add(wingsGroup);

  // Limbs with Pivot Points
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.65, 0.4, 0);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.35), suitMat);
  leftArm.position.set(0, -0.45, 0);
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.32), skinMat);
  leftHand.position.set(0, -0.5, 0);
  leftArm.add(leftHand);
  leftArmPivot.add(leftArm);
  torso.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.65, 0.4, 0);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.35), suitMat);
  rightArm.position.set(0, -0.45, 0);
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.32), skinMat);
  rightHand.position.set(0, -0.5, 0);
  rightArm.add(rightHand);
  rightArmPivot.add(rightArm);
  torso.add(rightArmPivot);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.25, -0.55, 0);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.9, 0.4), suitMat);
  leftLeg.position.set(0, -0.45, 0);
  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.48), getMaterial('#0f172a'));
  leftBoot.position.set(0, -0.35, 0.04);
  leftLeg.add(leftBoot);
  leftLegPivot.add(leftLeg);
  torso.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.25, -0.55, 0);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.9, 0.4), suitMat);
  rightLeg.position.set(0, -0.45, 0);
  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.48), getMaterial('#0f172a'));
  rightBoot.position.set(0, -0.35, 0.04);
  rightLeg.add(rightBoot);
  rightLegPivot.add(rightLeg);
  torso.add(rightLegPivot);

  root.userData = {
    torso,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    wingsGroup,
    animTime: 0
  };

  return root;
}

// -------------------------------------------------------------
// 2.5 Procedural Pet 3D Companion Generator
// -------------------------------------------------------------
export function createPetMesh(petDef) {
  const group = new THREE.Group();
  group.name = `pet_${petDef.id}`;

  const petMat = getMaterial(petDef.color, { roughness: 0.3, metalness: 0.4 });
  const glowMat = getMaterial(petDef.glowColor, { emissive: petDef.glowColor, emissiveIntensity: 1.8 });

  const animParts = [];

  switch (petDef.id) {
    case 'copilot_drone': {
      // Quadcopter body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.6), petMat);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), glowMat);
      eye.position.set(0, 0.08, 0.25);
      group.add(body, eye);

      // 4 rotors
      [[-0.35, 0.35], [0.35, 0.35], [-0.35, -0.35], [0.35, -0.35]].forEach(([rx, rz]) => {
        const rotorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4), getMaterial('#334155'));
        rotorArm.rotateZ(Math.PI / 2);
        rotorArm.position.set(rx * 0.6, 0, rz * 0.6);
        const prop = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.05), glowMat);
        prop.position.set(rx, 0.1, rz);
        group.add(rotorArm, prop);
        animParts.push(prop);
      });
      break;
    }

    case 'falcon_drone': {
      // Robotic bird
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 8), petMat);
      body.rotateX(Math.PI / 2);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), glowMat);
      head.position.set(0, 0.15, 0.4);
      group.add(body, head);

      // Dual wings
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.3), petMat);
      wingL.position.set(-0.45, 0.1, 0);
      const wingR = wingL.clone();
      wingR.position.x = 0.45;
      group.add(wingL, wingR);
      animParts.push(wingL, wingR);
      break;
    }

    case 'phoenix_bird': {
      // Cosmic Phoenix
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), glowMat);
      const aura = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 8, 16), getMaterial('#f97316', { emissive: '#ea580c', emissiveIntensity: 2.0 }));
      aura.rotateX(Math.PI / 2);
      group.add(core, aura);
      animParts.push(aura);
      break;
    }

    case 'ufo_drone': {
      // Tachyon Saucer
      const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), petMat);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), glowMat);
      dome.position.y = 0.1;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.05, 8, 20), glowMat);
      ring.rotateX(Math.PI / 2);
      group.add(saucer, dome, ring);
      animParts.push(ring);
      break;
    }

    case 'star_sprite':
    default: {
      // Stellar Sprite
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), glowMat);
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 8, 16), getMaterial('#38bdf8', { emissive: '#0284c7', emissiveIntensity: 2.0 }));
      ring1.rotateX(Math.PI / 3);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 8, 16), getMaterial('#ec4899', { emissive: '#db2777', emissiveIntensity: 2.0 }));
      ring2.rotateY(Math.PI / 3);
      group.add(star, ring1, ring2);
      animParts.push(star, ring1, ring2);
      break;
    }
  }

  group.scale.set(0.85, 0.85, 0.85);
  group.userData = { animParts, petDef };
  return group;
}

// -------------------------------------------------------------
// 3. Tsunami Dynamic 3D Wave Mesh Generator
// -------------------------------------------------------------
export function createTsunamiMesh(tsunamiDef) {
  const group = new THREE.Group();
  group.name = 'tsunami_wave';

  const waveColor = tsunamiDef.color || '#0284c7';
  const width = 80;
  const height = tsunamiDef.height || 14;
  const depth = 28;

  // Curved Wave Geometry with curl forward
  const waveGeom = new THREE.CylinderGeometry(height * 0.9, height * 1.1, width, 32, 16, true, 0, Math.PI * 0.75);
  waveGeom.rotateZ(Math.PI / 2);
  waveGeom.rotateY(Math.PI);

  const waveMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(waveColor),
    emissive: new THREE.Color(waveColor),
    emissiveIntensity: 0.5,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide
  });

  const waveMesh = new THREE.Mesh(waveGeom, waveMat);
  waveMesh.position.set(0, height * 0.5, 0);
  group.add(waveMesh);

  // White Foam Crest on top
  const foamGeom = new THREE.TorusGeometry(height * 0.92, 1.2, 8, 32, Math.PI * 0.75);
  foamGeom.rotateZ(Math.PI / 2);
  foamGeom.rotateY(Math.PI);
  const foamMat = getMaterial('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.9, roughness: 0.9 });
  const foamMesh = new THREE.Mesh(foamGeom, foamMat);
  foamMesh.position.set(0, height * 0.5, 0);
  group.add(foamMesh);

  // Base Water Surge Surge Block
  const baseGeom = new THREE.BoxGeometry(width, height * 0.6, depth);
  const baseMesh = new THREE.Mesh(baseGeom, waveMat);
  baseMesh.position.set(0, height * 0.3, depth * 0.4);
  group.add(baseMesh);

  // Water Spray Particles
  const particleCount = 120;
  const partGeom = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * width;
    positions[i * 3 + 1] = height * 0.7 + Math.random() * (height * 0.4);
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 4;
  }
  partGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const partMat = new THREE.PointsMaterial({
    color: new THREE.Color('#ffffff'),
    size: 0.8,
    transparent: true,
    opacity: 0.75
  });
  const sprayPoints = new THREE.Points(partGeom, partMat);
  group.add(sprayPoints);

  group.userData = {
    tsunamiDef,
    waveMesh,
    sprayPoints,
    width,
    height,
    depth
  };

  return group;
}

// -------------------------------------------------------------
// 4. Safe Trench / Underground Bunker Mesh Generator
// -------------------------------------------------------------
export function createTrenchMesh(zPos, width = 34, trenchDepth = 6.5, length = 16) {
  const group = new THREE.Group();
  group.name = `trench_${zPos}`;
  group.position.set(0, 0, zPos);

  const concreteMat = getMaterial('#334155', { roughness: 0.9 });
  const safeBorderMat = getMaterial('#22c55e', { emissive: '#22c55e', emissiveIntensity: 1.2 });
  const metalMat = getMaterial('#64748b', { metalness: 0.8, roughness: 0.3 });

  // Trench Floor (Safe zone down below)
  const floorGeom = new THREE.BoxGeometry(width, 0.4, length);
  const floor = new THREE.Mesh(floorGeom, getMaterial('#1e293b', { roughness: 0.8 }));
  floor.position.set(0, -trenchDepth, 0);
  group.add(floor);

  // Left & Right Concrete Walls
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(1.0, trenchDepth, length), concreteMat);
  wallL.position.set(-width / 2, -trenchDepth / 2, 0);
  const wallR = new THREE.Mesh(new THREE.BoxGeometry(1.0, trenchDepth, length), concreteMat);
  wallR.position.set(width / 2, -trenchDepth / 2, 0);
  group.add(wallL, wallR);

  // Entry Ramp (South side)
  const rampLength = 8;
  const rampGeom = new THREE.BoxGeometry(width - 2, 0.3, rampLength);
  const entryRamp = new THREE.Mesh(rampGeom, concreteMat);
  entryRamp.position.set(0, -trenchDepth / 2, length / 2 + rampLength / 2 - 1);
  entryRamp.rotation.x = Math.atan2(trenchDepth, rampLength);
  group.add(entryRamp);

  // Exit Ramp (North side)
  const exitRamp = new THREE.Mesh(rampGeom, concreteMat);
  exitRamp.position.set(0, -trenchDepth / 2, -length / 2 - rampLength / 2 + 1);
  exitRamp.rotation.x = -Math.atan2(trenchDepth, rampLength);
  group.add(exitRamp);

  // Glowing Safe Zone Boundary Strip
  const stripGeom = new THREE.BoxGeometry(width, 0.15, 0.5);
  const stripFront = new THREE.Mesh(stripGeom, safeBorderMat);
  stripFront.position.set(0, 0.05, length / 2 + rampLength - 1);
  const stripBack = new THREE.Mesh(stripGeom, safeBorderMat);
  stripBack.position.set(0, 0.05, -length / 2 - rampLength + 1);
  group.add(stripFront, stripBack);

  // Overhead Steel Beams / Safe Shelter Roof Grate
  for (let b = -length / 2 + 2; b < length / 2; b += 4) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, 0.4), metalMat);
    beam.position.set(0, 0.2, b);
    group.add(beam);
  }

  // Glowing "SAFE BUNKER" Hologram Signs on both sides
  [-width / 2 + 2, width / 2 - 2].forEach(x => {
    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.5), metalMat);
    signPole.position.set(x, 1.75, 0);
    const signBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.2), safeBorderMat);
    signBox.position.set(x, 3.2, 0);
    group.add(signPole, signBox);
  });

  group.userData = {
    zPos,
    minZ: zPos - (length / 2 + rampLength),
    maxZ: zPos + (length / 2 + rampLength),
    trenchDepth,
    safeY: -2.0 // If player Y is below this, they are safe from the tsunami
  };

  return group;
}

// -------------------------------------------------------------
// 5. Massive Airport Megabase & Hangar Complex Generator
// -------------------------------------------------------------
export function createAirportBase(maxSlots = 36) {
  const baseGroup = new THREE.Group();
  baseGroup.name = 'airport_base';

  const tarmacMat = getMaterial('#1e293b', { roughness: 0.95 });
  const concreteMat = getMaterial('#334155', { roughness: 0.8 });
  const darkMetalMat = getMaterial('#0f172a', { metalness: 0.8, roughness: 0.2 });
  const yellowLineMat = getMaterial('#facc15', { emissive: '#ca8a04', emissiveIntensity: 0.6 });
  const laserMat = getMaterial('#22c55e', { emissive: '#22c55e', emissiveIntensity: 1.6, transparent: true, opacity: 0.65 });
  const glassMat = getMaterial('#38bdf8', { roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.75 });

  // 1. Massive Base Ground Platform (Z: -125 to +18, Width: 90)
  const baseFloor = new THREE.Mesh(new THREE.BoxGeometry(90, 1.2, 145), tarmacMat);
  baseFloor.position.set(0, -0.6, -53);
  baseGroup.add(baseFloor);

  // Concrete Runway Apron Borders
  const borderL = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 145), concreteMat);
  borderL.position.set(-45, 0.1, -53);
  const borderR = borderL.clone();
  borderR.position.x = 45;
  baseGroup.add(borderL, borderR);

  // 2. Big Laser Shield Forcefield (Stops waves at Z = 16)
  const shieldGeom = new THREE.BoxGeometry(86, 26, 0.6);
  const shield = new THREE.Mesh(shieldGeom, laserMat);
  shield.position.set(0, 13, 16);
  baseGroup.add(shield);

  // Forcefield generator pylons with glowing power coils
  [-43, 43].forEach(x => {
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 28, 12), darkMetalMat);
    pylon.position.set(x, 14, 16);
    const pylonTop = new THREE.Mesh(new THREE.SphereGeometry(2.0, 12, 12), getMaterial('#22c55e', { emissive: '#22c55e', emissiveIntensity: 2.5 }));
    pylonTop.position.set(x, 28, 16);
    // Energy Rings
    for (let r = 6; r < 26; r += 6) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.15, 8, 16), getMaterial('#34d399', { emissive: '#34d399', emissiveIntensity: 2.0 }));
      ring.rotateX(Math.PI / 2);
      ring.position.set(x, r, 16);
      baseGroup.add(ring);
    }
    baseGroup.add(pylon, pylonTop);
  });

  // 3. Drop Zone Platform (Z = 0)
  const dropZoneGeom = new THREE.CylinderGeometry(6.5, 6.5, 0.25, 32);
  const dropZoneMat = getMaterial('#10b981', { emissive: '#059669', emissiveIntensity: 1.2, transparent: true, opacity: 0.85 });
  const dropZone = new THREE.Mesh(dropZoneGeom, dropZoneMat);
  dropZone.position.set(0, 0.12, 0);
  baseGroup.add(dropZone);

  // Swirling Beacon Rings
  const beaconRing = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.18, 8, 32), getMaterial('#34d399', { emissive: '#34d399', emissiveIntensity: 2.2 }));
  beaconRing.rotateX(Math.PI / 2);
  beaconRing.position.set(0, 0.18, 0);
  baseGroup.add(beaconRing);

  // 3.5 🏦 MONEY COLLECTION VAULT DOCK (Z = -18, Center)
  // Tycoon cash collector: Planes accumulate income here until the player steps on this dock!
  const vaultDockGroup = new THREE.Group();
  vaultDockGroup.position.set(0, 0, -18);

  const vaultPadMat = getMaterial('#fbbf24', { roughness: 0.2, metalness: 0.8, emissive: '#f59e0b', emissiveIntensity: 1.2 });
  const vaultPad = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.25, 6.5), vaultPadMat);
  vaultPad.position.y = 0.12;

  // Flashing LED border
  const vaultBorder = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.15, 6.9), getMaterial('#fef08a', { emissive: '#fef08a', emissiveIntensity: 2.0 }));
  vaultBorder.position.y = 0.08;

  // 3D Revolving Holographic Dollar / Coin
  const coinMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 0.25, 16),
    getMaterial('#fbbf24', { emissive: '#fbbf24', emissiveIntensity: 1.8, metalness: 0.9 })
  );
  coinMesh.rotateX(Math.PI / 2);
  coinMesh.position.set(0, 2.4, 0);
  vaultDockGroup.add(vaultPad, vaultBorder, coinMesh);

  // Floating Cash Vault Canvas Sprite Label
  const vaultCanvas = document.createElement('canvas');
  vaultCanvas.width = 512;
  vaultCanvas.height = 140;
  const vCtx = vaultCanvas.getContext('2d');
  vCtx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  vCtx.strokeStyle = '#fbbf24';
  vCtx.lineWidth = 8;
  vCtx.beginPath();
  vCtx.roundRect(10, 10, 492, 120, 20);
  vCtx.fill();
  vCtx.stroke();
  vCtx.font = 'bold 36px sans-serif';
  vCtx.fillStyle = '#fbbf24';
  vCtx.textAlign = 'center';
  vCtx.fillText('🏦 CASH VAULT: $0', 256, 58);
  vCtx.font = 'bold 26px sans-serif';
  vCtx.fillStyle = '#34d399';
  vCtx.fillText('[ STEP HERE TO COLLECT ]', 256, 102);

  const vaultTexture = new THREE.CanvasTexture(vaultCanvas);
  vaultTexture.minFilter = THREE.LinearFilter;
  const vaultSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: vaultTexture, transparent: true }));
  vaultSprite.scale.set(7.5, 2.0, 1.0);
  vaultSprite.position.set(0, 4.2, 0);
  vaultDockGroup.add(vaultSprite);

  baseGroup.add(vaultDockGroup);
  baseGroup.userData.vaultCoinMesh = coinMesh;
  baseGroup.userData.vaultCanvas = vaultCanvas;
  baseGroup.userData.vaultCtx = vCtx;
  baseGroup.userData.vaultTexture = vaultTexture;

  // 4. Main Control Tower & Terminal (X = -36, Z = -75)
  const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.8, 24, 12), concreteMat);
  towerBase.position.set(-36, 12, -75);
  const towerCab = new THREE.Mesh(new THREE.CylinderGeometry(6.0, 4.2, 5.5, 12), glassMat);
  towerCab.position.set(-36, 26.5, -75);
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(6.5, 3.0, 12), darkMetalMat);
  towerRoof.position.set(-36, 30.5, -75);

  // Radar Dish Array
  const radarGroup = new THREE.Group();
  radarGroup.position.set(-36, 33, -75);
  const radarDish = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 0.3, 0.6, 12), getMaterial('#f97316', { emissive: '#ea580c', emissiveIntensity: 1.2 }));
  radarDish.rotateX(0.5);
  radarGroup.add(radarDish);
  baseGroup.add(towerBase, towerCab, towerRoof, radarGroup);
  baseGroup.userData.radarGroup = radarGroup;

  // Terminal Building
  const terminal = new THREE.Mesh(new THREE.BoxGeometry(22, 9, 28), concreteMat);
  terminal.position.set(-34, 4.5, -50);
  const terminalGlass = new THREE.Mesh(new THREE.BoxGeometry(22.2, 4.5, 20), glassMat);
  terminalGlass.position.set(-34, 5.5, -50);
  baseGroup.add(terminal, terminalGlass);

  // 5. Hangar Complexes (Civilian, Commercial, Military Stealth, Spaceport)
  // Hangar Alpha (Civilian Prop)
  const hAlpha = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 24, 12, 1, false, 0, Math.PI), getMaterial('#dc2626'));
  hAlpha.rotateZ(Math.PI / 2);
  hAlpha.position.set(-34, 4, -20);
  baseGroup.add(hAlpha);

  // Hangar Bravo (Military Stealth Bay)
  const hBravo = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 26), darkMetalMat);
  hBravo.position.set(34, 5, -20);
  const hBravoDoor = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 0.5), getMaterial('#475569', { metalness: 0.9 }));
  hBravoDoor.position.set(34, 4, -7);
  baseGroup.add(hBravo, hBravoDoor);

  // Orbital Spaceport Rocket Gantry (X = 34, Z = -75)
  const gantryPillar1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 32, 1.5), getMaterial('#f97316', { metalness: 0.8 }));
  gantryPillar1.position.set(32, 16, -72);
  const gantryPillar2 = gantryPillar1.clone();
  gantryPillar2.position.set(38, 16, -72);
  const gantryBridge = new THREE.Mesh(new THREE.BoxGeometry(10, 1.5, 4), darkMetalMat);
  gantryBridge.position.set(35, 25, -72);
  baseGroup.add(gantryPillar1, gantryPillar2, gantryBridge);

  // Jet Fuel Tank Farm (X = 34, Z = -45)
  [-3, 3].forEach(offZ => {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 8, 16), getMaterial('#94a3b8', { metalness: 0.9, roughness: 0.2 }));
    tank.position.set(34, 4, -45 + offZ);
    baseGroup.add(tank);
  });

  // 6. Interactive Base Shop Buildings:
  // A. ✈️ AIRPLANES DEALERSHIP SHOWROOM (X = -16, Z = -35)
  const planeShop = new THREE.Mesh(new THREE.BoxGeometry(7.5, 5, 6.5), getMaterial('#0284c7'));
  planeShop.position.set(-16, 2.5, -35);
  const planeShopGlass = new THREE.Mesh(new THREE.BoxGeometry(7.6, 3, 5), glassMat);
  planeShopGlass.position.set(-16, 2.5, -35);
  const planeShopSign = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.4, 0.4), getMaterial('#38bdf8', { emissive: '#0284c7', emissiveIntensity: 1.5 }));
  planeShopSign.position.set(-16, 5.8, -31.6);
  baseGroup.add(planeShop, planeShopGlass, planeShopSign);

  // B. ⚡ SPEED & NITRO WORKSHOP (X = 16, Z = -35)
  const speedShop = new THREE.Mesh(new THREE.BoxGeometry(7.5, 5, 6.5), getMaterial('#d97706'));
  speedShop.position.set(16, 2.5, -35);
  const speedShopSign = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.4, 0.4), getMaterial('#facc15', { emissive: '#eab308', emissiveIntensity: 1.8 }));
  speedShopSign.position.set(16, 5.8, -31.6);
  baseGroup.add(speedShop, speedShopSign);

  // C. 🛒 PILOT UPGRADES KIOSK (X = 16, Z = -15)
  const upgShop = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 4.5), getMaterial('#4338ca'));
  upgShop.position.set(16, 2, -15);
  const upgSign = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 0.4), getMaterial('#818cf8', { emissive: '#6366f1', emissiveIntensity: 1.5 }));
  upgSign.position.set(16, 4.5, -12.6);
  baseGroup.add(upgShop, upgSign);

  // 7. Grand Celestial Rebirth Altar (Z = -105, Center)
  const altarBase = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 9.0, 1.8, 24), getMaterial('#4c1d95', { metalness: 0.9 }));
  altarBase.position.set(0, 0.9, -105);
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const px = Math.cos(angle) * 6.5;
    const pz = -105 + Math.sin(angle) * 6.5;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7.5, 1.2), getMaterial('#7c3aed', { emissive: '#6d28d9', emissiveIntensity: 1.0 }));
    pillar.position.set(px, 3.75, pz);
    baseGroup.add(pillar);
  }
  // Towering 60m Celestial Energy Beam
  const altarBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(3.0, 3.0, 60, 24, 1, true),
    getMaterial('#c084fc', { emissive: '#c084fc', emissiveIntensity: 2.2, transparent: true, opacity: 0.45, doubleSided: true })
  );
  altarBeam.position.set(0, 30, -105);
  baseGroup.add(altarBase, altarBeam);

  // 8. 36 Plane Hangar Parking Pads
  const hangarPads = [];
  const padMat = getMaterial('#0f172a', { roughness: 0.7 });
  const padBorderMat = getMaterial('#38bdf8', { emissive: '#0284c7', emissiveIntensity: 0.9 });

  const rows = 9;
  const cols = 4; // 2 on left, 2 on right
  let padIndex = 0;

  for (let r = 0; r < rows; r++) {
    const z = -15 - r * 9.5;
    const xPositions = [-23, -14, 14, 23];

    for (let c = 0; c < cols; c++) {
      if (padIndex >= maxSlots) break;
      const x = xPositions[c];

      const padGroup = new THREE.Group();
      padGroup.name = `hangar_pad_${padIndex}`;
      padGroup.position.set(x, 0.06, z);

      // Pad Surface
      const padMesh = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.12, 6.6), padMat);
      // Border Rim
      const rimGeom = new THREE.RingGeometry(2.5, 2.9, 16);
      rimGeom.rotateX(-Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeom, padBorderMat);
      rimMesh.position.y = 0.08;

      padGroup.add(padMesh, rimMesh);
      baseGroup.add(padGroup);

      hangarPads.push({
        index: padIndex,
        x,
        z,
        group: padGroup,
        planeMesh: null,
        currentPlane: null
      });

      padIndex++;
    }
  }

  // Taxiway Centerlines
  for (let tz = -110; tz <= 10; tz += 10) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 5), yellowLineMat);
    dash.position.set(0, 0.04, tz);
    baseGroup.add(dash);
  }

  baseGroup.userData = {
    hangarPads,
    dropZonePosition: new THREE.Vector3(0, 0, 0),
    dropZoneRadius: 6.5,
    cashVaultPosition: new THREE.Vector3(0, 0, -18),
    cashVaultRadius: 5.0,
    rebirthAltarPosition: new THREE.Vector3(0, 0, -105),
    rebirthRadius: 7.5,
    shopPosition: new THREE.Vector3(16, 0, -15),
    speedShopPosition: new THREE.Vector3(16, 0, -35),
    airplaneShopPosition: new THREE.Vector3(-16, 0, -35)
  };

  return baseGroup;
}

// -------------------------------------------------------------
// 6. Runway Track & Zone Gate Generator
// -------------------------------------------------------------
export function createRunwayTrack(totalLength = 2600, width = 36) {
  const trackGroup = new THREE.Group();
  trackGroup.name = 'runway_track';

  const tarmacMat = getMaterial('#1e293b', { roughness: 0.95 });
  const yellowLineMat = getMaterial('#facc15', { emissive: '#ca8a04', emissiveIntensity: 0.5 });
  const whiteLineMat = getMaterial('#f8fafc', { roughness: 0.4 });
  const grassMat = getMaterial('#064e3b', { roughness: 0.9 });

  // Main Runway Surface (Segmented chunks for performance)
  const segmentLength = 200;
  const numSegments = Math.ceil(totalLength / segmentLength);

  for (let s = 0; s < numSegments; s++) {
    const zStart = s * segmentLength;
    const zCenter = zStart + segmentLength / 2;

    // Runway Center Tarmac
    const segMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, segmentLength), tarmacMat);
    segMesh.position.set(0, -0.2, zCenter);
    trackGroup.add(segMesh);

    // Surrounding Desert / Mountain Plain Ground
    const groundL = new THREE.Mesh(new THREE.BoxGeometry(100, 0.3, segmentLength), grassMat);
    groundL.position.set(-(width / 2 + 50), -0.25, zCenter);
    const groundR = groundL.clone();
    groundR.position.x = (width / 2 + 50);
    trackGroup.add(groundL, groundR);

    // Dashed Yellow Centerline
    for (let dashZ = zStart; dashZ < zStart + segmentLength; dashZ += 12) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 6), yellowLineMat);
      dash.position.set(0, 0.02, dashZ + 6);
      trackGroup.add(dash);
    }

    // Runway Edge Stripes & Runway Lights
    [-width / 2 + 0.6, width / 2 - 0.6].forEach((edgeX, idx) => {
      const edgeStripe = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, segmentLength), whiteLineMat);
      edgeStripe.position.set(edgeX, 0.02, zCenter);
      trackGroup.add(edgeStripe);

      // Edge Lights every 25m
      for (let lightZ = zStart; lightZ < zStart + segmentLength; lightZ += 25) {
        const lightPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6), getMaterial('#475569'));
        lightPole.position.set(edgeX, 0.3, lightZ);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), getMaterial(idx === 0 ? '#38bdf8' : '#34d399', {
          emissive: idx === 0 ? '#0284c7' : '#10b981',
          emissiveIntensity: 1.5
        }));
        bulb.position.set(edgeX, 0.65, lightZ);
        trackGroup.add(lightPole, bulb);
      }
    });
  }

  // Zone Gate Arches (At Zone transition points: 200m, 500m, 900m, 1400m, 2000m)
  const zoneGates = [
    { z: 200, name: 'ZONE 2: VINTAGE AIRFIELD', color: '#3b82f6' },
    { z: 500, name: 'ZONE 3: COMMERCIAL JETWAY', color: '#8b5cf6' },
    { z: 900, name: 'ZONE 4: MILITARY STEALTH BASE', color: '#ec4899' },
    { z: 1400, name: 'ZONE 5: ROCKETPORT & SPACEBASE', color: '#f97316' },
    { z: 2000, name: 'ZONE 6: COSMIC SKYWAY', color: '#06b6d4' }
  ];

  zoneGates.forEach(gate => {
    const archMat = getMaterial('#0f172a', { metalness: 0.8 });
    const neonMat = getMaterial(gate.color, { emissive: gate.color, emissiveIntensity: 1.8 });

    // Left & Right Pillars
    const pL = new THREE.Mesh(new THREE.BoxGeometry(2.0, 16, 2.0), archMat);
    pL.position.set(-width / 2 - 1, 8, gate.z);
    const pR = new THREE.Mesh(new THREE.BoxGeometry(2.0, 16, 2.0), archMat);
    pR.position.set(width / 2 + 1, 8, gate.z);

    // Crossbar
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(width + 4, 2.5, 2.0), archMat);
    crossbar.position.set(0, 15, gate.z);

    // Glowing Neon Banner
    const neonBanner = new THREE.Mesh(new THREE.BoxGeometry(width - 4, 1.4, 0.4), neonMat);
    neonBanner.position.set(0, 15, gate.z + 1.1);

    trackGroup.add(pL, pR, crossbar, neonBanner);
  });

  return trackGroup;
}
