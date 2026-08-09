import { Navigate, Route, Routes } from "react-router-dom";
import { DocsLayout } from "./components/DocsLayout";
import { CommandPage } from "./pages/CommandPage";
import { CommandsIndex } from "./pages/CommandsIndex";
import { DocsHome } from "./pages/DocsHome";
import { FirstProject } from "./pages/FirstProject";
import { Glossary } from "./pages/Glossary";
import { HowItWorks } from "./pages/HowItWorks";
import { Install } from "./pages/Install";
import { Landing } from "./pages/Landing";
import { ProjectAnatomy } from "./pages/ProjectAnatomy";
import { Usecases } from "./pages/Usecases";
import { WhatIsRoot } from "./pages/WhatIsRoot";
import { WhyUseIt } from "./pages/WhyUseIt";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/docs" element={<DocsLayout />}>
        <Route index element={<DocsHome />} />
        <Route path="what-is-root" element={<WhatIsRoot />} />
        <Route path="why-use-it" element={<WhyUseIt />} />
        <Route path="install" element={<Install />} />
        <Route path="first-project" element={<FirstProject />} />
        <Route path="commands" element={<CommandsIndex />} />
        <Route path="commands/:slug" element={<CommandPage />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="project-anatomy" element={<ProjectAnatomy />} />
        <Route path="usecases" element={<Usecases />} />
        <Route path="glossary" element={<Glossary />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
