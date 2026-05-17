import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy, writeBatch, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { OperationType, handleFirestoreError } from '../../lib/firestore-errors';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, BookOpen, Trash2, Edit2, Download } from 'lucide-react';

const SYLLABUS_TOPICS = [
  { title: "Molekular biologiya. Genlar ekspressiyasi", description: "DNK strukturasi, replikatsiya, transkripsiya, oqsil sintezi komponentlari." },
  { title: "Translyatsiya. Genlar almashinuvini boshqarilishi", description: "Genetik kod, oqsil biosintezi ingibitorlari, hujayra differensirovkasi." },
  { title: "Hujayra biologiyasi, gen terapiyasi asoslari", description: "Apoptoz, nekroz, DNK shikastlanishi, mutasiyalar va reparasiya." },
  { title: "Onkogenez", description: "Kimyoviy kanserogenez, onkogenlar, neoplastik transformatsiya, metastaz." },
  { title: "Qon tarkibi, plazma oqsillari", description: "Qon funksiyalari, gemoglobin, bufer tizimi, kislorod tashilishi." },
  { title: "Temir almashinuvi, gemostaz", description: "Qon ivishi, fibrinoliz, gem biosintezi, trombositar gemostaz." },
  { title: "Biriktiruvchi to'qima biokimyosi", description: "Hujayralararo matriks, kollagen sintezi, elastin, glikozaminoglikanlar." },
  { title: "Yurak va mushak biokimyosi", description: "Miofibrillyar oqsillar, energiya almashinuvi, kardiomiositlar." },
  { title: "Oshqozon-ichak tizimi biokimyosi", description: "Ovqat hazm qilish shirasi, organik moddalar parchalanishi, so'rilish." },
  { title: "Jigar biokimyosi", description: "Uglevodlar, yog'lar, oqsillar almashinuvi, sariqlik va jigar sindromlari." },
  { title: "Toksik moddalarni jigarda zararsizlantirilishi", description: "Mikrosomal oksidlanish, konyugasiya reaksiyalari, dori biotransformasiyasi." },
  { title: "Fiziologik faol moddalar va endokrin tizimi", description: "Gormonlar ierarxiyasi, peptid va steroid gormonlar, ontogenezda." },
  { title: "Moddalar almashinuvini boshqarilishi", description: "Periferik bezlar funksiyalari va ularni buzilishlari, kalsiy-fosfat." },
  { title: "Buyrak biokimyosi", description: "Siydik hosil bo'lishi, kislota-asos muvozanati, normal va patologik holatlar." },
  { title: "Markaziy va periferik asab tizimi biokimyosi", description: "Nerv hujayralari metabolizmi, oqsil va lipid tarkibi, neyromediatorlar." }
];

export default function TopicsManager() {
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', subtopicsList: '', order: 0, semester: 2 });
  const [isSeeding, setIsSeeding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTopics = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'topics'), orderBy('order'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopics(data);
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'topics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subtopics = formData.subtopicsList.split('\n').map(s => s.trim()).filter(s => s !== '');
      if (editingId) {
        await updateDoc(doc(db, 'topics', editingId), {
          title: formData.title,
          subtopics,
          subtopicsCount: subtopics.length,
          order: Number(formData.order),
          semester: Number(formData.semester) || 2,
          updatedAt: serverTimestamp()
        });
        toast.success('Topic updated securely.');
      } else {
        await addDoc(collection(db, 'topics'), {
          title: formData.title,
          subtopics,
          subtopicsCount: subtopics.length,
          order: Number(formData.order),
          semester: Number(formData.semester) || 2,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Topic created securely.');
      }
      setFormData({ title: '', subtopicsList: '', order: topics.length + (editingId ? 0 : 1), semester: 2 });
      setIsDialogOpen(false);
      setEditingId(null);
      fetchTopics();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'topics');
      toast.error(editingId ? 'Failed to update topic' : 'Failed to create topic');
    }
  };

  const openEditDialog = (topic: any) => {
    setFormData({ title: topic.title, subtopicsList: (topic.subtopics || []).join('\n'), order: topic.order, semester: topic.semester || 2 });
    setEditingId(topic.id);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setFormData({ title: '', subtopicsList: '', order: topics.length + 1, semester: 2 });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleDeleteTopic = async (id: string) => {
    try {
      if (deletingId !== id) {
        setDeletingId(id);
        toast('Confirm deletion by clicking again', { duration: 3000 });
        return;
      }
      await deleteDoc(doc(db, 'topics', id));
      toast.success('Topic deleted successfully.');
      fetchTopics();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `topics/${id}`);
      toast.error('Failed to delete topic');
    }
  };

  const [seedConfirm, setSeedConfirm] = useState(false);

  const seedSyllabus = async () => {
    if (!seedConfirm) {
      setSeedConfirm(true);
      toast('Click again to import the full syllabus', { duration: 3000 });
      return;
    }

    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      let currentOrder = topics.length > 0 ? Math.max(...topics.map(t => t.order)) + 1 : 1;

      SYLLABUS_TOPICS.forEach((topic) => {
        const docRef = doc(collection(db, 'topics'));
        const subtopics = topic.description.split(',').map(s => s.trim()).filter(s => s !== '');
        batch.set(docRef, {
          title: topic.title,
          subtopics,
          subtopicsCount: subtopics.length,
          order: currentOrder++,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      toast.success('TSMA Syllabus imported successfully!');
      fetchTopics();
      setSeedConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'topics');
      toast.error('Failed to import syllabus.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Topics & Modules</h1>
          <p className="text-muted-foreground text-sm">Manage the primary clinical curriculum modules.</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
             variant="outline" 
             className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary/80"
             onClick={seedSyllabus}
             disabled={isSeeding}
          >
            <Download className="w-4 h-4 mr-2" />
            {isSeeding ? 'Importing...' : 'Import TSMA Syllabus'}
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            New Topic
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Topic" : "Create New Topic"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g. Molecular Biology" 
                    className="bg-background border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtopicsList">Subtopics (one per line)</Label>
                  <Textarea 
                    id="subtopicsList" 
                    value={formData.subtopicsList} 
                    onChange={(e) => setFormData({...formData, subtopicsList: e.target.value})} 
                    placeholder="Enter each subtopic on a new line" 
                    className="bg-background border-border min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input 
                    id="order" 
                    type="number"
                    value={formData.order === 0 ? '' : formData.order} 
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})} 
                    className="bg-background border-border"
                    required
                  />
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
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" className="border-border hover:bg-muted hover:text-primary-foreground" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Topic</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {topics.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border rounded-xl bg-card/50">
              <BookOpen className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No topics found</h3>
              <p className="text-sm text-muted-foreground mt-1">Get started by importing the syllabus or creating a manual topic.</p>
            </div>
          ) : (
            topics.map((topic, i) => (
              <Card key={topic.id} className="bg-card border-border shadow-none">
                <CardContent className="p-6 flex justify-between items-center">
                  <div className="flex gap-6 items-center">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-secondary/50 border border-secondary/50/50 flex justify-center items-center font-mono text-primary font-bold">
                        {topic.order}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">{topic.title}</h3>
                        <div className="mt-2 space-y-1">
                          {topic.subtopics?.map((subtopic: string, idx: number) => (
                            <p key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="font-medium text-foreground/70 min-w-[1.25rem]">{idx + 1}.</span> 
                              <span>{subtopic}</span>
                            </p>
                          ))}
                        </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary-foreground hover:bg-muted" onClick={() => openEditDialog(topic)}>
                          <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10" onClick={() => handleDeleteTopic(topic.id)}>
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
