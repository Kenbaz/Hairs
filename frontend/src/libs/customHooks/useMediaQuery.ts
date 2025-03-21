import { useState, useEffect } from "react";

/**
 * Custom hook to detect if a media query matches
 * @param query The media query to check
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false for server-side rendering
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create a media query list
    const mediaQuery = window.matchMedia(query);

    // Initial check
    setMatches(mediaQuery.matches);

    // Define the listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the listener
    mediaQuery.addEventListener("change", handleChange);

    // Clean up
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
