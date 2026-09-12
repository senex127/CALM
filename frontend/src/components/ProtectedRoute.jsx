import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Usage : <Route element={<ProtectedRoute roles={['ADMIN']} />}>...</Route>
export default function ProtectedRoute({ roles, children }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/connexion" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
