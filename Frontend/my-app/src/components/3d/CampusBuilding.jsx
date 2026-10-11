import { Float } from "@react-three/drei";

export default function CampusBuilding() {
    return (
        <Float
            speed={1}
            rotationIntensity={0.15}
            floatIntensity={0.25}
        >
            <group>
                {/* Main Building */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[4, 2.5, 3]} />
                    <meshStandardMaterial
                        color="#172554"
                        metalness={0.5}
                        roughness={0.25}
                    />
                </mesh>

                {/* Roof */}
                <mesh
                    position={[0, 1.7, 0]}
                    rotation={[0, 0, 0]}
                >
                    <coneGeometry args={[3, 1.2, 4]} />
                    <meshStandardMaterial
                        color="#2563eb"
                        metalness={0.6}
                        roughness={0.2}
                    />
                </mesh>

                {/* Entrance */}
                <mesh position={[0, -0.25, 1.55]}>
                    <boxGeometry args={[1, 1.5, 0.1]} />
                    <meshStandardMaterial
                        color="#38bdf8"
                        emissive="#0284c7"
                        emissiveIntensity={2}
                    />
                </mesh>

                {/* Left Wing */}
                <mesh position={[-2.5, 0, 0]}>
                    <boxGeometry args={[1, 1.8, 2.5]} />
                    <meshStandardMaterial color="#1e3a8a" />
                </mesh>

                {/* Right Wing */}
                <mesh position={[2.5, 0, 0]}>
                    <boxGeometry args={[1, 1.8, 2.5]} />
                    <meshStandardMaterial color="#1e3a8a" />
                </mesh>
            </group>
        </Float>
    );
}