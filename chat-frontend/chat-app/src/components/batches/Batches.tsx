import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import type { User } from "../dashboard/Dashboard";
import type { Course } from "../courses/Courses";
import "./batches.css";

type BatchUser = {
    _id: string;
    name: string;
    email?: string;
};

type BatchCourse = {
    _id: string;
    title: string;
};

export interface Batch {
    _id: string;
    name: string;
    description?: string;
    schedule?: string;
    teacher: BatchUser;
    courseId: BatchCourse;
    createdAt: string;
    updatedAt: string;
}

function Batches() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const raw = sessionStorage.getItem("user");
    const me: User | null = raw ? JSON.parse(raw) : null;

    const [batches, setBatches] = useState<Batch[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [forbidden, setForbidden] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [schedule, setSchedule] = useState("");
    const [courseId, setCourseId] = useState("");
    const [teacherId, setTeacherId] = useState("");

    const authHeaders = {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
    };

    useEffect(() => {
        if (!me) navigate("/login");
        else if (me.role === "student") setForbidden(true);
    }, [me, navigate]);

    useEffect(() => {
        if (!me || me.role === "student") return;

        const loadBatches = async () => {
            try {
                const res = await fetch(`${API_URL}/batches`, { headers: authHeaders });
                if (res.status === 403) {
                    setForbidden(true);
                    return;
                }
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setBatches(json.data);
            } catch (error) {
                console.error("Failed to load batches:", error);
            }
        };

        loadBatches();
    }, [me, token]);

    useEffect(() => {
        if (!me || me.role !== "admin" || !showForm) return;

        const loadFormOptions = async () => {
            try {
                const [coursesRes, usersRes] = await Promise.all([
                    fetch(`${API_URL}/courses`, { headers: authHeaders }),
                    fetch(`${API_URL}/users`, { headers: authHeaders }),
                ]);
                if (!coursesRes.ok || !usersRes.ok) throw new Error("Failed to load form options");

                const coursesJson = await coursesRes.json();
                const usersJson = await usersRes.json();

                setCourses(coursesJson.data);
                setTeachers(usersJson.data.filter((u: User) => u.role === "teacher"));
            } catch (error) {
                console.error("Failed to load courses/teachers:", error);
            }
        };

        loadFormOptions();
    }, [me, showForm, token]);

    const openAdd = () => {
        setName("");
        setDescription("");
        setSchedule("");
        setCourseId("");
        setTeacherId("");
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setName("");
        setDescription("");
        setSchedule("");
        setCourseId("");
        setTeacherId("");
    };

    const reloadBatches = async () => {
        const res = await fetch(`${API_URL}/batches`, { headers: authHeaders });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setBatches(json.data);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/batch/${courseId}`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({ name, description, teacherId, schedule }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await reloadBatches();
            closeForm();
        } catch (error) {
            console.error("Failed to create batch:", error);
        }
    };

    if (forbidden) {
        return (
            <div className="batches-page">
                <div className="batches-empty">You don&apos;t have access to batches.</div>
            </div>
        );
    }

    return (
        <div className="batches-page">
            <div className="batches-header">
                <h1 className="batches-title">Batches</h1>
                {me?.role === "admin" && (
                    <button className="btn-add" onClick={openAdd}>+ Add Batch</button>
                )}
            </div>

            {batches.length === 0 ? (
                <div className="batches-empty">No batches yet.</div>
            ) : (
                <div className="batch-grid">
                    {batches.map((b) => (
                        <div className="batch-card" key={b._id}>
                            <div className="batch-card-head">
                                <div className="batch-card-title">
                                    <span className="batch-icon">{b.name?.[0]?.toUpperCase()}</span>
                                    <h3>{b.name}</h3>
                                </div>
                            </div>
                            {b.description && <p>{b.description}</p>}
                            {b.schedule && <div className="batch-schedule">{b.schedule}</div>}
                            <div className="meta">
                                {b.courseId?.title && <span>{b.courseId.title}</span>}
                                {b.teacher?.name && <span> · {b.teacher.name}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="modal-overlay" onClick={closeForm}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>Add Batch</h2>
                            <button type="button" className="modal-close" onClick={closeForm}>×</button>
                        </div>

                        <form className="batch-form" onSubmit={handleSubmit}>
                            <div className="field">
                                <label>Course</label>
                                <select
                                    value={courseId}
                                    onChange={(e) => setCourseId(e.target.value)}
                                    required
                                >
                                    <option value="">Select a course</option>
                                    {courses.map((c) => (
                                        <option key={c._id} value={c._id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Teacher</label>
                                <select
                                    value={teacherId}
                                    onChange={(e) => setTeacherId(e.target.value)}
                                    required
                                >
                                    <option value="">Select a teacher</option>
                                    {teachers.map((t) => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Morning Batch A"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="field">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="field">
                                <label>Schedule</label>
                                <input
                                    type="text"
                                    value={schedule}
                                    onChange={(e) => setSchedule(e.target.value)}
                                    placeholder="e.g. Mon–Fri 9–11 AM"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit">Add Batch</button>
                                <button type="button" className="btn-cancel" onClick={closeForm}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Batches;
