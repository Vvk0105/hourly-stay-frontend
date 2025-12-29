import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(state => state.auth.user )
    console.log('redux store check',user);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/");
    };
    
  return (
    <div>    
        <h2>Dashboard</h2>
        <p><b>Name:</b> {user?.name}</p>
        <p><b>Role:</b> {user?.role}</p>

        {user?.role === "SUPER_ADMIN" && (
            <div>
                <h3>Super Admin Panel</h3>
            </div>
        )}

        {user?.role === "HOTEL_MANAGER" && (
            <div>
                <h3>Hotel Manager Panel</h3>
            </div>
        )}

        {user?.role === "GROUP_ADMIN" && (
            <div>
                <h3>Group Admin Panel</h3>
            </div>
        )}
        <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
