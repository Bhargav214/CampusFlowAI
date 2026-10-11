import { useMemo } from "react";

const PARTICLE_COUNT = 80;

const PARTICLE_POSITIONS = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const phase = index / PARTICLE_COUNT;
    return [
        (phase - 0.5) * 14,
        Math.sin(index * 1.37) * 3.5,
        Math.cos(index * 1.13) * 4,
    ];
});

export default function FloatingParticles() {
    const particles = useMemo(() => PARTICLE_POSITIONS, []);

    return (
        <group>
            {particles.map((position, index) => (
                <mesh key={index} position={position}>
                    <sphereGeometry args={[0.025, 8, 8]} />
                    <meshBasicMaterial color="#38bdf8" />
                </mesh>
            ))}
        </group>
    );
}