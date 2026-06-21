export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
}

export const registerUser = async (args: { data: RegisterData }) => {
  return { success: false, error: "Base de données SQL indisponible sur ce déploiement frontend." };
};

export const loginUser = async (args: { data: { email: string; password?: string } }) => {
  return { success: false, error: "Base de données SQL indisponible sur ce déploiement frontend." };
};

export const getRegistrations = async (args: { data: { adminEmail: string } }) => {
  return {
    success: true,
    registrations: [],
  };
};
