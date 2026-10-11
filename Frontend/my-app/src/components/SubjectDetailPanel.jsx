export default function SubjectDetailPanel({ subject, onClose }) {
    if (!subject) return null;

    const marks = Number(subject.average_marks || 0);
    const status = marks >= 75 ? "Strong" : marks >= 60 ? "Moderate" : "Needs Attention";

    return (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{subject.subject}</h2>
                    <p className="text-sm text-slate-500">Subject performance analysis</p>
                </div>
                <button onClick={onClose} className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100">
                    ✕
                </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Average Marks</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{marks.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Performance</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{status}</p>
                </div>
            </div>
        </div>
    );
}