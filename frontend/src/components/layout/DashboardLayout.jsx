import Navbar from './Navbar';
import Sidebar from './Sidebar';

function DashboardLayout({ title = 'Dashboard', children }) {
  return (
    <div className="min-h-screen bg-background text-primary">
      <Sidebar />

      <div className="ml-60 min-h-screen">
        <Navbar title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
