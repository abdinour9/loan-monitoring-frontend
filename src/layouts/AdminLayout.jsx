import Sidebar from "../components/Sidebar";

function AdminLayout({ setIsAuthenticated, setUserRole, children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - fixed on desktop with auth props */}
      <Sidebar 
        setIsAuthenticated={setIsAuthenticated}
        setUserRole={setUserRole}
      />
      
      {/* Main Content - with left margin to account for fixed sidebar */}
      <div className="flex-1 lg:ml-64 transition-all duration-300">
        {/* Mobile Spacer for Hamburger Menu */}
        <div className="lg:hidden h-16" />
        
        {/* Content Area */}
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;