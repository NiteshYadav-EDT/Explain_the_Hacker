import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PlatformLayout from '@/components/PlatformLayout';
import ExplainTheHacker from '@/tools/ExplainTheHacker/ExplainTheHacker';

// ─── App — Explain The Hacker is the entire app ───────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="*"
          element={
            <PlatformLayout>
              <ExplainTheHacker />
            </PlatformLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
