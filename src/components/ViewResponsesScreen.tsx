import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

interface ViewResponsesScreenProps {
  userId: string;
  formId: string;
}

interface AnswerEntry {
  questionId: string;
  questionText: string;
  answer: string;
}

interface ResponseData {
  id: string;
  answers: AnswerEntry[];
  timestamp: Date;
}

interface QuestionData {
  [questionId: string]: string; // questionId: questionText
}

const ViewResponsesScreen: React.FC<ViewResponsesScreenProps> = ({ userId, formId }) => {
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionData>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResponsesAndQuestions = async () => {
      try {
        // Fetch responses
        const responsesRef = collection(db, "users", userId, "forms", formId, "responses");
        const snapshot = await getDocs(responsesRef);
        const fetchedResponses: ResponseData[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const responseObj: ResponseData = {
            id: doc.id,
            answers: Array.isArray(data.responses) ? data.responses : [],
            timestamp: data.submittedAt?.toDate() || new Date(),
          };
          fetchedResponses.push(responseObj);
        });

        setResponses(fetchedResponses);

        // Fetch questions from the form document
        const formDocRef = doc(db, "users", userId, "forms", formId);
        const formDocSnapshot = await getDoc(formDocRef);

        if (formDocSnapshot.exists()) {
          const formData = formDocSnapshot.data();
          if (formData && formData.questions) {
            const questionMap: QuestionData = {};
            formData.questions.forEach((question: { id: string; question: string }) => {
              questionMap[question.id] = question.question;
            });
            setQuestions(questionMap);
          }
        }
      } catch (error) {
        console.error("Error fetching responses and questions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId && formId) {
      fetchResponsesAndQuestions();
    }
  }, [userId, formId]);

  if (loading) return <p>Loading responses...</p>;

  return (
    <div style={styles.container}>
      <h2>Responses for Form ID: {formId}</h2>
      <p>{responses.length} response(s) found.</p>

      {responses.length === 0 && <p>No responses yet.</p>}

      {responses.map((response) => (
        <div key={response.id} style={styles.card}>
          <p style={styles.timestamp}>
            Submitted on: {response.timestamp.toLocaleDateString()} {response.timestamp.toLocaleTimeString()}
          </p>
          <ul>
            {response.answers.map(({ questionId, questionText, answer }) => (
              <li key={questionId} style={styles.answer}>
                <strong>{questionText}:</strong> {answer}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Go Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#333",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Go Back
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "20px",
    backgroundColor: "#f9f9f9",
  },
  timestamp: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "10px",
  },
  answer: {
    marginBottom: "6px",
  },
} as const;

export default ViewResponsesScreen;
