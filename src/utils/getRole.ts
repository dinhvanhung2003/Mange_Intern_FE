import axios from "axios";

axios.defaults.withCredentials = true; // Gửi cookie kèm request

export const getRoleFromServer = async (): Promise<string> => {
  try {
    const res = await axios.get("http://localhost:3000/auth/me", { withCredentials: true })
    return res.data?.type || ""; // BE trả về role
  } catch (err) {
    console.error("Lỗi lấy role:", err);
    return "";
  }
};
