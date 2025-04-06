import React, { useEffect, useState } from "react";
import { collection, getDocs, DocumentData } from "firebase/firestore";
import { db } from "../firebaseConfig";

interface ViewResponsesScreenProps {
  userId: string;
  formId: string;
}

interface AnswerEntry {
  questionId: string;
  answer: string;
}

interface ResponseData {
  id: string;
  answers: AnswerEntry[];
  timestamp: Date;
}

const ViewResponsesScreen: React.FC<ViewResponsesScreenProps> = ({ userId, formId }) => {
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [questionMap, setQuestionMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // Fetch all questions to map questionId => questionText
  const fetchQuestions = async () => {
    const questionsRef = collection(db, "users", userId, "forms", formId, "questions");
    const snapshot = await getDocs(questionsRef);
    const map: { [key: string]: string } = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      map[doc.id] = data.question || `Question ${doc.id}`;
    });

    setQuestionMap(map);
  };

  // Fetch all responses
  const fetchResponses = async () => {
    const responsesRef = collection(db, "users", userId, "forms", formId, "responses");
    const snapshot = await getDocs(responsesRef);
    const fetched: ResponseData[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      fetched.push({
        id: doc.id,
        answers: Array.isArray(data.responses) ? data.responses : [],
        timestamp: data.submittedAt?.toDate() || new Date(),
      });
    });

    setResponses(fetched);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        await Promise.all([fetchQuestions(), fetchResponses()]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId && formId) {
      fetchAll();
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
            Submitted on: {response.timestamp.toLocaleDateString()}{" "}
            {response.timestamp.toLocaleTimeString()}
          </p>
          <ul>
            {response.answers.map(({ questionId, answer }) => (
              <li key={questionId} style={styles.answer}>
                <strong>{questionMap[questionId] || questionId}:</strong> {answer}
              </li>
            ))}
          </ul>
        </div>
      ))}
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
