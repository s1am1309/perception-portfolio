'use client';

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
   GRADIENT COLOR PALETTE — Enhanced with more depth
========================================================= */

const COLORS = {
  background: "#020204",

  primary: "#F5F5F7",
  secondary: "#C4C4D4",
  muted: "#8585A3",

  indigo: "#6366F1",
  violet: "#8B5CF6",
  brightViolet: "#A78BFA",

  wireframe: "#007FFF",
  
  // NEW: Accent colors for interactive states
  accentGlow: "#E0AAFF",
  darkBg: "#0A0612",
};

/* =========================================================
   JOURNEY CONFIG — unchanged
========================================================= */

const JOURNEY = {
  hero: { z: -12 },
  about: { z: -48 },
  projects: { z: -84 },
  dreams: { z: -120 },
  contact: { z: -156 },
} as const;

const CAMERA_START_Z = 5;
const CAMERA_END_Z = -152;

/* =========================================================
   DISTANCE THRESHOLDS — unchanged
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
   SMOOTH EASING — enhanced with more options
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

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

// 🔥 NEW: Spring easing for bouncy, playful feel
function easeOutElastic(t: number) {
  const c5 = (2 * Math.PI) / 4.5;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c5) + 1;
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
   SCENE LIFECYCLE — Enhanced with staggered animations
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
  const smoothScale = useRef(1);

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

    // 🔄 Ultra-smooth interpolation for visibility
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

    // 🎯 Smooth entrance animation with eased Y movement
    const targetY = (1 - currentVisibility) * 0.8;
    const ySmoothing = isMobile ? 0.08 : 0.06;
    smoothY.current += (targetY - smoothY.current) * ySmoothing;
    group.current.position.y = smoothY.current;

    // 🔥 NEW: Subtle scale animation on entrance
    const targetScale = 0.95 + currentVisibility * 0.05;
    const scaleSmoothing = isMobile ? 0.07 : 0.05;
    smoothScale.current += (targetScale - smoothScale.current) * scaleSmoothing;
    group.current.scale.set(smoothScale.current, smoothScale.current, smoothScale.current);

    // ✨ Smooth opacity transitions with enhanced easing
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
            const easedOpacity = easeOutCubic(currentVisibility);
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
   CAMERA CONTROLLER — Enhanced with fog depth
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

  const previousScrollSpeed =
    useRef(0);

  const { isMobile } = useDeviceDetect();

  useFrame((state) => {
    const progress =
      getScrollProgress();

    const scrollSpeed =
      Math.abs(
        progress -
        (previousScrollSpeed.current || 0)
      ) * 100;

    previousScrollSpeed.current =
      progress;

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

    camera.rotation.set(
      0,
      0,
      0
    );

    // 🌫️ Enhanced fog with smooth transitions
    const fogIntensity = isMobile ? 0.015 + progress * 0.03 : 0.02 + progress * 0.04;
    scene.fog = new THREE.FogExp2(
      COLORS.darkBg,
      fogIntensity
    );
  });

  return null;
}

/* =========================================================
   HERO — Enhanced with better geometry and animations
========================================================= */

