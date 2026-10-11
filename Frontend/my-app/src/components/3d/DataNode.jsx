import { Html } from "@react-three/drei";
import { useState } from "react";

export default function DataNode({ position, label, value, color = "#38bdf8", onClick }) {
    const [hovered, setHovered] = useState(false);

    return (
        <group position={position}>
            <mesh
                scale={hovered ? 1.35 : 1}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = "default";
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    console.log("Clicked Data Node:", label); // Useful test log
                    onClick?.();
                }}
            >
                <sphereGeometry args={[0.35, 32, 32]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 2 : 0.7} metalness={0.5} roughness={0.2} />
            </mesh>
            <Html distanceFactor={8} position={[0, 0.65, 0]} center>
                <div className="pointer-events-none whitespace-nowrap rounded-xl border border-white/20 bg-slate-950/90 px-4 py-2 text-center shadow-xl">
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="text-lg font-bold" style={{ color }}>{value}</div>
                </div>
            </Html>
        </group>
    );
}