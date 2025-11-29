import { Database, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDarkMode } from "../../hooks/useDarkMode";
import { Button } from "../ui/button";

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group hover:scale-105 transition-transform"
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all">
              <Database className="w-6 h-6 text-white" />
            </div>
            <span
              className="text-xl font-bold text-white hidden sm:block"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              AI Knowledge Base
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="text-slate-300 hover:text-cyan-400 transition-colors font-medium"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="text-slate-300 hover:text-cyan-400 transition-colors font-medium"
            >
              How It Works
            </button>

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-slate-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-400" />
              )}
            </button>

            <Link to="/login">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Login
              </Button>
            </Link>

            <Link to="/register">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 p-4 rounded-xl bg-slate-800/90 backdrop-blur-xl border border-slate-700/50">
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => scrollToSection("features")}
                className="text-left text-slate-300 hover:text-cyan-400 transition-colors font-medium py-2"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("how-it-works")}
                className="text-left text-slate-300 hover:text-cyan-400 transition-colors font-medium py-2"
              >
                How It Works
              </button>

              <div className="border-t border-slate-700 my-2" />

              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  Login
                </Button>
              </Link>

              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