function Hero() {
  const mesh =
    useRef<THREE.Mesh>(null);

  const { isMobile } = useDeviceDetect();
  const pulseRef = useRef(0);

  useFrame(() => {
    if (!mesh.current) {
      return;
    }

    const speed = isMobile ? 0.001 : 0.002;
    mesh.current.rotation.x += speed;
    mesh.current.rotation.y += speed * 2;
    
    // 🔥 NEW: Subtle pulse effect
    pulseRef.current += 0.02;
    const pulse = 1 + Math.sin(pulseRef.current) * 0.02;
    mesh.current.scale.setScalar(pulse);
  });

  return (
    <Scene
      scene={JOURNEY.hero}
    >
      <group
        position={[
          0,
          0,
          JOURNEY.hero.z,
        ]}
        scale={isMobile ? 0.65 : 0.85}
      >
        <mesh ref={mesh}>
          <icosahedronGeometry
            args={[isMobile ? 3.5 : 5, isMobile ? 3 : 5]}
          />

          <meshBasicMaterial
            color={COLORS.wireframe}
            wireframe
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* 🔥 NEW: Enhanced hero text with better hierarchy */}
        <Text
          position={[
            0,
            isMobile ? 4.5 : 6.5,
            0,
          ]}
          fontSize={isMobile ? 0.28 : 0.42}
          maxWidth={isMobile ? 8 : 11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={isMobile ? 0.5 : 0.8}
          color={COLORS.accentGlow}
          fillOpacity={1.2}
          fontWeight="bold"
        >
          {`PERCEPTION`}
        </Text>

        <Text
          position={[
            0,
            isMobile ? -1.5 : 0,
            0,
          ]}
          fontSize={isMobile ? 0.8 : 1.15}
          maxWidth={isMobile ? 7 : 10}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
          lineHeight={isMobile ? 1.3 : 1.2}
          color={COLORS.primary}
          fillOpacity={1.1}
          fontWeight={600}
        >
          {isMobile ? `I build things\nto understand them.` : `I build things to understand them.`}
        </Text>

        {/* 🔥 NEW: Better "scroll to begin" call-to-action */}
        <Text
          position={[
            0,
            isMobile ? -4.5 : -5.8,
            0,
          ]}
          fontSize={isMobile ? 0.35 : 0.48}
          maxWidth={isMobile ? 9 : 13}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
          color={COLORS.secondary}
          fillOpacity={0.65}
        >
          {isMobile ? `↓ SCROLL ↓` : `↓ SCROLL TO BEGIN ↓`}
        </Text>
      </group>
    </Scene>
  );
}

/* =========================================================
   ABOUT — Enhanced with better typography hierarchy
========================================================= */

