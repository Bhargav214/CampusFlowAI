import { useEffect, useMemo, useState } from "react";

import {
  Search,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import api from "../services/api";
import "./Pages.css";

function normalizeData(data) {
  if (Array.isArray(data)) return data;

  return (
    data?.attendance ||
    data?.students ||
    data?.records ||
    data?.data ||
    data?.results ||
    []
  );
}

function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [attendanceResponse, studentsResponse] =
          await Promise.all([
            api.get("/attendance/"),
            api.get("/students/"),
          ]);

        setRecords(normalizeData(attendanceResponse.data));
        setStudents(normalizeData(studentsResponse.data));
      } catch (err) {
        console.error("Attendance loading error:", err);

        setError("Unable to load attendance data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Create student lookup:
  // student id -> student information
  const studentMap = useMemo(() => {
    const map = {};

    students.forEach((student) => {
      if (student.id !== undefined) {
        map[student.id] = student;
      }
    });

    return map;
  }, [students]);

  // Convert backend attendance records
  // into records with student information.
  const processedRecords = useMemo(() => {
    return records.map((record) => {
      const student = studentMap[record.student_id];

      const name =
        student?.name ||
        student?.full_name ||
        student?.student_name ||
        `${student?.first_name || ""} ${
          student?.last_name || ""
        }`.trim() ||
        `Student ${record.student_id}`;

      const roll =
        student?.roll_no ||
        student?.roll_number ||
        student?.rollNo ||
        "—";

      return {
        ...record,
        studentName: name,
        rollNumber: roll,
      };
    });
  }, [records, studentMap]);

  // Search
  const filteredRecords = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return processedRecords;

    return processedRecords.filter((record) => {
      return (
        record.studentName.toLowerCase().includes(query) ||
        String(record.rollNumber)
          .toLowerCase()
          .includes(query)
      );
    });
  }, [processedRecords, search]);

  // Calculate attendance percentage
  // from Present / Absent records.
  const attendanceByStudent = useMemo(() => {
    const map = {};

    records.forEach((record) => {
      const id = record.student_id;

      if (!map[id]) {
        map[id] = {
          total: 0,
          present: 0,
        };
      }

      map[id].total += 1;

      const status = String(record.status || "").toLowerCase();

      if (
        status === "present" ||
        status === "p" ||
        status === "attended"
      ) {
        map[id].present += 1;
      }
    });

    Object.keys(map).forEach((id) => {
      const item = map[id];

      item.percentage =
        item.total > 0
          ? (item.present / item.total) * 100
          : 0;
    });

    return map;
  }, [records]);

  // Overall average attendance
  const averageAttendance = useMemo(() => {
    const values = Object.values(attendanceByStudent)
      .map((item) => item.percentage)
      .filter((value) => !Number.isNaN(value));

    if (!values.length) return 0;

    return (
      values.reduce((sum, value) => sum + value, 0) /
      values.length
    ).toFixed(2);
  }, [attendanceByStudent]);

  // Number of students >= 75%
  const goodAttendance = useMemo(() => {
    return Object.values(attendanceByStudent).filter(
      (item) => item.percentage >= 75
    ).length;
  }, [attendanceByStudent]);

  // Number of students < 75%
  const lowAttendance = useMemo(() => {
    return Object.values(attendanceByStudent).filter(
      (item) => item.percentage < 75
    ).length;
  }, [attendanceByStudent]);

  return (
    <div className="cf-page">

      {/* Header */}
      <div className="cf-page-header">
        <div>
          <div className="cf-eyebrow">
            Academic Monitoring
          </div>

          <h1 className="cf-page-title">
            Attendance
          </h1>

          <p className="cf-page-subtitle">
            Monitor student attendance and identify students
            requiring attention
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="cf-stat-grid">

        {/* Average */}
        <div className="cf-stat">
          <div className="cf-stat-top">
            <div className="cf-stat-icon">
              <CalendarCheck size={19} />
            </div>
          </div>

          <div className="cf-stat-label">
            Average Attendance
          </div>

          <div className="cf-stat-value">
            {averageAttendance}%
          </div>
        </div>

        {/* Good */}
        <div className="cf-stat">
          <div className="cf-stat-top">
            <div className="cf-stat-icon">
              <CheckCircle2 size={19} />
            </div>
          </div>

          <div className="cf-stat-label">
            Good Attendance
          </div>

          <div className="cf-stat-value">
            {goodAttendance}
          </div>
        </div>

        {/* Low */}
        <div className="cf-stat">
          <div className="cf-stat-top">
            <div
              className="cf-stat-icon"
              style={{
                background: "#fef2f2",
                color: "#dc2626",
              }}
            >
              <AlertTriangle size={19} />
            </div>
          </div>

          <div className="cf-stat-label">
            Below 75%
          </div>

          <div className="cf-stat-value">
            {lowAttendance}
          </div>
        </div>

      </div>

      {/* Search */}
      <div className="cf-toolbar">
        <div className="cf-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search student by name or roll number..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      {/* Table */}
      <div className="cf-table-card">

        {loading && (
          <div className="cf-loading">
            Loading attendance records...
          </div>
        )}

        {error && !loading && (
          <div className="cf-error">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="cf-table-wrapper">

            <table className="cf-table">

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="cf-empty">
                        <CalendarCheck size={30} />

                        <p>
                          No attendance records found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (

                  filteredRecords
                    .slice(0, 50)
                    .map((record, index) => {

                      const status = String(
                        record.status || "Unknown"
                      );

                      const isPresent =
                        status.toLowerCase() ===
                          "present" ||
                        status.toLowerCase() === "p" ||
                        status.toLowerCase() ===
                          "attended";

                      return (
                        <tr
                          key={
                            record.id ||
                            `${record.student_id}-${record.date}-${index}`
                          }
                        >

                          {/* Student */}
                          <td>
                            <div className="cf-student">

                              <div className="cf-avatar">
                                {record.studentName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <div className="cf-student-name">
                                  {record.studentName}
                                </div>
                              </div>

                            </div>
                          </td>

                          {/* Roll number */}
                          <td>
                            <strong>
                              {record.rollNumber}
                            </strong>
                          </td>

                          {/* Subject */}
                          <td>
                            {record.subject_name ||
                              record.subject?.name ||
                              record.subject_id ||
                              "General"}
                          </td>

                          {/* Date */}
                          <td>
                            {record.date
                              ? new Date(
                                  record.date
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          {/* Status */}
                          <td>
                            <span
                              className={`cf-badge ${
                                isPresent
                                  ? "cf-badge-green"
                                  : "cf-badge-red"
                              }`}
                            >
                              {status}
                            </span>
                          </td>

                        </tr>
                      );
                    })
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default AttendancePage;