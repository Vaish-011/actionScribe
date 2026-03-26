import ThemeToggle from "./ThemeToggle";
import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Meetings", path: "/meetings" },
  { label: "Insights", path: "/insights" },
  { label: "Calendar", path: "/calendar" },
  { label: "Admin", path: "/admin" }
];

function Navbar() {

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur sticky top-0 z-20 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 space-y-3">
        <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">ActionScribe AI</h1>
          <p className="text-xs text-gray-500 dark:text-gray-300">Meetings to execution, automatically</p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={logout}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            Logout
          </button>
        </div>
        </div>

        <nav className="flex items-center gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${isActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;