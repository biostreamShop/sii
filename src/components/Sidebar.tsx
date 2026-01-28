"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Calculator,
  Upload,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Ventas", href: "/ventas", icon: TrendingUp },
  { name: "Compras", href: "/compras", icon: ShoppingCart },
  { name: "IVA Mensual", href: "/iva", icon: Calculator },
  { name: "Importar CSV", href: "/importar", icon: Upload },
  { name: "Configuración", href: "/configuracion", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-white">
      <div className="flex items-center justify-center h-16 border-b border-slate-700">
        <h1 className="text-xl font-bold">Gestión SII</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">
          Administrador de Ventas y Compras v1.0
        </p>
      </div>
    </div>
  );
}
