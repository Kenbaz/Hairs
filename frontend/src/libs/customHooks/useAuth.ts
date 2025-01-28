import { useAppSelector } from "../_redux/hooks";
import { selectIsAuthenticated, selectUser } from "../_redux/authSlice";

export const useAuth = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  return {
    isAuthenticated,
    user,
    isAdmin: Boolean(user?.is_staff || user?.is_superuser),
  };
};
