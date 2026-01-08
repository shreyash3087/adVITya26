import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { useLocation } from 'react-router-dom';

function Footer() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  const { user, logout } = useAuth();
  const { openHeader } = useUI();
  if (isDashboard) return null;
  return (
    <footer className="bg-[#060009] flex flex-col justify-center text-lg items-center text-center text-white min-h-[80px] py-8 gap-2">
      <div className="flex gap-4 text-xs sm:text-sm text-[#CDB7D9] font-medium tracking-wider">
        {!isDashboard && <Link to="/dashboard" className="hover:text-white transition-colors uppercase">DASHBOARD</Link>}
        {user ? (
          <button onClick={logout} className="hover:text-white transition-colors cursor-pointer uppercase">LOGOUT</button>
        ) : (
          <button onClick={() => openHeader('login')} className="hover:text-white transition-colors cursor-pointer uppercase">LOGIN</button>
        )}
      </div>
      <div>
        Advitya @ 2026. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
