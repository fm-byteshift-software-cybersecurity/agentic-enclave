import { Route, Routes } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import ScenarioBola from "@/pages/ScenarioBola";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      <Route path="/lab/sec-01" element={<ScenarioBola />} />     

      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
