import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      toast.success("Google login successful");
      navigate("/dashboard");
    } else {
      toast.error("Google login failed");
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-lg">
      Completing Google sign in...
    </div>
  );
}

export default AuthCallback;