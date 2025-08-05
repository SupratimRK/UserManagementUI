import { UserManagementPortal } from "@/components/UserManagement/UserManagementPortal";
import { ModeToggle } from "@/components/mode-toggle";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <UserManagementPortal />
    </div>
  );
}

export default App;
