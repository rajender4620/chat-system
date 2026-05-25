import { createBrowserRouter } from "react-router-dom";
import Login from "../components/login/logic";
import Dashboard from "../components/dashboard/Dashboard";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {
        path: "/dashboard",
        element: <Dashboard />
    }

]);


export default router