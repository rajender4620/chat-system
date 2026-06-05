import { NavLink, useNavigate } from "react-router-dom"
import "./navbar.css"

/**
 * The top navigation bar. Shown on every feature page via the Layout.
 * NavLink (not Link) auto-applies an "active" class to the current route's link.
 */
function Navbar() {
    const navigate = useNavigate()
    const raw = sessionStorage.getItem("user")
    const me = raw ? JSON.parse(raw) : null

    const handleLogout = () => {
        localStorage.removeItem("token")
        sessionStorage.removeItem("user")
        navigate("/login")
    }

    return (
        <nav className="navbar">
            <NavLink to="/dashboard" className="navbar-brand">Institute</NavLink>

            <NavLink to="/dashboard" className="navbar-link">Chat</NavLink>
            <NavLink to="/courses" className="navbar-link">Courses</NavLink>

            <span className="navbar-spacer" />
            <span className="navbar-user">
                {me?.name}
                {me?.role && <span className="navbar-role">{me.role}</span>}
            </span>
            <button type="button" className="navbar-logout" onClick={handleLogout}>Logout</button>
        </nav>
    )
}

export default Navbar
