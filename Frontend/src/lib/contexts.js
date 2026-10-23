const STORAGE_KEY = "aditus:context";

const ROLE_LABEL = {
  CLINIC_ADMIN: "Clinic admin",
  DOCTOR: "Doctor",
  ATTENDANT: "Attendant",
};

const ROLE_PATH = {
  CLINIC_ADMIN: "admin",
  DOCTOR: "doctor",
  ATTENDANT: "attendant",
};

// Turns the /me response into a flat list of places the user can go
export const buildContexts = (session) => {
  if (!session) return [];

  const list = [];

  if (session.globalRoles?.includes("PATIENT")) {
    list.push({
      key: "patient",
      role: "PATIENT",
      label: "Patient",
      detail: "Appointments and records",
      path: "/patient",
    });
  }

  for (const m of session.memberships ?? []) {
    const slug = ROLE_PATH[m.role];
    if (!slug) continue;
    const clinicName = m.clinic?.name ?? "Clinic";
    list.push({
      key: `${m.clinicId}:${m.role}`,
      role: m.role,
      clinicId: m.clinicId,
      clinicName,
      label: ROLE_LABEL[m.role],
      detail: clinicName,
      path: `/clinic/${m.clinicId}/${slug}`,
    });
  }

  if (session.globalRoles?.includes("SYSTEM_ADMIN")) {
    list.push({
      key: "admin",
      role: "SYSTEM_ADMIN",
      label: "System admin",
      detail: "Platform administration",
      path: "/admin",
    });
  }

  return list;
};

export const getLastContext = (userId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.userId === userId ? saved.key : null;
  } catch {
    return null;
  }
};

export const setLastContext = (userId, key) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, key }));
  } catch {}
};