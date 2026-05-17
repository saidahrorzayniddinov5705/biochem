import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { OperationType, handleFirestoreError } from '../../lib/firestore-errors';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { BookOpen, Plus, Trash2, Edit2, Code } from 'lucide-react';

export default function WorksheetsManager() {
  const [worksheets, setWorksheets] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    topicId: '', 
    title: '', 
    description: '',
    duration: 0,
    semester: 2,
    questions: [] as any[],
    isCustomHtml: false,
    customHtml: ''
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const topicSnap = await getDocs(query(collection(db, 'topics'), orderBy('order')));
      setTopics(topicSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const wsSnap = await getDocs(collection(db, 'worksheets'));
      // Sort by createdAt client-side if missing index
      const wsDocs = wsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      wsDocs.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      setWorksheets(wsDocs);
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'worksheets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topicId) {
      toast.error('Please select a topic.');
      return;
    }
    
    try {
      const dataToSave = {
        topicId: formData.topicId,
        title: formData.title,
        description: formData.description,
        duration: Number(formData.duration) || 0,
        semester: Number(formData.semester) || 2,
        isCustomHtml: formData.isCustomHtml,
        updatedAt: serverTimestamp()
      } as any;

      if (formData.isCustomHtml) {
        dataToSave.customHtml = formData.customHtml;
      } else {
        dataToSave.questions = formData.questions;
      }

      if (editingId) {
        await updateDoc(doc(db, 'worksheets', editingId), dataToSave);
        toast.success('Worksheet updated successfully.');
      } else {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, 'worksheets'), dataToSave);
        toast.success('Worksheet added successfully.');
      }

      setIsDialogOpen(false);
      setEditingId(null);
      setFormData({ topicId: '', title: '', description: '', duration: 0, semester: 2, questions: [], isCustomHtml: false, customHtml: '' });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'worksheets');
      toast.error(editingId ? 'Failed to update worksheet' : 'Failed to create worksheet');
    }
  };

  const openAddDialog = () => {
    setFormData({ topicId: '', title: '', description: '', duration: 0, semester: 2, questions: [], isCustomHtml: false, customHtml: '' });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (ws: any) => {
    setFormData({
      topicId: ws.topicId || '',
      title: ws.title || '',
      description: ws.description || '',
      duration: ws.duration || 0,
      semester: ws.semester || 2,
      questions: ws.questions || [],
      isCustomHtml: ws.isCustomHtml || false,
      customHtml: ws.customHtml || '',
    });
    setEditingId(ws.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      if (deletingId !== id) {
        setDeletingId(id);
        toast('Confirm deletion by clicking again', { duration: 3000 });
        return;
      }
      await deleteDoc(doc(db, 'worksheets', id));
      toast.success('Worksheet deleted securely.');
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `worksheets/${id}`);
      toast.error('Failed to delete worksheet.');
    }
  };

  const getTopicTitle = (topicId: string) => {
    return topics.find(t => t.id === topicId)?.title || 'Unknown Topic';
  };

  const addQuestion = (type: string) => {
    const newQuestion: any = { id: Date.now().toString(), type, questionText: '' };
    if (type === 'mcq') {
      newQuestion.options = ['', '', '', ''];
      newQuestion.correctAnswer = '';
    } else if (type === 'true_false') {
      newQuestion.correctAnswer = 'True';
    } else if (type === 'matching') {
      newQuestion.pairs = [{ left: '', right: '' }];
    } else {
      newQuestion.correctAnswer = ''; // for fill_in_blanks, short_answer
    }
    setFormData({ ...formData, questions: [...formData.questions, newQuestion] });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQs = [...formData.questions];
    newQs[index][field] = value;
    setFormData({ ...formData, questions: newQs });
  };

  const removeQuestion = (index: number) => {
    const newQs = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQs });
  };

  const renderQuestionBuilder = (q: any, i: number) => {
    return (
      <Card key={q.id || i} className="bg-muted/50 p-4 mb-4 border border-border">
        <div className="flex justify-between items-start mb-2">
          <span className="font-semibold text-sm uppercase text-primary">{q.type.replace('_', ' ')} Question</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-500/20" type="button" onClick={() => removeQuestion(i)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <Label className="mt-2">Question Text</Label>
        <Textarea 
          value={q.questionText} 
          onChange={(e) => updateQuestion(i, 'questionText', e.target.value)} 
          placeholder={q.type === 'fill_in_blanks' ? "E.g. The powerhouse of the cell is the ___." : "Enter question text"}
          className="mb-3 bg-background"
          required
        />

        {q.type === 'mcq' && (
          <div className="space-y-2">
            <Label>Options</Label>
            {q.options.map((opt: string, optIdx: number) => (
              <Input 
                key={optIdx} 
                value={opt} 
                onChange={(e) => {
                  const newOpts = [...q.options];
                  newOpts[optIdx] = e.target.value;
                  updateQuestion(i, 'options', newOpts);
                }} 
                placeholder={`Option ${optIdx + 1}`} 
                className="bg-background"
                required
              />
            ))}
            <Label className="mt-2 block">Correct Answer (Must exactly match one option)</Label>
            <Input 
              value={q.correctAnswer} 
              onChange={(e) => updateQuestion(i, 'correctAnswer', e.target.value)} 
              placeholder="E.g. Option text"
              className="bg-background"
              required
            />
          </div>
        )}

        {q.type === 'true_false' && (
          <div className="space-y-2">
             <Label>Correct Answer</Label>
             <select 
               className="w-full flex h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
               value={q.correctAnswer}
               onChange={(e) => updateQuestion(i, 'correctAnswer', e.target.value)}
             >
               <option value="True">True</option>
               <option value="False">False</option>
             </select>
          </div>
        )}

        {(q.type === 'short_answer' || q.type === 'fill_in_blanks') && (
          <div className="space-y-2">
            <Label>Correct Answer(s) (Use commas for multiple valid answers)</Label>
            <Input 
              value={q.correctAnswer} 
              onChange={(e) => updateQuestion(i, 'correctAnswer', e.target.value)} 
              placeholder="Answer..."
              className="bg-background"
              required
            />
          </div>
        )}

        {q.type === 'matching' && (
          <div className="space-y-2">
            <Label>Pairs</Label>
            {q.pairs.map((pair: any, pairIdx: number) => (
              <div key={pairIdx} className="flex gap-2">
                <Input value={pair.left} onChange={(e) => {
                    const newPairs = [...q.pairs];
                    newPairs[pairIdx].left = e.target.value;
                    updateQuestion(i, 'pairs', newPairs);
                }} placeholder="Option" className="bg-background" required />
                <Input value={pair.right} onChange={(e) => {
                    const newPairs = [...q.pairs];
                    newPairs[pairIdx].right = e.target.value;
                    updateQuestion(i, 'pairs', newPairs);
                }} placeholder="Match" className="bg-background" required />
                <Button variant="ghost" type="button" onClick={() => {
                     const newPairs = q.pairs.filter((_: any, idx: number) => idx !== pairIdx);
                     updateQuestion(i, 'pairs', newPairs);
                }}>X</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => {
                const newPairs = [...q.pairs, { left: '', right: '' }];
                updateQuestion(i, 'pairs', newPairs);
            }}>+ Add Pair</Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mb-1">Worksheets Manager</h1>
          <p className="text-muted-foreground text-sm">Create quizzes, worksheets, and interactive exercises.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={async () => {
            try {
              const res1 = await fetch('/1-mavzu-worksheet.html');
              const html1 = await res1.text();
              
              const res2 = await fetch('/2-mavzu-worksheet.html');
              const html2 = await res2.text();

              const res3 = await fetch('/3-mavzu-worksheet.html');
              const html3 = await res3.text();

              // Check if they already exist
              const wsSnap = await getDocs(collection(db, 'worksheets'));
              let found1 = false;
              let found2 = false;
              let found3 = false;
              
              for (const d of wsSnap.docs) {
                 const data = d.data();
                 if (data.title.includes('1-mavzu')) {
                    await updateDoc(d.ref, { customHtml: html1 });
                    found1 = true;
                 }
                 if (data.title.includes('2-mavzu')) {
                    await updateDoc(d.ref, { customHtml: html2 });
                    found2 = true;
                 }
                 if (data.title.includes('3-mavzu')) {
                    await updateDoc(d.ref, { customHtml: html3 });
                    found3 = true;
                 }
              }
              
              if (!found1) {
                await addDoc(collection(db, 'worksheets'), {
                  topicId: topics[0]?.id || '',
                  title: '1-mavzu: DNK tuzilishi. Replikatsiya.',
                  description: '1-mavzu worksheet by HTML',
                  isCustomHtml: true,
                  customHtml: html1,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              }

              if (!found2) {
                await addDoc(collection(db, 'worksheets'), {
                  topicId: topics[1]?.id || '',
                  title: '2-mavzu: Gen Ekspressiyasi. Translatsiya.',
                  description: '2-mavzu worksheet by HTML',
                  isCustomHtml: true,
                  customHtml: html2,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              }

              if (!found3) {
                await addDoc(collection(db, 'worksheets'), {
                  topicId: topics[2]?.id || '',
                  title: '3-mavzu: Hujayra Biologiyasi. Gen Terapiyasi.',
                  description: '3-mavzu worksheet by HTML',
                  isCustomHtml: true,
                  customHtml: html3,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              }
              
              toast.success('Successfully synced existing worksheets!');
              fetchData();
            } catch (e) {
              console.error(e);
              toast.error('Failed to sync worksheets');
            }
          }}>
            Sync Local HTML Worksheets
          </Button>

          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Create Worksheet
          </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-w-[95vw] bg-card border-border text-foreground max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>{editingId ? "Edit Worksheet" : "Add New Worksheet"}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto px-6 flex-1">
              <form id="worksheet-form" onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      value={formData.title} 
                      onChange={(e) => setFormData({...formData, title: e.target.value})} 
                      placeholder="e.g. Chapter 1 Quiz" 
                      className="bg-background border-border"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    placeholder="Brief instructions..." 
                    className="bg-background border-border"
                  />
                </div>
                
                <div className="space-y-2 mt-2">
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

                {!formData.isCustomHtml && (
                <div className="space-y-2">
                  <Label>Timer (minutes)</Label>
                  <Input 
                    type="number"
                    min="0"
                    value={formData.duration || ''} 
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})} 
                    placeholder="0 for no timer" 
                    className="bg-background border-border w-1/3"
                  />
                </div>
                )}

                <div className="mt-4 flex items-center justify-between bg-muted/50 p-4 rounded-xl border border-border">
                  <div>
                    <h4 className="font-semibold text-sm">Worksheet Content Type</h4>
                    <p className="text-xs text-muted-foreground mt-1">Choose how you want to build this worksheet.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant={!formData.isCustomHtml ? "default" : "outline"}
                      onClick={() => setFormData({...formData, isCustomHtml: false})}
                      className={!formData.isCustomHtml ? "bg-primary text-primary-foreground" : ""}
                    >
                       Native Builder
                    </Button>
                    <Button 
                      type="button" 
                      variant={formData.isCustomHtml ? "default" : "outline"}
                      onClick={() => setFormData({...formData, isCustomHtml: true})}
                      className={formData.isCustomHtml ? "bg-primary text-primary-foreground" : ""}
                    >
                       Custom HTML File
                    </Button>
                  </div>
                </div>

                {formData.isCustomHtml ? (
                  <div className="mt-6 border-t border-border pt-4">
                     <div className="space-y-2">
                      <Label>Raw HTML Content</Label>
                      <Textarea 
                        value={formData.customHtml} 
                        onChange={(e) => setFormData({...formData, customHtml: e.target.value})} 
                        placeholder="Paste your full HTML code here..." 
                        className="bg-background border-border min-h-[300px] font-mono text-xs"
                      />
                     </div>
                  </div>
                ) : (
                  <div className="mt-6 border-t border-border pt-4">
                    <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                       Questions ({formData.questions.length})
                       <div className="flex flex-wrap gap-2 justify-end">
                         <Button type="button" variant="secondary" size="sm" onClick={() => addQuestion('mcq')}>+ MCQ</Button>
                         <Button type="button" variant="secondary" size="sm" onClick={() => addQuestion('fill_in_blanks')}>+ Fill Gaps</Button>
                         <Button type="button" variant="secondary" size="sm" onClick={() => addQuestion('true_false')}>+ True/False</Button>
                         <Button type="button" variant="secondary" size="sm" onClick={() => addQuestion('short_answer')}>+ Short Answ.</Button>
                         <Button type="button" variant="secondary" size="sm" onClick={() => addQuestion('matching')}>+ Matching</Button>
                       </div>
                    </h3>
                    
                    {formData.questions.map((q, i) => renderQuestionBuilder(q, i))}
                    
                    {formData.questions.length === 0 && (
                       <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                         No questions added yet. Choose a type above to start.
                       </div>
                    )}
                  </div>
                )}
              </form>
            </div>
            <div className="p-4 border-t border-border bg-card flex justify-end gap-3 shrink-0">
               <Button type="button" variant="outline" className="border-border hover:bg-muted" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
               <Button type="submit" form="worksheet-form" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Worksheet</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {worksheets.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border rounded-xl bg-card">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">No worksheets found</h3>
              <p className="text-sm text-muted-foreground mt-1">Create quizzes and exercises for your students.</p>
            </div>
          ) : (
            worksheets.map((ws) => (
              <Card key={ws.id} className="bg-card border-border shadow-sm">
                <CardContent className="p-6 flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <div className="p-3 rounded-xl flex items-center justify-center text-primary-foreground bg-primary/20 text-primary">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">{ws.title}</h3>
                        <p className="text-sm font-medium text-muted-foreground mt-1">{getTopicTitle(ws.topicId)} • {ws.questions?.length || 0} questions</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-lg truncate">{ws.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                      {ws.isCustomHtml && (
                         <div className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded mr-2 uppercase tracking-wide">
                            Custom HTML
                         </div>
                      )}
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-muted" onClick={() => openEditDialog(ws)}>
                          <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600 hover:bg-red-100" onClick={() => handleDelete(ws.id)}>
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
