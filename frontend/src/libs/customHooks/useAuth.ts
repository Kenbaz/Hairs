import { useAppSelector } from "../_redux/hooks";
import { selectIsAuthenticated, selectUser } from "../_redux/authSlice";

export const useAuth = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  return {
    isAuthenticated,
    user,
    isLoading,
    isAdmin: Boolean(user?.is_staff || user?.is_superuser),
    isUser: Boolean(user && !user.is_staff && !user.is_superuser),
  };
};
