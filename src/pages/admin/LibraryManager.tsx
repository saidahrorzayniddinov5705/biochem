import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, serverTimestamp, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { OperationType, handleFirestoreError } from '../../lib/firestore-errors';
import { Button, buttonVariants } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Book, Download, Upload, Edit } from 'lucide-react';

export default function LibraryManager() {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    type: 'PDF Book',
    language: 'uz',
    semester: 2
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'libraryBooks'), orderBy('createdAt', 'desc')));
      setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'libraryBooks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEditDialog = (book: any) => {
    setFormData({
      title: book.title || '',
      author: book.author || '',
      type: book.type || 'PDF Book',
      language: book.language || 'uz',
      semester: book.semester || 2
    });
    setEditingId(book.id);
    setSelectedFile(null);
    setSelectedCoverImage(null);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setFormData({ title: '', author: '', type: 'PDF Book', language: 'uz', semester: 2 });
    setEditingId(null);
    setSelectedFile(null);
    setSelectedCoverImage(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && !selectedFile) {
      toast.error('Iltimos, fayl yuklang.');
      return;
    }
    
    setUploading(true);
    try {
      let url = undefined;
      // Upload Document File if newly selected
      if (selectedFile) {
        const fileRef = ref(storage, `content/library/${Date.now()}_${selectedFile.name}`);
        const snapshot = await uploadBytes(fileRef, selectedFile);
        url = await getDownloadURL(snapshot.ref);
      }

      // Upload Cover Image if newly selected
      let coverImageUrl = undefined;
      if (selectedCoverImage) {
          const coverRef = ref(storage, `content/library/covers/${Date.now()}_${selectedCoverImage.name}`);
          const coverSnapshot = await uploadBytes(coverRef, selectedCoverImage);
          coverImageUrl = await getDownloadURL(coverSnapshot.ref);
      }

      if (editingId) {
        const updates: any = { ...formData, semester: Number(formData.semester) };
        if (url) updates.url = url;
        if (coverImageUrl) updates.coverImageUrl = coverImageUrl;
        
        await updateDoc(doc(db, 'libraryBooks', editingId), updates);
        toast.success('Kitob muvaffaqiyatli yangilandi.');
      } else {
        await addDoc(collection(db, 'libraryBooks'), {
          ...formData,
          semester: Number(formData.semester),
          url,
          coverImageUrl: coverImageUrl || null,
          createdAt: serverTimestamp(),
        });
        toast.success('Kitob muvaffaqiyatli saqlandi.');
      }

      setIsDialogOpen(false);
      setFormData({ title: '', author: '', type: 'PDF Book', language: 'uz', semester: 2 });
      setSelectedFile(null);
      setSelectedCoverImage(null);
      setEditingId(null);
      fetchData();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'libraryBooks');
      toast.error('Xatolik yuz berdi.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (deletingId !== id) {
        setDeletingId(id);
        toast('Tasdiqlash uchun yana bir marta bosing', { duration: 3000 });
        return;
      }
      await deleteDoc(doc(db, 'libraryBooks', id));
      toast.success("O'chirildi");
      fetchData();
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, 'libraryBooks');
      toast.error('O\'chirishda xatolik');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Kutubxona boshqaruvi</h1>
          <p className="text-muted-foreground">Kutubxona uchun kitoblar va materiallar yuklash</p>
        </div>
        <Button onClick={openAddDialog}><Plus className="w-4 h-4 mr-2" /> Yangi kitob</Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Ma'lumotlarni yangilash" : "Yangi material qo'shish"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nomi</Label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <Label>Muallif</Label>
                <Input required value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <Label>Turi (masalan: PDF Book, Course Notes)</Label>
                <Input required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <Label>Tili (uz, en, ru)</Label>
                <Input required value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <Label>Semester</Label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="semester" 
                      value="1" 
                      checked={formData.semester === 1}
                      onChange={() => setFormData({...formData, semester: 1})}
                      className="accent-primary"
                    />
                    1-Semester
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="semester" 
                      value="2" 
                      checked={formData.semester === 2}
                      onChange={() => setFormData({...formData, semester: 2})}
                      className="accent-primary"
                    />
                    2-Semester
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Muqova rasmi (Ixtiyoriy{editingId ? ', yangilash uchun yuklang' : ''})</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setSelectedCoverImage(e.target.files?.[0] || null)} 
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Fayl (PDF{editingId ? ', ixtiyoriy yangilash' : ''})</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)} 
                    className="flex-1"
                    required={!editingId}
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Bekor qilish</Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Yuklanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {books.map(book => (
          <Card key={book.id} className="bg-card flex flex-col group overflow-hidden">
             <div className="h-48 bg-muted flex flex-col items-center justify-center relative overflow-hidden">
               {book.coverImageUrl ? (
                   <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
               ) : (
                   <Book className="w-12 h-12 text-slate-400 group-hover:scale-110 transition-transform duration-300" />
               )}
               <div className="absolute top-2 right-2 flex gap-1 z-10">
                 <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                    {book.language}
                 </div>
               </div>
             </div>
             <CardContent className="p-4 flex flex-col flex-1">
               <div className="text-xs font-semibold text-primary mb-1">{book.type}</div>
               <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{book.title}</h3>
               <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
               
               <div className="mt-auto pt-4 flex items-center justify-between gap-1">
                 <a href={book.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" }) + " flex-1"}>
                   Ko'rish
                 </a>
                 <Button 
                   variant="ghost"
                   size="sm"
                   onClick={() => openEditDialog(book)}
                   className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 px-2"
                 >
                   <Edit className="w-4 h-4" />
                 </Button>
                 <Button 
                   variant={deletingId === book.id ? "destructive" : "ghost"} 
                   size="sm" 
                   onClick={() => handleDelete(book.id)}
                   className={deletingId === book.id ? "px-2" : "text-red-500 hover:text-red-600 hover:bg-red-50 px-2"}
                 >
                   <Trash2 className="w-4 h-4" />
                 </Button>
               </div>
             </CardContent>
          </Card>
        ))}
      </div>
      
      {!isLoading && books.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
           Hali kitoblar yuklanmagan.
        </div>
      )}
    </div>
  );
}