function About() {
  const { isMobile } = useDeviceDetect();

  return (
    <Scene
      scene={JOURNEY.about}
    >
      <group
        position={[
          0,
          0,
          JOURNEY.about.z,
        ]}
        scale={isMobile ? 0.65 : 0.85}
      >
        {/* Section label */}
        <Text
          position={[
            0,
            isMobile ? 4.0 : 4.8,
            0,
          ]}
          fontSize={isMobile ? 0.18 : 0.24}
          maxWidth={isMobile ? 8 : 11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.6}
          color={COLORS.accentGlow}
          fillOpacity={0.8}
          fontWeight={500}
        >
          {`▪ 01 — ABOUT ▪`}
        </Text>

        {/* Main heading */}
        <Text
          position={[
            0,
            isMobile ? 2.5 : 3.0,
            0,
          ]}
          fontSize={isMobile ? 1.1 : 1.6}
          maxWidth={isMobile ? 8 : 11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
          lineHeight={1.15}
          color={COLORS.primary}
          fillOpacity={1.1}
          fontWeight="bold"
        >
          {`Hey, I'm Siam.`}
        </Text>

        {/* Primary bio paragraph */}
        <Text
          position={[
            0,
            isMobile ? 1.3 : 1.6,
            0,
          ]}
          fontSize={isMobile ? 0.19 : 0.28}
          maxWidth={isMobile ? 7 : 10}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
          lineHeight={isMobile ? 1.6 : 1.5}
          color={COLORS.accentGlow}
          fillOpacity={1.3}
          fontWeight={500}
        >
          {isMobile ? 
            `Student from Bangladesh with a curious mind.` :
            `I'm a student from Bangladesh with a curious mind and a habit of turning random ideas into real projects.`}
        </Text>

        {/* Secondary bio paragraphs */}
        <Text
          position={[
            0,
            isMobile ? -0.1 : 0.2,
            0,
          ]}
          fontSize={isMobile ? 0.15 : 0.22}
          maxWidth={isMobile ? 7 : 10.5}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
          lineHeight={isMobile ? 1.6 : 1.5}
          color={COLORS.secondary}
          fillOpacity={1}
          fontWeight={400}
        >
          {isMobile ?
            `Tech, engineering, physics, astronomy, creative design.` :
            `I'm deeply interested in technology, engineering, cars, physics, astronomy, and creative design.`}
        </Text>

        <Text
          position={[
            0,
            isMobile ? -1.3 : -1.1,
            0,
          ]}
          fontSize={isMobile ? 0.15 : 0.22}
          maxWidth={isMobile ? 7 : 10.5}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
          lineHeight={isMobile ? 1.6 : 1.5}
          color={COLORS.secondary}
          fillOpacity={0.95}
          fontWeight={400}
        >
          {isMobile ?
            `I want to understand technology, not just use it.` :
            `I'm not someone who wants to simply use technology. I want to understand how it works, break it apart, and rebuild it.`}
        </Text>

        <Text
          position={[
            0,
            isMobile ? -2.4 : -2.3,
            0,
          ]}
          fontSize={isMobile ? 0.15 : 0.22}
          maxWidth={isMobile ? 7 : 10}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
          lineHeight={isMobile ? 1.6 : 1.5}
          color={COLORS.secondary}
          fillOpacity={0.9}
          fontWeight={400}
        >
          {isMobile ?
            `Goal: combine engineering and tech to build real solutions.` :
            `My goal is to combine engineering and technology to build things that feel futuristic but actually work.`}
        </Text>

        {/* Closing accent */}
        <Text
          position={[
            0,
            isMobile ? -3.5 : -3.5,
            0,
          ]}
          fontSize={isMobile ? 0.16 : 0.24}
          maxWidth={isMobile ? 7 : 9}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
          lineHeight={isMobile ? 1.6 : 1.5}
          color={COLORS.accentGlow}
          fillOpacity={0.9}
          fontWeight={600}
        >
          {isMobile ? `Learning. Building. Creating.` : `Still learning. Still building. Always creating.`}
        </Text>
      </group>
    </Scene>
  );
}

/* =========================================================
   PROJECT OBJECT — Enhanced with hover states and better visuals
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
  type: 
    | "box" 
    | "sphere" 
    | "torus" 
    | "octahedron" 
    | "dodecahedron" 
    | "cone" 
    | "cylinder" 
    | "torusKnot"
    | "icosahedron";
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
  const isHovered = useRef(false);
  const smoothScale = useRef(1);

  const statusColor = 
    status === "active" ? COLORS.accentGlow :
    status === "under construction" ? COLORS.indigo :
    COLORS.muted;

  useFrame((state) => {
    if (!mesh.current) return;

    // 🎯 Ultra-smooth floating with depth
    const targetY =
      position[1] +
      Math.sin(state.clock.elapsedTime * 1.2 + position[0]) *
        (isMobile ? 0.18 : 0.3);
    
    smoothY.current += (targetY - smoothY.current) * (isMobile ? 0.06 : 0.04);
    mesh.current.position.y = smoothY.current;

    // Smooth rotation
    const rotSpeed = isMobile ? 0.002 : 0.003;
    smoothRotX.current += rotSpeed;
    smoothRotY.current += rotSpeed * 1.6;
    
    mesh.current.rotation.x = smoothRotX.current;
    mesh.current.rotation.y = smoothRotY.current;

    // 🔥 NEW: Hover scale effect
    const targetScale = isHovered.current && active ? 1.25 : 1;
    smoothScale.current += (targetScale - smoothScale.current) * (isMobile ? 0.12 : 0.08);
    mesh.current.scale.setScalar(smoothScale.current);
  });

  const getGeometry = () => {
    const size = isMobile ? 0.8 : 1.2;
    switch(type) {
      case "box":
        return <boxGeometry args={[size, size, size]} />;
      case "sphere":
        return <sphereGeometry args={[isMobile ? 0.6 : 0.8, isMobile ? 16 : 32, isMobile ? 16 : 32]} />;
      case "torus":
        return <torusGeometry args={[isMobile ? 0.4 : 0.6, isMobile ? 0.15 : 0.2, isMobile ? 16 : 24, isMobile ? 24 : 48]} />;
      case "octahedron":
        return <octahedronGeometry args={[isMobile ? 0.6 : 0.8, 0]} />;
      case "dodecahedron":
        return <dodecahedronGeometry args={[isMobile ? 0.5 : 0.7, 0]} />;
      case "cone":
        return <coneGeometry args={[isMobile ? 0.4 : 0.6, isMobile ? 0.8 : 1.2, isMobile ? 16 : 32]} />;
      case "cylinder":
        return <cylinderGeometry args={[isMobile ? 0.35 : 0.5, isMobile ? 0.35 : 0.5, isMobile ? 0.8 : 1.2, isMobile ? 16 : 32]} />;
      case "torusKnot":
        return <torusKnotGeometry args={[isMobile ? 0.35 : 0.5, isMobile ? 0.1 : 0.15, isMobile ? 32 : 64, isMobile ? 6 : 8, 2, 3]} />;
      case "icosahedron":
        return <icosahedronGeometry args={[isMobile ? 0.5 : 0.7, 0]} />;
      default:
        return <boxGeometry args={[isMobile ? 0.8 : 1.0, isMobile ? 0.8 : 1.0, isMobile ? 0.8 : 1.0]} />;
    }
  };

  const nameFontSize = isMobile ? 0.19 : 0.27;
  const descFontSize = isMobile ? 0.11 : 0.14;
  const statusFontSize = isMobile ? 0.08 : 0.1;
  const yOffset = isMobile ? 1.3 : 1.8;
  const descOffset = isMobile ? 1.85 : 2.4;
  const statusOffset = isMobile ? 2.5 : 3.2;

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
          isHovered.current = true;
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          isHovered.current = false;
          document.body.style.cursor = "default";
        }}
      >
        {getGeometry()}

        <meshBasicMaterial
          color={COLORS.violet}
          wireframe
          transparent
          opacity={isHovered.current ? 1 : 0.8}
        />
      </mesh>

      {/* Project Name */}
      <Text
        position={[
          position[0],
          position[1] - yOffset,
          position[2],
        ]}
        fontSize={nameFontSize}
        maxWidth={isMobile ? 3 : 4}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.38}
        color={COLORS.secondary}
        fillOpacity={1.3}
        fontWeight={600}
      >
        {name}
      </Text>

      {/* Project Description */}
      <Text
        position={[
          position[0],
          position[1] - descOffset,
          position[2],
        ]}
        fontSize={descFontSize}
        maxWidth={isMobile ? 2.5 : 3.5}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
        lineHeight={1.4}
        color={COLORS.muted}
        fillOpacity={1}
        fontWeight={400}
      >
        {description}
      </Text>

      {/* Status Badge */}
      <Text
        position={[
          position[0],
          position[1] - statusOffset,
          position[2],
        ]}
        fontSize={statusFontSize}
        maxWidth={isMobile ? 2 : 3}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
        color={statusColor}
        fillOpacity={0.9}
        fontWeight={500}
      >
        {status === "active" ? "● ACTIVE" :
         status === "under construction" ? "◐ BUILDING" :
         "○ COMING"}
      </Text>
    </group>
  );
}

