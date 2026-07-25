"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Home,
  Newspaper,
  FileText,
  MessageCircle,
  Scale,
  Database,
  Gavel,
  HardHat,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { TABELAS_TRANSPARENCIA } from "@/lib/admin/transparencia-tables";

type Counts = {
  pendentes: number;
  publicadas: number;
  rejeitadas: number;
  esic_pendentes: number;
  ouvidoria_pendentes: number;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noticiasOpen, setNoticiasOpen] = useState(true);
  const [transparenciaOpen, setTransparenciaOpen] = useState(true);
  const [counts, setCounts] = useState<Counts>({
    pendentes: 0,
    publicadas: 0,
    rejeitadas: 0,
    esic_pendentes: 0,
    ouvidoria_pendentes: 0,
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
      const [p, pub, r, esic, ouv] = await Promise.all([
        supabase
          .from("noticias")
          .select("id", { count: "exact", head: true })
          .eq("status", "pendente"),
        supabase
          .from("noticias")
          .select("id", { count: "exact", head: true })
          .eq("status", "publicado"),
        supabase
          .from("noticias")
          .select("id", { count: "exact", head: true })
          .eq("status", "rejeitado"),
        supabase
          .from("esic_solicitacoes")
          .select("id", { count: "exact", head: true })
          .eq("status", "recebido"),
        supabase
          .from("ouvidoria_manifestacoes")
          .select("id", { count: "exact", head: true })
          .eq("status", "recebido"),
      ]);

      setCounts({
        pendentes: p.count || 0,
        publicadas: pub.count || 0,
        rejeitadas: r.count || 0,
        esic_pendentes: esic.count || 0,
        ouvidoria_pendentes: ouv.count || 0,
      });
    }

    fetchCounts();

    // Atualiza também via evento customizado do painel
    const handleRefresh = () => fetchCounts();
    window.addEventListener("refresh-counts", handleRefresh);

    return () => {
      window.removeEventListener("refresh-counts", handleRefresh);
    };
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
          <div className="w-10 h-10 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const SUB_ITEMS = [
    {
      label: "Pendentes",
      href: "/admin/pendentes",
      icon: Clock,
      count: counts.pendentes,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Publicadas",
      href: "/admin/publicadas",
      icon: CheckCircle2,
      count: counts.publicadas,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "Rejeitadas",
      href: "/admin/rejeitadas",
      icon: XCircle,
      count: counts.rejeitadas,
      color: "text-red-600",
      bg: "bg-red-100",
    },
    {
      label: "Nova Notícia",
      href: "/admin/nova",
      icon: PlusCircle,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
  ];

  const isNoticiasActive =
    pathname.startsWith("/admin/pendentes") ||
    pathname.startsWith("/admin/publicadas") ||
    pathname.startsWith("/admin/rejeitadas") ||
    pathname.startsWith("/admin/editar") ||
    pathname === "/admin/nova" ||
    pathname === "/admin";

  const isTransparenciaActive = TABELAS_TRANSPARENCIA.some((t) =>
    pathname.startsWith(`/admin/${t.slug}`)
  );

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
            <div className="w-10 h-10 bg-[#0B3D91] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">
                Painel Admin
              </p>
              <p className="text-[11px] text-gray-400">Padre Marcos - PI</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Notícias (com submenu) */}
          <button
            onClick={() => setNoticiasOpen(!noticiasOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isNoticiasActive
                ? "bg-[#0B3D91]/5 text-[#0B3D91]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Newspaper
              className={`w-5 h-5 ${
                isNoticiasActive ? "text-[#0B3D91]" : "text-gray-400"
              }`}
            />
            <span className="flex-1 text-left">Notícias</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                noticiasOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Sub-items */}
          {noticiasOpen && (
            <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-0.5">
              {SUB_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-[#0B3D91] text-white font-semibold shadow-md shadow-blue-200"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-white" : item.color
                      }`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.count !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold min-w-[22px] text-center ${
                          isActive
                            ? "bg-white/20 text-white"
                            : `${item.bg} ${item.color}`
                        }`}
                      >
                        {item.count > 99 ? "99+" : item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── e-SIC ── */}
          <Link
            href="/admin/esic"
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname.startsWith("/admin/esic")
                ? "bg-[#0B3D91] text-white font-semibold shadow-md shadow-blue-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FileText
              className={`w-5 h-5 ${
                pathname.startsWith("/admin/esic") ? "text-white" : "text-blue-500"
              }`}
            />
            <span className="flex-1">e-SIC</span>
            {counts.esic_pendentes > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-600 animate-pulse">
                {counts.esic_pendentes} NOVOS
              </span>
            )}
          </Link>

          {/* ── Leis e Normas ── */}
          <Link
            href="/admin/legislacoes"
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname.startsWith("/admin/legislacoes")
                ? "bg-[#0B3D91] text-white font-semibold shadow-md shadow-blue-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Scale
              className={`w-5 h-5 ${
                pathname.startsWith("/admin/legislacoes") ? "text-white" : "text-emerald-600"
              }`}
            />
            <span className="flex-1">Leis e Normas</span>
          </Link>

          {/* ── Licitações ── */}
          <Link
            href="/admin/licitacoes"
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname.startsWith("/admin/licitacoes")
                ? "bg-[#0B3D91] text-white font-semibold shadow-md shadow-blue-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Gavel
              className={`w-5 h-5 ${
                pathname.startsWith("/admin/licitacoes") ? "text-white" : "text-orange-600"
              }`}
            />
            <span className="flex-1">Licitações</span>
          </Link>

          {/* ── Contratos ── */}
          <Link
            href="/admin/contratos"
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname.startsWith("/admin/contratos")
                ? "bg-[#0B3D91] text-white font-semibold shadow-md shadow-blue-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FileText
              className={`w-5 h-5 ${
                pathname.startsWith("/admin/contratos") ? "text-white" : "text-blue-600"
              }`}
            />
            <span className="flex-1">Contratos</span>
          </Link>

          {/* ── Obras ── */}
          <Link
            href="/admin/obras"
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname.startsWith("/admin/obras")
                ? "bg-[#0B3D91] text-white font-semibold shadow-md shadow-blue-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <HardHat
              className={`w-5 h-5 ${
                pathname.startsWith("/admin/obras") ? "text-white" : "text-amber-500"
              }`}
            />
            <span className="flex-1">Obras</span>
          </Link>

          {/* ── Publicações ── */}
          <Link
            href="/admin/publicacoes"
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname.startsWith("/admin/publicacoes")
                ? "bg-[#0B3D91] text-white font-semibold shadow-md shadow-blue-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FileText
              className={`w-5 h-5 ${
                pathname.startsWith("/admin/publicacoes") ? "text-white" : "text-cyan-600"
              }`}
            />
            <span className="flex-1">Publicações</span>
          </Link>

          {/* ── Ouvidoria ── */}
          <Link
            href="/admin/ouvidoria"
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname.startsWith("/admin/ouvidoria")
                ? "bg-[#0B3D91] text-white font-semibold shadow-md shadow-blue-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <MessageCircle
              className={`w-5 h-5 ${
                pathname.startsWith("/admin/ouvidoria") ? "text-white" : "text-purple-500"
              }`}
            />
            <span className="flex-1">Ouvidoria</span>
            {counts.ouvidoria_pendentes > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-600 animate-pulse">
                {counts.ouvidoria_pendentes} NOVOS
              </span>
            )}
          </Link>

          {/* ── Separador ── */}
          <div className="pt-2 pb-1">
            <div className="border-t border-gray-100" />
          </div>

          {/* ═══ PORTAL DA TRANSPARÊNCIA ═══ */}
          <button
            onClick={() => setTransparenciaOpen(!transparenciaOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isTransparenciaActive
                ? "bg-[#0B3D91]/5 text-[#0B3D91]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Database
              className={`w-5 h-5 ${
                isTransparenciaActive ? "text-[#0B3D91]" : "text-gray-400"
              }`}
            />
            <span className="flex-1 text-left">Portal da Transparência</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                transparenciaOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Sub-items da Transparência */}
          {transparenciaOpen && (
            <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-0.5">
              {TABELAS_TRANSPARENCIA.filter(t => t.slug !== 'licitacoes' && t.slug !== 'contratos').map((t) => {
                const isActive = pathname.startsWith(`/admin/${t.slug}`);
                const Icon = t.icon;

                return (
                  <Link
                    key={t.slug}
                    href={`/admin/${t.slug}`}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-[#0B3D91] text-white font-semibold shadow-md shadow-blue-200"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-white" : t.color
                      }`}
                    />
                    <span className="flex-1">{t.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer: Home + User + Logout */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* Ir para página inicial */}
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition"
          >
            <Home className="w-4 h-4" />
            Ir para página inicial
          </Link>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0B3D91]/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-[#0B3D91]">
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

          {/* Logout */}
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
      {/* ═══ SIDEBAR (Desktop) ═══ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200 fixed inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* ═══ MOBILE OVERLAY ═══ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ SIDEBAR (Mobile) ═══ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 lg:hidden flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0B3D91]" />
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

      {/* ═══ MAIN CONTENT ═══ */}
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
              <Shield className="w-5 h-5 text-[#0B3D91]" />
              <span className="font-bold text-sm text-gray-900">
                Painel Admin
              </span>
            </div>
            <div className="w-9" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
