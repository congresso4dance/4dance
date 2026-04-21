import type { Metadata } from "next";
import { Outfit, Montserrat } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import CustomCursor from "@/components/CustomCursor";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "600", "800"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://4dance.com.br"),
  title: "4Dance | Fotografia de Eventos de Dança de Salão",
  description: "Registramos a energia da dança. Encontre suas fotos de eventos e contrate a cobertura profissional da 4Dance.",
  keywords: ["fotografia de dança", "zouk", "samba", "forró", "cobertura de eventos", "4dance"],
  openGraph: {
    title: "4Dance | Memórias em Movimento",
    description: "Plataforma inteligente de entrega de fotos para eventos de dança.",
    url: "https://4dance.com.br",
    siteName: "4Dance",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "4Dance | O Olhar da Dança",
    description: "Cobertura fotográfica especializada em Dança de Salão.",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable} ${montserrat.variable}`}>
        <Preloader />
        <CustomCursor />
        <SmoothScroll>
          {children}
        </SmoothScroll>
        <WhatsAppButton />
      </body>
    </html>
  );
}