/* =========================================================
   PROJECTS — Enhanced section
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
          fontSize={isMobile ? 0.18 : 0.24}
          maxWidth={11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.5}
          color={COLORS.accentGlow}
          fillOpacity={0.8}
          fontWeight={500}
        >
          {`▪ 02 — SELECTED WORK ▪`}
        </Text>

        <Text
          position={[0, isMobile ? 2.2 : 3, 0]}
          fontSize={isMobile ? 0.9 : 1.35}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.03}
          lineHeight={1.15}
          color={COLORS.primary}
          fillOpacity={1.1}
          fontWeight="bold"
        >
          {`My Projects.`}
        </Text>

        <Text
          position={[0, isMobile ? 1.0 : 1.5, 0]}
          fontSize={isMobile ? 0.15 : 0.22}
          maxWidth={11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
          lineHeight={1.5}
          color={COLORS.secondary}
          fillOpacity={0.85}
          fontWeight={400}
        >
          {`A selection of experiments and creations`}
        </Text>

        <ProjectObject position={positions.perception as [number, number, number]} type="box" name="PERCEPTION" description={isMobile ? "This portfolio" : "This immersive 3D portfolio"} status="active" active={active} isMobile={isMobile} />
        <ProjectObject position={positions.moodify as [number, number, number]} type="sphere" name="MOODIFY" description={isMobile ? "Mood from text/audio" : "AI mood detection tool"} status="active" link="https://moodify-coral.vercel.app/" active={active} isMobile={isMobile} />
        <ProjectObject position={positions.matterology as [number, number, number]} type="dodecahedron" name="MATTEROLOGY" description={isMobile ? "Matter simulator" : "Physics simulation tool"} status="under construction" active={active} isMobile={isMobile} />
        <ProjectObject position={positions.neural as [number, number, number]} type="torusKnot" name={isMobile ? "NEURAL J." : "NEURAL JELLYFISH"} description={isMobile ? "AI learning buddy" : "Adaptive AI companion"} status="upcoming" active={active} isMobile={isMobile} />
        <ProjectObject position={positions.holoverse as [number, number, number]} type="octahedron" name="HOLOVERSE" description={isMobile ? "Hand gesture OS" : "Gesture-driven interface"} status="upcoming" active={active} isMobile={isMobile} />
      </group>
    </Scene>
  );
}

/* =========================================================
   DREAMS — Enhanced with better typography
========================================================= */

