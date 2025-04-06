import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Copy, LogOut, Trash2, MessageCircle } from 'lucide-react';
import { db, auth } from '../firebaseConfig'; // Update path to match your project structure
import { collection, addDoc, getDoc, updateDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom'; // For navigation and getting route params

interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple-choice';
  choices?: string[];
}

function FormScreen() {
  const { formId: initialFormId } = useParams(); // Get formId from URL params
  const navigate = useNavigate();
  
  const [formId, setFormId] = useState<string | null>(initialFormId || null);
  const [title, setTitle] = useState('Untitled Form');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [choices, setChoices] = useState<string[]>(['']);
  const [formLink, setFormLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      if (initialFormId) {
        try {
          const docRef = doc(db, "users", user.uid, "forms", initialFormId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setTitle(data.title ?? "Untitled Form");
            setDescription(data.description ?? "");
            setQuestions(data.questions ?? []);
            setFormId(initialFormId);
          } else {
            console.warn("No such document found!");
            resetForm();
          }
        } catch (error) {
          console.error("Error loading form:", error);
          resetForm();
        }
      } else {
        try {
          const docRef = await addDoc(collection(db, "users", user.uid, "forms"), {
            title: "Untitled Form",
            description: "",
            questions: [],
            createdAt: new Date(),
          });
          setFormId(docRef.id);
          navigate(`/form/${docRef.id}`); // Update URL with new form ID
        } catch (error) {
          console.error("Error creating new form:", error);
        }
      }
    };

    // Function to reset form state
    const resetForm = () => {
      setFormId(null);
      setTitle("Untitled Form");
      setDescription("");
      setQuestions([]);
    };

    loadForm();
  }, [initialFormId, navigate]);

  // Auto-save function to update Firestore when data changes
  const saveForm = async (field: string, value: any) => {
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    if (!formId || !field) {
      console.error("Invalid formId or field");
      return;
    }

    const docRef = doc(db, "users", user.uid, "forms", formId);

    try {
      await updateDoc(docRef, {
        [field]: value,
        updatedAt: serverTimestamp(),
      });
      console.log(`Saved ${field}:`, value);
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
    }
  };

  const updateTitle = (text: string) => {
    setTitle(text);
    if (formId) {
      saveForm("title", text);
    }
  };

  const updateDescription = (text: string) => {
    setDescription(text);
    if (formId) {
      saveForm("description", text);
    }
  };

  const addTextQuestion = () => {
    if (!currentQuestion.trim()) return alert('Please enter a question');
    if (!formId) return;

    try {
      const newQuestion: Question = { 
        id: Math.random().toString(36).substr(2, 8), 
        text: currentQuestion, 
        type: 'text' 
      };
      const updatedQuestions = [...questions, newQuestion];
      setQuestions(updatedQuestions);
      saveForm("questions", updatedQuestions);
      setCurrentQuestion('');
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const addMultipleChoiceQuestion = () => {
    if (!currentQuestion.trim()) return alert('Please enter a question');
    if (choices.some(choice => !choice.trim())) return alert('Please fill in all choices');
    if (!formId) return;

    try {
      const newQuestion: Question = {
        id: Math.random().toString(36).substr(2, 8),
        text: currentQuestion,
        type: 'multiple-choice',
        choices: choices.filter(choice => choice.trim()),
      };
      const updatedQuestions = [...questions, newQuestion];
      setQuestions(updatedQuestions);
      saveForm("questions", updatedQuestions);
      setCurrentQuestion('');
      setChoices(['']);
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const addChoice = () => {
    if (choices.length >= 5) return alert('Maximum 5 choices allowed');
    setChoices([...choices, '']);
  };

  const updateChoice = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  const removeChoice = (index: number) => {
    if (choices.length > 1) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  };

  const removeQuestion = async (id: string) => {
    if (!formId) return;
    const updatedQuestions = questions.filter(q => q.id !== id);
    setQuestions(updatedQuestions);
    await saveForm("questions", updatedQuestions);
  };

  const generateLink = () => {
    const user = auth.currentUser;
    if (formId && user) {
      const baseUrl = "";
      const link = `${baseUrl}/${user.uid}/${formId}`;
      setFormLink(link);
      navigator.clipboard.writeText(link);
      alert("Form link copied to clipboard!");
    } else {
      alert("Error generating link. Please try again.");
    }
  };

  const navigateToResponses = () => {
    if (formId) {
      navigate(`/responses/${formId}`, {
        state: { formTitle: title }
      });
    } else {
      alert("Please save the form first before viewing responses.");
    }
  };

  const goBack = () => {
    navigate('/forms'); // Adjust path as needed for your application
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      navigate('/login'); // Redirect to login after sign out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={goBack} 
              className="hover:bg-gray-200 p-2 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Form Editor</h1>
          </div>
          <button 
            onClick={signOut}
            className="text-gray-700 hover:text-red-600 hover:bg-gray-200 p-2 rounded-full transition-colors"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <input
            className="w-full text-2xl font-bold mb-4 p-2 border-b border-gray-300 focus:outline-none focus:border-gray-500"
            value={title}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="Form Title"
          />
          
          <textarea
            value={description}
            onChange={(e) => updateDescription(e.target.value)}
            placeholder="Enter form description"
            className="w-full p-3 border border-gray-300 rounded mb-4 min-h-[100px] focus:outline-none focus:border-gray-500"
          />
          
          <div className="flex justify-center mb-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/en/e/eb/PSG_College_of_Technology_logo.png"
              alt="College Logo"
              className="h-24 object-contain"
            />
          </div>
        </div>

        {questions.map((q, index) => (
          <div key={q.id} className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-gray-800">Question {index + 1}</h3>
              <button
                onClick={() => removeQuestion(q.id)}
                className="text-red-500 hover:text-red-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <input
              type="text"
              value={q.text}
              onChange={(e) => {
                const updatedQuestions = questions.map(question => 
                  question.id === q.id ? { ...question, text: e.target.value } : question
                );
                setQuestions(updatedQuestions);
                if (formId) saveForm("questions", updatedQuestions);
              }}
              placeholder="Enter your question"
              className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:border-gray-500"
            />

            {q.type === 'multiple-choice' && (
              <>
                <p className="font-medium text-gray-700 mb-2">Choices:</p>
                {(q.choices || []).map((choice, idx) => (
                  <div key={`${q.id}-choice-${idx}`} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => {
                        const updatedQuestions = questions.map(question => {
                          if (question.id === q.id && question.choices) {
                            const newChoices = [...question.choices];
                            newChoices[idx] = e.target.value;
                            return { ...question, choices: newChoices };
                          }
                          return question;
                        });
                        setQuestions(updatedQuestions);
                        if (formId) saveForm("questions", updatedQuestions);
                      }}
                      placeholder={`Choice ${idx + 1}`}
                      className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                    <button
                      onClick={() => {
                        const updatedQuestions = questions.map(question => {
                          if (question.id === q.id && question.choices && question.choices.length > 1) {
                            return { 
                              ...question, 
                              choices: question.choices.filter((_, i) => i !== idx) 
                            };
                          }
                          return question;
                        });
                        setQuestions(updatedQuestions);
                        if (formId) saveForm("questions", updatedQuestions);
                      }}
                      className="text-red-500 hover:text-red-600 hover:bg-gray-100 p-2 rounded transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const updatedQuestions = questions.map(question => {
                      if (question.id === q.id) {
                        return { 
                          ...question, 
                          choices: [...(question.choices || []), ""] 
                        };
                      }
                      return question;
                    });
                    setQuestions(updatedQuestions);
                    if (formId) saveForm("questions", updatedQuestions);
                  }}
                  className="text-gray-600 hover:text-gray-800 flex items-center gap-1 p-2 hover:bg-gray-100 rounded transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Choice
                </button>
              </>
            )}
          </div>
        ))}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-medium text-gray-800 mb-4">Add New Question</h3>
          <input
            type="text"
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="Enter your question"
            className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:border-gray-500"
          />

          {currentQuestion && (
            <div className="space-y-2 mb-4">
              {choices.map((choice, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => updateChoice(index, e.target.value)}
                    placeholder={`Choice ${index + 1}`}
                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                  <button
                    onClick={() => removeChoice(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-gray-100 p-2 rounded transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={addChoice}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-1 p-2 hover:bg-gray-100 rounded transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> Add Choice
              </button>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={addTextQuestion}
              className="flex-1 p-3 rounded bg-gray-500 hover:bg-gray-600 transition-colors text-white"
            >
              Add Text Question
            </button>
            <button
              onClick={addMultipleChoiceQuestion}
              className="flex-1 p-3 rounded bg-gray-500 hover:bg-gray-600 transition-colors text-white"
            >
              Add Multiple Choice
            </button>
          </div>
        </div>

        {formLink && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <p className="text-sm break-all text-gray-700">
              <span className="font-medium">Share this link:</span> {formLink}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={generateLink}
            disabled={!formId || isGenerating}
            className={`flex-1 p-3 rounded flex items-center justify-center gap-2 ${
              !formId || isGenerating
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-gray-500 hover:bg-gray-600 transition-colors text-white'
            }`}
          >
            <Copy className="w-5 h-5" />
            {isGenerating ? 'Generating Link...' : 'Generate & Copy Link'}
          </button>
          
          <button
            onClick={navigateToResponses}
            disabled={!formId}
            className={`flex-1 p-3 rounded flex items-center justify-center gap-2 ${
              !formId
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-gray-500 hover:bg-gray-600 transition-colors text-white'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            View Responses
          </button>
        </div>
      </div>
    </div>
  );
}

export default FormScreen;