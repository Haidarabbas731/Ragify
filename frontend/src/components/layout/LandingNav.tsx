import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDarkMode } from "../../hooks/useDarkMode";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/button";

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { darkMode } = useDarkMode();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: "Features", id: "features" },
    { label: "How It Works", id: "how-it-works" },
    { label: "FAQ", id: "faq" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#fffeff] dark:bg-[#0d0b14] border-b border-[rgba(1,50,252,0.10)] dark:border-[rgba(119,52,231,0.15)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo — icon only, no wordmark */}
          <Link to="/" className="flex items-center">
            <img src="/images/ragify.png" alt="Ragify" className="w-10 h-10" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className={`text-sm font-semibold transition-colors duration-150 ${
                  isScrolled || darkMode
                    ? "text-[#12375c] dark:text-white hover:text-[#7734e7] dark:hover:text-[#cd79f5]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button
                  size="sm"
                  className="bg-[#7734e7] hover:bg-[#6620d4] text-white rounded-2xl px-5 font-semibold transition-colors duration-150"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-semibold transition-colors duration-150 ${
                    isScrolled || darkMode
                      ? "text-[#7f7f7f] hover:text-[#12375c] dark:hover:text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Log in
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="bg-[#7734e7] hover:bg-[#6620d4] text-white rounded-2xl px-5 font-semibold transition-colors duration-150"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled || darkMode
                ? "text-[#12375c] dark:text-white hover:bg-[rgba(1,50,252,0.06)]"
                : "text-white hover:bg-white/10"
            }`}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 rounded-2xl bg-[#fffeff] dark:bg-[#160f2a] border border-[rgba(1,50,252,0.10)] dark:border-[rgba(119,52,231,0.15)]">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#12375c] dark:text-white hover:bg-[rgba(119,52,231,0.06)] transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="border-t border-[rgba(1,50,252,0.10)] dark:border-[rgba(119,52,231,0.15)] my-2" />
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-[#7734e7] hover:bg-[#6620d4] text-white rounded-2xl font-semibold">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2.5 text-sm font-semibold text-[#7f7f7f] hover:text-[#12375c] dark:hover:text-white transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button className="w-full bg-[#7734e7] hover:bg-[#6620d4] text-white rounded-2xl font-semibold">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
