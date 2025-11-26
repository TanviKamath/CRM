"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect } from "react";
import Navbar from "./components/navbar";

export default function Layout({ children }) {
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Diamond Merchant System</title>
        <link
          href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
        />
      </head>

      <body className="font-sans antialiased bg-light">
        <Navbar />
        <main className="py-4">{children}</main>
      </body>
    </html>
  );
}
