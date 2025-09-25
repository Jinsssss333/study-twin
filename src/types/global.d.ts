declare global {
  interface Window {
    /**
     * Navigate to the auth page with a custom redirect URL
     * @param redirectUrl - URL to redirect to after successful authentication
     */
    navigateToAuth: (redirectUrl: string) => void;
  }
}

// Add minimal module declaration so TypeScript recognizes html2canvas used in StudentDashboard PDF export
declare module "html2canvas" {
  const html2canvas: (
    element: HTMLElement,
    options?: Record<string, any>
  ) => Promise<HTMLCanvasElement>;
  export default html2canvas;
}

export {};