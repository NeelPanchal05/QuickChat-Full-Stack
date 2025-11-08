import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import { useContext } from "react";
import { ChatContext } from "../../context/ChatContext";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);

  return (
    <div className="w-full h-screen flex items-center justify-center p-4 sm:p-8 lg:p-12">
      <div
        className={`bg-[#1e1a30]/80 backdrop-blur-3xl border border-violet-800/50 rounded-3xl shadow-2xl overflow-hidden w-full h-full max-w-[1400px] max-h-[95vh] grid grid-cols-1 relative ${
          selectedUser
            ? "md:grid-cols-[1fr_2fr_1fr] xl:grid-cols-[0.8fr_2fr_0.7fr]"
            : "md:grid-cols-[0.4fr_0.6fr]"
        }`}
      >
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  );
};

export default HomePage;
