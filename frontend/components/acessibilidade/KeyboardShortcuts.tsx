"use client";
import { useEffect } from "react";

export default function KeyboardShortcuts() {
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const active = document.activeElement;

            const isTyping =
                active instanceof HTMLInputElement ||
                active instanceof HTMLTextAreaElement ||
                active instanceof HTMLSelectElement ||
                active?.getAttribute("contenteditable") === "true";

            if (isTyping) return;

            if (e.altKey) {
                switch (e.key) {
                    case "1":
                    case "Numpad1":
                        e.preventDefault();
                        document.getElementById("main-content")?.focus();
                        break;

                    case "2":
                    case "Numpad2":
                        e.preventDefault();
                        document.getElementById("main-nav")?.focus();
                        break;

                    case "3":
                    case "Numpad3":
                        e.preventDefault();
                        document.getElementById("search-input")?.focus();
                        break;
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return null;
}