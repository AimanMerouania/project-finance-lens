import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LazyWrapper } from "@/components/common/LazyWrapper";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Expenses from "./pages/Expenses";
import Import from "./pages/Import";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Optimized QueryClient configuration for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors or client errors
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  },
});

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="netmar-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <div className="min-h-screen flex w-full">
                        <AppSidebar />
                        <div className="flex-1 flex flex-col">
                          <Header />
                          <main className="flex-1 p-6 overflow-auto animate-fade-in">
                            <Routes>
                              <Route path="/" element={<LazyWrapper><Dashboard /></LazyWrapper>} />
                              <Route path="/projects" element={<LazyWrapper><Projects /></LazyWrapper>} />
                              <Route path="/expenses" element={<LazyWrapper><Expenses /></LazyWrapper>} />
                              <Route path="/import" element={<LazyWrapper><Import /></LazyWrapper>} />
                              <Route path="*" element={<LazyWrapper><NotFound /></LazyWrapper>} />
                            </Routes>
                          </main>
                        </div>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;