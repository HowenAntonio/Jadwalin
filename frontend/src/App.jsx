import { BrowserRouter, Routes, Route } from "react-router-dom";

import CreateEvent from "./pages/CreateEvent";
import EventPage from "./pages/EventPage";
import SummaryPage from "./pages/SummaryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateEvent />} />
        <Route path="/event/:id" element={<EventPage />} />
        <Route path="/event/:id/summary" element={<SummaryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;