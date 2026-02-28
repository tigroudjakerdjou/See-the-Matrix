import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const P_COUNT = 30000;

const PHASES = [
    {
        name: "La Danse d'Or",
        desc: "La matière n'est qu'une fréquence, et la fréquence n'est qu'une danse de lumière infinie.",
        shape: "fabric", color: "gold", chaos: 60, speed: 2.0, log: "Harmonique"
    },
    {
        name: "Symphonie Spectrale",
        desc: "Des nuages de probabilités où chaque particule existe partout à la fois.",
        shape: "nebula", color: "aurora", chaos: 180, speed: 3.5, log: "Instable"
    },
    {
        name: "Réseau de Diamant",
        desc: "L'ordre émerge du chaos. Une structure cristalline parfaite et immuable.",
        shape: "grid", color: "diamond", chaos: 10, speed: 0.5, log: "Cristallisé"
    },
    {
        name: "Impulsion Néon",
        desc: "L'énergie pure circulant dans les veines d'une cité cybernétique oubliée.",
        shape: "wave", color: "neon", chaos: 90, speed: 4.0, log: "Énergétique"
    },
    {
        name: "Singularité Noire",
        desc: "Au-delà de l'horizon des événements, là où le temps et l'espace s'effondrent.",
        shape: "singularity", color: "void", chaos: 250, speed: 6.0, log: "Critique"
    }
];

const nodeVertex = `
    attribute vec3 targetPosition;
    attribute vec3 targetColor;
    varying vec3 vColor;
    uniform float uTime;
    uniform float uMorph;
    uniform float uChaos;
    void main() {
        vec3 pos = mix(position, targetPosition, uMorph);
        float noise = sin(pos.x * 0.01 + uTime) * cos(pos.y * 0.01 + uTime) * uChaos;
        pos += normalize(pos) * noise;
        vColor = mix(color, targetColor, uMorph);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = 2.0 + sin(uTime + length(pos)*0.005) * 1.5;
    }
`;

const nodeFragment = `
    varying vec3 vColor;
    void main() {
        float dist = distance(gl_PointCoord, vec2(0.5));
        if (dist > 0.5) discard;
        gl_FragColor = vec4(vColor, 1.0 - dist * 2.0);
    }
`;

const lineVertex = `
    attribute vec3 targetPosition;
    uniform float uTime;
    uniform float uMorph;
    uniform float uChaos;
    void main() {
        vec3 pos = mix(position, targetPosition, uMorph);
        float noise = sin(pos.x * 0.01 + uTime) * cos(pos.y * 0.01 + uTime) * uChaos;
        pos += normalize(pos) * noise;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const lineFragment = `
    uniform vec3 uColor;
    void main() {
        gl_FragColor = vec4(uColor, 0.15);
    }
