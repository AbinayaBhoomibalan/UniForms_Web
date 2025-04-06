import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import FormList from './components/FormList';
import FormScreen from './components/FormScreen';
import FillFormScreen from './components/FillFormScreen';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forms" element={<FormList />} />
        <Route path="/form/:formId" element={<FormScreen />} />
        <Route path="/fill/:formId" element={<FillFormScreen />} />
      </Routes>
    </Router>
  );
};

export default App;
