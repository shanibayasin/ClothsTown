import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-70 shrink-0">
        <Sidebar />
      </div>

      {/* Right Side */}
      <div className="flex flex-1 flex-col min-w-0">

        <Header />

        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <Sidebar />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-350">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
}