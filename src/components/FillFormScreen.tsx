import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // No need for auth import since it's public

interface Question {
  id: string;
  text: string;
  type: 'text' | 'multipleChoice';
  required: boolean;
  options?: string[];
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
  
      // Step 1: Lookup userId from formDirectory again
      const directoryRef = doc(db, 'formDirectory', formId);
      const directorySnap = await getDoc(directoryRef);
  
      if (!directorySnap.exists()) {
        setError('Form directory entry not found');
        return;
      }
  
      const userId = directorySnap.data().userId;
  
      const responseData = {
        formId,
        responses: Object.entries(responses).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
        submittedAt: serverTimestamp(),
      };
  
      // ✅ Now use the correct functional path
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
  

  if (loading) return <div className="container mx-auto p-4">Loading form...</div>;
  if (error) return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  if (submitted) return (
    <div className="container mx-auto p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Thank you for your response!</h2>
      <p className="mb-4">Your form has been submitted successfully.</p>
      <button
        onClick={() => navigate('/')}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Back to Home
      </button>
    </div>
  );

  if (!form) return <div className="container mx-auto p-4">No form data available.</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
        <p className="text-gray-600 mb-6">{form.description}</p>

        <form onSubmit={handleSubmit}>
          {form.questions &&
            form.questions.map((question: Question, index: number) => (
              <div key={question.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
                <p className="text-lg font-medium mb-2">
                  {index + 1}. {question.text}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </p>

                {question.type === 'text' ? (
                  <input
                    type="text"
                    value={responses[question.id] || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(question.id, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required={question.required}
                  />
                ) : question.type === 'multipleChoice' ? (
                  <div className="space-y-2">
                    {question.options &&
                      question.options.map((option: string, optIndex: number) => (
                        <label key={optIndex} className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={responses[question.id] === option}
                            onChange={() => handleInputChange(question.id, option)}
                            className="mr-2"
                            required={question.required && optIndex === 0}
                          />
                          {option}
                        </label>
                      ))}
                  </div>
                ) : null}
              </div>
            ))}

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
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
