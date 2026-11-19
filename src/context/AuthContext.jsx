// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEFAULT_STAFF = [
  {
    id: 'staff-1',
    name: 'Balcha (Owner)',
    phone: '0911000000',
    password: 'admin',
    role: 'admin', // 'admin' (Owner) vs 'front_desk'
    status: 'active', // 'active' | 'deactivated' (fired)
    createdAt: '2026-01-10',
  },
  {
    id: 'staff-2',
    name: 'Selam Tesfaye',
    phone: '0911112233',
    password: 'desk',
    role: 'front_desk',
    status: 'active',
    createdAt: '2026-02-01',
  },
  {
    id: 'staff-3',
    name: 'Dawit Mekonnen',
    phone: '0922334455',
    password: 'desk',
    role: 'front_desk',
    status: 'active',
    createdAt: '2026-02-15',
  },
];

export function AuthProvider({ children }) {
  // Load staff database from localStorage or default
  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('balcha_staff_db');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_STAFF;
  });

  // Load current logged in user
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('balcha_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default to null so user must authenticate first
    return null;
  });

  // Save staff list whenever modified
  useEffect(() => {
    localStorage.setItem('balcha_staff_db', JSON.stringify(staffList));
  }, [staffList]);

  // Save active user whenever changed
  useEffect(() => {
    if (user) {
      localStorage.setItem('balcha_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('balcha_auth_user');
    }
  }, [user]);

  function login(phone, password) {
    const trimmedPhone = phone.trim();
    const staff = staffList.find(
      (s) => (s.phone === trimmedPhone || s.name.toLowerCase().includes(trimmedPhone.toLowerCase())) && s.password === password
    );

    if (!staff) {
      throw new Error('Invalid phone number or password.');
    }

    if (staff.status === 'deactivated') {
      throw new Error('Access Revoked: This worker account has been deactivated/fired by the owner.');
    }

    const sessionUser = {
      id: staff.id,
      name: staff.name,
      phone: staff.phone,
      role: staff.role,
      token: `balcha-jwt-${Date.now()}`,
    };

    setUser(sessionUser);
    return sessionUser;
  }

  function logout() {
    setUser(null);
  }

  // Owner action: Add new worker
  function addStaff({ name, phone, password, role = 'front_desk' }) {
    if (staffList.some((s) => s.phone === phone.trim())) {
      throw new Error('A staff member with this phone number already exists.');
    }

    const newWorker = {
      id: `staff-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      password: password || '1234',
      role,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setStaffList((prev) => [newWorker, ...prev]);
    return newWorker;
  }

  // Owner action: Fire / Deactivate or Reactivate worker
  function toggleStaffStatus(staffId) {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          const nextStatus = s.status === 'active' ? 'deactivated' : 'active';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );

    // If owner just deactivated the currently logged in user, log them out
    if (user && user.id === staffId) {
      logout();
    }
  }

  // Owner action: Delete worker permanently
  function deleteStaff(staffId) {
    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    if (user && user.id === staffId) {
      logout();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        staffList,
        login,
        logout,
        addStaff,
        toggleStaffStatus,
        deleteStaff,
        isOwner: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}