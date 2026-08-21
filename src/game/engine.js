import * as THREE from 'three';
import {
  PLANES_DATABASE,
  ZONES,
  TSUNAMI_TYPES,
  UPGRADES
} from './constants.js';
import {
  createPlaneMesh,
  createPilotCharacter,
  createTsunamiMesh,
  createTrenchMesh,
  createAirportBase,
  createRunwayTrack
} from './models.js';
import { gameState } from './state.js';
import { soundEngine } from './audio.js';

export class GameEngine {
  constructor(canvasContainer, uiCallbacks = {}) {
    this.container = canvasContainer;
    this.uiCallbacks = uiCallbacks;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Game Entities
    this.player = null;
    this.playerVelocity = new THREE.Vector3();
    this.isGrounded = true;
    this.isDashing = false;
    this.dashCooldownTimer = 0;
    this.dashDurationTimer = 0;
    this.currentZone = ZONES[0];

    // Camera Modes & Orbit state
    this.cameraMode = 'player'; // 'player' | 'tsunami' | 'drone' | 'tower'
    this.cameraDistance = 15; // Panned out default (was 9)
    this.cameraYaw = 0; // Horizontal rotation
    this.cameraPitch = 0.38; // Vertical angle
    this.isDraggingMouse = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.cameraShake = 0;

    // World
    this.airportBase = null;
    this.runwayTrack = null;
    this.trenches = [];
    this.spawnedPlanes = []; // { mesh, planeDef, spawnZ, timer, maxTimer, initialY }
    this.towedPlaneMeshes = [];
    this.towLineMesh = null;

    // Tsunami Wave
    this.activeWave = null;
    this.waveSpawnTimer = 10; // First wave in 10s
    this.nextWaveTypeIndex = 0;
    this.isWaveActive = false;

    // Controls
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false
    };

    // Virtual Joystick for Mobile
    this.virtualInput = {
      x: 0,
      y: 0,
      jump: false,
      sprint: false
    };

    // Clock
    this.clock = new THREE.Clock();
    this.incomeTimer = 0;
    this.padCashAnimationTimers = [];

