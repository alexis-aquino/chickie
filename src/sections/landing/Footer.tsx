import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Chickie" className="size-7 rounded-full object-cover opacity-80" />
          <span className="text-sm font-medium text-white">Chickie</span>
          <span className="text-xs hidden sm:inline">— Integrated Supply Chain &amp; CRM System</span>
        </div>
        <p className="text-xs text-center">© 2026 Chickie Supply Chain Suite. All rights reserved.</p>
      </div>
    </footer>
  );
}
