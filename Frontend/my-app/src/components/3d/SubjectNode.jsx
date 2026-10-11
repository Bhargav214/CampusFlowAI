import { Html } from "@react-three/drei";
import { useState } from "react";

export default function SubjectNode({ position, subject, marks, onClick }) {
    const [hovered, setHovered] = useState(false);
    const percentage = Math.min(Number(marks || 0), 100);
    const color = percentage >= 75 ? "#22c55e" : percentage >= 60 ? "#f59e0b" : "#ef4444";

    return (
        <group position={position}>
            <mesh
                scale={hovered ? 1.3 : 1}
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
                    console.log("Clicked Subject Node:", subject); // Useful test log
                    onClick?.();
                }}
            >
                <sphereGeometry args={[0.25, 24, 24]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 2 : 0.8} />
            </mesh>
            <Html position={[0, 0.5, 0]} center distanceFactor={8}>
                <div className="pointer-events-none whitespace-nowrap rounded-lg bg-slate-950/90 px-3 py-2 text-center shadow-lg">
                    <div className="text-xs text-slate-400">{subject}</div>
                    <div className="font-bold" style={{ color }}>{percentage.toFixed(2)}</div>
                </div>
            </Html>
        </group>
    );
}