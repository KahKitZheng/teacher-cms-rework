import CoursePrep from "../CoursePrep/CoursePrep";

export default function ContentDeveloper() {
  return (
    <div
      style={{
        maxWidth: "1440px",
        display: "grid",
        gridTemplateColumns: "230px minmax(636px,908px) 320px",
        gap: "16px",
      }}
    >
      <aside
        style={{
          backgroundColor: "white",
          padding: "16px",
          height: "fit-content",
          borderRadius: "6px",
        }}
      >
        <h2>Table of contents</h2>
        <p>Some content for the table of contents</p>
      </aside>
      <CoursePrep />
      <aside
        style={{
          backgroundColor: "white",
          padding: "16px",
          height: "fit-content",
          borderRadius: "6px",
        }}
      >
        <h2>Teacher sidebar</h2>
        <p>Some content for the teacher sidebar</p>
      </aside>
    </div>
  );
}
