import { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import ThemeToggle from "../components/ThemeToggle";

function Signup() {

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const navigate = useNavigate();

  const signupUser = async () => {

    try{

      await API.post("/auth/signup",{
        name,
        email,
        password
      });

      toast.success("Account created");

      navigate("/");

    }catch(error){

      toast.error(error.response?.data?.message || "Signup failed");

    }

  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-200 dark:from-gray-900 dark:to-black relative">

      <ThemeToggle />

      <div className="bg-white dark:bg-gray-800 w-[380px] p-8 rounded-2xl shadow-2xl">

        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">
          Create Account
        </h1>

        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          Start using AI Meeting Tracker
        </p>

        <input
          className="w-full p-3 mb-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
          placeholder="Full name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          className="w-full p-3 mb-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 mb-5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          onClick={signupUser}
          disabled={!name || !email || !password}
          className="w-full bg-green-600 hover:bg-green-700 transition text-white py-3 rounded-lg font-medium disabled:bg-gray-400"
        >
          Signup
        </button>

        <p className="text-center mt-5 text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>

      </div>

    </div>

  );
}

export default Signup;