import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <p className="m-4">Loading...</p>;
    if (!user) return <Navigate to="/login" />;
    return children;
}
