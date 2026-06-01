import { createBrowserRouter } from "react-router-dom"
import Login from "../components/login/logic"
import Signup from "../components/signup/Signup"
import Dashboard from "../components/dashboard/Dashboard"

const router = createBrowserRouter([
    {
        path: "/",
        element: <Signup />,            // signup as the default landing
    },
    {
        path: "/login",
        element: <Login />,             // existing users
    },
    {
        path: "/dashboard",
        element: <Dashboard />,
    },
])

export default router
