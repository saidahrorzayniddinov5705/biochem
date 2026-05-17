import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firestore-errors';
import { useSettingsStore } from '../lib/settingsStore';
import { getTranslation } from '../lib/i18n';
import { Card, CardContent } from '../components/ui/card';
import { Book, Download, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button, buttonVariants } from '../components/ui/button';

export default function Library() {
  const { language } = useSettingsStore();
  const t = (section: any, key: string) => getTranslation(language as any, section, key);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [semester, setSemester] = useState<1 | 2>(2);

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'libraryBooks'), orderBy('createdAt', 'desc')));
        setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'libraryBooks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || b.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSemester = (b.semester || 2) === semester;
    return matchesSearch && matchesSemester;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">{t('libraryPage', 'title')}</h1>
          <p className="text-muted-foreground">{t('libraryPage', 'subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-muted p-1 rounded-lg flex gap-1 border border-border">
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${semester === 1 ? 'bg-background shadow-sm text-foreground cursor-default' : 'text-muted-foreground hover:text-foreground cursor-pointer'}`}
              onClick={() => setSemester(1)}
            >
              1-Semester
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${semester === 2 ? 'bg-background shadow-sm text-foreground cursor-default' : 'text-muted-foreground hover:text-foreground cursor-pointer'}`}
              onClick={() => setSemester(2)}
            >
              2-Semester
            </button>
          </div>
          <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-9 bg-card border-border focus-visible:ring-blue-500 text-foreground/90" 
                placeholder={t('common', 'search')} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-32 bg-card/40 backdrop-blur-sm rounded-3xl border border-border/50 shadow-md">
            <Book className="mx-auto h-24 w-24 text-muted-foreground/30 mb-6" />
            <h2 className="text-3xl font-bold text-foreground">{semester}-Semester Kutubxonasi xozircha bo'sh</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book, i) => (
            <Card key={book.id || i} className="bg-card border-border hover:border-primary/50 transition-all flex flex-col group overflow-hidden">
               <div className="h-48 bg-muted border-b border-border flex items-center justify-center relative overflow-hidden">
                  {book.coverImageUrl ? (
                      <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                      <Book className="w-12 h-12 text-slate-600 transition-transform duration-300 group-hover:scale-110" />
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white uppercase tracking-wider shadow-sm">
                      {book.language}
                  </div>
               </div>
               <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="text-xs font-semibold text-primary mb-2">{book.type}</div>
                  <h3 className="font-semibold text-foreground mb-1 leading-snug">{book.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{book.author}</p>
                  <div className="mt-auto pt-4 border-t border-border/50">
                     <a href={book.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost" }) + " w-full text-muted-foreground hover:text-primary-foreground hover:bg-muted h-9"}>
                       <Download className="w-4 h-4 mr-2" /> Download
                     </a>
                  </div>
               </CardContent>
            </Card>
          ))}
          {filteredBooks.length === 0 && (
             <div className="col-span-full text-center py-12 text-muted-foreground">
               Kitoblar topilmadi
             </div>
          )}
        </div>
      )}
    </div>
  );
}
