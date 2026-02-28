

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import StudentDashboard from './pages/student/StudentDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
