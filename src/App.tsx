import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ComparisonPage } from './pages/ComparisonPage';
import { DashboardPage } from './pages/DashboardPage';
import { DueDiligencePage } from './pages/DueDiligencePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { FinancingPage } from './pages/FinancingPage';
import { HomePage } from './pages/HomePage';
import { IncomePage } from './pages/IncomePage';
import { PropertyPage } from './pages/PropertyPage';
import { RefinancePage } from './pages/RefinancePage';
import { RenovationPage } from './pages/RenovationPage';
import { RentRollPage } from './pages/RentRollPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { SavedDealsPage } from './pages/SavedDealsPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { SettingsPage } from './pages/SettingsPage';
import { ValuationPage } from './pages/ValuationPage';
import { LearnPage } from './pages/LearnPage';
import { StressPage } from './pages/StressPage';
import { CompsPage } from './pages/CompsPage';
import { RisksPage } from './pages/RisksPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { HistoryPage } from './pages/HistoryPage';
import { GuideLayout } from './pages/guide/GuideLayout';
import { StepProperty } from './pages/guide/StepProperty';
import { StepRecords } from './pages/guide/StepRecords';
import { StepIncome } from './pages/guide/StepIncome';
import { StepExpenses } from './pages/guide/StepExpenses';
import { StepFinancing } from './pages/guide/StepFinancing';
import { StepAnalysis } from './pages/guide/StepAnalysis';
import { StepDiligence } from './pages/guide/StepDiligence';
import { StepReport } from './pages/guide/StepReport';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/deals" element={<SavedDealsPage />} />
        <Route path="/guide" element={<GuideLayout />}>
          <Route index element={<Navigate to="property" replace />} />
          <Route path="property" element={<StepProperty />} />
          <Route path="records" element={<StepRecords />} />
          <Route path="income" element={<StepIncome />} />
          <Route path="expenses" element={<StepExpenses />} />
          <Route path="financing" element={<StepFinancing />} />
          <Route path="analysis" element={<StepAnalysis />} />
          <Route path="diligence" element={<StepDiligence />} />
          <Route path="report" element={<StepReport />} />
        </Route>
        <Route path="/desk" element={<DashboardPage />} />
        <Route path="/property" element={<PropertyPage />} />
        <Route path="/rent-roll" element={<RentRollPage />} />
        <Route path="/income" element={<IncomePage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/financing" element={<FinancingPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/valuation" element={<ValuationPage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/renovation" element={<RenovationPage />} />
        <Route path="/refinance" element={<RefinancePage />} />
        <Route path="/due-diligence" element={<DueDiligencePage />} />
        <Route path="/comparison" element={<ComparisonPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/stress" element={<StressPage />} />
        <Route path="/comps" element={<CompsPage />} />
        <Route path="/risks" element={<RisksPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
