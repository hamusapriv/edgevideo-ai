import { useEffect } from "react";
import { startScreen } from "../../legacy/screen";

export default function ScreenInitializer() {
  useEffect(() => {
    startScreen();
  }, []);
  return null;
}
