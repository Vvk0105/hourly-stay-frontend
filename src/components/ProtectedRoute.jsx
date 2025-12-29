import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute() {
    const { user, initialized } = useSelector(state => state.auth);

    if (!initialized) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;