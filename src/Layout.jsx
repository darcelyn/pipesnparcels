import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Settings,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Plus
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const navigation = [
    { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
    { name: 'Orders', page: 'Orders', icon: Package },
    { name: 'On Hold', page: 'OnHold', icon: Package },
    { name: 'Products', page: 'Products', icon: Package },
    { name: 'Inventory', page: 'Inventory', icon: Package },
    { name: 'Production', page: 'Production', icon: Package },
    { name: 'Staging', page: 'Staging', icon: Package },
    { name: 'Ready to Ship', page: 'ReadyToShip', icon: Truck },
    { name: 'Tracking', page: 'Shipments', icon: Truck },
    { name: 'Reports', page: 'Reports', icon: LayoutDashboard },
    { name: 'Settings', page: 'Settings', icon: Settings },
    { name: 'System Tools', page: 'ProductionPlanning', icon: Settings },
  ];

  const NavLink = ({ item }) => {
    const isActive = currentPageName === item.page;
    const Icon = item.icon;
    
    return (
      <Link
        to={createPageUrl(item.page)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
          isActive 
            ? 'bg-[#3a3a3a] text-white font-medium' 
            : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#252525] border-b border-[#3a3a3a] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-slate-600"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white">Pipes & Parcels</span>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-[#252525] border-r border-[#3a3a3a]
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">Pipes & Parcels</h1>
                <p className="text-xs text-gray-400">Shipping Made Easy</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action */}
          <div className="px-4 mb-4">
            <Link to={createPageUrl('CreateLabel')}>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200/50">
                <Plus className="w-4 h-4 mr-2" />
                Create Label
              </Button>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => (
              <NavLink key={item.page} item={item} />
            ))}
          </nav>

          {/* User Menu */}
          {user && (
            <div className="p-4 border-t border-[#3a3a3a]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors">
                    <div className="w-9 h-9 bg-[#3a3a3a] rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-white truncate">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-[#252525] border-[#3a3a3a]">
                  <DropdownMenuItem asChild className="text-white hover:bg-[#3a3a3a]">
                    <Link to={createPageUrl('Settings')} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#3a3a3a]" />
                  <DropdownMenuItem 
                    onClick={() => base44.auth.logout()}
                    className="text-red-400 cursor-pointer hover:bg-[#3a3a3a]"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {children}
      </main>
    </div>
  );
}