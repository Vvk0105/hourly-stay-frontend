import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { can } from "../utils/accessControl";

function ProtectedRoute({ perform }) {
    const { user, initialized } = useSelector(state => state.auth);

    if (!initialized) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (perform && !can(user, perform)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;