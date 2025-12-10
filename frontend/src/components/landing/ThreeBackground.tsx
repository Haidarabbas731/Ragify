import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Create a circular particle texture
function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(147, 51, 234, 1)');
  gradient.addColorStop(0.3, 'rgba(147, 51, 234, 0.8)');
  gradient.addColorStop(0.6, 'rgba(168, 85, 247, 0.4)');
  gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(32, 32, 32, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function Particles({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  const texture = useMemo(() => createCircleTexture(), []);

  const { positions, speeds, offsets } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
      speeds[i] = 0.3 + Math.random() * 0.8;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    return { positions, speeds, offsets };
  }, [count]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const positionAttr = pointsRef.current.geometry.attributes.position;
    const posArray = positionAttr.array as Float32Array;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Floating motion
      posArray[i3 + 1] += Math.sin(time * speeds[i] + offsets[i]) * 0.008;
      posArray[i3] += Math.cos(time * speeds[i] * 0.5 + offsets[i]) * 0.004;

      // Mouse influence (subtle parallax)
      posArray[i3] += (mouseRef.current.x * viewport.width * 0.3 - posArray[i3]) * 0.0003;
      posArray[i3 + 1] += (mouseRef.current.y * viewport.height * 0.3 - posArray[i3 + 1]) * 0.0003;

      // Wrap around bounds
      if (posArray[i3 + 1] > 25) posArray[i3 + 1] = -25;
      if (posArray[i3 + 1] < -25) posArray[i3 + 1] = 25;
      if (posArray[i3] > 25) posArray[i3] = -25;
      if (posArray[i3] < -25) posArray[i3] = 25;
    }

    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        map={texture}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function ThreeBackground() {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const checkMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    checkMobile();
    setPrefersReducedMotion(checkMotion.matches);

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render until mounted (SSR safety)
  if (!mounted) return null;

  // CSS fallback for mobile or reduced motion
  if (isMobile || prefersReducedMotion) {
    return <CSSBackground />;
  }

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
      <div className="absolute inset-0 bg-background" />
      <Canvas
        camera={{ position: [0, 0, 20], fov: 75 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Particles count={80} />
      </Canvas>
    </div>
  );
}

function CSSBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full blur-3xl animate-float" />
      <div className="absolute top-1/3 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-500/15 to-violet-500/15 rounded-full blur-3xl animate-float-reverse" />
      <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-violet-500/15 to-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl animate-float-reverse" style={{ animationDelay: '-5s' }} />
    </div>
  );
}

export default ThreeBackground;
