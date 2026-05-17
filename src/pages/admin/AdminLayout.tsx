import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FileText, Video, Settings, ChevronLeft, Library } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScrollArea } from '../../components/ui/scroll-area';

export default function AdminLayout() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Topics / Modules', href: '/admin/topics', icon: BookOpen },
    { name: 'Worksheets', href: '/admin/worksheets', icon: FileText },
    { name: 'Content Manager', href: '/admin/content', icon: Video },
    { name: 'Library Manager', href: '/admin/library', icon: Library },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden text-sm">
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border bg-muted">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
            Admin CMS
          </div>
        </div>
        
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        
        <div className="p-4 border-t border-border">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Back to Student View
            </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
