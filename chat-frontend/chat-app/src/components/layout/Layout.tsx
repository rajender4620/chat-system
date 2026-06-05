import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"

/**
 * The app shell for logged-in pages: a persistent Navbar + a slot for the active page.
 *
 * <Outlet /> is the slot. React Router renders the matched CHILD route's element there.
 * So the Navbar stays put while only the area below it swaps between Dashboard / Courses / etc.
 *
 * Flutter analogy: a Scaffold with a persistent AppBar, where <Outlet/> is the `body`
 * that changes as you navigate.
 */
function Layout() {
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    )
}

export default Layout
