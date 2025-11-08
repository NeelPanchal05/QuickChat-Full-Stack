import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const { login } = useContext(AuthContext);

  const onSubmitHandler = (event) => {
    event.preventDefault();

    if (currState === "Sign up" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    login(currState === "Sign up" ? "signup" : "login", {
      fullName,
      email,
      password,
      bio,
    });
  };

  return (
    <div className="min-h-screen bg-primary-dark flex flex-col items-center justify-center gap-10 sm:gap-16 p-6">
      {/* -------- Header/Logo -------- */}
      <img
        src={assets.logo_big}
        alt="QuickChat Logo"
        className="w-[min(30vw,250px)] animate-fade-in"
      />

      {/* -------- Form -------- */}
      <form
        onSubmit={onSubmitHandler}
        className="border border-violet-700/40 bg-white/5 text-white p-8 sm:p-10 flex flex-col gap-6 rounded-xl shadow-2xl w-full max-w-sm animate-slide-up"
      >
        <h2 className="font-semibold text-3xl flex justify-between items-center text-violet-400">
          {currState}
          {isDataSubmitted && (
            <img
              onClick={() => setIsDataSubmitted(false)}
              src={assets.arrow_icon}
              alt="Back"
              className="w-6 cursor-pointer opacity-70 hover:opacity-100 transition-opacity transform rotate-180"
            />
          )}
        </h2>

        {currState === "Sign up" && !isDataSubmitted && (
          <input
            onChange={(e) => setFullName(e.target.value)}
            value={fullName}
            type="text"
            className="p-3 border border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 bg-transparent placeholder-gray-400"
            placeholder="Full Name"
            required
          />
        )}

        {!isDataSubmitted && (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="Email Address"
              required
              className="p-3 border border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 bg-transparent placeholder-gray-400"
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder="Password"
              required
              className="p-3 border border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 bg-transparent placeholder-gray-400"
            />
          </>
        )}

        {currState === "Sign up" && isDataSubmitted && (
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={4}
            className="p-3 border border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 bg-transparent placeholder-gray-400 resize-none"
            placeholder="provide a short bio..."
            required
          ></textarea>
        )}

        <button
          type="submit"
          className="py-3 bg-gradient-to-r from-purple-500 to-violet-700 text-white rounded-lg text-lg font-medium cursor-pointer shadow-lg hover:shadow-violet-500/50 transform hover:scale-[1.01] transition-all duration-300"
        >
          {currState === "Sign up" ? "Create Account" : "Login Now"}
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            className="form-checkbox text-violet-500 bg-gray-700 border-gray-500 rounded"
          />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          {currState === "Sign up" ? (
            <p className="text-gray-400">
              Already have an account?
              <span
                onClick={() => {
                  setCurrState("Login");
                  setIsDataSubmitted(false);
                }}
                className="font-medium text-violet-400 cursor-pointer hover:text-violet-300 ml-1"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-gray-400">
              Create an account
              <span
                onClick={() => setCurrState("Sign up")}
                className="font-medium text-violet-400 cursor-pointer hover:text-violet-300 ml-1"
              >
                Click here
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
