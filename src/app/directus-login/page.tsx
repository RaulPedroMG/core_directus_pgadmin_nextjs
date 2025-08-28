import { DirectusLoginForm } from "@/components/DirectusLoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login Directus - ShipFree",
  description: "Iniciar sesión con tu cuenta de Directus",
  openGraph: {
    title: "Login Directus | ShipFree",
    description: "Accede a tu panel de usuario con Directus",
  },
};

export default function DirectusLogin() {
  return <DirectusLoginForm />;
}
