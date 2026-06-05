import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import type { User } from "../dashboard/Dashboard";
import "./courses.css";

export interface Course {
    _id: string
    title: string
    description: string
    createdBy: CreatedBy
    createdAt: string
    updatedAt: string
    __v: number
}

export interface CreatedBy {
    _id: string
    name: string
}

function Courses() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);   // is the modal open?

    const token = localStorage.getItem('token');
    const raw = sessionStorage.getItem("user");
    const me: User | null = raw ? JSON.parse(raw) : null;

    useEffect(() => {
        if (!me) navigate("/login");
    }, [me, navigate]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch(`${API_URL}/courses`, {
                    headers: {
                        "content-type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setCourses(json.data);
            } catch (error) {
                console.log("error fetching courses:", error);
            }
        };
        fetchCourses();
    }, [token]);

    // open the modal in ADD mode
    const openAdd = () => {
        setEditingId(null);
        setTitle('');
        setDescription('');
        setShowForm(true);
    };

    // open the modal in EDIT mode (pre-filled)
    const startEdit = (c: Course) => {
        setEditingId(c._id);
        setTitle(c.title);
        setDescription(c.description ?? '');
        setShowForm(true);
    };

    // close + reset the modal
    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setTitle('');
        setDescription('');
    };

    const deleteCourse = async (id: string) => {
        if (!window.confirm("Delete this course?")) return;
        try {
            const res = await fetch(`${API_URL}/courses/${id}`, {
                method: 'DELETE',
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setCourses(prev => prev.filter(c => c._id !== id));
        } catch (error) {
            console.log("error deleting course:", error);
        }
    };

    // ONE handler for add (POST) and edit (PATCH) — branches on editingId
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            if (editingId) {
                const res = await fetch(`${API_URL}/courses/${editingId}`, {
                    method: 'PATCH',
                    headers: {
                        "content-type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ title, description }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setCourses(prev => prev.map(c => c._id === editingId ? json.data : c));
            } else {
                const res = await fetch(`${API_URL}/courses`, {
                    method: 'POST',
                    headers: {
                        "content-type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ title, description }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setCourses(prev => [...prev, json.data]);
            }
            closeForm();   // close the modal on success
        } catch (error) {
            console.log("error saving course:", error);
        }
    };

    return (
        <div className="courses-page">
            {/* header row: title + add button */}
            <div className="courses-header">
                <h1 className="courses-title">Courses</h1>
                {me?.role === 'admin' && (
                    <button className="btn-add" onClick={openAdd}>+ Add Course</button>
                )}
            </div>

            {/* full-width grid */}
            {courses.length === 0 ? (
                <div className="courses-empty">No courses yet.</div>
            ) : (
                <div className="course-grid">
                    {courses.map((c) => (
                        <div className="course-card" key={c._id}>
                            <div className="course-card-head">
                                <div className="course-card-title">
                                    <span className="course-icon">{c.title?.[0]?.toUpperCase()}</span>
                                    <h3>{c.title}</h3>
                                </div>
                                {me?.role === 'admin' && (
                                    <div className="card-actions">
                                        <button type="button" className="course-edit" title="Edit course" onClick={() => startEdit(c)}>✎</button>
                                        <button type="button" className="course-delete" title="Delete course" onClick={() => deleteCourse(c._id)}>×</button>
                                    </div>
                                )}
                            </div>
                            {c.description && <p>{c.description}</p>}
                            {c.createdBy && <div className="meta">by {c.createdBy.name}</div>}
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL: rendered only when showForm is true.
                Clicking the dark overlay closes it; stopPropagation on the inner box
                prevents clicks inside the form from bubbling up and closing it. */}
            {showForm && (
                <div className="modal-overlay" onClick={closeForm}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>{editingId ? 'Edit Course' : 'Add Course'}</h2>
                            <button type="button" className="modal-close" onClick={closeForm}>×</button>
                        </div>

                        <form className="course-form" onSubmit={handleSubmit}>
                            <div className="field">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Class 10 Maths"
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
                                    placeholder="Short description"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit">{editingId ? 'Update' : 'Add Course'}</button>
                                <button type="button" className="btn-cancel" onClick={closeForm}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Courses;
