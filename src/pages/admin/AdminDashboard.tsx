import { Routes, Route } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import TopicsManager from './TopicsManager';
import WorksheetsManager from './WorksheetsManager';
import ContentManager from './ContentManager';
import LibraryManager from './LibraryManager';

export default function AdminDashboard() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<TopicsManager />} />
        <Route path="topics" element={<TopicsManager />} />
        <Route path="worksheets" element={<WorksheetsManager />} />
        <Route path="content" element={<ContentManager />} />
        <Route path="library" element={<LibraryManager />} />
      </Route>
    </Routes>
  );
}
