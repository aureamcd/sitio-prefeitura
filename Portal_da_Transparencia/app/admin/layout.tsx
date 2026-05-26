"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Home,
  DollarSign,
  Gavel,
  FileText,
  Handshake,
  Scale,
  Receipt,
  Users,
  LayoutDashboard,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

type Counts = {
  diarias: number;
  licitacoes: number;
  contratos: number;
  transferencias: number;
  legislacoes: number;
  publicacoes: number;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transparenciaOpen, setTransparenciaOpen] = useState(true);
  const [documentosOpen, setDocumentosOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({
    diarias: 0,
    licitacoes: 0,
    contratos: 0,
    transferencias: 0,
    legislacoes: 0,
    publicacoes: 0,
  });
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      setUser(user);
      setLoading(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user && !isLoginPage) {
        router.push("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoginPage, router, supabase.auth]);

  // Fetch counts
  useEffect(() => {
    if (isLoginPage || !user) return;

    async function fetchCounts() {
      const tables = [
        "diarias", "licitacoes", "contratos",
        "transferencias", "legislacoes", "publicacoes"
      ];
      const results = await Promise.all(
        tables.map(table =>
          supabase
            .schema(table === "legislacoes" || table === "publicacoes" ? "public" : "transparencia")
            .from(table)
            .select("id", { count: "exact", head: true })
        )
      );

      setCounts({
        diarias: results[0].count || 0,
        licitacoes: results[1].count || 0,
        contratos: results[2].count || 0,
        transferencias: results[3].count || 0,
        legislacoes: results[4].count || 0,
        publicacoes: results[5].count || 0,
      });
    }

    fetchCounts();
  }, [isLoginPage, user, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  // Login page: render without shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#173572] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isTransparenciaActive =
    pathname.startsWith("/admin/diarias") ||
    pathname.startsWith("/admin/licitacoes") ||
    pathname.startsWith("/admin/contratos") ||
    pathname.startsWith("/admin/transferencias");

  const isDocumentosActive =
    pathname.startsWith("/admin/legislacoes") ||
    pathname.startsWith("/admin/publicacoes");

  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <Link
            href="/admin"
            className="flex items-center gap-3"
            onClick={onNavigate}
          >
            <div className="w-10 h-10 bg-[#173572] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">
                Painel Transparência
              </p>
              <p className="text-[11px] text-gray-400">Padre Marcos - PI</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          <Link
            href="/admin"
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === "/admin"
                ? "bg-[#173572]/5 text-[#173572]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <LayoutDashboard
              className={`w-5 h-5 ${
                pathname === "/admin" ? "text-[#173572]" : "text-gray-400"
              }`}
            />
            <span className="flex-1 text-left">Dashboard</span>
          </Link>

          {/* ── Execução Orçamentária (submenu) ── */}
          <button
            onClick={() => setTransparenciaOpen(!transparenciaOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isTransparenciaActive
                ? "bg-[#173572]/5 text-[#173572]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Receipt
              className={`w-5 h-5 ${
                isTransparenciaActive ? "text-[#173572]" : "text-gray-400"
              }`}
            />
            <span className="flex-1 text-left">Transparência</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                transparenciaOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {transparenciaOpen && (
            <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-0.5">
              {/* Diárias */}
              <Link
                href="/admin/diarias"
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname.startsWith("/admin/diarias")
                    ? "bg-[#173572] text-white font-semibold shadow-md shadow-blue-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <DollarSign className={`w-4 h-4 ${pathname.startsWith("/admin/diarias") ? "text-white" : "text-green-500"}`} />
                <span className="flex-1">Diárias</span>
                <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold text-gray-500 bg-gray-100">{counts.diarias}</span>
              </Link>

              {/* Licitações */}
              <Link
                href="/admin/licitacoes"
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname.startsWith("/admin/licitacoes")
                    ? "bg-[#173572] text-white font-semibold shadow-md shadow-blue-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Gavel className={`w-4 h-4 ${pathname.startsWith("/admin/licitacoes") ? "text-white" : "text-orange-500"}`} />
                <span className="flex-1">Licitações</span>
                <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold text-gray-500 bg-gray-100">{counts.licitacoes}</span>
              </Link>

              {/* Contratos */}
              <Link
                href="/admin/contratos"
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname.startsWith("/admin/contratos")
                    ? "bg-[#173572] text-white font-semibold shadow-md shadow-blue-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <FileText className={`w-4 h-4 ${pathname.startsWith("/admin/contratos") ? "text-white" : "text-blue-500"}`} />
                <span className="flex-1">Contratos</span>
                <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold text-gray-500 bg-gray-100">{counts.contratos}</span>
              </Link>

              {/* Convênios */}
              <Link
                href="/admin/transferencias"
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname.startsWith("/admin/transferencias")
                    ? "bg-[#173572] text-white font-semibold shadow-md shadow-blue-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Handshake className={`w-4 h-4 ${pathname.startsWith("/admin/transferencias") ? "text-white" : "text-purple-500"}`} />
                <span className="flex-1">Convênios</span>
                <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold text-gray-500 bg-gray-100">{counts.transferencias}</span>
              </Link>
            </div>
          )}

          {/* ── Documentos (submenu) ── */}
          <button
            onClick={() => setDocumentosOpen(!documentosOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isDocumentosActive
                ? "bg-[#173572]/5 text-[#173572]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FileText
              className={`w-5 h-5 ${
                isDocumentosActive ? "text-[#173572]" : "text-gray-400"
              }`}
            />
            <span className="flex-1 text-left">Documentos</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                documentosOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {documentosOpen && (
            <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-0.5">
              <Link
                href="/admin/legislacoes"
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname.startsWith("/admin/legislacoes")
                    ? "bg-[#173572] text-white font-semibold shadow-md shadow-blue-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Scale className={`w-4 h-4 ${pathname.startsWith("/admin/legislacoes") ? "text-white" : "text-emerald-500"}`} />
                <span className="flex-1">Leis e Normas</span>
                <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold text-gray-500 bg-gray-100">{counts.legislacoes}</span>
              </Link>

              <Link
                href="/admin/publicacoes"
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname.startsWith("/admin/publicacoes")
                    ? "bg-[#173572] text-white font-semibold shadow-md shadow-blue-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Users className={`w-4 h-4 ${pathname.startsWith("/admin/publicacoes") ? "text-white" : "text-cyan-500"}`} />
                <span className="flex-1">Publicações</span>
                <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold text-gray-500 bg-gray-100">{counts.publicacoes}</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Footer: Home + User + Logout */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition"
          >
            <Home className="w-4 h-4" />
            Ir para página inicial
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#173572]/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-[#173572]">
                {user?.email?.[0]?.toUpperCase() || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user?.email}
              </p>
              <p className="text-[10px] text-gray-400">Administrador</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200 fixed inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 lg:hidden flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#173572]" />
            <span className="font-bold text-gray-900">Painel Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <SidebarContent onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#173572]" />
              <span className="font-bold text-sm text-gray-900">
                Painel Transparência
              </span>
            </div>
            <div className="w-9" />
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
