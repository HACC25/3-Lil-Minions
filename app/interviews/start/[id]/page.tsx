import InterviewStartSession from "./InterviewStartClient";
import { Suspense } from "react";
import EligibilityChecker from "./EligibilityChecker";

export default function InterviewStart() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <div>Loading interview...</div>
        </div>
      }
    >
      <EligibilityChecker>
        <InterviewStartSession />
      </EligibilityChecker>
    </Suspense>
  );
}
