import { useStore } from "./store";
import { Dashboard } from "./components/Dashboard";
import { LoginPage } from "./components/LoginPage";

function App() {
  const currentUser = useStore(state => state.currentUser);

  if (!currentUser) {
    return <LoginPage />;
  }

  return <Dashboard />;
}

export default App
