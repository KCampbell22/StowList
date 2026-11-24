import { Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Spinner from "./Spinner";
import { useAuth } from "../auth/AuthProvider";

/** Header + page content for every signed-in screen. */
export default function Layout() {
  const { signOut } = useAuth();

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <NavLink to="/" className="brand">StowList</NavLink>
          <nav aria-label="Main">
            <NavLink to="/" end>Boxes</NavLink>
            {/* Hidden on computers with a mouse; see .nav-scan in styles.css */}
            <NavLink to="/scan" className="nav-scan">Scan</NavLink>
            <NavLink to="/labels">Labels</NavLink>
            <button type="button" className="btn-link" onClick={signOut}>Sign out</button>
          </nav>
        </div>
      </header>
      <main id="main" className="container" tabIndex={-1}>
        {/* Pages load on demand (see App.jsx); keep the header while one arrives */}
        <Suspense fallback={<Spinner label="Loading" />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
