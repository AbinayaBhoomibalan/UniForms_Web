import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // No need for auth import since it's public
import { ArrowLeft } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple-choice';
  required: boolean;
  choices?: string[];
}

interface FormData {
  title: string;
  description: string;
  questions: Question[];
}

interface ResponseData {
  [questionId: string]: string;
}

const FillFormScreen: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<ResponseData>({});
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        if (!formId) {
          setError('Form ID is missing');
          setLoading(false);
          return;
        }
    
        // Step 1: Lookup userId from formDirectory
        const directoryRef = doc(db, 'formDirectory', formId);
        const directorySnap = await getDoc(directoryRef);
    
        if (!directorySnap.exists()) {
          setError('Form not found in directory');
          setLoading(false);
          return;
        }
    
        const userId = directorySnap.data().userId;
    
        // Step 2: Get form from the correct user path
        const formRef = doc(db, 'users', userId, 'forms', formId);
        const formSnap = await getDoc(formRef);
    
        if (!formSnap.exists()) {
          setError('Form not found for user');
          setLoading(false);
          return;
        }
    
        const formData = formSnap.data() as FormData;
        setForm(formData);
    
        const initialResponses: ResponseData = {};
        formData.questions.forEach((question: Question) => {
          initialResponses[question.id] = '';
        });
        setResponses(initialResponses);
    
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError('Error fetching form: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const handleInputChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    try {
      if (!formId) {
        setError('Form ID is missing');
        return;
      }
  
      // Lookup userId from formDirectory
      const directoryRef = doc(db, 'formDirectory', formId);
      const directorySnap = await getDoc(directoryRef);
  
      if (!directorySnap.exists()) {
        setError('Form directory entry not found');
        return;
      }
  
      const userId = directorySnap.data().userId;
  
      // 🆕 Include both questionId, questionText and answer
      const enrichedResponses = form?.questions.map((question) => ({
        questionId: question.id,
        questionText: question.text,
        answer: responses[question.id] || '',
      })) || [];
  
      const responseData = {
        formId,
        responses: enrichedResponses,
        submittedAt: serverTimestamp(),
      };
  
      const responsesCollectionRef = collection(
        db,
        'users',
        userId,
        'forms',
        formId,
        'responses'
      );
  
      await addDoc(responsesCollectionRef, responseData);
      setSubmitted(true);
  
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError('Error submitting form: ' + errorMessage);
    }
  };
  

  const goBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2.5 w-3/4 mx-auto"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
        </div>
        <p className="text-gray-600">Loading form...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-red-500">Error</h2>
        <p className="text-gray-700">{error}</p>
        <button 
          onClick={goBack}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Thank you for your response!</h2>
        <p className="mb-6 text-gray-600">Your form has been submitted successfully.</p>
      </div>
    </div>
  );

  if (!form) return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Not Found</h2>
        <p className="text-gray-700">No form data available.</p>
        <button 
          onClick={goBack}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={goBack} 
            className="hover:bg-gray-200 p-2 rounded-full transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Complete Form</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
          <p className="text-gray-600 mb-6">{form.description}</p>
          
          <div className="flex justify-center mb-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/en/e/eb/PSG_College_of_Technology_logo.png"
              alt="College Logo"
              className="h-24 object-contain"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {form.questions &&
            form.questions.map((question: Question, index: number) => (
              <div key={question.id} className="bg-white rounded-lg shadow-md p-6 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-gray-800">Question {index + 1}</h3>
                  {question.required && <span className="text-red-500 text-sm">Required</span>}
                </div>

                <p className="text-lg mb-4">{question.text}</p>

                {question.type === 'text' ? (
                  <input
                    type="text"
                    value={responses[question.id] || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(question.id, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    placeholder="Your answer"
                    required={question.required}
                  />
                ) : question.type === 'multiple-choice' ? (
                  <div className="space-y-2">
                    {question.choices &&
                      question.choices.map((choice: string, optIndex: number) => (
                        <label key={optIndex} className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={choice}
                            checked={responses[question.id] === choice}
                            onChange={() => handleInputChange(question.id, choice)}
                            className="mr-3 h-4 w-4 text-blue-600"
                            required={question.required && optIndex === 0}
                          />
                          <span className="text-gray-800">{choice}</span>
                        </label>
                      ))}
                  </div>
                ) : null}
              </div>
            ))}

          <div className="flex justify-end mt-6 mb-8">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FillFormScreen;