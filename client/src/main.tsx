import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "./components/Layout"
import { HomePage } from "./pages/HomePage"
import { SectionPage } from "./pages/SectionPage"
import { ArticlePage } from "./pages/ArticlePage"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, gcTime: 120_000, retry: 2, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path=":section" element={<SectionPage />} />
            <Route path="article/:id" element={<ArticlePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
