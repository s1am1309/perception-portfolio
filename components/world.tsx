"use client";

import Star from "@/components/star";
import Audio from "@/components/audio";

import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";

import { Text } from "@react-three/drei";

import {
  useRef,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";

import * as THREE from "three";

/* =========================================================
   PROFESSIONAL COLOR PALETTE
========================================================= */

const COLORS = {
  background: "#0A0A0F",
  
  // Primary Text
  primary: "#E8E8ED",
  secondary: "#B8B8C4",
  muted: "#7A7A8C",
  
  // Accent Colors - Professional & Sophisticated
  cyan: "#00C8FF",
  blue: "#3B82F6",
  deepBlue: "#1E40AF",
  teal: "#14B8A6",
  
  // Status Colors
  success: "#10B981",
  warning: "#F59E0B",
  info: "#3B82F6",
  
  // Wireframe & Effects
  wireframe: "#3B82F6",
  glow: "#00C8FF",
};

/* =========================================================
   JOURNEY CONFIG
========================================================= */

const JOURNEY = {
  hero: { z: -12 },
  mind: { z: -38 },
  lab: { z: -64 },
  projects: { z: -90 },
  journey: { z: -116 },
  contact: { z: -142 },
} as const;

const CAMERA_START_Z = 5;
const CAMERA_END_Z = -138;

/* =========================================================
   DISTANCE THRESHOLDS
========================================================= */

const ACTIVATION_DISTANCE = 22;
const FULL_DISTANCE = 18;
const NEAR_DISTANCE = 3;

/* =========================================================
   SCROLL PROGRESS
========================================================= */

function getScrollProgress() {
  if (typeof window === "undefined") {
    return 0;
  }

  const maxScroll =
    document.documentElement.scrollHeight -
    window.innerHeight;

  if (maxScroll <= 0) {
    return 0;
  }

  return THREE.MathUtils.clamp(
    window.scrollY / maxScroll,
    0,
    1
  );
}

/* =========================================================
   SMOOTH EASING
========================================================= */

function smoothstep(
  edge0: number,
  edge1: number,
  value: number
) {
  const t = THREE.MathUtils.clamp(
    (value - edge0) /
      (edge0 - edge1),
    0,
    1
  );

  return t * t * (3 - 2 * t);
}

function easeInOutCubic(t: number) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/* =========================================================
   DEVICE DETECTION HOOK
========================================================= */

function useDeviceDetect() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      let type: 'mobile' | 'tablet' | 'desktop';
      
      if (width < 768 && hasTouch) {
        type = 'mobile';
        setIsMobile(true);
        setIsTablet(false);
      } else if (width < 1024 && hasTouch) {
        type = 'tablet';
        setIsMobile(false);
        setIsTablet(true);
      } else {
        type = 'desktop';
        setIsMobile(false);
        setIsTablet(false);
      }
      
      setDeviceType(type);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTablet, deviceType };
}

/* =========================================================
   SCENE LIFECYCLE
========================================================= */

