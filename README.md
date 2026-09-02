<div align="center">

# 🎧 PDF Text-to-Speech Reader
### The Privacy-First, Zero-Cost PDF Reader

**Transform any document into natural, human-like speech. Runs 100% locally in your browser.**
**No uploads. No sign-ups. No data collection. Just code.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Made with React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4.svg?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[Live Demo](#) · [Report Bug](https://github.com/analystsandeep/pdf-text-to-speech-reader/issues) · [Request Feature](https://github.com/analystsandeep/pdf-text-to-speech-reader/issues)

</div>

---

## 💡 Why This Exists

Most "free" PDF readers are data traps. They require account creation, upload your private documents to cloud servers, or lock essential accessibility features behind paywalls.

**PDF TTS Reader** is different. It is an **offline-first, privacy-guaranteed application** built for students, researchers, and developers who need to digest complex documents efficiently without compromising their data.

### Core Value Proposition

| Feature | PDF TTS Reader | Standard PDF Readers |
| :--- | :---: | :---: |
| **Privacy** | 🔒 **100% Local Processing** | ☁️ Cloud Uploads (Risk) |
| **Cost** | 💸 **Free Forever (Open Source)** | 💰 Subscriptions / Paid |
| **Accessibility** | 🧠 **Dyslexia-Friendly / Focus Mode** | ❌ Basic Zoom Only |
| **Voices** | 🗣️ **50+ System Voices (Uncapped)** | ⚠️ Limited / Premium Only |
| **Tracking** | 🛡️ **Zero Analytics / Cookies** | 📈 User Tracking |

---

## ✨ Key Features

### 🎧 Immersive Audio Experience
*   **Smart Text-to-Speech (TTS)**: Utilizes the Web Speech API to access all native OS voices (Google, Microsoft, Apple) without API keys.
*   **Real-Time Synchronization**: Highlights words exactly as they are spoken, aiding comprehension and retention.
*   **Variable Speed Playback**: Adjustable granular speed control from **0.5x (Study Mode)** to **3.0x (Skim Mode)**.
*   **Sentence Mode**: Toggle between word-level highlighting for precision or sentence-level for flow.

### 👁️ Visual Intelligence & Focus
*   **Spotlight Cursor**: A premium, "Onlook-style" glow effect that tracks your mouse, reducing eye strain and improving reading focus.
*   **Focus Mode**: Instantly blurs the surrounding UI, dimming distractions so you can focus solely on the text.
*   **Smart Theming**: seamless toggle between **Light**, **Dark** (OLED optimized), and **Sepia** (Paper-like) modes to suit any lighting condition.

### ⚡ Performance & Engineering
*   **Custom Virtualization**: Why load 500 pages when you only read one? A custom virtualization engine renders only visible pages, ensuring 60FPS scrolling even on large textbooks.
*   **Responsive Design**: A unified UI that adapts from desktop monitors to mobile screens, featuring a touch-friendly drawer and controls.
*   **Anchor Scrolling**: Intelligent scroll position maintenance during zoom operations—no more losing your place when resizing.

---

## 🛠️ Technical Stack

Built with the bleeding edge of modern web development:

*   **Runtime**: [React 19](https://react.dev) (Leveraging new hooks and concurrent features)
*   **Build Tool**: [Vite 6](https://vitejs.dev) (Instant HMR and optimized production builds)
*   **Language**: [TypeScript 5](https://www.typescriptlang.org) (Strict type safety for reliability)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com) (Utility-first, zero-runtime CSS)
*   **PDF Core**: [PDF.js](https://mozilla.github.io/pdf.js/) (Standard-compliant PDF parsing)
*   **Icons**: [Lucide React](https://lucide.dev) (Clean, consistent iconography)

---

## 🚀 Quick Start

Get up and running in less than 2 minutes.

### Prerequisites

*   **Node.js**: v18 or higher recommended.
*   **Browser**: Chrome, Edge, Safari, or Firefox (Chromium browsers recommended for best voice variety).

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/analystsandeep/pdf-text-to-speech-reader.git
    cd pdf-text-to-speech-reader
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    pnpm install
    # or
    yarn install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  Open `http://localhost:5173` to view the app.

---

## 🎮 Usage Guide

### Keyboard Shortcuts
Power users can navigate without touching the mouse:

| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause reading |
| <kbd>Esc</kbd> | Stop reading / Close active modal |
| <kbd>/</kbd> | Search / Open help |
| <kbd>?</kbd> | Toggle Keyboard Shortcuts list |
| <kbd>Ctrl</kbd> + <kbd>+</kbd> | Zoom In |
| <kbd>Ctrl</kbd> + <kbd>-</kbd> | Zoom Out |
| <kbd>Ctrl</kbd> + <kbd>0</kbd> | Reset Zoom to Fit Width |

### Gestures & Mouse
*   **Click Word**: Start reading from that specific word.
*   **Double Click**: Pause playback.
*   **Right Click Word**: Define word (Dictionary lookup).
*   **Scroll Wheel**: Navigate document.
*   **Ctrl + Scroll**: Zoom in/out.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

**Developed for the Open Source Community**
[Analyst Sandeep](https://github.com/analystsandeep)

</div>
