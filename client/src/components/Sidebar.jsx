import React, {
  useContext,
  useEffect,
  useState,
  useDeferredValue,
  memo,
} from "react"; // ADDED useDeferredValue, memo
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
    const isSelected = selectedUser?._id === user._id;
    const isOnline = onlineUsers.includes(user._id);

    return (
      <div
        onClick={onSelect}
        className={`relative flex items-center gap-3 p-2 pl-4 rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:bg-[#282142]/70 ${
          isSelected ? "bg-[#282142]/70 border-l-4 border-violet-500" : ""
        }`}
      >
        <img
          src={user?.profilePic || assets.avatar_icon}
          alt=""
          className={`w-[35px] aspect-[1/1] rounded-full object-cover ${
            isOnline ? "ring-2 ring-green-500" : ""
          }`}
        />
        <div className="flex flex-col leading-5 flex-1">
          <p className="font-medium truncate">{user.fullName}</p>
          {isOnline ? (
            // ADDED subtle pulse animation
            <span className="text-green-400 text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>{" "}
              Online
            </span>
          ) : (
            <span className="text-neutral-400 text-xs">Offline</span>
          )}
        </div>
        {unseenMessages[user._id] > 0 && (
          <p className="text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500 text-white font-bold ml-auto">
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

  // Changed initialization from 'false' to empty string for cleaner logic
  const [input, setInput] = useState("");

  // OPTIMIZATION: Defer filter calculation for instant typing feedback
  const deferredInput = useDeferredValue(input);

  const navigate = useNavigate();

  // OPTIMIZATION: Filter using the deferred value
  const filteredUsers = deferredInput
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(deferredInput.toLowerCase())
      )
    : users;

  useEffect(() => {
    getUsers();
  }, [onlineUsers]);

  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="logo" className="max-w-40" />
          <div className="relative py-2 group">
            {/* ADDED subtle animation */}
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="max-h-5 cursor-pointer transform transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block transition-opacity duration-300">
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm hover:text-violet-400 transition-colors"
              >
                Edit Profile
              </p>
              <hr className="my-2 border-t border-gray-500" />
              <p
                onClick={() => logout()}
                className="cursor-pointer text-sm hover:text-red-400 transition-colors"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5 shadow-inner">
          <img src={assets.search_icon} alt="Search" className="w-3" />
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            className="bg-transparent border-none outline-none text-white text-sm placeholder-[#c8c8c8] flex-1"
            placeholder="Search User..."
          />
        </div>
      </div>

      {/* Use the new memoized component */}
      <div className="flex flex-col gap-1">
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
      </div>
    </div>
  );
};

export default Sidebar;