function Scene({
  scene,
  children,
  onActiveChange,
}: {
  scene: { z: number };
  children: ReactNode;
  onActiveChange?: (active: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null);

  const { camera } = useThree();

  const previousActive =
    useRef(false);
  
  const smoothVisibility = useRef(0);
  const smoothY = useRef(0);

  const { isMobile } = useDeviceDetect();

  useFrame(() => {
    if (!group.current) {
      return;
    }

    const cameraZ = camera.position.z;
    const sceneZ = scene.z;

    const distance =
      Math.abs(cameraZ - sceneZ);

    const isAhead =
      cameraZ > sceneZ;

    let visibility = 0;

    if (isAhead) {
      if (
        distance <
        ACTIVATION_DISTANCE
      ) {
        if (
          distance >
          FULL_DISTANCE
        ) {
          visibility =
            smoothstep(
              ACTIVATION_DISTANCE,
              FULL_DISTANCE,
              distance
            );
        } else if (
          distance >
          NEAR_DISTANCE
        ) {
          visibility = 1;
        } else {
          visibility =
            smoothstep(
              0,
              NEAR_DISTANCE,
              distance
            );
        }
      }
    }

    const targetVisibility = visibility;
    const smoothingFactor = isMobile ? 0.12 : 0.08;
    smoothVisibility.current += (targetVisibility - smoothVisibility.current) * smoothingFactor;
    
    const currentVisibility = Math.max(0, Math.min(1, smoothVisibility.current));
    
    const visible = currentVisibility > 0.001;

    if (
      visible !==
      previousActive.current
    ) {
      previousActive.current =
        visible;

      onActiveChange?.(
        visible
      );
    }

    group.current.visible = true;

    const targetY = (1 - currentVisibility) * 0.8;
    const ySmoothing = isMobile ? 0.08 : 0.06;
    smoothY.current += (targetY - smoothY.current) * ySmoothing;
    group.current.position.y = smoothY.current;

    group.current.traverse(
      (child) => {
        const mesh =
          child as THREE.Mesh;

        if (!mesh.isMesh) {
          return;
        }

        const material =
          mesh.material as
            | THREE.Material
            | THREE.Material[];

        const materials =
          Array.isArray(material)
            ? material
            : [material];

        materials.forEach(
          (mat) => {
            mat.transparent = true;
            const easedOpacity = easeOutQuad(currentVisibility);
            mat.opacity = easedOpacity;
          }
        );
      }
    );
  });

  return (
    <group ref={group}>
      {children}
    </group>
  );
}

/* =========================================================
   CAMERA CONTROLLER
========================================================= */

function CameraController() {
  const { camera, scene } = useThree();

  const targetZ =
    useRef(
      CAMERA_START_Z
    );

  const currentZ =
    useRef(
      CAMERA_START_Z
    );

  const { isMobile } = useDeviceDetect();

  useFrame(() => {
    const progress =
      getScrollProgress();

    targetZ.current =
      CAMERA_START_Z -
      progress *
        (
          CAMERA_START_Z -
          CAMERA_END_Z
        );

    const damping = isMobile ? 0.06 : 0.035 + (1 - progress) * 0.02;
    
    currentZ.current +=
      (
        targetZ.current -
        currentZ.current
      ) *
      damping;

    camera.position.z =
      currentZ.current;
    camera.position.x = 0;
    camera.position.y = 0;
    camera.rotation.set(0, 0, 0);

    const fogIntensity = isMobile ? 0.015 + progress * 0.03 : 0.02 + progress * 0.04;
    scene.fog = new THREE.FogExp2(
      COLORS.background,
      fogIntensity
    );
  });

  return null;
}

/* =========================================================
   HERO - Dynamic Subtitle Cycles
========================================================= */

function Hero() {
  const mesh = useRef<THREE.Mesh>(null);
  const { isMobile } = useDeviceDetect();
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  
  const subtitles = [
    "BUILDING INTELLIGENCE",
    "EXPLORING AUTOMOTIVE TECHNOLOGY",
    "EXPERIMENTING WITH THE FUTURE",
    "TURNING IDEAS INTO SYSTEMS"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  useFrame(() => {
    if (!mesh.current) return;
    const speed = isMobile ? 0.001 : 0.002;
    mesh.current.rotation.x += speed;
    mesh.current.rotation.y += speed * 2;
  });

  return (
    <Scene scene={JOURNEY.hero}>
      <group position={[0, 0, JOURNEY.hero.z]} scale={isMobile ? 0.65 : 0.85}>
        <mesh ref={mesh}>
          <icosahedronGeometry args={[isMobile ? 3.5 : 5, isMobile ? 3 : 5]} />
          <meshBasicMaterial
            color={COLORS.wireframe}
            wireframe
            transparent
            opacity={0.6}
          />
        </mesh>

        <Text
          position={[0, isMobile ? 4.5 : 6.5, 0]}
          fontSize={isMobile ? 0.25 : 0.35}
          maxWidth={isMobile ? 8 : 11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={isMobile ? 0.4 : 0.6}
          color={COLORS.cyan}
          fillOpacity={1}
        >
          {`PERCEPTION`}
        </Text>

        <Text
          position={[0, isMobile ? -1.5 : 0, 0]}
          fontSize={isMobile ? 0.7 : 1}
          maxWidth={isMobile ? 7 : 10}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
          lineHeight={isMobile ? 1.3 : 1.2}
          color={COLORS.primary}
          fillOpacity={1}
        >
          {isMobile ? `How I see\nthe world.` : `How I see the world.`}
        </Text>

        <Text
          position={[0, isMobile ? -3.5 : -4, 0]}
          fontSize={isMobile ? 0.3 : 0.4}
          maxWidth={isMobile ? 8 : 11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
          color={COLORS.blue}
          fillOpacity={0.8}
          key={subtitleIndex}
        >
          {subtitles[subtitleIndex]}
        </Text>

        <Text
          position={[0, isMobile ? -5.5 : -6.5, 0]}
          fontSize={isMobile ? 0.35 : 0.5}
          maxWidth={isMobile ? 9 : 13}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
          color={COLORS.secondary}
          fillOpacity={0.55}
        >
          {isMobile ? `Scroll to begin` : `Scroll to begin the journey`}
        </Text>
      </group>
    </Scene>
  );
}
/* =========================================================
   MIND - Interactive Neural Map
========================================================= */

function Mind() {
  const { isMobile } = useDeviceDetect();
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const nodes = [
    { id: "AI", label: "AI", x: -2, y: 2, color: COLORS.cyan },
    { id: "Robotics", label: "Robotics", x: 0, y: 1.5, color: COLORS.blue },
    { id: "Engineering", label: "Engineering", x: 2, y: 2, color: COLORS.teal },
    { id: "Cars", label: "Cars", x: -2, y: -1, color: COLORS.deepBlue },
    { id: "Physics", label: "Physics", x: 2, y: -1, color: COLORS.cyan },
  ];

  return (
    <Scene scene={JOURNEY.mind}>
      <group position={[0, 0, JOURNEY.mind.z]} scale={isMobile ? 0.65 : 0.85}>
        <Text
          position={[0, isMobile ? 4.5 : 5, 0]}
          fontSize={isMobile ? 0.2 : 0.26}
          maxWidth={isMobile ? 8 : 11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.5}
          color={COLORS.cyan}
          fillOpacity={0.7}
        >
          {`01 — MIND MAP`}
        </Text>

        <Text
          position={[0, isMobile ? 3.5 : 4, 0]}
          fontSize={isMobile ? 0.9 : 1.3}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.03}
          lineHeight={1.15}
          color={COLORS.primary}
          fillOpacity={1}
        >
          {`How I think.`}
        </Text>

        {/* Central Node */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[isMobile ? 0.8 : 1.2, 32, 32]} />
          <meshBasicMaterial color={COLORS.primary} wireframe transparent opacity={0.8} />
        </mesh>
        
        <Text
          position={[0, 0, 0]}
          fontSize={isMobile ? 0.4 : 0.6}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color={COLORS.primary}
          fillOpacity={1}
        >
          {`PERCEPTION`}
        </Text>

        {/* Connection Lines and Nodes */}
        {nodes.map((node) => (
          <group key={node.id}>
            {/* Connection line */}
            <mesh position={[node.x / 2, node.y / 2, -0.5]}>
              <cylinderGeometry args={[0.02, 0.02, Math.sqrt(node.x * node.x + node.y * node.y), 8]} />
              <meshBasicMaterial color={node.color} transparent opacity={0.3} />
            </mesh>
            
            {/* Node */}
            <mesh 
              position={[node.x, node.y, 0]}
              onPointerOver={() => setActiveNode(node.id)}
              onPointerOut={() => setActiveNode(null)}
            >
              <sphereGeometry args={[isMobile ? 0.4 : 0.6, 32, 32]} />
              <meshBasicMaterial 
                color={activeNode === node.id ? COLORS.primary : node.color} 
                wireframe 
                transparent 
                opacity={activeNode === node.id ? 1 : 0.6} 
              />
            </mesh>
            
            <Text
              position={[node.x, node.y - (isMobile ? 0.6 : 0.9), 0]}
              fontSize={isMobile ? 0.2 : 0.3}
              textAlign="center"
              anchorX="center"
              anchorY="middle"
              color={activeNode === node.id ? COLORS.primary : COLORS.secondary}
              fillOpacity={activeNode === node.id ? 1 : 0.7}
            >
              {node.label}
            </Text>
          </group>
        ))}
      </group>
    </Scene>
  );
}

/* =========================================================
   LAB - Experiments Section
========================================================= */

function Lab() {
  const { isMobile } = useDeviceDetect();

  const experiments = [
    { id: "01", name: "Teaching an AI memory", status: "In Progress", progress: 75 },
    { id: "02", name: "Matter simulation", status: "Active", progress: 60 },
    { id: "03", name: "Gesture-controlled robotics", status: "Planning", progress: 20 },
    { id: "04", name: "Price prediction", status: "Complete", progress: 100 },
  ];

  return (
    <Scene scene={JOURNEY.lab}>
      <group position={[0, 0, JOURNEY.lab.z]} scale={isMobile ? 0.65 : 0.85}>
        <Text
          position={[0, isMobile ? 4.5 : 5, 0]}
          fontSize={isMobile ? 0.2 : 0.26}
          maxWidth={isMobile ? 8 : 11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.5}
          color={COLORS.teal}
          fillOpacity={0.7}
        >
          {`02 — EXPERIMENTS`}
        </Text>

        <Text
          position={[0, isMobile ? 3.5 : 4, 0]}
          fontSize={isMobile ? 0.9 : 1.3}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.03}
          lineHeight={1.15}
          color={COLORS.primary}
          fillOpacity={1}
        >
          {`The Lab.`}
        </Text>

        <Text
          position={[0, isMobile ? 2.5 : 3, 0]}
          fontSize={isMobile ? 0.15 : 0.22}
          maxWidth={isMobile ? 8 : 11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.04}
          color={COLORS.secondary}
          fillOpacity={0.7}
        >
          {`Where ideas become reality`}
        </Text>

        {experiments.map((exp, index) => (
          <group key={exp.id} position={[0, isMobile ? 1.5 - index * 1.5 : 1.5 - index * 1.2, 0]}>
            <Text
              position={[0, 0, 0]}
              fontSize={isMobile ? 0.25 : 0.35}
              textAlign="center"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.1}
              color={COLORS.primary}
              fillOpacity={0.9}
            >
              {`${exp.id} — ${exp.name}`}
            </Text>
            <Text
              position={[0, isMobile ? -0.3 : -0.4, 0]}
              fontSize={isMobile ? 0.15 : 0.2}
              textAlign="center"
              anchorX="center"
              anchorY="middle"
              color={exp.status === "Complete" ? COLORS.success : COLORS.warning}
              fillOpacity={0.8}
            >
              {`${exp.status} | ${exp.progress}%`}
            </Text>
          </group>
        ))}
      </group>
    </Scene>
  );
}

/* =========================================================
   PROJECT OBJECT - Updated with professional styling
========================================================= */

function ProjectObject({
  position,
  type,
  name,
  description,
  status,
  link,
  active,
  isMobile,
}: {
  position: [number, number, number];
  type: "box" | "sphere" | "torus" | "octahedron" | "dodecahedron" | "cone" | "cylinder" | "torusKnot" | "icosahedron";
  name: string;
  description: string;
  status: "active" | "under construction" | "upcoming";
  link?: string;
  active: boolean;
  isMobile?: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const smoothY = useRef(position[1]);
  const smoothRotX = useRef(0);
  const smoothRotY = useRef(0);

  const statusColor = 
    status === "active" ? COLORS.success :
    status === "under construction" ? COLORS.warning :
    COLORS.muted;

  useFrame((state) => {
    if (!mesh.current) return;

    const targetY = position[1] + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * (isMobile ? 0.15 : 0.25);
    smoothY.current += (targetY - smoothY.current) * (isMobile ? 0.06 : 0.04);
    mesh.current.position.y = smoothY.current;

    const rotSpeed = isMobile ? 0.002 : 0.003;
    const targetRotX = mesh.current.rotation.x + rotSpeed;
    const targetRotY = mesh.current.rotation.y + rotSpeed * 1.6;
    
    smoothRotX.current += (targetRotX - smoothRotX.current) * (isMobile ? 0.1 : 0.08);
    smoothRotY.current += (targetRotY - smoothRotY.current) * (isMobile ? 0.1 : 0.08);
    
    mesh.current.rotation.x = smoothRotX.current;
    mesh.current.rotation.y = smoothRotY.current;
  });

  const getGeometry = () => {
    const size = isMobile ? 0.8 : 1.2;
    switch(type) {
      case "box": return <boxGeometry args={[size, size, size]} />;
      case "sphere": return <sphereGeometry args={[isMobile ? 0.6 : 0.8, isMobile ? 16 : 32, isMobile ? 16 : 32]} />;
      case "torus": return <torusGeometry args={[isMobile ? 0.4 : 0.6, isMobile ? 0.15 : 0.2, isMobile ? 16 : 24, isMobile ? 24 : 48]} />;
      case "octahedron": return <octahedronGeometry args={[isMobile ? 0.6 : 0.8, 0]} />;
      case "dodecahedron": return <dodecahedronGeometry args={[isMobile ? 0.5 : 0.7, 0]} />;
      case "cone": return <coneGeometry args={[isMobile ? 0.4 : 0.6, isMobile ? 0.8 : 1.2, isMobile ? 16 : 32]} />;
      case "cylinder": return <cylinderGeometry args={[isMobile ? 0.35 : 0.5, isMobile ? 0.35 : 0.5, isMobile ? 0.8 : 1.2, isMobile ? 16 : 32]} />;
      case "torusKnot": return <torusKnotGeometry args={[isMobile ? 0.35 : 0.5, isMobile ? 0.1 : 0.15, isMobile ? 32 : 64, isMobile ? 6 : 8, 2, 3]} />;
      case "icosahedron": return <icosahedronGeometry args={[isMobile ? 0.5 : 0.7, 0]} />;
      default: return <boxGeometry args={[isMobile ? 0.8 : 1.0, isMobile ? 0.8 : 1.0, isMobile ? 0.8 : 1.0]} />;
    }
  };

  const nameFontSize = isMobile ? 0.18 : 0.25;
  const descFontSize = isMobile ? 0.1 : 0.13;
  const statusFontSize = isMobile ? 0.07 : 0.09;
  const yOffset = isMobile ? 1.2 : 1.6;
  const descOffset = isMobile ? 1.7 : 2.2;
  const statusOffset = isMobile ? 2.3 : 3.0;

  return (
    <group>
      <mesh
        ref={mesh}
        position={position}
        onClick={(e) => {
          if (!active || !link) return;
          e.stopPropagation();
          window.open(link, "_blank");
        }}
        onPointerOver={(e) => {
          if (!active || !link) return;
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        {getGeometry()}
        <meshBasicMaterial
          color={COLORS.blue}
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>

      <Text
        position={[position[0], position[1] - yOffset, position[2]]}
        fontSize={nameFontSize}
        maxWidth={isMobile ? 3 : 4}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.34}
        color={COLORS.primary}
        fillOpacity={1}
      >
        {name}
      </Text>

      <Text
        position={[position[0], position[1] - descOffset, position[2]]}
        fontSize={descFontSize}
        maxWidth={isMobile ? 2.5 : 3.5}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
        lineHeight={1.3}
        color={COLORS.secondary}
        fillOpacity={0.8}
      >
        {description}
      </Text>

      <Text
        position={[position[0], position[1] - statusOffset, position[2]]}
        fontSize={statusFontSize}
        maxWidth={isMobile ? 2 : 3}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
        color={statusColor}
        fillOpacity={0.9}
      >
        {status === "active" ? "● ACTIVE" :
         status === "under construction" ? "◐ UNDER CONSTRUCTION" :
         "○ UPCOMING"}
      </Text>
    </group>
  );
}

/* =========================================================
   PROJECTS
========================================================= */

function Projects() {
  const [active, setActive] = useState(false);
  const { isMobile } = useDeviceDetect();

  const getPositions = () => {
    if (isMobile) {
      return {
        perception: [-3.0, 0.5, 0],
        moodify: [0, -0.5, -3],
        matterology: [3.0, 0.5, 0],
        neural: [-2.0, -3.5, -6],
        holoverse: [2.0, -3.5, -6],
      };
    }
    return {
      perception: [-6.5, 0.5, 0],
      moodify: [0, -0.5, -3],
      matterology: [6.5, 0.5, 0],
      neural: [-3.5, -3.5, -6],
      holoverse: [3.5, -3.5, -6],
    };
  };

  const positions = getPositions();

  return (
    <Scene scene={JOURNEY.projects} onActiveChange={setActive}>
      <group position={[0, 0, JOURNEY.projects.z]} scale={isMobile ? 0.65 : 0.85}>
        <Text
          position={[0, isMobile ? 3.5 : 4.5, 0]}
          fontSize={isMobile ? 0.16 : 0.22}
          maxWidth={11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.4}
          color={COLORS.cyan}
          fillOpacity={0.7}
        >
          {`03 — PROJECTS`}
        </Text>

        <Text
          position={[0, isMobile ? 2.2 : 3, 0]}
          fontSize={isMobile ? 0.8 : 1.2}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.03}
          lineHeight={1.15}
          color={COLORS.primary}
          fillOpacity={1}
        >
          {`Built to learn.`}
        </Text>

        <ProjectObject
          position={positions.perception as [number, number, number]}
          type="box"
          name="PERCEPTION"
          description={isMobile ? "This portfolio — immersive 3D scroll" : "This very portfolio — an immersive 3D scroll experience"}
          status="active"
          active={active}
          isMobile={isMobile}
        />

        <ProjectObject
          position={positions.moodify as [number, number, number]}
          type="sphere"
          name="MOODIFY"
          description={isMobile ? "Identify mood from text and audio" : "A great app which can identify mood from text and audio"}
          status="active"
          link="https://moodify-coral.vercel.app/"
          active={active}
          isMobile={isMobile}
        />

        <ProjectObject
          position={positions.matterology as [number, number, number]}
          type="dodecahedron"
          name="MATTEROLOGY"
          description={isMobile ? "Simulate matter properties" : "An app to simulate matter properties and interactions"}
          status="under construction"
          active={active}
          isMobile={isMobile}
        />

        <ProjectObject
          position={positions.neural as [number, number, number]}
          type="torusKnot"
          name={isMobile ? "NEURAL JELLYFISH" : "NEURAL JELLYFISH (NJ)"}
          description={isMobile ? "AI buddy that learns with you" : "An AI buddy that learns and evolves with you"}
          status="upcoming"
          active={active}
          isMobile={isMobile}
        />

        <ProjectObject
          position={positions.holoverse as [number, number, number]}
          type="octahedron"
          name="HOLOVERSE"
          description={isMobile ? "OS with hand gesture control" : "An OS environment controlled with hand gestures via camera"}
          status="upcoming"
          active={active}
          isMobile={isMobile}
        />
      </group>
    </Scene>
  );
}

/* =========================================================
   JOURNEY TIMELINE
========================================================= */

function JourneyTimeline() {
  const { isMobile } = useDeviceDetect();

  const timeline = [
    { year: "2024", event: "Started programming" },
    { year: "2025", event: "Building websites" },
    { year: "2026", event: "AI + Robotics + Engineering" },
  ];

  return (
    <Scene scene={JOURNEY.journey}>
      <group position={[0, 0, JOURNEY.journey.z]} scale={isMobile ? 0.65 : 0.85}>
        <Text
          position={[0, isMobile ? 3.5 : 4, 0]}
          fontSize={isMobile ? 0.2 : 0.26}
          maxWidth={isMobile ? 8 : 11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.5}
          color={COLORS.teal}
          fillOpacity={0.7}
        >
          {`04 — JOURNEY`}
        </Text>

        <Text
          position={[0, isMobile ? 2.5 : 3, 0]}
          fontSize={isMobile ? 0.9 : 1.3}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.03}
          lineHeight={1.15}
          color={COLORS.primary}
          fillOpacity={1}
        >
          {`The path so far.`}
        </Text>

        {timeline.map((item, index) => (
          <group key={item.year} position={[0, isMobile ? 1.5 - index * 1.2 : 1.5 - index * 1.2, 0]}>
            <Text
              position={[0, 0, 0]}
              fontSize={isMobile ? 0.35 : 0.5}
              textAlign="center"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.1}
              color={COLORS.cyan}
              fillOpacity={0.9}
            >
              {item.year}
            </Text>
            <Text
              position={[0, isMobile ? -0.4 : -0.5, 0]}
              fontSize={isMobile ? 0.25 : 0.35}
              textAlign="center"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.05}
              color={COLORS.secondary}
              fillOpacity={0.8}
            >
              {item.event}
            </Text>
          </group>
        ))}
      </group>
    </Scene>
  );
}

