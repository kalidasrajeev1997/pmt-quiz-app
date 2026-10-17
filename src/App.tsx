import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { SelectionProvider } from "@/providers/SelectionProvider";
import { router } from "./routes/router";

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SelectionProvider>
        <RouterProvider router={router} />
      </SelectionProvider>
    </QueryClientProvider>
  );
}

export default App;
