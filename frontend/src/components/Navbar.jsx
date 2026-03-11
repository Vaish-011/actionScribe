import ThemeToggle from "./ThemeToggle";
import { useNavigate } from "react-router-dom";

function Navbar() {

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="bg-black dark:bg-gray-900 text-white px-6 py-4 flex items-center">

      {/* Left */}
      <div className="flex-1">
        <h1 className="text-xl font-bold">
          ActionScribe AI
        </h1>
      </div>

      {/* Center */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Right */}
      <div className="flex-1 flex justify-end">
        <ThemeToggle />
      </div>

    </div>
  );
}

export default Navbar;