import { useState, useEffect, useCallback } from 'react';
import { THEME_KEY, PANEL_KEY } from './constants';

export const useTheme = () => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_KEY, newTheme);
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  return { theme, toggleTheme };
};

export const usePropertiesPanel = () => {
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [isPropertiesFloating, setIsPropertiesFloating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const floating = window.innerWidth < 1280;
      setIsPropertiesFloating(floating);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialPanelState = window.localStorage.getItem(PANEL_KEY);
    if (initialPanelState === "false") {
      setIsPropertiesOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isPropertiesFloating) {
      setIsPropertiesOpen(false);
    } else {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(PANEL_KEY);
        setIsPropertiesOpen(stored !== "false");
      }
    }
  }, [isPropertiesFloating]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PANEL_KEY, String(isPropertiesOpen));
  }, [isPropertiesOpen, isPropertiesFloating]);

  const togglePropertiesPanel = useCallback(() => {
    setIsPropertiesOpen(prev => !prev);
  }, []);

  return {
    isPropertiesOpen,
    isPropertiesFloating,
    togglePropertiesPanel,
    setIsPropertiesOpen
  };
};

export const useDragAndDrop = () => {
  const [dragContext, setDragContext] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeDropIndex, setActiveDropIndex] = useState(null);
  const [dragOverSectionId, setDragOverSectionId] = useState(null);

  const resetDragState = useCallback(() => {
    setDragContext(null);
    setIsDraggingOver(false);
    setActiveDropIndex(null);
    setDragOverSectionId(null);
  }, []);

  return {
    dragContext,
    setDragContext,
    isDraggingOver,
    setIsDraggingOver,
    activeDropIndex,
    setActiveDropIndex,
    dragOverSectionId,
    setDragOverSectionId,
    resetDragState
  };
};

export const useTextEditor = () => {
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [isTextToolbarVisible, setIsTextToolbarVisible] = useState(false);
  const [textToolbarPosition, setTextToolbarPosition] = useState({ top: 0, left: 0 });
  const [currentTextStyles, setCurrentTextStyles] = useState({});

  return {
    editingBlockId,
    setEditingBlockId,
    isTextToolbarVisible,
    setIsTextToolbarVisible,
    textToolbarPosition,
    setTextToolbarPosition,
    currentTextStyles,
    setCurrentTextStyles
  };
};