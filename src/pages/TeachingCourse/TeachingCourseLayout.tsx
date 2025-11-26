import { useParams, useLocation, Link } from 'react-router-dom';
import './TeachingCourseLayout.scss';

type Props = {
  children: React.ReactNode;
};

export default function TeachingCourseLayout({ children }: Props) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Determine current mode from URL
  const currentMode = location.pathname.includes('template')
    ? 'template'
    : location.pathname.includes('edit')
    ? 'edit'
    : 'view';

  return (
    <div className="teaching-course-layout">
      {/* Mode tabs navigation */}
      <nav className="mode-tabs">
        <Link
          to={`/course/${id}/template`}
          className={`mode-tab ${currentMode === 'template' ? 'active' : ''}`}
        >
          📐 Template
        </Link>

        <Link
          to={`/course/${id}/edit`}
          className={`mode-tab ${currentMode === 'edit' ? 'active' : ''}`}
        >
          ✏️ Edit
        </Link>

        <Link
          to={`/course/${id}/view`}
          className={`mode-tab ${currentMode === 'view' ? 'active' : ''}`}
        >
          👁️ Preview
        </Link>
      </nav>

      {/* Render mode-specific content */}
      <main className="course-content">
        {children}
      </main>
    </div>
  );
}