/* =========================================================
   CONTACT - System Status Aesthetic
========================================================= */

function Contact() {
  const { isMobile } = useDeviceDetect();

  return (
    <Scene scene={JOURNEY.contact}>
      <group position={[0, 0, JOURNEY.contact.z]} scale={isMobile ? 0.65 : 0.85}>
        <Text
          position={[0, isMobile ? 3 : 3.5, 0]}
          fontSize={isMobile ? 0.07 : 0.09}
          maxWidth={11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.3}
          color={COLORS.cyan}
          fillOpacity={0.7}
        >
          {`05 — CONTACT`}
        </Text>

        <Text
          position={[0, isMobile ? 2 : 2.5, 0]}
          fontSize={isMobile ? 0.3 : 0.4}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.04}
          lineHeight={1.15}
          color={COLORS.primary}
          fillOpacity={1}
        >
          {`PERCEPTION OS`}
        </Text>

        {/* System Status */}
        <group position={[0, isMobile ? 0.5 : 1, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={isMobile ? 0.15 : 0.2}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.1}
            color={COLORS.success}
            fillOpacity={0.9}
          >
            {`STATUS: ONLINE`}
          </Text>
          <Text
            position={[0, isMobile ? -0.4 : -0.5, 0]}
            fontSize={isMobile ? 0.12 : 0.16}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
            color={COLORS.secondary}
            fillOpacity={0.8}
          >
            {`PROJECTS: 08 | EXPERIMENTS: 14`}
          </Text>
          <Text
            position={[0, isMobile ? -0.8 : -1, 0]}
            fontSize={isMobile ? 0.12 : 0.16}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
            color={COLORS.secondary}
            fillOpacity={0.8}
          >
            {`CURRENTLY: BUILDING AI`}
          </Text>
          <Text
            position={[0, isMobile ? -1.2 : -1.5, 0]}
            fontSize={isMobile ? 0.12 : 0.16}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
            color={COLORS.secondary}
            fillOpacity={0.8}
          >
            {`LOCATION: BANGLADESH`}
          </Text>
        </group>

        {/* Social Links */}
        <group position={[0, isMobile ? -2 : -2.5, 0]}>
          <Text
            position={[isMobile ? -0.9 : -1.15, 0, 0]}
            fontSize={isMobile ? 0.07 : 0.09}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.35}
            color={COLORS.cyan}
            fillOpacity={0.75}
            onClick={() => window.open("https://github.com/s1am1309", "_blank")}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "default";
            }}
          >
            GITHUB
          </Text>

          <Text
            position={[0, 0, 0]}
            fontSize={isMobile ? 0.07 : 0.09}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.35}
            color={COLORS.blue}
            fillOpacity={0.75}
            onClick={() => window.open("https://instagram.com/s1am1309", "_blank")}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "default";
            }}
          >
            INSTAGRAM
          </Text>

          <Text
            position={[isMobile ? 0.9 : 1.3, 0, 0]}
            fontSize={isMobile ? 0.07 : 0.09}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.35}
            color={COLORS.teal}
            fillOpacity={0.75}
            onClick={() => {
              window.location.href = "mailto:siam.info.09@gmail.com";
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "default";
            }}
          >
            EMAIL
          </Text>
        </group>
      </group>
    </Scene>
  );
}

