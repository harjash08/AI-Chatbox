import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({

    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    setError("");

    try {

      const response = await fetch(
        "https://ai-chatbox-azrb.onrender.com/api/token/",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail || "Login failed"
        );
      }

      // save tokens
      localStorage.setItem(
        "access",
        data.access
      );

      localStorage.setItem(
        "refresh",
        data.refresh
      );

      navigate("/");

    } catch (error) {

      console.log(error);

      setError(error.message);
    }

    setLoading(false);
  };

  return (

    <div className="min-h-screen bg-black flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-8">

        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome Back
        </h1>

        <p className="text-neutral-500 mb-8">
          Login to continue
        </p>

        {error && (

          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl mb-5 text-sm">

            {error}

          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="
              bg-black
              border border-neutral-800
              rounded-xl
              p-4
              text-white
              outline-none
              focus:border-white
            "
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="
              bg-black
              border border-neutral-800
              rounded-xl
              p-4
              text-white
              outline-none
              focus:border-white
            "
          />

          <button
            type="submit"
            disabled={loading}
            className="
              bg-white
              text-black
              rounded-xl
              p-4
              font-semibold
              hover:opacity-90
              transition
            "
          >

            {
              loading
              ? "Logging in..."
              : "Login"
            }

          </button>
        </form>

        <p className="text-neutral-500 mt-6 text-center">

          Don't have an account?

          <Link
            to="/register"
            className="text-white ml-2"
          >
            Register
          </Link>

        </p>
      </div>
    </div>
  );
};

export default Login;