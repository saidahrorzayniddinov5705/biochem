import { Outlet, Link, useLocation } from 'react-router-dom';
import { useUserStore } from '../lib/store';
import { useSettingsStore } from '../lib/settingsStore';
import { getTranslation } from '../lib/i18n';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { BookOpen, LayoutDashboard, BrainCircuit, Library, FileText, Settings, LogOut, Beaker, Sun, Moon, Globe, Users, Menu, Home, Key, Trophy, Edit, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Layout() {
  const { user, firebaseUser } = useUserStore();
  const location = useLocation();
  const { theme, setTheme, language, setLanguage } = useSettingsStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const { setUser } = useUserStore();

  // Reset edit name when user opens modal
  const openProfileModal = () => {
    setEditName(user?.displayName || '');
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      toast.error('Ism kiritish majburiy');
      return;
    }
    
    if (firebaseUser?.uid) {
      setIsUpdatingProfile(true);
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userRef, {
          displayName: editName.trim()
        });
        
        setUser({
          ...user,
          displayName: editName.trim()
        }, firebaseUser);
        
        toast.success("Profil muvaffaqiyatli yangilandi");
        setShowProfileModal(false);
      } catch (error: any) {
        toast.error("Profilni yangilashda xatolik yuz berdi");
        console.error(error);
      } finally {
        setIsUpdatingProfile(false);
      }
    }
  };

  const navigation = [
    { key: 'home', href: '/', icon: Home, fallbackLabel: 'Home' },
    { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'modules', href: '/darslar', icon: BookOpen },
    { key: 'aiTutor', href: '/ai-tutor', icon: BrainCircuit },
    { key: 'library', href: '/library', icon: Library },
    { key: 'worksheets', href: '/worksheets', icon: FileText },
    { key: 'lab', href: '/lab', icon: Beaker },
    { key: 'leaderboard', href: '/leaderboard', icon: Trophy, fallbackLabel: 'Leaderboard' },
    { key: 'founders', href: '/founders', icon: Users, fallbackLabel: 'Founders' },
  ];

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden text-sm">
      {/* Top Navbar */}
      <header className="h-14 sm:h-[76px] border-b bg-card shrink-0 z-10 w-full shadow-sm">
        <div className="flex items-center justify-between px-2 sm:px-6 lg:px-8 h-full max-w-[1600px] mx-auto w-full gap-2 sm:gap-4">
          
          <div className="flex items-center shrink-0">
            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1.5 sm:p-2 sm:mr-2 rounded-xl hover:bg-muted lg:hidden outline-none flex items-center justify-center">
                <Menu className="w-6 h-6 text-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 lg:hidden">
                {navigation.map((item) => (
                  <Link key={item.key} to={item.href}>
                    <DropdownMenuItem className="cursor-pointer">
                      <item.icon className="w-4 h-4 mr-2" />
                      {getTranslation(language, 'sidebar', item.key) || item.fallbackLabel}
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/" className="flex items-center relative py-1 sm:py-2">
              <img src="/logo.png" alt="BioChem Logo" className="h-10 sm:h-[50px] md:h-[65px] w-auto object-contain -ml-2 sm:-ml-0" />
            </Link>
          </div>
            
          <nav className="hidden lg:flex flex-1 justify-center items-center gap-1.5 px-4 overflow-x-auto no-scrollbar">
            {navigation.map((item) => {
              const isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all font-medium text-[13px] xl:text-sm whitespace-nowrap",
                    isActive 
                      ? "bg-primary/10 text-primary shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{getTranslation(language, 'sidebar', item.key) || item.fallbackLabel}</span>
                </Link>
              );
            })}
          </nav>

        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
          {/* Language Control */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors outline-none">
              <Globe className="w-4 h-4" />
              <span className="uppercase text-[10px] sm:text-xs font-bold">{language}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('uz')}>O'zbek</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('ru')}>Русский</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-border mx-1 sm:mx-2 hidden sm:block"></div>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-full hover:bg-muted transition-colors outline-none border border-transparent hover:border-border">
                <div className="hidden sm:block text-right mr-1">
                  <div className="text-sm font-medium text-foreground leading-none mb-1">{user.displayName || 'Student'}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">Lvl {Math.min(10, Math.floor((user.xp || 0) / 1000) + 1)} • {user.xp || 0} XP</div>
                </div>
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border">
                  <AvatarImage src={firebaseUser?.photoURL || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{user.displayName?.charAt(0) || 'S'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                 <DropdownMenuItem className="cursor-pointer" onClick={openProfileModal}>
                    <UserIcon className="w-4 h-4 mr-2" />
                    Profilni tahrirlash
                 </DropdownMenuItem>
                 {user.role === 'admin' && (
                    <Link to="/admin">
                       <DropdownMenuItem className="cursor-pointer">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          {getTranslation(language, 'sidebar', 'admin')}
                       </DropdownMenuItem>
                    </Link>
                 )}
                 <DropdownMenuItem className="cursor-pointer sm:hidden" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                    Theme toggle
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  Kirish
                </button>
              </Link>
              <Link to="/login">
                <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-full transition-colors">
                  Boshlash
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden relative bg-background">
        <main className="h-full overflow-y-auto flex flex-col relative w-full">
          <Outlet />
        </main>
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-2xl border shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" /> Profilni tahrirlash
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Ism va familiyangizni kiriting
            </p>
            <input 
              type="text" 
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
              placeholder="Ism va familiya"
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                disabled={isUpdatingProfile}
              >
                Bekor qilish
              </button>
              <button 
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile || !editName.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
              >
                {isUpdatingProfile ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
