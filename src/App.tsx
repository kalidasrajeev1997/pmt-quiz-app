import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { SelectionProvider } from "@/providers/SelectionProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { router } from "./routes/router";

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SelectionProvider>
          <RouterProvider router={router} />
        </SelectionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
