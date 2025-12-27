import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/lib/theme/context";
import { getThemeSettings } from "@/lib/actions/theme";
import { themes } from "@/lib/theme/types";
import { CurrencyProvider } from "@/lib/currency/context";
import { getCurrencySettings } from "@/lib/actions/currency";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dough & Bake - Freshly home baked from the finest ingredients",
  description: "Freshly home baked breads, pastries, and sweet treats made with premium, locally-sourced ingredients. Traditional recipes, handcrafted daily, delivered fresh to your door.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch theme settings from database
  const themeSettings = await getThemeSettings();
  const themeColors = themes[themeSettings.theme].colors;
  
  // Fetch currency settings from database
  const currencySettings = await getCurrencySettings();

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}>
        {/* Inject theme CSS variables server-side to prevent flash */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --theme-primary: ${themeColors.primary};
                --theme-secondary: ${themeColors.secondary};
                --theme-accent: ${themeColors.accent};
                --theme-tertiary: ${themeColors.tertiary};
                --theme-quaternary: ${themeColors.quaternary};
                --theme-background: ${themeColors.background};
                --theme-surface: ${themeColors.surface};
                --theme-text: ${themeColors.text};
                --theme-text-secondary: ${themeColors.textSecondary};
                --theme-gradient-start: ${themeColors.gradientStart};
                --theme-gradient-middle: ${themeColors.gradientMiddle};
                --theme-gradient-end: ${themeColors.gradientEnd};
              }
            `,
          }}
        />
        <ThemeProvider 
          initialTheme={themeSettings.theme}
          initialApplyLogoFilter={themeSettings.applyLogoFilter}
          skipClientFetch={true}
        >
          <CurrencyProvider
            initialCurrency={currencySettings?.mode === 'fixed' ? currencySettings.fixedCurrency : 'INR'}
            initialMode={currencySettings?.mode || 'fixed'}
            initialExchangeRates={currencySettings?.exchangeRates || {}}
            skipClientFetch={true}
          >
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
