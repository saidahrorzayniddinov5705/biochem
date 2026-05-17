import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { OperationType, handleFirestoreError } from '../../lib/firestore-errors';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Library, Plus, Trash2, Youtube, Book, FileText, Search } from 'lucide-react';

export default function ContentManager() {
  const [items, setItems] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ 
    topicId: '', 
    type: 'video', 
    title: '', 
    description: '', 
    url: '', 
    language: 'uz' 
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const topicSnap = await getDocs(query(collection(db, 'topics'), orderBy('order')));
      setTopics(topicSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const itemsSnap = await getDocs(query(collection(db, 'contentItems')));
      setItems(itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'contentItems');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topicId) {
      toast.error('Please select a topic.');
      return;
    }

    if (formData.type !== 'video' && !formData.url && !selectedFile) {
      toast.error('Please provide a URL or upload a file.');
      return;
    }
    
    setUploading(true);
    let downloadUrl = formData.url;

    try {
      if (selectedFile) {
        const fileRef = ref(storage, `content/${Date.now()}_${selectedFile.name}`);
        const snapshot = await uploadBytes(fileRef, selectedFile);
        downloadUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'contentItems'), {
        ...formData,
        url: downloadUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Content item added successfully.');
      setIsDialogOpen(false);
      setFormData({ topicId: '', type: 'video', title: '', description: '', url: '', language: 'uz' });
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'contentItems');
      toast.error('Failed to create content item');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (deletingId !== id) {
        setDeletingId(id);
        toast('Confirm deletion by clicking again', { duration: 3000 });
        return;
      }
      await deleteDoc(doc(db, 'contentItems', id));
      toast.success('Item deleted securely.');
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `contentItems/${id}`);
      toast.error('Failed to delete item.');
    }
  };

  const getTopicTitle = (topicId: string) => {
    return topics.find(t => t.id === topicId)?.title || 'Unknown Topic';
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mb-1">Content Manager</h1>
          <p className="text-muted-foreground text-sm">Upload YouTube videos, books, and study notes.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>Add New Content</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <select 
                  className="w-full flex h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.topicId}
                  onChange={(e) => setFormData({...formData, topicId: e.target.value})}
                  required
                >
                  <option value="" disabled>Select a topic</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label>Type</Label>
                    <select 
                      className="w-full h-10 rounded-md border border-border bg-background px-3"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="video">Video (YouTube)</option>
                      <option value="book">Book / PDF Link</option>
                      <option value="note">Study Note</option>
                    </select>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>Language</Label>
                    <select 
                      className="w-full h-10 rounded-md border border-border bg-background px-3"
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                    >
                      <option value="uz">O'zbek</option>
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. DNA Replication Crash Course" 
                  className="bg-background border-border"
                  required
                />
              </div>
              {formData.type !== 'video' && (
                <div className="space-y-2 border border-dashed border-border rounded-lg p-4 bg-muted/20">
                  <Label>Upload PDF/File</Label>
                  <Input 
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="bg-background border-border text-xs"
                  />
                  <p className="text-xs text-muted-foreground pt-1">Provides direct download link.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>{formData.type === 'video' ? 'YouTube URL' : 'External URL (Optional)'}</Label>
                <Input 
                  value={formData.url} 
                  onChange={(e) => setFormData({...formData, url: e.target.value})} 
                  placeholder={formData.type === 'video' ? "https://youtube.com/..." : "https://drive..." }
                  className="bg-background border-border"
                  type="url"
                  required={formData.type === 'video' || (!selectedFile && formData.type !== 'note')}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Brief summary..." 
                  className="bg-background border-border"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" className="border-border hover:bg-muted" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={uploading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {uploading ? 'Uploading...' : 'Add to Library'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border rounded-xl bg-card">
              <Library className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">Library is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">Upload books and video lectures for your students.</p>
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="bg-card border-border shadow-sm">
                <CardContent className="p-6 flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <div className={`p-3 rounded-xl flex items-center justify-center text-primary-foreground ${
                        item.type === 'video' ? 'bg-red-500' : item.type === 'book' ? 'bg-primary' : 'bg-primary'
                    }`}>
                        {item.type === 'video' ? <Youtube className="w-6 h-6" /> : item.type === 'book' ? <Book className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                        <p className="text-sm font-medium text-primary mt-1">{getTopicTitle(item.topicId)} • <span className="uppercase">{item.language}</span></p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-lg truncate">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <Button variant="outline" className="text-foreground hover:bg-muted" onClick={() => window.open(item.url, '_blank')}>
                          View Link
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600 hover:bg-red-100" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                      </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
