import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import Spinner from "./components/Spinner";

// Sign-in and the box list load up front (the first screens people see). Every
// other page is downloaded only when it's first opened, so the camera scanner
// and QR libraries don't slow down the first load.
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const NewBoxPage = lazy(() => import("./pages/NewBoxPage"));
const BoxPage = lazy(() => import("./pages/BoxPage"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
const ScanCodePage = lazy(() => import("./pages/ScanCodePage"));
const LabelsPage = lazy(() => import("./pages/LabelsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

/**
 *  /login            sign in (email + password)
 *  /signup           create an account
 *  /forgot-password  email a password-reset link
 *  /reset-password   choose a new password (the reset email links here)
 *  /                 all boxes + search                 (HomePage)
 *  /boxes/new        create a box (?label=code to attach a scanned blank label)
 *  /boxes/:boxId     a box's items: add / edit / delete  (BoxPage)
 *  /q/:code          where a QR label points             (ScanPage)
 *  /scan             in-app camera scanner, any QR code  (ScanCodePage)
 *  /labels           print blank QR labels               (LabelsPage)
 */
export default function App() {
  return (
    <Suspense fallback={<Spinner label="Loading" />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="boxes/new" element={<NewBoxPage />} />
        <Route path="boxes/:boxId" element={<BoxPage />} />
        <Route path="q/:code" element={<ScanPage />} />
        <Route path="scan" element={<ScanCodePage />} />
        <Route path="labels" element={<LabelsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
