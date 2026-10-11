import { useEffect, useState } from "react";
import {
    FileText,
    Users,
    CalendarCheck,
    Brain,
    Download,
} from "lucide-react";

import api from "../services/api";
import "./Pages.css";

export default function ReportsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    "/analytics/faculty-dashboard"
                );

                setData(response.data);
            } catch (err) {
                console.error("Report data error:", err);
                setError("Unable to load report data.");
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    const downloadReport = async (type) => {
        try {
            const response = await api.get(`/reports/${type}`, {
                responseType: "blob",
            });

            const blob = new Blob([response.data]);

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `${type}-report.pdf`;

            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Report download error:", error);
            alert("Unable to generate report.");
        }
    };

    if (loading) {
        return (
            <div className="cf-page">
                <div className="cf-loading">
                    Loading reports...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cf-page">
                <div className="cf-error">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="cf-page">

            {/* Header */}
            <div className="cf-page-header">
                <div>
                    <div className="cf-eyebrow">
                        Academic Intelligence
                    </div>

                    <h1 className="cf-page-title">
                        Reports
                    </h1>

                    <p className="cf-page-subtitle">
                        Generate academic and AI-powered reports
                        from CampusFlow.
                    </p>
                </div>
            </div>

            {/* Report Cards */}
            <div className="report-card-grid">

                <ReportCard
                    icon={CalendarCheck}
                    title="Attendance Report"
                    description="Student attendance summary"
                    onClick={() =>
                        downloadReport("attendance")
                    }
                />

                <ReportCard
                    icon={FileText}
                    title="Marks Report"
                    description="Academic performance summary"
                    onClick={() =>
                        downloadReport("marks")
                    }
                />

                <ReportCard
                    icon={Brain}
                    title="AI Risk Report"
                    description="Students requiring attention"
                    onClick={() =>
                        downloadReport("risk")
                    }
                />

                <ReportCard
                    icon={Users}
                    title="Student Report"
                    description="Complete student performance"
                    onClick={() =>
                        downloadReport("students")
                    }
                />

            </div>

            {/* Academic Overview */}
            <section className="report-section">

                <h2 className="report-section-title">
                    Academic Overview
                </h2>

                <div className="report-metrics">

                    <Metric
                        label="Total Students"
                        value={data?.total_students ?? 0}
                    />

                    <Metric
                        label="Average Attendance"
                        value={`${data?.average_attendance ?? 0}%`}
                    />

                    <Metric
                        label="Average Marks"
                        value={data?.average_marks ?? 0}
                    />

                </div>
            </section>

            {/* Risk Summary */}
            <section className="report-section report-risk-section">

                <div className="report-risk-header">

                    <div>
                        <h2 className="report-section-title">
                            AI Risk Summary
                        </h2>

                        <p className="report-section-copy">
                            Students currently requiring
                            academic attention.
                        </p>
                    </div>

                    <span className="report-risk-count">
                        {data?.high_risk ?? 0} High Risk
                    </span>

                </div>

                <div className="cf-table-wrapper">

                    <table className="cf-table report-risk-table">

                        <thead>
                            <tr>

                                <th>
                                    Roll No
                                </th>

                                <th>
                                    Student
                                </th>

                                <th>
                                    Attendance
                                </th>

                                <th>
                                    Marks
                                </th>

                                <th>
                                    Risk
                                </th>

                            </tr>
                        </thead>

                        <tbody>

                            {(data?.risk_students ?? []).map(
                                (student, index) => (

                                    <tr
                                        key={student.id || index}
                                        
                                    >

                                        <td>
                                            {student.roll_no || "—"}
                                        </td>

                                        <td className="report-student-name">
                                            {student.name || "Unknown Student"}
                                        </td>

                                        <td>
                                            {student.attendance ?? 0}%
                                        </td>

                                        <td>
                                            {student.average_marks ?? 0}
                                        </td>

                                        <td>

                                            <span className="cf-badge cf-badge-red">
                                                {student.risk || "High"}
                                            </span>

                                        </td>

                                    </tr>

                                )
                            )}

                            {(!data?.risk_students ||
                                data.risk_students.length === 0) && (

                                <tr>
                                    <td
                                        colSpan="5"
                                        className="report-empty"
                                    >
                                        No students currently require attention.
                                    </td>
                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>
            </section>

        </div>
    );
}


function ReportCard({
    icon: Icon,
    title,
    description,
    onClick,
}) {
    return (
        <article className="report-card">

            <Icon
                size={28}
                className="report-card-icon"
            />

            <h3 className="report-card-title">
                {title}
            </h3>

            <p className="report-card-description">
                {description}
            </p>

            <button
                onClick={onClick}
                className="report-generate-button"
            >
                <Download size={17} />
                Generate Report
            </button>

        </article>
    );
}


function Metric({ label, value }) {
    return (
        <div className="report-metric">

            <p className="report-metric-label">
                {label}
            </p>

            <p className="report-metric-value">
                {value}
            </p>

        </div>
    );
}