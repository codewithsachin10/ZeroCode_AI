import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(false);
      
      if (currentUser) {
        // Subscribe to user doc for role
        const userRef = doc(db, "users", currentUser.uid);
        const unSubDoc = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
             setIsAdmin(["admin", "super_admin"].includes(doc.data().role));
          } else {
             setIsAdmin(false);
          }
          setLoading(false);
        });
        return () => unSubDoc();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, isAdmin, loading };
};
