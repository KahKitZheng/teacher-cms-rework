import { File, GripVerticalIcon, Plus } from "lucide-react";
import styles from "./CoursePrep.module.scss";
import { useState } from "react";

export default function CoursePrep() {
  const [numberOfFileCategories, setNumberOfFileCategories] = useState(4);

  return (
    <div className={styles.CoursePrep}>
      <div className={styles.header}>
        <p className={styles.title}>Themavoorbereiding</p>
        <div className={styles.stepsContainer}>
          <div
            className={styles.stepsList}
            style={{
              gridTemplateColumns: `repeat(${numberOfFileCategories}, 1fr)`,
            }}
          >
            <div className={styles.step}>
              <GripVerticalIcon size={14} />
              <span>Introductie</span>
            </div>
            <div className={styles.step}>
              <GripVerticalIcon size={14} />
              <span>Lesstof</span>
            </div>
            <div className={styles.step}>
              <GripVerticalIcon size={14} />
              <span>Afsluiting</span>
            </div>
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              height: "fit-content",
              padding: "8px",
              margin: "0 8px",
              backgroundColor: "transparent",
              border: "1px dashed #ccc",
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <hr className={styles.separator} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          padding: "8px",
          gap: "16px",
          flex: 1,
        }}
      >
        <div
          className={styles.fileOverview}
          style={{
            gridTemplateColumns: `repeat(${numberOfFileCategories}, 1fr)`,
          }}
        >
          <CoursePrepFileCategory title="Leerkrachtenmateriaal" />
          <CoursePrepFileCategory title="Lesmateriaal" />
          <CoursePrepFileCategory title="Extra lesmateriaal" />
          <CoursePrepFileCategory title="Differentiatiemateriaal" />
        </div>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            height: "fit-content",
            padding: "8px",
            margin: "0 8px",
            backgroundColor: "transparent",
            border: "1px dashed #ccc",
            cursor: "pointer",
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function CoursePrepFileCategory({ title }: { title: string }) {
  return (
    <div className={styles.coursePrepFileCategory}>
      <div className={styles.categoryHeader}>
        <GripVerticalIcon size={14} />
        <p className={styles.categoryTitle}>{title}</p>
      </div>
      <div className={styles.files}>
        <CoursePrepFileItem />
      </div>
      <button
        style={{
          //   margin: "0 -8px",
          padding: "4px",
          textAlign: "left",
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Plus size={14} />
        <span>Item toevoegen</span>
      </button>
    </div>
  );
}

function CoursePrepFileItem() {
  return (
    <div className={styles.coursePrepFileItem}>
      <GripVerticalIcon size={14} />
      <div>
        <div className={styles.fileInfo}>
          <File size={14} />
          <p className={styles.fileName}>File name</p>
        </div>
        <p>Een gedetailleerde beschrijving van de tegels.</p>
      </div>
    </div>
  );
}
