import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if anything has changed
    if (!selectedImg && name === authUser.fullName && bio === authUser.bio) {
      toast("No changes detected", { icon: "💡" });
      navigate("/");
      return;
    }

    if (!selectedImg) {
      await updateProfile({ fullName: name, bio });
      navigate("/");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedImg);
    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ profilePic: base64Image, fullName: name, bio });
      navigate("/");
    };
  };

  return (
    // New background and centering classes
    <div className="min-h-screen bg-primary-dark flex items-center justify-center p-4">
      {/* Modern Card Container */}
      <div className="w-full max-w-3xl bg-[#1e1a30]/80 backdrop-blur-3xl text-gray-300 border border-violet-800/50 flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Profile Image Preview Section */}
        <div className="p-8 md:p-10 flex flex-col items-center justify-center bg-[#282142] md:w-1/3">
          <h3 className="text-xl font-semibold mb-6 text-violet-400">
            Your Avatar
          </h3>
          <img
            className="w-32 h-32 aspect-square rounded-full object-cover border-4 border-violet-500 shadow-lg"
            src={
              selectedImg
                ? URL.createObjectURL(selectedImg)
                : authUser?.profilePic || assets.avatar_icon
            }
            alt="Profile Avatar"
          />
          <label
            htmlFor="avatar"
            className="mt-5 flex items-center gap-2 cursor-pointer text-sm text-violet-300 hover:text-violet-500 transition-colors"
          >
            <input
              onChange={(e) => setSelectedImg(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.5 13a4.5 4.5 0 01-4.5-4.5 4.5 4.5 0 019 0V9a1 1 0 01-2 0V8.5a2.5 2.5 0 00-5 0V9a1 1 0 01-2 0V8.5a4.5 4.5 0 014.5-4.5h4.5a2.5 2.5 0 002.5-2.5V1.5a1 1 0 112 0v4a.5.5 0 01-1 0V5a1.5 1.5 0 00-1.5-1.5h-4.5a3.5 3.5 0 00-3.5 3.5V9a1 1 0 01-2 0V8.5a2.5 2.5 0 00-5 0z"
                clipRule="evenodd"
              ></path>
            </svg>
            {selectedImg ? "Change image" : "Upload New Image"}
          </label>
        </div>

        {/* Profile Details Form Section */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 p-8 md:p-10 flex-1"
        >
          <h3 className="text-xl font-semibold text-gray-100">
            Update Details
          </h3>

          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            required
            placeholder="Your name"
            className="p-3 border border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 bg-transparent placeholder-gray-400 text-white"
          />

          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
            className="p-3 border border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 bg-transparent placeholder-gray-400 text-white resize-none"
            rows={5}
          ></textarea>

          <button
            type="submit"
            className="mt-2 py-3 bg-gradient-to-r from-purple-500 to-violet-700 text-white rounded-xl text-lg font-medium cursor-pointer shadow-lg hover:shadow-violet-500/50 transform hover:scale-[1.01] transition-all duration-300"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="py-2 text-violet-400 border border-violet-400 rounded-xl text-base font-medium hover:bg-violet-400/20 transition-all duration-300"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
