"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/firebaseConfig/firebase";

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

// Create the context with undefined as default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch and cache user's role from custom claims
  const fetchUserRole = async (firebaseUser: User): Promise<string | null> => {
    try {
      console.log("🔍 Fetching custom claims for user:", firebaseUser.uid);
      const idTokenResult = await firebaseUser.getIdTokenResult();
      const userRole = (idTokenResult.claims.role as string) || null;
      console.log("✅ User role:", userRole);
      return userRole;
    } catch (error) {
      console.error("❌ Error fetching user role:", error);
      return null;
    }
  };

  // Function to refresh user role (useful after custom claims are updated)
  const refreshUserRole = async () => {
    if (user) {
      console.log("🔄 Refreshing user role...");
      // Force token refresh to get updated custom claims
      await user.getIdToken(true);
      const newRole = await fetchUserRole(user);
      setRole(newRole);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      console.log("👋 Signing out user...");
      await firebaseSignOut(auth);
      setUser(null);
      setRole(null);
      console.log("✅ User signed out successfully");
    } catch (error) {
      console.error("❌ Error signing out:", error);
      throw error;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    console.log("🎧 Setting up auth state listener...");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "🔔 Auth state changed:",
        firebaseUser ? "User logged in" : "User logged out",
      );

      if (firebaseUser) {
        // User is signed in
        setUser(firebaseUser);

        // Fetch custom claims (role)
        const userRole = await fetchUserRole(firebaseUser);
        setRole(userRole);

        setLoading(false);
      } else {
        // User is signed out
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("🔇 Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    role,
    loading,
    signOut,
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
