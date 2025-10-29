import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Statistics from "./pages/Statistics";
import FeasibilityAnalysis from "./pages/FeasibilityAnalysis";
import ImportMunicipalities from "./pages/ImportMunicipalities";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/feasibility" element={<FeasibilityAnalysis />} />
        <Route path="/import-municipalities" element={<ImportMunicipalities />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
