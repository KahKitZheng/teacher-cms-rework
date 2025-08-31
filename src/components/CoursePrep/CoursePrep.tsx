import { File, GripVerticalIcon, Plus, X } from "lucide-react";
import styles from "./CoursePrep.module.scss";
import { useState } from "react";

const data = [
  {
    title: "Leerkrachtenmateriaal",
    files: [
      {
        title: "Themavoorbereiding",
        description:
          "Een gedetailleerde beschrijving van de themavoorbereiding.",
      },
      {
        title: "Materialenlijst",
        description: "Alles wat je nodig hebt voor dit thema.",
      },
    ],
  },
  {
    title: "Lesmateriaal",
    files: [
      {
        title: "Leerwerkschrift",
        description: "Alle bronnen en werkbladen voor dit thema.",
      },
      {
        title: "Antwoorden Leerwerkschrift",
        description: "Antwoorden van het leerwerkschrift",
      },
    ],
  },
  {
    title: "Extra lesmateriaal",
    files: [
      {
        title: "Belangrijke woorden",
        description:
          "Een lijst met belangrijke woorden die je op kunt hangen, of kunt printen.",
      },
      {
        title: "Boekenlijst",
        description: "Een lijst met boeken bij dit thema.",
      },
      {
        title: "Belangrijke woorden-tegel",
        description:
          "In deze tegel oefen je leerlingen woorden en uitdrukkingen uit dit thema.",
      },
      {
        title: "Meer lezen?-tegel",
        description:
          "In deze tegel zien je leerlingen boeken die passen bij dit thema.",
      },
      {
        title: "Verder oefenen-tegel",
        description:
          "In deze tegel oefen je de stof uit de taalbeschouwingstegel (5, 10, 15 en 20).",
      },
    ],
  },
  {
    title: "Differentiatiemateriaal",
    files: [
      {
        title: "Werkbladen extra begeleiding",
        description: "Werkblad extra begeleiding bij tegel 7 en 12.",
      },
      {
        title: "Werkbladen extra uitdaging",
        description: "Werkblad extra uitdaging bij tegel 7 en 12.",
      },
    ],
  },
];

export default function CoursePrep() {
  const [numberOfFileCategories, setNumberOfFileCategories] = useState(6);

  return (
    <div className={styles.coursePrep}>
      <p className={styles.title}>Themavoorbereiding</p>
      <div className={styles.coursePrepGrid}>
        <div className={styles.header}>
          <div className={styles.stepsList}>
            <div className={styles.step}>
              <GripVerticalIcon size={14} cursor="grab" />
              <span>Introductie</span>
            </div>
            <div className={styles.step}>
              <GripVerticalIcon size={14} cursor="grab" />
              <span>Lesstof</span>
            </div>
            <div className={styles.step}>
              <GripVerticalIcon size={14} cursor="grab" />
              <span>Afsluiting</span>
            </div>
            <div className={styles.step}>
              <GripVerticalIcon size={14} cursor="grab" />
              <span>Afsluiting</span>
            </div>
          </div>
        </div>
        <hr className={styles.separator} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "subgrid",
            gridColumn: "1 / -1",
          }}
        >
          <div className={styles.fileOverview}>
            {data.map((fileCategory, i) => (
              <CoursePrepFileCategory
                title={fileCategory.title}
                key={i}
                fileCategory={fileCategory}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoursePrepFileCategory({
  title,
  fileCategory,
}: {
  title: string;
  fileCategory: {
    title: string;
    files: { title: string; description: string }[];
  };
}) {
  return (
    <div className={styles.coursePrepFileCategory}>
      <div className={styles.categoryHeader}>
        <GripVerticalIcon size={14} cursor="grab" />
        <p className={styles.categoryTitle}>{title}</p>
      </div>
      <div className={styles.files}>
        {fileCategory.files.map((file, i) => (
          <CoursePrepFileItem file={file} key={i} />
        ))}
      </div>
      <button
        style={{
          margin: "0 -4px",
          padding: "4px",
          textAlign: "left",
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
          gap: "var(--course-prep-gap)",
          opacity: 0.5,
          color: "var(--primary-color)",
        }}
      >
        <Plus size={14} />
        <span>Item toevoegen</span>
      </button>
    </div>
  );
}

function CoursePrepFileItem({
  file,
}: {
  file: { title: string; description: string };
}) {
  return (
    <div className={styles.coursePrepFileItem}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <File fill="currentColor" stroke="var(--prim-text)" size={14} />
        <div className={styles.fileHeader}>
          <GripVerticalIcon size={14} cursor="grab" />
          <X />
        </div>
      </div>
      <p className={styles.fileName}>{file.title}</p>
      <p className={styles.fileDescription}>{file.description}</p>
    </div>
  );
}
