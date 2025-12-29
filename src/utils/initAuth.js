import api from "../api/axios";
import { logout, setUser,  } from "../store/authSlice";
import { jwtDecode } from "jwt-decode";

export const initAuth = async (dispatch) => {
  const token = localStorage.getItem("access");

  if (!token) {
    dispatch(logout());
    return;
  }

  try {
    const decoded = jwtDecode(token);

    const profileRes = await api.get("users/profile/");

    dispatch(setUser({
      id: decoded.user_id,
      role: decoded.role,
      permissions: decoded.permissions,
      name: profileRes.data.full_name,
    }));
  } catch (err) {
    dispatch(logout());
  }
};
