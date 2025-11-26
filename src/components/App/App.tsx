import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import TeachingCourseLayout from 'src/pages/TeachingCourse/TeachingCourseLayout';
import "./App.scss";

// Lazy-load variant components for code splitting
const TeachingCourseTemplate = lazy(() => import('src/pages/TeachingCourse/variants/template/TeachingCourseTemplate'));
const TeachingCourseEdit = lazy(() => import('src/pages/TeachingCourse/variants/edit/TeachingCourseEdit'));
const TeachingCourseRead = lazy(() => import('src/pages/TeachingCourse/variants/read/TeachingCourseRead'));

// Simple loading component
function PageSkeleton() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Loading...
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Switch>
        {/* Template Mode */}
        <Route path="/course/:id/template">
          <TeachingCourseLayout>
            <Suspense fallback={<PageSkeleton />}>
              <TeachingCourseTemplate />
            </Suspense>
          </TeachingCourseLayout>
        </Route>

        {/* Edit Mode */}
        <Route path="/course/:id/edit">
          <TeachingCourseLayout>
            <Suspense fallback={<PageSkeleton />}>
              <TeachingCourseEdit />
            </Suspense>
          </TeachingCourseLayout>
        </Route>

        {/* View/Read Mode */}
        <Route path="/course/:id/view">
          <TeachingCourseLayout>
            <Suspense fallback={<PageSkeleton />}>
              <TeachingCourseRead />
            </Suspense>
          </TeachingCourseLayout>
        </Route>

        {/* Default redirect - for development, redirects root to a demo course */}
        <Route exact path="/">
          <Redirect to="/course/demo/template" />
        </Route>

        {/* Redirect /course/:id to template mode by default */}
        <Route
          exact
          path="/course/:id"
          render={({ match }) => (
            <Redirect to={`/course/${match.params.id}/template`} />
          )}
        />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
