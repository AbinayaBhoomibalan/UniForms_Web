import React, { useEffect, useState } from 'react';
import { User, Trash2, LogOut, Plus } from 'lucide-react';
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

interface Form {
  id: string;
  title: string;
  description: string;
}

function FormList() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const formsRef = collection(db, 'users', user.uid, 'forms');
    const q = query(formsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedForms: Form[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || 'Untitled Form',
        description: doc.data().description || 'No description',
      }));
      setForms(fetchedForms);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'forms', id));
    } catch (error) {
      alert('Failed to delete form.');
      console.error('Delete error:', error);
    }
  };

  const handleAddForm = async () => {
    if (!newFormTitle.trim()) {
      alert('Please enter a form title');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'users', user!.uid, 'forms'), {
        title: newFormTitle,
        description: newFormDescription || 'No description',
        createdAt: serverTimestamp(),
        questions: [],
      });

      setNewFormTitle('');
      setNewFormDescription('');
      setShowNewForm(false);

      navigate(`/form/${docRef.id}`); // Navigate to the new form page
    } catch (error) {
      alert('Failed to create form.');
      console.error('Create error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Go back to login screen
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to log out.');
    }
  };

  const handleFormClick = (id: string) => {
    navigate(`/form/${id}`);
  };

  return (
    <div className="min-h-screen p-4 text-white bg-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">UniForms</h1>
        <div className="flex items-center gap-4">
          <span className="bg-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <span>1 device</span>
          </span>
          <User className="w-6 h-6" />
          <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-400 hover:bg-gray-800 p-2 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>
  
      <div className="space-y-4">
        {forms.map((form) => (
          <div
            key={form.id}
            onClick={() => handleFormClick(form.id)}
            className="bg-gray-800 p-4 rounded-lg flex justify-between items-start cursor-pointer hover:bg-gray-700 transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-medium">{form.title}</h3>
              <p className="text-gray-400 text-sm">{form.description}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(form.id);
              }}
              className="text-red-500 hover:text-red-400 p-2 hover:bg-gray-600 rounded-full transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
  
        {showNewForm ? (
          <div className="bg-gray-800 p-4 rounded-lg">
            <input
              type="text"
              value={newFormTitle}
              onChange={(e) => setNewFormTitle(e.target.value)}
              placeholder="Enter form title"
              className="w-full bg-gray-700 p-3 rounded text-white placeholder-gray-400 mb-3"
            />
            <textarea
              value={newFormDescription}
              onChange={(e) => setNewFormDescription(e.target.value)}
              placeholder="Enter form description (optional)"
              className="w-full bg-gray-700 p-3 rounded text-white placeholder-gray-400 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddForm}
                className="flex-1 p-2 rounded bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                Create Form
              </button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setNewFormTitle('');
                  setNewFormDescription('');
                }}
                className="flex-1 p-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewForm(true)}
            className="w-full p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Form
          </button>
        )}
      </div>
    </div>
  );
}  

export default FormList;
