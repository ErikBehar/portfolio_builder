import { Suspense } from "react";
import AdminLoginPage from "./page.client";

export default function AdminLogin() {
  return (
    <Suspense fallback={<div className="px-6 py-12 text-center text-muted">Loading...</div>}>
      <AdminLoginPage />
    </Suspense>
  );
}
