"use client";

import { useState, useEffect } from "react";
import { useAppDispatch } from "@/src/libs/_redux/hooks";
import { loadUser, refreshAccessToken } from "@/src/libs/_redux/authSlice";
import { JWTUtil } from "@/src/utils/jwt";


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Explicitly log the tokens from localStorage
        const localStorageAccessToken = localStorage.getItem("accessToken");

        // If there's a token in localStorage
        if (localStorageAccessToken) {
          // Check if token is expired
          if (JWTUtil.isTokenExpired(localStorageAccessToken)) {
            console.log("Token is expired, attempting to refresh");

            // Attempt to refresh token
            await dispatch(refreshAccessToken()).unwrap();
          }

          await dispatch(loadUser()).unwrap();
          
        }
      } catch (error) {
        console.error("Authentication initialization failed:", error);
        // Optionally clear tokens if authentication fails
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } finally {
        setIsInitializing(false);
      }
    };

    // Force client-side execution
    if (typeof window !== "undefined") {
      initializeAuth();
    }
  }, [dispatch]);

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="">
      </div>
    );
  }

  return <>{children}</>;
}