/* =========================================================
   PARTICLES - Professional effect
========================================================= */

function Particles() {
  const points = useRef<THREE.Points>(null);
  const { isMobile } = useDeviceDetect();
  const particleCount = isMobile ? 800 : 1800;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = isMobile ? 15 + Math.random() * 25 : 20 + Math.random() * 35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * radius * 0.8;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.6;
      pos[i * 3 + 2] = Math.cos(phi) * radius * 0.3 - 80;
    }
    return pos;
  }, [particleCount]);

  const originalPositions = useMemo(() => {
    return new Float32Array(positions);
  }, [positions]);

  const speeds = useMemo(() => {
    const speed = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      speed[i] = 0.1 + Math.random() * 0.3;
    }
    return speed;
  }, [particleCount]);

  const prevScrollSpeed = useRef(0);
  const smoothProgress = useRef(0);
  const smoothScrollSpeed = useRef(0);
  const smoothPositions = useMemo(() => {
    return new Float32Array(positions);
  }, [positions]);

  useFrame((state) => {
    if (!points.current) return;

    const geometry = points.current.geometry;
    const positionAttr = geometry.attributes.position;
    const posArray = positionAttr.array as Float32Array;

    const progress = getScrollProgress();
    const rawScrollSpeed = Math.abs(progress - prevScrollSpeed.current) * 50;
    
    smoothProgress.current += (progress - smoothProgress.current) * 0.05;
    smoothScrollSpeed.current += (rawScrollSpeed - smoothScrollSpeed.current) * (isMobile ? 0.05 : 0.03);
    
    prevScrollSpeed.current = progress;

    const depthWobble = smoothProgress.current * 2 + 0.5;
    const scrollSpeed = smoothScrollSpeed.current;
    const wormholeStrength = isMobile ? 0.15 : 0.3;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      const ox = originalPositions[i3];
      const oy = originalPositions[i3 + 1];
      const oz = originalPositions[i3 + 2];

      const scrollOffset = smoothProgress.current * 120 * speeds[i] * (isMobile ? 0.2 : 0.3);
      const wormholeRadius = Math.sqrt(ox * ox + oy * oy);
      const angle = Math.atan2(oy, ox);
      const twist = depthWobble * wormholeStrength;
      const distortedAngle = angle + twist * (1 / (1 + wormholeRadius * 0.05));
      
      const rx = Math.cos(distortedAngle) * wormholeRadius;
      const ry = Math.sin(distortedAngle) * wormholeRadius;

      const targetX = rx + ox * 0.05 * scrollSpeed * 0.02;
      const targetY = ry + oy * 0.05 * scrollSpeed * 0.02;
      const targetZ = oz + scrollOffset * 0.2;

      const smoothing = isMobile ? 0.06 : 0.04;
      smoothPositions[i3] += (targetX - smoothPositions[i3]) * smoothing;
      smoothPositions[i3 + 1] += (targetY - smoothPositions[i3 + 1]) * smoothing;
      smoothPositions[i3 + 2] += (targetZ - smoothPositions[i3 + 2]) * smoothing;

      posArray[i3] = smoothPositions[i3];
      posArray[i3 + 1] = smoothPositions[i3 + 1];
      posArray[i3 + 2] = smoothPositions[i3 + 2];
    }

    positionAttr.needsUpdate = true;
  });

  const smoothRotation = useRef(0);
  useFrame(() => {
    if (!points.current) return;
    const rotSpeed = isMobile ? 0.0001 : 0.0002;
    smoothRotation.current += rotSpeed;
    points.current.rotation.z = smoothRotation.current;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        color={COLORS.cyan}
        size={isMobile ? 0.012 : 0.016}
        sizeAttenuation
        transparent
        opacity={isMobile ? 0.4 : 0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* =========================================================
   WORLD
========================================================= */

export default function World() {
  const { isMobile } = useDeviceDetect();

  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, #0A0A1A 0%, #050510 45%, #0A0A0F 100%)",
      }}
    >
      <Canvas
        camera={{
          position: [0, 0, CAMERA_START_Z],
          fov: isMobile ? 50 : 45,
          near: 0.1,
          far: 200,
        }}
        performance={{ min: isMobile ? 0.5 : 0.8 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
      >
        <CameraController />

        <Star />

        <Hero />
        <Mind />
        <Lab />
        <Projects />
        <JourneyTimeline />
        <Contact />

        <Particles />
      </Canvas>

      <Audio />
    </div>
  );
}
