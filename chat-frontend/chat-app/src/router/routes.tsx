import { createBrowserRouter } from "react-router-dom"
import Login from "../components/login/logic"
import Signup from "../components/signup/Signup"
import Dashboard from "../components/dashboard/Dashboard"
import Courses from "../components/courses/Courses";
import Batches from "../components/batches/Batches";
import Layout from "../components/layout/Layout";

const router = createBrowserRouter([
    // Auth pages — NO navbar (bare screens)
    {
        path: "/",
        element: <Signup />,            // signup as the default landing
    },
    {
        path: "/login",
        element: <Login />,             // existing users
    },

    // Logged-in pages — wrapped by Layout (navbar + <Outlet/>)
    {
        element: <Layout />,            // layout route: no `path`, just wraps its children
        children: [
            { path: "/dashboard", element: <Dashboard /> },
            { path: "/courses", element: <Courses /> },
        ],
    },
    {
        path: '/courses/:courseId/batches',
        element: <Batches />
    }
])

export default router
