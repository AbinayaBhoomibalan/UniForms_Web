import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const responsesRef = collection(db, "users", userId, "forms", formId, "responses");
        const snapshot = await getDocs(responsesRef);
        const fetched: ResponseData[] = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          fetched.push({
            id: doc.id,
            answers: data.responses || [], // 👈 match your Firestore array field
            timestamp: data.timestamp?.toDate() || new Date(),
          });
        });

        setResponses(fetched);
      } catch (error) {
        console.error("Error fetching responses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
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
                <strong>{questionId}:</strong> {answer}
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
