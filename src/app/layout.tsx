import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "OpenContact.ai — Turn Business Cards Into Revenue",
  description: "Scan a business card. AI enriches. Auto follow-up. Close deals faster.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