`;

export default function App() {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);
    const meshLinesRef = useRef<THREE.LineSegments | null>(null);
    const nodeMatRef = useRef<THREE.ShaderMaterial | null>(null);
    const lineMatRef = useRef<THREE.ShaderMaterial | null>(null);
    const clockRef = useRef(new THREE.Clock());
    const mouseRef = useRef({ x: 0, y: 0 });

    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [cycle, setCycle] = useState(1);
    const [isTransmuting, setIsTransmuting] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
        camera.position.z = 2500;
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(P_COUNT * 3);
        const targetPos = new Float32Array(P_COUNT * 3);
        const colors = new Float32Array(P_COUNT * 3);
        const targetCols = new Float32Array(P_COUNT * 3);

        const initialPhase = PHASES[0];
        const c = new THREE.Color();
        for (let i = 0; i < P_COUNT; i++) {
            const i3 = i * 3;
            const size = Math.sqrt(P_COUNT);
            const x = (i % size - size / 2) * 40;
            const y = (Math.floor(i / size) - size / 2) * 40;
            pos[i3] = x; pos[i3 + 1] = y; pos[i3 + 2] = Math.sin(x * 0.005) * 400;

            c.setHSL(0.12, 0.9, 0.4 + Math.random() * 0.4);
            colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('targetPosition', new THREE.BufferAttribute(targetPos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('targetColor', new THREE.BufferAttribute(targetCols, 3));

        const nodeMat = new THREE.ShaderMaterial({
            vertexShader: nodeVertex,
            fragmentShader: nodeFragment,
            uniforms: {
                uTime: { value: 0 },
                uMorph: { value: 0 },
                uChaos: { value: initialPhase.chaos }
            },
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        nodeMatRef.current = nodeMat;

        const particles = new THREE.Points(geo, nodeMat);
        scene.add(particles);
        particlesRef.current = particles;

        // Lines for structure
        const lineGeo = new THREE.BufferGeometry();
        const lineIndices = [];
        for (let i = 0; i < P_COUNT - 1; i++) {
            if (Math.random() > 0.98) {
                lineIndices.push(i, i + 1);
            }
        }
        lineGeo.setIndex(lineIndices);
        lineGeo.setAttribute('position', geo.getAttribute('position'));
        lineGeo.setAttribute('targetPosition', geo.getAttribute('targetPosition'));

        const lineMat = new THREE.ShaderMaterial({
            vertexShader: lineVertex,
            fragmentShader: lineFragment,
            uniforms: {
                uTime: { value: 0 },
                uMorph: { value: 0 },
                uChaos: { value: initialPhase.chaos },
                uColor: { value: new THREE.Color(0xaaaaaa) }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        lineMatRef.current = lineMat;

        const meshLines = new THREE.LineSegments(lineGeo, lineMat);
        scene.add(meshLines);
        meshLinesRef.current = meshLines;

        const onResize = () => {
            if (!cameraRef.current || !rendererRef.current) return;
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        };

        const onMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = (e.clientX - window.innerWidth / 2) * 2;
            mouseRef.current.y = (e.clientY - window.innerHeight / 2) * 2;
        };

        window.addEventListener('resize', onResize);
        document.addEventListener('mousemove', onMouseMove);

        let rafId: number;
        const animate = () => {
            rafId = requestAnimationFrame(animate);
            const time = clockRef.current.getElapsedTime();

            if (nodeMatRef.current) nodeMatRef.current.uniforms.uTime.value = time;
            if (lineMatRef.current) lineMatRef.current.uniforms.uTime.value = time;

            if (particlesRef.current && meshLinesRef.current) {
                particlesRef.current.rotation.y += 0.001;
                particlesRef.current.rotation.z += 0.0005 * Math.sin(time * 0.2);
                meshLinesRef.current.rotation.y = particlesRef.current.rotation.y;
                meshLinesRef.current.rotation.z = particlesRef.current.rotation.z;
            }

            if (cameraRef.current) {
                cameraRef.current.position.x += (mouseRef.current.x - cameraRef.current.position.x) * 0.03;
                cameraRef.current.position.y += (-mouseRef.current.y - cameraRef.current.position.y) * 0.03;
                cameraRef.current.position.z = 2500 + Math.sin(time * 0.5) * 100;
                cameraRef.current.lookAt(0, 0, 0);
            }

            if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
        };
        animate();

        return () => {
            window.removeEventListener('resize', onResize);
            document.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(rafId);

            // Cleanup Three.js resources
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });

            if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current.forceContextLoss();
                if (containerRef.current) containerRef.current.removeChild(rendererRef.current.domElement);
            }
        };
    }, []);

    const transmute = () => {
        if (isTransmuting) return;
        setIsTransmuting(true);

        const nextCycle = cycle + 1;
        setCycle(nextCycle);
        const nextIndex = (currentPhaseIndex + 1) % PHASES.length;
        setCurrentPhaseIndex(nextIndex);

        const phase = PHASES[nextIndex];
        const particles = particlesRef.current;
        if (!particles || !nodeMatRef.current || !lineMatRef.current) return;

        const geo = particles.geometry;
        const targets = geo.attributes.targetPosition.array as Float32Array;
        const targetColors = geo.attributes.targetColor.array as Float32Array;

        const generatePositions = (type: string, array: Float32Array) => {
            for (let i = 0; i < P_COUNT; i++) {
                const i3 = i * 3;
                if (type === 'fabric') {
                    const size = Math.sqrt(P_COUNT);
                    const x = (i % size - size / 2) * 40;
                    const y = (Math.floor(i / size) - size / 2) * 40;
                    array[i3] = x; array[i3 + 1] = y; array[i3 + 2] = Math.sin(x * 0.005) * 400;
                } else if (type === 'grid') {
                    const s = Math.ceil(Math.pow(P_COUNT, 1 / 3));
                    const step = 120;
                    array[i3] = (i % s - s / 2) * step;
                    array[i3 + 1] = (Math.floor(i / s) % s - s / 2) * step;
                    array[i3 + 2] = (Math.floor(i / (s * s)) - s / 2) * step;
                } else if (type === 'wave') {
                    const r = (i / P_COUNT) * 6000;
                    const th = i * 0.1;
                    array[i3] = Math.cos(th) * r; array[i3 + 1] = Math.sin(r * 0.01) * 1000; array[i3 + 2] = Math.sin(th) * r;
                } else if (type === 'singularity') {
                    const r = Math.pow(Math.random(), 6) * 10000;
                    const th = Math.random() * Math.PI * 2;
                    const ph = Math.random() * Math.PI;
                    array[i3] = r * Math.sin(ph) * Math.cos(th); array[i3 + 1] = r * Math.sin(ph) * Math.sin(th); array[i3 + 2] = r * Math.cos(ph);
                } else {
                    const r = 300 + Math.random() * 3000;
                    const th = Math.random() * Math.PI * 2;
                    const ph = Math.random() * Math.PI;
                    array[i3] = r * Math.sin(ph) * Math.cos(th); array[i3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.5; array[i3 + 2] = r * Math.cos(ph);
                }
            }
        };

        const setColors = (theme: string, array: Float32Array) => {
            const c = new THREE.Color();
            for (let i = 0; i < P_COUNT; i++) {
                const i3 = i * 3;
                if (theme === 'gold') c.setHSL(0.12, 0.9, 0.4 + Math.random() * 0.4);
                else if (theme === 'aurora') c.setHSL((i / P_COUNT + Math.random() * 0.3) % 1, 0.9, 0.6);
                else if (theme === 'diamond') c.setHSL(0.55, 0.4, 0.8 + Math.random() * 0.2);
                else if (theme === 'neon') c.setHSL(0.85, 1.0, 0.6);
                else if (theme === 'void') c.setHSL(0.75, 0.8, 0.3 + Math.random() * 0.4);
                else c.setRGB(0.9, 0.9, 1.0);
                array[i3] = c.r; array[i3 + 1] = c.g; array[i3 + 2] = c.b;
            }
        };

        generatePositions(phase.shape, targets);
        geo.attributes.targetPosition.needsUpdate = true;
        setColors(phase.color, targetColors);
        geo.attributes.targetColor.needsUpdate = true;

        let start = clockRef.current.getElapsedTime();
        const dur = 2.5;

        const anim = () => {
            let elapsed = clockRef.current.getElapsedTime() - start;
            let t = Math.min(elapsed / dur, 1);
            let ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            if (nodeMatRef.current) nodeMatRef.current.uniforms.uMorph.value = ease;
            if (lineMatRef.current) lineMatRef.current.uniforms.uMorph.value = ease;

            let chaosSpike = Math.sin(t * Math.PI) * 150;
            if (nodeMatRef.current) nodeMatRef.current.uniforms.uChaos.value = phase.chaos + chaosSpike;
            if (lineMatRef.current) lineMatRef.current.uniforms.uChaos.value = phase.chaos + chaosSpike;

            if (t < 1) {
                requestAnimationFrame(anim);
            } else {
                const p = geo.attributes.position.array as Float32Array;
                for (let i = 0; i < p.length; i++) p[i] = targets[i];
                geo.attributes.position.needsUpdate = true;

                const cArr = geo.attributes.color.array as Float32Array;
                for (let i = 0; i < cArr.length; i++) cArr[i] = targetColors[i];
                geo.attributes.color.needsUpdate = true;

                if (nodeMatRef.current) {
                    nodeMatRef.current.uniforms.uMorph.value = 0;
                    nodeMatRef.current.uniforms.uChaos.value = phase.chaos;
                }
                if (lineMatRef.current) {
                    lineMatRef.current.uniforms.uMorph.value = 0;
                    lineMatRef.current.uniforms.uChaos.value = phase.chaos;
                }

                setIsTransmuting(false);
            }
        };
        anim();
    };

    const currentPhase = PHASES[currentPhaseIndex];

    return (
        <div className="text-white bg-black w-full h-full overflow-hidden relative">
            <div className="scanline"></div>
            <div className="noise-overlay"></div>

            <div className="absolute inset-0 z-20 hud-overlay flex flex-col justify-between p-8 md:p-12">
                <div className="flex justify-between items-start w-full">
                    <h1 className="text-[8px] font-bold uppercase tracking-[1em] opacity-40">Neuro-OS</h1>
                    <div className="text-[8px] font-mono opacity-20 text-right leading-relaxed tracking-[0.3em] uppercase hidden md:block">
                        Entropie: <span className="text-white">{currentPhase.chaos > 100 ? 'Élevée' : 'Basse'}</span><br />
                        Résonance: <span className="text-white">{currentPhase.log}</span><br />
                        Séquence: <span className="text-cyan-400">{cycle}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center text-center mt-auto mb-32 pointer-events-none">
                    <div className="quantum-title text-2xl md:text-4xl font-light uppercase text-white mb-4">
                        {currentPhase.name}
                    </div>
                    <p className="quantum-desc text-xs md:text-sm opacity-50 font-light tracking-widest italic max-w-lg">
                        {currentPhase.desc}
                    </p>
                </div>
            </div>

            <div className="absolute bottom-12 inset-x-0 z-30 flex flex-col items-center">
                <button
                    onClick={transmute}
                    disabled={isTransmuting}
                    className="evolve-btn w-20 h-20 rounded-full flex items-center justify-center pointer-events-auto group"
                    aria-label="Transcender"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/70 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </button>
                <div className="mt-6 text-[8px] uppercase tracking-[1em] opacity-30 font-light">Transcender</div>
            </div>

            <div ref={containerRef} className="absolute inset-0" />
        </div>
    );
}
