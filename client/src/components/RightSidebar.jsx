import React, { useContext, useEffect, useState } from "react";
import assets, { imagesDummyData } from "../assets/assets";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const [msgImages, setMsgImages] = useState([]);

  // Get all the images from the messages and set them to state
  useEffect(() => {
    setMsgImages(messages.filter((msg) => msg.image).map((msg) => msg.image));
  }, [messages]);

  return (
    selectedUser && (
      <div
        className={`bg-[#282142]/80 text-white w-full relative overflow-y-scroll border-l border-violet-800/50 max-md:hidden animate-fade-in`}
      >
        <div className="pt-12 pb-6 flex flex-col items-center gap-3 text-center text-sm font-light mx-auto border-b border-violet-800/50">
          <div className="relative">
            <img
              src={selectedUser?.profilePic || assets.avatar_icon}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-violet-500 shadow-xl"
            />
            {/* FIX: Check online status using .toString() */}
            {onlineUsers.includes(selectedUser._id.toString()) && (
              <span
                className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#282142] animate-pulse-soft"
                title="Online"
              ></span>
            )}
          </div>

          <h1 className="px-6 text-2xl font-semibold text-violet-400">
            {selectedUser.fullName}
          </h1>
          <p className="px-10 text-gray-300 italic">{selectedUser.bio}</p>
        </div>

        <div className="p-5">
          <h3 className="text-md font-medium text-gray-200 mb-3">
            Shared Media ({msgImages.length})
          </h3>
          <div className="max-h-[300px] overflow-y-auto grid grid-cols-2 gap-4 p-2 rounded-lg bg-black/10">
            {msgImages.length > 0 ? (
              msgImages.map((url, index) => (
                <div
                  key={index}
                  onClick={() => window.open(url)}
                  className="cursor-pointer rounded-lg overflow-hidden aspect-square shadow-lg transition-all duration-300 transform hover:scale-[1.05] hover:shadow-violet-500/50 active:scale-[0.98]"
                >
                  <img
                    src={url}
                    alt={`Media ${index}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-xs col-span-2 text-center py-5">
                No media shared yet.
              </p>
            )}
          </div>
        </div>

        {/* Updated Logout Button */}
        <button
          onClick={() => logout()}
          className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-16 rounded-full cursor-pointer shadow-lg hover:shadow-red-500/50 transition-all duration-300"
        >
          Logout
        </button>
      </div>
    )
  );
};

export default RightSidebar;
