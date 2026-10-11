import { useEffect, useMemo, useState } from "react";
import { Search, GraduationCap, CheckCircle, AlertTriangle } from "lucide-react";
import api from "../services/api";
import "./Pages.css";

function MarksPage() {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [marksResponse, studentsResponse] = await Promise.all([
          api.get("/marks/"),
          api.get("/students/"),
        ]);

        setMarks(Array.isArray(marksResponse.data) ? marksResponse.data : []);
        setStudents(
          Array.isArray(studentsResponse.data)
            ? studentsResponse.data
            : studentsResponse.data?.students ||
              studentsResponse.data?.data ||
              studentsResponse.data?.results ||
              []
        );
      } catch (err) {
        console.error(err);
        setError("Unable to load marks data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Connect student_id from marks with student id
  const studentMap = useMemo(() => {
    const map = {};

    students.forEach((student) => {
      map[student.id] = student;
    });

    return map;
  }, [students]);

  // Add student information to every marks record
  const marksWithStudents = useMemo(() => {
    return marks.map((mark) => {
      const student = studentMap[mark.student_id];

      return {
        ...mark,
        studentName: student
          ? `${student.first_name || ""} ${student.last_name || ""}`.trim()
          : "Unknown Student",
        rollNumber: student?.roll_number || "—",
        email: student?.email || "",
      };
    });
  }, [marks, studentMap]);

  const filteredMarks = useMemo(() => {
    const query = search.toLowerCase().trim();

    return marksWithStudents.filter((mark) => {
      return (
        mark.studentName.toLowerCase().includes(query) ||
        mark.rollNumber.toLowerCase().includes(query)
      );
    });
  }, [marksWithStudents, search]);

  // Calculate statistics
  const averageMarks = useMemo(() => {
    if (!marks.length) return 0;

    const totalPercentage = marks.reduce((sum, mark) => {
      const percentage =
        mark.max_marks > 0
          ? (mark.marks_obtained / mark.max_marks) * 100
          : 0;

      return sum + percentage;
    }, 0);

    return (totalPercentage / marks.length).toFixed(2);
  }, [marks]);

  const passedCount = useMemo(() => {
    return marks.filter((mark) => {
      const percentage =
        mark.max_marks > 0
          ? (mark.marks_obtained / mark.max_marks) * 100
          : 0;

      return percentage >= 40;
    }).length;
  }, [marks]);

  const below40Count = marks.length - passedCount;

  return (
    <div className="cf-page">

      {/* Header */}
      <div className="cf-page-header">
        <div>
          <div className="cf-eyebrow">Academic Monitoring</div>

          <h1 className="cf-page-title">
            Marks
          </h1>

          <p className="cf-page-subtitle">
            Monitor student academic performance and marks
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="cf-stats-grid">

        <div className="cf-stat-card">
          <GraduationCap size={22} />

          <div className="cf-stat-label">
            Average Marks
          </div>

          <div className="cf-stat-value">
            {averageMarks}%
          </div>
        </div>

        <div className="cf-stat-card">
          <CheckCircle size={22} />

          <div className="cf-stat-label">
            Passed
          </div>

          <div className="cf-stat-value">
            {passedCount}
          </div>
        </div>

        <div className="cf-stat-card">
          <AlertTriangle size={22} />

          <div className="cf-stat-label">
            Below 40%
          </div>

          <div className="cf-stat-value">
            {below40Count}
          </div>
        </div>

      </div>

      {/* Table */}
      <div className="cf-table-card">

        <div className="cf-toolbar">

          <div className="cf-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search student by name or roll number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

        </div>

        {loading && (
          <div className="cf-loading">
            Loading marks...
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
                  <th>Exam Type</th>
                  <th>Marks</th>
                </tr>
              </thead>

              <tbody>

                {filteredMarks.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="cf-empty">
                        <GraduationCap size={30} />
                        <p>No marks found</p>
                      </div>
                    </td>
                  </tr>
                ) : (

                  filteredMarks.map((mark, index) => {

                    const percentage =
                      mark.max_marks > 0
                        ? (mark.marks_obtained / mark.max_marks) * 100
                        : 0;

                    return (
                      <tr key={mark.id || index}>

                        <td>
                          <div className="cf-student">

                            <div className="cf-avatar">
                              {mark.studentName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <div className="cf-student-name">
                                {mark.studentName}
                              </div>

                              {mark.email && (
                                <div className="cf-student-email">
                                  {mark.email}
                                </div>
                              )}

                            </div>

                          </div>
                        </td>

                        <td>
                          <strong>
                            {mark.rollNumber}
                          </strong>
                        </td>

                        <td>
                          {mark.subject_id}
                        </td>

                        <td>
                          {mark.exam_type || "—"}
                        </td>

                        <td>
                          <strong>
                            {mark.marks_obtained} / {mark.max_marks}
                          </strong>

                          <div>
                            {percentage.toFixed(2)}%
                          </div>
                        </td>

                      </tr>
                    );
                  })

                )}

              </tbody>

            </table>

          </div>
        )}

        {!loading && !error && (
          <div className="cf-table-footer">
            Showing {filteredMarks.length} marks
          </div>
        )}

      </div>

    </div>
  );
}

export default MarksPage;