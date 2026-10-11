export default function AnalyticsDetailPanel({ selectedNode, data, riskData, onClose }) {
    if (!selectedNode) return null;

    const panels = {
        students: {
            title: "Student Analytics",
            description: "Current student population",
            value: data?.total_students ?? 0
        },
        attendance: {
            title: "Attendance Analytics",
            description: "Average student attendance",
            value: `${Number(data?.average_attendance ?? 0).toFixed(2)}%`
        },
        marks: {
            title: "Academic Performance",
            description: "Average academic marks",
            value: Number(data?.average_marks ?? 0).toFixed(2)
        },
        risk: {
            title: "Academic Risk",
            description: "Students requiring intervention",
            value: riskData?.high_risk ?? 0
        }
    };

    const panel = panels[selectedNode];
    if (!panel) return null;

    return (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{panel.title}</h2>
                    <p className="text-sm text-slate-500">{panel.description}</p>
                </div>
                <button onClick={onClose} className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100">
                    ✕
                </button>
            </div>
            <div className="mt-6 text-4xl font-bold text-slate-900">{panel.value}</div>
        </div>
    );
}