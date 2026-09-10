import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import {
  AdminRoute,
  AuthenticatedUser,
  ProtectedRoute,
} from "./components/ProtectedRoute";
import HeroSection from "./pages/HeroSection";
import Courses from "./pages/Courses";
import Profile from "./pages/Profile";
import MyLearning from "./pages/MyLearning";
import SearchPage from "./pages/SearchPage";
import CourseProgress from "./pages/CourseProgress";
import CourseDetails from "./pages/CourseDetails";
import Sidebar from "./admin/Sidebar";
import Dashboard from "./admin/Dashboard";
import CourseTable from "./admin/course/CourseTable";
import CreateCourse from "./admin/course/CreateCourse";
import EditCourse from "./admin/course/EditCourse";
import Login from "./pages/Login";
import CreateLecture from "./admin/lecture/CreateLecture";
import EditLecture from "./admin/lecture/EditLecture";
import PurchaseCourseProtectedRoute from "./components/PurchaseCourseProtectedRoute";
import { ThemeProvider } from "./components/ThemeProvider";

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <>
            <HeroSection />
            <Courses />
          </>
        ),
      },
      {
        path: "login",
        element: (
          <AuthenticatedUser>
            <Login />
          </AuthenticatedUser>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "learning",
        element: (
          <ProtectedRoute>
            <MyLearning />
          </ProtectedRoute>
        ),
      },
      {
        path: "course/search",
        element: (
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "course-progress/:courseId",
        element: (
          <ProtectedRoute>
            <PurchaseCourseProtectedRoute>
              <CourseProgress />
            </PurchaseCourseProtectedRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: "course-details/:courseId",
        element: (
            <CourseDetails />
          
        ),
      },
      {
        path: "admin",
        element: (
          <AdminRoute>
            <Sidebar />
          </AdminRoute>
        ),
        children: [
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "course",
            element: <CourseTable />,
          },
          {
            path: "course/create",
            element: <CreateCourse />,
          },
          {
            path: "course/:id",
            element: <EditCourse />,
          },
          {
            path: "course/:id/lecture",
            element: <CreateLecture />,
          },
          {
            path: "course/:id/lecture/:lectureId",
            element: <EditLecture />,
          },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <main>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <RouterProvider router={appRouter} />
      </ThemeProvider>
    </main>
  );
}

export default App;
