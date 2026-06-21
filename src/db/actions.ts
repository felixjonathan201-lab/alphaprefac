import { createServerFn } from "@tanstack/react-start";
import { db } from "./index.ts";
import { users } from "./schema.ts";
import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export const registerUser = createServerFn({ method: "POST" })
  .validator(
    (data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password?: string;
    }) => {
      if (!data.email || !data.firstName || !data.lastName || !data.password) {
        throw new Error("Champs obligatoires manquants.");
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    if (!process.env.SQL_HOST) {
      return { success: false, error: "Base de données SQL non configurée." };
    }
    try {
      const emailLower = data.email.toLowerCase().trim();

      // 1. Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, emailLower))
        .limit(1);

      if (existingUser.length > 0) {
        return { success: false, error: "Cet email est déjà utilisé." };
      }

      // 2. Hash password and decide role
      const passwordHash = hashPassword(data.password!);
      const role =
        emailLower === "felixjonathan201@gmail.com" || emailLower === "devhaitian@gmail.com"
          ? "admin"
          : "student";

      // 3. Insert and return user
      const result = await db
        .insert(users)
        .values({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: emailLower,
          phone: data.phone?.trim() || null,
          passwordHash,
          role,
        })
        .returning();

      if (result.length > 0) {
        const u = result[0];
        return {
          success: true,
          user: {
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            phone: u.phone,
            role: u.role,
            createdAt: u.createdAt,
          },
        };
      }
      return { success: false, error: "Erreur lors de la création du compte." };
    } catch (error) {
      console.error("Database registration failed:", error);
      return { success: false, error: "Une erreur de base de données est survenue." };
    }
  });

export const loginUser = createServerFn({ method: "POST" })
  .validator((data: { email: string; password?: string }) => {
    if (!data.email || !data.password) {
      throw new Error("Email et mot de passe requis.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    if (!process.env.SQL_HOST) {
      return { success: false, error: "Base de données SQL non configurée." };
    }
    try {
      const emailLower = data.email.toLowerCase().trim();

      // 1. Fetch user
      const result = await db.select().from(users).where(eq(users.email, emailLower)).limit(1);

      if (result.length === 0) {
        return { success: false, error: "Adresse email ou mot de passe incorrect." };
      }

      const u = result[0];
      const inputHash = hashPassword(data.password!);

      if (inputHash !== u.passwordHash) {
        return { success: false, error: "Adresse email ou mot de passe incorrect." };
      }

      return {
        success: true,
        user: {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phone: u.phone,
          role: u.role,
          createdAt: u.createdAt,
        },
      };
    } catch (error) {
      return { success: false, error: "Une erreur est survenue lors de la connexion." };
    }
  });

export const getRegistrations = createServerFn({ method: "GET" })
  .validator((data: { adminEmail: string }) => {
    const emailLower = data.adminEmail.toLowerCase().trim();
    if (emailLower !== "felixjonathan201@gmail.com" && emailLower !== "devhaitian@gmail.com") {
      throw new Error("Accès refusé.");
    }
    return data;
  })
  .handler(async () => {
    if (!process.env.SQL_HOST) {
      return {
        success: true,
        registrations: [],
      };
    }
    try {
      const results = await db.select().from(users).orderBy(users.createdAt);

      return {
        success: true,
        registrations: results.map((u) => ({
          id: u.id.toString(),
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phone: u.phone,
          role: u.role,
          createdAt: u.createdAt ? u.createdAt.toISOString() : null,
        })),
      };
    } catch (error) {
      return {
        success: true,
        registrations: [],
      };
    }
  });
