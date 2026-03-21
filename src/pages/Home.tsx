import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Search, List, Calendar as CalendarIcon } from 'lucide-react';
import WeeklyCalendar from '../components/WeeklyCalendar';

export default function Home() {
  const navigate = useNavigate();
  const { students } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Active' | 'Inactive'>('Active');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <div className="flex gap-2">
            <button 
              className={`btn-ghost ${filterStatus === 'Active' ? 'text-main' : 'text-muted'}`}
              style={{ fontWeight: filterStatus === 'Active' ? 600 : 400 }}
              onClick={() => setFilterStatus('Active')}
            >
              Active
            </button>
            <button 
              className={`btn-ghost ${filterStatus === 'Inactive' ? 'text-main' : 'text-muted'}`}
              style={{ fontWeight: filterStatus === 'Inactive' ? 600 : 400 }}
              onClick={() => setFilterStatus('Inactive')}
            >
              Inactive
            </button>
          </div>

          <div className="flex bg-card p-1 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <button 
              className="btn-icon" 
              style={{ backgroundColor: viewMode === 'list' ? 'var(--bg-color)' : 'transparent', borderRadius: '6px' }}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
            <button 
              className="btn-icon" 
              style={{ backgroundColor: viewMode === 'calendar' ? 'var(--bg-color)' : 'transparent', borderRadius: '6px' }}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              <CalendarIcon size={18} />
            </button>
          </div>
        </div>

        {viewMode === 'list' && (
          <div className="flex items-center" style={{ position: 'relative' }}>
            <Search size={18} className="text-muted" style={{ position: 'absolute', left: '12px' }} />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="input-field" 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {viewMode === 'calendar' ? (
        <WeeklyCalendar />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredStudents.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>
              No {filterStatus.toLowerCase()} students found.
            </p>
          ) : (
            filteredStudents.map(student => (
              <div 
                key={student.id}
                className="card card-hoverable flex justify-between items-center"
                style={{ cursor: 'pointer', padding: '1rem 1.25rem' }}
                onClick={() => navigate(`/student/${student.id}`)}
              >
                <span style={{ fontWeight: 500, fontSize: '1.1rem' }}>{student.name}</span>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>{student.language}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