function Dreams() {
  const { isMobile } = useDeviceDetect();

  return (
    <Scene scene={JOURNEY.dreams}>
      <group position={[0, 0, JOURNEY.dreams.z]} scale={isMobile ? 0.65 : 0.85}>
        <Text
          position={[0, isMobile ? 2.8 : 3.2, 0]}
          fontSize={isMobile ? 0.15 : 0.21}
          maxWidth={11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.4}
          color={COLORS.accentGlow}
          fillOpacity={0.8}
          fontWeight={500}
        >
          {`▪ 03 — THE NEXT HORIZON ▪`}
        </Text>

        <Text
          position={[0, isMobile ? 1.8 : 2, 0]}
          fontSize={isMobile ? 0.48 : 0.65}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
          lineHeight={1.15}
          color={COLORS.primary}
          fillOpacity={1.1}
          fontWeight="bold"
        >
          {`✦ DREAMS ✦`}
        </Text>

        <Text
          position={[0, isMobile ? -0.5 : 0, 0]}
          fontSize={isMobile ? 0.07 : 0.11}
          maxWidth={isMobile ? 11 : 20}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.04}
          lineHeight={isMobile ? 2.1 : 1.7}
          color={COLORS.secondary}
          fillOpacity={1}
          fontWeight={400}
        >
          {isMobile ? 
            `🚗 Automotive & Engineering
Build next-gen mobility technology.

🤖 AI & Robotics
Create intelligent systems that feel alive.

💻 Technology & Creation
Master code, build ideas into reality.

🌌 Physics & Astronomy
Explore and understand the universe.

🚀 My Own Creation
Build something meaningful and remembered.`
            :
            `🚗 Automotive & Engineering — Build next-generation mobility technology and shape the future.

🤖 AI & Robotics — Create intelligent systems and turn futuristic ideas into living reality.

💻 Technology & Creation — Master technology and turn my own ideas into real, working projects.

🌌 Physics & Astronomy — Keep exploring the universe and never stop asking bigger questions.

🚀 My Own Creation — Build something truly mine—meaningful, innovative, and remembered forever.`}
        </Text>

        <Text
          position={[0, isMobile ? -6.0 : -2.6, 0]}
          fontSize={isMobile ? 0.15 : 0.24}
          maxWidth={isMobile ? 9 : 13}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
          lineHeight={1.5}
          color={COLORS.accentGlow}
          fillOpacity={0.7}
          fontWeight={500}
        >
          {`Never stop asking questions.`}
        </Text>
      </group>
    </Scene>
  );
}

