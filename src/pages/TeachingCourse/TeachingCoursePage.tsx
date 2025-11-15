import { useState } from "react";
import TeachingCourseTemplate from "./variants/template/TeachingCourseTemplate";
import TeachingCourseEdit from "./variants/edit/TeachingCourseEdit";
import TeachingCourseRead from "./variants/read/TeachingCourseRead";

type indexProps = {};

type TeachingCourseMode = "template" | "edit" | "read";

export default function TeachingCoursePage(props: Readonly<indexProps>) {
  const [teachingCourseMode, setTeachingCourseMode] =
    useState<TeachingCourseMode>("template");

  return (
    <div
      style={{
        maxWidth: "1440px",
        width: "100%",
        minHeight: "400px",
        minWidth: "700px",
        backgroundColor: "white",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Add context providers here */}
      {teachingCourseMode === "template" && <TeachingCourseTemplate />}
      {teachingCourseMode === "edit" && <TeachingCourseEdit />}
      {teachingCourseMode === "read" && <TeachingCourseRead />}
    </div>
  );
}
