// ViewResponsesWrapper.tsx
import React from "react";
import { useParams } from "react-router-dom";
import ViewResponsesScreen from "./ViewResponsesScreen";

const ViewResponsesWrapper: React.FC = () => {
  const { userId, formId } = useParams<{ userId: string; formId: string }>();

  if (!userId || !formId) return <p>Invalid URL</p>;

  return <ViewResponsesScreen userId={userId} formId={formId} />;
};

export default ViewResponsesWrapper;
