import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "./store/authSlice";
import MainLayout from "./layouts/MainLayout";
import "./styles/layout.css";
import UserManagement from "./pages/users/UserManagement";
import AssignChangePage from "./pages/assignChange/AssignChangePage";
import HotelManagement from "./pages/hotels/HotelManagement";
import AddHotel from "./pages/hotels/AddHotel";
import HotelDetails from "./pages/hotels/HotelDetails";
import RoomDetails from "./pages/hotels/RoomDetails";
import AddRoomType from "./pages/hotels/AddRoomType";
import EditRoomType from "./pages/hotels/EditRoomType";
import AddPhysicalRoom from "./pages/hotels/AddPhysicalRoom";
import EditHotel from "./pages/hotels/EditHotel";
import BookingManagement from "./pages/hotels/BookingManagement";
import CategoryDetails from "./pages/hotels/CategoryDetails";
import AmenityManagement from "./pages/hotels/AmenityManagement";
import BookingHotelList from "./pages/bookings/BookingHotelList";


function App() {
  const dispatch = useDispatch();
  const { initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (!initialized) {
    return <div>Loading application...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            } />
        </Route>
        <Route
          path="/users"
          element={
            <MainLayout>
              <UserManagement />
            </MainLayout>
          }
        />
        <Route
          path="/assignandchange"
          element={
            <MainLayout>
              <AssignChangePage />
            </MainLayout>
          }
        />
        <Route
          path="/hotels"
          element={
            <MainLayout>
              <HotelManagement />
            </MainLayout>
          }
        />
        <Route path="/hotels/add" element={<MainLayout><AddHotel /></MainLayout>} />
        <Route path="/hotels/:id" element={<MainLayout><HotelDetails /></MainLayout>} />
        <Route path="/hotels/:id/rooms/:roomId" element={<MainLayout><RoomDetails /></MainLayout>} />
        <Route path="/hotels/:id/add-room-type" element={<MainLayout><AddRoomType /></MainLayout>} />
        <Route path="/hotels/:id/room-types/:typeId/edit" element={<MainLayout><EditRoomType /></MainLayout>} />
        <Route path="/hotels/:id/add-physical-room" element={<MainLayout><AddPhysicalRoom /></MainLayout>} />
        <Route path="/hotels/:id/edit" element={<MainLayout><EditHotel /></MainLayout>} />
        <Route path="/hotels/:id/categories/:categoryId" element={<MainLayout><CategoryDetails /></MainLayout>} />
        <Route path="/amenities" element={<MainLayout><AmenityManagement /></MainLayout>} />
        <Route path="/bookings/:id" element={<MainLayout><BookingManagement /></MainLayout>} />
        <Route path="/bookings" element={<MainLayout><BookingHotelList /></MainLayout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
