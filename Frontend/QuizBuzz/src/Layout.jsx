import { Outlet } from "react-router-dom";
import Sidebar from "./pages/sideBar";
import Footer from "./pages/Footer";
import "./App.css";

export default function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Outlet />
        <Footer />
      </div>
    </div>
  );
}