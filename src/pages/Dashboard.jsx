import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import AdminDashboard from '@/components/Dashboard/AdminDashboard.jsx';
import CoordinatorDashboard from '@/components/Dashboard/CoordinatorDashboard.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faLock } from '@fortawesome/free-solid-svg-icons';

export default function Dashboard() {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#12001A]">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <FontAwesomeIcon icon={faSpinner} spin className="text-6xl text-purple-600" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  const isAuthorized = userData?.type === 'admin' || userData?.type === 'coordinator';

  if (userData?.type === 'member') {
    navigate('/');
    return null;
  }

  if (!isAuthorized) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#12001A]">
      <div>
        {userData?.type === 'admin' ? (
          <AdminDashboard />
        ) : userData?.type === 'coordinator' ? (
          <CoordinatorDashboard clubName={userData.clubName} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Welcome, {user.name}</h1>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10">
              <p className="text-xl text-gray-300">Welcome to your dashboard. Event registrations will appear here.</p>
              <p className="text-sm text-gray-500 mt-4">Database connection is currently mocked for migration.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