    this.init();
  }

  init() {
    // 1. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0f172a');
    this.scene.fog = new THREE.FogExp2('#0f172a', 0.008);

    // 2. Camera - Wider Field of view (72) for epic runway visibility
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 2000);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight('#94a3b8', 1.0);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 1.8);
    sunLight.position.set(40, 80, -30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    this.scene.add(sunLight);
    this.sunLight = sunLight;

    // Runway floodlights
    const baseLight = new THREE.PointLight('#38bdf8', 2.0, 60);
    baseLight.position.set(0, 15, -20);
    this.scene.add(baseLight);

    // 5. Build Environment
    this.buildWorld();

    // 6. Build Player Avatar
    this.player = createPilotCharacter(gameState.rebirths);
    this.player.position.set(0, 0, -5);
    this.scene.add(this.player);

    // 7. Event Listeners
    this.setupEventListeners();

    // 8. Subscribe to state changes (rebirth wings, hangar updates)
    gameState.subscribe(() => {
      this.updatePlayerAvatar();
      this.updateHangarPads();
    });

    this.updateHangarPads();
    this.spawnInitialPlanes();

    // 9. Start Game Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildWorld() {
    // 1. Airport Base
    this.airportBase = createAirportBase(24);
    this.scene.add(this.airportBase);

    // 2. Runway Track (Total 2600m)
    this.runwayTrack = createRunwayTrack(2600, 38);
    this.scene.add(this.runwayTrack);

    // 3. Safe Trenches along runway track
    const trenchDistances = [
      75, 160, 260, 380, 520, 680, 860, 1050, 1260, 1500, 1750, 2020, 2320
    ];

    trenchDistances.forEach(z => {
      const trench = createTrenchMesh(z, 36, 6.5, 18);
      this.scene.add(trench);
      this.trenches.push(trench);
    });
  }

  updatePlayerAvatar() {
    if (!this.player) return;
    // Recreate wings if rebirth changed
    const wingsGroup = this.player.userData.wingsGroup;
    if (wingsGroup) {
      // Clear existing wing meshes
      while (wingsGroup.children.length > 0) {
        wingsGroup.remove(wingsGroup.children[0]);
      }
      const rank = gameState.rebirths;
      if (rank > 0) {
        const wingColors = ['#f59e0b', '#38bdf8', '#a855f7', '#ec4899', '#06b6d4', '#fbbf24'];
        const wingColor = wingColors[Math.min(rank - 1, wingColors.length - 1)];
        const wingMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(wingColor),
          emissive: new THREE.Color(wingColor),
          emissiveIntensity: 1.5,
          transparent: true,
          opacity: 0.85
        });

        const leftWing = new THREE.Mesh(new THREE.BoxGeometry(1.6 + rank * 0.2, 0.4, 0.06), wingMat);
        leftWing.position.set(-0.9, 0.2, 0);
        leftWing.rotation.z = 0.35;
        const rightWing = new THREE.Mesh(new THREE.BoxGeometry(1.6 + rank * 0.2, 0.4, 0.06), wingMat);
        rightWing.position.set(0.9, 0.2, 0);
        rightWing.rotation.z = -0.35;
        wingsGroup.add(leftWing, rightWing);
      }
    }
  }

  updateHangarPads() {
    if (!this.airportBase) return;
    const pads = this.airportBase.userData.hangarPads;
    const hangarPlanes = gameState.hangarPlanes;
    const maxUnlockedSlots = gameState.getMaxHangarSlots();

    pads.forEach((pad, idx) => {
      // Visibility of unlocked vs locked pads
      const isUnlocked = idx < maxUnlockedSlots;
      pad.group.visible = isUnlocked;

      const planeData = hangarPlanes[idx];

      // If there's a plane assigned
      if (planeData && isUnlocked) {
        if (!pad.currentPlane || pad.currentPlane.id !== planeData.id || pad.currentPlane.golden !== planeData.golden) {
          // Remove old mesh
          if (pad.planeMesh) {
            pad.group.remove(pad.planeMesh);
            pad.planeMesh = null;
          }
          // Add new plane mesh
          const planeDef = PLANES_DATABASE.find(p => p.id === planeData.id) || planeData;
          const planeMesh = createPlaneMesh(planeDef, false);
          planeMesh.scale.set(0.85, 0.85, 0.85);
          planeMesh.position.set(0, 0.6, 0);

          if (planeData.golden) {
            // Golden aura for merged planes
            const goldRing = new THREE.Mesh(
              new THREE.TorusGeometry(2.0, 0.1, 8, 24),
              new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 2.0 })
            );
            goldRing.rotateX(Math.PI / 2);
            goldRing.position.y = 0.2;
            planeMesh.add(goldRing);
          }

          pad.group.add(planeMesh);
          pad.planeMesh = planeMesh;
          pad.currentPlane = { ...planeData };
        }
      } else {
        // Empty pad
        if (pad.planeMesh) {
          pad.group.remove(pad.planeMesh);
          pad.planeMesh = null;
          pad.currentPlane = null;
        }
      }
    });
  }

  spawnInitialPlanes() {
    // Populate track with initial planes across zones
    const spawnPoints = [
      // Zone 1
      { z: 40, x: -6 }, { z: 90, x: 5 }, { z: 130, x: -4 }, { z: 180, x: 6 },
      // Zone 2
      { z: 240, x: -5 }, { z: 320, x: 4 }, { z: 400, x: -7 }, { z: 460, x: 3 },
      // Zone 3
      { z: 560, x: -5 }, { z: 640, x: 6 }, { z: 750, x: -4 }, { z: 840, x: 5 },
      // Zone 4
      { z: 960, x: -6 }, { z: 1080, x: 4 }, { z: 1200, x: -5 }, { z: 1320, x: 7 },
      // Zone 5
      { z: 1480, x: -5 }, { z: 1620, x: 6 }, { z: 1780, x: -4 }, { z: 1920, x: 5 },
      // Zone 6
      { z: 2100, x: -6 }, { z: 2260, x: 4 }, { z: 2420, x: -5 }, { z: 2550, x: 0 }
    ];

    spawnPoints.forEach(pt => {
      this.spawnPlaneAtLocation(pt.x, pt.z);
    });
  }

  spawnPlaneAtLocation(x, z) {
    // Determine zone from Z
    const zone = ZONES.find(zDef => z >= zDef.minDist && z < zDef.maxDist) || ZONES[ZONES.length - 1];
    const availablePlaneIds = zone.planeIds;
    const planeId = availablePlaneIds[Math.floor(Math.random() * availablePlaneIds.length)];
    const planeDef = PLANES_DATABASE.find(p => p.id === planeId);
    if (!planeDef) return;

    const mesh = createPlaneMesh(planeDef);
    mesh.position.set(x, 1.2, z);
    this.scene.add(mesh);

    const maxTimer = 60 + Math.random() * 30;
    this.spawnedPlanes.push({
      mesh,
      planeDef,
      spawnX: x,
      spawnZ: z,
      timer: maxTimer,
      maxTimer,
      initialY: 1.2
    });
  }

  // Tsunami wave trigger
  triggerTsunami() {
    if (this.activeWave) return;

    const waveDef = TSUNAMI_TYPES[this.nextWaveTypeIndex % TSUNAMI_TYPES.length];
    this.nextWaveTypeIndex++;

    // Wave spawns further ahead than player or at minimum 800m
    const spawnZ = Math.max(800, this.player.position.z + 550);

    const waveMesh = createTsunamiMesh(waveDef);
    waveMesh.position.set(0, 0, spawnZ);
    this.scene.add(waveMesh);

    this.activeWave = {
      mesh: waveMesh,
      waveDef,
      z: spawnZ,
      speed: waveDef.speed,
      height: waveDef.height,
      spawnZ
    };

    this.isWaveActive = true;
    soundEngine.startSiren();

    if (this.uiCallbacks.onTsunamiAlert) {
      this.uiCallbacks.onTsunamiAlert(waveDef, spawnZ);
    }
  }

  setupEventListeners() {
    const handleKeyDown = (e) => {
      soundEngine.resume();
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
          if (!this.keys.jump) {
            this.handleJump();
          }
          this.keys.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyQ':
        case 'KeyE':
          this.handleDash();
          this.keys.sprint = true;
          break;
        case 'KeyC':
          this.cycleCameraMode();
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'Space':
          this.keys.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyQ':
        case 'KeyE':
          this.keys.sprint = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse drag for camera orbit
    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', (e) => {
      this.isDraggingMouse = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      soundEngine.resume();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingMouse) return;
      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;
      this.cameraYaw -= dx * 0.005;
      this.cameraPitch = Math.max(0.1, Math.min(1.2, this.cameraPitch + dy * 0.004));
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingMouse = false;
    });

    // Mouse wheel zoom with generous range (6m to 45m)
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(6, Math.min(45, this.cameraDistance + e.deltaY * 0.015));
    }, { passive: false });

    // Resize
    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  handleJump() {
    if (this.isGrounded) {
      this.playerVelocity.y = 12.5;
      this.isGrounded = false;
      soundEngine.playJump();
    }
  }

  handleDash() {
    if (this.dashCooldownTimer <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashDurationTimer = 0.25;
      this.dashCooldownTimer = gameState.getUpgradeValue('dashBoost');
      soundEngine.playDash();
      this.cameraShake = 0.4;
    }
  }

  // Set virtual joystick from mobile UI
  setVirtualInput(x, y, jump, sprint) {
    this.virtualInput.x = x;
    this.virtualInput.y = y;
    if (jump && !this.virtualInput.jump) {
      this.handleJump();
    }
    this.virtualInput.jump = jump;
    if (sprint) {
      this.handleDash();
    }
    this.virtualInput.sprint = sprint;
  }

  // Update Game Physics & Movement
  updatePlayer(dt) {
    if (!this.player) return;

    // Calculate move direction relative to camera angle
    let inputX = 0;
    let inputZ = 0;

    if (this.keys.forward) inputZ += 1;
    if (this.keys.backward) inputZ -= 1;
    if (this.keys.left) inputX -= 1;
    if (this.keys.right) inputX += 1;

    // Blend virtual joystick
    inputX += this.virtualInput.x;
    inputZ += -this.virtualInput.y;

    const moveVector = new THREE.Vector2(inputX, inputZ);
    const hasInput = moveVector.lengthSq() > 0.01;
    if (hasInput && moveVector.length() > 1) {
      moveVector.normalize();
    }

    // Speed calculation
    let currentSpeed = gameState.getPlayerSpeed();
    if (this.isDashing) {
      currentSpeed *= 2.6;
    }

    // Camera relative direction
    const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw)).normalize();

    const worldMoveDir = new THREE.Vector3()
      .addScaledVector(forward, -moveVector.y)
      .addScaledVector(right, moveVector.x);

    if (worldMoveDir.lengthSq() > 0.001) {
      worldMoveDir.normalize();
      // Smoothly rotate character toward movement direction
      const targetRotation = Math.atan2(worldMoveDir.x, worldMoveDir.z);
      // Interpolate rotation
      const diff = targetRotation - this.player.rotation.y;
      const shortestAngle = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.player.rotation.y += shortestAngle * Math.min(1.0, dt * 15);

      // Move player
      this.player.position.x += worldMoveDir.x * currentSpeed * dt;
      this.player.position.z += worldMoveDir.z * currentSpeed * dt;
    }

    // Restrict lateral movement to track borders
    const maxTrackX = 18;
    this.player.position.x = Math.max(-maxTrackX, Math.min(maxTrackX, this.player.position.x));
    // Restrict back of base
    this.player.position.z = Math.max(-85, this.player.position.z);

    // Trench Floor & Ramp Physics
    let targetGroundY = 0;
    for (const trench of this.trenches) {
      const u = trench.userData;
      if (this.player.position.z >= u.minZ && this.player.position.z <= u.maxZ) {
        // Inside trench zone
        const distFromCenter = Math.abs(this.player.position.z - u.zPos);
        const halfFloorLen = 8;
        if (distFromCenter <= halfFloorLen) {
          targetGroundY = -u.trenchDepth;
        } else {
          // On ramp slope
          const rampProgress = (distFromCenter - halfFloorLen) / 8;
          targetGroundY = -u.trenchDepth * (1 - rampProgress);
        }
        break;
      }
    }

    // Gravity and Jumping
    const gravity = -32;
    this.playerVelocity.y += gravity * dt;
    this.player.position.y += this.playerVelocity.y * dt;

    if (this.player.position.y <= targetGroundY) {
      this.player.position.y = targetGroundY;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Dash Timers
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= dt;
    }
    if (this.dashDurationTimer > 0) {
      this.dashDurationTimer -= dt;
      if (this.dashDurationTimer <= 0) {
        this.isDashing = false;
      }
    }

    // Pilot Limbs Running Animation Rig
    const ud = this.player.userData;
    if (hasInput && this.isGrounded) {
      ud.animTime = (ud.animTime || 0) + dt * (currentSpeed * 0.7);
      const swing = Math.sin(ud.animTime);
      ud.leftLegPivot.rotation.x = swing * 0.75;
      ud.rightLegPivot.rotation.x = -swing * 0.75;
      ud.leftArmPivot.rotation.x = -swing * 0.65;
      ud.rightArmPivot.rotation.x = swing * 0.65;
      ud.torso.position.y = 1.35 + Math.abs(Math.sin(ud.animTime * 2)) * 0.12;
    } else if (!this.isGrounded) {
      // Jump pose
      ud.leftLegPivot.rotation.x = 0.5;
      ud.rightLegPivot.rotation.x = -0.3;
      ud.leftArmPivot.rotation.x = -1.2;
      ud.rightArmPivot.rotation.x = -1.2;
      ud.torso.position.y = 1.35;
    } else {
      // Idle
      ud.leftLegPivot.rotation.x *= 0.8;
      ud.rightLegPivot.rotation.x *= 0.8;
      ud.leftArmPivot.rotation.x *= 0.8;
      ud.rightArmPivot.rotation.x *= 0.8;
      ud.torso.position.y = 1.35;
    }

    // Update Distance Stats
    if (this.player.position.z > gameState.stats.maxDistanceReached) {
      gameState.stats.maxDistanceReached = Math.floor(this.player.position.z);
    }

    // Current Zone Update
    const currentZ = Math.max(0, this.player.position.z);
    const zone = ZONES.find(zDef => currentZ >= zDef.minDist && currentZ < zDef.maxDist) || ZONES[ZONES.length - 1];
    if (zone && zone.id !== this.currentZone.id) {
      this.currentZone = zone;
      // Change fog & background colors smoothly
      this.scene.fog.color.set(zone.fogColor);
      this.scene.background.set(zone.fogColor);
      if (this.uiCallbacks.onZoneChange) {
        this.uiCallbacks.onZoneChange(zone);
      }
    }
  }

  // Update Towed Planes Chain
  updateTowedPlanes(dt) {
    const carried = gameState.carriedPlanes;

    // Synchronize 3D meshes for carried planes
    while (this.towedPlaneMeshes.length < carried.length) {
      const idx = this.towedPlaneMeshes.length;
      const planeDef = carried[idx];
      const mesh = createPlaneMesh(planeDef, false);
      mesh.scale.set(0.65, 0.65, 0.65);
      this.scene.add(mesh);
      this.towedPlaneMeshes.push(mesh);
    }

    while (this.towedPlaneMeshes.length > carried.length) {
      const mesh = this.towedPlaneMeshes.pop();
      this.scene.remove(mesh);
    }

    // Serpentine Tow Chain Physics
    let leaderPos = this.player.position.clone();
    leaderPos.y += 0.8;

    const linePoints = [leaderPos.clone()];

    this.towedPlaneMeshes.forEach((mesh, idx) => {
      const targetSpacing = 2.4;
      const dir = new THREE.Vector3().subVectors(mesh.position, leaderPos);
      const currentDist = dir.length();

      if (currentDist > targetSpacing || currentDist < 0.1) {
        dir.normalize();
        const targetPos = leaderPos.clone().addScaledVector(dir, targetSpacing);
        targetPos.y = leaderPos.y + 0.3 + Math.sin(Date.now() * 0.004 + idx) * 0.15;
        mesh.position.lerp(targetPos, Math.min(1.0, dt * 14));
      }

      // Smoothly orient plane facing the leader
      mesh.lookAt(leaderPos);
      linePoints.push(mesh.position.clone());
      leaderPos = mesh.position.clone();

      // Spin props / glow animations
      const props = mesh.userData.animProps || [];
      props.forEach(p => p.rotation.z += dt * 25);
    });

    // Draw / update tow cable line
    if (this.towedPlaneMeshes.length > 0) {
      if (!this.towLineMesh) {
        const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 });
        this.towLineMesh = new THREE.Line(lineGeom, lineMat);
        this.scene.add(this.towLineMesh);
      } else {
        this.towLineMesh.geometry.setFromPoints(linePoints);
        this.towLineMesh.visible = true;
      }
    } else if (this.towLineMesh) {
      this.towLineMesh.visible = false;
    }
  }

  // Check Plane Pickups along runway
  updateSpawnedPlanes(dt) {
    const playerPos = this.player.position;
    const magnetRadius = gameState.getUpgradeValue('planeMagnet');
    const remainingPlanes = [];

    for (let i = 0; i < this.spawnedPlanes.length; i++) {
      const sp = this.spawnedPlanes[i];
      sp.timer -= dt;

      // Sinusoidal bobbing & propeller spin
      sp.mesh.position.y = sp.initialY + Math.sin(Date.now() * 0.003 + sp.spawnZ) * 0.35;
      sp.mesh.rotation.y += dt * 1.2;

      const props = sp.mesh.userData.animProps || [];
      props.forEach(p => p.rotation.z += dt * 20);

      // Distance to player
      const dist = playerPos.distanceTo(sp.mesh.position);

      // Magnet pull when close
      if (dist < magnetRadius * 2.5 && gameState.canPickupPlane()) {
        sp.mesh.position.lerp(playerPos, dt * 6);
      }

      // Pickup Collision
      if (dist < magnetRadius && gameState.canPickupPlane()) {
        const picked = gameState.pickupPlane(sp.planeDef);
        if (picked) {
          soundEngine.playPickup();
          this.scene.remove(sp.mesh);
          if (this.uiCallbacks.onPlaneCollected) {
            this.uiCallbacks.onPlaneCollected(sp.planeDef);
          }
          // Respawn another plane in this zone after 6-12s
          setTimeout(() => {
            this.spawnPlaneAtLocation(sp.spawnX, sp.spawnZ);
          }, 8000 + Math.random() * 6000);
          continue;
        }
      }

      // Despawn if timer ran out
      if (sp.timer <= 0) {
        this.scene.remove(sp.mesh);
        // Respawn fresh plane
        setTimeout(() => {
          this.spawnPlaneAtLocation(sp.spawnX, sp.spawnZ);
        }, 3000);
        continue;
      }

      remainingPlanes.push(sp);
    }

    this.spawnedPlanes = remainingPlanes;
  }

  // Update Tsunami Wave Progression & Danger Check
  updateTsunami(dt) {
    // Wave spawn timer countdown
    if (!this.activeWave) {
      this.waveSpawnTimer -= dt;
      if (this.waveSpawnTimer <= 0) {
        this.triggerTsunami();
        this.waveSpawnTimer = 22 + Math.random() * 10;
      }
      return;
    }

    const wave = this.activeWave;
    // Move wave toward base (Z decreases)
    wave.z -= wave.speed * dt;
    wave.mesh.position.z = wave.z;

    // Animate wave spray particles
    const spray = wave.mesh.userData.sprayPoints;
    if (spray) {
      const posAttr = spray.geometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        let py = posAttr.getY(i) - dt * 4.0;
        if (py < 0) py = wave.height * 0.9;
        posAttr.setY(i, py);
      }
      posAttr.needsUpdate = true;
    }

    // Distance to player
    const distToPlayer = wave.z - this.player.position.z;
    soundEngine.updateWaveRoar(Math.abs(distToPlayer));

    // Screen Shake when wave is near
    if (distToPlayer > -15 && distToPlayer < 90) {
      const intensity = 1.0 - Math.max(0, distToPlayer / 90);
      this.cameraShake = Math.max(this.cameraShake, intensity * 0.6);
    }

    // Check Player Collision with Wave
    // Wave strikes when wave.z reaches player.z
    if (wave.z <= this.player.position.z + 4 && wave.z >= this.player.position.z - 12) {
      // Check if player is safely tucked in a trench or has Admin Godmode
      const isPlayerSafe = this.isPlayerInSafeZone() || (gameState.admin && gameState.admin.godmode);

      if (!isPlayerSafe) {
        // Player is wiped out by tsunami!
        this.handlePlayerWipedOut();
      } else {
        // Player survived safely in trench or godmode!
        if (!wave.hasPlayerSurvived) {
          wave.hasPlayerSurvived = true;
          gameState.stats.tsunamisEscaped++;
          const bonusReward = 150 * gameState.getIncomeMultiplier();
          gameState.addMoney(bonusReward);
          if (this.uiCallbacks.onNotification) {
            const msg = gameState.admin && gameState.admin.godmode
              ? `🛡️ GODMODE SHIELD! Deflected Tsunami! +$${bonusReward.toLocaleString()}`
              : `🌊 SURVIVED TSUNAMI! Bonus +$${bonusReward.toLocaleString()}`;
            this.uiCallbacks.onNotification(msg, 'success');
          }
        }
      }
    }

    // Wave hits base forcefield laser shield at Z = 15
    if (wave.z <= 15) {
      this.scene.remove(wave.mesh);
      this.activeWave = null;
      this.isWaveActive = false;
      soundEngine.stopSiren();
      if (this.uiCallbacks.onTsunamiEnded) {
        this.uiCallbacks.onTsunamiEnded();
      }
    }
  }

  isPlayerInSafeZone() {
    // 1. Inside Base (Z <= 15)
    if (this.player.position.z <= 15) return true;

    // 2. Below Trench Safe Height (Y <= -2.0) inside a trench bounds
    for (const trench of this.trenches) {
      const u = trench.userData;
      if (this.player.position.z >= u.minZ && this.player.position.z <= u.maxZ) {
        if (this.player.position.y <= u.safeY) {
          return true;
        }
      }
    }

    return false;
  }

  handlePlayerWipedOut() {
    soundEngine.playSplash();
    const lostPlanes = gameState.wipeout();

    // Reset player to safe base
    this.player.position.set(0, 0, -5);
    this.playerVelocity.set(0, 0, 0);
    this.cameraShake = 1.0;

    if (this.uiCallbacks.onNotification) {
      const msg = lostPlanes > 0
        ? `💥 WIPED OUT! Swept back to base & lost ${lostPlanes} carried planes!`
        : `🌊 SWEPT AWAY! Rescued back to safe Airport Base!`;
      this.uiCallbacks.onNotification(msg, 'danger');
    }
  }

  // Base Interaction Triggers (Drop Zone, Rebirth Altar, Shop)
  checkBaseTriggers() {
    if (!this.airportBase) return;
    const playerPos = this.player.position;
    const u = this.airportBase.userData;

    // 1. Drop Zone (Z ~ 0)
    if (playerPos.distanceTo(u.dropZonePosition) < u.dropZoneRadius) {
      if (gameState.carriedPlanes.length > 0) {
        const result = gameState.depositCarriedPlanes();
        soundEngine.playBaseDeposit();
        if (this.uiCallbacks.onPlanesDeposited) {
          this.uiCallbacks.onPlanesDeposited(result);
        }
      }
    }

    // 2. Rebirth Altar (Z ~ -72)
    if (playerPos.distanceTo(u.rebirthAltarPosition) < u.rebirthRadius) {
      if (this.uiCallbacks.onNearRebirthAltar) {
        this.uiCallbacks.onNearRebirthAltar(true);
      }
    } else {
      if (this.uiCallbacks.onNearRebirthAltar) {
        this.uiCallbacks.onNearRebirthAltar(false);
      }
    }

    // 3. Upgrades Shop Booth (X ~ 22, Z ~ -35)
    if (playerPos.distanceTo(u.shopPosition) < u.shopRadius) {
      if (this.uiCallbacks.onNearShop) {
        this.uiCallbacks.onNearShop(true);
      }
    } else {
      if (this.uiCallbacks.onNearShop) {
        this.uiCallbacks.onNearShop(false);
      }
    }
  }

  // Camera Switching
  setCameraMode(mode) {
    this.cameraMode = mode;
    if (this.uiCallbacks.onCameraModeChange) {
      this.uiCallbacks.onCameraModeChange(this.cameraMode);
    }
  }

  cycleCameraMode() {
    const modes = ['player', 'tsunami', 'drone', 'tower'];
    const currentIdx = modes.indexOf(this.cameraMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    this.setCameraMode(nextMode);
    soundEngine.playClick();
  }

  // Admin Engine Helpers
  teleportPlayer(zPos, xPos = 0) {
    this.player.position.set(xPos, 0, zPos);
    this.playerVelocity.set(0, 0, 0);
    this.cameraShake = 0.5;
    soundEngine.playUpgrade();
  }

  triggerSpecificTsunami(typeId) {
    if (this.activeWave) {
      this.clearActiveTsunami();
    }
    const waveDef = TSUNAMI_TYPES.find(t => t.id === typeId) || TSUNAMI_TYPES[0];
    const spawnZ = Math.max(800, this.player.position.z + 550);

    const waveMesh = createTsunamiMesh(waveDef);
    waveMesh.position.set(0, 0, spawnZ);
    this.scene.add(waveMesh);

    this.activeWave = {
      mesh: waveMesh,
      waveDef,
      z: spawnZ,
      speed: waveDef.speed,
      height: waveDef.height,
      spawnZ
    };

    this.isWaveActive = true;
    soundEngine.startSiren();

    if (this.uiCallbacks.onTsunamiAlert) {
      this.uiCallbacks.onTsunamiAlert(waveDef, spawnZ);
    }
  }

  clearActiveTsunami() {
    if (this.activeWave) {
      this.scene.remove(this.activeWave.mesh);
      this.activeWave = null;
      this.isWaveActive = false;
      soundEngine.stopSiren();
      if (this.uiCallbacks.onTsunamiEnded) {
        this.uiCallbacks.onTsunamiEnded();
      }
    }
  }

  // Update Smooth Third-Person & Multi-Mode Camera
  updateCamera(dt) {
    if (!this.player || !this.camera) return;

    // Dynamic camera shake decay
    let shakeOffset = new THREE.Vector3();
    if (this.cameraShake > 0.01) {
      shakeOffset.set(
        (Math.random() - 0.5) * this.cameraShake * 1.5,
        (Math.random() - 0.5) * this.cameraShake * 1.5,
        (Math.random() - 0.5) * this.cameraShake * 1.5
      );
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.0);
    }

    if (this.cameraMode === 'tsunami') {
      // 🌊 TSUNAMI CAM: Follows the wave dynamically!
      if (this.activeWave && this.activeWave.mesh) {
        const wz = this.activeWave.z;
        const wh = this.activeWave.height;
        // Position camera in front of and slightly to the side of the towering wave looking at it
        const desiredPos = new THREE.Vector3(12, wh * 0.85, wz - 38).add(shakeOffset);
        const lookTarget = new THREE.Vector3(0, wh * 0.45, wz + 8);
        this.camera.position.lerp(desiredPos, Math.min(1.0, dt * 10));
        this.camera.lookAt(lookTarget);
      } else {
        // No wave active: Look down runway from mid-height
        const desiredPos = new THREE.Vector3(0, 18, this.player.position.z + 120);
        const lookTarget = new THREE.Vector3(0, 5, this.player.position.z + 400);
        this.camera.position.lerp(desiredPos, Math.min(1.0, dt * 8));
        this.camera.lookAt(lookTarget);
      }
    } else if (this.cameraMode === 'drone') {
      // 🛰️ DRONE OVERHEAD PANORAMA CAM
      const desiredPos = new THREE.Vector3(
        this.player.position.x,
        this.player.position.y + 48,
        this.player.position.z - 18
      ).add(shakeOffset);
      const lookTarget = new THREE.Vector3(
        this.player.position.x,
        this.player.position.y,
        this.player.position.z + 28
      );
      this.camera.position.lerp(desiredPos, Math.min(1.0, dt * 14));
      this.camera.lookAt(lookTarget);
    } else if (this.cameraMode === 'tower') {
      // 🏢 AIRPORT CONTROL TOWER CAM
      const towerPos = new THREE.Vector3(-26, 23.5, -50);
      this.camera.position.lerp(towerPos, Math.min(1.0, dt * 10));
      const lookTarget = this.activeWave
        ? new THREE.Vector3(0, 8, this.activeWave.z)
        : new THREE.Vector3(0, 2, this.player.position.z);
      this.camera.lookAt(lookTarget);
    } else {
      // ✈️ STANDARD THIRD-PERSON PLAYER CHASE (Panned Out)
      const targetPoint = this.player.position.clone();
      targetPoint.y += 1.6;

      // Spherical offset from yaw and pitch
      const cx = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
      const cy = Math.sin(this.cameraPitch) * this.cameraDistance;
      const cz = Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

      const desiredCameraPos = targetPoint.clone().add(new THREE.Vector3(cx, cy, cz)).add(shakeOffset);

      // Smooth lerp
      this.camera.position.lerp(desiredCameraPos, Math.min(1.0, dt * 18));
      this.camera.lookAt(targetPoint);
    }

    // Make sunlight follow player for dynamic shadows
    if (this.sunLight) {
      this.sunLight.position.set(
        this.player.position.x + 35,
        this.player.position.y + 70,
        this.player.position.z - 30
      );
      this.sunLight.target = this.player;
    }

    // Rotate Control Tower Radar
    if (this.airportBase && this.airportBase.userData.radarDish) {
      this.airportBase.userData.radarDish.rotation.y += dt * 2.0;
    }
  }

  // Passive Income & Pad Animation
  updateIncomeAndPads(dt) {
    gameState.tickIncome(dt);

    this.incomeTimer += dt;
    if (this.incomeTimer >= 1.0) {
      this.incomeTimer = 0;
      // Animate planes parked on hangar pads
      if (this.airportBase) {
        const pads = this.airportBase.userData.hangarPads;
        pads.forEach(pad => {
          if (pad.planeMesh) {
            // Slight hop animation
            pad.planeMesh.position.y = 0.8;
            setTimeout(() => {
              if (pad.planeMesh) pad.planeMesh.position.y = 0.6;
            }, 180);
          }
        });
      }
    }
  }

  // Main Render & Physics Tick Loop
  animate() {
    requestAnimationFrame(this.animate);
    const dt = Math.min(0.1, this.clock.getDelta());

    this.updatePlayer(dt);
    this.updateTowedPlanes(dt);
    this.updateSpawnedPlanes(dt);
    this.updateTsunami(dt);
    this.checkBaseTriggers();
    this.updateCamera(dt);
    this.updateIncomeAndPads(dt);

    // Sync HUD callback
    if (this.uiCallbacks.onTick) {
      this.uiCallbacks.onTick({
        playerPos: this.player.position,
        activeWave: this.activeWave,
        trenches: this.trenches,
        spawnedPlanes: this.spawnedPlanes
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
