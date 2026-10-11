import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Text } from "@react-three/drei";

function Building() {
    return (
        <group>
            {/* Main building */}
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[3, 1.6, 2]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            {/* Roof */}
            <mesh position={[0, 1.9, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[2.3, 1.2, 4]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            {/* Door */}
            <mesh position={[0, 0.35, 1.03]}>
                <boxGeometry args={[0.6, 0.9, 0.08]} />
                <meshStandardMaterial color="#38bdf8" />
            </mesh>
            {/* Windows */}
            <mesh position={[-0.9, 1, 1.03]}>
                <boxGeometry args={[0.45, 0.45, 0.08]} />
                <meshStandardMaterial color="#7dd3fc" />
            </mesh>
            <mesh position={[0.9, 1, 1.03]}>
                <boxGeometry args={[0.45, 0.45, 0.08]} />
                <meshStandardMaterial color="#7dd3fc" />
            </mesh>
        </group>
    );
}

function StatLabel({ position, title, value, onClick }) {
    return (
        <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
            <group position={position} onClick={onClick}>
                <Text fontSize={0.28} color="white" anchorX="center" anchorY="middle">
                    {title}
                </Text>
                <Text position={[0, -0.4, 0]} fontSize={0.45} color="#38bdf8" anchorX="center" anchorY="middle">
                    {value}
                </Text>
            </group>
        </Float>
    );
}

export default function CampusScene({
    students,
    attendance,
    marks,
    risk,
    totalStudents,
    averageMarks,
    highRisk,
    onNodeClick
}) {
    // Fallback props mapping to ensure compatibility with all parent components
    const finalStudents = students ?? totalStudents ?? 0;
    const finalAttendance = attendance ?? 0;
    const finalMarks = marks ?? averageMarks ?? 0;
    const finalRisk = risk ?? highRisk ?? 0;

    const formattedAttendance = typeof finalAttendance === "string" && finalAttendance.includes("%")
        ? finalAttendance
        : `${Number(finalAttendance || 0).toFixed(2)}%`;

    return (
        <div className="h-[420px] w-full overflow-hidden rounded-3xl bg-slate-950">
            <Canvas camera={{ position: [7, 5, 8], fov: 45 }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 8, 5]} intensity={2} />
                <pointLight position={[0, 4, 2]} intensity={2} />
                
                <Building />

                <StatLabel 
                    position={[-3, 2.5, 0]} 
                    title="Students" 
                    value={finalStudents} 
                    onClick={() => onNodeClick?.("students")}
                />
                <StatLabel 
                    position={[3, 2.5, 0]} 
                    title="Attendance" 
                    value={formattedAttendance} 
                    onClick={() => onNodeClick?.("attendance")}
                />
                <StatLabel 
                    position={[-3, 0.5, 0]} 
                    title="Average Marks" 
                    value={finalMarks} 
                    onClick={() => onNodeClick?.("marks")}
                />
                <StatLabel 
                    position={[3, 0.5, 0]} 
                    title="High Risk" 
                    value={finalRisk} 
                    onClick={() => onNodeClick?.("risk")}
                />

                <OrbitControls 
                    enableZoom={false} 
                    minPolarAngle={Math.PI / 3} 
                    maxPolarAngle={Math.PI / 2} 
                />
            </Canvas>
        </div>
    );
}