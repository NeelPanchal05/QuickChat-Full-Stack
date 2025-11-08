import React, {
  useContext,
  useEffect,
  useState,
  useDeferredValue,
  memo,
} from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";

// New Memoized component for each user item for performance optimization
const UserListItem = memo(
  ({
    user,
    selectedUser,
    onlineUsers,
    unseenMessages,
    setUnseenMessages,
    onSelect,
  }) => {
    // FIX: Explicitly convert user._id to string for comparison with onlineUsers (which is an array of strings from socket.io)
    const isSelected = selectedUser?._id === user._id;
    const isOnline = onlineUsers.includes(user._id.toString());

    return (
      <div
        onClick={onSelect}
        className={`relative flex items-center gap-3 p-3 pl-4 rounded-xl cursor-pointer transition-all duration-300 ease-in-out hover:bg-violet-700/30 border-l-4 ${
          isSelected
            ? "bg-violet-700/30 border-violet-500 shadow-md transform scale-[1.02]"
            : "border-transparent"
        } active:scale-[0.98]`}
      >
        <div className="relative flex-shrink-0">
          <img
            src={user?.profilePic || assets.avatar_icon}
            alt=""
            className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent transition-all duration-300"
          />
          {isOnline && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1e1a30] animate-pulse-soft"
              title="Online"
            ></span>
          )}
        </div>

        <div className="flex flex-col leading-5 flex-1 min-w-0">
          <p className="font-medium truncate text-gray-50">{user.fullName}</p>
          {isOnline ? (
            <span className="text-green-400 text-xs flex items-center gap-1">
              Online
            </span>
          ) : (
            <span className="text-neutral-400 text-xs">Offline</span>
          )}
        </div>
        {unseenMessages[user._id] > 0 && (
          <p className="text-xs h-6 w-6 flex justify-center items-center rounded-full bg-red-500 text-white font-bold ml-auto shadow-lg animate-fade-in">
            {unseenMessages[user._id]}
          </p>
        )}
      </div>
    );
  }
);

UserListItem.displayName = "UserListItem";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);

  const [input, setInput] = useState("");
  const deferredInput = useDeferredValue(input);

  const navigate = useNavigate();

  const filteredUsers = deferredInput
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(deferredInput.toLowerCase())
      )
    : users;

  useEffect(() => {
    getUsers();
  }, [onlineUsers, getUsers]);

  return (
    <div
      className={`bg-[#282142] h-full p-5 rounded-l-3xl overflow-y-scroll text-white transition-all duration-500 ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      <div className="pb-5 sticky top-0 bg-[#282142] z-10 pt-1">
        <div className="flex justify-between items-center mb-5">
          <img
            src={assets.logo}
            alt="logo"
            className="max-w-36 transition-transform duration-300 hover:scale-[1.02]"
          />
          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="max-h-5 cursor-pointer opacity-70 transform transition-transform duration-300 group-hover:scale-110 group-hover:opacity-100"
            />
            <div className="absolute top-full right-0 z-20 w-40 p-3 rounded-xl bg-[#3c3359] border border-violet-700 shadow-xl hidden group-hover:block transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100">
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm text-gray-200 p-2 rounded-lg hover:bg-violet-600/50 transition-colors"
              >
                Edit Profile
              </p>
              <hr className="my-2 border-t border-violet-500/30" />
              <p
                onClick={() => logout()}
                className="cursor-pointer text-sm text-gray-200 p-2 rounded-lg hover:bg-red-600/50 transition-colors"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-full flex items-center gap-2 py-3 px-4 shadow-inner border border-white/5">
          <img
            src={assets.search_icon}
            alt="Search"
            className="w-4 opacity-70"
          />
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            className="bg-transparent border-none outline-none text-white text-sm placeholder-gray-400 flex-1"
            placeholder="Search User..."
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex flex-col gap-2">
        {filteredUsers.map((user) => (
          <UserListItem
            key={user._id}
            user={user}
            selectedUser={selectedUser}
            onlineUsers={onlineUsers}
            unseenMessages={unseenMessages}
            setUnseenMessages={setUnseenMessages}
            onSelect={() => {
              setSelectedUser(user);
              setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
            }}
          />
        ))}
        {filteredUsers.length === 0 && deferredInput && (
          <p className="text-center text-gray-500 mt-5">
            No users found for "{deferredInput}"
          </p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