/* =========================================================
   CONTACT — Enhanced with better styling
========================================================= */

function Contact() {
  const { isMobile } = useDeviceDetect();

  return (
    <Scene scene={JOURNEY.contact}>
      <group position={[0, 0, JOURNEY.contact.z]} scale={isMobile ? 0.65 : 0.85}>
        <Text
          position={[0, isMobile ? 1.4 : 1.8, 0]}
          fontSize={isMobile ? 0.09 : 0.12}
          maxWidth={11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.4}
          color={COLORS.accentGlow}
          fillOpacity={0.8}
          fontWeight={500}
        >
          {`▪ 04 — CONTACT ▪`}
        </Text>

        <Text
          position={[0, isMobile ? 0.7 : 1, 0]}
          fontSize={isMobile ? 0.32 : 0.38}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
          lineHeight={1.15}
          color={COLORS.primary}
          fillOpacity={1.1}
          fontWeight="bold"
        >
          {`Let's create something.`}
        </Text>

        <Text
          position={[0, isMobile ? 0.4 : 0.7, 0]}
          fontSize={isMobile ? 0.1 : 0.14}
          maxWidth={11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
          lineHeight={1.6}
          color={COLORS.secondary}
          fillOpacity={0.65}
          fontWeight={400}
        >
          {`Open to collaborations and interesting conversations`}
        </Text>

        <group position={[0, isMobile ? -0.2 : 0, 0]}>
          {/* GitHub */}
          <Text
            position={[isMobile ? -0.9 : -1.3, 0, 0]}
            fontSize={isMobile ? 0.08 : 0.11}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.4}
            color={COLORS.accentGlow}
            fillOpacity={0.85}
            fontWeight={600}
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
            → GITHUB
          </Text>

          {/* Instagram */}
          <Text
            position={[0, 0, 0]}
            fontSize={isMobile ? 0.08 : 0.11}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.4}
            color={COLORS.violet}
            fillOpacity={0.85}
            fontWeight={600}
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
            → INSTAGRAM
          </Text>

          {/* Email */}
          <Text
            position={[isMobile ? 0.9 : 1.5, 0, 0]}
            fontSize={isMobile ? 0.08 : 0.11}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.4}
            color={COLORS.indigo}
            fillOpacity={0.85}
            fontWeight={600}
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
            → EMAIL
          </Text>
        </group>

        <Text
          position={[0, isMobile ? -1.4 : -1, 0]}
          fontSize={isMobile ? 0.08 : 0.11}
          maxWidth={11}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.04}
          lineHeight={1.5}
          color={COLORS.muted}
          fillOpacity={0.45}
          fontWeight={400}
        >
          {`Reach out for ideas, questions, or just to say hello`}
        </Text>
      </group>
    </Scene>
  );
}

/* =========================================================
   PARTICLES — Enhanced with better depth perception
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

      const targetX = rx + ox * 0.05 * smoothScrollSpeed.current * 0.02;
      const targetY = ry + oy * 0.05 * smoothScrollSpeed.current * 0.02;
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
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>

      <pointsMaterial
        color={COLORS.accentGlow}
        size={isMobile ? 0.013 : 0.018}
        sizeAttenuation
        transparent
        opacity={isMobile ? 0.5 : 0.7}
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
          "radial-gradient(circle at 50% 50%, #1a0f2e 0%, #0a050f 45%, #020204 100%)",
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
        <About />
        <Projects />
        <Dreams />
        <Contact />

        <Particles />
      </Canvas>

      <Audio />
    </div>
  );
}
