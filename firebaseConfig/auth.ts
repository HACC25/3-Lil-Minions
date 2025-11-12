// firebaseConfig/auth.ts

import { auth, firestore } from "./firebase";

export { auth };
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

// Check if user is an admin
export const checkAdminRole = async (user: User): Promise<boolean> => {
  try {
    const adminRef = doc(firestore, "Admin", user.uid);
    const adminSnapshot = await getDoc(adminRef);
    return adminSnapshot.exists();
  } catch (error) {
    console.error("Error checking admin role:", error);
    return false;
  }
};

export const userRole = async (user: User): Promise<string | null> => {
  try {
    const adminRef = doc(firestore, "Admin", user.uid);

    const [adminSnapshot] = await Promise.all([getDoc(adminRef)]);

    if (adminSnapshot.exists()) return "admin";
    return null;
  } catch (error) {
    console.error("Error checking log in:", error);
    return null;
  }
};

// Sign in with admin role verification
export const adminSignIn = async (
  email: string,
  password: string,
): Promise<{ user: User; isAdmin: boolean }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const isAdmin = await checkAdminRole(userCredential.user);

    if (!isAdmin) {
      await signOut(auth);
      throw new Error("User is not an admin");
    }

    return { user: userCredential.user, isAdmin };
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Create or update admin user
export const setAdminRole = async (uid: string, email: string) => {
  try {
    const adminRef = doc(firestore, "Admin", uid);
    await setDoc(adminRef, {
      email,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log("Admin role created for user:", uid);
  } catch (error) {
    console.error("Error creating admin role:", error);
    throw error;
  }
};

export const toggleSignIn = adminSignIn;
export const toggleSignOut = signOut;
export const stateChange = onAuthStateChanged;
